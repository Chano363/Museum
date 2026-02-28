# AI生图时间计算功能 - 任务列表

## 任务概览

| 序号 | 任务 | 优先级 | 状态 |
|------|------|--------|------|
| 1 | 修改 sketchGenerator.ts 添加时间计算 | 高 | 待开始 |
| 2 | 修改 SketchGenerator.vue 传递时间数据 | 高 | 待开始 |
| 3 | 修改 TextureResult.vue 显示时间信息 | 高 | 待开始 |
| 4 | 测试验证功能 | 中 | 待开始 |

---

## 任务详情

### 任务1: 修改 sketchGenerator.ts 添加时间计算

**文件**: `src/services/sketchGenerator.ts`

**修改内容**:
1. 在 `GenerateResult` 接口中添加 `generationTime?: number` 字段
2. 在 `generateFromSketch` 方法中:
   - 方法开始时使用 `performance.now()` 记录开始时间
   - 请求成功后计算耗时
   - 在返回结果中包含 `generationTime`

**代码位置**: 第11-17行(接口)、第26-71行(方法)

---

### 任务2: 修改 SketchGenerator.vue 传递时间数据

**文件**: `src/components/SketchGenerator/SketchGenerator.vue`

**修改内容**:
1. 添加 `generationTime` 响应式变量
2. 在 `handleGenerate` 方法中接收并存储 `generationTime`
3. 在 `handleRegenerate` 方法中更新 `generationTime`
4. 将 `generationTime` 传递给 `TextureResult` 组件

**代码位置**: 
- 变量定义: 第104-110行附近
- handleGenerate: 第148-175行
- TextureResult组件调用: 第55-62行

---

### 任务3: 修改 TextureResult.vue 显示时间信息

**文件**: `src/components/SketchGenerator/TextureResult.vue`

**修改内容**:
1. 添加 `generationTime` prop
2. 添加 `showDevInfo` 计算属性 (使用 `import.meta.env.DEV`)
3. 在模板中添加dev时间显示区域
4. 添加相应样式

**代码位置**: 
- props定义: 第45-48行
- 模板: 第10-40行
- 样式: 第57-142行

---

### 任务4: 测试验证功能

**测试步骤**:
1. 运行 `npm run dev` 启动开发服务器
2. 打开AI生图功能
3. 绘制草图并点击生成
4. 验证生图耗时显示正确
5. 运行 `npm run build` 构建生产版本
6. 验证生产版本不显示耗时信息

---

## 执行顺序

```
任务1 → 任务2 → 任务3 → 任务4
```

## 预估工作量

- 任务1: 5分钟
- 任务2: 5分钟
- 任务3: 10分钟
- 任务4: 10分钟

**总计**: 约30分钟
