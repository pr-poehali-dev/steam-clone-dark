import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User profile management, purchases, and marketplace operations
    Args: event with httpMethod, body
          context with request_id
    Returns: HTTP response with profile data or marketplace listings
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
            
            action = params.get('action')
            
            if action == 'market_listings':
                cur.execute("""
                    SELECT 
                        p.id,
                        p.user_id,
                        p.game_id,
                        p.market_price,
                        'game' as item_type,
                        g.title as item_name,
                        g.logo_url as item_image,
                        u.email as seller_email
                    FROM t_p84121358_steam_clone_dark.purchases p
                    JOIN t_p84121358_steam_clone_dark.games g ON p.game_id = g.id
                    JOIN t_p84121358_steam_clone_dark.users u ON p.user_id = u.id
                    WHERE p.is_on_market = TRUE
                    UNION ALL
                    SELECT 
                        uf.id,
                        uf.user_id,
                        uf.frame_id as game_id,
                        uf.market_price,
                        'frame' as item_type,
                        f.name as item_name,
                        f.image_url as item_image,
                        u.email as seller_email
                    FROM t_p84121358_steam_clone_dark.user_frames uf
                    JOIN t_p84121358_steam_clone_dark.frames f ON uf.frame_id = f.id
                    JOIN t_p84121358_steam_clone_dark.users u ON uf.user_id = u.id
                    WHERE uf.is_on_market = TRUE
                    ORDER BY id DESC
                """)
                listings = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'listings': [{
                        'id': l[0],
                        'user_id': l[1],
                        'game_id': l[2],
                        'market_price': l[3],
                        'item_type': l[4],
                        'item_name': l[5],
                        'item_image': l[6],
                        'seller_email': l[7]
                    } for l in listings]})
                }
            
            if user_id:
                cur.execute(
                    "SELECT id, email, username, display_name, avatar_url, balance, is_verified, has_checkmark, role, active_frame_id FROM t_p84121358_steam_clone_dark.users WHERE id = %s",
                    (user_id,)
                )
                user = cur.fetchone()
                
                if user:
                    cur.execute(
                        "SELECT p.id as purchase_id, g.id, g.title, g.description, g.category, g.price, g.file_url, g.logo_url, p.is_on_market, p.market_price FROM t_p84121358_steam_clone_dark.purchases p JOIN t_p84121358_steam_clone_dark.games g ON p.game_id = g.id WHERE p.user_id = %s AND p.is_on_market = FALSE",
                        (user_id,)
                    )
                    purchases = cur.fetchall()
                    
                    cur.execute(
                        "SELECT uf.id as user_frame_id, f.id, f.name, f.image_url, f.price, uf.is_on_market, uf.market_price FROM t_p84121358_steam_clone_dark.user_frames uf JOIN t_p84121358_steam_clone_dark.frames f ON uf.frame_id = f.id WHERE uf.user_id = %s AND uf.is_on_market = FALSE",
                        (user_id,)
                    )
                    user_frames = cur.fetchall()
                    
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
                            'active_frame_id': user[9],
                            'purchases': [{
                                'purchase_id': p[0],
                                'id': p[1],
                                'title': p[2],
                                'description': p[3],
                                'category': p[4],
                                'price': float(p[5]),
                                'file_url': p[6],
                                'logo_url': p[7],
                                'is_on_market': p[8],
                                'market_price': p[9]
                            } for p in purchases],
                            'frames': [{
                                'user_frame_id': f[0],
                                'id': f[1],
                                'name': f[2],
                                'image_url': f[3],
                                'price': float(f[4]),
                                'is_on_market': f[5],
                                'market_price': f[6]
                            } for f in user_frames]
                        })
                    }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('user_id')
            
            cur.execute(
                "UPDATE t_p84121358_steam_clone_dark.users SET username = %s, display_name = %s, avatar_url = %s WHERE id = %s",
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
                    "SELECT uf.id as user_frame_id, f.id, f.name, f.image_url, f.price, uf.is_on_market, uf.market_price FROM t_p84121358_steam_clone_dark.user_frames uf JOIN t_p84121358_steam_clone_dark.frames f ON uf.frame_id = f.id WHERE uf.user_id = %s",
                    (user_id,)
                )
                frames = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps([{
                        'user_frame_id': f[0],
                        'id': f[1],
                        'name': f[2],
                        'image_url': f[3],
                        'price': float(f[4]),
                        'is_on_market': f[5],
                        'market_price': f[6]
                    } for f in frames])
                }
            
            elif action == 'purchase_frame':
                user_id = body_data.get('user_id')
                frame_id = body_data.get('frame_id')
                
                cur.execute("SELECT price FROM t_p84121358_steam_clone_dark.frames WHERE id = %s", (frame_id,))
                frame = cur.fetchone()
                price = float(frame[0])
                
                cur.execute("SELECT balance FROM t_p84121358_steam_clone_dark.users WHERE id = %s", (user_id,))
                user = cur.fetchone()
                balance = float(user[0])
                
                if balance >= price:
                    cur.execute(
                        "INSERT INTO t_p84121358_steam_clone_dark.user_frames (user_id, frame_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                        (user_id, frame_id)
                    )
                    cur.execute("UPDATE t_p84121358_steam_clone_dark.users SET balance = balance - %s WHERE id = %s", (price, user_id))
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
                cur.execute("UPDATE t_p84121358_steam_clone_dark.users SET active_frame_id = %s WHERE id = %s", (frame_id, user_id))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'list_on_market':
                user_id = body_data.get('user_id')
                item_type = body_data.get('item_type')
                item_id = body_data.get('item_id')
                price = body_data.get('price')
                
                if item_type == 'game':
                    cur.execute(
                        "UPDATE t_p84121358_steam_clone_dark.purchases SET is_on_market = TRUE, market_price = %s WHERE id = %s AND user_id = %s",
                        (price, item_id, user_id)
                    )
                else:
                    cur.execute(
                        "UPDATE t_p84121358_steam_clone_dark.user_frames SET is_on_market = TRUE, market_price = %s WHERE id = %s AND user_id = %s",
                        (price, item_id, user_id)
                    )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'remove_from_market':
                user_id = body_data.get('user_id')
                item_type = body_data.get('item_type')
                item_id = body_data.get('item_id')
                
                if item_type == 'game':
                    cur.execute(
                        "UPDATE t_p84121358_steam_clone_dark.purchases SET is_on_market = FALSE, market_price = 0 WHERE id = %s AND user_id = %s",
                        (item_id, user_id)
                    )
                else:
                    cur.execute(
                        "UPDATE t_p84121358_steam_clone_dark.user_frames SET is_on_market = FALSE, market_price = 0 WHERE id = %s AND user_id = %s",
                        (item_id, user_id)
                    )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'buy_from_market':
                buyer_id = body_data.get('buyer_id')
                listing_id = body_data.get('listing_id')
                item_type = body_data.get('item_type')
                
                if item_type == 'game':
                    cur.execute(
                        "SELECT p.user_id as seller_id, p.game_id, p.market_price FROM t_p84121358_steam_clone_dark.purchases p WHERE p.id = %s AND p.is_on_market = TRUE",
                        (listing_id,)
                    )
                    listing = cur.fetchone()
                    
                    if not listing:
                        return {
                            'statusCode': 404,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Товар не найден'})
                        }
                    
                    seller_id, game_id, market_price = listing
                    
                    cur.execute("SELECT balance FROM t_p84121358_steam_clone_dark.users WHERE id = %s", (buyer_id,))
                    buyer = cur.fetchone()
                    buyer_balance = float(buyer[0])
                    
                    if buyer_balance < market_price:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Недостаточно средств'})
                        }
                    
                    cur.execute("UPDATE t_p84121358_steam_clone_dark.users SET balance = balance + %s WHERE id = %s", (market_price, seller_id))
                    cur.execute("UPDATE t_p84121358_steam_clone_dark.users SET balance = balance - %s WHERE id = %s", (market_price, buyer_id))
                    cur.execute("DELETE FROM t_p84121358_steam_clone_dark.purchases WHERE id = %s", (listing_id,))
                    cur.execute(
                        "INSERT INTO t_p84121358_steam_clone_dark.purchases (user_id, game_id, price, purchased_at) VALUES (%s, %s, %s, NOW())",
                        (buyer_id, game_id, market_price)
                    )
                    
                else:
                    cur.execute(
                        "SELECT uf.user_id as seller_id, uf.frame_id, uf.market_price FROM t_p84121358_steam_clone_dark.user_frames uf WHERE uf.id = %s AND uf.is_on_market = TRUE",
                        (listing_id,)
                    )
                    listing = cur.fetchone()
                    
                    if not listing:
                        return {
                            'statusCode': 404,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Товар не найден'})
                        }
                    
                    seller_id, frame_id, market_price = listing
                    
                    cur.execute("SELECT balance FROM t_p84121358_steam_clone_dark.users WHERE id = %s", (buyer_id,))
                    buyer = cur.fetchone()
                    buyer_balance = float(buyer[0])
                    
                    if buyer_balance < market_price:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Недостаточно средств'})
                        }
                    
                    cur.execute("UPDATE t_p84121358_steam_clone_dark.users SET balance = balance + %s WHERE id = %s", (market_price, seller_id))
                    cur.execute("UPDATE t_p84121358_steam_clone_dark.users SET balance = balance - %s WHERE id = %s", (market_price, buyer_id))
                    cur.execute("DELETE FROM t_p84121358_steam_clone_dark.user_frames WHERE id = %s", (listing_id,))
                    cur.execute(
                        "INSERT INTO t_p84121358_steam_clone_dark.user_frames (user_id, frame_id) VALUES (%s, %s)",
                        (buyer_id, frame_id)
                    )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'create_frame':
                cur.execute(
                    "INSERT INTO t_p84121358_steam_clone_dark.frames (name, image_url, price) VALUES (%s, %s, %s) RETURNING id",
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
                cur.execute("DELETE FROM t_p84121358_steam_clone_dark.frames WHERE id = %s", (frame_id,))
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
                cur.execute("UPDATE t_p84121358_steam_clone_dark.frames SET price = %s WHERE id = %s", (price, frame_id))
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
                
                cur.execute("SELECT price FROM t_p84121358_steam_clone_dark.games WHERE id = %s", (game_id,))
                game = cur.fetchone()
                price = float(game[0])
                
                cur.execute("SELECT balance FROM t_p84121358_steam_clone_dark.users WHERE id = %s", (user_id,))
                user = cur.fetchone()
                balance = float(user[0])
                
                if balance >= price:
                    cur.execute(
                        "INSERT INTO t_p84121358_steam_clone_dark.purchases (user_id, game_id, price, purchased_at) VALUES (%s, %s, %s, NOW()) ON CONFLICT (user_id, game_id) DO NOTHING",
                        (user_id, game_id, price)
                    )
                    cur.execute(
                        "UPDATE t_p84121358_steam_clone_dark.users SET balance = balance - %s WHERE id = %s",
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