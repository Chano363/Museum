"""
青铜器草图生图API模块
支持多种AI生图服务：火山引擎即梦AI、Siliconflow、本地SD WebUI
"""
from flask import Blueprint, request, jsonify
import base64
import os
import uuid
import json
import numpy as np
from PIL import Image
import io
from typing import Optional
import requests

sketch_bp = Blueprint('sketch', __name__, url_prefix='/api')

AI_PROVIDER = os.getenv('AI_PROVIDER', 'jimeng')
SILICONFLOW_API_KEY = os.getenv('SILICONFLOW_API_KEY', '')
SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1'
SD_WEBUI_URL = os.getenv('SD_WEBUI_URL', 'http://127.0.0.1:7860')

ARK_API_KEY = os.getenv('ARK_API_KEY', '')
JIMENG_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations'
JIMENG_MODEL = os.getenv('JIMENG_MODEL', 'doubao-seedream-4-5-251128')

DEFAULT_NEGATIVE_PROMPT = """
low quality, blurry, distorted, modern, cartoon, 
anime, realistic photo, watermark, text, signature
"""

BRONZE_QUALITY_PROMPT = """
masterpiece, best quality, ancient Chinese bronze ware,
Shang Dynasty style, bronze texture, patina, 
museum collection, professional photography, 
detailed ornamentation, high resolution texture
"""

BRONZE_PROMPT_TEMPLATES = {
    "ding": {
        "base": "中国古代青铜鼎，三足两耳，",
        "styles": {
            "taotie": "饕餮纹装饰，兽面纹样，神秘威严",
            "yunlei": "云雷纹底纹，回旋几何图案",
            "kui": "夔龙纹饰，单足龙形纹样",
            "fengniao": "凤鸟纹装饰，华丽精美",
            "liuli": "蟠螭纹饰，盘曲龙形"
        }
    },
    "zun": {
        "base": "中国古代青铜尊，盛酒器，",
        "styles": {
            "fengniao": "凤鸟纹装饰，华丽精美",
            "taotie": "饕餮纹饰，庄重典雅",
            "yunlei": "云雷纹底纹，古朴简洁"
        }
    },
    "jue": {
        "base": "中国古代青铜爵，饮酒器，三足流尾，",
        "styles": {
            "yunlei": "云雷纹装饰，简洁古朴",
            "taotie": "饕餮纹饰，神秘庄重"
        }
    },
    "gu": {
        "base": "中国古代青铜觚，饮酒器，喇叭口，",
        "styles": {
            "taotie": "饕餮纹装饰，精美华丽",
            "yunlei": "云雷纹底纹，简洁大方"
        }
    },
    "pan": {
        "base": "中国古代青铜盘，盛水器，",
        "styles": {
            "liuli": "蟠螭纹装饰，盘曲生动",
            "yunlei": "云雷纹装饰，古朴典雅"
        }
    },
    "you": {
        "base": "中国古代青铜卣，盛酒器，提梁，",
        "styles": {
            "fengniao": "凤鸟纹装饰，华丽精美",
            "kui": "夔龙纹饰，神秘威严"
        }
    }
}


def build_prompt(bronze_type: str, style: str) -> str:
    """
    构建青铜器生成提示词
    
    Args:
        bronze_type: 青铜器类型
        style: 纹饰风格
        
    Returns:
        完整的提示词字符串
    """
    template = BRONZE_PROMPT_TEMPLATES.get(bronze_type, {})
    base = template.get("base", "中国古代青铜器，")
    style_desc = template.get("styles", {}).get(style, "精美纹饰")
    
    return f"{base}{style_desc}，商周时期风格，青铜质感，铜绿锈迹，古朴厚重，博物馆藏品级，高清纹理，masterpiece, best quality"


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
                "size": "1920x1920",
                "n": 1
            }
        else:
            payload = {
                "model": JIMENG_MODEL,
                "prompt": prompt,
                "size": "1920x1920",
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
            static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'static', 'textures', 'generated')
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


