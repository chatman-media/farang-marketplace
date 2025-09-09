# 泰国市场文档 (中文)

欢迎使用泰国市场平台中文文档。

## 📚 可用部分

### 🔐 身份验证

- [README.md](auth/README.md) - 身份验证系统概述
- [oauth-api.md](auth/oauth-api.md) - OAuth API文档
- [oauth-setup-guide.md](auth/oauth-setup-guide.md) - OAuth提供商设置指南

### 🛠️ 开发

- [development.md](development.md) - 开发指南和环境设置

## 🌐 其他语言

- [English](../en/README.md) - English documentation
- [Русский](../ru/README.md) - Русская документация

## 🚀 快速开始

### 身份验证系统

我们的平台支持多种登录方式：

- ✅ **邮箱/密码** - 传统注册方式
- ✅ **Google OAuth 2.0** - 通过Google账户登录
- ✅ **Apple Sign In** - 通过Apple ID登录
- ✅ **TikTok Login Kit** - 通过TikTok登录
- ✅ **Telegram Login Widget** - 通过Telegram登录
- ✅ **LINE Login** - 通过LINE登录（在泰国很受欢迎）
- ✅ **WhatsApp Business API** - 通过WhatsApp登录

### 开始使用

1. **克隆仓库**

   ```bash
   git clone https://github.com/chatman-media/farang-marketplace.git
   cd thailand-marketplace
   ```

2. **安装依赖**

   ```bash
   bun install
   ```

3. **配置环境变量**

   ```bash
   cp services/user-service/.env.example services/user-service/.env
   # 使用您的设置编辑.env文件
   ```

4. **启动服务**
   ```bash
   bun run dev
   ```

## 📖 文档结构

```
docs/cn/
├── README.md                    # 此文件
├── development.md               # 开发指南
└── auth/                        # 身份验证文档
    ├── README.md               # 身份验证系统概述
    ├── oauth-api.md            # OAuth API文档
    └── oauth-setup-guide.md    # 设置指南
```

## 🛠️ 技术栈

- **后端**: Node.js, TypeScript, Express.js
- **数据库**: PostgreSQL
- **身份验证**: JWT, OAuth 2.0
- **测试**: Vitest
- **包管理器**: Bun

## 📞 支持

获取帮助：

- 📧 邮箱：dev-team@thailand-marketplace.com
- 💬 Slack：#support
- 🐛 问题：[GitHub Issues](https://github.com/chatman-media/farang-marketplace/issues)

## 📄 许可证

此项目根据MIT许可证授权 - 有关详细信息，请参阅[LICENSE](../../LICENSE)文件。

## 🤝 贡献

我们欢迎贡献！请阅读[CONTRIBUTING.md](../../CONTRIBUTING.md)了解如何贡献的信息。

## 📈 项目状态

- ✅ **身份验证**：完全实现
- 🔄 **市场**：开发中
- 📋 **管理面板**：计划中
- 📱 **移动应用**：计划中

---

_最后更新：2024年1月_
