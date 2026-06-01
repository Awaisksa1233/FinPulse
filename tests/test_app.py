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
