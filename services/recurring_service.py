"""
Recurring Transaction Service for FinPulse
Handles automatic generation of recurring transactions.
"""
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta


def calculate_next_due(current_date: date, frequency: str) -> date:
    """Calculate the next due date based on frequency."""
    if frequency == 'daily':
        return current_date + timedelta(days=1)
    elif frequency == 'weekly':
        return current_date + timedelta(weeks=1)
    elif frequency == 'monthly':
        return current_date + relativedelta(months=1)
    elif frequency == 'yearly':
        return current_date + relativedelta(years=1)
    else:
        return current_date + relativedelta(months=1)  # Default to monthly


def process_recurring_transactions(db, user_id: int) -> dict:
    """
    Process all pending recurring transactions for a user.
    Called on dashboard load.
    
    Returns dict with:
        - generated_count: number of transactions generated
        - transactions: list of generated transaction details
    """
    from models import RecurringTemplate, Transaction, Account
    
    today = date.today()
    generated = []
    
    # Get all active recurring templates for this user that are due
    templates = RecurringTemplate.query.filter(
        RecurringTemplate.user_id == user_id,
        RecurringTemplate.is_paused == False,
        RecurringTemplate.next_due <= today
    ).all()
    
    for template in templates:
        # Check if end date has passed
        if template.end_date and template.end_date < today:
            template.is_paused = True
            continue
        
        # Generate transactions for all missed dates
        current_due = template.next_due
        while current_due <= today:
            # Check end date
            if template.end_date and current_due > template.end_date:
                template.is_paused = True
                break
            
            # Create the transaction
            account = db.session.get(Account, template.account_id)
            if not account:
                break
            
            transaction = Transaction(
                user_id=user_id,
                date=current_due,
                amount=template.amount,
                type=template.type,
                category=template.category,
                account_id=template.account_id,
                description=f"[Auto] {template.description}" if template.description else "[Auto] Recurring",
                is_recurring=True,
                recurring_frequency=template.frequency
            )
            db.session.add(transaction)
            
            # Update account balance
            if template.type == 'income':
                account.balance += template.amount
            else:
                account.balance -= template.amount
            
            generated.append({
                'amount': template.amount,
                'type': template.type,
                'category': template.category,
                'date': current_due.isoformat(),
                'description': template.description
            })
            
            # Update template
            template.last_generated = current_due
            current_due = calculate_next_due(current_due, template.frequency)
        
        # Set next due date
        template.next_due = current_due
    
    db.session.commit()
    
    return {
        'generated_count': len(generated),
        'transactions': generated
    }


def create_recurring_template(db, user_id: int, data: dict) -> dict:
    """
    Create a new recurring transaction template.
    
    Args:
        db: Database session
        user_id: User ID
        data: Dict with amount, type, category, account_id, description, frequency, start_date, end_date
    
    Returns:
        Dict with success status and template info
    """
    from models import RecurringTemplate
    
    try:
        start_date = data.get('start_date', date.today())
        if isinstance(start_date, str):
            from datetime import datetime
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        
        end_date = data.get('end_date')
        if end_date and isinstance(end_date, str):
            from datetime import datetime
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        template = RecurringTemplate(
            user_id=user_id,
            amount=float(data['amount']),
            type=data['type'],
            category=data['category'],
            account_id=int(data['account_id']),
            description=data.get('description', ''),
            frequency=data['frequency'],
            start_date=start_date,
            end_date=end_date,
            next_due=start_date  # First occurrence is on start date
        )
        
        db.session.add(template)
        db.session.commit()
        
        return {
            'success': True,
            'template': template.to_dict()
        }
    except Exception as e:
        db.session.rollback()
        return {
            'success': False,
            'error': str(e)
        }


def pause_recurring(db, template_id: int, user_id: int) -> bool:
    """Pause a recurring template."""
    from models import RecurringTemplate
    
    template = RecurringTemplate.query.filter_by(id=template_id, user_id=user_id).first()
    if template:
        template.is_paused = True
        db.session.commit()
        return True
    return False


def resume_recurring(db, template_id: int, user_id: int) -> bool:
    """Resume a paused recurring template."""
    from models import RecurringTemplate
    
    template = RecurringTemplate.query.filter_by(id=template_id, user_id=user_id).first()
    if template:
        template.is_paused = False
        # If next_due is in the past, set it to today
        if template.next_due < date.today():
            template.next_due = date.today()
        db.session.commit()
        return True
    return False


def delete_recurring(db, template_id: int, user_id: int) -> bool:
    """Delete a recurring template."""
    from models import RecurringTemplate
    
    template = RecurringTemplate.query.filter_by(id=template_id, user_id=user_id).first()
    if template:
        db.session.delete(template)
        db.session.commit()
        return True
    return False
