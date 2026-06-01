import os
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
