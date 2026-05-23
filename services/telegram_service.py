"""
Telegram Bot Service for FinPulse
Handles webhook processing for Telegram bot integration.
"""
import os
import json
import secrets
import requests
from datetime import datetime

TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}" if TELEGRAM_BOT_TOKEN else None


def send_telegram_message(chat_id: int, text: str, parse_mode: str = 'Markdown') -> bool:
    """Send a message to a Telegram chat."""
    if not TELEGRAM_API_URL:
        print("Telegram bot token not configured")
        return False
    
    try:
        response = requests.post(
            f"{TELEGRAM_API_URL}/sendMessage",
            json={
                'chat_id': chat_id,
                'text': text,
                'parse_mode': parse_mode
            },
            timeout=10
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Error sending Telegram message: {e}")
        return False


def set_webhook(webhook_url: str) -> dict:
    """Set the webhook URL for the Telegram bot."""
    if not TELEGRAM_API_URL:
        return {'success': False, 'error': 'Bot token not configured'}
    
    try:
        payload = {'url': webhook_url}
        secret = os.environ.get('TELEGRAM_WEBHOOK_SECRET')
        if secret:
            payload['secret_token'] = secret
            
        response = requests.post(
            f"{TELEGRAM_API_URL}/setWebhook",
            json=payload,
            timeout=10
        )
        result = response.json()
        return {
            'success': result.get('ok', False),
            'description': result.get('description', 'Unknown error')
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


def get_webhook_info() -> dict:
    """Get current webhook configuration."""
    if not TELEGRAM_API_URL:
        return {'url': None, 'error': 'Bot token not configured'}
    
    try:
        response = requests.get(f"{TELEGRAM_API_URL}/getWebhookInfo", timeout=10)
        result = response.json()
        if result.get('ok'):
            return {
                'url': result['result'].get('url', ''),
                'pending_update_count': result['result'].get('pending_update_count', 0),
                'last_error_message': result['result'].get('last_error_message'),
                'last_error_date': result['result'].get('last_error_date')
            }
        return {'url': None, 'error': result.get('description')}
    except Exception as e:
        return {'url': None, 'error': str(e)}


def get_bot_info() -> dict:
    """Get bot information."""
    if not TELEGRAM_API_URL:
        return {'success': False, 'error': 'Bot token not configured'}
    
    try:
        response = requests.get(f"{TELEGRAM_API_URL}/getMe", timeout=10)
        result = response.json()
        if result.get('ok'):
            return {
                'success': True,
                'username': result['result'].get('username'),
                'first_name': result['result'].get('first_name')
            }
        return {'success': False, 'error': result.get('description')}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def generate_link_code() -> str:
    """Generate a unique link code for account linking."""
    return secrets.token_urlsafe(8)[:8].upper()


def format_response_for_telegram(response: dict) -> str:
    """Format AI response for Telegram with markdown."""
    message = response.get('response_message', response.get('message', 'Done!'))
    action = response.get('action', 'unknown')
    details = response.get('details', {})
    
    # Add emoji indicators based on action
    if action == 'transaction':
        t_type = details.get('type', 'expense')
        emoji = '💰' if t_type == 'income' else '💸'
        amount = details.get('amount', 0)
        category = details.get('category', '')
        message = f"{emoji} *{t_type.capitalize()}*: {amount} SAR\n📁 {category}\n\n{message}"
    elif action == 'transfer':
        message = f"🔄 *Transfer*\n{message}"
    elif action == 'loan':
        loan_type = details.get('type', 'given')
        emoji = '📤' if loan_type == 'given' else '📥'
        message = f"{emoji} *Loan Recorded*\n{message}"
    elif action == 'analysis':
        message = f"📊 {message}"
    elif action == 'error':
        message = f"❌ {message}"
    
    return message


def process_telegram_update(update: dict) -> dict:
    """
    Process an incoming Telegram update.
    Returns dict with 'telegram_id', 'username', 'first_name', 'text', 'chat_id'
    """
    message = update.get('message', {})
    
    if not message:
        return None
    
    from_user = message.get('from', {})
    
    return {
        'telegram_id': from_user.get('id'),
        'username': from_user.get('username'),
        'first_name': from_user.get('first_name', 'User'),
        'text': message.get('text', ''),
        'chat_id': message.get('chat', {}).get('id')
    }
