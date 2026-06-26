# mistakes.md

## 2026-06-15

- 问题：首次用 `Get-Content -Raw` 读取中文需求文档时出现乱码。
  - 原因：PowerShell 默认编码/终端编码与 UTF-8 文档不一致。
  - 解决：读取中文 Markdown 时显式使用 `Get-Content -Raw -Encoding UTF8 "文件名"`。
- 问题：`java -version` 指向 `C:\Program Files (x86)\Common Files\Oracle\Java\javapath\java.exe`，实际报错找不到 `D:\java0\jre1.8.0\lib\amd64\jvm.cfg`。
  - 原因：系统 PATH 中的 Java 8 shim 已失效；Maven 自身使用的是 `D:\java_jdk\java16`。
  - 解决：Spring Boot 3 需要 Java 17+，优先检查 `D:\java_jdk\corretto-18.0.2` 并在构建时显式设置 `JAVA_HOME` 和 `PATH`。
- 问题：运行 `npx.cmd create-next-app@latest ...` 失败，报 `connect EACCES`。
  - 原因：当前沙箱限制网络访问，无法访问 npm registry。
  - 解决：需要按权限流程使用 `require_escalated` 重新执行依赖下载；若仍失败，则手工创建项目骨架并在 README 中说明需要用户本地安装依赖。
- 问题：运行 `npm.cmd install zustand lucide-react` 超时，依赖未写入。
  - 原因：普通沙箱执行 npm 安装时网络访问不稳定/受限。
  - 解决：使用 `require_escalated` 重新执行明确的依赖安装命令，并在执行后检查 `package.json` 与 `node_modules`。
- 问题：`npm run build` 报 `Card` 组件不接受 `id` 属性。
  - 原因：通用 UI 组件 props 类型只声明了 `children` 和 `className`，没有继承原生 `section` 属性。
  - 解决：让 `Card` 使用 `HTMLAttributes<HTMLElement>` 并透传剩余 props。
- 问题：后端 `mvn package -DskipTests` 失败，提示无法创建 `D:\maven\repository\...pom.lastUpdated`。
  - 原因：Maven 默认本地仓库在工作区外，当前沙箱不能写入。
  - 解决：后续 Maven 命令使用带引号的 `"-Dmaven.repo.local=D:\vibeCodingSpace\goWhere\.m2\repository"`，把依赖缓存写入当前仓库。
- 问题：使用项目内 Maven 仓库后，下载 Spring Boot parent POM 报 `Permission denied`。
  - 原因：Maven 需要访问远程仓库，普通沙箱网络受限。
  - 解决：按权限流程使用 `require_escalated` 执行 Maven 构建。
- 问题：PowerShell 直接 POST 中文 JSON 到后端时，`city='南京'` 可能未按 UTF-8 发送，导致 mock POI 城市过滤为空，生成接口返回 0 套方案。
  - 原因：命令行 HTTP 客户端和服务端对中文请求体编码不一致；后端 mock provider 兜底不足。
  - 解决：mock POI provider 在城市过滤为空时回退全部南京试点 POI；命令行直测中文 JSON 时优先显式发送 UTF-8 bytes。

## 2026-06-16

- 问题：读取 Browser 技能旧路径 `browser\26.609.30741\skills\control-in-app-browser\SKILL.md` 失败。
  - 原因：插件缓存版本已更新到 `26.609.41114`。
  - 解决：先用 `Get-ChildItem -Recurse -Filter SKILL.md` 定位当前版本路径，再读取技能文件。
- 问题：Browser 技能新路径存在，但 `scripts/browser-client.mjs` 缺失，Node 侧无法初始化 in-app Browser。
  - 原因：当前 Browser 插件缓存只包含技能文件和部分 `scripts/node_modules`，缺少技能文档要求的核心脚本入口。
  - 解决：本次前端视觉验证改用本机 Chrome headless 截图；后续若需要 in-app Browser，先检查插件缓存完整性或重新安装/刷新 Browser 插件。
- 问题：尝试用 Chrome headless 截图验证移动端页面时，权限审批连续超时。
  - 原因：启动本机 Chrome 属于 GUI/外部应用操作，需要审批；本次审批未在时限内返回。
  - 解决：本轮不再反复请求，改用 `npm run build`、`npm run lint` 和本地 HTTP 检查作为基础验证。
- 问题：用 `Start-Process -FilePath D:\nodejs\node.exe ...` 启动 Next 前端时，PowerShell 报 `已添加项。字典中的关键字:“Path”所添加的关键字:“PATH”`。
  - 原因：当前 Windows/PowerShell 环境里存在大小写重复的 `Path/PATH` 环境变量，直接启动 node.exe 时触发 .NET 环境变量字典冲突。
  - 解决：改用 `Start-Process -FilePath "npm.cmd" -ArgumentList @("run","start",...)` 启动前端，避免直接调用 node.exe。

