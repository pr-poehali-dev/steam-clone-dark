import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage game submissions and approvals
    Args: event with httpMethod, body
          context with request_id
    Returns: HTTP response with games data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
            status = params.get('status', 'approved')
            
            if status == 'all':
                cur.execute(
                    "SELECT id, title, description, category, age_rating, file_url, publisher_login, status, created_at, price, is_popular FROM games ORDER BY created_at DESC"
                )
            elif status == 'popular':
                cur.execute(
                    "SELECT id, title, description, category, age_rating, file_url, publisher_login, status, created_at, price, is_popular FROM games WHERE status = 'approved' AND is_popular = true ORDER BY created_at DESC"
                )
            else:
                cur.execute(
                    "SELECT id, title, description, category, age_rating, file_url, publisher_login, status, created_at, price, is_popular FROM games WHERE status = %s ORDER BY created_at DESC",
                    (status,)
                )
            games = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps([{
                    'id': g[0],
                    'title': g[1],
                    'description': g[2],
                    'category': g[3],
                    'age_rating': g[4],
                    'file_url': g[5],
                    'publisher_login': g[6],
                    'status': g[7],
                    'created_at': str(g[8]),
                    'price': float(g[9]) if len(g) > 9 and g[9] is not None else 0.0,
                    'is_popular': g[10] if len(g) > 10 else False
                } for g in games])
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            cur.execute(
                "INSERT INTO games (title, description, category, age_rating, file_url, publisher_login, status, price, contact_email) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (
                    body_data.get('title'),
                    body_data.get('description'),
                    body_data.get('category'),
                    body_data.get('age_rating'),
                    body_data.get('file_url'),
                    body_data.get('publisher_login'),
                    'pending',
                    body_data.get('price', 0),
                    body_data.get('contact_email')
                )
            )
            game_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'id': game_id, 'status': 'pending'})
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            game_id = body_data.get('id')
            status = body_data.get('status')
            
            cur.execute(
                "UPDATE games SET status = %s WHERE id = %s",
                (status, game_id)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True})
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            game_id = params.get('id')
            
            cur.execute(
                "DELETE FROM games WHERE id = %s",
                (game_id,)
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