# 手势动作对应关系表

## 1. 手势类型 (gesture) 与手势位置 (HandPosition) 对应关系

| 手势类型 (gesture) | 手势名称 | 手势位置 (HandPosition) |
|-------------------|---------|------------------------|
| 31, 35, 36 | 手掌 (palm), 停止 (stop), 停止反转 (stop_inverted) | 向上开始 (UP_START) / 向上结束 (UP_END) |
| 25 | 拳头 (fist) | 拳头 (FIST) / 缩放开始 (ZOOM_IN_START) / 缩放结束 (ZOOM_OUT_END) |
| 0 | 手向下 (hand_down) | 向下开始 (DOWN_START) / 向下结束 (DOWN_END) |
| 1 | 手向右 (hand_right) | 向右开始 (RIGHT_START) / 向右结束 (RIGHT_END) |
| 2, 41 | 手向左 (hand_left), 三枪 (three_gun) | 向左开始 (LEFT_START) / 向左结束 (LEFT_END) |
| 30 | 一 (one) | 快速向上开始 (FAST_SWIPE_DOWN_START) / 快速向上结束 (FAST_SWIPE_UP_END) |
| 19 | 点 (point) | 快速向下开始 (FAST_SWIPE_UP_START) / 快速向下结束 (FAST_SWIPE_DOWN_END) |
| 17 | 抓取 (grabbing) | 拖动开始 (DRAG_START) |
| 3 | 拇指食指 (thumb_index) | 缩放开始 (ZOOM_OUT_START) / 缩放结束 (ZOOM_IN_END) |
| 38 | 三2 (three2) | 缩放开始 (ZOOM_OUT_START) / 缩放结束 (ZOOM_IN_END) |
| 5 | 拇指右 (thumb_right) | 向右开始2 (RIGHT_START2) / 向右结束2 (RIGHT_END2) |
| 4 | 拇指左 (thumb_left) | 向左开始2 (LEFT_START2) / 向左结束2 (LEFT_END2) |
| 15 | 二右 (two_right) | 向右开始3 (RIGHT_START3) / 向右结束3 (RIGHT_END3) |
| 14 | 二左 (two_left) | 向左开始3 (LEFT_START3) / 向左结束3 (LEFT_END3) |
| 39 | 二上 (two_up) | 向上开始3 (UP_START3) / 向上结束3 (UP_END3) |
| 16 | 二下 (two_down) | 向下开始3 (DOWN_START3) / 向下结束3 (DOWN_END3) |
| 6 | 拇指下 (thumb_down) | 向上开始2 (UP_START2) / 向下结束2 (DOWN_END2) |

## 2. 手势位置 (HandPosition) 与动作事件 (Event) 对应关系

| 手势位置序列 | 动作事件 (Event) |
|-------------|------------------|
| RIGHT_START → LEFT_END | 向左滑动 (SWIPE_LEFT) |
| LEFT_START → RIGHT_END | 向右滑动 (SWIPE_RIGHT) |
| DOWN_START → UP_END | 向上滑动 (SWIPE_UP) |
| UP_START → DOWN_END | 向下滑动 (SWIPE_DOWN) |
| FIST | 拳头 (FIST) |
| FAST_SWIPE_UP_START → FAST_SWIPE_UP_END | 快速向上滑动 (FAST_SWIPE_UP) |
| FAST_SWIPE_DOWN_START → FAST_SWIPE_DOWN_END | 快速向下滑动 (FAST_SWIPE_DOWN) |
| ZOOM_IN_START → ZOOM_IN_END | 放大 (ZOOM_IN) |
| ZOOM_OUT_START → ZOOM_OUT_END | 缩小 (ZOOM_OUT) |
| RIGHT_START2 → LEFT_END2 | 向左滑动2 (SWIPE_LEFT2) |
| LEFT_START2 → RIGHT_END2 | 向右滑动2 (SWIPE_RIGHT2) |
| DOWN_START2 → UP_END2 | 向上滑动2 (SWIPE_UP2) |
| UP_START2 → DOWN_END2 | 向下滑动2 (SWIPE_DOWN2) |
| RIGHT_START3 → LEFT_END3 | 向左滑动3 (SWIPE_LEFT3) |
| LEFT_START3 → RIGHT_END3 | 向右滑动3 (SWIPE_RIGHT3) |
| DOWN_START3 → UP_END3 | 向上滑动3 (SWIPE_UP3) |
| UP_START3 → DOWN_END3 | 向下滑动3 (SWIPE_DOWN3) |
| 手势 18 (grip) → 手势 11/12 (hand heart) | 拖动2 (DRAG2) → 释放2 (DROP2) |
| 手势 29 (ok) → 手势 11/12 (hand heart) | 拖动3 (DRAG3) → 释放3 (DROP3) |
| 手势 17 (grabbing) → 手势 25 (fist) | 拖动 (DRAG) → 释放 (DROP) |
| ZOOM_IN_START → 手势 19 (point) | 点击 (TAP) / 双击 (DOUBLE_TAP) |

## 3. 动作事件 (Event) 与具体操作对应关系

| 动作事件 (Event) | 图片显示 (ShowImg) | 键盘按键 (PressKey) |
|------------------|-------------------|---------------------|
| SWIPE_LEFT, SWIPE_LEFT2, SWIPE_LEFT3 | 1 (Left.jpg) | left |
| SWIPE_RIGHT, SWIPE_RIGHT2, SWIPE_RIGHT3 | 2 (Right.jpg) | right |
| SWIPE_UP, SWIPE_UP2, SWIPE_UP3, FAST_SWIPE_UP | 3 (Up.jpg) | up |
| SWIPE_DOWN, SWIPE_DOWN2, SWIPE_DOWN3, FAST_SWIPE_DOWN | 4 (Down.jpg) | down |
| FIST | 0 (Start.png) | - |

## 4. 手势识别流程

1. **手势检测**：系统检测到手势并识别出手势类型 (gesture)
2. **位置判断**：根据手势类型和历史位置，设置当前手势位置 (HandPosition)
3. **动作识别**：根据手势位置序列，识别出对应的动作事件 (Event)
4. **操作执行**：触发对应的图片显示和键盘按键操作

## 5. 备注

- 部分手势类型和动作事件没有对应的处理逻辑，如 COUNTERCLOCK (逆时针) 和 CLOCKWISE (顺时针)
- 手势识别需要满足最小帧数要求，以确保动作的稳定性
- 手势位置的判断依赖于历史手势序列，形成完整的动作流程