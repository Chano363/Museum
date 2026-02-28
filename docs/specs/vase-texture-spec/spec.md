# 花瓶纹理创作功能重构规格说明

## 1. 功能概述

### 1.1 业务目标

重构现有的青铜器纹理创作功能，改为模型纹理创作：
- 用户提供三个白色3D模型供选择：瓷器花瓶、簋（食器）、爵（饮酒器）
- 用户在画布上绘制草图作为模型的装饰图案
- 通过预设提示词或自定义提示词生成图案
- 生成的图案作为纹理覆盖到3D模型上
- 生成的模型自动添加到 MainView 展示列表，支持手势交互
- 排行榜功能保持不变

### 1.2 核心功能变更

| 原功能 | 新功能 |
|--------|--------|
| 青铜器类型选择（鼎、尊、爵等） | 三个预制白模选择（瓷器花瓶、簋、爵） |
| 青铜器纹饰风格（饕餮纹、云雷纹等） | 预设提示词模板（花卉、山水、几何等） |
| 青铜器纹理生成 | 模型图案生成 |
| 无3D预览 | 3D模型实时展示纹理效果 |
| 生成结果仅保存图片 | 生成模型加入 MainView 展示列表 |

### 1.3 用户流程

```
用户打开创作面板
       ↓
选择基础模型（瓷器花瓶/簋/爵）
       ↓
看到白色3D模型预览
       ↓
在画布上绘制草图图案
       ↓
选择预设提示词 或 输入自定义提示词
       ↓
点击生成按钮
       ↓
AI生成图案
       ↓
图案自动应用为模型纹理
       ↓
用户可保存作品/下载/重新生成
       ↓
保存后模型自动加入 MainView 展示列表
       ↓
用户可在 MainView 中用手势交互查看
       ↓
作品参与排行榜
```

### 1.4 三个预制白模

| 模型ID | 名称 | 模型路径 | 描述 |
|--------|------|----------|------|
| vase | 瓷器花瓶 | /3Dmodels/瓷器花瓶/chinese_porcelain_vase/scene.gltf | 白色瓷器花瓶，适合花卉、山水图案 |
| gui | 簋（食器） | /3Dmodels/簋（食器）/gui_chinese_food_vessel/scene.gltf | 青铜食器，适合传统纹饰 |
| jue | 爵（饮酒器） | /3Dmodels/爵（饮酒器）/jue_wine_vessel_12th11th_c_bce/scene.gltf | 青铜饮酒器，适合简洁纹饰 |

---

## 2. 技术架构

### 2.1 组件结构

```
src/components/SketchGenerator/
├── SketchGenerator.vue      # 主容器组件（重构）
├── SketchPad.vue            # 绘图画布（保留）
├── ToolBar.vue              # 工具栏（保留）
├── GeneratePanel.vue        # 生成面板（重构）
├── TextureResult.vue        # 结果展示（重构为VasePreview.vue）
├── VasePreview.vue          # 新增：3D花瓶预览组件
├── GalleryPanel.vue         # 作品集（保留）
└── LeaderboardPanel.vue     # 排行榜（保留，移除emoji）
```

### 2.2 3D花瓶模型

使用 `@google/model-viewer` 展示3D花瓶：

```vue
<model-viewer
  ref="vaseModelRef"
  src="/3Dmodels/vase/scene.gltf"
  :style="vaseStyle"
  camera-controls
  auto-rotate
/>
```

**纹理应用方案：**
- 使用 model-viewer 的 `texture` 属性动态设置纹理
- 或使用 CSS mask 实现纹理叠加效果

### 2.3 数据流

```
┌─────────────────────────────────────────────────────────────┐
│                     前端 (Vue 3)                             │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│ SketchPad   │ PromptPanel │ VasePreview │ Leaderboard     │
│ 绘图画布    │ 提示词面板   │ 3D花瓶预览   │ 排行榜          │
└──────┬──────┴──────┬──────┴──────┬──────┴────────┬────────┘
       │             │             │               │
       ▼             ▼             ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    后端 (Flask)                              │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│ /api/generate│ /api/gallery│ /api/gallery │ /api/gallery   │
│ AI生图       │ /save       │ /like       │ /leaderboard   │
└─────────────┴─────────────┴─────────────┴─────────────────┘
```

---

## 3. 组件详细设计

### 3.1 SketchGenerator.vue（主容器重构）

**布局变更：**
- 左侧：绘图画布 + 工具栏
- 中间：3D花瓶预览
- 右侧：提示词面板 + 操作按钮

**标签页：**
- 创作（默认）
- 作品集
- 排行榜

