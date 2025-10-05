import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Friends and messaging system
    Args: event with httpMethod, body
          context with request_id
    Returns: HTTP response with friends/messages data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
            action = params.get('action')
            user_id = params.get('user_id')
            
            if action == 'friends':
                cur.execute(
                    """SELECT u.id, u.username, u.display_name, u.avatar_url, u.is_verified, u.has_checkmark 
                    FROM friendships f 
                    JOIN users u ON f.friend_id = u.id 
                    WHERE f.user_id = %s""",
                    (user_id,)
                )
                friends = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps([{
                        'id': f[0],
                        'username': f[1],
                        'display_name': f[2],
                        'avatar_url': f[3],
                        'is_verified': f[4],
                        'has_checkmark': f[5]
                    } for f in friends])
                }
            
            elif action == 'search':
                search = params.get('search', '')
                cur.execute(
                    """SELECT id, username, display_name, avatar_url, is_verified, has_checkmark 
                    FROM users 
                    WHERE (username ILIKE %s OR display_name ILIKE %s) AND id != %s
                    ORDER BY has_checkmark DESC, is_verified DESC, username ASC""",
                    (f'%{search}%', f'%{search}%', user_id)
                )
                users = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps([{
                        'id': u[0],
                        'username': u[1],
                        'display_name': u[2],
                        'avatar_url': u[3],
                        'is_verified': u[4],
                        'has_checkmark': u[5]
                    } for u in users])
                }
            
            elif action == 'messages':
                friend_id = params.get('friend_id')
                cur.execute(
                    """SELECT id, sender_id, receiver_id, message, created_at 
                    FROM messages 
                    WHERE (sender_id = %s AND receiver_id = %s) OR (sender_id = %s AND receiver_id = %s)
                    ORDER BY created_at ASC""",
                    (user_id, friend_id, friend_id, user_id)
                )
                messages = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps([{
                        'id': m[0],
                        'sender_id': m[1],
                        'receiver_id': m[2],
                        'message': m[3],
                        'created_at': str(m[4])
                    } for m in messages])
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'add_friend':
                user_id = body_data.get('user_id')
                friend_id = body_data.get('friend_id')
                
                cur.execute(
                    "INSERT INTO friendships (user_id, friend_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (user_id, friend_id)
                )
                cur.execute(
                    "INSERT INTO friendships (user_id, friend_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (friend_id, user_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'send_message':
                sender_id = body_data.get('sender_id')
                receiver_id = body_data.get('receiver_id')
                message = body_data.get('message')
                
                cur.execute(
                    "INSERT INTO messages (sender_id, receiver_id, message) VALUES (%s, %s, %s) RETURNING id",
                    (sender_id, receiver_id, message)
                )
                msg_id = cur.fetchone()[0]
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True, 'id': msg_id})
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    finally:
        cur.close()
        conn.close()