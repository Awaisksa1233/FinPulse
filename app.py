import os
from datetime import datetime, date, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'finpulse-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///finpulse.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['REMEMBER_COOKIE_DURATION'] = timedelta(days=30)
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

# Enable CORS for API routes
CORS(app, resources={r"/api/*": {"origins": "*"}})

from models import db, User, Account, Transaction, Loan, ChatMessage
db.init_app(app)

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# Create tables
with app.app_context():
    db.create_all()
    # Auto-migration: Check and add api_token column if it doesn't exist
    try:
        from sqlalchemy import text
        columns_info = db.session.execute(text("PRAGMA table_info(users)")).fetchall()
        columns = [row[1] for row in columns_info]
        if 'api_token' not in columns:
            db.session.execute(text("ALTER TABLE users ADD COLUMN api_token VARCHAR(64)"))
            db.session.commit()
            print("Auto-migration: Added api_token column to users table.")
            
        columns_info_t = db.session.execute(text("PRAGMA table_info(transactions)")).fetchall()
        columns_t = [row[1] for row in columns_info_t]
        if 'budget_month' not in columns_t:
            db.session.execute(text("ALTER TABLE transactions ADD COLUMN budget_month DATE"))
            db.session.commit()
            print("Auto-migration: Added budget_month column to transactions table.")
    except Exception as e:
        print(f"Auto-migration warning: {e}")