### 3.2 GeneratePanel.vue（提示词面板重构）

**预设提示词模板：**

| 模板ID | 名称 | 提示词 |
|--------|------|--------|
| floral | 花卉图案 | 中国传统花卉图案，牡丹、莲花、菊花，瓷器风格，精美细腻 |
| landscape | 山水图案 | 中国山水画风格，水墨意境，远山近水，诗意盎然 |
| geometric | 几何图案 | 中国传统几何纹样，回纹、云纹，对称美感 |
| dragon | 龙凤图案 | 中国传统龙凤纹样，祥云缭绕，华贵典雅 |
| bird | 花鸟图案 | 中国花鸟画风格，梅兰竹菊，雅致清新 |
| custom | 自定义 | 用户自行输入 |

**UI设计：**
```
┌─────────────────────────────────┐
│  选择图案风格                    │
│  ┌─────┐ ┌─────┐ ┌─────┐       │
│  │花卉 │ │山水 │ │几何 │ ...   │
│  └─────┘ └─────┘ └─────┘       │
├─────────────────────────────────┤
│  提示词预览                      │
│  ┌─────────────────────────────┐│
│  │ 中国传统花卉图案，牡丹...    ││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  自定义提示词（可选）             │
│  ┌─────────────────────────────┐│
│  │ 输入额外描述...              ││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  [    生成图案    ]              │
└─────────────────────────────────┘
```

### 3.3 VasePreview.vue（新增组件）

**功能：**
- 展示白色3D花瓶模型
- 动态应用生成的纹理
- 支持旋转、缩放交互
- 显示生成状态

**实现方案：**

```vue
<template>
  <div class="vase-preview">
    <div class="vase-container">
      <model-viewer
        ref="modelViewerRef"
        src="/3Dmodels/vase/scene.gltf"
        :style="modelStyle"
        camera-controls
        disable-zoom
        interaction-prompt="none"
        @load="onModelLoad"
      />
      <div v-if="isGenerating" class="generating-overlay">
        <div class="spinner"></div>
        <span>生成中...</span>
      </div>
    </div>
    <div class="vase-controls">
      <button @click="resetView">重置视角</button>
      <button @click="toggleAutoRotate">自动旋转</button>
    </div>
  </div>
</template>
```

**纹理应用：**

```typescript
async function applyTexture(textureUrl: string) {
  const modelViewer = modelViewerRef.value
  if (!modelViewer) return
  
  const material = modelViewer.model.materials[0]
  if (material) {
    const texture = await modelViewer.createTexture(textureUrl)
    material.pbrMetallicRoughness.baseColorTexture.setTexture(texture)
  }
}
```

### 3.4 LeaderboardPanel.vue（移除emoji）

**变更：**
- 移除所有emoji图标
- 使用SVG图标替代

| 原emoji | 替代方案 |
|---------|----------|
| 🏆 排行榜 | SVG奖杯图标 |
| 🥇🥈🥉 | SVG金银铜牌图标 |
| ❤️ 点赞 | SVG心形图标 |

---

## 4. 后端API变更

### 4.1 修改 `/api/generate`

**请求参数变更：**

```json
{
  "sketch": "base64_image_data",
  "prompt": "中国传统花卉图案，牡丹...",
  "style": "floral",
  "custom_prompt": "额外描述（可选）"
}
```

**响应不变：**

```json
{
  "success": true,
  "texture_url": "/static/textures/generated/xxx.png",
  "fallback": false,
  "generation_time": 5000
}
```

### 4.2 提示词模板

```python
VASE_PROMPT_TEMPLATES = {
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

def build_vase_prompt(style: str, custom_prompt: str = "") -> str:
    template = VASE_PROMPT_TEMPLATES.get(style, VASE_PROMPT_TEMPLATES["floral"])
    base_prompt = template["prompt"]
    
    if custom_prompt:
        return f"{base_prompt}，{custom_prompt}，masterpiece, best quality"
    
    return f"{base_prompt}，masterpiece, best quality"
```

### 4.3 数据库变更

**artworks 表结构调整：**

```sql
-- 原字段
bronze_type TEXT DEFAULT 'ding'
style TEXT DEFAULT 'taotie'

-- 新字段
pattern_style TEXT DEFAULT 'floral'  -- 图案风格
custom_prompt TEXT DEFAULT ''        -- 自定义提示词
```

---

## 5. 3D花瓶模型

### 5.1 模型要求

- 格式：GLTF/GLB
- 材质：白色基础材质，适合纹理贴图
- 尺寸：适中，适合网页展示
- 面数：控制在合理范围，保证性能

### 5.2 模型来源

