"""
作品集数据库模块
使用SQLite存储用户创作的AI生成作品
"""
import sqlite3
import os
import sys
from datetime import datetime
from typing import Optional, List, Dict, Any


def get_db_path() -> str:
    """
    获取数据库文件路径
    
    Returns:
        数据库文件的绝对路径
    """
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    
    data_dir = os.path.join(base_path, 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    return os.path.join(data_dir, 'gallery.db')


def get_connection() -> sqlite3.Connection:
    """
    获取数据库连接
    
    Returns:
        SQLite连接对象
    """
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_database() -> None:
    """
    初始化数据库，创建表结构
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS artworks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_path TEXT NOT NULL,
            texture_path TEXT,
            prompt TEXT,
            base_model TEXT DEFAULT 'vase',
            style TEXT DEFAULT 'floral',
            custom_prompt TEXT DEFAULT '',
            name TEXT DEFAULT '未命名作品',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            likes INTEGER DEFAULT 0
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            artwork_id INTEGER NOT NULL,
            liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_artworks_likes ON artworks(likes DESC)
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_artworks_created ON artworks(created_at DESC)
    ''')
    
    conn.commit()
    conn.close()


def save_artwork(image_path: str, prompt: str = '', base_model: str = 'vase', style: str = 'floral', custom_prompt: str = '', texture_path: str = '', name: str = '未命名作品') -> Dict[str, Any]:
    """
    保存作品到数据库
    
    Args:
        image_path: 图片路径（3D模型截图）
        prompt: 生成提示词
        base_model: 基础模型类型
        style: 图案风格
        custom_prompt: 自定义提示词
        texture_path: 纹理图片路径
        name: 作品名称
        
    Returns:
        包含保存结果的字典
    """
    try:
        init_database()
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO artworks (image_path, texture_path, prompt, base_model, style, custom_prompt, name, created_at, likes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        ''', (image_path, texture_path, prompt, base_model, style, custom_prompt, name, datetime.now().isoformat()))
        
        artwork_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'id': artwork_id,
            'message': '作品保存成功',
            'base_model': base_model
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def get_artwork_list(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    """
    获取作品列表
    
    Args:
        limit: 返回数量限制
        offset: 偏移量
        
    Returns:
        作品列表
    """
    try:
        init_database()
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, image_path, texture_path, prompt, base_model, style, custom_prompt, name, created_at, likes
            FROM artworks
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ''', (limit, offset))
        
        rows = cursor.fetchall()
        conn.close()
        
        artworks = []
        for row in rows:
            artworks.append({
                'id': row['id'],
                'image_url': row['image_path'],
                'texture_url': row['texture_path'],
                'prompt': row['prompt'],
                'name': row['name'] if 'name' in row.keys() else '未命名作品',
                'base_model': row['base_model'],
                'style': row['style'],
                'custom_prompt': row['custom_prompt'],
                'created_at': row['created_at'],
                'likes': row['likes']
            })
        
        return artworks
    except Exception:
        return []


def get_artwork_by_id(artwork_id: int) -> Optional[Dict[str, Any]]:
    """
    根据ID获取作品详情
    
    Args:
        artwork_id: 作品ID
        
    Returns:
        作品详情字典，不存在则返回None
    """
    try:
        init_database()
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, image_path, texture_path, prompt, base_model, style, custom_prompt, name, created_at, likes
            FROM artworks
            WHERE id = ?
        ''', (artwork_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                'id': row['id'],
                'image_url': row['image_path'],
                'texture_url': row['texture_path'],
                'prompt': row['prompt'],
                'name': row['name'] if 'name' in row.keys() else '未命名作品',
                'base_model': row['base_model'],
                'style': row['style'],
                'custom_prompt': row['custom_prompt'],
                'created_at': row['created_at'],
                'likes': row['likes']
            }
        return None
    except Exception:
        return None


def toggle_like(artwork_id: int) -> Dict[str, Any]:
    """
    切换点赞状态（点赞/取消点赞）
    
    Args:
        artwork_id: 作品ID
        
    Returns:
        包含操作结果的字典
    """
    try:
        init_database()
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM artworks WHERE id = ?', (artwork_id,))
        if not cursor.fetchone():
            conn.close()
            return {
                'success': False,
                'error': '作品不存在'
            }
        
        cursor.execute('SELECT id FROM user_likes WHERE artwork_id = ?', (artwork_id,))
        existing_like = cursor.fetchone()
        
        if existing_like:
            cursor.execute('DELETE FROM user_likes WHERE artwork_id = ?', (artwork_id,))
            cursor.execute('UPDATE artworks SET likes = likes - 1 WHERE id = ? AND likes > 0', (artwork_id,))
            liked = False
        else:
            cursor.execute('INSERT INTO user_likes (artwork_id, liked_at) VALUES (?, ?)', 
                          (artwork_id, datetime.now().isoformat()))
            cursor.execute('UPDATE artworks SET likes = likes + 1 WHERE id = ?', (artwork_id,))
            liked = True
        
        conn.commit()
        
        cursor.execute('SELECT likes FROM artworks WHERE id = ?', (artwork_id,))
        row = cursor.fetchone()
        new_likes = row['likes'] if row else 0
        
        conn.close()
        
        return {
            'success': True,
            'liked': liked,
            'likes': new_likes
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def delete_artwork(artwork_id: int) -> Dict[str, Any]:
    """
    删除作品
    
    Args:
        artwork_id: 作品ID
        
    Returns:
        包含操作结果的字典
    """
    try:
        init_database()
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, image_path, texture_path FROM artworks WHERE id = ?', (artwork_id,))
        artwork = cursor.fetchone()
        
        if not artwork:
            conn.close()
            return {
                'success': False,
                'error': '作品不存在'
            }
        
        image_path = artwork['image_path']
        texture_path = artwork['texture_path']
        
        cursor.execute('DELETE FROM user_likes WHERE artwork_id = ?', (artwork_id,))
        
        cursor.execute('DELETE FROM artworks WHERE id = ?', (artwork_id,))
        
        conn.commit()
        conn.close()
        
        deleted_files = []
        if image_path and image_path.startswith('/static/'):
            file_path = image_path.replace('/static/', 'public/static/')
            if os.path.exists(file_path):
                os.remove(file_path)
                deleted_files.append(image_path)
        
        if texture_path and texture_path.startswith('/static/'):
            file_path = texture_path.replace('/static/', 'public/static/')
            if os.path.exists(file_path):
                os.remove(file_path)
                deleted_files.append(texture_path)
        
        return {
            'success': True,
            'deleted_files': deleted_files
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def get_leaderboard(limit: int = 20) -> List[Dict[str, Any]]:
    """
    获取排行榜（按点赞数降序）
    
    Args:
        limit: 返回数量限制
        
    Returns:
        排行榜作品列表
    """
    try:
        init_database()
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, image_path, texture_path, prompt, base_model, style, custom_prompt, name, created_at, likes
            FROM artworks
            ORDER BY likes DESC, created_at DESC
            LIMIT ?
        ''', (limit,))
        
        rows = cursor.fetchall()
        conn.close()
        
        leaderboard = []
        for rank, row in enumerate(rows, 1):
            leaderboard.append({
                'rank': rank,
                'id': row['id'],
                'image_url': row['image_path'],
                'texture_url': row['texture_path'],
                'name': row['name'] if 'name' in row.keys() else '未命名作品',
                'prompt': row['prompt'],
                'base_model': row['base_model'],
                'style': row['style'],
                'custom_prompt': row['custom_prompt'],
                'created_at': row['created_at'],
                'likes': row['likes']
            })
        
        return leaderboard
    except Exception:
        return []


def is_liked(artwork_id: int) -> bool:
    """
    检查作品是否已被点赞
    
    Args:
        artwork_id: 作品ID
        
    Returns:
        是否已点赞
    """
    try:
        init_database()
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM user_likes WHERE artwork_id = ?', (artwork_id,))
        result = cursor.fetchone()
        conn.close()
        
        return result is not None
    except Exception:
        return False


def get_artwork_count() -> int:
    """
    获取作品总数
    
    Returns:
        作品总数
    """
    try:
        init_database()
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) as count FROM artworks')
        row = cursor.fetchone()
        conn.close()
        
        return row['count'] if row else 0
    except Exception:
        return 0
