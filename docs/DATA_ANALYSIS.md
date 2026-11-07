# 资料分析模块：数据结构与增量入库说明

资料分析是第三个学习模块，与论证逻辑、形式逻辑平行；目前为基础框架，data-questions.json / data-materials.json 初始为空。**不要把文档里的格式示例当作真题入库。**

## 文件职责

- data-materials.json：共用材料，一篇材料对应多题，由 blocks 构成。
- data-questions.json：每个题目通过 materialId 关联材料，题目 ID 使用 data- 前缀，跨所有题库唯一。
- data-knowledge.json：知识章节/方法。每个知识点 questionIds 引用真实题目 ID；知识 ID 使用 data-topic- 前缀。
- data-analysis.js：前端结构化渲染、校验和数学公式加载（KaTeX），独立于原 Supabase 代码。
- data-analysis.css：双栏材料与题目、响应式表格和图表样式。
- assets/data-analysis/：仅用于确实需要保存的材料图片，优先压缩 WebP，不放 Base64。
- tests/validate-data-analysis.cjs：数据校验和渲染夹具测试，不需要网络。

## 材料结构（以下为格式示例，非入库真题）

~~~json
[
  {
    "id": "data-material-2026-example",
    "title": "某地区产业统计",
    "year": "2026",
    "exam": "未知",
    "blocks": [
      {"type": "paragraph", "text": "下表为某地统计数据。"},
      {"type": "table", "columns": ["年份", "产值（亿元）"], "rows": [["2024", "120"], ["2025", "150"]], "caption": "单位：亿元"},
      {"type": "chart", "chartType": "bar", "data": [{"label": "2024", "value": 120}, {"label": "2025", "value": 150}]},
      {"type": "image", "src": "assets/data-analysis/chart.webp", "alt": "原始统计图", "caption": "仅在无法可靠结构化时使用"}
    ]
  }
]
~~~

blocks 支持：paragraph、table、chart（bar / line 单序列）、image。一份材料可以混合多类 blocks，按原文顺序呈现。table 单元格可以是字符串，或 { "text": "...", "colspan": 2, "rowspan": 1 } 对象。图片只允许引用 assets/data-analysis/ 下的 .webp、.png、.jpg、.jpeg，不支持远程 URL、Data URI 和 Base64。

简单单序列统计图可以通过数字渲染 SVG；复杂组合图、双坐标轴、堆积/多系列若无法可靠结构化应使用经过压缩的原图，不得为迁就渲染器擅自修改统计数据。

## 题目结构（格式示例，非入库真题）

~~~json
[
  {
    "id": "data-2026-example-q1",
    "materialId": "data-material-2026-example",
    "year": "2026",
    "exam": "未知",
    "title": "某地区产业产值增长率",
    "category": "增长率",
    "type": "计算题",
    "difficulty": "易",
    "stem": "根据材料计算相关指标。",
    "ask": "2025 年同比增长率为多少？",
    "options": ["10%", "15%", "20%", "25%"],
    "answer": "D",
    "analysis": {
      "identify": "增长率",
      "locate": "2024 年为 120，2025 年为 150",
      "formula": "\\[\\frac{150-120}{120}=25\\%\\]",
      "quick": "差值 30 除以基期 120",
      "trap": "不能用现期 150 作分母"
    },
    "rule": "增长率分母取基期",
    "important": false
  }
]
~~~

年份、题干、选项、来源和答案只依据真实题目或人工核对的信息；无法确认填“未知”，不能编造。新题不上传整页截图，需要图片时仅保存单独的图形材料。

## 公式语法

在 analysis.*、知识点 summary / patterns 等文本字段支持行内公式 \(\frac{A}{B}\)，独立公式 \[\frac{A-B}{B}\]，也支持 aligned 环境多行计算。在 JSON 中反斜杠必须正确转义（例如源文本内写两个反斜杠代表一个 LaTeX 反斜杠）；请先校验 JSON。公式引擎按需从固定版本 KaTeX CDN 加载，失败时显示原始 LaTeX 文本，不阻断答题。

## 性能与兼容约束

1. 仅更新题目、解析或知识时，不得重上传或重写旧图片。
2. 图片作为独立文件，浏览器使用 loading=lazy 与 decoding=async；多个题目共用一份材料，不创建图片副本。
3. 压缩时保证原始统计文字、数字和坐标可辨读，优先 WebP；如不能清楚辨认，保留较大原图。
4. 原论证和形式题的 ID、category、深链与进度全部保留。Supabase (user_id, question_id) 结构复用，不迁移 schema。
5. 根路径继续默认论证逻辑练习；资料分析新路由为 #data/knowledge[/topic-id] 和 #data/practice[/question-id]。
6. 日常入库只需增量修改资料分析 JSON；**严禁把图片转成 Base64 写入 JSON 或 HTML。**
7. 每次工程发布运行三条 Node 数据校验；浏览器冒烟验证实际执行状态需单独报告。
