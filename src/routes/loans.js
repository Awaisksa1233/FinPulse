import { Hono } from 'hono';
import { db } from '../db.js';
import { getSession, getFlash, setFlash } from '../auth.js';
import { loansPage } from '../templates/loans.js';

export const loansRouter = new Hono();

async function requireUser(c) {
  const session = await getSession(c);
  if (!session) return { redirect: '/login' };
  const user = await db(c.env.DB).getUserById(session.userId);
  if (!user) return { redirect: '/login' };
  return { session, user };
}

loansRouter.get('/loans', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const d = db(c.env.DB);
  const loans = await d.getLoanAccounts(user.id);

  // Load entries for all loans in parallel
  const entriesMap = {};
  await Promise.all(loans.map(async loan => {
    entriesMap[loan.id] = await d.getLoanEntries(loan.id);
  }));

  const flash = await getFlash(c.env.SESSIONS, session.token);
  return c.html(loansPage({ user, loans, entriesMap, flash }));
});

loansRouter.post('/loan', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const form = await c.req.formData();
  const person_name = form.get('person_name')?.toString().trim() || '';
  const description = form.get('description')?.toString().trim() || '';

  if (!person_name) {
    await setFlash(c.env.SESSIONS, session.token, 'error', 'Person name required.');
    return c.redirect('/loans');
  }

  await db(c.env.DB).createLoanAccount({ user_id: user.id, person_name, description });
  await setFlash(c.env.SESSIONS, session.token, 'success', `Loan account for "${person_name}" created.`);
  return c.redirect('/loans');
});

loansRouter.post('/loan/:id/delete', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const id = parseInt(c.req.param('id'));
  await db(c.env.DB).deleteLoanAccount(id, user.id);
  await setFlash(c.env.SESSIONS, session.token, 'success', 'Loan account deleted.');
  return c.redirect('/loans');
});

loansRouter.post('/loan/:loanId/entry', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const loanId = parseInt(c.req.param('loanId'));
  const form = await c.req.formData();
  const entry_type = form.get('entry_type')?.toString() || 'lent';
  const rawAmount = parseFloat(form.get('amount')?.toString() || '0');
  const note = form.get('note')?.toString().trim() || '';

  if (!rawAmount) {
    await setFlash(c.env.SESSIONS, session.token, 'error', 'Amount required.');
    return c.redirect('/loans');
  }

  // Verify loan belongs to user
  const loan = await db(c.env.DB).getLoanAccount(loanId, user.id);
  if (!loan) {
    await setFlash(c.env.SESSIONS, session.token, 'error', 'Loan not found.');
    return c.redirect('/loans');
  }

  const amount = entry_type === 'repaid' ? -rawAmount : rawAmount;
  const date = new Date().toISOString().split('T')[0];

  await db(c.env.DB).createLoanEntry({ loan_account_id: loanId, amount, note, date });
  await setFlash(c.env.SESSIONS, session.token, 'success', 'Entry added.');
  return c.redirect('/loans');
});

loansRouter.post('/loan/:loanId/entry/:entryId/delete', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const loanId = parseInt(c.req.param('loanId'));
  const entryId = parseInt(c.req.param('entryId'));

  const loan = await db(c.env.DB).getLoanAccount(loanId, user.id);
  if (!loan) {
    await setFlash(c.env.SESSIONS, session.token, 'error', 'Loan not found.');
    return c.redirect('/loans');
  }

  await db(c.env.DB).deleteLoanEntry(entryId, loanId);
  await setFlash(c.env.SESSIONS, session.token, 'success', 'Entry deleted.');
  return c.redirect('/loans');
});
