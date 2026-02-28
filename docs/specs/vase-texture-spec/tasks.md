# 花瓶纹理创作功能重构任务清单

## Phase 1: 准备工作

### 1.1 3D花瓶模型
- [ ] 确认/获取白色3D花瓶模型（GLTF格式）
- [ ] 将模型放入 `public/3Dmodels/vase/` 目录
- [ ] 测试模型在 model-viewer 中的加载效果

### 1.2 常量配置
- [ ] 创建 `src/constants/vaseConstants.ts`
- [ ] 定义预设提示词模板
- [ ] 定义花瓶模型配置

---

## Phase 2: 后端重构

### 2.1 提示词模板更新
- [ ] 在 `backend/sketch_api.py` 中添加 `VASE_PROMPT_TEMPLATES`
- [ ] 实现 `build_vase_prompt()` 函数
- [ ] 更新 `/api/generate` 接口参数处理

### 2.2 数据库调整
- [ ] 在 `backend/gallery_db.py` 中更新字段名
- [ ] 添加数据迁移逻辑（向后兼容）

---

## Phase 3: 前端组件重构

### 3.1 VasePreview.vue（新增）
- [ ] 创建 `src/components/SketchGenerator/VasePreview.vue`
- [ ] 实现 model-viewer 集成
- [ ] 实现纹理动态应用功能
- [ ] 添加加载状态和错误处理

### 3.2 GeneratePanel.vue（重构）
- [ ] 移除青铜器类型选择
- [ ] 添加预设提示词选择（花卉、山水、几何、龙凤、花鸟、自定义）
- [ ] 添加自定义提示词输入框
- [ ] 更新提示词预览显示

### 3.3 SketchGenerator.vue（重构）
- [ ] 更新布局：画布 + 花瓶预览 + 控制面板
- [ ] 集成 VasePreview 组件
- [ ] 更新事件处理逻辑
- [ ] 更新服务调用参数

### 3.4 LeaderboardPanel.vue（移除emoji）
- [ ] 移除所有emoji图标
- [ ] 替换为SVG图标
- [ ] 更新样式

### 3.5 其他组件调整
- [ ] 更新 TextureResult.vue（如需要）
- [ ] 更新 GalleryPanel.vue（如需要）
- [ ] 更新 ToolBar.vue（如需要）

---

## Phase 4: 服务层更新

### 4.1 sketchGenerator.ts
- [ ] 更新 `GenerateConfig` 接口
- [ ] 更新 `generateFromSketch()` 方法参数
- [ ] 添加新的类型定义

---

## Phase 5: 样式调整

### 5.1 响应式布局
- [ ] 实现桌面端三栏布局
- [ ] 实现平板端布局
- [ ] 实现移动端布局

### 5.2 图标替换
- [ ] 创建/收集所需SVG图标
- [ ] 替换所有emoji为SVG

---

## Phase 6: 测试与验证

### 6.1 功能测试
- [ ] 测试画布绘制功能
- [ ] 测试预设提示词选择
- [ ] 测试自定义提示词输入
- [ ] 测试AI生图功能
- [ ] 测试纹理应用功能
- [ ] 测试作品保存功能
- [ ] 测试排行榜功能
- [ ] 测试点赞功能

### 6.2 构建验证
- [ ] 运行 `npm run build` 确保构建成功
- [ ] 运行 `npm run test` 确保测试通过

---

## Phase 7: 文档更新

### 7.1 项目文档
- [ ] 更新 `docs/CHANGELOG.md`
- [ ] 更新相关技术文档（如需要）

---

## 任务依赖关系

```
Phase 1 (准备工作)
    ↓
Phase 2 (后端) ←→ Phase 3 (前端组件)
    ↓                    ↓
Phase 4 (服务层) ←→ Phase 5 (样式)
    ↓
Phase 6 (测试)
    ↓
Phase 7 (文档)
```

---

## 预计工时

| 阶段 | 预计时间 |
|------|----------|
| Phase 1 | 0.5天 |
| Phase 2 | 0.5天 |
| Phase 3 | 2天 |
| Phase 4 | 0.5天 |
| Phase 5 | 0.5天 |
| Phase 6 | 0.5天 |
| Phase 7 | 0.5天 |
| **总计** | **5天** |
