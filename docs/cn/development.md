# 开发指南

## 先决条件

- [Bun](https://bun.sh) >= 1.0.0
- [Docker](https://docker.com) 和 Docker Compose
- [Node.js](https://nodejs.org) >= 18 (兼容性要求)

## 快速开始

1. **克隆和设置项目:**

   ```bash
   git clone https://github.com/chatman-media/farang-marketplace.git
   cd thailand-marketplace
   ./scripts/setup-dev.sh
   ```

2. **配置环境变量:**

   ```bash
   cp .env.example .env
   # 使用您的配置编辑.env
   ```

3. **开始开发:**
   ```bash
   bun run dev
   ```

## 项目结构

```
thailand-marketplace/
├── apps/                    # 前端应用程序
│   ├── web/                # 主要Web应用程序
│   ├── admin/              # 管理面板
│   └── ton-app/            # TON Mini App
├── services/               # 后端微服务
│   └── user-service/       # 用户管理服务
├── packages/               # 共享包
│   └── shared-types/       # TypeScript类型定义
├── docker/                 # Docker配置
├── scripts/                # 开发脚本
└── docs/                   # 文档
```

## 可用脚本

### 根级命令

- `bun run dev` - 在开发模式下启动所有服务
- `bun run build` - 构建所有包和应用程序
- `bun run test` - 运行所有测试
- `bun run test:watch` - 在监视模式下运行测试
- `bun run lint` - 检查所有代码
- `bun run lint:fix` - 修复检查问题
- `bun run format` - 使用Prettier格式化代码
- `bun run type-check` - 运行TypeScript类型检查

### Docker命令

- `bun run docker:up` - 启动Docker服务
- `bun run docker:down` - 停止Docker服务
- `bun run docker:logs` - 查看Docker日志
- `bun run docker:reset` - 重置Docker环境（删除卷）

## 开发服务

### 数据库服务

- **PostgreSQL**: `localhost:5432`
  - 数据库: `marketplace`
  - 用户: `marketplace_user`
  - 密码: `marketplace_pass`

- **Redis**: `localhost:6379`
  - 开发环境中无身份验证

- **MinIO**: `localhost:9000` (API), `localhost:9001` (控制台)
  - Access Key: `minioadmin`
  - Secret Key: `minioadmin123`

### 开发工具

- **MailHog**: `http://localhost:8025`
  - 用于电子邮件测试的SMTP服务器
  - 查看已发送电子邮件的Web界面

- **PgAdmin**: `http://localhost:5050` (可选，使用 `--profile tools`)
  - 邮箱: `admin@marketplace.local`
  - 密码: `admin123`

## 架构概述

### 单体仓库结构

此项目使用Turbo进行单体仓库管理，具有以下工作区结构：

- **Apps**: 使用Vite + React构建的前端应用程序
- **Services**: 使用Node.js/TypeScript构建的后端微服务
- **Packages**: 共享库和类型定义

### 技术栈

**前端:**

- React 18 with TypeScript
- Vite 构建工具
- Tailwind CSS 样式
- Zustand 状态管理

**后端:**

- Node.js with TypeScript
- Express/Fastify API
- PostgreSQL 主数据库
- Redis 缓存和会话
- MinIO 文件存储

**开发:**

- Turbo 单体仓库管理
- Docker 本地开发环境
- ESLint + Prettier 代码质量
- Vitest 测试

## 共享类型包

`@marketplace/shared-types` 包含平台中使用的所有TypeScript接口和类型：

- **用户类型**: 用户配置文件、身份验证、角色
- **列表类型**: 产品/服务列表、类别
- **预订类型**: 预订、交易
- **CRM类型**: 客户管理、通信、活动
- **AI类型**: 对话管理、AI服务接口
- **支付类型**: 交易处理、TON集成

## 环境配置

### 必需的环境变量

```bash
# 数据库
DATABASE_URL=postgresql://marketplace_user:marketplace_pass@localhost:5432/marketplace

# Redis
REDIS_URL=redis://localhost:6379

# MinIO/S3
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# 外部API
OPENAI_API_KEY=your-openai-api-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

### 服务特定配置

每个服务可能有额外的环境变量。检查每个服务目录中的`.env.example`文件。

## 开发工作流程

### 添加新功能

1. **创建功能分支:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **如需要更新共享类型:**

   ```bash
   cd packages/shared-types
   # 添加新类型
   bun run build
   ```

3. **在服务/应用中实现:**

   ```bash
   cd services/your-service
   # 实现功能
   bun run test
   ```

4. **测试集成:**
   ```bash
   bun run test
   bun run lint
   bun run type-check
   ```

### 数据库迁移

数据库架构更改应在以下位置进行：

- `docker/postgres/init.sql` 用于初始架构
- 服务特定的迁移文件用于增量更改

### 代码质量

项目通过以下方式强制执行代码质量：

- **ESLint**: TypeScript/JavaScript的检查规则
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查
- **Vitest**: 单元和集成测试

运行质量检查：

```bash
bun run lint
bun run format:check
bun run type-check
bun run test
```

## 故障排除

### 常见问题

1. **Docker服务无法启动:**

   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

2. **端口冲突:**
   - 检查端口5432、6379、9000、9001是否可用
   - 如需要修改docker-compose.yml

3. **构建失败:**

   ```bash
   bun run clean
   bun install
   bun run build
   ```

4. **更新shared-types后的类型错误:**
   ```bash
   cd packages/shared-types
   bun run build
   cd ../..
   bun run type-check
   ```

### 获取帮助

- 检查日志: `bun run docker:logs`
- 验证服务健康状况: `docker-compose ps`
- 重置环境: `bun run docker:reset`

## 贡献

1. 遵循既定的代码风格（ESLint + Prettier）
2. 为新功能编写测试
3. 根据需要更新文档
4. 确保在提交PR之前所有检查都通过

## 下一步

设置开发环境后：

1. 探索代码库结构
2. 运行测试套件以了解当前功能
3. 检查主README中的项目路线图
4. 根据任务列表开始实现功能
