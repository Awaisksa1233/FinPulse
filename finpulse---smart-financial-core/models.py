from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    accounts = db.relationship('Account', backref='user', lazy=True)
    transactions = db.relationship('Transaction', backref='user', lazy=True)
    loans = db.relationship('Loan', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Account(db.Model):
    __tablename__ = 'accounts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # cash, bank, mobile
    balance = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(10), default='SAR')
    
    transactions = db.relationship('Transaction', backref='account', lazy=True, foreign_keys='Transaction.account_id')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'balance': self.balance,
            'currency': self.currency
        }


class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(20), nullable=False)  # income, expense, transfer
    category = db.Column(db.String(50), nullable=False)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    to_account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=True)  # For transfers
    description = db.Column(db.String(255), default='')
    is_recurring = db.Column(db.Boolean, default=False)
    recurring_frequency = db.Column(db.String(20), nullable=True)  # weekly, monthly
    
    to_account = db.relationship('Account', foreign_keys=[to_account_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'amount': self.amount,
            'type': self.type,
            'category': self.category,
            'account_id': self.account_id,
            'to_account_id': self.to_account_id,
            'description': self.description,
            'is_recurring': self.is_recurring,
            'recurring_frequency': self.recurring_frequency
        }


class Loan(db.Model):
    __tablename__ = 'loans'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    counterparty = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(10), nullable=False)  # given, taken
    principal_amount = db.Column(db.Float, nullable=False)
    outstanding_balance = db.Column(db.Float, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    interest_rate = db.Column(db.Float, nullable=True)
    emi_amount = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(20), default='active')  # active, settled
    
    def to_dict(self):
        return {
            'id': self.id,
            'counterparty': self.counterparty,
            'type': self.type,
            'principal_amount': self.principal_amount,
            'outstanding_balance': self.outstanding_balance,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'interest_rate': self.interest_rate,
            'emi_amount': self.emi_amount,
            'status': self.status
        }


class LoanAccount(db.Model):
    """Represents a person/entity you lend to or borrow from."""
    __tablename__ = 'loan_accounts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)  # Person's name
    type = db.Column(db.String(15), nullable=False)   # 'receivable' (they owe you) or 'payable' (you owe them)
    notes = db.Column(db.String(255), nullable=True)  # Optional notes about this person
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to entries
    entries = db.relationship('LoanEntry', backref='loan_account', lazy=True, cascade='all, delete-orphan')
    user = db.relationship('User', backref='loan_accounts')
    
    @property
    def balance(self):
        """Calculate net balance from all entries."""
        return sum(e.amount for e in self.entries)
    
    @property
    def total_lent(self):
        """Total amount lent/borrowed (positive entries)."""
        return sum(e.amount for e in self.entries if e.amount > 0)
    
    @property
    def total_repaid(self):
        """Total amount repaid (negative entries become positive)."""
        return abs(sum(e.amount for e in self.entries if e.amount < 0))
    
    @property
    def last_activity(self):
        """Date of most recent entry."""
        if self.entries:
            return max(e.date for e in self.entries)
        return None
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'notes': self.notes,
            'balance': self.balance,
            'total_lent': self.total_lent,
            'total_repaid': self.total_repaid,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'entry_count': len(self.entries),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class LoanEntry(db.Model):
    """Individual loan transaction under a LoanAccount."""
    __tablename__ = 'loan_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    loan_account_id = db.Column(db.Integer, db.ForeignKey('loan_accounts.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)  # Positive = lent/borrowed, Negative = repaid
    description = db.Column(db.String(255), nullable=True)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'loan_account_id': self.loan_account_id,
            'amount': self.amount,
            'description': self.description,
            'date': self.date.isoformat() if self.date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'role': self.role,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class TelegramUser(db.Model):
    __tablename__ = 'telegram_users'
    
    id = db.Column(db.Integer, primary_key=True)
    telegram_id = db.Column(db.BigInteger, unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    telegram_username = db.Column(db.String(100))
    telegram_first_name = db.Column(db.String(100))
    link_code = db.Column(db.String(20), unique=True, nullable=True)  # For linking accounts
    verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='telegram_account')
    
    def to_dict(self):
        return {
            'telegram_id': self.telegram_id,
            'telegram_username': self.telegram_username,
            'telegram_first_name': self.telegram_first_name,
            'verified': self.verified
        }
