# Supabase 最后配置步骤

正式网站：<https://sonder98.github.io/gongkao-logic-errorbook/>

Supabase 项目：`vqynadkbwudbsnrixojb`

## 1. 执行数据库脚本

1. 打开 Supabase Dashboard 并进入项目。
2. 左侧点击 **SQL Editor**。
3. 点击 **New query**。
4. 打开本项目的 `supabase/schema.sql`，复制全部内容。
5. 粘贴到 SQL Editor。
6. 点击 **Run**。

脚本会创建：

- `public.question_progress` 表；
- RLS 用户隔离策略；
- `updated_at` 自动更新时间；
- `save_question_progress` 乐观并发函数。

## 2. 设置登录回跳网址

在 Supabase Dashboard 中进入：

**Authentication → URL Configuration**

填写：

- Site URL：`https://sonder98.github.io/gongkao-logic-errorbook/`
- Redirect URLs：加入 `https://sonder98.github.io/gongkao-logic-errorbook/`

保存后，注册验证邮件会返回正式错题本。

## 3. 检查邮箱登录

在 **Authentication → Providers → Email** 中确认 Email 登录已启用。

建议保留邮箱验证。测试时使用你能接收邮件的真实邮箱，密码直接在正式网页输入，不要发到聊天或写入代码。

## 4. 安全提醒

- 前端只使用 Project URL 与 publishable key；
- 不要把数据库密码、secret key 或 `service_role` key 写入网站或 GitHub；
- 已经在聊天里发送过的数据库密码应在 Supabase 中重置；
- SQL 执行后仍需要两个账号完成 RLS 隔离测试。

## 5. 自动同步及持续登录（2026-11-21）

网站现在使用 Supabase 客户端的 persistSession / autoRefreshToken：在同一浏览器或同一主屏幕 PWA 中成功登录一次，后续访问会尝试自动恢复会话；不需要把账号密码、refresh token 或其它私密凭证提交到 GitHub。浏览器清除站点数据、无痕模式、退出登录、会话撤销或换设备后，仍需要重新登录。Safari 与独立安装的 PWA 可能不共享登录状态。

登录成功后，网站会在启动、切回页面、网络重新连接、定期检查时自动从云端读取新进度；每次提交答案、复习标记或主动保存笔记后自动上传。未提交的笔记草稿和手写草稿仍只存当前设备。所有待上传记录会先写入本机，网络失败时不丢弃并在下次合适时机重试。

与另一设备存在同题改动时，客户端只在持有上一次确认的云端快照且能够安全三方合并时自动合并：统计计数采用两端增量，普通字段按独立改动合并；无法确定安全性的冲突仍留给用户逐题选择，绝不静默覆盖。历史客户端尚无共同快照时也会保留冲突，而非猜测。

故障排查：看页面左侧的云端同步状态；如始终要求登录，检查 Safari 站点数据/无痕模式和 Supabase 会话设置，避免手动退出；**不要**在公开仓库存放个人账号密码或 token。