可选方案：
1. 使用现有 `public/3Dmodels/瓷器花瓶/` 目录下的模型
2. 从 Sketchfab 下载免费模型
3. 自行建模

### 5.3 模型配置

```typescript
const vaseModelConfig = {
  modelPath: '/3Dmodels/vase/scene.gltf',
  cameraOrbit: '0deg 75deg 2m',
  fieldOfView: '30deg',
  exposure: '1',
  shadowIntensity: '1',
  autoRotate: true,
  autoRotateDelay: 3000
}
```

---

## 6. UI设计规范

### 6.1 颜色方案

保持现有主题：
- 主色：`#C49210`（金色）
- 背景：`rgba(26, 26, 26, 0.95)`（深色）
- 文字：白色/金色

### 6.2 图标规范

**禁止使用emoji，统一使用SVG图标：**

```html
<!-- 奖杯图标 -->
<svg viewBox="0 0 24 24" width="24" height="24">
  <path fill="currentColor" d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94..."/>
</svg>

<!-- 心形图标 -->
<svg viewBox="0 0 24 24" width="24" height="24">
  <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3..."/>
</svg>

<!-- 画笔图标 -->
<svg viewBox="0 0 24 24" width="24" height="24">
  <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
</svg>
```

### 6.3 布局响应式

```
桌面端（>1024px）：
┌────────────┬────────────┬────────────┐
│   画布     │   花瓶预览  │   控制面板  │
│  (400px)   │   (400px)  │   (300px)  │
└────────────┴────────────┴────────────┘

平板端（768-1024px）：
┌───────────────────┬────────────┐
│      画布         │  花瓶预览  │
├───────────────────┴────────────┤
│          控制面板               │
└────────────────────────────────┘

移动端（<768px）：
┌─────────────────────┐
│       花瓶预览       │
├─────────────────────┤
│        画布          │
├─────────────────────┤
│      控制面板        │
└─────────────────────┘
```

---

## 7. 文件变更清单

### 7.1 需要修改的文件

| 文件 | 变更内容 |
|------|----------|
| `src/components/SketchGenerator/SketchGenerator.vue` | 重构布局，添加3D预览 |
| `src/components/SketchGenerator/GeneratePanel.vue` | 重构为提示词面板 |
| `src/components/SketchGenerator/TextureResult.vue` | 重构为VasePreview.vue |
| `src/components/SketchGenerator/LeaderboardPanel.vue` | 移除emoji，使用SVG图标 |
| `src/services/sketchGenerator.ts` | 更新接口参数 |
| `backend/sketch_api.py` | 更新提示词模板和API参数 |
| `backend/gallery_db.py` | 更新数据库字段 |

### 7.2 需要新增的文件

| 文件 | 说明 |
|------|------|
| `src/components/SketchGenerator/VasePreview.vue` | 3D花瓶预览组件 |
| `public/3Dmodels/vase/` | 白色花瓶3D模型目录 |
| `src/constants/vaseConstants.ts` | 花瓶相关常量配置 |

### 7.3 可以删除的文件

无（保留所有现有文件，进行重构）

---

## 8. 兼容性考虑

### 8.1 数据迁移

现有作品数据需要迁移：
- `bronze_type` → 可保留或设为默认值
- `style` → 映射到新的 `pattern_style`

### 8.2 API向后兼容

保持 `/api/generate` 接口向后兼容：
- 新增 `pattern_style` 参数（可选，默认 'floral'）
- 保留 `bronze_type` 和 `style` 参数（向后兼容）

---

## 9. 测试要点

### 9.1 功能测试

- [ ] 画布绘制功能正常
- [ ] 预设提示词选择正常
- [ ] 自定义提示词输入正常
- [ ] AI生图功能正常
- [ ] 纹理应用到花瓶正常
- [ ] 作品保存功能正常
- [ ] 排行榜显示正常
- [ ] 点赞功能正常

### 9.2 UI测试

- [ ] 无emoji图标
- [ ] SVG图标显示正常
- [ ] 响应式布局正常
- [ ] 3D模型加载正常
- [ ] 3D模型交互正常

### 9.3 性能测试

- [ ] 3D模型加载时间 < 3秒
- [ ] 纹理应用响应时间 < 1秒
- [ ] 页面渲染流畅

---

## 10. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 3D模型加载慢 | 用户体验差 | 使用轻量级模型，添加加载动画 |
| 纹理应用失败 | 功能不可用 | 提供降级方案，显示2D预览 |
| AI生图失败 | 功能不可用 | 使用预选纹理库作为fallback |
| 浏览器兼容性 | 部分用户无法使用 | 检测WebGL支持，提供提示 |
