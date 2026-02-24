"""
批量生成青铜器纹理脚本
使用 Siliconflow API 生成不同类型的青铜器纹理
"""
import requests
import base64
import os
import json
import time

SILICONFLOW_API_KEY = os.getenv('SILICONFLOW_API_KEY', '')
SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1'

OUTPUT_DIR = 'public/static/textures/bronze'

BRONZE_PROMPTS = [
    # 鼎类 - 饕餮纹
    {
        "type": "ding",
        "style": "taotie",
        "filename": "ding_001.png",
        "prompt": "ancient Chinese bronze ding tripod vessel, taotie mask pattern, Shang Dynasty style, bronze texture with green patina, museum quality, detailed ornamentation, high resolution texture, 4k"
    },
    {
        "type": "ding",
        "style": "taotie", 
        "filename": "ding_002.png",
        "prompt": "Chinese bronze ritual vessel ding, intricate taotie beast mask design, weathered bronze surface, ancient patina, Zhou Dynasty, museum artifact texture"
    },
    {
        "type": "ding",
        "style": "yunlei",
        "filename": "ding_003.png",
        "prompt": "ancient Chinese bronze ding, thunder pattern yunlei decoration, geometric spiral motifs, bronze metallic texture, antiqued surface, high detail"
    },
    # 鼎类 - 夔龙纹
    {
        "type": "ding",
        "style": "kui",
        "filename": "ding_004.png",
        "prompt": "Chinese bronze ding vessel, kui dragon pattern, single-legged dragon motif, Shang bronze style, detailed relief carving texture"
    },
    # 尊类 - 凤鸟纹
    {
        "type": "zun",
        "style": "fengniao",
        "filename": "zun_001.png",
        "prompt": "ancient Chinese bronze zun wine vessel, phoenix bird pattern, elaborate bird decoration, Western Zhou style, bronze patina texture"
    },
    {
        "type": "zun",
        "style": "taotie",
        "filename": "zun_002.png",
        "prompt": "Chinese bronze zun vessel, taotie mask ornament, ritual wine container, Shang Dynasty bronze texture, museum quality"
    },
    # 爵类
    {
        "type": "jue",
        "style": "yunlei",
        "filename": "jue_001.png",
        "prompt": "ancient Chinese bronze jue wine cup, three legs, cloud and thunder pattern, Shang Dynasty ritual vessel texture"
    },
    {
        "type": "jue",
        "style": "taotie",
        "filename": "jue_002.png",
        "prompt": "Chinese bronze jue, taotie mask decoration, ritual drinking vessel, ancient bronze surface texture"
    },
    # 觚类
    {
        "type": "gu",
        "style": "taotie",
        "filename": "gu_001.png",
        "prompt": "ancient Chinese bronze gu beaker, trumpet shape, taotie pattern bands, Shang Dynasty wine vessel texture"
    },
    {
        "type": "gu",
        "style": "yunlei",
        "filename": "gu_002.png",
        "prompt": "Chinese bronze gu vessel, yunlei thunder pattern, flared rim, ancient bronze metallic texture"
    },
    # 盘类
    {
        "type": "pan",
        "style": "liuli",
        "filename": "pan_001.png",
        "prompt": "ancient Chinese bronze pan water vessel, coiled chi dragon pattern, Spring and Autumn period, bronze texture"
    },
    # 卣类
    {
        "type": "you",
        "style": "fengniao",
        "filename": "you_001.png",
        "prompt": "Chinese bronze you wine container with handle, phoenix bird decoration, Western Zhou style, detailed bronze texture"
    },
    # 通用青铜纹理
    {
        "type": "default",
        "style": "default",
        "filename": "default.png",
        "prompt": "ancient Chinese bronze texture, green patina, weathered metallic surface, museum artifact quality, seamless texture"
    }
]

def generate_texture(prompt: str, output_path: str) -> bool:
    """使用Siliconflow API生成纹理"""
    if not SILICONFLOW_API_KEY:
        print("错误: 请设置 SILICONFLOW_API_KEY 环境变量")
        return False
    
    headers = {
        'Authorization': f'Bearer {SILICONFLOW_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        "model": "stabilityai/stable-diffusion-3-medium",
        "prompt": prompt,
        "negative_prompt": "low quality, blurry, distorted, modern, cartoon, anime, watermark, text",
        "image_size": "512x512",
        "num_inference_steps": 30
    }
    
    try:
        print(f"正在生成: {output_path}")
        response = requests.post(
            f"{SILICONFLOW_API_URL}/text-to-image",
            headers=headers,
            json=payload,
            timeout=120
        )
        
        if response.status_code == 200:
            result = response.json()
            if 'images' in result and len(result['images']) > 0:
                image_data = result['images'][0]
                if image_data.startswith('data:image'):
                    image_data = image_data.split(',')[1]
                
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                with open(output_path, 'wb') as f:
                    f.write(base64.b64decode(image_data))
                
                print(f"✓ 已保存: {output_path}")
                return True
        else:
            print(f"✗ 生成失败: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ 错误: {e}")
        return False

def main():
    print("=" * 50)
    print("青铜器纹理批量生成脚本")
    print("=" * 50)
    
    if not SILICONFLOW_API_KEY:
        print("\n请先设置环境变量:")
        print("  Windows: set SILICONFLOW_API_KEY=your_api_key")
        print("  Linux/Mac: export SILICONFLOW_API_KEY=your_api_key")
        return
    
    success_count = 0
    
    for item in BRONZE_PROMPTS:
        type_dir = os.path.join(OUTPUT_DIR, item['type'])
        output_path = os.path.join(type_dir, item['filename'])
        
        if generate_texture(item['prompt'], output_path):
            success_count += 1
        
        time.sleep(2)  # 避免API限流
    
    print("=" * 50)
    print(f"完成! 成功生成 {success_count}/{len(BRONZE_PROMPTS)} 张纹理")
    print("=" * 50)

if __name__ == '__main__':
    main()