## 2026-06-17 Get-Content dynamic route path failed
- Command: Get-Content -Raw web\src\app\share\[code]\page.tsx
- Cause: PowerShell treats brackets as wildcard character classes.
- Fix: Use -LiteralPath for Next.js dynamic route folders such as [code].

## 2026-06-17 Checking multiple .gitignore paths failed
- Command: Get-ChildItem -Force .gitignore,backend\.gitignore,web\.gitignore
- Cause: PowerShell throws for missing paths when multiple explicit paths include absent files.
- Fix: Use Test-Path per file or Get-ChildItem with -ErrorAction SilentlyContinue when probing optional files.

## 2026-06-17 Backend readiness passed but recommendation request could not connect
- Command: Invoke-RestMethod http://127.0.0.1:8080/api/recommendations/generate
- Cause: Backend process exited after startup readiness check; inspect backend-only logs before retrying.
- Fix: Read backend logs, patch startup/runtime failure, rebuild, then restart backend.

## 2026-06-17 Start-Process java failed with duplicate Path/PATH
- Command: Start-Process -FilePath java.exe ... after importing env variables in PowerShell
- Cause: Windows process environment contained both Path and PATH keys, and Start-Process raised a duplicate dictionary key error.
- Fix: Start a PowerShell child host and run java in the child foreground, or avoid Start-Process directly on java/node after env imports.

## 2026-06-17 PowerShell variable HOME is read-only
- Command: $home = Invoke-WebRequest http://127.0.0.1:3000
- Cause: PowerShell variable names are case-insensitive, so $home conflicts with read-only $HOME.
- Fix: Use names like $homeResp or $frontPageResp for HTTP response variables.

## 2026-06-17 git status failed because workspace is not a Git repository
- Command: git status --short
- Cause: Current goWhere folder has no .git directory.
- Fix: Summarize changed files manually with rg/Get-ChildItem instead of relying on git status.

## 2026-06-17 apply_patch failed after copying mojibake from Get-Content output
- Command: apply_patch against labels displayed as mojibake in terminal output.
- Cause: PowerShell displayed UTF-8 Chinese as garbled text, while the file contains real UTF-8 Chinese.
- Fix: Use Select-String or patch with ASCII context / real file text instead of copied mojibake.

## 2026-06-17 Frontend start script reported ready but 3000 was gone afterward
- Command: scripts\start-web.ps1 followed by browser navigation to http://127.0.0.1:3000
- Cause: The Next host process exited after readiness without an error log in the current shell environment.
- Fix: Inspect PID/process lifetime and adjust start script to keep a stable host process; verify with browser after restart.

## 2026-06-18 React lint rejected synchronous setState in effect
- Command: npm.cmd run lint
- Cause: `react-hooks/set-state-in-effect` rejects using `useEffect(() => setState(...), [])` for values that do not need external synchronization.
- Fix: Avoid cosmetic client-only state for SSR-sensitive values, or derive it from an event/subscription instead of setting state synchronously in an effect.

## 2026-06-18 Start-Process and WMI startup hit Windows environment or sandbox limits
- Command: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start-web.ps1
- Cause: `Start-Process` failed on duplicated `Path/PATH`; WMI process creation is blocked in the sandbox unless elevated.
- Fix: Use the WMI-based script for normal local Windows usage; in the managed sandbox, rerun the start script with approved elevation when a persistent background server is required.

## 2026-06-18 rg regex quote failed in PowerShell
- Command: rg "activeDock=\"me\"|activeDock" web\src\app web\src\components
- Cause: Nested escaping was interpreted incorrectly by PowerShell/rg, producing an invalid regex.
- Fix: Use a simpler literal search such as `rg activeDock ...`, then inspect matches.

## 2026-06-18 Nested PowerShell Maven command failed
- Command: C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -Command "$env:JAVA_HOME=...; ..."
- Cause: The command was already running inside PowerShell, and nested quoting escaped the semicolon/string boundary incorrectly.
- Fix: In this workspace shell, run `$env:JAVA_HOME='...'; $env:PATH="$env:JAVA_HOME\bin;$env:PATH"; mvn ...` directly instead of wrapping another `powershell.exe -Command`.

## 2026-06-18 Spring Boot repackage could not rename jar
- Command: mvn "-Dmaven.repo.local=D:\vibeCodingSpace\goWhere\.m2\repository" package -DskipTests
- Cause: The existing backend jar was locked by a running backend process, so the Spring Boot plugin could not rename it to `.jar.original`.
- Fix: Stop the backend service first, then rerun Maven package.

## 2026-06-22 Service restart escalation rejected by tool usage limit
- Command: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stop-web.ps1 / scripts\stop-backend.ps1
- Cause: Stopping or starting persistent local services requires elevated execution in the managed sandbox, but the approval reviewer rejected the escalation because the current tool usage limit was reached.
- Fix: Do not bypass the approval requirement. Ask the user to run `scripts\stop-local.ps1` and `scripts\start-local.ps1`, or retry the elevated restart after the usage window resets.