@app.before_request
def check_maintenance_mode():
    """Block access during maintenance mode (except for admin)."""
    if os.getenv('MAINTENANCE_MODE', 'false').lower() == 'true':
        # Allow admin routes and static files
        allowed_paths = ['/admin', '/static']
        if any(request.path.startswith(p) for p in allowed_paths):
            return None
        # Show maintenance page
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Maintenance Mode</title>
            <style>
                body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-align: center; }
                .container { padding: 40px; }
                h1 { font-size: 48px; margin-bottom: 16px; }
                p { font-size: 18px; opacity: 0.9; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔧</h1>
                <h1>Under Maintenance</h1>
                <p>We're performing scheduled maintenance. Please check back soon!</p>
            </div>
        </body>
        </html>
        ''', 503

@app.before_request
def check_csrf():
    if request.method == 'POST':
        # Skip CSRF for API endpoints and telegram webhook
        if request.path.startswith('/api/') or request.path.startswith('/telegram/set-webhook'):
            return None
        
        token = session.get('_csrf_token', None)
        if not token or token != request.form.get('csrf_token'):
            abort(403)

def generate_csrf_token():
    if '_csrf_token' not in session:
        import secrets
        session['_csrf_token'] = secrets.token_hex(32)
    return session['_csrf_token']

app.jinja_env.globals['csrf_token'] = generate_csrf_token



def update_env_file(updates: dict):
    """Update .env file with new values while preserving existing ones."""
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    
    # Read existing .env file
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and '=' in line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    
    # Update with new values
    env_vars.update(updates)
    
    # Write back
    with open(env_path, 'w') as f:
        for key, value in env_vars.items():
            f.write(f"{key}={value}\n")
    
    # Update os.environ
    for key, value in updates.items():
        os.environ[key] = value


def get_api_user():
    """Authenticate user using API token (query param, Bearer auth, or header)."""
    # Try query param first
    token = request.args.get('api_token')
    
    # Try Authorization header next
    if not token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.lower().startswith('bearer '):
            token = auth_header.split(' ', 1)[1].strip()
            
    # Try custom header last
    if not token:
        token = request.headers.get('X-API-Key')
        
    if not token:
        return None
        
    from models import User
    return User.query.filter_by(api_token=token).first()


# ============ AUTH ============
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        email = request.form.get('email', '').lower().strip()
        password = request.form.get('password', '')
        remember = request.form.get('remember') == 'on'
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            login_user(user, remember=remember)
            flash('Welcome back!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password.', 'error')
    
    return render_template('auth.html', mode='login')


@app.route('/login/telegram', methods=['POST'])
def login_telegram():
    """Login using Telegram code."""
    from models import TelegramUser
    
    code = request.form.get('code', '').strip().upper()
    remember = request.form.get('remember') == 'on'
    
    if not code:
        flash('Please enter a code.', 'error')
        return redirect(url_for('login'))
    
    # Find telegram user with this login code
    tg_user = TelegramUser.query.filter_by(link_code=f"LOGIN:{code}", verified=True).first()
    
    if not tg_user:
        flash('Invalid or expired code. Send /login in Telegram to get a new one.', 'error')
        return redirect(url_for('login'))
    
    # Clear the code (one-time use)
    tg_user.link_code = None
    db.session.commit()
    
    # Log in the user
    user = tg_user.user
    login_user(user, remember=remember)
    
    flash(f'Welcome back, {user.name}!', 'success')
    return redirect(url_for('dashboard'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').lower().strip()
        password = request.form.get('password', '')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered.', 'error')
            return render_template('auth.html', mode='register')
        
        if len(password) < 6:
            flash('Password must be at least 6 characters.', 'error')
            return render_template('auth.html', mode='register')
        
        user = User(name=name, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        login_user(user, remember=True)
        flash('Account created! Welcome to FinPulse.', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('auth.html', mode='register')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'success')
    return redirect(url_for('login'))


# ============ DASHBOARD ============
@app.route('/')
@login_required
def dashboard():
    from models import Budget, RecurringTemplate
    from services.recurring_service import process_recurring_transactions
    
    # Process any pending recurring transactions
    recurring_result = process_recurring_transactions(db, current_user.id)
    if recurring_result['generated_count'] > 0:
        flash(f"Auto-generated {recurring_result['generated_count']} recurring transaction(s).", 'success')
    
    accounts = Account.query.filter_by(user_id=current_user.id).all()
    total_balance = sum(a.balance for a in accounts)
    
    # This month's income/expense
    today = date.today()
    month_start = date(today.year, today.month, 1)
    
    transactions = Transaction.query.filter(
        Transaction.user_id == current_user.id,
        db.func.coalesce(Transaction.budget_month, Transaction.date) >= month_start
    ).all()
    income_this_month = sum(t.amount for t in transactions if t.type == 'income')
    expense_this_month = sum(t.amount for t in transactions if t.type == 'expense')
    
    # Expense by category (for this month)
    expense_by_category = {}
    for t in transactions:
        if t.type == 'expense':
            expense_by_category[t.category] = expense_by_category.get(t.category, 0) + t.amount
    
    # Budget progress
    budgets = Budget.query.filter_by(user_id=current_user.id, is_active=True).all()
    budget_progress = []
    budget_alerts = []
    
    for budget in budgets:
        spent = expense_by_category.get(budget.category, 0)
        progress_pct = (spent / budget.monthly_limit * 100) if budget.monthly_limit > 0 else 0
        remaining = budget.monthly_limit - spent
        
        status = 'safe'  # green
        if progress_pct >= 100:
            status = 'exceeded'  # red
            budget_alerts.append(f"⚠️ {budget.category} budget exceeded! ({progress_pct:.0f}%)")
        elif progress_pct >= budget.alert_threshold * 100:
            status = 'warning'  # yellow
            budget_alerts.append(f"⚡ {budget.category} approaching limit ({progress_pct:.0f}%)")
        
        budget_progress.append({
            'category': budget.category,
            'limit': budget.monthly_limit,
            'spent': spent,
            'remaining': remaining,
            'progress_pct': min(progress_pct, 100),  # Cap at 100 for display
            'status': status
        })
    
    # Recent transactions
    recent_transactions = Transaction.query.filter_by(user_id=current_user.id).order_by(Transaction.date.desc()).limit(5).all()
    
    # Upcoming recurring
    upcoming_recurring = RecurringTemplate.query.filter_by(
        user_id=current_user.id, 
        is_paused=False
    ).order_by(RecurringTemplate.next_due).limit(3).all()
    
    return render_template('dashboard.html',
        active_page='dashboard',
        accounts=accounts,
        total_balance=total_balance,
        income_this_month=income_this_month,
        expense_this_month=expense_this_month,
        expense_by_category=expense_by_category,
        recent_transactions=recent_transactions,
        budget_progress=budget_progress,
        budget_alerts=budget_alerts,
        upcoming_recurring=upcoming_recurring
    )


@app.route('/api/summary')
@login_required
def get_ai_summary():
    from services.groq_service import generate_account_summary
    
    accounts = [a.to_dict() for a in Account.query.filter_by(user_id=current_user.id).all()]
    
    today = date.today()
    month_start = date(today.year, today.month, 1)
    transactions = [t.to_dict() for t in Transaction.query.filter(
        Transaction.user_id == current_user.id,
        db.func.coalesce(Transaction.budget_month, Transaction.date) >= month_start
    ).all()]
    loans = [l.to_dict() for l in Loan.query.filter_by(user_id=current_user.id, status='active').all()]
    
    summary = generate_account_summary(accounts, transactions, loans)
    return jsonify({'summary': summary})


@app.route('/api/story')
@login_required
def get_story_report():
    """Generate an AI-powered narrative financial story."""
    from services.groq_service import generate_story_report
    
    timeframe = request.args.get('timeframe', 'monthly')
    year = int(request.args.get('year', date.today().year))
    month = int(request.args.get('month', date.today().month))
    
    # Get current period transactions
    month_date = db.func.coalesce(Transaction.budget_month, Transaction.date)
    if timeframe == 'monthly':
        transactions = Transaction.query.filter(
            Transaction.user_id == current_user.id,
            db.extract('year', month_date) == year,
            db.extract('month', month_date) == month
        ).all()
        timeframe_display = f"{datetime(year, month, 1).strftime('%B %Y')}"
        
        # Get previous month for comparison
        prev_month = month - 1 if month > 1 else 12
        prev_year = year if month > 1 else year - 1
        prev_transactions = Transaction.query.filter(
            Transaction.user_id == current_user.id,
            db.extract('year', month_date) == prev_year,
            db.extract('month', month_date) == prev_month
        ).all()
    else:
        transactions = Transaction.query.filter(
            Transaction.user_id == current_user.id,
            db.extract('year', month_date) == year
        ).all()
        timeframe_display = f"Year {year}"
        prev_transactions = []
    
    # Calculate totals
    total_income = sum(t.amount for t in transactions if t.type == 'income')
    total_expense = sum(t.amount for t in transactions if t.type == 'expense')
    net_savings = total_income - total_expense
    
    # Category breakdowns
    expense_by_category = {}
    income_by_category = {}
    for t in transactions:
        if t.type == 'expense':
            expense_by_category[t.category] = expense_by_category.get(t.category, 0) + t.amount
        elif t.type == 'income':
            income_by_category[t.category] = income_by_category.get(t.category, 0) + t.amount
    
    # Previous month savings for comparison
    prev_savings = None
    if prev_transactions:
        prev_income = sum(t.amount for t in prev_transactions if t.type == 'income')
        prev_expense = sum(t.amount for t in prev_transactions if t.type == 'expense')
        prev_savings = prev_income - prev_expense
    
    story = generate_story_report(
        total_income=total_income,
        total_expense=total_expense,
        net_savings=net_savings,
        expense_by_category=expense_by_category,
        income_by_category=income_by_category,
        previous_month_savings=prev_savings,
        timeframe=timeframe_display
    )
    
    return jsonify({'story': story})


# ============ MOBILE/SHORTCUT API ============
@app.route('/api/ai', methods=['POST'])
def api_ai_transaction():
    """
    AI-powered API endpoint for natural language transaction input.
    
    POST JSON body:
    {
        "text": "Paid 50 for lunch"
    }
    
    Or just send plain text in the body.
    """
    from services.groq_service import process_chat_command
    
    user = get_api_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized. Invalid or missing API token.'}), 401
    
    data = request.get_json(silent=True)
    
    if data:
        text = data.get('text', '')
    else:
        # Accept plain text body
        text = request.data.decode('utf-8')
    
    if not text:
        return jsonify({'success': False, 'error': 'No text provided'}), 400
    
    # Get user's accounts
    accounts = [a.to_dict() for a in Account.query.filter_by(user_id=user.id).all()]
    
    if not accounts:
        return jsonify({'success': False, 'error': 'Create an account first'}), 400
    
    # Process with AI
    result = process_chat_command(text, accounts)
    
    action = result.get('action', 'unknown')
    response_msg = result.get('response_message', 'Done.')
    details = result.get('details', {})
    
    if action == 'unknown' or action == 'error':
        return jsonify({'success': False, 'error': response_msg})
    
    try:
        if action == 'transaction':
            t_type = details.get('type', 'expense')
            amount = float(details.get('amount', 0))
            category = details.get('category', 'Other')
            description = details.get('description', '')
            account_id = details.get('account_id') or accounts[0]['id']
            
            account = Account.query.filter_by(id=int(account_id), user_id=user.id).first()
            if not account:
                return jsonify({'success': False, 'error': 'Account not found or access denied.'}), 400
            
            transaction = Transaction(
                user_id=user.id,
                date=date.today(),
                amount=amount,
                type=t_type,
                category=category,
                account_id=account.id,
                description=description,
                is_recurring=False
            )
            db.session.add(transaction)
            
            if t_type == 'income':
                account.balance += amount
            else:
                account.balance -= amount
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': response_msg,
                'amount': amount,
                'category': category,
                'type': t_type,
                'new_balance': account.balance
            })
        
        elif action == 'transfer':
            from_id = details.get('from_account_id')
            to_id = details.get('to_account_id')
            amount = float(details.get('amount', 0))
            
            if from_id and to_id:
                from_acc = Account.query.filter_by(id=int(from_id), user_id=user.id).first()
                to_acc = Account.query.filter_by(id=int(to_id), user_id=user.id).first()
                
                if from_acc and to_acc:
                    from_acc.balance -= amount
                    to_acc.balance += amount
                    
                    transaction = Transaction(
                        user_id=user.id,
                        date=date.today(),
                        amount=amount,
                        type='transfer',
                        category='Transfer',
                        account_id=from_acc.id,
                        to_account_id=to_acc.id,
                        description=f'AI Transfer to {to_acc.name}',
                        is_recurring=False
                    )
                    db.session.add(transaction)
                    db.session.commit()
                    
                    return jsonify({
                        'success': True,
                        'message': response_msg,
                        'amount': amount
                    })
        
        elif action == 'loan':
            from datetime import timedelta
            
            amount = float(details.get('amount', 0))
            loan_type = details.get('type', 'given')  # given = lent money, taken = borrowed
            counterparty = details.get('counterparty', 'Unknown')
            due_date_str = details.get('due_date')
            account_id = details.get('account_id') or (accounts[0]['id'] if accounts else None)
            
            if due_date_str:
                try:
                    due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
                except:
                    due_date = date.today() + timedelta(days=30)
            else:
                due_date = date.today() + timedelta(days=30)
            
            loan = Loan(
                user_id=user.id,
                counterparty=counterparty,
                type=loan_type,
                principal_amount=amount,
                outstanding_balance=amount,
                due_date=due_date,
                status='active'
            )
            db.session.add(loan)
            
            # Adjust account balance
            new_balance = None
            if account_id:
                account = Account.query.filter_by(id=int(account_id), user_id=user.id).first()
                if account:
                    if loan_type == 'given':
                        # Lent money = money goes out
                        account.balance -= amount
                    else:
                        # Borrowed money = money comes in
                        account.balance += amount
                    new_balance = account.balance
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': response_msg,
                'amount': amount,
                'counterparty': counterparty,
                'type': 'receivable' if loan_type == 'given' else 'payable',
                'new_balance': new_balance
            })
        
        return jsonify({'success': True, 'message': response_msg})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
 
 
@app.route('/api/transaction', methods=['POST'])
def api_add_transaction():
    """
    API endpoint for adding transactions via iOS Shortcuts or external apps.
    
    POST JSON body:
    {
        "amount": 50.00,
        "type": "expense",  // or "income"
        "category": "Food",
        "description": "Lunch",  // optional
        "account": "Cash",  // optional, account name (uses first account if not specified)
        "date": "2024-01-15"  // optional, defaults to today
    }
    """
    user = get_api_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized. Invalid or missing API token.'}), 401
        
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'error': 'No JSON data provided'}), 400
    
    # Required fields
    amount = data.get('amount')
    t_type = data.get('type', 'expense')
    category = data.get('category', 'Other')
    
    if not amount:
        return jsonify({'success': False, 'error': 'Amount is required'}), 400
    
    try:
        amount = float(amount)
    except:
        return jsonify({'success': False, 'error': 'Invalid amount'}), 400
    
    # Optional fields
    description = data.get('description', '')
    
    # Parse date
    date_str = data.get('date')
    if date_str:
        try:
            t_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except:
            t_date = date.today()
    else:
        t_date = date.today()
        
    # Parse budget_month
    budget_month_str = data.get('budget_month')
    budget_month = None
    if budget_month_str:
        try:
            budget_month = datetime.strptime(budget_month_str, '%Y-%m-%d').date()
        except:
            pass
    
    # Find account
    account_name = data.get('account')
    if account_name:
        account = Account.query.filter(Account.user_id == user.id, Account.name.ilike(f'%{account_name}%')).first()
    else:
        account = Account.query.filter_by(user_id=user.id).first()
    
    if not account:
        return jsonify({'success': False, 'error': 'Account not found. Create an account first.'}), 400
    
    # Create transaction
    transaction = Transaction(
        user_id=user.id,
        date=t_date,
        amount=amount,
        type=t_type,
        category=category,
        account_id=account.id,
        description=description,
        is_recurring=False,
        budget_month=budget_month
    )
    db.session.add(transaction)
    
    # Update balance
    if t_type == 'income':
        account.balance += amount
    else:
        account.balance -= amount
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'{t_type.capitalize()} of {amount:.2f} SAR recorded',
        'transaction_id': transaction.id,
        'new_balance': account.balance
    })
 
 
@app.route('/api/accounts', methods=['GET'])
def api_get_accounts():
    """Get list of accounts for iOS Shortcuts."""
    user = get_api_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized. Invalid or missing API token.'}), 401
    accounts = Account.query.filter_by(user_id=user.id).all()
    return jsonify({
        'accounts': [{'id': a.id, 'name': a.name, 'type': a.type, 'balance': a.balance} for a in accounts]
    })


@app.route('/shortcut')
@login_required
def shortcut_setup():
    """iOS Shortcut setup guide."""
    import secrets
    if not current_user.api_token:
        current_user.api_token = secrets.token_hex(32)
        db.session.commit()
    server_url = request.host_url.rstrip('/')
    return render_template('shortcut.html', active_page='shortcut', server_url=server_url)


# ============ REPORTS ============
@app.route('/reports')
@login_required
def reports():
    timeframe = request.args.get('timeframe', 'monthly')
    year = int(request.args.get('year', date.today().year))
    month = int(request.args.get('month', date.today().month))
    
    # Filter transactions by current user
    month_date = db.func.coalesce(Transaction.budget_month, Transaction.date)
    if timeframe == 'monthly':
        transactions = Transaction.query.filter(
            Transaction.user_id == current_user.id,
            db.extract('year', month_date) == year,
            db.extract('month', month_date) == month
        ).all()
        date_display = datetime(year, month, 1).strftime('%B %Y')
        
        # Navigation
        prev_month = month - 1 if month > 1 else 12
        prev_year = year if month > 1 else year - 1
        next_month = month + 1 if month < 12 else 1
        next_year = year if month < 12 else year + 1
        prev_url = url_for('reports', timeframe='monthly', year=prev_year, month=prev_month)
        next_url = url_for('reports', timeframe='monthly', year=next_year, month=next_month)
    else:
        transactions = Transaction.query.filter(
            Transaction.user_id == current_user.id,
            db.extract('year', month_date) == year
        ).all()
        date_display = str(year)
        prev_url = url_for('reports', timeframe='yearly', year=year-1)
        next_url = url_for('reports', timeframe='yearly', year=year+1)
    
    # Calculate totals
    total_income = sum(t.amount for t in transactions if t.type == 'income')
    total_expense = sum(t.amount for t in transactions if t.type == 'expense')
    net_savings = total_income - total_expense
    
    # Category breakdown
    income_by_category = {}
    expense_by_category = {}
    for t in transactions:
        if t.type == 'income':
            income_by_category[t.category] = income_by_category.get(t.category, 0) + t.amount
        elif t.type == 'expense':
            expense_by_category[t.category] = expense_by_category.get(t.category, 0) + t.amount
    
    # Net worth calculation - filter by current user
    accounts = Account.query.filter_by(user_id=current_user.id).all()
    total_cash = sum(a.balance for a in accounts)
    loans = Loan.query.filter_by(user_id=current_user.id, status='active').all()
    total_receivables = sum(l.outstanding_balance for l in loans if l.type == 'given')
    total_payables = sum(l.outstanding_balance for l in loans if l.type == 'taken')
    total_assets = total_cash + total_receivables
    net_worth = total_assets - total_payables
    
    return render_template('reports.html',
        active_page='reports',
        timeframe=timeframe,
        year=year,
        month=month,
        date_display=date_display,
        prev_url=prev_url,
        next_url=next_url,
        total_income=total_income,
        total_expense=total_expense,
        net_savings=net_savings,
        income_by_category=income_by_category,
        expense_by_category=expense_by_category,
        net_worth=net_worth,
        total_assets=total_assets,
        total_payables=total_payables
    )


# ============ INCOME ============
@app.route('/income')
@login_required
def income():
    page = request.args.get('page', 1, type=int)
    per_page = 15
    accounts = Account.query.filter_by(user_id=current_user.id).all()
    pagination = Transaction.query.filter_by(user_id=current_user.id, type='income').order_by(Transaction.date.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return render_template('transactions.html',
        active_page='income',
        transaction_type='income',
        accounts=accounts,
        transactions=pagination.items,
        pagination=pagination,
        today=date.today().isoformat()
    )


# ============ EXPENSES ============
@app.route('/expenses')
@login_required
def expenses():
    page = request.args.get('page', 1, type=int)
    per_page = 15
    accounts = Account.query.filter_by(user_id=current_user.id).all()
    pagination = Transaction.query.filter_by(user_id=current_user.id, type='expense').order_by(Transaction.date.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return render_template('transactions.html',
        active_page='expenses',
        transaction_type='expense',
        accounts=accounts,
        transactions=pagination.items,
        pagination=pagination,
        today=date.today().isoformat()
    )


# ============ ADD TRANSACTION ============
@app.route('/transaction/add', methods=['POST'])
@login_required
def add_transaction():
    # Validate account exists and belongs to current user
    account_id_str = request.form.get('account_id')
    if not account_id_str:
        flash('Please create an account first before adding transactions.', 'error')
        return redirect(url_for('accounts'))
    
    account_id = int(account_id_str)
    account = db.session.get(Account, account_id)
    if not account or account.user_id != current_user.id:
        flash('Invalid account or access denied.', 'error')
        return redirect(url_for('accounts'))
    
    t_type = request.form.get('type')
    amount = float(request.form.get('amount'))
    t_date = datetime.strptime(request.form.get('date'), '%Y-%m-%d').date()
    category = request.form.get('category')
    description = request.form.get('description', '')
    is_recurring = request.form.get('is_recurring') == 'on'
    recurring_frequency = request.form.get('recurring_frequency') if is_recurring else None
    
    budget_month_str = request.form.get('budget_month')
    budget_month = datetime.strptime(budget_month_str, '%Y-%m-%d').date() if budget_month_str else None
    
    # Create transaction
    transaction = Transaction(
        user_id=current_user.id,
        date=t_date,
        amount=amount,
        type=t_type,
        category=category,
        account_id=account_id,
        description=description,
        is_recurring=is_recurring,
        recurring_frequency=recurring_frequency,
        budget_month=budget_month
    )
    db.session.add(transaction)
    
    # Update account balance
    if account:
        if t_type == 'income':
            account.balance += amount
        else:
            account.balance -= amount
    
    db.session.commit()
    flash(f'{t_type.capitalize()} of {amount:.2f} SAR added successfully!', 'success')
    
    return redirect(url_for('income' if t_type == 'income' else 'expenses'))


@app.route('/transaction/edit', methods=['POST'])
@login_required
def edit_transaction():
    transaction_id = int(request.form.get('id'))
    transaction = db.session.get(Transaction, transaction_id)
    
    if not transaction or transaction.user_id != current_user.id:
        flash('Transaction not found or access denied.', 'error')
        return redirect(url_for('expenses'))
    
    old_amount = transaction.amount
    old_type = transaction.type
    old_account_id = transaction.account_id
    
    # Get new values
    new_amount = float(request.form.get('amount'))
    new_type = request.form.get('type')
    new_date = datetime.strptime(request.form.get('date'), '%Y-%m-%d').date()
    new_category = request.form.get('category')
    new_account_id = int(request.form.get('account_id'))
    new_description = request.form.get('description', '')
    
    new_budget_month_str = request.form.get('budget_month')
    new_budget_month = datetime.strptime(new_budget_month_str, '%Y-%m-%d').date() if new_budget_month_str else None
    
    # Reverse old balance change
    old_account = db.session.get(Account, old_account_id)
    if old_account:
        if old_account.user_id != current_user.id:
            flash('Access denied.', 'error')
            return redirect(url_for('expenses'))
        if old_type == 'income':
            old_account.balance -= old_amount
        else:
            old_account.balance += old_amount
    
    # Apply new balance change
    new_account = db.session.get(Account, new_account_id)
    if not new_account or new_account.user_id != current_user.id:
        flash('Invalid destination account or access denied.', 'error')
        return redirect(url_for('expenses'))
        
    if new_account:
        if new_type == 'income':
            new_account.balance += new_amount
        else:
            new_account.balance -= new_amount
    
    # Update transaction
    transaction.amount = new_amount
    transaction.type = new_type
    transaction.date = new_date
    transaction.category = new_category
    transaction.account_id = new_account_id
    transaction.description = new_description
    transaction.budget_month = new_budget_month
    
    db.session.commit()
    flash('Transaction updated successfully!', 'success')
    
    return redirect(url_for('income' if new_type == 'income' else 'expenses'))


@app.route('/transaction/delete/<int:transaction_id>', methods=['POST'])
@login_required
def delete_transaction(transaction_id):
    transaction = db.session.get(Transaction, transaction_id)
    
    if transaction:
        if transaction.user_id != current_user.id:
            flash('Access denied.', 'error')
            return redirect(url_for('expenses'))
            
        # Reverse balance change
        account = db.session.get(Account, transaction.account_id)
        if account:
            if transaction.type == 'income':
                account.balance -= transaction.amount
            else:
                account.balance += transaction.amount
        
        t_type = transaction.type
        db.session.delete(transaction)
        db.session.commit()
        flash('Transaction deleted.', 'success')
        return redirect(url_for('income' if t_type == 'income' else 'expenses'))
    
    flash('Transaction not found.', 'error')
    return redirect(url_for('expenses'))


# ============ ACCOUNTS ============
@app.route('/accounts')
@login_required
def accounts():
    all_accounts = Account.query.filter_by(user_id=current_user.id).all()
    return render_template('accounts.html',
        active_page='accounts',
        accounts=all_accounts
    )


@app.route('/account/add', methods=['POST'])
@login_required
def add_account():
    account = Account(
        user_id=current_user.id,
        name=request.form.get('name'),
        type=request.form.get('type'),
        balance=float(request.form.get('balance', 0)),
        currency=request.form.get('currency', 'SAR')
    )
    db.session.add(account)
    db.session.commit()
    flash('Account created successfully!', 'success')
    return redirect(url_for('accounts'))


@app.route('/account/edit', methods=['POST'])
@login_required
def edit_account():
    account_id = int(request.form.get('id'))
    account = db.session.get(Account, account_id)
    if account:
        if account.user_id != current_user.id:
            flash('Access denied.', 'error')
            return redirect(url_for('accounts'))
            
        account.name = request.form.get('name')
        account.type = request.form.get('type')
        account.balance = float(request.form.get('balance'))
        account.currency = request.form.get('currency')
        db.session.commit()
        flash('Account updated successfully!', 'success')
    return redirect(url_for('accounts'))


@app.route('/account/delete/<int:account_id>', methods=['POST'])
@login_required
def delete_account(account_id):
    account = db.session.get(Account, account_id)
    if account:
        if account.user_id != current_user.id:
            flash('Access denied.', 'error')
            return redirect(url_for('accounts'))
            
        db.session.delete(account)
        db.session.commit()
        flash('Account deleted.', 'success')
    return redirect(url_for('accounts'))


@app.route('/transfer', methods=['POST'])
@login_required
def transfer():
    from_id = int(request.form.get('from_id'))
    to_id = int(request.form.get('to_id'))
    amount = float(request.form.get('amount'))
    
    if from_id == to_id:
        flash('Cannot transfer to the same account.', 'error')
        return redirect(url_for('accounts'))
    
    from_acc = db.session.get(Account, from_id)
    to_acc = db.session.get(Account, to_id)
    
    if from_acc and to_acc:
        if from_acc.user_id != current_user.id or to_acc.user_id != current_user.id:
            flash('Access denied.', 'error')
            return redirect(url_for('accounts'))
            
        from_acc.balance -= amount
        to_acc.balance += amount
        
        # Record transfer transaction
        transaction = Transaction(
            user_id=current_user.id,
            date=date.today(),
            amount=amount,
            type='transfer',
            category='Transfer',
            account_id=from_id,
            to_account_id=to_id,
            description=f'Transfer to {to_acc.name}',
            is_recurring=False
        )
        db.session.add(transaction)
        db.session.commit()
        flash(f'Transferred ${amount:.2f} successfully!', 'success')
    
    return redirect(url_for('accounts'))


# ============ BUDGETS ============
@app.route('/budgets')
@login_required
def budgets():
    from models import Budget
    
    today = date.today()
    month_start = date(today.year, today.month, 1)
    
    # Get all budgets for this user
    user_budgets = Budget.query.filter_by(user_id=current_user.id).all()
    
    # Calculate spending per category this month
    transactions = Transaction.query.filter(
        Transaction.user_id == current_user.id,
        db.func.coalesce(Transaction.budget_month, Transaction.date) >= month_start,
        Transaction.type == 'expense'
    ).all()
    
    expense_by_category = {}
    for t in transactions:
        expense_by_category[t.category] = expense_by_category.get(t.category, 0) + t.amount
    
    # Build budget list with progress
    budget_list = []
    for budget in user_budgets:
        spent = expense_by_category.get(budget.category, 0)
        progress_pct = (spent / budget.monthly_limit * 100) if budget.monthly_limit > 0 else 0
        remaining = budget.monthly_limit - spent
        
        status = 'safe'
        if progress_pct >= 100:
            status = 'exceeded'
        elif progress_pct >= budget.alert_threshold * 100:
            status = 'warning'
        
        budget_list.append({
            'id': budget.id,
            'category': budget.category,
            'limit': budget.monthly_limit,
            'spent': spent,
            'remaining': remaining,
            'progress_pct': min(progress_pct, 100),
            'alert_threshold': budget.alert_threshold * 100,
            'is_active': budget.is_active,
            'status': status
        })
    
    # Get categories from recent transactions for suggestions
    all_categories = set()
    recent_expenses = Transaction.query.filter_by(user_id=current_user.id, type='expense').order_by(Transaction.date.desc()).limit(100).all()
    for t in recent_expenses:
        all_categories.add(t.category)
    
    return render_template('budgets.html',
        active_page='budgets',
        budgets=budget_list,
        categories=sorted(all_categories)
    )


@app.route('/budget/add', methods=['POST'])
@login_required
def add_budget():
    from models import Budget
    
    category = request.form.get('category', '').strip()
    monthly_limit = float(request.form.get('monthly_limit', 0))
    alert_threshold = float(request.form.get('alert_threshold', 80)) / 100
    
    if not category or monthly_limit <= 0:
        flash('Please provide a category and valid limit.', 'error')
        return redirect(url_for('budgets'))
    
    # Check if budget for this category already exists
    existing = Budget.query.filter_by(user_id=current_user.id, category=category).first()
    if existing:
        flash(f'Budget for {category} already exists. Edit it instead.', 'error')
        return redirect(url_for('budgets'))
    
    budget = Budget(
        user_id=current_user.id,
        category=category,
        monthly_limit=monthly_limit,
        alert_threshold=alert_threshold
    )
    db.session.add(budget)
    db.session.commit()
    
    flash(f'Budget for {category} created: {monthly_limit:.2f} SAR/month', 'success')
    return redirect(url_for('budgets'))


@app.route('/budget/edit', methods=['POST'])
@login_required
def edit_budget():
    from models import Budget
    
    budget_id = int(request.form.get('budget_id'))
    monthly_limit = float(request.form.get('monthly_limit', 0))
    alert_threshold = float(request.form.get('alert_threshold', 80)) / 100
    
    budget = Budget.query.filter_by(id=budget_id, user_id=current_user.id).first()
    if budget:
        budget.monthly_limit = monthly_limit
        budget.alert_threshold = alert_threshold
        db.session.commit()
        flash('Budget updated successfully!', 'success')
    else:
        flash('Budget not found.', 'error')
    
    return redirect(url_for('budgets'))


@app.route('/budget/toggle/<int:budget_id>', methods=['POST'])
@login_required
def toggle_budget(budget_id):
    from models import Budget
    
    budget = Budget.query.filter_by(id=budget_id, user_id=current_user.id).first()
    if budget:
        budget.is_active = not budget.is_active
        db.session.commit()
        status = 'enabled' if budget.is_active else 'disabled'
        flash(f'Budget for {budget.category} {status}.', 'success')
    
    return redirect(url_for('budgets'))


@app.route('/budget/delete/<int:budget_id>', methods=['POST'])
@login_required
def delete_budget(budget_id):
    from models import Budget
    
    budget = Budget.query.filter_by(id=budget_id, user_id=current_user.id).first()
    if budget:
        category = budget.category
        db.session.delete(budget)
        db.session.commit()
        flash(f'Budget for {category} deleted.', 'success')
    
    return redirect(url_for('budgets'))


@app.route('/api/budgets/suggestions')
@login_required
def get_budget_suggestions():
    """Get AI-generated budget suggestions based on spending patterns."""
    from models import Budget
    from services.groq_service import generate_budget_suggestions
    from dateutil.relativedelta import relativedelta
    
    today = date.today()
    
    # Get last 3 months of transactions
    three_months_ago = today - relativedelta(months=3)
    
    month_date = db.func.coalesce(Transaction.budget_month, Transaction.date)
    transactions = Transaction.query.filter(
        Transaction.user_id == current_user.id,
        month_date >= three_months_ago,
        Transaction.type == 'expense'
    ).all()
    
    # Calculate average monthly spending per category
    expense_by_category = {}
    for t in transactions:
        expense_by_category[t.category] = expense_by_category.get(t.category, 0) + t.amount
    
    # Average over 3 months
    for cat in expense_by_category:
        expense_by_category[cat] = round(expense_by_category[cat] / 3, 2)
    
    # Get income total (last 3 months average)
    income_transactions = Transaction.query.filter(
        Transaction.user_id == current_user.id,
        month_date >= three_months_ago,
        Transaction.type == 'income'
    ).all()
    income_total = sum(t.amount for t in income_transactions) / 3
    
    # Get existing budget categories
    existing_budgets = [b.category for b in Budget.query.filter_by(user_id=current_user.id).all()]
    
    # Generate AI suggestions
    result = generate_budget_suggestions(expense_by_category, income_total, existing_budgets)
    
    return jsonify(result)


# ============ RECURRING TRANSACTIONS ============
@app.route('/recurring')
@login_required
def recurring():
    from models import RecurringTemplate
    
    templates = RecurringTemplate.query.filter_by(user_id=current_user.id).order_by(RecurringTemplate.next_due).all()
    accounts = Account.query.filter_by(user_id=current_user.id).all()
    
    # Calculate stats
    active_count = sum(1 for t in templates if not t.is_paused)
    paused_count = sum(1 for t in templates if t.is_paused)
    monthly_income = sum(t.amount for t in templates if t.type == 'income' and not t.is_paused and t.frequency == 'monthly')
    monthly_expense = sum(t.amount for t in templates if t.type == 'expense' and not t.is_paused and t.frequency == 'monthly')
    
    return render_template('recurring.html',
        active_page='recurring',
        templates=templates,
        accounts=accounts,
        active_count=active_count,
        paused_count=paused_count,
        monthly_income=monthly_income,
        monthly_expense=monthly_expense,
        today=date.today().isoformat()
    )


@app.route('/recurring/add', methods=['POST'])
@login_required
def add_recurring():
    from services.recurring_service import create_recurring_template
    
    data = {
        'amount': request.form.get('amount'),
        'type': request.form.get('type'),
        'category': request.form.get('category'),
        'account_id': request.form.get('account_id'),
        'description': request.form.get('description', ''),
        'frequency': request.form.get('frequency'),
        'start_date': request.form.get('start_date'),
        'end_date': request.form.get('end_date') or None
    }
    
    result = create_recurring_template(db, current_user.id, data)
    
    if result['success']:
        flash(f"Recurring {data['type']} created for {data['category']}!", 'success')
    else:
        flash(f"Error: {result['error']}", 'error')
    
    return redirect(url_for('recurring'))


@app.route('/recurring/pause/<int:template_id>', methods=['POST'])
@login_required
def pause_recurring(template_id):
    from services.recurring_service import pause_recurring as pause_rec
    
    if pause_rec(db, template_id, current_user.id):
        flash('Recurring transaction paused.', 'success')
    else:
        flash('Template not found.', 'error')
    
    return redirect(url_for('recurring'))


@app.route('/recurring/resume/<int:template_id>', methods=['POST'])
@login_required
def resume_recurring(template_id):
    from services.recurring_service import resume_recurring as resume_rec
    
    if resume_rec(db, template_id, current_user.id):
        flash('Recurring transaction resumed.', 'success')
    else:
        flash('Template not found.', 'error')
    
    return redirect(url_for('recurring'))


@app.route('/recurring/delete/<int:template_id>', methods=['POST'])
@login_required
def delete_recurring(template_id):
    from services.recurring_service import delete_recurring as delete_rec
    
    if delete_rec(db, template_id, current_user.id):
        flash('Recurring transaction deleted.', 'success')
    else:
        flash('Template not found.', 'error')
    
    return redirect(url_for('recurring'))


# ============ LOANS ============
@app.route('/loans')
@login_required
def loans():
    from models import LoanAccount, LoanEntry
    
    # Get all loan accounts for this user
    loan_accounts = LoanAccount.query.filter_by(user_id=current_user.id).all()
    all_accounts = Account.query.filter_by(user_id=current_user.id).all()
    
    # Calculate summary
    total_receivables = sum(la.balance for la in loan_accounts if la.type == 'receivable' and la.balance > 0)
    total_payables = sum(la.balance for la in loan_accounts if la.type == 'payable' and la.balance > 0)
    net_position = total_receivables - total_payables
    receivables_count = sum(1 for la in loan_accounts if la.type == 'receivable')
    payables_count = sum(1 for la in loan_accounts if la.type == 'payable')
    
    return render_template('loans.html',
        active_page='loans',
        loan_accounts=loan_accounts,
        accounts=all_accounts,
        total_receivables=total_receivables,
        total_payables=total_payables,
        net_position=net_position,
        receivables_count=receivables_count,
        payables_count=payables_count
    )


@app.route('/api/loans/summary')
@login_required
def get_loan_summary():
    """Get AI-generated loan summary."""
    from models import LoanAccount
    from services.groq_service import generate_loan_summary
    
    loan_accounts = LoanAccount.query.filter_by(user_id=current_user.id).all()
    accounts_data = [la.to_dict() for la in loan_accounts]
    
    summary = generate_loan_summary(accounts_data)
    return jsonify({'summary': summary})


@app.route('/loan/account/add', methods=['POST'])
@login_required
def add_loan_account():
    """Add a new loan account (person)."""
    from models import LoanAccount, LoanEntry
    
    name = request.form.get('name', '').strip()
    account_type = request.form.get('type', 'receivable')
    notes = request.form.get('notes', '').strip()
    initial_amount = request.form.get('amount')
    description = request.form.get('description', 'Initial amount')
    entry_date = request.form.get('date')
    adjust_balance = request.form.get('adjust_balance') == 'on'
    account_id = request.form.get('account_id')
    
    if not name:
        flash('Person name is required.', 'error')
        return redirect(url_for('loans'))
    
    # Create loan account
    loan_account = LoanAccount(
        user_id=current_user.id,
        name=name,
        type=account_type,
        notes=notes if notes else None
    )
    db.session.add(loan_account)
    db.session.flush()  # Get the ID
    
    # Add initial entry if amount provided
    if initial_amount:
        amount = float(initial_amount)
        if amount > 0:
            entry = LoanEntry(
                loan_account_id=loan_account.id,
                amount=amount,
                description=description,
                date=datetime.strptime(entry_date, '%Y-%m-%d').date() if entry_date else date.today()
            )
            db.session.add(entry)
            
            # Adjust account balance if requested
            if adjust_balance and account_id:
                account = db.session.get(Account, int(account_id))
                if account and account.user_id != current_user.id:
                    flash('Invalid account selected or access denied.', 'error')
                    return redirect(url_for('loans'))
                if account:
                    if account_type == 'receivable':
                        account.balance -= amount  # Money lent out
                    else:
                        account.balance += amount  # Money borrowed in
    
    db.session.commit()
    flash(f'Loan account for {name} created!', 'success')
    return redirect(url_for('loans'))


@app.route('/loan/entry/add/<int:account_id>', methods=['POST'])
@login_required
def add_loan_entry(account_id):
    """Add an entry to a loan account."""
    from models import LoanAccount, LoanEntry
    
    loan_account = db.session.get(LoanAccount, account_id)
    if not loan_account or loan_account.user_id != current_user.id:
        flash('Loan account not found or access denied.', 'error')
        return redirect(url_for('loans'))
    
    amount = float(request.form.get('amount', 0))
    entry_type = request.form.get('entry_type', 'lent')  # 'lent' or 'repaid'
    description = request.form.get('description', '')
    entry_date = request.form.get('date')
    adjust_balance = request.form.get('adjust_balance') == 'on'
    bank_account_id = request.form.get('account_id')
    
    if amount <= 0:
        flash('Amount must be positive.', 'error')
        return redirect(url_for('loans'))
    
    # Make amount negative if it's a repayment
    if entry_type == 'repaid':
        amount = -amount
    
    entry = LoanEntry(
        loan_account_id=account_id,
        amount=amount,
        description=description,
        date=datetime.strptime(entry_date, '%Y-%m-%d').date() if entry_date else date.today()
    )
    db.session.add(entry)
    
    # Adjust bank account balance if requested
    if adjust_balance and bank_account_id:
        bank_account = db.session.get(Account, int(bank_account_id))
        if bank_account and bank_account.user_id != current_user.id:
            flash('Invalid account selected or access denied.', 'error')
            return redirect(url_for('loans'))
        if bank_account:
            if loan_account.type == 'receivable':
                if entry_type == 'lent':
                    bank_account.balance -= abs(amount)  # Money going out
                else:
                    bank_account.balance += abs(amount)  # Money coming in (repaid)
            else:  # payable
                if entry_type == 'lent':
                    bank_account.balance += abs(amount)  # Money coming in (borrowed)
                else:
                    bank_account.balance -= abs(amount)  # Money going out (paying back)
    
    db.session.commit()
    
    action = 'added' if entry_type == 'lent' else 'recorded repayment'
    flash(f'Entry {action}: {abs(amount):.2f} SAR', 'success')
    return redirect(url_for('loans'))


@app.route('/loan/account/delete/<int:account_id>', methods=['POST'])
@login_required
def delete_loan_account(account_id):
    """Delete a loan account and all its entries."""
    from models import LoanAccount
    
    loan_account = db.session.get(LoanAccount, account_id)
    if loan_account and loan_account.user_id == current_user.id:
        name = loan_account.name
        db.session.delete(loan_account)
        db.session.commit()
        flash(f'Loan account for {name} deleted.', 'success')
    else:
        flash('Loan account not found or access denied.', 'error')
    
    return redirect(url_for('loans'))


@app.route('/loan/add', methods=['POST'])
@login_required
def add_loan():
    due_date = datetime.strptime(request.form.get('due_date'), '%Y-%m-%d').date()
    amount = float(request.form.get('amount'))
    emi = request.form.get('emi')
    loan_type = request.form.get('type')
    adjust_balance = request.form.get('adjust_balance') == 'on'
    account_id = request.form.get('account_id')
    
    loan = Loan(
        user_id=current_user.id,
        counterparty=request.form.get('counterparty'),
        type=loan_type,
        principal_amount=amount,
        outstanding_balance=amount,
        due_date=due_date,
        emi_amount=float(emi) if emi else None,
        status='active'
    )
    db.session.add(loan)
    
    # Adjust account balance if requested
    if adjust_balance and account_id:
        account = db.session.get(Account, int(account_id))
        if account and account.user_id != current_user.id:
            flash('Invalid account selected or access denied.', 'error')
            return redirect(url_for('loans'))
        if account:
            if loan_type == 'given':
                account.balance -= amount  # Money lent out
            else:
                account.balance += amount  # Money borrowed in
    
    db.session.commit()
    flash('Loan record created!', 'success')
    return redirect(url_for('loans'))


@app.route('/loan/pay/<int:loan_id>', methods=['POST'])
@login_required
def pay_loan(loan_id):
    loan = db.session.get(Loan, loan_id)
    if not loan or loan.user_id != current_user.id:
        flash('Loan not found or access denied.', 'error')
        return redirect(url_for('loans'))
    
    amount = float(request.form.get('amount', 0))
    account_id = request.form.get('account_id')
    
    if amount <= 0:
        flash('Invalid amount.', 'error')
        return redirect(url_for('loans'))
    
    # Reduce outstanding balance
    loan.outstanding_balance -= amount
    if loan.outstanding_balance <= 0:
        loan.outstanding_balance = 0
        loan.status = 'settled'
    
    # Adjust account balance
    if account_id:
        account = db.session.get(Account, int(account_id))
        if account and account.user_id != current_user.id:
            flash('Invalid account selected or access denied.', 'error')
            return redirect(url_for('loans'))
        if account:
            if loan.type == 'given':
                # Receiving payment = money comes in
                account.balance += amount
            else:
                # Paying debt = money goes out
                account.balance -= amount
    
    db.session.commit()
    
    if loan.status == 'settled':
        flash(f'Loan fully settled!', 'success')
    else:
        flash(f'Payment of {amount:.2f} SAR recorded. Remaining: {loan.outstanding_balance:.2f} SAR', 'success')
    
    return redirect(url_for('loans'))


@app.route('/loan/delete/<int:loan_id>', methods=['POST'])
@login_required
def delete_loan(loan_id):
    loan = db.session.get(Loan, loan_id)
    if loan:
        if loan.user_id != current_user.id:
            flash('Access denied.', 'error')
            return redirect(url_for('loans'))
        db.session.delete(loan)
        db.session.commit()
        flash('Loan record deleted.', 'success')
    else:
        flash('Loan record not found.', 'error')
    return redirect(url_for('loans'))


# ============ AI CHAT ============
@app.route('/chat')
@login_required
def chat():
    # Get recent chat history to display
    chat_history = ChatMessage.query.filter_by(user_id=current_user.id).order_by(ChatMessage.created_at.desc()).limit(50).all()
    chat_history.reverse()  # Show oldest first
    return render_template('chat.html', active_page='chat', chat_history=chat_history)


@app.route('/api/chat', methods=['POST'])
@login_required
def chat_api():
    from services.groq_service import process_chat_command
    
    data = request.get_json()
    message = data.get('message', '')
    
    if not message:
        return jsonify({'response': 'Please enter a message.'})
    
    # Save user message to chat history
    user_msg = ChatMessage(
        user_id=current_user.id,
        role='user',
        content=message
    )
    db.session.add(user_msg)
    db.session.commit()
    
    # Get recent chat history for AI context (last 10 messages)
    recent_history = ChatMessage.query.filter_by(user_id=current_user.id).order_by(ChatMessage.created_at.desc()).limit(10).all()
    recent_history.reverse()  # Oldest first
    chat_history = [{'role': m.role, 'content': m.content} for m in recent_history]
    
    # Get accounts for AI context - filter by current user
    accounts = [a.to_dict() for a in Account.query.filter_by(user_id=current_user.id).all()]
    
    # Get transactions for this month for AI analysis
    today = date.today()
    month_start = date(today.year, today.month, 1)
    transactions = [t.to_dict() for t in Transaction.query.filter(
        Transaction.user_id == current_user.id,
        db.func.coalesce(Transaction.budget_month, Transaction.date) >= month_start
    ).order_by(Transaction.date.desc()).all()]
    
    # Get active loans for AI analysis
    loans = [l.to_dict() for l in Loan.query.filter_by(user_id=current_user.id, status='active').all()]
    
    # Process with Groq AI - now with full financial context and chat history
    result = process_chat_command(message, accounts, transactions, loans, chat_history)
    
    response_msg = result.get('response_message', 'Done.')
    action = result.get('action', 'unknown')
    details = result.get('details', {})
    
    try:
        # For analysis queries, just return the AI response
        if action == 'analysis':
            return jsonify({'response': response_msg})
        
        elif action == 'transaction':
            # First check if any accounts exist
            if not accounts:
                response_msg = "You need to create an account first. Go to Accounts page to add one."
            else:
                t_type = details.get('type', 'expense')
                amount = float(details.get('amount', 0))
                category = details.get('category', 'Other')
                description = details.get('description', '')
                account_id = details.get('account_id') or accounts[0]['id']
                
                # Verify account exists in DB
                account = db.session.get(Account, int(account_id))
                if not account:
                    response_msg = "Invalid account. Please create an account first."
                else:
                    transaction = Transaction(
                        user_id=current_user.id,
                        date=date.today(),
                        amount=amount,
                        type=t_type,
                        category=category,
                        account_id=int(account_id),
                        description=description,
                        is_recurring=False
                    )
                    db.session.add(transaction)
                    
                    # Update balance
                    if t_type == 'income':
                        account.balance += amount
                    else:
                        account.balance -= amount
                    
                    db.session.commit()
        
        elif action == 'transfer':
            from_id = details.get('from_account_id')
            to_id = details.get('to_account_id')
            amount = float(details.get('amount', 0))
            
            if from_id and to_id:
                from_acc = db.session.get(Account, int(from_id))
                to_acc = db.session.get(Account, int(to_id))
                
                if from_acc and to_acc:
                    from_acc.balance -= amount
                    to_acc.balance += amount
                    
                    transaction = Transaction(
                        user_id=current_user.id,
                        date=date.today(),
                        amount=amount,
                        type='transfer',
                        category='Transfer',
                        account_id=int(from_id),
                        to_account_id=int(to_id),
                        description=f'AI Transfer to {to_acc.name}',
                        is_recurring=False
                    )
                    db.session.add(transaction)
                    db.session.commit()
        
        elif action == 'update_balance':
            account_id = details.get('account_id')
            amount = float(details.get('amount', 0))
            
            if account_id:
                account = db.session.get(Account, int(account_id))
                if account:
                    account.balance = amount
                    db.session.commit()
    
    except Exception as e:
        print(f"Error processing AI action: {e}")
        response_msg = "I understood your request but encountered an error processing it."
    
    # Save AI response to chat history
    ai_msg = ChatMessage(
        user_id=current_user.id,
        role='assistant',
        content=response_msg
    )
    db.session.add(ai_msg)
    db.session.commit()
    
    return jsonify({'response': response_msg})


@app.route('/api/chat/clear', methods=['POST'])
@login_required
def clear_chat_history():
    """Clear all chat history for the current user."""
    ChatMessage.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    return jsonify({'success': True})


# ============ TELEGRAM BOT ============
@app.route('/api/telegram/webhook', methods=['POST'])
def telegram_webhook():
    """Handle incoming Telegram webhook updates."""
    from services.telegram_service import (
        process_telegram_update, send_telegram_message, 
        format_response_for_telegram, generate_link_code
    )
    from services.groq_service import process_chat_command
    from models import TelegramUser
    
    update = request.get_json()
    if not update:
        return 'OK', 200
        
    secret_token = os.environ.get('TELEGRAM_WEBHOOK_SECRET')
    if secret_token:
        header_token = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
        if header_token != secret_token:
            return 'Unauthorized', 401
    
    parsed = process_telegram_update(update)
    if not parsed or not parsed.get('text'):
        return 'OK', 200
    
    telegram_id = parsed['telegram_id']
    chat_id = parsed['chat_id']
    text = parsed['text'].strip()
    username = parsed.get('username', '')
    first_name = parsed.get('first_name', 'User')
    
    # Handle /start command - auto signup/login
    if text.startswith('/start'):
        # Check if user is already linked
        tg_user = TelegramUser.query.filter_by(telegram_id=telegram_id, verified=True).first()
        
        if tg_user:
            # Existing user - generate login code
            import secrets
            login_code = secrets.token_urlsafe(6)[:8].upper()
            tg_user.link_code = f"LOGIN:{login_code}"
            db.session.commit()
            
            send_telegram_message(chat_id, 
                f"👋 Welcome back, *{tg_user.user.name}*!\n\n"
                f"🔐 Your login code: `{login_code}`\n"
                "Use this to sign in on the web.\n\n"
                "Or send me messages like:\n"
                "• `Paid 50 for lunch`\n"
                "• `Show my balance`\n"
                "• `What did I spend this week?`"
            )
        else:
            # New user - auto create account
            import secrets
            import string
            
            # Generate a random password
            alphabet = string.ascii_letters + string.digits
            random_password = ''.join(secrets.choice(alphabet) for _ in range(12))
            
            # Create email from telegram username or ID
            email = f"{username}@telegram.user" if username else f"tg_{telegram_id}@telegram.user"
            
            # Check if email exists (shouldn't happen, but safety check)
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                email = f"tg_{telegram_id}_{secrets.token_hex(4)}@telegram.user"
            
            # Create new user
            new_user = User(name=first_name, email=email)
            new_user.set_password(random_password)
            db.session.add(new_user)
            db.session.flush()  # Get the user ID
            
            # Create and link telegram account
            tg_user = TelegramUser(
                telegram_id=telegram_id,
                user_id=new_user.id,
                telegram_username=username,
                telegram_first_name=first_name,
                verified=True
            )
            db.session.add(tg_user)
            
            # Create default Cash account
            default_account = Account(
                user_id=new_user.id,
                name='Cash',
                type='cash',
                balance=0.0,
                currency='SAR'
            )
            db.session.add(default_account)
            
            # Generate login code for immediate web access
            login_code = secrets.token_urlsafe(6)[:8].upper()
            tg_user.link_code = f"LOGIN:{login_code}"
            
            db.session.commit()
            
            send_telegram_message(chat_id,
                f"🎉 *Welcome to FinPulse, {first_name}!*\n\n"
                f"Your account has been created automatically!\n\n"
                f"🌐 *Set Up Your Accounts:*\n"
                f"Visit https://awaisai.pythonanywhere.com to add your bank accounts, cards, and wallets for better tracking.\n"
                f"🔐 *Web Login Code:* `{login_code}`\n"
                f"Go to the login page and enter this code.\n\n"
                f"Or start using me right away:\n"
                f"• `Paid 50 for lunch` - Add expense\n"
                f"• `Received 1000 salary` - Add income\n"
                f"• `Show my balance` - Check balances\n\n"
                f"💡 Send /login anytime to get a new web login code."
            )
        return 'OK', 200
    
    # Handle /unlink command
    if text == '/unlink':
        tg_user = TelegramUser.query.filter_by(telegram_id=telegram_id).first()
        if tg_user:
            db.session.delete(tg_user)
            db.session.commit()
            send_telegram_message(chat_id, "✅ Your account has been unlinked.")
        else:
            send_telegram_message(chat_id, "❌ No linked account found.")
        return 'OK', 200
    
    # Handle /resetpassword command
    if text == '/resetpassword' or text.startswith('/resetpassword '):
        tg_user = TelegramUser.query.filter_by(telegram_id=telegram_id, verified=True).first()
        
        if not tg_user:
            send_telegram_message(chat_id,
                "⚠️ You must link your Telegram account first.\n\n"
                "Send /start to get a link code."
            )
            return 'OK', 200
        
        # Check if new password provided
        parts = text.split(' ', 1)
        if len(parts) > 1 and len(parts[1].strip()) >= 6:
            # User provided new password
            new_password = parts[1].strip()
        else:
            # Generate random password
            import secrets
            import string
            alphabet = string.ascii_letters + string.digits
            new_password = ''.join(secrets.choice(alphabet) for _ in range(10))
        
        # Update user's password
        user = tg_user.user
        user.set_password(new_password)
        db.session.commit()
        
        send_telegram_message(chat_id,
            f"🔐 *Password Reset Successful!*\n\n"
            f"Your new password: `{new_password}`\n\n"
            f"Email: {user.email}\n\n"
            "⚠️ Please save this password and delete this message for security.\n\n"
            "💡 Tip: Send `/resetpassword YourNewPassword` to set a custom password."
        )
        return 'OK', 200
    
    # Handle /login command - generate one-time login code
    if text == '/login':
        tg_user = TelegramUser.query.filter_by(telegram_id=telegram_id, verified=True).first()
        
        if not tg_user:
            send_telegram_message(chat_id,
                "⚠️ You must link your Telegram account first.\n\n"
                "Send /start to get a link code."
            )
            return 'OK', 200
        
        # Generate a temporary login code (valid for 5 minutes)
        import secrets
        login_code = secrets.token_urlsafe(6)[:8].upper()
        
        # Store the login code in the link_code field with a timestamp
        tg_user.link_code = f"LOGIN:{login_code}"
        db.session.commit()
        
        send_telegram_message(chat_id,
            f"🔐 *Web Login Code*\n\n"
            f"Your login code: `{login_code}`\n\n"
            f"Go to the login page and click *'Login with Telegram'*\n"
            f"Enter this code to sign in.\n\n"
            f"⚠️ Code expires in 5 minutes."
        )
        return 'OK', 200
    
    # Check if user is linked
    tg_user = TelegramUser.query.filter_by(telegram_id=telegram_id, verified=True).first()
    
    if not tg_user:
        send_telegram_message(chat_id,
            "⚠️ Your Telegram is not linked to a FinPulse account.\n\n"
            "Send /start to get a link code."
        )
        return 'OK', 200
    
    # Get user's financial data
    user_id = tg_user.user_id
    accounts = [a.to_dict() for a in Account.query.filter_by(user_id=user_id).all()]
    
    if not accounts:
        send_telegram_message(chat_id, "❌ No accounts found. Please create an account in FinPulse first.")
        return 'OK', 200
    
    # Get transactions and loans for context
    today = date.today()
    month_start = date(today.year, today.month, 1)
    transactions = [t.to_dict() for t in Transaction.query.filter(
        Transaction.user_id == user_id,
        db.func.coalesce(Transaction.budget_month, Transaction.date) >= month_start
    ).order_by(Transaction.date.desc()).all()]
    loans = [l.to_dict() for l in Loan.query.filter_by(user_id=user_id, status='active').all()]
    
    # Process with AI
    result = process_chat_command(text, accounts, transactions, loans)
    
    action = result.get('action', 'unknown')
    details = result.get('details', {})
    
    # Execute action if needed
    if action == 'transaction':
        t_type = details.get('type', 'expense')
        amount = float(details.get('amount', 0))
        category = details.get('category', 'Other')
        description = details.get('description', '')
        account_id = details.get('account_id') or accounts[0]['id']
        
        account = db.session.get(Account, int(account_id))
        if account:
            transaction = Transaction(
                user_id=user_id,
                date=date.today(),
                amount=amount,
                type=t_type,
                category=category,
                account_id=int(account_id),
                description=description,
                is_recurring=False
            )
            db.session.add(transaction)
            
            if t_type == 'income':
                account.balance += amount
            else:
                account.balance -= amount
            
            db.session.commit()
    
    elif action == 'transfer':
        from_id = details.get('from_account_id')
        to_id = details.get('to_account_id')
        amount = float(details.get('amount', 0))
        
        if from_id and to_id:
            from_acc = db.session.get(Account, int(from_id))
            to_acc = db.session.get(Account, int(to_id))
            
            if from_acc and to_acc:
                from_acc.balance -= amount
                to_acc.balance += amount
                db.session.commit()
    
    elif action == 'loan':
        amount = float(details.get('amount', 0))
        loan_type = details.get('type', 'given')
        counterparty = details.get('counterparty', 'Unknown')
        due_date_str = details.get('due_date')
        
        if due_date_str:
            try:
                due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
            except:
                due_date = date.today() + timedelta(days=30)
        else:
            due_date = date.today() + timedelta(days=30)
        
        loan = Loan(
            user_id=user_id,
            counterparty=counterparty,
            type=loan_type,
            principal_amount=amount,
            outstanding_balance=amount,
            due_date=due_date,
            status='active'
        )
        db.session.add(loan)
        
        # Adjust account balance - use first account
        if accounts:
            account = db.session.get(Account, int(accounts[0]['id']))
            if account:
                if loan_type == 'taken':
                    # Borrowed money comes in
                    account.balance += amount
                else:
                    # Lent money goes out
                    account.balance -= amount
        
        db.session.commit()
    
    # Fetch updated account balances for response
    updated_accounts = Account.query.filter_by(user_id=user_id).all()
    
    # Send response with balance info
    response_text = format_response_for_telegram(result)
    
    # Add account balances to response for action types
    if action in ['transaction', 'transfer', 'loan']:
        balance_lines = "\n\n💳 *Account Balances:*"
        total = 0
        for acc in updated_accounts:
            balance_lines += f"\n• {acc.name}: {acc.balance:,.2f} SAR"
            total += acc.balance
        balance_lines += f"\n*Total: {total:,.2f} SAR*"
        response_text += balance_lines
    
    send_telegram_message(chat_id, response_text)
    
    return 'OK', 200


@app.route('/telegram')
@login_required
def telegram_setup():
    """Telegram bot management page."""
    from services.telegram_service import get_webhook_info, get_bot_info
    from models import TelegramUser
    
    bot_info = get_bot_info()
    webhook_info = get_webhook_info()
    
    # Get linked Telegram account for current user
    tg_user = TelegramUser.query.filter_by(user_id=current_user.id, verified=True).first()
    
    server_url = 'https://awaisai.pythonanywhere.com'
    webhook_url = f"{server_url}/api/telegram/webhook"
    
    # Mask bot token for display
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN', '')
    if bot_token:
        bot_token_display = bot_token[:8] + '...' + bot_token[-4:] if len(bot_token) > 12 else '***'
    else:
        bot_token_display = ''
    
    return render_template('telegram.html',
        active_page='telegram',
        bot_info=bot_info,
        webhook_info=webhook_info,
        webhook_url=webhook_url,
        tg_user=tg_user,
        bot_token_configured=bool(bot_token),
        bot_token_display=bot_token_display
    )


@app.route('/api/telegram/send-daily-reports', methods=['POST'])
def send_daily_telegram_reports():
    """
    Send daily financial reports to all verified Telegram users.
    Can be triggered manually or by external cron job.
    
    Optional JSON body:
    {
        "user_id": 123  // Send only to this user (for testing)
    }
    """
    from services.daily_report_service import send_daily_reports, send_report_to_user
    
    data = request.get_json(silent=True) or {}
    
    # If specific user_id provided, send only to that user
    if 'user_id' in data:
        result = send_report_to_user(int(data['user_id']))
        return jsonify(result)
    
    # Otherwise, send to all users
    result = send_daily_reports()
    return jsonify({
        'success': result['failure_count'] == 0,
        'sent': result['success_count'],
        'failed': result['failure_count'],
        'total_users': result['total_users'],
        'message': f"Sent {result['success_count']} of {result['total_users']} daily reports"
    })


@app.route('/telegram/save-token', methods=['POST'])
@login_required
def telegram_save_token():
    """Save Telegram bot token to .env file."""
    bot_token = request.form.get('bot_token', '').strip()
    
    if not bot_token:
        flash('Bot token is required.', 'error')
        return redirect(url_for('telegram_setup'))
    
    # Update .env file (preserves all other values)
    update_env_file({'TELEGRAM_BOT_TOKEN': bot_token})
    
    # Also update the telegram service module
    import services.telegram_service as tg_svc
    tg_svc.TELEGRAM_BOT_TOKEN = bot_token
    tg_svc.TELEGRAM_API_URL = f"https://api.telegram.org/bot{bot_token}"
    
    flash('Bot token saved! The bot is now configured.', 'success')
    return redirect(url_for('telegram_setup'))


@app.route('/telegram/link', methods=['POST'])
@login_required
def telegram_link():
    """Link Telegram account using code."""
    from models import TelegramUser
    
    link_code = request.form.get('link_code', '').strip().upper()
    
    if not link_code:
        flash('Please enter a link code.', 'error')
        return redirect(url_for('telegram_setup'))
    
    # Find telegram user with this code
    tg_user = TelegramUser.query.filter_by(link_code=link_code).first()
    
    if not tg_user:
        flash('Invalid link code. Please get a new code by sending /start to the bot.', 'error')
        return redirect(url_for('telegram_setup'))
    
    # Check if already linked to another user
    if tg_user.verified and tg_user.user_id != current_user.id:
        flash('This Telegram account is already linked to another user.', 'error')
        return redirect(url_for('telegram_setup'))
    
    # Link to current user
    tg_user.user_id = current_user.id
    tg_user.verified = True
    tg_user.link_code = None  # Clear the code
    db.session.commit()
    
    # Send confirmation to Telegram
    from services.telegram_service import send_telegram_message
    send_telegram_message(tg_user.telegram_id,
        f"✅ *Account linked successfully!*\n\n"
        f"Welcome, {current_user.name}! You can now:\n"
        "• `Paid 50 for lunch` - Add expense\n"
        "• `Received 1000 salary` - Add income\n"
        "• `Show my balance` - Check balances\n"
        "• `What did I spend this week?` - Get insights"
    )
    
    flash(f'Telegram account @{tg_user.telegram_username or tg_user.telegram_first_name} linked successfully!', 'success')
    return redirect(url_for('telegram_setup'))


@app.route('/telegram/unlink', methods=['POST'])
@login_required
def telegram_unlink():
    """Unlink Telegram account."""
    from models import TelegramUser
    
    tg_user = TelegramUser.query.filter_by(user_id=current_user.id, verified=True).first()
    
    if tg_user:
        db.session.delete(tg_user)
        db.session.commit()
        flash('Telegram account unlinked.', 'success')
    else:
        flash('No linked Telegram account found.', 'error')
    
    return redirect(url_for('telegram_setup'))


@app.route('/telegram/set-webhook', methods=['POST'])
@login_required
def telegram_set_webhook():
    """Set the Telegram webhook URL."""
    from services.telegram_service import set_webhook
    
    webhook_url = request.form.get('webhook_url', '').strip()
    
    if not webhook_url:
        flash('Webhook URL is required.', 'error')
        return redirect(url_for('telegram_setup'))
    
    result = set_webhook(webhook_url)
    
    if result.get('success'):
        flash('Webhook set successfully!', 'success')
    else:
        flash(f"Failed to set webhook: {result.get('error') or result.get('description')}", 'error')
    
    return redirect(url_for('telegram_setup'))


# ============ ADMIN ============
ADMIN_PIN = os.getenv('ADMIN_PIN', '7562')

# Default models list (will be updated from Groq API)
GROQ_MODELS = [
    {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B (Recommended)"},
    {"id": "llama-3.1-70b-versatile", "name": "Llama 3.1 70B"},
    {"id": "llama-3.1-8b-instant", "name": "Llama 3.1 8B (Faster)"},
    {"id": "mixtral-8x7b-32768", "name": "Mixtral 8x7B"},
    {"id": "gemma2-9b-it", "name": "Gemma 2 9B"},
]

@app.route('/admin')
def admin():
    authenticated = session.get('admin_auth') == True
    
    api_key = os.getenv('GROQ_API_KEY', '')
    # Mask API key for display
    if api_key:
        api_key_display = api_key[:8] + '...' + api_key[-4:] if len(api_key) > 12 else '***'
    else:
        api_key_display = ''
    
    model = os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')
    
    # System statistics
    stats = {}
    users_list = []
    if authenticated:
        from models import TelegramUser
        stats = {
            'total_users': User.query.count(),
            'total_accounts': Account.query.count(),
            'total_transactions': Transaction.query.count(),
            'total_loans': Loan.query.count(),
            'total_chat_messages': ChatMessage.query.count(),
            'telegram_linked': TelegramUser.query.filter_by(verified=True).count(),
        }
        
        # Get all users with their stats
        all_users = User.query.order_by(User.created_at.desc()).all()
        for u in all_users:
            tg = TelegramUser.query.filter_by(user_id=u.id, verified=True).first()
            users_list.append({
                'id': u.id,
                'name': u.name,
                'email': u.email,
                'created_at': u.created_at,
                'accounts_count': Account.query.filter_by(user_id=u.id).count(),
                'transactions_count': Transaction.query.filter_by(user_id=u.id).count(),
                'telegram_linked': tg is not None,
                'telegram_username': tg.telegram_username if tg else None,
            })
    
    # Feature flags
    maintenance_mode = os.getenv('MAINTENANCE_MODE', 'false').lower() == 'true'
    registration_open = os.getenv('REGISTRATION_OPEN', 'true').lower() == 'true'
    
    return render_template('admin.html',
        active_page='admin',
        authenticated=authenticated,
        api_key=api_key_display,
        model=model,
        models=GROQ_MODELS,
        stats=stats,
        users=users_list,
        maintenance_mode=maintenance_mode,
        registration_open=registration_open
    )


@app.route('/admin/fetch-models', methods=['POST'])
def admin_fetch_models():
    """Fetch available models from Groq API."""
    global GROQ_MODELS
    
    if session.get('admin_auth') is not True:
        return redirect(url_for('admin'))
    
    api_key = os.getenv('GROQ_API_KEY', '')
    if not api_key:
        flash('Please set your Groq API key first.', 'error')
        return redirect(url_for('admin'))
    
    import requests
    try:
        response = requests.get(
            'https://api.groq.com/openai/v1/models',
            headers={'Authorization': f'Bearer {api_key}'},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            models = data.get('data', [])
            
            # Filter and format models (exclude whisper/audio models)
            GROQ_MODELS = []
            for m in models:
                model_id = m.get('id', '')
                # Skip audio/whisper models
                if 'whisper' in model_id.lower():
                    continue
                
                # Format name nicely
                name = model_id.replace('-', ' ').title()
                if '70b' in model_id.lower():
                    name += ' (Large)'
                elif '8b' in model_id.lower():
                    name += ' (Fast)'
                
                GROQ_MODELS.append({
                    'id': model_id,
                    'name': name
                })
            
            # Sort by name
            GROQ_MODELS.sort(key=lambda x: x['name'])
            
            flash(f'Fetched {len(GROQ_MODELS)} models from Groq!', 'success')
        else:
            flash(f'Failed to fetch models: {response.status_code}', 'error')
            
    except Exception as e:
        flash(f'Error fetching models: {str(e)}', 'error')
    
    return redirect(url_for('admin'))


@app.route('/admin/auth', methods=['POST'])
def admin_auth():
    pin = request.form.get('pin', '')
    
    if pin == ADMIN_PIN:
        session.permanent = True
        session['admin_auth'] = True
        flash('Admin access granted.', 'success')
        return redirect(url_for('admin'))
    else:
        flash('Invalid PIN.', 'error')
        return redirect(url_for('admin'))


@app.route('/admin/save', methods=['POST'])
def admin_save():
    if session.get('admin_auth') is not True:
        return redirect(url_for('admin'))
    
    api_key = request.form.get('api_key', '')
    model = request.form.get('model', 'llama-3.3-70b-versatile')
    custom_model = request.form.get('custom_model', '').strip()
    
    # Use custom model if selected
    if model == '__custom__' and custom_model:
        model = custom_model
    
    # Update .env file (preserves all other values like TELEGRAM_BOT_TOKEN)
    update_env_file({
        'GROQ_API_KEY': api_key,
        'GROQ_MODEL': model
    })
    
    flash(f'Settings saved! Model: {model}', 'success')
    return redirect(url_for('admin'))


@app.route('/admin/reset', methods=['POST'])
def admin_reset():
    if session.get('admin_auth') is not True:
        return redirect(url_for('admin'))
    
    # Delete all records
    Transaction.query.delete()
    Loan.query.delete()
    Account.query.delete()
    db.session.commit()
    
    flash('Database reset complete.', 'success')
    return redirect(url_for('admin'))


@app.route('/admin/delete-user/<int:user_id>', methods=['POST'])
def admin_delete_user(user_id):
    """Delete a user and all their data."""
    if session.get('admin_auth') is not True:
        return redirect(url_for('admin'))
    
    from models import TelegramUser
    
    user = db.session.get(User, user_id)
    if not user:
        flash('User not found.', 'error')
        return redirect(url_for('admin'))
    
    # Delete related data
    ChatMessage.query.filter_by(user_id=user_id).delete()
    Transaction.query.filter_by(user_id=user_id).delete()
    Loan.query.filter_by(user_id=user_id).delete()
    Account.query.filter_by(user_id=user_id).delete()
    TelegramUser.query.filter_by(user_id=user_id).delete()
    
    # Delete user
    db.session.delete(user)
    db.session.commit()
    
    flash(f'User {user.name} deleted.', 'success')
    return redirect(url_for('admin'))


@app.route('/admin/change-pin', methods=['POST'])
def admin_change_pin():
    """Change admin PIN."""
    global ADMIN_PIN
    
    if session.get('admin_auth') is not True:
        return redirect(url_for('admin'))
    
    current_pin = request.form.get('current_pin', '')
    new_pin = request.form.get('new_pin', '')
    
    if current_pin != ADMIN_PIN:
        flash('Current PIN is incorrect.', 'error')
        return redirect(url_for('admin'))
    
    if len(new_pin) != 4 or not new_pin.isdigit():
        flash('New PIN must be exactly 4 digits.', 'error')
        return redirect(url_for('admin'))
    
    ADMIN_PIN = new_pin
    update_env_file({'ADMIN_PIN': new_pin})
    
    flash('Admin PIN changed successfully.', 'success')
    return redirect(url_for('admin'))


@app.route('/admin/toggle-feature', methods=['POST'])
def admin_toggle_feature():
    """Toggle feature flags."""
    if session.get('admin_auth') is not True:
        return redirect(url_for('admin'))
    
    feature = request.form.get('feature', '')
    
    if feature == 'maintenance':
        current = os.getenv('MAINTENANCE_MODE', 'false').lower() == 'true'
        update_env_file({'MAINTENANCE_MODE': 'false' if current else 'true'})
        os.environ['MAINTENANCE_MODE'] = 'false' if current else 'true'
        flash(f"Maintenance mode {'disabled' if current else 'enabled'}.", 'success')
    
    elif feature == 'registration':
        current = os.getenv('REGISTRATION_OPEN', 'true').lower() == 'true'
        update_env_file({'REGISTRATION_OPEN': 'false' if current else 'true'})
        os.environ['REGISTRATION_OPEN'] = 'false' if current else 'true'
        flash(f"Registration {'closed' if current else 'opened'}.", 'success')
    
    return redirect(url_for('admin'))


@app.route('/admin/export-users')
def admin_export_users():
    """Export all users to CSV."""
    if session.get('admin_auth') is not True:
        return redirect(url_for('admin'))
    
    from models import TelegramUser
    import io
    import csv
    from flask import Response
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['ID', 'Name', 'Email', 'Created At', 'Accounts', 'Transactions', 'Telegram Linked', 'Telegram Username'])
    
    # Data
    users = User.query.order_by(User.created_at.desc()).all()
    for u in users:
        tg = TelegramUser.query.filter_by(user_id=u.id, verified=True).first()
        writer.writerow([
            u.id,
            u.name,
            u.email,
            u.created_at.strftime('%Y-%m-%d %H:%M') if u.created_at else '',
            Account.query.filter_by(user_id=u.id).count(),
            Transaction.query.filter_by(user_id=u.id).count(),
            'Yes' if tg else 'No',
            tg.telegram_username if tg else ''
        ])
    
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=finpulse_users.csv'}
    )


@app.route('/admin/clear-all-chat', methods=['POST'])
def admin_clear_all_chat():
    """Clear all chat history for all users."""
    if session.get('admin_auth') is not True:
        return redirect(url_for('admin'))
    
    count = ChatMessage.query.count()
    ChatMessage.query.delete()
    db.session.commit()
    
    flash(f'Cleared {count} chat messages.', 'success')
    return redirect(url_for('admin'))


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)


# Cloudflare Workers Python entrypoint wrapper
try:
    from workers import WorkerEntrypoint, asgi
    from a2wsgi import WSGIMiddleware
    
    # Wrap WSGI Flask app to convert it to an ASGI application
    asgi_app = WSGIMiddleware(app)
    
    class Default(WorkerEntrypoint):
        async def fetch(self, request):
            # Pass ASGI app and request environment context to the Workers ASGI runner
            return await asgi.fetch(asgi_app, request, self.env)
            
except ImportError:
    # Ignored if running in normal Python environment
    pass

