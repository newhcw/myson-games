## Why

当前游戏缺少一个温馨的退出体验。儿童点击"离开森林"按钮后直接退出，缺乏友好的告别交互和成就感展示。一个精心设计的告别页面可以增强用户体验，让儿童愿意再次回到游戏中。

## What Changes

- 新增 `/goodbye` 路由及对应的 Goodbye.vue 页面组件
- 创建夜晚森林风格的告别场景，与首页白天场景形成对比
- 展示本次游戏的统计数据（得分、击杀数、存活时间）
- 添加可爱的森林小动物角色动画道别
- 提供"再玩一次"和"回家啦"两个交互按钮
- 实现萤火虫飞舞和星星闪烁的动态效果

## Capabilities

### New Capabilities
- `goodbye-page`: 告别页面，提供温暖的游戏结束体验

## Impact

- 新增路由：`/goodbye`（apps/frontend/src/router/index.ts）
- 新增页面组件：`apps/frontend/src/views/Goodbye.vue`
- 样式整合：使用现有 CSS 变量和森林主题风格