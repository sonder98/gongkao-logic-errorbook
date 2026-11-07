# AI_HANDOFF.md — 新对话 / 新 AI 的完整接力说明

> **优先入口。** 仓库：`sonder98/gongkao-logic-errorbook`。网站：<https://sonder98.github.io/gongkao-logic-errorbook/>。本项目一边讨论公务员考试**论证类逻辑判断题（加强、削弱、假设）**，一边维护**考生可读的知识体系 + 交互错题本**。本文供 AI 交接，不在网站前台展示。

## 一、脱离旧聊天记录如何开始

接手之前按此顺序阅读：
1. `AGENTS.md`：代码代理规则与不可破坏的约束；
2. `STUDY_FRAMEWORK.md`：**最新题型分类与解题方法**；
3. `knowledge.json`：网站前台的全部正式知识；
4. `questions.json`：已入库原题、选项、答案、唯一 ID；
5. 如需改工程，再读 `README.md`、`TESTING.md`、`index.html`、`tests/`、必要时 `supabase/schema.sql`。

**权威顺序：** 当前用户明确指示 > 当前实际文件的客观数据（题目以 `questions.json`、面向用户的知识正文以 `knowledge.json` 为准）及已确认的最新学习原则 `STUDY_FRAMEWORK.md` > `AGENTS.md` 工程流程 > `LOGIC_KNOWLEDGE_BASE.md` 历史存档。出现矛盾要公开识别并修复，不能把过时结论和最新结论同时当真。未知事实不能为了“完整”而自行编造。

**注意：** 这些文件是持久的接力依据，不要求用户每次换对话重讲已明确的背景。

## 二、用户希望怎样继续学习

- 看题优先**论据 → 结论 → 断点 → 正确项为什么有效 → 迷惑项为什么弱 → 可迁移的方法**。不能只凭选项关键词或死背“套路”。
- 题型结构和因果方向是**平行维度**：一句式 / 两句式看结构，由因推果 / 由果推因看方向；**相关性推因果**是四种材料形式统一命名的固定题型。
- **两句式推理保持简单**，只保留前半相同 A→B / A→C 和后半相同 A→C / B→C 两种典型结构及借中间变量的补全方法。
- 由因推果的已学方法**「建立／去除联系」是同一个知识点**，加强 / 削弱是两个方向；加强已总结三种：中间因素、重要性、**规范性前提**。削弱细分还要继续讨论，不能虚构已确认的完整名单。
- 已讨论的两道**规范性前提**题：《红楼梦》（B）和政府发展经济（C），都在**由因推果 → 建立/去除联系**，**绝不归入两句式**。两道题目前只有已讨论信息，**不在 `questions.json` 中**，不得凭记忆擅自补齐选项入库。
- 由果推因目前主要学习**他因分析**：其他原因须与本次事实及真正结论有关；“可能”不能机械排除，也不等于实际证据。
- 学习知识与做题可以**并行进行**。确定新规则时及时更新正式笔记；不必等所有题型都讲完。不额外创建用户未要求的庞大类别。

完整逻辑分析边界见 `STUDY_FRAMEWORK.md`，不要只凭以上速览处理难题。

## 三、项目当前状态与真源

| 文件 | 唯一作用 |
|---|---|
| `questions.json` | 已入库所有原题的**唯一真源**，包含稳定 ID、题干、选项、答案、解析 |
| `knowledge.json` | **考生直接阅读**的正式知识笔记及 topic→关联题目 |
| `index.html` | 网站的 UI、导航、知识展示、答题、Supabase 认证/同步 |
| `STUDY_FRAMEWORK.md` | AI 教学分类准则、难点和反例 |
| `AI_HANDOFF.md` | 新对话的接续路径、流程与已确认约束 |
| `AGENTS.md` | 代码代理的入口与安全规则 |
| `README.md` / `TESTING.md` | 工程说明、测试与部署验收 |
| `LOGIC_KNOWLEDGE_BASE.md` | **历史归档**，不再作为正式规范 |
| `legacy/` | 原页面和六张旧题原图，保持不变 |

**最新内容快照（2026-11-02）：39道题、6个章节、31个知识点。** 每次接手应以 `questions.json` / `knowledge.json` 的实际数据为准，数字只用于交接核对；不要因题量变化改 HTML 固定数字。

