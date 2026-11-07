# AGENTS.md — 公考逻辑判断项目的 AI 入口

本文件供 AI、Codex、代码代理读取，作用于整个仓库。**不要把本文件中的操作指导展示在学习网站。**

## 新对话首先阅读

1. **[AI_HANDOFF.md](AI_HANDOFF.md)** — 新 AI 接力总览、项目目标、文件职责、工作流、重要限制。
2. **[STUDY_FRAMEWORK.md](STUDY_FRAMEWORK.md)** — 已确定的知识体系、分类及逻辑边界。
3. **[knowledge.json](knowledge.json)** 与 **[formal-knowledge.json](formal-knowledge.json)** — 论证与形式知识正文。
4. **[questions.json](questions.json)** 与 **[formal-questions.json](formal-questions.json)** — 两套独立题库，包含原题、选项、答案和稳定 ID。
5. 修改工程时再读 `README.md`、`TESTING.md`、`index.html`、`tests/`、必要时 `supabase/schema.sql`。

`LOGIC_KNOWLEDGE_BASE.md` **仅历史存档**，包含以前的分类建议、对话复盘与过时工程信息。**不能以该文件覆盖现行规则**。用户当前明确要求优先；理论口径以 `STUDY_FRAMEWORK.md`，论证数据以 `knowledge.json` / `questions.json`、形式数据以 `formal-knowledge.json` / `formal-questions.json` 为准。

## 四种任务分别处理

- **解题讨论**：论证题分清论据、结论和断点；形式题按翻译／矛盾／真假／综合分类，采用最短可靠推理或可验证的选项代入。**没有明确入库意图不得擅自写题库。**
- **学习新方法**：优先补所属模块的现有知识点：论证用 `knowledge.json`，形式用 `formal-knowledge.json`；分类原则变化时同步 `STUDY_FRAMEWORK.md`。论证逻辑加强与削弱是同一方法的两种方向，不要拆成重复的章节。
- **用户允许入库新题**：在对应模块题库 `questions.json` 或 `formal-questions.json` 追加文字原题、问法、选项、参考答案与分析，并在对应知识库的 `questionIds` 关联稳定 ID。普通入库不改 HTML。
- **用户说“更新”“同步”时的默认范围**：同时核对最近讨论但尚未入库的题目及对应模块知识点；论证用 `questions.json`＋`knowledge.json`，形式用 `formal-questions.json`＋`formal-knowledge.json`；若方法框架有新变化再同步 `STUDY_FRAMEWORK.md`。先复用已有分类和陷阱，只有确定确有新方法才新增知识点；争议题保留参考答案及另一条合理解析，不伪装成无争议。无新的题目或规则时说明相应部分没有改动，不为凑文件数而改动。
- **页面功能调整**：改必要的 `index.html` / 测试 / 操作文档，保证旧数据及登录同步兼容；不因样式改动改变题目、ID 或 Supabase schema。

## 不可破坏的规则

- 旧 `questions.json[].id` 与 `formal-questions.json[].id` 均不变；Supabase 的 `(user_id, question_id)` 是个人进度关联主键。不要为分类调整而修改旧题 ID 或 `category`。
- **两句式推理**只有已确认的两个主要结构；“事实 → 应该行动”的**规范性前提**归在「由因推果 → 建立／去除联系」，不另建“两句式·目标手段型”。
- **相关性推因果**是已确认的固定材料题型；分类视角并不完全互斥，详细规则见 `STUDY_FRAMEWORK.md`。
- 新题不保存原题图片：`image:""`。六张历史原图保存在 `legacy/questions-with-original-images-20261028.html`，按需加载，不删除。
- 新题年份、来源只依据用户提供的截图/文字；不要为追溯来源单独联网搜索。无法确定填「未知」；模糊选项和答案不能杜撰。
- `knowledge.json` 与 `formal-knowledge.json` 仅包含适合考生阅读的知识，不写“用户确认了什么”“下次 AI 应如何操作”“GitHub 操作步骤”或内部工程信息。
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


## 形式逻辑模块（2026-11-03）

- 网站顶部是两个模块、各自两个 Tab：论证逻辑·知识体系/错题练习，形式逻辑·知识体系/错题练习。
- 原有 `questions.json`、`knowledge.json` 全部属于论证逻辑，禁止因模块改名迁移历史 ID、答题记录或知识链接；旧 `#knowledge/<id>`、`#practice/<id>` 继续指向论证逻辑。
- 形式逻辑独立使用 `formal-questions.json`、`formal-knowledge.json`，新 ID 使用 `formal-` 前缀；其 URL 为 `#formal/knowledge[/<id>]`、`#formal/practice[/<id>]`。
- 形式逻辑四章均已阶段性学完：翻译（包含集合五模型）、矛盾、真假、综合；“集合推理”不单列一级章，固定 topic 为 `formal-translation-quantifiers`。截至2026-11-07，形式逻辑28题、12知识点，论证逻辑48题、31知识点。完整状态见 `AI_HANDOFF.md` 文首。
- 同一账号的个人进度仍以全局唯一的 question_id 存在现有 Supabase 表中，不修改 schema。

