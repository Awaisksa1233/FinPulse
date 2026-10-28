from datetime import date

from models import db, Account, Transaction, CarContract, CarPayment
from services.car_service import summarize, due_date


def _contract(user, **kw):
    values = dict(user_id=user.id, name='Camry', monthly_installment=1000.0, num_installments=4,
                  first_due_date=date(2026, 1, 31), final_payment=0.0, down_payment=500.0)
    values.update(kw)
    c = CarContract(**values)
    db.session.add(c)
    db.session.commit()
    return c


def _pay(c, amount, kind='installment'):
    db.session.add(CarPayment(contract_id=c.id, date=date(2026, 2, 1), amount=amount, kind=kind))
    db.session.commit()


def test_due_dates_clamp_month_end(auth_user):
    c = _contract(auth_user)
    assert due_date(c, 2) == date(2026, 2, 28)
    assert due_date(c, 3) == date(2026, 3, 31)


def test_summary_totals_and_overdue(auth_user):
    c = _contract(auth_user, final_payment=2000.0)
    _pay(c, 1000)
    s = summarize(c, today=date(2026, 3, 15))
    assert s['total_payable'] == 6000 and s['total_cost'] == 6500
    assert s['paid'] == 1000 and s['remaining'] == 5000 and s['paid_count'] == 1
    assert [r['status'] for r in s['schedule']] == ['paid', 'overdue', 'upcoming', 'upcoming']
    assert s['overdue_count'] == 1
    assert s['next_due'] == date(2026, 2, 28) and s['next_amount'] == 1000


def test_partial_and_extra_payments(auth_user):
    c = _contract(auth_user)
    _pay(c, 1500)  # one full instalment plus half of the next
    s = summarize(c, today=date(2026, 1, 1))
    assert s['paid_count'] == 1 and s['next_amount'] == 500
    _pay(c, 2500, 'extra')
    s = summarize(c, today=date(2026, 1, 1))
    assert s['is_complete'] and s['paid_count'] == 4 and s['next_due'] is None


def test_final_payment_is_next_after_installments(auth_user):
    c = _contract(auth_user, final_payment=2000.0)
    _pay(c, 4000)
    s = summarize(c, today=date(2026, 5, 15))
    assert not s['is_complete']
    assert s['next_amount'] == 2000 and s['next_due'] == date(2026, 5, 31) and s['overdue_count'] == 0
    assert summarize(c, today=date(2026, 6, 1))['overdue_count'] == 1
    _pay(c, 2000, 'final')
    assert summarize(c)['is_complete']


def test_pay_route_posts_expense_and_reverses(client, auth_user):
    acct = Account(user_id=auth_user.id, name='Bank', type='bank', balance=5000)
    db.session.add(acct)
    db.session.commit()
    c = _contract(auth_user)
    client.post('/login', data={'email': 'testuser@example.com', 'password': 'testpassword'})

    client.post(f'/car-payments/pay/{c.id}', data={
        'amount': '1000', 'date': '2026-02-01', 'account_id': acct.id, 'kind': 'installment'})
    db.session.refresh(acct)
    assert acct.balance == 4000
    tx = Transaction.query.one()
    assert tx.category == 'Car Payment' and tx.type == 'expense' and tx.amount == 1000

    page = client.get('/car-payments')
    assert page.status_code == 200 and b'Camry' in page.data

    payment = CarPayment.query.one()
    client.post(f'/car-payments/payment/delete/{payment.id}', data={})
    db.session.refresh(acct)
    assert acct.balance == 5000 and Transaction.query.count() == 0


def test_cannot_touch_other_users_contract(client, auth_user):
    from models import User
    other = User(email='o@example.com', name='O')
    other.set_password('x12345')
    db.session.add(other)
    db.session.commit()
    c = _contract(other)
    client.post('/login', data={'email': 'testuser@example.com', 'password': 'testpassword'})
    client.post(f'/car-payments/delete/{c.id}', data={})
    assert db.session.get(CarContract, c.id) is not None


def test_add_contract_validation(client, auth_user):
    client.post('/login', data={'email': 'testuser@example.com', 'password': 'testpassword'})
    client.post('/car-payments/add', data={'name': 'Bad', 'monthly_installment': '0',
                                           'num_installments': '12', 'first_due_date': '2026-01-01'})
    assert CarContract.query.count() == 0
    client.post('/car-payments/add', data={'name': 'Good', 'monthly_installment': '900',
                                           'num_installments': '12', 'first_due_date': '2026-01-01'})
    assert CarContract.query.count() == 1


def test_record_only_payment_changes_no_balance_or_expense(client, auth_user):
    acct = Account(user_id=auth_user.id, name='Bank', type='bank', balance=5000)
    db.session.add(acct)
    db.session.commit()
    c = _contract(auth_user)
    client.post('/login', data={'email': 'testuser@example.com', 'password': 'testpassword'})
    client.post(f'/car-payments/pay/{c.id}', data={
        'amount': '1000', 'date': '2026-02-01', 'kind': 'installment', 'record_only': 'on'})
    db.session.refresh(acct)
    assert acct.balance == 5000 and Transaction.query.count() == 0
    p = CarPayment.query.one()
    assert p.transaction_id is None and summarize(c)['paid_count'] == 1
    client.post(f'/car-payments/payment/delete/{p.id}', data={})  # removing it must not error or move money
    db.session.refresh(acct)
    assert acct.balance == 5000 and CarPayment.query.count() == 0
