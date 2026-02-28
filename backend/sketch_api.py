"""
青铜器草图生图API模块
使用火山引擎即梦AI进行图像生成
"""
from flask import Blueprint, request, jsonify
import base64
import os
import sys
import uuid
import json
import numpy as np
from PIL import Image
import io
from typing import Optional
import requests
from gallery_db import (
    save_artwork, get_artwork_list, get_artwork_by_id, 
    toggle_like, get_leaderboard, is_liked, get_artwork_count, delete_artwork
)

def get_base_path():
    if getattr(sys, 'frozen', False):
        return sys._MEIPASS
    return os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

sketch_bp = Blueprint('sketch', __name__, url_prefix='/api')

ARK_API_KEY = os.getenv('ARK_API_KEY', '')
JIMENG_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations'
JIMENG_MODEL = os.getenv('JIMENG_MODEL', 'doubao-seedream-4-5-251128')

PROMPT_TEMPLATES = {
    "floral": {
        "name": "花卉图案",
        "prompt": "中国传统花卉图案，牡丹、莲花、菊花，瓷器风格，精美细腻，高清纹理"
    },
    "landscape": {
        "name": "山水图案",
        "prompt": "中国山水画风格，水墨意境，远山近水，诗意盎然，瓷器装饰，高清纹理"
    },
    "geometric": {
        "name": "几何图案",
        "prompt": "中国传统几何纹样，回纹、云纹，对称美感，瓷器装饰，高清纹理"
    },
    "dragon": {
        "name": "龙凤图案",
        "prompt": "中国传统龙凤纹样，祥云缭绕，华贵典雅，瓷器装饰，高清纹理"
    },
    "bird": {
        "name": "花鸟图案",
        "prompt": "中国花鸟画风格，梅兰竹菊，雅致清新，瓷器装饰，高清纹理"
    },
    "custom": {
        "name": "自定义",
        "prompt": ""
    }
}

BASE_MODEL_INFO = {
    "vase": "瓷器花瓶",
    "gui": "簋（食器）",
    "jue": "爵（饮酒器）"
}


def build_prompt(style: str, custom_prompt: str = "") -> str:
    """
    构建图案生成提示词
    
    Args:
        style: 图案风格
        custom_prompt: 自定义提示词
        
    Returns:
        完整的提示词字符串
    """
    template = PROMPT_TEMPLATES.get(style, PROMPT_TEMPLATES["floral"])
    base_prompt = template["prompt"]
    
    if style == "custom" and custom_prompt:
        return f"{custom_prompt}，masterpiece, best quality"
    
    if custom_prompt:
        return f"{base_prompt}，{custom_prompt}，masterpiece, best quality"
    
    return f"{base_prompt}，masterpiece, best quality"