## 形式逻辑近期讲解与录入规则

- 目前翻译推理中将“所有／有些”与“必然／可能”两个体系放在一起讲解，用中文括号从外到内逐层转换；用户明确表示不希望看到数学模态符号。
- 新题 ID 分别为 `formal-2013-jilin-not-all-people-like-you`、`formal-2015-fujian-disaster-unless-disagreement`，其考点关联 `formal-translation-nested-negation`。
- 2015 福建题 D 能由 A 推出，但不能等价代表完整原话。参考答案 A；题目“符合”问法有歧义，不能在解析里断言 D 推不出或错误。

## 矛盾推理新阶段（2026-11-03）

- 用户已进入矛盾推理：题干以纯逻辑条件为主，没有明确事实真；选项是事实真。第一种A→B、A→非B，推非A；第二种A→B、非A→B，推B。第二种从A或非A的穷尽情况得出必然B，并非直接得到B与非B矛盾。
- 正式知识条目为 `formal-contradiction-two-patterns`；现已有6道矛盾推理原题。勿根据教学示例伪造更多原题。

## 本轮内容收口：考场速解与知识笔记风格（2026-11-03）

- 用户宣布矛盾推理阶段暂时结束；在 `formal-questions.json` 中补录招聘、投资、七人毕业、五选三挂职、2022四川优秀团队、2019江苏建设六题，答案依次为 B、C、C、D、A、D；知识仅链接到现有 `formal-contradiction-two-patterns`，不新建六套知识条目。
- `formal-knowledge.json` 五个知识点已压缩为“题型识别／核心规律／考场策略／关键边界”的读者笔记。**保持规则陈述简洁且正向**，以“怎么识别、怎么最快解”为主；不要写讨论过程、先前解法优劣、辩护性长段或重复讲一题六遍。
- 考场策略：问必然优先找事实真；问不可能优先找矛盾或代入；后件先扫冲突，选择最短可触发路径；正反分类取共同结论；人数、互斥限制用于快速锁定；满足选项即停止。
- 原论证逻辑数据和个人答题进度均不可触碰。后续继续做形式逻辑新题时按当前章节对应入库。

## 集合推理题库与笔记约定（2026-11-04）

- 集合推理归属「形式逻辑 > 翻译推理」，五模型统一维护在 `formal-translation-quantifiers`，不每题拆知识点。标准记忆：所有A是B，有些C是A→有些C是B；共同起点：所有A是B、所有A是C、存在A→有些B是C。
- 最近7道集合题入库（党章、跨国语言、博士、60万公里汽车、纺织宿舍、2020北京运动会、2023上海影像），该阶段累计15题（当前总计28题，见文首交接）。新增题来源未知标“未知”，原题图不保存。答题记录按稳定 question_id 存储。
- 笔记只保留系统的逻辑规则和高效考场策略，避免历史讨论、旧解法辩护、空泛的安全性长段；题目专属陷阱写在题库解析中。

## 真假推理新阶段（2026-11-05）

- 第三章「真假推理」已收录两个稳定知识点：`formal-truth-contradictions`（找矛盾）、`formal-truth-linked`（同真同假）；该阶段累计20题，新增5道真假推理题（当前总计28题）。
- 归纳三种考场技法：先找必然一真一假的矛盾；没有明显矛盾则找真假联动（同真、不能同真、不能同假）；选项已列唯一冠军或完整人员排列时，允许先代入检验约束。假设法是辅助，不需要单独知识点。
- 新增题用 `formal-` 稳定ID；只在题干明确时标注年份考试来源，保存题干和选项，不存图像；原有题库、用户进度、Supabase schema保持不变。

## 综合推理与阶段收口（2026-11-07，最新阶段）

- 形式逻辑四章节阶段性学完：翻译、矛盾、真假、综合。新增综合推理8题，形式逻辑总计28题；论证逻辑48题、云端进度结构不改。
- 综合推理六类分类：M选N、一一对应、排队方式、分组方式、宫格推理、其他。目前六类总览及前四种真实学过的技巧落到综合推理章的5个知识条目；宫格／其他待见真题再补，不制造假例子。
- 一一对应必须尊重用户习惯：人物×省份、人物×专业等二维打叉排除矩阵；多种身份分开画多个矩阵并通过跨身份关系联动，绝不换成简单三列表登记。分组题优先用小组容量、剩余位置是否够用、互斥恰好覆盖等超限模型；固定M选N先看入选或排除名额上限；排队题先查位置冲突和逆否。
- 用户明确电影排期题第二次练习仍不会，标记重点题，训练“互斥对象数＝可用位置数→恰好覆盖”。问必然／不可能／唯一确定时推到答案即停，不额外枚举全排列。
