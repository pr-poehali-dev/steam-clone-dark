import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User profile management and purchases
    Args: event with httpMethod, body
          context with request_id
    Returns: HTTP response with profile data
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
            user_id = params.get('user_id')
            
            if user_id:
                cur.execute(
                    "SELECT id, email, username, display_name, avatar_url, balance, is_verified, has_checkmark, role FROM users WHERE id = %s",
                    (user_id,)
                )
                user = cur.fetchone()
                
                if user:
                    cur.execute(
                        "SELECT g.id, g.title, g.description, g.category, g.price, g.file_url, g.logo_url FROM purchases p JOIN games g ON p.game_id = g.id WHERE p.user_id = %s",
                        (user_id,)
                    )
                    purchases = cur.fetchall()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({
                            'id': user[0],
                            'email': user[1],
                            'username': user[2],
                            'display_name': user[3],
                            'avatar_url': user[4],
                            'balance': float(user[5]),
                            'is_verified': user[6],
                            'has_checkmark': user[7],
                            'role': user[8],
                            'purchases': [{
                                'id': p[0],
                                'title': p[1],
                                'description': p[2],
                                'category': p[3],
                                'price': float(p[4]),
                                'file_url': p[5],
                                'logo_url': p[6]
                            } for p in purchases]
                        })
                    }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('user_id')
            
            cur.execute(
                "UPDATE users SET username = %s, display_name = %s, avatar_url = %s WHERE id = %s",
                (body_data.get('username'), body_data.get('display_name'), body_data.get('avatar_url'), user_id)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True})
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'get_frames':
                cur.execute("SELECT id, name, image_url, price FROM frames ORDER BY price ASC")
                frames = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps([{
                        'id': f[0],
                        'name': f[1],
                        'image_url': f[2],
                        'price': float(f[3])
                    } for f in frames])
                }
            
            elif action == 'get_user_frames':
                user_id = body_data.get('user_id')
                cur.execute(
                    "SELECT f.id, f.name, f.image_url, f.price FROM user_frames uf JOIN frames f ON uf.frame_id = f.id WHERE uf.user_id = %s",
                    (user_id,)
                )
                frames = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps([{
                        'id': f[0],
                        'name': f[1],
                        'image_url': f[2],
                        'price': float(f[3])
                    } for f in frames])
                }
            
            elif action == 'purchase_frame':
                user_id = body_data.get('user_id')
                frame_id = body_data.get('frame_id')
                
                cur.execute("SELECT price FROM frames WHERE id = %s", (frame_id,))
                frame = cur.fetchone()
                price = float(frame[0])
                
                cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
                user = cur.fetchone()
                balance = float(user[0])
                
                if balance >= price:
                    cur.execute(
                        "INSERT INTO user_frames (user_id, frame_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                        (user_id, frame_id)
                    )
                    cur.execute("UPDATE users SET balance = balance - %s WHERE id = %s", (price, user_id))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'success': True, 'new_balance': balance - price})
                    }
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Недостаточно средств'})
                    }
            
            elif action == 'set_active_frame':
                user_id = body_data.get('user_id')
                frame_id = body_data.get('frame_id')
                cur.execute("UPDATE users SET active_frame_id = %s WHERE id = %s", (frame_id, user_id))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'create_frame':
                cur.execute(
                    "INSERT INTO frames (name, image_url, price) VALUES (%s, %s, %s) RETURNING id",
                    (body_data.get('name'), body_data.get('image_url'), body_data.get('price', 0))
                )
                frame_id = cur.fetchone()[0]
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'id': frame_id})
                }
            
            elif action == 'delete_frame':
                frame_id = body_data.get('frame_id')
                cur.execute("DELETE FROM frames WHERE id = %s", (frame_id,))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'update_frame_price':
                frame_id = body_data.get('frame_id')
                price = body_data.get('price')
                cur.execute("UPDATE frames SET price = %s WHERE id = %s", (price, frame_id))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'purchase':
                user_id = body_data.get('user_id')
                game_id = body_data.get('game_id')
                
                cur.execute("SELECT price FROM games WHERE id = %s", (game_id,))
                game = cur.fetchone()
                price = float(game[0])
                
                cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
                user = cur.fetchone()
                balance = float(user[0])
                
                if balance >= price:
                    cur.execute(
                        "INSERT INTO purchases (user_id, game_id, price) VALUES (%s, %s, %s) ON CONFLICT (user_id, game_id) DO NOTHING",
                        (user_id, game_id, price)
                    )
                    cur.execute(
                        "UPDATE users SET balance = balance - %s WHERE id = %s",
                        (price, user_id)
                    )
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'success': True, 'new_balance': balance - price})
                    }
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Insufficient balance'})
                    }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    finally:
        cur.close()
        conn.close()