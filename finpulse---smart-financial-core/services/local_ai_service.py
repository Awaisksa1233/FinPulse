"""
Local AI Categorization Service for FinPulse
Uses keyword matching with Groq as fallback for uncertain cases.
"""
import re
from typing import Tuple, Optional

# Category patterns with keywords
CATEGORY_PATTERNS = {
    'Food': [
        'restaurant', 'lunch', 'dinner', 'breakfast', 'coffee', 'cafe', 'pizza',
        'burger', 'sushi', 'delivery', 'takeout', 'eat', 'meal', 'snack',
        'mcdonalds', 'kfc', 'starbucks', 'subway', 'shawarma', 'food'
    ],
    'Groceries': [
        'grocery', 'groceries', 'supermarket', 'carrefour', 'panda', 'danube',
        'tamimi', 'lulu', 'hypermarket', 'vegetables', 'fruits', 'meat',
        'milk', 'bread', 'eggs', 'rice', 'cooking', 'kitchen supplies'
    ],
    'Transport': [
        'uber', 'careem', 'taxi', 'fuel', 'gas', 'petrol', 'gasoline',
        'metro', 'bus', 'train', 'parking', 'toll', 'car wash', 'car service',
        'maintenance', 'tire', 'oil change', 'transport', 'ride'
    ],
    'Shopping': [
        'amazon', 'mall', 'store', 'clothes', 'shoes', 'fashion', 'electronics',
        'gadget', 'phone', 'laptop', 'watch', 'jewelry', 'gift', 'shopping',
        'noon', 'shein', 'namshi', 'extra', 'jarir'
    ],
    'Bills': [
        'electricity', 'water', 'internet', 'phone bill', 'mobile', 'rent',
        'stc', 'mobily', 'zain', 'wifi', 'utility', 'bill', 'subscription',
        'insurance', 'maintenance fee', 'service charge'
    ],
    'Entertainment': [
        'movie', 'cinema', 'netflix', 'spotify', 'youtube', 'gym', 'fitness',
        'game', 'gaming', 'playstation', 'xbox', 'concert', 'event', 'ticket',
        'park', 'theme park', 'entertainment', 'fun', 'hobby'
    ],
    'Healthcare': [
        'doctor', 'hospital', 'clinic', 'pharmacy', 'medicine', 'medical',
        'dental', 'dentist', 'health', 'checkup', 'lab', 'test', 'prescription'
    ],
    'Education': [
        'school', 'university', 'college', 'course', 'tuition', 'book',
        'training', 'certification', 'exam', 'education', 'learning', 'class'
    ],
    'Salary': [
        'salary', 'paycheck', 'wages', 'income', 'bonus', 'commission'
    ],
    'Transfer': [
        'transfer', 'sent', 'received', 'payment from', 'payment to'
    ],
    'Other': []  # Fallback category
}

# Keywords indicating income
INCOME_KEYWORDS = [
    'salary', 'paycheck', 'income', 'received', 'payment received',
    'bonus', 'refund', 'cashback', 'transfer in', 'deposit'
]


def categorize_transaction(description: str, amount: float = None) -> dict:
    """
    Categorize a transaction using local keyword matching.
    Falls back to Groq AI if confidence is too low.
    
    Returns:
        dict with 'category', 'confidence', 'is_income', 'used_fallback'
    """
    if not description:
        return {
            'category': 'Other',
            'confidence': 0.0,
            'is_income': False,
            'used_fallback': False
        }
    
    text = description.lower().strip()
    
    # Check if this is income
    is_income = any(keyword in text for keyword in INCOME_KEYWORDS)
    
    # Try local categorization first
    category, confidence = _local_categorize(text)
    
    # If confidence is low, try Groq fallback
    if confidence < 0.7:
        fallback_result = _groq_categorize(description, amount)
        if fallback_result:
            return {
                'category': fallback_result.get('category', category),
                'confidence': fallback_result.get('confidence', confidence),
                'is_income': fallback_result.get('is_income', is_income),
                'used_fallback': True
            }
    
    return {
        'category': category,
        'confidence': confidence,
        'is_income': is_income,
        'used_fallback': False
    }


def _local_categorize(text: str) -> Tuple[str, float]:
    """
    Perform local keyword-based categorization.
    Returns (category, confidence_score)
    """
    best_match = 'Other'
    best_score = 0.0
    
    for category, keywords in CATEGORY_PATTERNS.items():
        if not keywords:
            continue
            
        matches = 0
        for keyword in keywords:
            if keyword in text:
                matches += 1
                # Exact word match gets higher score
                if re.search(rf'\b{re.escape(keyword)}\b', text):
                    matches += 0.5
        
        if matches > 0:
            # Normalize score based on number of keywords matched
            score = min(1.0, matches / 2)  # 2 keywords = full confidence
            if score > best_score:
                best_score = score
                best_match = category
    
    return best_match, best_score


def _groq_categorize(description: str, amount: float = None) -> Optional[dict]:
    """
    Use Groq AI as fallback for uncertain categorization.
    """
    try:
        from services.groq_service import get_groq_client, get_model
        import json
        
        client = get_groq_client()
        if not client:
            return None
        
        categories_list = list(CATEGORY_PATTERNS.keys())
        
        prompt = f"""Categorize this financial transaction into one of these categories: {', '.join(categories_list)}.

Transaction: "{description}"
{f'Amount: {amount} SAR' if amount else ''}

Return JSON with:
- category: string (one of the categories listed)
- confidence: number (0.0 to 1.0)
- is_income: boolean (true if this is income/money received)"""

        response = client.chat.completions.create(
            model=get_model(),
            messages=[
                {"role": "system", "content": "You are a financial categorization assistant. Respond only with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=100
        )
        
        result = json.loads(response.choices[0].message.content)
        return {
            'category': result.get('category', 'Other'),
            'confidence': float(result.get('confidence', 0.8)),
            'is_income': bool(result.get('is_income', False))
        }
        
    except Exception as e:
        print(f"Groq categorization fallback error: {e}")
        return None


def get_category_suggestions(partial_text: str) -> list:
    """
    Get suggested categories based on partial input text.
    Useful for autocomplete features.
    """
    if not partial_text:
        return list(CATEGORY_PATTERNS.keys())
    
    text = partial_text.lower()
    suggestions = []
    
    for category, keywords in CATEGORY_PATTERNS.items():
        for keyword in keywords:
            if keyword.startswith(text) or text in keyword:
                if category not in suggestions:
                    suggestions.append(category)
                break
    
    return suggestions if suggestions else ['Other']
