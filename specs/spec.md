# AI生图时间计算功能规格说明

## 功能概述

在AI生图功能中添加生图时间计算功能，仅在开发模式(dev)启动时显示，方便调试和性能分析。

## 需求分析

### 用户需求
- 在开发调试时能够看到每次AI生图所消耗的时间
- 仅在dev模式下显示，不影响生产环境用户体验

### 技术需求
- 前端记录从发起请求到收到响应的时间
- 在结果展示区域显示生图耗时
- 使用 `import.meta.env.DEV` 判断开发模式

## 实现方案

### 修改文件清单

| 文件路径 | 修改内容 |
|---------|---------|
| `src/services/sketchGenerator.ts` | 添加生图时间计算，返回耗时信息 |
| `src/components/SketchGenerator/SketchGenerator.vue` | 接收并传递生图时间 |
| `src/components/SketchGenerator/TextureResult.vue` | 在dev模式下显示生图时间 |

### 接口变更

#### GenerateResult 接口
```typescript
export interface GenerateResult {
  success: boolean
  textureUrl: string
  fallback: boolean
  matchedId?: string
  error?: string
  generationTime?: number  // 新增：生图耗时(毫秒)
}
```

### 详细设计

#### 1. sketchGenerator.ts 修改

在 `generateFromSketch` 方法中：
- 使用 `performance.now()` 记录开始时间
- 计算请求耗时
- 在返回结果中包含 `generationTime` 字段

```typescript
async generateFromSketch(
  sketchDataUrl: string,
  config: GenerateConfig
): Promise<GenerateResult> {
  this.isGenerating.value = true
  const startTime = performance.now()  // 记录开始时间
  
  try {
    const response = await fetch(...)
    const endTime = performance.now()  // 记录结束时间
    
    return {
      success: result.success,
      textureUrl: result.texture_url || '',
      fallback: result.fallback || false,
      matchedId: result.matched_id,
      error: result.error,
      generationTime: Math.round(endTime - startTime)  // 计算耗时
    }
  } catch (error) {
    // ...
  } finally {
    this.isGenerating.value = false
  }
}
```

#### 2. SketchGenerator.vue 修改

- 接收 `generationTime` 并传递给 `TextureResult` 组件
- 添加 `generationTime` 响应式变量

```typescript
const generationTime = ref<number | null>(null)

async function handleGenerate(config: GenerateConfig) {
  // ...
  const result = await sketchGenerator.generateFromSketch(sketchData, config)
  generationTime.value = result.generationTime ?? null
  // ...
}
```

#### 3. TextureResult.vue 修改

- 添加 `generationTime` prop
- 使用 `import.meta.env.DEV` 判断是否显示
- 在结果图片下方显示耗时信息

```vue
<template>
  <div class="texture-result">
    <!-- 现有内容 -->
    
    <!-- Dev模式下显示生图时间 -->
    <div v-if="showDevInfo && generationTime" class="dev-time-info">
      <span class="dev-badge">DEV</span>
      <span>生图耗时: {{ generationTime }}ms</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const showDevInfo = import.meta.env.DEV

defineProps({
  textureUrl: { type: String, default: '' },
  isFallback: { type: Boolean, default: false },
  generationTime: { type: Number, default: null }
})
</script>
```

### UI设计

#### 显示位置
在生成的纹理图片下方、操作按钮上方显示

#### 样式设计
```
┌─────────────────────────────────┐
│     [生成的纹理图片]             │
│                                 │
├─────────────────────────────────┤
│ [DEV] 生图耗时: 3542ms          │  ← 仅dev模式显示
├─────────────────────────────────┤
│ [保存作品] [下载] [重新生成]     │
└─────────────────────────────────┘
```

#### 样式规范
- 背景色: `rgba(196, 146, 16, 0.1)`
- 边框: `1px dashed rgba(196, 146, 16, 0.5)`
- 文字颜色: `rgba(255, 255, 255, 0.7)`
- DEV标签背景: `#C49210`
- DEV标签文字: `#1a1a1a`
- 字体大小: `13px`
- 内边距: `8px 12px`

## 测试要点

### 功能测试
- [ ] dev模式下生图后正确显示耗时
- [ ] 生产构建后不显示耗时信息
- [ ] 生图失败时不显示耗时或显示为0
- [ ] 耗时数值合理（毫秒单位）

### 边界情况
- [ ] 网络超时时耗时计算正确
- [ ] 快速连续生图时耗时显示正确
- [ ] 重新生成时耗时更新正确

## 注意事项

1. 使用 `performance.now()` 而非 `Date.now()` 获取更高精度
2. 耗时取整到毫秒，不显示小数
3. 仅在前端计算耗时，不依赖后端返回
4. 样式使用虚线边框区分，表明这是调试信息
