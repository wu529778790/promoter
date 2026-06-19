# GitHub Promoter

open-im 推广工具 — 从 GitHub 采集用户邮箱，发送推广邮件。

## 功能

- **邮箱采集**：从 GitHub stargazers 的公开 commit 中提取邮箱
- **多发件人并行**：支持多个 SMTP 账号同时发送，提高效率
- **Spintax 随机内容**：10 万+ 种邮件组合，避免被识别为垃圾邮件
- **反垃圾**：随机延迟（3-7 分钟），模拟人类行为
- **进度持久化**：支持中断恢复，避免重复发送
- **速率限制感知**：自动检测 GitHub API 配额，动态调整请求速度
- **断点续采**：采集过程中断后可从上次位置继续
- **Topic 搜索**：按 GitHub Topic 自动发现目标仓库

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置（二选一）
# 方式 A：配置文件（推荐）
cp config/config.yaml.example config/config.yaml
# 编辑 config/config.yaml 填写你的配置

# 方式 B：环境变量
export GITHUB_TOKEN="your_github_token"
export SMTP_USER="your_email@qq.com"
export SMTP_PASS="your_smtp_password"

# 3. 采集邮箱
npm run collect

# 4. 发送邮件
npm run send
```

## 配置说明

### 配置文件（推荐）

复制 `config/config.yaml.example` 为 `config/config.yaml`：

```yaml
# 多发件人配置
senders:
  - name: "Your Name"
    email: "your_email@qq.com"
    smtp_server: "smtp.qq.com"
    smtp_port: 465
    password: "YOUR_APP_PASSWORD"
    daily_limit: 200

# 发送策略
settings:
  email_interval_min: 180    # 最小间隔（秒）
  email_interval_max: 420    # 最大间隔（秒）
  timezone: "Asia/Shanghai"

# 采集配置
harvest:
  topics:
    - "ai-tool"
    - "claude"
    - "llm"
  target_repos:
    - "anthropics/claude-code"
    - "lobehub/lobe-chat"
  per_repo_limit: 100

# 调试
debug:
  dry_run: false
  log_level: "info"
```

### 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | ✅ |
| `SMTP_USER` | 发件邮箱 | ✅ |
| `SMTP_PASS` | 邮箱密码或授权码 | ✅ |
| `SMTP_HOST` | SMTP 服务器（默认 smtp.qq.com） | ❌ |
| `SMTP_PORT` | SMTP 端口（默认 465） | ❌ |
| `DRY_RUN` | 模拟运行（true/false） | ❌ |

## CLI 命令

```bash
# 采集
npm run collect                    # 默认采集
npm run collect -- --resume        # 断点续采
npm run collect -- --status        # 查看采集进度
npm run collect -- --dry-run       # 模拟采集

# 发送
npm run send                       # 默认发送
npm run send -- --count 50         # 限制发送数量
npm run send -- --dry-run          # 模拟发送
npm run send -- --status           # 查看发送状态
npm run send -- --test-connection  # 测试 SMTP 连接

# 测试
npm test                           # 运行所有测试
npm run test:watch                 # 监听模式
```

## 架构

```
[GitHub Repos] → [Collector] → [emails.csv] → [Sender] → [SMTP Servers]
                        ↓                              ↓
              [Topic 搜索 + 分页]            [多发件人并行 + Spintax]
              [速率限制感知]                  [进度持久化 + 重试]
              [断点续采]                      [优雅退出]
```

## 文件结构

```
github-promoter/
├── src/
│   ├── index.ts          # 主入口 CLI
│   ├── config.ts         # 配置加载器
│   ├── collect.ts        # 邮箱采集
│   ├── sender.ts         # 多发件人并行发送
│   ├── progress.ts       # 进度管理器
│   └── spintax.ts        # 随机内容生成
├── config/
│   └── config.yaml.example  # 配置模板
├── tests/
│   ├── config.test.ts
│   ├── spintax.test.ts
│   └── progress.test.ts
├── data/                 # 运行时数据（自动生成）
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## 合法性

- 只采集**公开邮箱**（Git commit 中的）
- 邮件内容与开源项目相关
- 遵守 CAN-SPAM、GDPR 等法规
- 邮件中包含退订说明

## License

MIT