def call_siliconflow_api(prompt: str, image_base64: str = None, strength: float = 0.75) -> dict:
    """
    调用 Siliconflow API 生成图像
    
    Args:
        prompt: 提示词
        image_base64: 输入图像的base64编码（用于图生图）
        strength: 去噪强度
        
    Returns:
        包含生成结果的字典
    """
    if not SILICONFLOW_API_KEY:
        print("ERROR: SILICONFLOW_API_KEY not configured")
        return {'success': False, 'error': 'SILICONFLOW_API_KEY not configured'}
    
    headers = {
        'Authorization': f'Bearer {SILICONFLOW_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        if image_base64:
            payload = {
                "model": "Kwai-Kolors/Kolors",
                "prompt": prompt,
                "negative_prompt": DEFAULT_NEGATIVE_PROMPT,
                "image": f"data:image/png;base64,{image_base64}",
                "image_size": "512x512",
                "num_inference_steps": 20,
                "guidance_scale": 7.5
            }
        else:
            payload = {
                "model": "Kwai-Kolors/Kolors",
                "prompt": prompt,
                "negative_prompt": DEFAULT_NEGATIVE_PROMPT,
                "image_size": "512x512",
                "num_inference_steps": 20,
                "guidance_scale": 7.5
            }
        endpoint = f"{SILICONFLOW_API_URL}/images/generations"
        
        print(f"\n=== Calling Siliconflow API ===")
        print(f"Endpoint: {endpoint}")
        print(f"Model: {payload['model']}")
        print(f"Image provided: {bool(image_base64)}")
        print(f"Prompt: {prompt[:100]}...")
        
        response = requests.post(endpoint, headers=headers, json=payload, timeout=120)
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Response keys: {list(result.keys())}")
            print(f"Full response: {json.dumps(result, indent=2)[:500]}...")
            
            image_data = None
            
            if 'images' in result and len(result['images']) > 0:
                img_item = result['images'][0]
                if isinstance(img_item, dict) and 'url' in img_item:
                    image_data = img_item['url']
                    print(f"Found image URL in 'images[0].url'")
                else:
                    image_data = img_item
                    print(f"Found image in 'images' array")
            elif 'image' in result:
                image_data = result['image']
                print(f"Found image in 'image' field")
            elif 'data' in result and len(result['data']) > 0:
                first_item = result['data'][0]
                if isinstance(first_item, dict):
                    image_data = first_item.get('url') or first_item.get('b64_json')
                else:
                    image_data = first_item
                print(f"Found image in 'data' array")
            
            if not image_data:
                print(f"ERROR: No image data found in response")
                return {'success': False, 'error': 'No image in response'}
            
            if isinstance(image_data, str):
                if image_data.startswith('data:image'):
                    image_data = image_data.split(',')[1]
                    print(f"Extracted base64 from data URL")
                
                if image_data.startswith('http'):
                    print(f"Image is URL, downloading: {image_data[:100]}...")
                    img_response = requests.get(image_data, timeout=30)
                    if img_response.status_code == 200:
                        image_bytes = img_response.content
                        print(f"Downloaded image: {len(image_bytes)} bytes")
                    else:
                        return {'success': False, 'error': f'Failed to download image: {img_response.status_code}'}
                else:
                    try:
                        image_bytes = base64.b64decode(image_data)
                        print(f"Decoded base64: {len(image_bytes)} bytes")
                    except Exception as e:
                        print(f"Base64 decode error: {e}")
                        return {'success': False, 'error': f'Invalid image data: {str(e)}'}
            else:
                return {'success': False, 'error': 'Unexpected image data format'}
            
            if len(image_bytes) < 1000:
                print(f"WARNING: Image data too small ({len(image_bytes)} bytes), might be corrupted")
            
            filename = f"bronze_{uuid.uuid4().hex[:8]}.png"
            static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'static', 'textures', 'generated')
            save_path = os.path.join(static_dir, filename)
            
            os.makedirs(static_dir, exist_ok=True)
            
            with open(save_path, 'wb') as f:
                f.write(image_bytes)
            
            print(f"Image saved to: {save_path}")
            print(f"File size: {len(image_bytes)} bytes")
            print(f"File exists: {os.path.exists(save_path)}")
            
            return {
                'success': True,
                'image_url': f"/static/textures/generated/{filename}"
            }
        else:
            error_msg = response.text
            try:
                error_data = response.json()
                error_code = error_data.get('code', 0)
                error_msg = error_data.get('message', error_msg)
                
                if error_code == 30001:
                    print(f"API ERROR: 账户余额不足，请充值后重试")
                    return {'success': False, 'error': '账户余额不足，请充值后重试', 'need_recharge': True}
                elif error_code == 30003:
                    print(f"API ERROR: 模型已禁用")
                    return {'success': False, 'error': '当前模型不可用，请联系管理员'}
            except:
                pass
            print(f"API ERROR: {response.status_code}")
            print(f"Error details: {error_msg}")
            return {'success': False, 'error': f'API错误: {error_msg[:100]}'}
            
    except requests.RequestException as e:
        print(f"Request exception: {e}")
        return {'success': False, 'error': f'Network error: {str(e)}'}
    except Exception as e:
        print(f"Unexpected exception: {e}")
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': f'Error: {str(e)}'}


