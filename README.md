# 公考逻辑判断交互错题本

一个可本地使用、可通过 Supabase 登录同步的单页错题本。目前收录 5 道逻辑判断题，包含完整选项、解析和原题截图。

## 当前状态

- 本地版功能已整理为 `index.html`；
- 原始 V1、V2 保存在 `legacy/`，请勿覆盖；
- Supabase 建表、RLS、自动更新时间和冲突检测函数位于 `supabase/schema.sql`；
- 正式 Supabase 项目已创建，公开 Project URL 与 publishable key 已接入；
- GitHub Pages 已部署到 `https://sonder98.github.io/gongkao-logic-errorbook/`；
- 数据库 SQL、Auth 回跳地址与双账号 RLS 测试仍需完成。

## 免费使用说明

个人使用预计可以保持 0 元成本：

- Supabase Free 足以保存本项目的账号和进度数据；
- GitHub Pages 可免费发布公开仓库；
- 免费 Supabase 项目在低活动一段时间后可能暂停，需要从 Dashboard 恢复；
- GitHub Free 使用 Pages 时仓库必须公开，题目、截图和网页源码会公开；
- 用户密码、答题进度和个人笔记不应进入 GitHub，云端私有数据依靠 Supabase Auth 与 RLS 保护。

## 本地使用

直接用浏览器打开 `index.html` 即可使用本地模式。未配置 Supabase 时：

- 可以正常刷题；
- 记录保存在当前浏览器；
- 可以导出/导入 JSON 备份；
- 不能跨电脑自动同步。

由于登录模块从 CDN 加载，账号功能需要联网。正式测试建议通过本地 HTTP 服务或部署后的 HTTPS 地址访问，不要只使用 `file://`。

## Supabase 初始化

1. 创建 Supabase Free 项目。
2. 打开 SQL Editor，完整执行 `supabase/schema.sql`。
3. 在 Authentication 中启用邮箱密码登录。
4. 配置 Site URL 与 Redirect URLs：开发阶段加入本地测试地址，上线后加入最终 GitHub Pages 地址。
5. 在 Project Settings/API 中获取：
   - Project URL；
   - publishable key 或旧版 anon 公钥。
6. 只把以上两个公开值填入 `index.html`：

   ```js
   const CLOUD_URL='https://你的项目.supabase.co';
   const CLOUD_PUBLIC_KEY='你的 publishable 或 anon 公钥';
   ```

7. 绝对不要使用 `service_role`、secret key 或数据库密码。

## 数据与同步

- 游客数据保存在浏览器 `localStorage`；
- 登录后按 Supabase 用户 ID 隔离本机缓存；
- 本地改动进入待同步队列；
- 网络恢复后自动重试；
- 云端每题一行，主键为 `(user_id, question_id)`；
- 写入使用版本号进行乐观并发控制；
- 如果两台设备同时修改同一题，页面会要求选择保留本机版本或采用云端版本，不静默覆盖。

## 数据库安全

`supabase/schema.sql` 已包含：

- `question_progress` 表；
- RLS；
- 本人 SELECT/INSERT/UPDATE/DELETE 策略；
- `updated_at` 自动更新时间触发器；
- `save_question_progress` 乐观并发函数；
- 匿名用户函数权限撤销。

上线前仍必须用两个测试账号实际验证：

- A 不能读取 B；
- A 不能替 B 插入；
- A 不能把自己的行改归 B；
- A 不能删除 B；
- 未登录用户不能访问私有进度；
- 旧版本写入会返回冲突。

## GitHub Pages

建议仓库名：`gongkao-logic-errorbook`。

1. 创建公开仓库。
2. 提交本目录内容。
3. 在 Settings → Pages 中选择从 `main` 分支根目录发布。
4. 等待生成 `https://<用户名>.github.io/gongkao-logic-errorbook/`。
5. 把正式地址写入 Supabase Auth 的 Site URL 和 Redirect URLs。
6. 用无痕窗口验证注册、验证邮件回跳、登录和同步。

## 发布前测试

详见 `TESTING.md`。至少完成：

- 5 道题逐字核对；
- 本地保存与 JSON 恢复；
- 两账号 RLS；
- 两设备同步与冲突；
- 断网重试；
- V1 迁移；
- GitHub Pages 正式地址登录回跳；
- secret 全文扫描。

## 文件结构

```text
.
├─ index.html
├─ README.md
├─ SUPABASE_SETUP.md
├─ TESTING.md
├─ .nojekyll
├─ supabase/
│  └─ schema.sql
└─ legacy/
   ├─ 公考逻辑判断_交互错题本_V1.html
   └─ 公考逻辑判断_云同步错题本_V2_原版.html
```

