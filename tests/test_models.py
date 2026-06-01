from models import User, Account, LoanAccount, LoanEntry

def test_user_password_hashing(app):
    user = User(email='hashing@example.com', name='Hash Test')
    user.set_password('mypassword')
    
    assert user.password_hash is not None
    assert user.password_hash != 'mypassword'
    assert user.check_password('mypassword') is True
    assert user.check_password('wrongpassword') is False

def test_account_logo_url(app):
    account1 = Account(name='Al Rajhi Bank', type='bank', currency='SAR')
    assert account1.logo_url == 'https://www.google.com/s2/favicons?domain=alrajhibank.com.sa&sz=128'
    
    account2 = Account(name='Cash Wallet', type='cash', currency='SAR')
    assert account2.logo_url is None

def test_loan_account_properties(app):
    loan_acc = LoanAccount(name='John Doe', type='receivable')
    
    # Initially 0
    assert loan_acc.balance == 0
    assert loan_acc.total_lent == 0
    assert loan_acc.total_repaid == 0
    assert loan_acc.last_activity is None
    
    # Add an entry where they borrow 1000
    entry1 = LoanEntry(amount=1000)
    loan_acc.entries.append(entry1)
    
    assert loan_acc.balance == 1000
    assert loan_acc.total_lent == 1000
    assert loan_acc.total_repaid == 0
    
    # Add an entry where they repay 400
    entry2 = LoanEntry(amount=-400)
    loan_acc.entries.append(entry2)
    
    assert loan_acc.balance == 600
    assert loan_acc.total_lent == 1000
    assert loan_acc.total_repaid == 400
