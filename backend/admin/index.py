import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Admin panel operations - manage users and game submissions
    Args: event with httpMethod, body
          context with request_id
    Returns: HTTP response with admin data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            action = params.get('action', 'users')
            
            if action == 'users':
                search = params.get('search', '')
                if search:
                    cur.execute(
                        "SELECT id, email, username, role, balance, is_banned, is_verified, has_checkmark, created_at FROM users WHERE username ILIKE %s OR email ILIKE %s ORDER BY created_at DESC",
                        (f'%{search}%', f'%{search}%')
                    )
                else:
                    cur.execute(
                        "SELECT id, email, username, role, balance, is_banned, is_verified, has_checkmark, created_at FROM users ORDER BY created_at DESC"
                    )
                users = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps([{
                        'id': u[0],
                        'email': u[1],
                        'username': u[2],
                        'role': u[3],
                        'balance': float(u[4]),
                        'is_banned': u[5],
                        'is_verified': u[6],
                        'has_checkmark': u[7],
                        'created_at': str(u[8])
                    } for u in users])
                }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            user_id = body_data.get('user_id')
            
            if action == 'ban':
                cur.execute(
                    "UPDATE users SET is_banned = %s WHERE id = %s",
                    (True, user_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'unban':
                cur.execute(
                    "UPDATE users SET is_banned = %s WHERE id = %s",
                    (False, user_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'update_balance':
                balance = body_data.get('balance')
                cur.execute(
                    "UPDATE users SET balance = %s WHERE id = %s",
                    (balance, user_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'update_game_price':
                game_id = body_data.get('game_id')
                price = body_data.get('price')
                cur.execute(
                    "UPDATE games SET price = %s WHERE id = %s",
                    (price, game_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'toggle_popular':
                game_id = body_data.get('game_id')
                is_popular = body_data.get('is_popular')
                cur.execute(
                    "UPDATE games SET is_popular = %s WHERE id = %s",
                    (is_popular, game_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'toggle_verified':
                cur.execute(
                    "UPDATE users SET is_verified = NOT is_verified WHERE id = %s RETURNING is_verified",
                    (user_id,)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'toggle_checkmark':
                cur.execute(
                    "UPDATE users SET has_checkmark = NOT has_checkmark WHERE id = %s RETURNING has_checkmark",
                    (user_id,)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    finally:
        cur.close()
        conn.close()