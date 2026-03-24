# MindPocket CLI for Agent 使用的登录优先方案

## 背景

MindPocket 目前已经有 Web、Native、Extension 三类客户端，也已经接入 Better Auth 与 Bearer Token。缺少的是一个正式的 CLI 客户端，让用户先登录，再让 AI agent 或脚本通过稳定的命令行接口调用 MindPocket。

这个 CLI 的首发目标不是做本地代理，也不是做 MCP Server，而是做一个 JSON-first、适合 agent 子进程使用、同时提供高质量 `--help` 的官方客户端。

## 目标

- 提供正式的 `mindpocket` CLI
- 用户先登录，再由外部 agent 调用
- 默认输出稳定 JSON
- 所有命令提供可供 agent 提取知识的 `--help`
- CLI 复用现有 Web 服务端鉴权和业务 API

## 非目标

- 不做完整 API Key 管理后台
- 不做本地 daemon 或 proxy
- 不做 MCP Server
- 不重构现有整套 Web Auth
- 不在 v1 做复杂 scope / RBAC

## 方案结论

首版登录流程采用 OAuth 2.0 Device Authorization Flow，而不是邮箱密码直输或 localhost 回调。

原因：

- 更适合 CLI / 设备 / agent 场景
- Better Auth 已直接提供插件与端点
- CLI 不接触密码
- 用户先登录后授权的交互更清晰

## 关键设计

### 服务端认证

- 在 `apps/web/lib/auth.ts` 中启用 Better Auth `deviceAuthorization()` 插件
- 新增 `device_code` 表存储待授权的设备码
- 使用固定 `client_id = mindpocket-cli`
- 验证页地址固定为 `/device`

### `/device` 页面

- 新增 `apps/web/app/device/page.tsx`
- 未登录访问时跳转到 `/login?redirect=/device?...`
- 登录后回到 `/device`
- 页面负责：
  - 校验 `user_code`
  - 显示授权状态
  - 执行允许 / 拒绝

### CLI 包

新增 `apps/cli`，产出：

```bash
mindpocket
```

首版命令：

```bash
mindpocket auth login
mindpocket auth logout
mindpocket auth status
mindpocket config get
mindpocket config set server <url>
mindpocket user me
mindpocket bookmarks list
mindpocket bookmarks get <id>
mindpocket bookmarks create --url <url> [--title <title>] [--folder-id <id>]
mindpocket folders list
```

### 输出规范

- 普通命令默认输出 JSON
- `stdout` 仅输出结构化结果
- `stderr` 输出诊断信息和登录指引
- `--help` 输出结构化文本说明

标准成功返回：

```json
{
  "ok": true,
  "data": {}
}
```

标准错误返回：

```json
{
  "ok": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Not logged in"
  }
}
```

## Agent-Friendly `--help`

所有命令都必须按照固定 section 输出：

1. `Summary`
2. `Usage`
3. `Arguments`
4. `Options`
5. `Auth`
6. `Output`
7. `Examples`
8. `Errors`

设计原则：

- 描述必须具体
- 参数说明必须明确是否必填
- 输出字段必须真实反映返回值
- 错误码必须和实现一致
- 顶级 `mindpocket --help` 必须展示推荐工作流

## 数据流

### 登录流

1. CLI 请求 `/api/auth/device/code`
2. CLI 输出 `verification_uri`、`verification_uri_complete`、`user_code`
3. 用户在浏览器打开 `/device`
4. 用户登录 MindPocket
5. 用户确认授权
6. CLI 轮询 `/api/auth/device/token`
7. CLI 保存 bearer token 和用户元数据

### 业务调用流

1. agent 调用 `mindpocket` 命令
2. CLI 读取本地配置和 token
3. CLI 带 `Authorization: Bearer <token>` 调用服务端
4. 服务端返回 JSON
5. CLI 输出标准结构

### 知识获取流

1. agent 不确定命令用法
2. 调用 `mindpocket --help` 或子命令 `--help`
3. CLI 返回结构稳定的说明文本
4. agent 再按示例调用正式命令

## 错误模型

统一错误码：

- `CONFIG_MISSING`
- `SERVER_UNREACHABLE`
- `AUTH_REQUIRED`
- `AUTH_EXPIRED`
- `AUTH_DENIED`
- `AUTH_TIMEOUT`
- `AUTH_INVALID_CODE`
- `API_ERROR`
- `VALIDATION_ERROR`
- `INTERNAL_ERROR`

## 安全约束

- 不以邮箱密码输入作为 CLI 主登录流程
- token 优先尝试写入系统凭证库
- 无凭证库时降级到 `~/.config/mindpocket/config.json`
- 配置文件权限收紧
- 不提供直接打印 token 的命令
- 调试信息不得输出 `Authorization` 头

## 测试与验收标准

### 服务端

- 申请 device code 成功
- 未授权时轮询返回 pending
- 浏览器授权后轮询成功返回 token
- 过期 code 返回正确错误
- 重复授权被拒绝

### Web 页面

- 未登录访问 `/device` 会跳转登录
- 登录后回到授权页
- 错误 code 显示明确错误态
- 批准和拒绝都能正确落状态

### CLI

- `auth login` 能完成完整流程
- `auth status` 能返回登录态
- `auth logout` 能清理本地凭证
- `user me` / `bookmarks list` / `folders list` 能在已登录状态下正常工作
- 所有命令 `--help` 都能输出固定 section

## 默认假设

- CLI 首发主要服务交互式 agent
- 用户必须先登录，再由 agent 调用
- v1 不做完整 API Key 体系
- Bearer Token 仍然是 CLI 请求 API 的实际凭证
- 文档目录固定为 `docs/plan`

## 参考资料

- Better Auth Device Authorization: https://better-auth.com/docs/plugins/device-authorization
- OAuth 2.0 Device Authorization Grant RFC 8628: https://www.rfc-editor.org/rfc/rfc8628
- GitHub CLI 登录模式参考: https://cli.github.com/manual/gh_auth_login