题库每条现有字段：
`id,year,exam,title,category,type,difficulty,stem,ask,options,answer,structure,reason,trap,rule,image`。

**特别注意历史兼容：**
- 题目 `id` 是 Supabase `(user_id, question_id)` 个人进度的永久关联键。**已有题 ID 禁止修改**；一般无需迁移 Supabase schema。
- 旧 `category` 可能是“实验可比性”“由果推因 / 他因”“两句式推理”等；**不要为了新分类回头改全部旧题标签**。新题若符合四种材料关联→因果模式，可用「相关性推因果」。
- 六张旧图片由 `legacy/questions-with-original-images-20261028.html` 懒加载，旧 `image` 是 `legacy:<id>`；所有新题 `image:""`，**只收录结构化文本，不上传或内嵌图片**。
- 年份、考试类型只以用户明确提供的信息为准；**不要专门联网搜索题目年份/出处**；未知填「未知」。题干、选项和答案不能猜测。
- 答题进度、复习标记和个人笔记保存在 Supabase 或本机，而不是 GitHub。

## 四、网站的现行体验（改 UI 时不能退化）

根网址 <https://sonder98.github.io/gongkao-logic-errorbook/> **默认打开错题练习**；明确知识页深链 `#knowledge/<topic-id>` 可直达知识点；明确题目 `#practice/<question-id>` 可直达原题。

- 左侧题目导航：单行、可搜索、内部滚动、固定高度。
- 左侧知识导航：**按章节折叠**，默认只展开当前章节，展开另一章节时收起此前章节；搜索时直接展示所有匹配知识点；桌面最高400px、手机210px。
- 知识与真题能**双向跳转**（知识点的 `questionIds` 引用真实题目 ID）。
- `knowledge.json` 只能包含读者可用的知识正文，**不能夹 AI 操作、讨论记录、用户确认历史、GitHub 工程信息**。
- 原有登录、云端同步、进度本地缓存、冲突解决、笔记、导入/导出、历史原图均须保持兼容。

## 五、下一次最常见的四种任务

**只要求分析截图 / 逻辑题：** 认真读取原题和问法（加强、削弱、前提、没有削弱），区分正确项与迷惑项。**没有明确入库授权就不能追加 `questions.json`**。如果明确形成新学习规则，可以即时更新 `knowledge.json`；还没确认的理论保持讨论状态。

**用户让把题目收入错题本：** 从截图准确整理完整题干、问法和所有选项；正确答案有依据，否则说明不确定。追加到 `questions.json`，新稳定 ID、`image:""`；若已有对应 topic，把新 ID 关联进 `knowledge.json`。不要为了入一题修改大 HTML / 历史图片 / 数据库。

**用户讲新方法或改变知识分类：** 首先判断能否补到现有 topic。把**加强与削弱两个方向放在同一方法**；对考生只写规则、识别、例子、陷阱和真题。需要调整理论的，补 `STUDY_FRAMEWORK.md`；影响接力流程的，再修改本文件与 `AGENTS.md`。不要把之前每轮对话原样附进读者笔记。

**用户要求改网站：** 先读现有 HTML、测试、README 和验收清单；保证默认练习页、折叠知识导航、双向链接、手机适配不退化；保持 Supabase URL/公钥和进度兼容。不随意删除隐私保护或历史数据。

## 六、验证、授权、部署的诚实边界

```bash
node tests/validate-questions.cjs
node tests/validate-knowledge.cjs
node tests/smoke.cjs       # 浏览器回归，需 Playwright 及浏览器
```

本地使用 `python -m http.server 8000`，再访问 `http://localhost:8000/`；`file://` 不支持 JSON 异步读取。

能用 GitHub 连接器时可直接获取并提交到 `main`；如工具未连接 / 无权限，只能告知授权或交付补丁，**绝不能谎称改好了**。提交 SHA、GitHub Pages **部署状态**、实际测试情况要分别说明。静态 JS 语法通过≠真浏览器回归通过≠双账号 RLS/真实跨设备登录通过。

安全：GitHub 仓库可能是公开的，禁止提交密码、service_role、secret、真实 token、私人笔记；公开 Supabase Project URL/publishable key 并不是管理员凭据，不要替换成 secret。保持云端 `question_progress` 的 `(user_id,question_id)` 进度对应。

