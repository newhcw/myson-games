# 项目概述

儿童游戏平台，从零构建。纯 H5 实现 3D FPS 射击游戏，Vue 3 + Vite 前端，所有数据本地存储。核心约束：目标用户是儿童，视觉风格必须 Q 版卡通化，无后端服务器依赖。

## 架构说明

### 项目结构

- **根目录**：OpenSpec 配置和工作流管理
- **openspec/changes/kids-game-platform/**：当前活跃变更，包含所有规格文档
  - `proposal.md`：项目高层描述和目标
  - `design.md`：技术决策和架构设计
  - `specs/`：各能力的详细规格说明
  - `tasks.md`：实现任务列表
- **apps/frontend** 前端代码

### 技术栈

- **前端框架**：Vue 3 + Vite
- **3D 渲染**：Three.js + TresJS (@tresjs/core)
- **状态管理**：Pinia
- **路由**：Vue Router
- **存储**：localStorage + IndexedDB（无后端）
- **3D 模型**：glTF/GLB 格式

## 目录结构

```text
apps/                → 项目目录
  backend/           → 后端源码
    api/             → 请求/响应 DTO
    internal/        → 后端核心代码实现
      cmd/           → 服务启动 & 路由注册
      consts/        → 全局常量定义
      controller/    → HTTP控制器
      dao/           → 数据访问层
      model/         → 数据模型
        do/          → 数据操作对象（自动生成）
        entity/      → 数据库实体（自动生成）
      service/       → 业务逻辑层
    manifest/        → 交付清单
      config/        → 后端配置文件
      sql/           → DDL + Seed DML（版本 SQL 文件）
        mock-data/   → Mock 演示/测试数据（不随生产部署）
  frontend/         →  前端（Vue 3）
    ├── public/             # 静态资源（不打包）
    ├── src/
    │   ├── api/            # 所有后端接口
    │   │   └── user.js
    │   ├── assets/         # 图片、样式
    │   ├── components/     # 公共组件
    │   ├── router/         # 路由
    │   │   └── index.js
    │   ├── store/          # 全局状态（pinia）
    │   │   └── user.js
    │   ├── utils/          # 工具
    │   │   └── request.js  # axios 封装
    │   ├── views/          # 页面
    │   │   ├── Login.vue
    │   │   └── Home.vue
    │   ├── App.vue
    │   └── main.js
    ├── .env.development
    ├── package.json
    └── vite.config.js
hack/                → 项目脚本及测试用例文件
  ├── tests/             → E2E 测试（Playwright）
  ├── e2e/             → 测试用例文件
  ├── fixtures/        → 测试 fixtures（auth, config）
  ├── pages/           → 页面对象模型
openspec/            → OpenSpec相关文档
  changes/           → OpenSpec变更记录
```

## 常用命令

### OpenSpec 命令

- `/opsx new` - 创建新变更
- `/opsx propose` - 生成完整变更提案
- `/opsx apply` - 开始实施变更
- `/opsx verify` - 验证实现是否符合规格
- `/opsx archive` - 归档已完成的变更
- `/opsx explore` - 探索模式，理清需求
- `/opsx ff` - 快速生成所有产物

### 开发命令

```bash
# 在 frontend 目录下
cd apps/frontend
npm run dev     # 启动开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览生产构建
```

### E2E 测试

```bash
cd hack
pnpm test              # 运行全部测试
pnpm test:headed       # 带浏览器界面运行
pnpm test:ui           # 交互式测试界面
pnpm test:debug        # 调试模式
pnpm report            # 查看 HTML 报告
```

测试文件命名规范：`TC{NNNN}*.spec.ts`（如 `TC0001-login.spec.ts`），放在 `hack/tests/e2e/` 对应模块目录下。
E2E测试目录：`hack`

## 开发流程规范

本项目采用`SDD`驱动开发，使用`OpenSpec`工具辅助落地。变更记录存放在 `openspec/changes/` 目录下。每个变更包含：`proposal.md`（提案）、`design.md`（设计）、`specs/`（增量规范）、`tasks.md`（任务清单）。

**执行流程**：

1. 通过`/opsx:explore`斜杠指令在给定需求描述的前提下进行探索式对话，分析问题、设计方案、评估风险。
2. 当探索式对话结束，形成清晰的解决方案时，通过`/opsx:propose`斜杠指令将其转化为正式的`OpenSpec`变更提案文档。命令形如`/opsx:propose feature-name`，其中`feature-name`为当前变更的描述性名称（使用`kebab-case`格式，如`user-auth`、`data-export`）。随后会在`openspec/changes`目录下会自动生成一个新的变更文件夹，包含增量规范系列文档(`spec/`)、技术实现方案(`design.md`)、变更提案与思路(`proposal.md`)和实现任务清单(`tasks.md`)。
3. 随后执行`/opsx:apply`开始按照`tasks.md`中的任务清单逐条执行，完成代码实现、测试、文档更新等工作。任务完成后需要调用`/openspec-review`技能进行代码和规范审查。如果涉及前端页面交互的功能，那么都需要创建`e2e`测试用例，并且在执行过程中自动运行测试用例，确保功能实现的正确性。
4. 用户反馈的问题或者改进点，需要调用`/openspec-feedback`技能进行修复和验证，并更新相关`OpenSpec`文档。任务完成后需要调用`/openspec-review`技能进行审查。
5. 用户确认本次迭代功能已完成没有问题后，则执行`/opsx:archive`斜杠指令将本次变更归档。归档前需要调用`/openspec-review`技能进行全面的变更审查，确保代码质量和规范遵循。

**关键规则**：

- 当用户报告问题缺陷/改进建议时（无论中文或英文），如果当前项目存在活跃的`OpenSpec`变更，那么必须调用`openspec-feedback`技能。**无论反馈内容是否与当前活跃迭代的主要功能相关，都必须追加到当前活跃迭代中**，便于统一管理和归档。
- 审查技能`/openspec-review`自动在以下节点触发：`/opsx:apply`任务完成后、`/opsx:feedback`任务完成后、`/opsx:archive`归档前。

## 代码开发规范

### 后端代码规范

### 前端代码规范

### E2E测试规范

- 测试用例必须要完整覆盖业务模块的各项操作（如增删改查等操作），保证功能的完整性和可用性
- 所有的用例需要在`tasks.md`中有工作记录，并且使用`openspec-e2e`技能生成和管理对应的测试用例
- 修复`bug`或新增功能涉及**用户可观察行为变化**时，必须编写或更新对应的`E2E`测试用例
- 修改完成后必须运行相关`E2E`测试并确认通过，再标记任务完成
- 纯内部重构（无`UI`变化）可豁免，但需运行已有测试套件确认无回归
- 使用测试工具（如`Playwright`）在涉及创建文件的场景（如截图），应该将创建的文件放置到项目根目录`temp/`目录下