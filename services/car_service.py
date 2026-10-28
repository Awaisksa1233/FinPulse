"""Calculations for car finance contracts (see models.CarContract)."""
from datetime import date
from dateutil.relativedelta import relativedelta


def due_date(contract, n):
    """Due date of instalment number n (1-based)."""
    return contract.first_due_date + relativedelta(months=n - 1)


def summarize(contract, today=None):
    """Return totals, progress and the instalment schedule for a contract."""
    today = today or date.today()
    n = contract.num_installments
    inst = contract.monthly_installment
    final = contract.final_payment or 0.0

    total_payable = inst * n + final
    paid = sum(p.amount for p in contract.payments)
    remaining = max(total_payable - paid, 0.0)

    # Instalments are settled in order: every full instalment's worth of money paid
    # towards instalments (regular or extra) clears the next one.
    towards_installments = sum(p.amount for p in contract.payments if p.kind != 'final')
    final_paid = sum(p.amount for p in contract.payments if p.kind == 'final')
    paid_count = min(n, int(round(towards_installments, 2) // inst)) if inst > 0 else 0
    if inst > 0 and round(towards_installments, 2) >= inst * n - 0.005:
        paid_count = n

    schedule = []
    for i in range(1, n + 1):
        d = due_date(contract, i)
        if i <= paid_count:
            status = 'paid'
        elif d < today:
            status = 'overdue'
        else:
            status = 'upcoming'
        schedule.append({'n': i, 'due': d, 'amount': inst, 'status': status})

    final_due = due_date(contract, n + 1) if final else None
    next_item = next((s for s in schedule if s['status'] != 'paid'), None)
    # Partial progress into the next instalment (e.g. paid 1.5 instalments)
    carry = max(round(towards_installments - paid_count * inst, 2), 0.0) if paid_count < n else 0.0
    next_amount = max(inst - carry, 0.0) if next_item else None

    if next_item:
        next_due, next_due_amount = next_item['due'], next_amount
    elif final and final_paid < final - 0.005:
        next_due, next_due_amount = final_due, final - final_paid
    else:
        next_due, next_due_amount = None, None

    overdue = [s for s in schedule if s['status'] == 'overdue']
    final_overdue = bool(final and not next_item and final_paid < final - 0.005 and final_due < today)

    return {
        'total_payable': total_payable,
        'total_cost': total_payable + (contract.down_payment or 0.0),
        'paid': paid,
        'remaining': remaining,
        'percent': min(100.0, (paid / total_payable * 100.0)) if total_payable else 100.0,
        'paid_count': paid_count,
        'schedule': schedule,
        'final_due': final_due,
        'final_paid': final_paid,
        'next_due': next_due,
        'next_amount': next_due_amount,
        'overdue_count': len(overdue) + (1 if final_overdue else 0),
        'is_complete': remaining <= 0.005,
        'days_to_next': (next_due - today).days if next_due else None,
    }
