# 此刻去哪

《此刻去哪》第一期游客体验版 MVP：不登录即可通过自动定位，或手动输入城市/商圈/地址/地标，在全国范围内生成 2-3 套城市路线方案。地点来自高德 Web 服务或本地 mock POI，AI 只负责标题、推荐理由、路线说明和风险提示，后端会校验 AI 返回的 POI ID。

## 目录

```text
docs/       MVP 范围与 API 文档
web/        Next.js + React + TypeScript + Tailwind CSS 前端
backend/    Spring Boot 3 + Java 后端
deploy/     MySQL Docker Compose
scripts/    本地启动与停止脚本
```

## 一键启动

先完成构建：

```powershell
cd backend
mvn "-Dmaven.repo.local=..\.m2\repository" package -DskipTests
cd ..\web
npm install
npm run build
cd ..
```

Windows 双击或运行：

```powershell
scripts\start-local.cmd
```

停止整套服务：

```powershell
scripts\stop-local.cmd
```

只启动/停止前端：

```powershell
scripts\start-web.cmd
scripts\stop-web.cmd
```

只启动/停止后端：

```powershell
scripts\start-backend.cmd
scripts\stop-backend.cmd
```

访问地址：

- 前端：http://127.0.0.1:3000
- 后端：http://127.0.0.1:8080/api/config/scenes

## 环境变量

后端本地密钥放在 `backend/.env.local`，该文件已被 `.gitignore` 忽略。可参考：

```powershell
copy backend\.env.example backend\.env.local
copy web\.env.example web\.env.local
```

关键变量：

- `AMAP_WEB_SERVICE_KEY`：高德 Web 服务 Key，后端用于获取真实 POI。
- `AI_PROVIDER`：默认 `qwen`；设为 `mock` 可强制走 mock AI。
- `AI_ENDPOINT`：Qwen OpenAI 兼容模式地址。
- `AI_MODEL`：默认 `qwen-plus`。
- `AI_API_KEY`：后端调用 AI 的 Key。
- `MYSQL_URL`、`MYSQL_USERNAME`、`MYSQL_PASSWORD`：可选 MySQL 持久化配置。
- `NEXT_PUBLIC_API_BASE`：前端调用后端地址，默认 `http://localhost:8080`。

没有真实 Key 或外部网络失败时，系统会自动退回 mock POI / mock AI，仍可完整演示推荐、分享、反馈、本地收藏。

## 数据库

表结构位于 [backend/src/main/resources/db/schema.sql](D:/vibeCodingSpace/goWhere/backend/src/main/resources/db/schema.sql)。

配置 `MYSQL_URL` 后，后端会写入：

- `poi_cache`
- `recommendation_record`
- `recommendation_plan`
- `feedback`
- `share_snapshot`

未配置 MySQL 时，推荐记录、反馈、分享快照使用进程内存保存，适合本地演示。

## 验收重点

- 不登录即可完整生成推荐。
- 首页、生成页、结果页和分享页保持 iOS 风格的生活方式路线体验。
- 每次返回 2-3 套方案，每套 2-4 个地点。
- 拒绝定位后仍可手动输入城市、商圈、地址或地标使用。
- 分享、反馈、本地收藏可用。
- AI 返回地点会经过后端 POI ID 校验，不能编造地点。
