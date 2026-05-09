## Why

当前游戏场景（天空球渐变背景）比较单调，缺乏生动的自然环境元素。添加太阳和飞行的小鸟可以显著提升场景的视觉氛围和沉浸感，让游戏世界更生动有趣，尤其符合儿童用户对 Q 版卡通化视觉风格的期待。

## What Changes

- 在游戏场景中添加一个卡通风格的太阳（带光晕动画效果）
- 在天空中添加随机飞行的小鸟（使用简单几何体组合，带翅膀扇动动画）
- 太阳作为场景中的环境光源补充，小鸟为纯装饰元素
- 所有元素在场景初始化时自动创建，无需用户交互

## Capabilities

### New Capabilities
- `scene-atmosphere`: 场景氛围装饰元素，包括太阳和小鸟的创建、动画更新和生命周期管理

### Modified Capabilities

- *无*

## Impact

- 新增文件：`src/game/environment/Sun.ts`（太阳创建和动画逻辑）、`src/game/environment/Bird.ts`（小鸟创建和动画逻辑）、`src/game/environment/EnvironmentManager.ts`（环境装饰管理器，统一管理太阳和小鸟）
- 修改文件：`src/views/FPSGame.vue`（在场景初始化时调用 EnvironmentManager）
- 无新增依赖，纯 Three.js 几何体实现