## 2026-06-22 Reading Java process command line was denied
- Command: Get-CimInstance Win32_Process -Filter "ProcessId=..."
- Cause: Windows denied access to process command line metadata in the current shell.
- Fix: First check project ports and known pid files. If the process identity still cannot be verified, avoid killing arbitrary Java processes unless the user has explicitly asked to restart local services or the pid is known from project scripts.

## 2026-06-22 Java backend could not reach AMap inside sandbox
- Command: POST /api/recommendations/generate through a temporary local backend process.
- Cause: The backend process started in the normal sandbox could not open outbound network connections to 高德 Web 服务 and returned `Permission denied: no further information`.
- Fix: Rerun the same verification command with `require_escalated` so the temporary backend can access the real map API. Do not treat this as a recommendation logic failure.

## 2026-06-23 Zustand hook ReturnType became unknown in Next build
- Command: `cd web && npm run build`
- Cause: `ReturnType<typeof useJourneyStore>` on the Zustand bound hook was inferred as `unknown` during Next.js type checking.
- Fix: Define a small local view type for the fields passed into helper functions instead of deriving the type from the hook object.

## 2026-06-24 Sandbox rejected starting local frontend for screenshot
- Command: `Start-Process -FilePath "npm.cmd" -ArgumentList @("run","dev",...)`
- Cause: The managed sandbox approval review rejected starting a persistent local dev server because the current tool usage limit was reached.
- Fix: Do not bypass the rejection with another startup workaround. Ask the user to start `cd web && npm run dev` locally, or retry browser screenshot verification when the service is already reachable.

## 2026-06-24 React lint rejected assigning window.location.href
- Command: `cd web && npm run lint`
- Cause: `react-hooks/immutability` treats assigning to `window.location.href` inside a component handler as modifying an external value.
- Fix: Use `window.open(deepLink, "_self")` for app deeplinks, then fall back with `window.open(webUrl, "_blank", "noopener,noreferrer")`.

## 2026-06-24 Browser screenshot showed unstyled Next page
- Command: in-app browser screenshot of `http://127.0.0.1:3000/`.
- Cause: The already-running local Next service returned markup but CSS/client chunks were not applied reliably after code changes; route screenshots showed fallback/loading or default browser link styles.
- Fix: Do not treat that screenshot as visual proof. Restart the frontend service, then recapture screenshots after confirming CSS classes apply and `document.documentElement.scrollWidth <= innerWidth`.

## 2026-06-24 Browser verification tool unavailable for localhost
- Command: attempted to discover an in-app browser/open-screenshot tool for `http://127.0.0.1:3000/`.
- Cause: Tool discovery returned thread/automation tools instead of browser controls, while HTTP checks still returned 200 for the local Next pages.
- Fix: Use `npm run lint`, `npm run build`, and `Invoke-WebRequest` route checks as baseline verification, then ask the user to visually verify in the already-open browser or retry browser tooling when available.

## 2026-06-25 Production route generation returned 502 on Vercel
- Command: POST `https://www.gowhere.bond/api/recommendations/generate`.
- Cause: The Vercel rewrite surfaced the upstream failure as 502, while direct nginx returned `503 {"message":"AI 服务调用失败：Connection reset"}` from the backend. The backend had real POIs, but AI text generation was a hard failure when the provider connection was reset.
- Fix: Keep route generation usable by falling back to local route copy from `MockAiProvider` after AI provider failures, while still using the real candidate POIs returned by AMap.

## 2026-06-25 PowerShell variable PID is read-only
- Command: foreach ($pid in $portPids) { Stop-Process -Id $pid ... }
- Cause: PowerShell variable names are case-insensitive, so $pid conflicts with the built-in read-only $PID variable.
- Fix: Use a different variable name such as $processId when iterating process ids.

## 2026-06-25 POI detail drawer covered by bottom dock
- Problem: 地点详情页底部“导航 / 看测评”按钮被 `MobileShell` 外层 `fixed z-50` 底部 Tab Bar 覆盖，按钮视觉露出不稳定且可能无法点击。
- Cause: `PoiDetailDrawer` 渲染在 `PlanCard` 内部，仍处于 `MobileShell` 页面内容层的堆叠上下文里；仅调高抽屉内部 `z-index` 不能越过外层固定 BottomDock。
- Fix: 将 `PoiDetailDrawer` 通过 `createPortal` 挂载到 `document.body`，弹层根节点使用全局 `fixed inset-0 z-[1000]` 遮罩；详情卡片内部用 `flex flex-col overflow-hidden`，内容区 `min-h-0 flex-1 overflow-y-auto`，底部操作栏 `shrink-0` 并使用 safe-area padding，确保按钮始终完整可见且可点击。

