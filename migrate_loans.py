"""
Migration script to convert old Loan records to new LoanAccount + LoanEntry structure.

The old Loan model stored:
- counterparty (person name)
- type: 'given' (you lent) or 'taken' (you borrowed)
- principal_amount
- outstanding_balance
- due_date
- status

The new model uses:
- LoanAccount: represents a person/entity
  - type: 'receivable' (they owe you) or 'payable' (you owe them)
- LoanEntry: individual transactions under a LoanAccount
  - amount: positive = lent/borrowed, negative = repaid

This script:
1. Groups old loans by counterparty
2. Creates LoanAccount for each unique counterparty
3. Creates LoanEntry records for the principal amounts
"""

import os
import sys

# Add the project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import Loan, LoanAccount, LoanEntry, User
from datetime import date


def migrate_loans():
    with app.app_context():
        # Get all old loans
        old_loans = Loan.query.all()

        if not old_loans:
            print("No old loans found to migrate.")
            return

        print(f"Found {len(old_loans)} old loan(s) to migrate.")

        # Track created loan accounts to avoid duplicates
        # Key: (user_id, counterparty_name, type) -> LoanAccount
        account_map = {}

        migrated_count = 0
        skipped_count = 0

        for loan in old_loans:
            # Map old type to new type
            # 'given' = you lent money -> 'receivable' (they owe you)
            # 'taken' = you borrowed -> 'payable' (you owe them)
            new_type = 'receivable' if loan.type == 'given' else 'payable'

            # Create a unique key for this counterparty
            key = (loan.user_id, loan.counterparty.strip().lower(), new_type)

            # Check if we already have a loan account for this person
            if key not in account_map:
                # Check if LoanAccount already exists in DB
                existing = LoanAccount.query.filter_by(
                    user_id=loan.user_id,
                    type=new_type
                ).filter(db.func.lower(LoanAccount.name) == loan.counterparty.strip().lower()).first()

                if existing:
                    account_map[key] = existing
                    print(f"  Using existing LoanAccount: {existing.name} (ID: {existing.id})")
                else:
                    # Create new LoanAccount
                    new_account = LoanAccount(
                        user_id=loan.user_id,
                        name=loan.counterparty.strip(),
                        type=new_type,
                        notes=f"Migrated from old loan system. Due: {loan.due_date}"
                    )
                    db.session.add(new_account)
                    db.session.flush()  # Get the ID
                    account_map[key] = new_account
                    print(f"  Created LoanAccount: {new_account.name} (ID: {new_account.id})")

            loan_account = account_map[key]

            # Create entry for the principal amount
            # The outstanding_balance represents what's still owed
            # We'll create entries to reflect the current state

            # Calculate what was repaid
            repaid_amount = loan.principal_amount - loan.outstanding_balance

            # Create entry for initial amount (principal)
            principal_entry = LoanEntry(
                loan_account_id=loan_account.id,
                amount=loan.principal_amount,
                description=f"Initial loan (migrated from old system)",
                date=loan.due_date if loan.due_date else date.today()
            )
            db.session.add(principal_entry)
            print(f"    Added principal entry: {loan.principal_amount:.2f}")

            # If there were repayments, create entry for them
            if repaid_amount > 0:
                repayment_entry = LoanEntry(
                    loan_account_id=loan_account.id,
                    amount=-repaid_amount,  # Negative for repayments
                    description=f"Repayments (migrated from old system)",
                    date=date.today()
                )
                db.session.add(repayment_entry)
                print(f"    Added repayment entry: -{repaid_amount:.2f}")

            migrated_count += 1

        # Commit all changes
        db.session.commit()

        print(f"\n✅ Migration complete!")
        print(f"   - Migrated: {migrated_count} loan(s)")
        print(f"   - Skipped: {skipped_count} loan(s)")
        print(f"   - Created {len([k for k, v in account_map.items() if v is not None])} LoanAccount(s)")

        # Show summary of new loan accounts
        print("\n📋 Current LoanAccounts:")
        all_accounts = LoanAccount.query.all()
        for acc in all_accounts:
            print(f"   - {acc.name} ({acc.type}): Balance = {acc.balance:.2f} SAR")


if __name__ == '__main__':
    print("=" * 50)
    print("Loan Migration Script")
    print("=" * 50)
    print()
    migrate_loans()