**这份接力文档的目的不是让新 AI 每次询问背景，而是让它用真实文件和当前指示直接继续学习、入库和工程工作。**


## 新增重点题与学习辨析

题目 `unknown-black-carbon-neurocognition` 已录入 `questions.json`，答案D、类别「相关性推因果」，并设 `important:true`。正式知识条目 `susceptibility-selection-bias`。难点：A只是儿童与老人群体整体的易感性，不是选择偏差；组间基线差异通常首先分析潜在混杂；严格的选择偏差关注入组、抽样或失访引入的系统扭曲。D用男孩与女孩的不同研究发现有限削弱宽泛因果结论，但“未发现显著相关性”不能当成“无作用”。详情见 `STUDY_FRAMEWORK.md` 最新专题。

`important:true` 是公开的“重点题”标记，网站可按“只看重点题”筛选；与每个账号的 `review` 个人待复习标记和 Supabase 答题记录完全独立。**禁止为了标记重点而自动改用户个人进度**。


## 七、最新学习状态与接手操作清单（2026-11-02）

### 默认工作方式（特别重要）

1. 用户说**“更新”“同步”**时，默认同时处理两个交付：**错题本 `questions.json`**（最近讨论而尚未入库的题）＋**知识笔记 `knowledge.json`**（新方法、已有陷阱补充及 topic→questionIds）。确有方法变化时同步 `STUDY_FRAMEWORK.md`；流程/接力变化再改 `AI_HANDOFF.md` 或 `AGENTS.md`。不必每轮机械改所有文件。
2. **先核对 GitHub 真实数据再动笔**，确定题目是否已经存在，保持稳定 ID、原文完整、参考答案及迷惑项比较。除用户明确授权“收录/更新/同步”外，普通解题讨论不要擅自修改题库。未知年份/考试填「未知」，不为了找出处而搜索；新题 `image:""`。
3. **优先归入现有知识体系**，尤其选项陷阱目前只有3个既定条目：`match-target`（结论指向、对象指标程度）、`modal-wording`（程度词与真实证据）、`irrelevant-repeat`（话题偏离、重复结论与效果偷换）。不要为每道题另立规则；确有新的平行方法时才新增独立 topic。学习笔记是面向考生的内容，不能混入代理交接指令。
4. **严格区分“题目答案”“选项证据力度”“参考答案争议”**。已入库 `unknown-western-democracy-rights-absolutism-dispute` 目前截图答案A，但C有合理的举例加强路径：论据/结论如何划分会影响排序。尊重用户对此争议的辨析，不可机械认为举例必弱。用户明确纠正“菌群与骨密度”题参考答案为B（非D），D说效果后续回落不能直接否定最初增强。
5. 尽量只做**必需文件的增量编辑**、一个批量提交和一次核验。提交成功≠Pages上线；要分别核验 GitHub 最新 SHA、文件引用完整性、Actions/Pages状态。如运行不到 `node tests/validate-questions.cjs` / `node tests/validate-knowledge.cjs` / 浏览器烟测，应如实说明未运行，不能假装已经测试。

### 当前“由因推果”已讨论的五种平行方法（以 STUDY_FRAMEWORK.md 和 knowledge.json 为详尽准则）

1. `build-remove-link`：建立／去除联系（支持补机制，削弱断环节；含规范性前提）。
2. `introduce-other-factors-*`：引入他因，下设“直接说利弊、两者相比、利弊相权、做了也白做、量变不等于质变”五个子项；加强与削弱在同一子项讲，不按方向重复分类。
3. `cause-antecedent-consequent-patterns`：前真后假／前假后真／前假后假。必须先把A、B写成完整命题并检查结论强弱、时间及比较指标；普通概率结论不能被一个有A无B者严格推翻。
4. `cause-direct-examples`：直接举例子。通常是有限支持，举出有A有B不自动证明因果；观察数据缺少非A对照时需谨慎。
5. `cause-deny-conclusion-premise`：**否定结论／论据（本轮新增）**。直接反证结论或事实论据，与允许论据为真却质疑推理的“去除联系”明确区分。

### 最近新增的两道重点题（答案与干扰项必须保留）

