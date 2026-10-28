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
