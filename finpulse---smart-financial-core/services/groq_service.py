import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def get_groq_client():
    """Initialize Groq client."""
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
        return None
    return Groq(api_key=api_key)


def get_model():
    """Get configured AI model."""
    return os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')


def analyze_spending_spike(current_amount: float, category: str, history: list) -> dict:
    """Analyze if a transaction is an abnormal spending spike."""
    client = get_groq_client()
    if not client:
        return {'is_spike': False, 'message': ''}
    
    try:
        prompt = f"""Analyze this transaction for anomalies.
New Transaction: {category} - ${current_amount}.
Recent History for this category: {json.dumps(history)}.

Is this an abnormal spike compared to the history? 
Return JSON with exactly these fields:
- is_spike: boolean (true if this is abnormally high)
- message: string (warning message if spike, empty otherwise)"""

        response = client.chat.completions.create(
            model=get_model(),
            messages=[
                {"role": "system", "content": "You are a financial analysis assistant. Respond only with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=200
        )
        
        result = json.loads(response.choices[0].message.content)
        return {
            'is_spike': result.get('is_spike', False),
            'message': result.get('message', '')
        }
    except Exception as e:
        print(f"Groq Analysis Error: {e}")
        return {'is_spike': False, 'message': ''}


def process_chat_command(message: str, accounts: list, transactions: list = None, loans: list = None, chat_history: list = None) -> dict:
    """Process natural language chat commands for financial operations and analysis."""
    client = get_groq_client()
    if not client:
        return {'action': 'error', 'message': 'AI not initialized'}
    
    try:
        accounts_info = [{'id': a['id'], 'name': a['name'], 'balance': a.get('balance', 0)} for a in accounts]
        
        # Prepare financial context for analysis
        financial_context = ""
        if transactions:
            # Calculate summary stats
            total_income = sum(t.get('amount', 0) for t in transactions if t.get('type') == 'income')
            total_expense = sum(t.get('amount', 0) for t in transactions if t.get('type') == 'expense')
            
            # Category breakdown
            expense_by_category = {}
            income_by_category = {}
            for t in transactions:
                if t.get('type') == 'expense':
                    cat = t.get('category', 'Other')
                    expense_by_category[cat] = expense_by_category.get(cat, 0) + t.get('amount', 0)
                elif t.get('type') == 'income':
                    cat = t.get('category', 'Other')
                    income_by_category[cat] = income_by_category.get(cat, 0) + t.get('amount', 0)
            
            # Recent transactions (last 10)
            recent = transactions[-10:] if len(transactions) > 10 else transactions
            recent_summary = [{'date': t.get('date'), 'type': t.get('type'), 'amount': t.get('amount'), 'category': t.get('category'), 'description': t.get('description', '')} for t in recent]
            
            financial_context += f"""
Financial Data Available for Analysis:
- Total Income (this month): {total_income} SAR
- Total Expenses (this month): {total_expense} SAR
- Net Savings: {total_income - total_expense} SAR
- Expense by Category: {expense_by_category}
- Income by Category: {income_by_category}
- Recent Transactions: {recent_summary}
"""
        
        if loans:
            receivables = [{'counterparty': l.get('counterparty'), 'amount': l.get('outstanding_balance'), 'due': l.get('due_date')} for l in loans if l.get('type') == 'given']
            payables = [{'counterparty': l.get('counterparty'), 'amount': l.get('outstanding_balance'), 'due': l.get('due_date')} for l in loans if l.get('type') == 'taken']
            total_receivables = sum(l.get('outstanding_balance', 0) for l in loans if l.get('type') == 'given')
            total_payables = sum(l.get('outstanding_balance', 0) for l in loans if l.get('type') == 'taken')
            
            financial_context += f"""
- Money Owed to You (Receivables): {total_receivables} SAR - Details: {receivables}
- Money You Owe (Payables): {total_payables} SAR - Details: {payables}
"""
        
        total_balance = sum(a.get('balance', 0) for a in accounts)
        financial_context += f"""
- Accounts: {accounts_info}
- Total Balance: {total_balance} SAR
"""
        
        system_prompt = f"""You are an intelligent financial assistant with access to the user's complete financial data. You remember the conversation history and can refer back to previous messages.

{financial_context}

You can do the following:
1. **Analyze finances**: Answer questions about spending, income, trends, categories, balances, loans, etc.
2. **Add transaction**: Record income or expense (e.g., "Paid 50 for lunch", "Received 1000 salary")
3. **Transfer money**: Move money between accounts (e.g., "Transfer 50 from cash to bank")
4. **Update balance**: Adjust account balance (e.g., "Set main wallet balance to 5000")
5. **Record loan**: Track money lent/borrowed (e.g., "Lent 500 to Ahmed", "Borrowed 1000 from Ali")

IMPORTANT: First determine if this is an ANALYSIS question or an ACTION request.
- If the user is asking a question about their finances (how much spent, what categories, analysis, advice, etc.), set action to "analysis" and provide a helpful response.
- If the user wants to perform an action (add transaction, transfer, loan), set the appropriate action.
- If the user refers to previous messages (like "do that again", "the same amount", etc.), use the conversation history to understand what they mean.

Return JSON with these fields:
- action: string ("analysis", "transaction", "transfer", "update_balance", "loan", or "unknown")
- response_message: string (your friendly response - for analysis, include the actual analysis/answer)
- details: object (only for actions, not for analysis) with:
  - type: string ("income" or "expense" for transactions, "given" or "taken" for loans)
  - amount: number
  - category: string (inferred category for transactions)
  - description: string
  - account_id: number (target account ID)
  - from_account_id: number (for transfers only)
  - to_account_id: number (for transfers only)
  - counterparty: string (person's name for loans)
  - due_date: string (optional, YYYY-MM-DD format, default 30 days from now)"""

        # Build messages with chat history
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add recent chat history for context (excluding the current message which is already included)
        if chat_history:
            for msg in chat_history[:-1]:  # Exclude the last message (current user message)
                messages.append({"role": msg['role'], "content": msg['content']})
        
        # Add current user message
        messages.append({"role": "user", "content": message})

        response = client.chat.completions.create(
            model=get_model(),
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.5,
            max_tokens=800
        )
        
        result = json.loads(response.choices[0].message.content)
        return {
            'action': result.get('action', 'unknown'),
            'response_message': result.get('response_message', 'Done.'),
            'details': result.get('details', {})
        }
    except Exception as e:
        print(f"Groq Chat Error: {e}")
        return {'action': 'error', 'message': "Sorry, I couldn't process that request."}


def generate_account_summary(accounts: list, transactions: list, loans: list) -> str:
    """Generate an AI-powered financial summary."""
    client = get_groq_client()
    if not client:
        return "AI summary unavailable. Please check your API key."
    
    if not accounts:
        return "No accounts found. Create an account to get started!"
    
    try:
        # Prepare financial data
        total_balance = sum(a.get('balance', 0) for a in accounts)
        
        income_total = sum(t.get('amount', 0) for t in transactions if t.get('type') == 'income')
        expense_total = sum(t.get('amount', 0) for t in transactions if t.get('type') == 'expense')
        
        # Get expense categories
        expense_categories = {}
        for t in transactions:
            if t.get('type') == 'expense':
                cat = t.get('category', 'Other')
                expense_categories[cat] = expense_categories.get(cat, 0) + t.get('amount', 0)
        
        top_expenses = sorted(expense_categories.items(), key=lambda x: x[1], reverse=True)[:3]
        
        # Loan summary
        total_receivables = sum(l.get('outstanding_balance', 0) for l in loans if l.get('type') == 'given')
        total_payables = sum(l.get('outstanding_balance', 0) for l in loans if l.get('type') == 'taken')
        
        prompt = f"""You are a friendly financial advisor. Analyze this financial data and provide a brief, helpful summary with insights and tips.

Financial Overview:
- Total Balance across {len(accounts)} accounts: {total_balance} SAR
- This month's Income: {income_total} SAR
- This month's Expenses: {expense_total} SAR
- Net Savings: {income_total - expense_total} SAR
- Top Expense Categories: {top_expenses if top_expenses else 'None yet'}
- Money Owed to You (Receivables): {total_receivables} SAR
- Money You Owe (Payables): {total_payables} SAR

Provide a 2-3 sentence friendly summary with one actionable tip. Be concise and encouraging. Use SAR as the currency."""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful financial advisor. Be concise, friendly, and give practical advice."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=200
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq Summary Error: {e}")
        return "Unable to generate summary at this time."


def generate_story_report(
    total_income: float,
    total_expense: float,
    net_savings: float,
    expense_by_category: dict,
    income_by_category: dict,
    previous_month_savings: float = None,
    timeframe: str = "this month"
) -> str:
    """Generate an engaging narrative-style financial report."""
    client = get_groq_client()
    if not client:
        return "Story mode unavailable. Please check your AI configuration."
    
    try:
        # Find biggest expense category
        top_expense_cat = max(expense_by_category.items(), key=lambda x: x[1]) if expense_by_category else ("None", 0)
        top_income_cat = max(income_by_category.items(), key=lambda x: x[1]) if income_by_category else ("Income", 0)
        
        # Calculate comparison with previous month
        comparison_note = ""
        if previous_month_savings is not None:
            diff = net_savings - previous_month_savings
            if diff > 0:
                comparison_note = f"This is {abs(diff):.0f} SAR MORE than last month - great improvement! 📈"
            elif diff < 0:
                comparison_note = f"This is {abs(diff):.0f} SAR less than last month. 📉"
            else:
                comparison_note = "Same as last month - consistency is key! ➡️"
        
        prompt = f"""You are a creative storyteller who makes financial reports FUN and engaging. 
Turn this dry financial data into an exciting adventure story (3-4 sentences).

Financial Data for {timeframe}:
- Starting journey with income: {total_income:.0f} SAR
- Total spent on adventures: {total_expense:.0f} SAR  
- Treasure saved: {net_savings:.0f} SAR
- Biggest spending quest: {top_expense_cat[0]} ({top_expense_cat[1]:.0f} SAR)
- Main income source: {top_income_cat[0]}
- Previous month comparison: {comparison_note if comparison_note else "First month tracking!"}

Rules:
1. Use adventure/journey metaphors (quests, treasures, battles, victories)
2. Include 2-3 relevant emojis
3. Be encouraging but honest about overspending
4. End with a motivational one-liner
5. Keep it SHORT - max 4 sentences
6. Use SAR as currency

Example style: "This month was an epic financial quest! 🚀 You conquered the income mountain with 5000 SAR, battled through a 500 SAR Electronics dragon, and emerged with 2000 SAR in your treasure chest. Your Food spending was your toughest foe this time. Keep fighting the good fight! 💪"
"""

        response = client.chat.completions.create(
            model=get_model(),
            messages=[
                {"role": "system", "content": "You are an enthusiastic storyteller who makes finance fun. Be creative, use emojis, and keep responses SHORT (3-4 sentences max)."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=250
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq Story Error: {e}")
        return "Your financial story is being written... but the author took a coffee break! ☕ Try again in a moment."


def generate_loan_summary(loan_accounts: list) -> str:
    """
    Generate an AI-powered summary of loan accounts.
    
    Args:
        loan_accounts: List of loan account dicts with entries
        
    Returns:
        Natural language summary with insights and recommendations
    """
    client = get_groq_client()
    if not client:
        return "AI summary unavailable. Please check your API key."
    
    if not loan_accounts:
        return "No active loan accounts. You're debt-free! 🎉"
    
    try:
        # Prepare loan data for analysis
        receivables = []
        payables = []
        
        for acc in loan_accounts:
            account_info = {
                'name': acc.get('name', 'Unknown'),
                'balance': acc.get('balance', 0),
                'entry_count': acc.get('entry_count', 0),
                'last_activity': acc.get('last_activity'),
                'total_lent': acc.get('total_lent', 0),
                'total_repaid': acc.get('total_repaid', 0)
            }
            
            if acc.get('type') == 'receivable':
                receivables.append(account_info)
            else:
                payables.append(account_info)
        
        total_receivable = sum(r['balance'] for r in receivables)
        total_payable = sum(p['balance'] for p in payables)
        
        prompt = f"""You are a friendly financial advisor. Analyze these loan accounts and provide a brief, helpful summary.

RECEIVABLES (Money owed TO you): {json.dumps(receivables) if receivables else 'None'}
Total Receivable: {total_receivable} SAR

PAYABLES (Money YOU owe): {json.dumps(payables) if payables else 'None'}  
Total Payable: {total_payable} SAR

Net Position: {total_receivable - total_payable} SAR {'in your favor' if total_receivable >= total_payable else 'you owe'}

Provide a 2-3 sentence friendly summary that:
1. Mentions key people and amounts
2. Highlights anyone who hasn't paid in a while (if last_activity is old)
3. Gives one actionable tip
Use SAR as currency. Be concise and encouraging."""

        response = client.chat.completions.create(
            model=get_model(),
            messages=[
                {"role": "system", "content": "You are a helpful financial advisor. Be concise, friendly, and give practical advice about loans."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=200
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        print(f"Groq Loan Summary Error: {e}")
        return "Unable to generate loan summary at this time."
