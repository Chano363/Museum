import pytest
import base64
import io
import os
import sys
import json
import numpy as np
from PIL import Image
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

from sketch_api import (
    build_prompt,
    extract_sketch_features,
    calculate_similarity,
    load_texture_database,
    get_default_texture_db,
    match_texture_from_db,
    BRONZE_PROMPT_TEMPLATES,
    BRONZE_QUALITY_PROMPT
)


def create_test_image(width=256, height=256, color='white'):
    img = Image.new('RGB', (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    image_bytes = buf.getvalue()
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    return image_bytes, f'data:image/png;base64,{base64_image}'


class TestBuildPrompt:
    """测试提示词构建功能"""
    
    def test_build_prompt_ding_taotie(self):
        prompt = build_prompt('ding', 'taotie')
        assert '青铜鼎' in prompt
        assert '饕餮纹' in prompt
        assert 'masterpiece' in prompt
    
    def test_build_prompt_zun_fengniao(self):
        prompt = build_prompt('zun', 'fengniao')
        assert '青铜尊' in prompt
        assert '凤鸟纹' in prompt
    
    def test_build_prompt_jue_yunlei(self):
        prompt = build_prompt('jue', 'yunlei')
        assert '青铜爵' in prompt
        assert '云雷纹' in prompt
    
    def test_build_prompt_unknown_type(self):
        prompt = build_prompt('unknown_type', 'unknown_style')
        assert '青铜器' in prompt
        assert 'masterpiece' in prompt
    
    def test_build_prompt_empty_params(self):
        prompt = build_prompt('', '')
        assert len(prompt) > 0


class TestExtractSketchFeatures:
    """测试草图特征提取功能"""
    
    def test_extract_features_basic(self):
        image_bytes, _ = create_test_image()
        features = extract_sketch_features(image_bytes)
        
        assert isinstance(features, np.ndarray)
        assert len(features) == 48
    
    def test_extract_features_different_images(self):
        image_bytes1, _ = create_test_image(color='white')
        image_bytes2, _ = create_test_image(color='black')
        
        features1 = extract_sketch_features(image_bytes1)
        features2 = extract_sketch_features(image_bytes2)
        
        assert not np.array_equal(features1, features2)
    
    def test_extract_features_invalid_data(self):
        features = extract_sketch_features(b'invalid image data')
        assert isinstance(features, np.ndarray)
        assert len(features) == 48


class TestCalculateSimilarity:
    """测试相似度计算功能"""
    
    def test_identical_vectors(self):
        import numpy as np
        vec = np.array([1, 2, 3, 4, 5])
        similarity = calculate_similarity(vec, vec)
        assert similarity == pytest.approx(1.0, abs=1e-6)
    
    def test_orthogonal_vectors(self):
        import numpy as np
        vec1 = np.array([1, 0, 0])
        vec2 = np.array([0, 1, 0])
        similarity = calculate_similarity(vec1, vec2)
        assert similarity == pytest.approx(0.0, abs=1e-6)
    
    def test_different_length_vectors(self):
        import numpy as np
        vec1 = np.array([1, 2, 3])
        vec2 = np.array([1, 2, 3, 4])
        similarity = calculate_similarity(vec1, vec2)
        assert similarity == 0.0
    
    def test_zero_vectors(self):
        import numpy as np
        vec = np.zeros(5)
        similarity = calculate_similarity(vec, vec)
        assert similarity == 0.0


class TestTextureDatabase:
    """测试纹理数据库功能"""
    
    def test_get_default_texture_db(self):
        textures = get_default_texture_db()
        
        assert isinstance(textures, list)
        assert len(textures) > 0
        
        for texture in textures:
            assert 'id' in texture
            assert 'url' in texture
            assert 'bronze_type' in texture
    
    def test_load_texture_database(self):
        textures = load_texture_database()
        
        assert isinstance(textures, list)
        assert len(textures) >= 5
    
    def test_texture_urls_exist(self):
        textures = get_default_texture_db()
        
        for texture in textures:
            url = texture['url']
            assert url.startswith('/static/textures/bronze/')
            assert url.endswith('.jpg') or url.endswith('.png')


class TestMatchTextureFromDb:
    """测试纹理匹配功能"""
    
    def test_match_by_bronze_type(self):
        image_bytes, _ = create_test_image()
        
        result = match_texture_from_db(image_bytes, 'ding', 'default')
        
        assert 'texture_url' in result
        assert 'matched_id' in result
        assert result['texture_url'].startswith('/static/textures/')
    
    def test_match_unknown_type(self):
        image_bytes, _ = create_test_image()
        
        result = match_texture_from_db(image_bytes, 'unknown_type', 'default')
        
        assert 'texture_url' in result
    
    def test_match_returns_valid_url(self):
        image_bytes, _ = create_test_image()
        
        result = match_texture_from_db(image_bytes, 'jue', 'default')
        
        assert result['texture_url'].endswith('.jpg') or result['texture_url'].endswith('.png')


class TestAPIEndpoints:
    """测试API端点（需要运行服务器）"""
    
    BASE_URL = 'http://localhost:5000'
    
    @pytest.mark.integration
    def test_generate_endpoint_no_sketch(self):
        import requests
        
        response = requests.post(f'{self.BASE_URL}/api/generate', json={})
        
        assert response.status_code == 400
        data = response.json()
        assert data['success'] == False
    
    @pytest.mark.integration
    def test_generate_endpoint_with_sketch(self):
        import requests
        
        _, base64_image = create_test_image()
        
        payload = {
            'sketch': base64_image,
            'prompt': 'test bronze ware',
            'style': 'taotie',
            'bronze_type': 'ding'
        }
        
        response = requests.post(f'{self.BASE_URL}/api/generate', json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert 'success' in data
        assert 'texture_url' in data
    
    @pytest.mark.integration
    def test_config_endpoint(self):
        import requests
        
        response = requests.get(f'{self.BASE_URL}/api/config')
        
        assert response.status_code == 200
        data = response.json()
        assert 'provider' in data
        assert 'siliconflow_configured' in data
    
    @pytest.mark.integration
    def test_textures_list_endpoint(self):
        import requests
        
        response = requests.get(f'{self.BASE_URL}/api/textures/list')
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.integration
    def test_textures_list_with_type_filter(self):
        import requests
        
        response = requests.get(f'{self.BASE_URL}/api/textures/list?type=ding')
        
        assert response.status_code == 200
        data = response.json()
        
        for texture in data:
            assert texture.get('bronze_type') == 'ding'


if __name__ == '__main__':
    pytest.main(['-v', __file__])