- `unknown-mosquito-blood-type-bite-ranking`（蚊子血型排序，答案D）：D去除“血型→招蚊”的联系，未否定原样本比例。A、C只涉及部分对象，但并非因此无效；提出局部混杂≠已经推翻某一比较关系。重点关联 `build-remove-link`、`introduce-other-factors-compare`、`correlation-vs-cause`、`match-target`，与新方法仅做辨析对照。
- `unknown-grape-seed-free-radicals-aging`（葡萄籽与自由基，答案C）：C针对“年龄越大自由基越多”提出相反年龄组浓度数据，属于否定论据。A的肝损伤针对安全/总体健康，未直接否定“抗氧化防衰老”的具体功效。C也不是完整否定“自由基氧化损伤”或葡萄籽的任何作用。主要归入 `cause-deny-conclusion-premise`，同时关联现有利弊相权与结论指向。

### 交接时的检查清单

- 先读 `AGENTS.md`、`STUDY_FRAMEWORK.md`、`knowledge.json`、`questions.json`，本文件只提供快速入口；权威以现行 JSON 为准。
- 查找最近讨论的未入库题目，按稳定ID去重；原有 28 道题保留不动，本轮新增 2 道。
- 网站链接 `https://sonder98.github.io/gongkao-logic-errorbook/`；`#practice/<id>` 题目、`#knowledge/<topic-id>` 知识；GitHub `main` 通过 Pages 发布，等待 Actions 成功才能称已上线。
- 进度/笔记在 Supabase，勿触碰私有进度或提交任何凭据；重点题 `important:true` 仅公共标记。

## 八、由果推因阶段完结与最近入库题（2026-11-02）

用户已宣布**由果推因部分学到这里，进入下一阶段前无需为本阶段扩展新子类别**。核心原则见 `STUDY_FRAMEWORK.md` 第14节，正式读者笔记位于 `knowledge.json` → `effect-overview`、`alternative-causes`。

- 与由因推果相比，主要差异在**削弱他因**：由因推果中新增因素须能阻碍原原因A产生B；由果推因中，B既已出现，实际存在且能解释B的独立竞争原因C可动摇A的归因，不必影响A本身。所谓“原因真实存在”包括实验、调查和具体事件中的实际原因，不只限实验室。支持与假设的方法整体共通，不能机械说所有证据力度相同；去除联系、否定论据等也适用于由果推因的相关题目。
- **排除他因加强通常较弱**：排除了“厚壳保护”，并不能证明抗菌原因只剩溶菌酶素。
- 丛冢雉蛋题 `unknown-megapode-egg-infection-lysozyme`，**选非答案D**，全站标重点：**A** 其他动物也有相近溶菌酶素含量但感染率高，可类比前真后假，质疑原有原因解释力（含量相近不代表活性相同）；**B** 真实存在的抗菌碳酸钙层、**C** 真实存在的减少细菌附着的气味，均是竞争他因削弱；**D** 蛋壳更薄、更易受侵入，方向相反，不能解释“感染率低”，可弱排除厚壳优势。该题四个选项要在错题解析和知识笔记中完整保留，不能仅记D正确。
- 海山生物群落题 `unknown-seamount-endemic-fauna-sampling`，**答案D**，全站标重点：早期“高度特有”的发现可能因采样不足，动摇从群落低重叠到高度特有性的论据可靠性；B只说长期物理隔离很少，不能直接否定独特生物群。这题沿用之前“由因推果－否定结论/论据”的方法，**不归为由果推因的竞争他因**。
- 原题 `2022-dingcan` 已在库内（答案B、①④），**切勿重复录入**。其余相关的桃园套袋和老年女性体重题也已在库内。
- 后续用户说“更新”默认同时更新 **错题本 + 知识笔记**，有理论框架变更才改 `STUDY_FRAMEWORK.md`，交接发生变化再改本说明。优先查重、沿用现有知识结构，并保持题目ID及账号进度兼容。题目没给出考试年份则标「未知」，不得为了补来源杜撰。

## 九、因果倒置独立知识点与犬行为焦虑症假设题（2026-11-02）

用户明确要求将「因果倒置」从「因果倒置与共同原因」中**单独拆出**，已在 `knowledge.json` 的「相关性推因果」章节新增 `causal-reversal`。旧ID `direction-confounding` 保留作「共同原因」，避免旧链接失效，并分别迁移相关示例/题目关联。

