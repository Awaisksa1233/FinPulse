import os

# Must be set before `app` is imported: the database engine is bound at import time,
# so overriding the config afterwards would run tests (and drop_all) on the real database.
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

import pytest
from app import app as flask_app
from models import db, User

@pytest.fixture
def app():
    # Override config for testing
    flask_app.config['TESTING'] = True
    flask_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    flask_app.config['WTF_CSRF_ENABLED'] = False
    
    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

@pytest.fixture
def auth_user(app):
    user = User(
        email='testuser@example.com',
        name='Test User'
    )
    user.set_password('testpassword')
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture(autouse=True)
def csrf_token(client):
    """Seed a CSRF token in the session and make client.post send it automatically."""
    with client.session_transaction() as sess:
        sess['_csrf_token'] = 'test-token'
    original_post = client.post

    def post(*args, **kwargs):
        data = kwargs.get('data')
        if isinstance(data, dict):
            kwargs['data'] = {**data, 'csrf_token': 'test-token'}
        return original_post(*args, **kwargs)

    client.post = post


@pytest.fixture(autouse=True)
def _never_touch_real_database(app):
    assert db.engine.url.database == ':memory:', 'tests must use an in-memory database'