def call_jimeng_api(prompt: str, image_base64: str = None) -> dict:
    """
    调用火山引擎Ark平台即梦AI API生成图像
    
    Args:
        prompt: 提示词
        image_base64: 输入图像的base64编码（用于图生图）
        
    Returns:
        包含生成结果的字典
    """
    if not ARK_API_KEY:
        print("ERROR: ARK_API_KEY not configured")
        return {'success': False, 'error': '即梦AI未配置，请在.env中设置ARK_API_KEY'}
    
    try:
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {ARK_API_KEY}'
        }
        
        if image_base64:
            payload = {
                "model": JIMENG_MODEL,
                "prompt": prompt,
                "image": f"data:image/png;base64,{image_base64}",
                "size": "1024x1024",
                "n": 1
            }
        else:
            payload = {
                "model": JIMENG_MODEL,
                "prompt": prompt,
                "size": "1024x1024",
                "n": 1
            }
        
        print(f"\n=== Calling Jimeng API (Ark Platform) ===")
        print(f"URL: {JIMENG_API_URL}")
        print(f"Model: {JIMENG_MODEL}")
        print(f"Prompt: {prompt[:100]}...")
        print(f"Image provided: {bool(image_base64)}")
        
        response = requests.post(
            JIMENG_API_URL,
            headers=headers,
            json=payload,
            timeout=120
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Response keys: {list(result.keys())}")
            
            image_url = None
            if 'data' in result and len(result['data']) > 0:
                first_item = result['data'][0]
                if isinstance(first_item, dict):
                    image_url = first_item.get('url')
            
            if not image_url:
                print(f"No image_url in response: {result}")
                return {'success': False, 'error': 'No image in response'}
            
            print(f"Downloading image from: {image_url[:80]}...")
            img_response = requests.get(image_url, timeout=30)
            
            if img_response.status_code != 200:
                return {'success': False, 'error': f'Failed to download image: {img_response.status_code}'}
            
            image_bytes = img_response.content
            print(f"Downloaded image: {len(image_bytes)} bytes")
            
            filename = f"bronze_{uuid.uuid4().hex[:8]}.png"
            static_dir = os.path.join(get_base_path(), 'public', 'static', 'textures', 'generated')
            save_path = os.path.join(static_dir, filename)
            
            os.makedirs(static_dir, exist_ok=True)
            
            with open(save_path, 'wb') as f:
                f.write(image_bytes)
            
            print(f"Image saved to: {save_path}")
            
            return {
                'success': True,
                'image_url': f"/static/textures/generated/{filename}"
            }
        else:
            error_msg = response.text
            try:
                error_data = response.json()
                error_msg = error_data.get('message', error_msg)
            except:
                pass
            print(f"API ERROR: {response.status_code}")
            print(f"Error details: {error_msg}")
            return {'success': False, 'error': f'即梦AI错误: {error_msg[:200]}'}
            
    except requests.RequestException as e:
        print(f"Request exception: {e}")
        return {'success': False, 'error': f'网络错误: {str(e)}'}
    except Exception as e:
        print(f"Unexpected exception: {e}")
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': f'错误: {str(e)}'}


def generate_image(sketch_bytes: bytes, prompt: str, strength: float = 0.75) -> dict:
    """
    调用即梦AI生成图像
    
    Args:
        sketch_bytes: 草图字节数据
        prompt: 提示词
        strength: 去噪强度（保留参数，即梦API不使用）
        
    Returns:
        包含生成结果的字典
    """
    print(f"\n=== generate_image called ===")
    
    sketch_base64 = base64.b64encode(sketch_bytes).decode('utf-8')
    return call_jimeng_api(prompt, sketch_base64)


@sketch_bp.route('/generate', methods=['POST'])
def generate_texture():
    """
    AI生成模型纹理图案
    
    Request JSON:
        {
            "sketch": "base64_image_data",
            "prompt": "用户自定义提示词",
            "style": "floral",
            "base_model": "vase",
            "custom_prompt": "额外描述",
            "strength": 0.75
        }
        
    Response JSON:
        {
            "success": true,
            "texture_url": "/static/textures/generated/xxx.png",
            "fallback": false,
            "base_model": "vase"
        }
    """
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
            
        sketch_data = data.get('sketch', '')
        user_prompt = data.get('prompt', '')
        style = data.get('style', 'floral')
        base_model = data.get('base_model', 'vase')
        custom_prompt = data.get('custom_prompt', '')
        strength = data.get('strength', 0.75)
        
        if not sketch_data:
            return jsonify({'success': False, 'error': 'No sketch provided'}), 400
        
        full_prompt = build_prompt(style, custom_prompt)
        if user_prompt:
            full_prompt = f"{user_prompt}，{full_prompt}"
        
        if sketch_data.startswith('data:image'):
            sketch_data = sketch_data.split(',')[1]
        
        try:
            sketch_bytes = base64.b64decode(sketch_data)
        except Exception:
            return jsonify({'success': False, 'error': 'Invalid sketch data'}), 400
        
        result = generate_image(sketch_bytes, full_prompt, strength)
        
        if result['success']:
            return jsonify({
                'success': True,
                'texture_url': result['image_url'],
                'fallback': False,
                'base_model': base_model
            })
        else:
            print(f"AI generation failed: {result['error']}, using fallback")
            fallback_result = match_texture_from_db(sketch_bytes, base_model, style)
            return jsonify({
                'success': True,
                'texture_url': fallback_result['texture_url'],
                'fallback': True,
                'matched_id': fallback_result['matched_id'],
                'base_model': base_model
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@sketch_bp.route('/config', methods=['GET'])
def get_config():
    """
    获取当前AI配置信息
    """
    return jsonify({
        'ark_configured': bool(ARK_API_KEY),
        'jimeng_model': JIMENG_MODEL
    })


@sketch_bp.route('/config', methods=['POST'])
def set_config():
    """
    临时设置AI配置（运行时有效，重启后失效）
    """
    global ARK_API_KEY, JIMENG_MODEL
    
    data = request.json
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    if 'ark_api_key' in data:
        ARK_API_KEY = data['ark_api_key']
    
    if 'jimeng_model' in data:
        JIMENG_MODEL = data['jimeng_model']
    
    return jsonify({'success': True})


def match_texture_from_db(sketch_bytes: bytes, bronze_type: str, style: str) -> dict:
    """
    从预选纹理库匹配最相似的纹理
    
    Args:
        sketch_bytes: 草图字节数据
        bronze_type: 青铜器类型
        style: 纹饰风格
        
    Returns:
        包含匹配结果的字典
    """
    print(f"\n=== match_texture_from_db called ===")
    print(f"bronze_type: {bronze_type}, style: {style}")
    
    texture_db = load_texture_database()
    print(f"Loaded {len(texture_db)} textures from database")
    
    sketch_features = extract_sketch_features(sketch_bytes)
    
    candidates = [t for t in texture_db if t.get('bronze_type') == bronze_type]
    print(f"Found {len(candidates)} candidates for type '{bronze_type}'")
    
    if not candidates:
        candidates = texture_db
        print(f"Using all textures as candidates")
    
    if not candidates:
        return {
            'texture_url': '/static/textures/bronze/Censer.jpg',
            'matched_id': 'default'
        }
    
    best_match = None
    best_score = -1
    
    for texture in candidates:
        texture_features = np.array(texture.get('features', []))
        if len(texture_features) > 0:
            score = calculate_similarity(sketch_features, texture_features)
            if score > best_score:
                best_score = score
                best_match = texture
    
    if best_match is None:
        best_match = candidates[0]
    
    print(f"Selected texture: {best_match.get('url')}")
    
    return {
        'texture_url': best_match.get('url', '/static/textures/bronze/Censer.jpg'),
        'matched_id': best_match.get('id', 'unknown')
    }


def extract_sketch_features(image_bytes: bytes) -> np.ndarray:
    """
    提取图像特征向量
    
    Args:
        image_bytes: 图像字节数据
        
    Returns:
        特征向量
    """
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('L')
        image = image.resize((256, 256))
        
        arr = np.array(image)
        
        hist, _ = np.histogram(arr, bins=32, range=(0, 256))
        hist = hist / (hist.sum() + 1e-7)
        
        try:
            from scipy import ndimage
            edges = ndimage.sobel(arr)
            edge_density, _ = np.histogram(edges, bins=16)
            edge_density = edge_density / (edge_density.sum() + 1e-7)
        except ImportError:
            edge_density = np.zeros(16)
        
        return np.concatenate([hist, edge_density])
    except Exception:
        return np.zeros(48)


def calculate_similarity(features1: np.ndarray, features2: np.ndarray) -> float:
    """
    计算两个特征向量的余弦相似度
    
    Args:
        features1: 特征向量1
        features2: 特征向量2
        
    Returns:
        相似度分数
    """
    if len(features1) != len(features2):
        return 0.0
    
    norm1 = np.linalg.norm(features1)
    norm2 = np.linalg.norm(features2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return float(np.dot(features1, features2) / (norm1 * norm2))


def load_texture_database() -> list:
    """
    加载预选纹理库配置
    
    Returns:
        纹理库列表
    """
    db_path = os.path.join(get_base_path(), 'backend', 'data', 'bronze_textures.json')
    
    if os.path.exists(db_path):
        try:
            with open(db_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    
    return get_default_texture_db()


def get_default_texture_db() -> list:
    """
    获取默认青铜器纹理库
    
    Returns:
        默认纹理列表
    """
    return [
        {
            "id": "bronze_jue_001",
            "url": "/static/textures/bronze/Wine warmer (Jue).jpg",
            "bronze_type": "jue",
            "style": "default",
            "name": "青铜爵",
            "features": []
        },
        {
            "id": "bronze_vase_001",
            "url": "/static/textures/bronze/Vase in Shape of Archaic Chinese bronze.jpg",
            "bronze_type": "zun",
            "style": "default",
            "name": "仿古青铜瓶",
            "features": []
        },
        {
            "id": "bronze_censer_001",
            "url": "/static/textures/bronze/Censer.jpg",
            "bronze_type": "ding",
            "style": "default",
            "name": "青铜香炉",
            "features": []
        },
        {
            "id": "bronze_parakeets_001",
            "url": "/static/textures/bronze/One of a pair of parakeets.jpg",
            "bronze_type": "zun",
            "style": "fengniao",
            "name": "鹦鹉纹青铜器",
            "features": []
        },
        {
            "id": "bronze_pipa_001",
            "url": "/static/textures/bronze/Pipa.jpg",
            "bronze_type": "you",
            "style": "default",
            "name": "琵琶形青铜器",
            "features": []
        }
    ]


@sketch_bp.route('/textures/list', methods=['GET'])
def get_textures():
    """
    获取纹理列表
    
    Query Parameters:
        type: 青铜器类型（可选）
        
    Returns:
        纹理列表JSON
    """
    bronze_type = request.args.get('type', '')
    texture_db = load_texture_database()
    
    if bronze_type:
        texture_db = [t for t in texture_db if t.get('bronze_type') == bronze_type]
    
    return jsonify(texture_db)


@sketch_bp.route('/textures/match', methods=['POST'])
def match_texture():
    """
    手动匹配纹理
    
    Request JSON:
        {
            "sketch": "base64_image_data",
            "bronze_type": "ding",
            "style": "taotie"
        }
        
    Returns:
        匹配结果JSON
    """
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
            
        sketch_data = data.get('sketch', '')
        bronze_type = data.get('bronze_type', 'ding')
        style = data.get('style', 'taotie')
        
        if sketch_data.startswith('data:image'):
            sketch_data = sketch_data.split(',')[1]
        
        sketch_bytes = base64.b64decode(sketch_data)
        result = match_texture_from_db(sketch_bytes, bronze_type, style)
        
        return jsonify({
            'success': True,
            'texture_url': result['texture_url'],
            'matched_id': result['matched_id']
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@sketch_bp.route('/gallery/upload', methods=['POST'])
def gallery_upload():
    """
    上传图片（base64格式）
    
    Request JSON:
        {
            "image_data": "data:image/png;base64,..."
        }
        
    Returns:
        {
            "success": true,
            "image_url": "/static/textures/generated/xxx.png"
        }
    """
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        image_data = data.get('image_data', '')
        if not image_data:
            return jsonify({'success': False, 'error': 'No image_data provided'}), 400
        
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        try:
            image_bytes = base64.b64decode(image_data)
        except Exception:
            return jsonify({'success': False, 'error': 'Invalid image data'}), 400
        
        filename = f"model_{uuid.uuid4().hex[:8]}.png"
        static_dir = os.path.join(get_base_path(), 'public', 'static', 'textures', 'generated')
        save_path = os.path.join(static_dir, filename)
        
        os.makedirs(static_dir, exist_ok=True)
        
        with open(save_path, 'wb') as f:
            f.write(image_bytes)
        
        return jsonify({
            'success': True,
            'image_url': f"/static/textures/generated/{filename}"
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@sketch_bp.route('/gallery/save', methods=['POST'])
def gallery_save():
    """
    保存作品到作品集
    
    Request JSON:
        {
            "image_url": "/static/textures/generated/xxx.png",
            "texture_url": "/static/textures/generated/yyy.png",
            "prompt": "生成提示词",
            "base_model": "vase",
            "style": "floral",
            "custom_prompt": "额外描述"
        }
        
    Returns:
        保存结果JSON
    """
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        image_url = data.get('image_url', '')
        texture_url = data.get('texture_url', '')
        prompt = data.get('prompt', '')
        base_model = data.get('base_model', 'vase')
        style = data.get('style', 'floral')
        custom_prompt = data.get('custom_prompt', '')
        name = data.get('name', '未命名作品')
        
        if not image_url:
            return jsonify({'success': False, 'error': 'No image_url provided'}), 400
        
        result = save_artwork(image_url, prompt, base_model, style, custom_prompt, texture_url, name)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@sketch_bp.route('/gallery/list', methods=['GET'])
def gallery_list():
    """
    获取作品集列表
    
    Query Parameters:
        limit: 返回数量限制（默认50）
        offset: 偏移量（默认0）
        
    Returns:
        作品列表JSON
    """
    try:
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        artworks = get_artwork_list(limit, offset)
        total = get_artwork_count()
        
        return jsonify({
            'success': True,
            'artworks': artworks,
            'total': total
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@sketch_bp.route('/gallery/<int:artwork_id>', methods=['GET'])
def gallery_detail(artwork_id: int):
    """
    获取作品详情
    
    Path Parameters:
        artwork_id: 作品ID
        
    Returns:
        作品详情JSON
    """
    try:
        artwork = get_artwork_by_id(artwork_id)
        
        if artwork:
            artwork['is_liked'] = is_liked(artwork_id)
            return jsonify({
                'success': True,
                'artwork': artwork
            })
        else:
            return jsonify({'success': False, 'error': '作品不存在'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@sketch_bp.route('/gallery/like', methods=['POST'])
def gallery_like():
    """
    点赞/取消点赞作品
    
    Request JSON:
        {
            "artwork_id": 1
        }
        
    Returns:
        操作结果JSON
    """
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        artwork_id = data.get('artwork_id')
        if not artwork_id:
            return jsonify({'success': False, 'error': 'No artwork_id provided'}), 400
        
        result = toggle_like(int(artwork_id))
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@sketch_bp.route('/gallery/delete', methods=['POST'])
def gallery_delete():
    """
    删除作品
    
    Request JSON:
        {
            "artwork_id": 1
        }
        
    Returns:
        操作结果JSON
    """
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        artwork_id = data.get('artwork_id')
        if not artwork_id:
            return jsonify({'success': False, 'error': 'No artwork_id provided'}), 400
        
        result = delete_artwork(int(artwork_id))
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@sketch_bp.route('/gallery/leaderboard', methods=['GET'])
def gallery_leaderboard():
    """
    获取排行榜
    
    Query Parameters:
        limit: 返回数量限制（默认20）
        
    Returns:
        排行榜列表JSON
    """
    try:
        limit = int(request.args.get('limit', 20))
        leaderboard = get_leaderboard(limit)
        
        return jsonify({
            'success': True,
            'leaderboard': leaderboard
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
