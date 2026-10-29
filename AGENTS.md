# AGENTS.md — 公考逻辑判断项目的 AI 入口

本文件供 AI、Codex、代码代理读取，作用于整个仓库。**不要把本文件中的操作指导展示在学习网站。**

## 新对话首先阅读

1. **[AI_HANDOFF.md](AI_HANDOFF.md)** — 新 AI 接力总览、项目目标、文件职责、工作流、重要限制。
2. **[STUDY_FRAMEWORK.md](STUDY_FRAMEWORK.md)** — 已确定的知识体系、分类及逻辑边界。
3. **[knowledge.json](knowledge.json)** — 给考生阅读的知识正文。
4. **[questions.json](questions.json)** — 已入库原题原文、完整选项、答案和稳定 ID。
5. 修改工程时再读 `README.md`、`TESTING.md`、`index.html`、`tests/`、必要时 `supabase/schema.sql`。

`LOGIC_KNOWLEDGE_BASE.md` **仅历史存档**，包含以前的分类建议、对话复盘与过时工程信息。**不能以该文件覆盖现行规则**。用户当前明确要求优先；理论口径以 `STUDY_FRAMEWORK.md`、考生笔记正文以 `knowledge.json`、实际题目内容和答案以 `questions.json` 为准。

## 四种任务分别处理

- **解题讨论**：先分清论据、结论和推理断点，逐项比较特别是迷惑项。**没有明确入库意图不得擅自写题库。**
- **学习新方法**：优先更新 `knowledge.json` 已有知识点；分类原则变化时同步 `STUDY_FRAMEWORK.md`。加强与削弱是同一方法的两种方向，不要拆成重复的章节。
- **用户允许入库新题**：只在 `questions.json` 追加完整文字原题、问法、选项、参考答案与分析；有已存在关联知识点时，在 `knowledge.json` 的 `questionIds` 中附上新 ID。普通入库不改 HTML。
- **页面功能调整**：改必要的 `index.html` / 测试 / 操作文档，保证旧数据及登录同步兼容；不因样式改动改变题目、ID 或 Supabase schema。

## 不可破坏的规则

- 旧 `questions.json[].id` 不变；Supabase 的 `(user_id, question_id)` 是个人进度关联主键。不要为分类调整而修改旧题 ID 或 `category`。
- **两句式推理**只有已确认的两个主要结构；“事实 → 应该行动”的**规范性前提**归在「由因推果 → 建立／去除联系」，不另建“两句式·目标手段型”。
- **相关性推因果**是已确认的固定材料题型；分类视角并不完全互斥，详细规则见 `STUDY_FRAMEWORK.md`。
- 新题不保存原题图片：`image:""`。六张历史原图保存在 `legacy/questions-with-original-images-20261028.html`，按需加载，不删除。
- 新题年份、来源只依据用户提供的截图/文字；不要为追溯来源单独联网搜索。无法确定填「未知」；模糊选项和答案不能杜撰。
- `knowledge.json` 仅包含适合考生阅读的知识，不写“用户确认了什么”“下次 AI 应如何操作”“GitHub 操作步骤”或内部工程信息。
- 网站根网址默认显示**错题练习**，显式 `#knowledge/<topic-id>` 才直达知识；知识目录按章节折叠、搜索时展示匹配条目、桌面/手机限高滚动。
- 不提交数据库密码、service_role、secret、用户笔记、token 等。公开 Supabase URL/publishable key 不是管理员密钥，但不能误用。
- **静态语法通过不等于浏览器回归通过；GitHub 提交成功也不等于 Pages 已部署。** 交付时报告真实验证状态。

## 运行验证

```bash
node tests/validate-questions.cjs
node tests/validate-knowledge.cjs
node tests/smoke.cjs        # 需要 Playwright 与浏览器环境
```

本地要用 HTTP 服务，如 `python -m http.server 8000`，不要用 `file://`。正式站点：<https://sonder98.github.io/gongkao-logic-errorbook/>。若 GitHub 未授权/无写入权限，不得声称已修改仓库。


## 重点题编辑标记

`questions.json` 的题目可包含可选字段 `important:true`，表示全站统一的重点辨析题。页面支持「★ 重点题」标识和「只看重点题」筛选。它与用户私有进度里的 `review` 待复习完全独立：**不要为了设置重点而写入个人云端进度**。

新收录重点题 `unknown-black-carbon-neurocognition`，答案D；正式知识条目为 `susceptibility-selection-bias`。解题时务必区分群体共同易感性、组间可比性/混杂、严格意义上的样本选择偏差；不要把女孩“未显著”解释成已经证明无影响。最新详细口径见 `STUDY_FRAMEWORK.md`。

