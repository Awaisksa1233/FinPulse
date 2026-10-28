def test_home_redirect_unauthenticated(client):
    response = client.get('/')
    assert response.status_code == 302
    assert '/login' in response.headers['Location']

def test_login_page_loads(client):
    response = client.get('/login')
    assert response.status_code == 200
    assert b'Login' in response.data

def test_login_success(client, auth_user):
    response = client.post('/login', data={
        'email': 'testuser@example.com',
        'password': 'testpassword'
    }, follow_redirects=True)
    assert response.status_code == 200
    # On success, they should be redirected to dashboard
    # The home route returns render_template('dashboard.html'...)
    assert b'Dashboard' in response.data or b'Accounts' in response.data

def test_login_failure(client, auth_user):
    response = client.post('/login', data={
        'email': 'testuser@example.com',
        'password': 'wrongpassword'
    }, follow_redirects=True)
    # Should stay on login and show error
    assert b'Invalid email or password' in response.data or b'Login' in response.data

def test_dashboard_authenticated(client, auth_user):
    # Log in first
    client.post('/login', data={
        'email': 'testuser@example.com',
        'password': 'testpassword'
    })
    
    # Access dashboard
    response = client.get('/')
    assert response.status_code == 200
    
def test_accounts_authenticated(client, auth_user):
    client.post('/login', data={
        'email': 'testuser@example.com',
        'password': 'testpassword'
    })
    
    response = client.get('/accounts')
    assert response.status_code == 200


def _login(client):
    client.post('/login', data={'email': 'testuser@example.com', 'password': 'testpassword'})


def test_export_requires_login(client):
    assert client.get('/export/transactions.csv').status_code == 302


def test_add_transaction_updates_balance_and_exports(client, auth_user):
    from models import Account, db
    acct = Account(user_id=auth_user.id, name='Cash', type='cash', balance=100)
    db.session.add(acct)
    db.session.commit()
    _login(client)

    resp = client.post('/transaction/add', data={
        'account_id': acct.id, 'type': 'expense', 'amount': '25.50',
        'category': 'Food', 'description': '=HYPERLINK("x")', 'date': '2026-10-01',
    })
    assert resp.status_code in (200, 302)
    db.session.refresh(acct)
    assert acct.balance == 74.5

    csv_resp = client.get('/export/transactions.csv')
    body = csv_resp.get_data(as_text=True)
    assert csv_resp.mimetype == 'text/csv'
    assert '2026-10-01,expense,Food,25.50,Cash' in body
    assert "'=HYPERLINK" in body  # formula neutralised


def test_registration_can_be_closed(client, auth_user, monkeypatch):
    monkeypatch.setenv('REGISTRATION_OPEN', 'false')
    resp = client.post('/register', data={'name': 'X', 'email': 'x@example.com', 'password': 'secret123'})
    assert resp.status_code == 302 and '/login' in resp.headers['Location']
    from models import User
    assert User.query.filter_by(email='x@example.com').first() is None