新题 `unknown-dog-anxiety-magnesium-causal-reversal`（狗行为焦虑症、血镁偏高、口服因菲他命），参考答案**D**，标记 `important:true`，关联 `causal-reversal`、必要假设等已有条目。D在命题语境下排除“疾病导致镁升高”的反向因果路径；但严格说它并未证明“高镁导致焦虑”，且不一定是形式逻辑必要条件。答题解释保留这层边界，不要把练习题当成真实兽医治疗建议。

接手原则不变：用户说“更新”默认同时更新题库与知识笔记；优先复用分类，结构确有明确指示才拆分。GitHub验证真实文件和Actions结果后再声称已上线。

## 十、前提条件专门问法：潮汕土楼题（2026-11-02）

用户正在学习新的专门问法：「**要得到上述结论，需要补充的前提是**」。这不是泛泛地讨论形式逻辑必要条件；本阶段尤其关注：若题干说“某行为/建筑/制度是为了应对X而产生”，就要确认**行动所针对的现实情形X确实存在**，而不是必须证明行动后来成功解决了X。`knowledge.json` 新增「由因推果」下 `cause-prerequisite-conditions` 独立知识点，并同步更新 `STUDY_FRAMEWORK.md` 第16节。

新收录 `unknown-chaoshan-tulou-defense-prerequisite`：潮汕土楼因聚族集体防卫而建，参考答案**B**（明清有山贼海盗侵扰）；主要迷惑项**A**（土楼后来成功保护家族）属于行动最终效果，**即使防御未成功仍可能为了防御而建**。C土楼文化迁入、D当地军事封闭围寨传统均不是最直接的现实防卫需求。B不构成严格的唯一必要历史事实，尤其注意始建元代与明清侵扰的时间并不完全同一。录入 `important:true`，原题完整保存，年份/考试未知不杜撰。

不要将此题误放到「两句式推理」；也不要与“规范性前提：某主体应该追求目标”混淆。题目方法可以交叉关联已有 `build-remove-link` 与 `identify`、选项陷阱 `match-target`，但无需新建额外陷阱名称。以后说“更新”仍默认同步错题本和知识笔记，并检查关联、稳定ID和实际部署状态。

## 十一、最近五道题与跨题型比较辨析（2026-11-02）

用户明确决定**不新增独立的“比较型问题”知识点**，比较关系继续归入现有的 `introduce-other-factors-compare`、`experiment-comparability`、`controls-evidence` 与 `match-target`，按实际论证方法和选项陷阱交叉关联；不为任何单题新增口诀。最近一轮用户说“更新”，默认同时收录 **5道新题及知识笔记**，不修改旧题和已有 topic ID。

- `2022-henan-adolescent-risk-cardiovascular-intervention`：2022河南，答案**D**，前假后假可表现为**风险因素减少、患病风险减少**的程度型干预支持；A仅早期肥胖，C只知患者中早期不良习惯比例，缺对照。D说的是整体患病风险而非心血管病单项，需如实保留限制。
- `unknown-ecigarette-smoking-intention-relative-probability-disputed`：电子烟与传统烟尝试倾向，**B/C争议**。用户要求忽略截图绿色标记、独立分析；截图标C，前一轮独立推理选择B，入库暂记**B**但在题目 `type/reason/trap` 中完整保留C的参考路径与没有对照的不足，不要对用户说答案已经没有争议。重点是**单组绝对概率不等于比较概率**、意向不等于行为、B“有可能”的证据力度限制。
- `2022-guangdong-medical-ethics-priority-vs-method`：2022广东医学教育，答案**D**。用户提出C“医德教育主要依靠学校”是在连接重要性与学校培养，**确实有支持作用**；但结论是医德培养**更应**优先于专业理论，D患者相对更看重道德素养更直接满足比较理由。论据为事实性，结论为规范性，勿说反。
- `unknown-norway-hyperemesis-maternal-genes-family-environment`：挪威妊娠剧吐母女风险，答案**A**。现实共享的母女生活环境比D泛泛提到全国吸烟趋势更能解释**母女风险差异**；他因必须解释此研究观察到的具体关系，不能只解释患病一般成因。
- `unknown-vitamin-d-sunlight-calcium-osteoporosis-modern-vs-past`：日照减少、维生素D与现代缺钙风险，答案**B**。现代人含钙食物来源增多可能抵消吸收效率下降；C只比较现代患骨质疏松者与现代其他人，却未回应题干“现代 vs 过去”的跨时代比较。用户明确赞同B/C辨析。此题尤其保留B/C对照而不增加类别。