def call_sd_webui(sketch_bytes: bytes, prompt: str, negative_prompt: str, strength: float) -> dict:
    """
    调用 Stable Diffusion WebUI API 进行图生图
    
    Args:
        sketch_bytes: 草图字节数据
        prompt: 正向提示词
        negative_prompt: 负向提示词
        strength: 去噪强度
        
    Returns:
        包含生成结果的字典
    """
    try:
        sketch_base64 = base64.b64encode(sketch_bytes).decode('utf-8')
        
        payload = {
            "init_images": [f"data:image/png;base64,{sketch_base64}"],
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "denoising_strength": strength,
            "steps": 30,
            "cfg_scale": 7,
            "width": 512,
            "height": 512,
            "sampler_name": "DPM++ 2M Karras"
        }
        
        response = requests.post(
            f"{SD_WEBUI_URL}/sdapi/v1/img2img",
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            image_data = result['images'][0]
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            filename = f"bronze_{uuid.uuid4().hex[:8]}.png"
            static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'static', 'textures', 'generated')
            save_path = os.path.join(static_dir, filename)
            
            os.makedirs(static_dir, exist_ok=True)
            with open(save_path, 'wb') as f:
                f.write(base64.b64decode(image_data))
            
            return {
                'success': True,
                'image_url': f"/static/textures/generated/{filename}"
            }
        else:
            return {'success': False, 'error': f'SD WebUI returned {response.status_code}'}
            
    except requests.RequestException as e:
        return {'success': False, 'error': f'Request failed: {str(e)}'}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def generate_image(sketch_bytes: bytes, prompt: str, strength: float = 0.75) -> dict:
    """
    根据配置的AI提供商生成图像
    
    Args:
        sketch_bytes: 草图字节数据
        prompt: 提示词
        strength: 去噪强度
        
    Returns:
        包含生成结果的字典
    """
    print(f"\n=== generate_image called ===")
    print(f"AI_PROVIDER: {AI_PROVIDER}")
    
    sketch_base64 = base64.b64encode(sketch_bytes).decode('utf-8')
    
    if AI_PROVIDER == 'jimeng':
        return call_jimeng_api(prompt, sketch_base64)
    elif AI_PROVIDER == 'siliconflow':
        return call_siliconflow_api(prompt, sketch_base64, strength)
    elif AI_PROVIDER == 'sd_webui':
        return call_sd_webui(sketch_bytes, prompt, DEFAULT_NEGATIVE_PROMPT, strength)
    else:
        return {'success': False, 'error': f'Unknown AI provider: {AI_PROVIDER}'}


@sketch_bp.route('/generate', methods=['POST'])
def generate_texture():
    """
    AI生成青铜器纹理
    
    Request JSON:
        {
            "sketch": "base64_image_data",
            "prompt": "用户自定义提示词",
            "style": "taotie",
            "bronze_type": "ding",
            "strength": 0.75
        }
        
    Response JSON:
        {
            "success": true,
            "texture_url": "/static/textures/generated/xxx.png",
            "fallback": false
        }
    """
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
            
        sketch_data = data.get('sketch', '')
        user_prompt = data.get('prompt', '')
        style = data.get('style', 'taotie')
        bronze_type = data.get('bronze_type', 'ding')
        strength = data.get('strength', 0.75)
        
        if not sketch_data:
            return jsonify({'success': False, 'error': 'No sketch provided'}), 400
        
        full_prompt = f"{user_prompt}, {BRONZE_QUALITY_PROMPT}"
        
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
                'fallback': False
            })
        else:
            print(f"AI generation failed: {result['error']}, using fallback")
            fallback_result = match_texture_from_db(sketch_bytes, bronze_type, style)
            return jsonify({
                'success': True,
                'texture_url': fallback_result['texture_url'],
                'fallback': True,
                'matched_id': fallback_result['matched_id']
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
        'provider': AI_PROVIDER,
        'ark_configured': bool(ARK_API_KEY),
        'jimeng_model': JIMENG_MODEL,
        'siliconflow_configured': bool(SILICONFLOW_API_KEY),
        'sd_webui_url': SD_WEBUI_URL
    })


@sketch_bp.route('/config', methods=['POST'])
def set_config():
    """
    临时设置AI配置（运行时有效，重启后失效）
    """
    global AI_PROVIDER, SILICONFLOW_API_KEY, ARK_API_KEY, JIMENG_MODEL
    
    data = request.json
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    if 'provider' in data:
        AI_PROVIDER = data['provider']
    
    if 'ark_api_key' in data:
        ARK_API_KEY = data['ark_api_key']
    
    if 'jimeng_model' in data:
        JIMENG_MODEL = data['jimeng_model']
    
    if 'siliconflow_api_key' in data:
        SILICONFLOW_API_KEY = data['siliconflow_api_key']
    
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
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'bronze_textures.json')
    
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
