# WeClaws Database Migration Notes

## 1. 文档定位

本文档说明 WeClaws 当前使用 `SQLite + Drizzle` 时的数据库演进约束，以及未来迁移 PostgreSQL 时需要守住的边界。

如果你要查当前表接口、字段语义、索引和关系，请优先看：

- `docs/manuals/database-schema-reference.md`

当前事实来源以代码为准：

- `packages/db/src/schema/*.ts`
- `packages/db/src/migrations/*`
- `packages/db/src/repositories/*.ts`

## 2. 当前决策

当前仓库仍然以 SQLite 作为当前单机部署基线。

原因不变：

- 单机部署简单
- 本地开发启动成本低
- `web + supervisor` 共享文件型数据库即可支撑当前阶段

当前目标不是“同时兼容 SQLite / PostgreSQL”，而是：

- schema 明确
- repository 收口
- migration 规范
- 后续迁移路径清晰

## 3. 当前 schema 范围

当前基线不再只有最初的 4 张业务表。

目前实际 schema 包含 3 组：

### 3.1 认证表

- `users`
- `accounts`
- `sessions`
- `verifications`

### 3.2 业务与运行时表

- `workspaces`
- `bot_instances`
- `bot_events`

### 3.3 邀请与自举注册表

- `registration_invites`
- `registration_bootstrap_claims`

仍然不建议在当前阶段过早引入：

- `organizations`
- `memberships`
- `workspace_shares`
- `bot_leases`
- `runtime_snapshots`

## 4. Drizzle 使用约束

### 4.1 保持 schema 文件边界清晰

当前每张表单独一个 schema 文件，这是应继续保持的约束。

### 4.2 保持 repository 薄

repository 只负责：

- 查询
- 插入
- 更新
- 小范围事务

不要把复杂状态机塞进 SQL 表达式、触发器或数据库特性分支里。

### 4.3 不把业务正确性绑定到 SQLite 专有技巧

尽量避免：

- 复杂 raw SQL
- 把 `pragma` 语义当成业务前提
- 依赖 JSON1 才能成立的核心业务模型

补充：

- 当前 `bot_events` 的增量 cursor 依赖 SQLite 隐藏列 `rowid`
- 这是当前实现事实，但应被视为 WeClaws 自己的实现细节，而不是鼓励把更多业务语义继续堆到 SQLite 特性上

## 5. 迁移规则

### 5.1 每次 schema 变更都生成 migration

禁止直接手改 DB 文件结构而不生成 migration。

### 5.2 migration 原则

- 小步
- 可理解
- 一次只承载有限业务语义变化

### 5.3 推荐顺序

1. 先改 schema
2. 生成 migration
3. 本地执行 migration
4. 跑 repository 测试
5. 跑 web / supervisor 相关测试

### 5.4 destructive baseline reset 规则

如果项目仍处于可接受重置的早期阶段，可以做 destructive baseline reset。

但必须一次性同步更新：

1. `packages/db/src/migrations/*.sql`
2. `packages/db/src/migrations/meta/*`
3. 所有依赖旧 baseline 的本地 SQLite 文件或卷

和旧版本文档不同，当前仓库已经不再提交运行态 SQLite 数据库文件。

因此 reset 后要做的是：

- 删除本地 `storage/sqlite/db.sqlite`（如果存在）
- 或删除 Compose 使用的 SQLite 卷
- 重新执行 `pnpm db:migrate` 或重启 migration owner

不能只改 migration 文件而继续复用旧 SQLite / 旧 volume；否则 `__drizzle_migrations` 历史会与当前 baseline 脱节。

### 5.5 当前 migration 事实

当前仓库至少包含：

- `0000_baseline_reset.sql`
- `0001_bootstrap_registration_claims.sql`

这意味着 invite/bootstrap 相关表已经是当前演进路径的一部分，不应再被视为“文档规划未落地”。

## 6. 当前需要重点保护的列

### `bot_instances.desired_state`

控制面目标状态真相源。

### `bot_instances.status`

supervisor 收敛后的观测态。

### `bot_instances.restart_backoff_until`

影响 crash recovery 与重启节奏。

### `bot_instances.restart_requested_at`

控制面显式重启请求标记。

### `bot_events`

时间线与排障基础；当前建议继续保持只追加。

### `registration_invites.*`

邀请码创建、预占、消费链路的关键状态。

### `registration_bootstrap_claims.*`

首个管理员无邀请码自举注册时的并发保护状态。

## 7. SQLite 运维注意事项

### 7.1 备份

备份数据库时，最好和 `storage/instances` 一起备份。

当前仓库事实：

- 仓库本身只保留 `storage/sqlite/.gitkeep`
- 不再提交运行态 SQLite 数据库文件

因此：

- 本地开发数据库是运行时生成物
- baseline reset、结构变更或回滚验证时，要主动清理本地 DB 文件或对应 volume

### 7.2 锁竞争

当前两个主要写入方是：

- `apps/web`
- `apps/supervisor`

规避方式：

- 短事务
- 小批量写
- 避免长时间占锁

### 7.3 WAL 模式

如果读写冲突开始明显影响体验，可以评估开启 WAL。

但不要把业务正确性建立在某个 SQLite 模式的隐式假设上。

## 8. 未来迁移 PostgreSQL 的边界

只要以下边界保持住，未来迁移 PostgreSQL 会简单很多：

1. 所有数据库访问都经过 `packages/db`
2. `web` 不直接写 SQL
3. `supervisor` 不直接写 SQL
4. repository 对外暴露的是业务方法，而不是 SQLite 细节
5. 状态机逻辑主要在应用层，不放进数据库触发器

## 9. PostgreSQL 迁移建议

未来真的要迁移时，推荐顺序：

1. 保持 repository API 不变
2. 新增 PostgreSQL Drizzle client
3. 迁移 schema
4. 迁移数据
5. 跑 repository 与 integration 测试
6. 再切换运行时配置

不建议：

- 在业务代码里散布双数据库分支
- 在当前阶段同时维护两套分叉 repository

## 10. 何时应认真评估迁移

出现以下信号时，就该认真考虑 PostgreSQL：

- SQLite 锁竞争频繁影响运行
- 需要多机部署
- 需要更复杂的查询或后台任务
- 需要更成熟的备份 / 恢复 / 运维能力

## 11. 总结

当前 WeClaws 使用 SQLite 仍然是务实选择，但文档和实现都已经从最初的 4 表模型演进到了“认证 + 业务 + 邀请”完整基线。

只要继续守住：

- schema 清楚
- repository 收口
- migration 规范
- 不过度绑定 SQLite 特性

未来切 PostgreSQL 仍然是可控的。