本轮对应正式考生笔记在 `knowledge.json` 已有条目中补充示例和陷阱；理论分类未变，故不额外改 `STUDY_FRAMEWORK.md`。原始截图未储存，题目保存完整文本、选项、参考与争议说明。未来更新以实际 `questions.json` 数量为准；AI_HANDOFF.md 数字仅是编辑时快照。

## 十二、论证逻辑 / 形式逻辑模块拆分（2026-11-03）

网站顶部改为两组共四个 Tab。旧 `questions.json`、`knowledge.json` 属于「论证逻辑」，原有 48 题与 31 个知识点不迁移、不改 ID；新的「形式逻辑」独立使用 `formal-questions.json`（初始空数组）、`formal-knowledge.json`（初始空章节），后续随着用户学习形成规则和题目后再逐步填充。原有练习页与知识页组件复用，模块切换仅改变内容源；Supabase 进度仍按唯一 question_id 保存，不变更表结构。

旧链接 `#knowledge/<id>` 和 `#practice/<id>` 继续对应论证逻辑；新链接 `#formal/knowledge[/<id>]` 和 `#formal/practice[/<id>]` 对应形式逻辑。根网址仍默认论证逻辑错题练习。两套知识点和题目不能交叉引用；形式逻辑新 ID 一律以 `formal-` 开头。注意后续「更新/同步」时根据题目所属模块写入相应 JSON，不再默认全部写进旧题库。

## 十三、形式逻辑四大题型：集合关系并入翻译推理（2026-11-03）

当前正式目录：一、翻译推理（含所有／有些集合推理）；二、矛盾推理；三、真假推理；四、综合推理。用户明确将原“集合推理”并入翻译推理，不再单列一级章。原独立 `formal-set` 仅为空章节，没有历史知识点与题目需要迁移；未改动任何历史题目 ID。

翻译推理目前有两个 topic：`formal-translation-basics`（题型识别、问法、箭头翻译）和 `formal-translation-quantifiers`（所有／有些四种命题的关系）。后者按 A=所有S是P、E=所有S不是P、I=有些S是P、O=有些S不是P 分析：A↔非O、E↔非I 为矛盾；在 S 非空时 A/E 必有一假、I/O 必有一真，A→I、E→O；有些S是P可换位为有些P是S，有些S不是P不能反向换位。关键严谨性：普通公考默认论域中的 S 类非空，但在现代谓词逻辑空类下所有→有些不成立，A/E可双真而I/O可双假。

其余三个章节目前为空，待用户按课程继续讲解。原论证逻辑题库和知识库完全不动。 `formal-questions.json` 仍为空，不能凭空录入截图中的示意命题作为真题。


## 十四、翻译推理新增模态命题（2026-11-03）

`formal-knowledge.json` 的翻译推理章现有三个 topic：`formal-translation-basics`、`formal-translation-quantifiers`、`formal-translation-modality`。模态四命题为 A=必然P、E=不可能P、I=可能P、O=可能非P；其对应关系与“所有S是P、所有S不是P、有些S是P、有些S不是P”相同。对角线矛盾；上方必有一假、下方必有一真；A→I、E→O。重点辨析“不必然P”=“可能非P”，并非“不可能P”。默认有至少一种可能情形，比较时保持P及时间条件一致。此轮只有知识与教学规则更新，形式逻辑题库仍为空，不添加自造题目。

## 十五、两道翻译推理入库与新学习规则（2026-11-03）

新增两题到 `formal-questions.json`（原来0题、现2题），并将其关联到翻译推理下四个既有／新增知识点。2013吉林题 `formal-2013-jilin-not-all-people-like-you` 答案B（原图62%）；2015福建事业单位题 `formal-2015-fujian-disaster-unless-disagreement` 参考答案A（原图27%）。新增知识点 `formal-translation-nested-negation`：先给整句加方括号，外层模态否定和内层量词否定依次转换；“除非A，否则B”＝“不是A→B”，否定该条件关系必须“不是A并且不是B”。用户指定解释尽量使用中文、方括号、简单箭头，不用模态方框或菱形等符号。

