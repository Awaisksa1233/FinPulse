"""
Daily Report Service for FinPulse
Generates and sends daily financial summaries via Telegram.
"""
from datetime import date, datetime, timedelta
from typing import Optional

from models import db, User, Account, Transaction, Loan, TelegramUser
from services.telegram_service import send_telegram_message


def generate_daily_summary(user_id: int) -> dict:
    """
    Generate a daily financial summary for a user.
    
    Returns dict with summary data including:
    - today's income/expenses
    - category breakdown
    - account balances
    - spending insights
    """
    today = date.today()
    
    # Get today's transactions
    transactions = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.date == today
    ).all()
    
    # Calculate totals
    today_income = sum(t.amount for t in transactions if t.type == 'income')
    today_expenses = sum(t.amount for t in transactions if t.type == 'expense')
    
    # Category breakdown for expenses
    expense_by_category = {}
    for t in transactions:
        if t.type == 'expense':
            cat = t.category or 'Other'
            expense_by_category[cat] = expense_by_category.get(cat, 0) + t.amount
    
    # Sort categories by amount
    sorted_categories = sorted(expense_by_category.items(), key=lambda x: x[1], reverse=True)
    
    # Get account balances
    accounts = Account.query.filter_by(user_id=user_id).all()
    account_balances = {a.name: a.balance for a in accounts}
    total_balance = sum(a.balance for a in accounts)
    
    # Get active loans summary
    loans = Loan.query.filter_by(user_id=user_id, status='active').all()
    total_receivables = sum(l.outstanding_balance for l in loans if l.type == 'given')
    total_payables = sum(l.outstanding_balance for l in loans if l.type == 'taken')
    
    # Compare with yesterday
    yesterday = today - timedelta(days=1)
    yesterday_transactions = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.date == yesterday
    ).all()
    yesterday_expenses = sum(t.amount for t in yesterday_transactions if t.type == 'expense')
    
    # Generate insight
    insight = None
    if yesterday_expenses > 0 and today_expenses > 0:
        change_pct = ((today_expenses - yesterday_expenses) / yesterday_expenses) * 100
        if change_pct <= -20:
            insight = f"🎉 Great job! You spent {abs(change_pct):.0f}% less than yesterday!"
        elif change_pct >= 20:
            insight = f"⚠️ Heads up: You spent {change_pct:.0f}% more than yesterday."
    
    return {
        'date': today,
        'today_income': today_income,
        'today_expenses': today_expenses,
        'net_today': today_income - today_expenses,
        'expense_by_category': sorted_categories,
        'account_balances': account_balances,
        'total_balance': total_balance,
        'total_receivables': total_receivables,
        'total_payables': total_payables,
        'transaction_count': len(transactions),
        'insight': insight
    }


def format_daily_report(summary: dict, user_name: str = "there") -> str:
    """
    Format the daily summary into a Telegram-friendly message.
    """
    date_str = summary['date'].strftime('%b %d, %Y')
    
    message = f"📊 *Daily FinPulse Report* - {date_str}\n"
    message += f"Hey {user_name}! Here's your daily summary:\n\n"
    
    # Today's Activity
    message += "💰 *Today's Activity:*\n"
    if summary['today_income'] > 0:
        message += f"  • Income: +{summary['today_income']:,.0f} SAR\n"
    if summary['today_expenses'] > 0:
        message += f"  • Expenses: -{summary['today_expenses']:,.0f} SAR\n"
    if summary['transaction_count'] == 0:
        message += "  • No transactions recorded today\n"
    message += "\n"
    
    # Top Categories (if any expenses)
    if summary['expense_by_category']:
        message += "📁 *Top Spending Categories:*\n"
        for cat, amount in summary['expense_by_category'][:3]:
            message += f"  • {cat}: {amount:,.0f} SAR\n"
        message += "\n"
    
    # Account Balances
    message += "💳 *Account Balances:*\n"
    for name, balance in summary['account_balances'].items():
        message += f"  • {name}: {balance:,.0f} SAR\n"
    message += f"  📍 *Total: {summary['total_balance']:,.0f} SAR*\n\n"
    
    # Loans Summary (if any)
    if summary['total_receivables'] > 0 or summary['total_payables'] > 0:
        message += "📋 *Loans:*\n"
        if summary['total_receivables'] > 0:
            message += f"  • Owed to you: {summary['total_receivables']:,.0f} SAR\n"
        if summary['total_payables'] > 0:
            message += f"  • You owe: {summary['total_payables']:,.0f} SAR\n"
        message += "\n"
    
    # Insight
    if summary['insight']:
        message += f"💡 *Insight:* {summary['insight']}\n"
    
    message += "\n_Reply with transactions like \"Paid 50 for lunch\" anytime!_"
    
    return message


def send_daily_reports() -> dict:
    """
    Send daily reports to all verified Telegram users.
    
    Returns dict with:
    - success_count: number of reports sent successfully
    - failure_count: number of failed sends
    - details: list of results
    """
    # Get all verified Telegram users
    tg_users = TelegramUser.query.filter_by(verified=True).all()
    
    results = {
        'success_count': 0,
        'failure_count': 0,
        'total_users': len(tg_users),
        'details': []
    }
    
    for tg_user in tg_users:
        try:
            # Generate summary for this user
            summary = generate_daily_summary(tg_user.user_id)
            
            # Format the report
            user_name = tg_user.telegram_first_name or tg_user.user.name or "there"
            report = format_daily_report(summary, user_name)
            
            # Send via Telegram
            success = send_telegram_message(tg_user.telegram_id, report)
            
            if success:
                results['success_count'] += 1
                results['details'].append({
                    'user_id': tg_user.user_id,
                    'telegram_id': tg_user.telegram_id,
                    'status': 'sent'
                })
            else:
                results['failure_count'] += 1
                results['details'].append({
                    'user_id': tg_user.user_id,
                    'telegram_id': tg_user.telegram_id,
                    'status': 'failed',
                    'error': 'Send failed'
                })
                
        except Exception as e:
            results['failure_count'] += 1
            results['details'].append({
                'user_id': tg_user.user_id,
                'telegram_id': tg_user.telegram_id,
                'status': 'error',
                'error': str(e)
            })
    
    return results


def send_report_to_user(user_id: int) -> dict:
    """
    Send a daily report to a specific user by their user ID.
    Useful for manual triggers or testing.
    """
    tg_user = TelegramUser.query.filter_by(user_id=user_id, verified=True).first()
    
    if not tg_user:
        return {
            'success': False,
            'error': 'User does not have a verified Telegram account linked'
        }
    
    try:
        summary = generate_daily_summary(user_id)
        user_name = tg_user.telegram_first_name or tg_user.user.name or "there"
        report = format_daily_report(summary, user_name)
        
        success = send_telegram_message(tg_user.telegram_id, report)
        
        return {
            'success': success,
            'telegram_id': tg_user.telegram_id,
            'message': 'Report sent successfully' if success else 'Failed to send report'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
