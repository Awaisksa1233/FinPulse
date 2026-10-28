from models import db, User, Account, Transaction, TelegramUser


def _login(client):
    client.post('/login', data={'email': 'testuser@example.com', 'password': 'testpassword'})


def _auto_created(tg_id=111, with_data=False):
    """What the bot's /start creates for an unlinked Telegram user."""
    shell = User(name='Tg', email=f'tg_{tg_id}@telegram.user')
    shell.set_password('x' * 12)
    db.session.add(shell)
    db.session.flush()
    acct = Account(user_id=shell.id, name='Cash', type='cash', balance=0.0)
    db.session.add(acct)
    db.session.flush()
    if with_data:
        db.session.add(Transaction(user_id=shell.id, amount=5, type='expense', category='x', account_id=acct.id))
    tg = TelegramUser(telegram_id=tg_id, user_id=shell.id, verified=True, link_code='LOGIN:ABC12DEF')
    db.session.add(tg)
    db.session.commit()
    return shell, tg


def test_link_accepts_start_code_and_merges_empty_shell(client, auth_user, monkeypatch):
    monkeypatch.setattr('services.telegram_service.send_telegram_message', lambda *a, **k: True)
    shell, tg = _auto_created()
    shell_id = shell.id
    _login(client)
    client.post('/telegram/link', data={'link_code': 'abc12def'})
    db.session.expire_all()
    tg = TelegramUser.query.one()
    assert tg.user_id == auth_user.id and tg.verified and tg.link_code is None
    assert db.session.get(User, shell_id) is None
    assert Account.query.filter_by(user_id=shell_id).count() == 0


def test_link_also_accepts_login_prefix(client, auth_user, monkeypatch):
    monkeypatch.setattr('services.telegram_service.send_telegram_message', lambda *a, **k: True)
    _auto_created()
    _login(client)
    client.post('/telegram/link', data={'link_code': 'LOGIN:ABC12DEF'})
    assert TelegramUser.query.one().user_id == auth_user.id


def test_link_refuses_account_that_has_data(client, auth_user, monkeypatch):
    monkeypatch.setattr('services.telegram_service.send_telegram_message', lambda *a, **k: True)
    shell, tg = _auto_created(with_data=True)
    _login(client)
    client.post('/telegram/link', data={'link_code': 'ABC12DEF'})
    db.session.expire_all()
    assert TelegramUser.query.one().user_id == shell.id
    assert db.session.get(User, shell.id) is not None


def test_link_never_merges_a_real_email_account(client, auth_user, monkeypatch):
    monkeypatch.setattr('services.telegram_service.send_telegram_message', lambda *a, **k: True)
    other = User(name='Real', email='real@example.com')
    other.set_password('secret123')
    db.session.add(other)
    db.session.flush()
    db.session.add(TelegramUser(telegram_id=222, user_id=other.id, verified=True, link_code='ZZZ99999'))
    db.session.commit()
    _login(client)
    client.post('/telegram/link', data={'link_code': 'ZZZ99999'})
    assert db.session.get(User, other.id) is not None
    assert TelegramUser.query.one().user_id == other.id