特别注意2015福建题的D选项：A后半句“所有灾难必然可以避免”可以推出D“有些灾难必然可以避免”（默认灾难非空），并不代表D错误。参考答案A作为完整等价的原意还原；若题目仅要求可推出，A/D都成立，单选问法含歧义；也需保留“难以避免”和“无法避免”不严格同义的用词边界。题库 `trap` 和知识正文都必须保留这层辨析。原论证题和用户进度结构不动。

## 十六、形式逻辑：矛盾推理两种基本结构（2026-11-03）

当前进入形式逻辑的“二、矛盾推理”。用户的题型识别标准：题干全是逻辑关系、不直接给事实真，选项是事实真，任务是翻译条件、发现冲突并确定必然事实。两种形式：A→B、A→非B，推出必然非A；A→B、非A→B，推出必然B。第一种是相同前件推出矛盾后件，因此否定共同前件；第二种是A与非A穷尽情况且均推出B，因此B必真。严格注意第二种不是直接的B／非B矛盾，而是分类穷尽。

`formal-knowledge.json` 的 `formal-contradiction` 章节已新增 `formal-contradiction-two-patterns`，对考生展示题型识别、两个结构、中文示例和陷阱。`formal-questions.json` 仍维持2题：没有新真题，不要人为录入示例为真题。教学继续使用中文、A/非A、简单箭头，不使用模态数学符号。

## 十七、矛盾推理阶段收口与内容精简（2026-11-03）

用户已讲解并要求同步六道矛盾推理题，入库顺序与答案：
1. `formal-unknown-recruitment-four-positions`：招聘四岗位，**B**，乙正反→丙销售，岗位唯一排除乙出纳。
2. `formal-unknown-investment-five-fields`：教育医药投资，**C**，人工智能投／不投矛盾，否定条件②前件。
3. `formal-unknown-graduates-seven-paths`：七人毕业去向，**C**，先找乙就业／考研的后件冲突，③→①形成最短链，再用②确定乙丁留学。
4. `formal-unknown-secondment-choose-chen`：五选三挂职，**D**，张选／不选两路均推出陈入选。
5. `formal-2022-sichuan-excellent-team`：2022四川优秀考评，**A**，陈优秀则目标直接成立；陈不优秀→肖优秀。
6. `formal-2019-jiangsu-project-pair-impossible`：2019江苏项目建设，**D**，污水处理厂→排污管道→不建垃圾处理厂。

形式逻辑由2题增至8题；论证逻辑仍48题。两种基础结构和考试技巧统一收录于 `formal-contradiction-two-patterns`，保留原知识点 ID；并对形式逻辑五个知识条目整体精简，采用直接、正向的考场技巧陈述，不附加先前解法优劣的防御型反思。年份／来源不明的题标“未知”，不补造题源。保持题目原文、选项和稳定 ID；新题不存图片。旧的 2015 福建 A/D 争议仅在题目解析与必要知识边界中保留，不延伸为读者知识笔记的反复辩护。

## 十八、集合推理五模型与7题入库（2026-11-04）

用户将集合推理作为翻译推理的子模块。现行五类：四命题关系、换位逆否、所有串联、**所有A是B＋有些C是A→有些C是B**（首选记忆）、**所有A是B＋所有A是C＋存在A→有些B是C**（共同起点找交集）。“有些＋有些”不能直接串联，且全称箭头不能倒推。考场优先从已知“有些”出发沿全称箭头传递；多条全称共有前件则找交集；前提题从目标倒查缺失的链接。知识条目 `formal-translation-quantifiers` 已在原位更新，不改ID，没有新增章节，写法保持精简。

本轮追加7题：`formal-unknown-party-charter-quantified-converse` C；`formal-unknown-multilingual-employees` B（问“不正确”）；`formal-unknown-phd-statistics-men` B；`formal-unknown-car-over-600k-scrap` D；`formal-unknown-textile-dormitory-premise` D；`formal-2020-beijing-sprint-longrun-premise` D；`formal-2023-shanghai-film-indian-nonscifi` A。年份／地区只在截图明确时填入（2020北京、2023上海）；其余记“未知”，不可擅自补造来源。全部为 `翻译推理`，对应知识点关联保留原2题并加入7题。形式逻辑15题，论证逻辑48题。原有所有历史ID、云端进度和组件布局不变，题图不入库。

