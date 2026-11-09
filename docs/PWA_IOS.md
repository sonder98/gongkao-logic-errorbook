# iPhone / iOS PWA 使用说明

网站地址：<https://sonder98.github.io/gongkao-logic-errorbook/>

## 添加到 iPhone 主屏幕

1. 使用 iPhone 上的 **Safari** 打开上方 HTTPS 地址（不要使用微信等 App 内置浏览器）。
2. 点击 Safari 底部的「分享」按钮。
3. 选择「添加到主屏幕」。
4. 名称使用「Exam」，预览图标应为**深蓝绿色底色的打开书本**，再点击「添加」。
5. 从主屏幕图标启动，即可作为独立窗口使用。

如果预览仍显示旧图或默认图标：请先删除主屏幕上旧的 Exam 图标，用 Safari 重新访问网站再添加。站点现使用带版本号的有效 Apple Touch PNG 图标，避开此前无法解码的旧图与缓存。iOS 不提供与 Android 完全相同的安装提示弹窗，因此通过 Safari 分享菜单添加是正常安装方式。无需 App Store，也无需单独开发原生 iOS 工程。

## 这次 PWA 改造包含什么

- 独立主屏幕图标、启动名称、主题色和 standalone 全屏窗口。
- iPhone 刘海、状态栏和底部 Home Indicator 安全区适配。
- 首次在线访问时缓存应用外壳和当前题库/知识库快照。
- 页面、静态资源及 JSON 均采用网络优先策略：联网时先取 GitHub Pages 最新内容，成功后更新本地离线缓存；断网时才回退到最近一次成功缓存。
- 已访问过的原题图片等同源资源会在使用时进入运行时缓存。

## 题库与知识库更新机制（保持原样）

本次没有修改以下数据文件、数据结构或更新流程：

- `questions.json`、`formal-questions.json`、`data-questions.json`
- `knowledge.json`、`formal-knowledge.json`、`data-knowledge.json`
- `data-materials.json`

页面原有对 JSON 使用 `fetch(..., { cache: 'no-cache' })` 的请求保持不变。其他 Agent 仍按原方式提交题库/知识库文件，由 GitHub Pages 发布；Service Worker 不会把旧缓存当作联网时的数据源，只会在网络不可用时提供离线兜底。

## 离线能力边界

- 最近一次成功加载的题库、知识笔记和应用页面可以在离线时打开。
- 答题记录和笔记仍按原有逻辑保存在浏览器本地；离线时无法访问 Supabase，也不能完成云端同步。
- 恢复网络后重新打开或刷新应用，即可重新获取最新数据并恢复在线服务。不要把离线状态下的本地记录误认为已经同步到云端。

## 发布维护提示

- 新增题库内容仍只需要更新原有 JSON，不需要改 Service Worker。
- 如果将来新增新的一级静态入口文件（例如新的 CSS / JS 文件），请把它加入 `sw.js` 的 `SHELL_FILES`，以便首次安装时也能离线使用。
- 应用页面和数据请求保持网络优先；不要把题库 JSON 改成 cache-first 或 stale-while-revalidate。
