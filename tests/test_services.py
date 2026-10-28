import datetime
from services.daily_report_service import format_daily_report

def test_format_daily_report():
    summary = {
        'date': datetime.date(2026, 6, 1),
        'today_income': 5000,
        'today_expenses': 200,
        'net_today': 4800,
        'expense_by_category': [('Food', 150), ('Transport', 50)],
        'account_balances': {'Al Rajhi': 15000, 'Cash': 500},
        'total_balance': 15500,
        'total_receivables': 1000,
        'total_payables': 0,
        'transaction_count': 3,
        'insight': 'Great job!'
    }
    
    report = format_daily_report(summary, 'Awais')
    
    assert 'Jun 01, 2026' in report
    assert 'Hey Awais' in report
    assert '+5,000 SAR' in report
    assert '-200 SAR' in report
    assert 'Food: 150 SAR' in report
    assert 'Al Rajhi: 15,000 SAR' in report
    assert 'Total: 15,500 SAR' in report
    assert 'Owed to you: 1,000 SAR' in report
    assert 'Great job!' in report


def test_groq_model_kwargs(monkeypatch):
    from services import groq_service
    monkeypatch.setenv('GROQ_MODEL', 'openai/gpt-oss-120b')
    assert groq_service.model_kwargs() == {'reasoning_effort': 'low'}
    monkeypatch.setenv('GROQ_MODEL', 'some/other-model')
    assert groq_service.model_kwargs() == {}
    monkeypatch.delenv('GROQ_MODEL')
    assert groq_service.get_model() == 'openai/gpt-oss-120b'