用户明确偏好中文＋方括号＋简单箭头，不使用数学方框、菱形符号；读者知识体系不堆砌对过往解法的批评、自我辩护、反复纠错记录，只保留系统化知识与可迁移的考场策略。

## 十九、真假推理入库（2026-11-05）

形式逻辑第三章「真假推理」开始，正式知识点固定为两个：`formal-truth-contradictions`（找矛盾）和 `formal-truth-linked`（同真同假）。矛盾：A→B vs A且非B；A或B vs 非A且非B；“所有／有些”四命题对角线。不能同真、不能同假、同真单向推出属于后一知识点，常用关系包括“A真→A或B真”、“非A真→A→B真”、“B真→A→B真”、唯一席位的互斥、A→B与非B不能同假。只有一真，不能同假的一对占用唯一的真话名额；只有一假，不能同真的一对占用唯一假话名额。**选项给完整人选或排列时可以优先代入**，这是效率策略，不另立知识章节。

本次在 `formal-questions.json` 新增5道真假推理题及关联解析：`formal-unknown-candy-four-children-two-true` A、`formal-2019-jiangxi-speech-first-one-true` C、`formal-unknown-four-classmates-accountant-true` D、`formal-unknown-academic-committee-single-adopted-opinion` D、`formal-unknown-singing-ranking-one-true` A。知识双向关联：找矛盾3题（糖果、演讲、职业）、同真同假3题（糖果、学科、歌唱）。形式逻辑现在20道题：翻译推理9、矛盾推理6、真假推理5；论证逻辑48，个人进度字段/稳定ID不改。只有演讲题有2019江西事业单位来源，其余题源未知。此阶段教学倡导直接、清晰、考场最快可用的规则，不堆历史讨论细节。

## 二十、形式逻辑四章阶段总结与综合推理入库（2026-11-07）

形式逻辑四章节（翻译、矛盾、真假、综合）已阶段性学完。综合推理六类框架：入选名额M选N、一一对应、排队方式、分组方式、宫格推理、其他；当前只有前四类有已讨论的具体策略，宫格／其他在总览保留分类但不编造套路。综合推理章节知识点共5项：`formal-comprehensive-overview`、`formal-comprehensive-selection`、`formal-comprehensive-matching`、`formal-comprehensive-order`、`formal-comprehensive-grouping`。

新增8道综合推理题（均未知年份及具体题源）：
- `formal-unknown-seven-villages-choose-four` A（7选4；名额超限，额外甲入选才能唯一确定方案）。
- `formal-unknown-five-skiers-four-events` D（5人分4组，单板人数超限否定石／白高山）。
- `formal-unknown-four-roads-paired-survey` A（乙丙不能共路，位置不足／恰好覆盖）。
- `formal-unknown-weekly-movies-cover-days` A（3部科幻3部武侠互斥，刚好覆盖剩余6天；用户第二次做未解出，重点题）。
- `formal-unknown-professors-provinces-subjects` C（人物×省份、人物×专业）。
- `formal-unknown-roommates-provinces-universities` D（两张4×4排除矩阵跨身份串联）。
- `formal-unknown-four-streets-income-rank` A（条件逆否＋相邻限制）。
- `formal-unknown-five-students-age-major-groups` D（3+2组、两人同组＋另外两人异组，小组容量超限）。

形式逻辑由20增至28道：翻译9、矛盾6、真假5、综合8；论证逻辑仍48道。**用户偏好的方法**：一一对应是严格的“人物×候选身份”的打叉排除矩阵，有2种身份就画2张矩阵，不要再建议三列表格；普通2组人数题能直接通过“同组2人＋异组两人强制占位→小组超限”推出来，不强求画表。M选N看更少的名额与强约束；排队找具体位置冲突；分组关注容量超限和互斥恰好覆盖。用户尤其重视考场最短推理链和极少枚举，不堆积细碎的纠错或防御性笔记。

新题新知识点均是独立稳定 `formal-` ID；原有全部题目和知识点不动；没有新题截图存储，Supabase 用户进度和历史 question_id 不迁移。后续新题按现有知识分类，若遇见宫格与其他结构再逐步完善。
