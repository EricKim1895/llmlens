\# AGENTS.md



你是我的项目协作助手。请严格按本文件规则协助开发本项目。



\## 项目名称



LLM Lens



\## 项目定位



LLM Lens 是一个 AI Search Visibility Checker。



它的目标是帮助小网站、小品牌、独立开发者、小型 SaaS 团队检测自己的品牌或网站在 AI 搜索答案中的可见性。



第一版是 MVP，只做 Mock mode，不接真实 API。



核心检测维度包括：



\* Brand mentions

\* Website citations

\* Recommendations

\* Competitor visibility

\* AI Visibility Score



\## 项目路径



本项目路径：



```text

D:\\VibeCoding\\LLMLens

```



只允许在这个目录内操作。



不要修改其他项目，尤其不要碰：



```text

D:\\VibeCoding\\EtsyProfitCalculator

D:\\VibeCoding\\ClearWordLab

D:\\VibeCoding\\ShapeManagement

D:\\VibeCoding\\VocabularyLearning

```



\## 当前阶段



当前阶段是：



```text

Mock MVP

```





\## 技术栈



使用：



\* Vite

\* React

\* TypeScript

\* CSS



尽量保持依赖简单。



不要主动安装大型 UI 框架，例如：



\* Material UI

\* Ant Design

\* Chakra UI

\* Tailwind UI

\* shadcn/ui



除非我明确要求，否则不要新增复杂依赖。



\## 代码结构



推荐结构：



```text

src/

&#x20; App.tsx

&#x20; main.tsx

&#x20; styles.css

&#x20; lib/

&#x20;   types.ts

&#x20;   promptGenerator.ts

&#x20;   mockAnalyzer.ts

&#x20;   scoring.ts



public/

&#x20; robots.txt

&#x20; sitemap.xml



.env.example

```



各文件职责：



\* `src/App.tsx`：主页面 UI、表单、结果展示。

\* `src/main.tsx`：React 入口。

\* `src/styles.css`：全站样式。

\* `src/lib/types.ts`：类型定义。

\* `src/lib/promptGenerator.ts`：根据输入生成 AI search prompts。

\* `src/lib/mockAnalyzer.ts`：生成稳定的 mock 分析结果。

\* `src/lib/scoring.ts`：计算 AI Visibility Score 和聚合指标。

\* `public/robots.txt`：SEO 抓取规则。

\* `public/sitemap.xml`：站点地图。

\* `.env.example`：未来真实 API 的环境变量示例。



\## 产品文案原则



页面语言使用英文。

在codex里用中文回答我的问题，解释项目细节。



文案风格：



\* 简洁

\* 专业

\* 克制

\* 面向小网站、小品牌、独立开发者、小型 SaaS

\* 不夸大效果

\* 不承诺确定性结果



可以使用这些表达：



\* mock audit

\* visibility signal

\* estimate

\* AI visibility audit

\* simulated result



不要使用这些承诺性表达：



\* guaranteed ranking

\* guaranteed citation

\* guaranteed ChatGPT recommendation

\* rank higher in ChatGPT for sure

\* get recommended by AI instantly



必须明确说明：



当前版本是 Mock mode，不代表真实 AI search engine 输出。



\## 页面要求



首页 `/` 就是主工具页。



品牌名：



```text

LLM Lens

```



H1：



```text

AI Search Visibility Checker

```



页面需要包含：



\* Hero

\* 产品说明

\* 主表单

\* Mock audit 结果区

\* FAQ

\* Disclaimer



\## 表单字段



表单需要包含：



\* Brand name，必填

\* Website URL，必填

\* Industry / niche，必填

\* Target country，默认 `United States`

\* Target language，默认 `English`

\* Competitors，可选，支持逗号或换行分隔

\* Number of prompts，默认 `10`，范围 `5–20`

\* Search engine：



&#x20; \* Mock mode，可用

&#x20; \* Perplexity，disabled / Coming soon

&#x20; \* Gemini，disabled / Coming soon



第一版默认并且唯一可用模式是：



```text

Mock mode

```



\## Prompt 生成规则



`promptGenerator.ts` 负责生成 prompts。



要求：



\* 不调用 AI

\* 不调用外部 API

\* 根据 brand name、industry、competitors 生成

\* 数量限制在 5–20

\* 结果去重

\* 顺序固定

\* 相同输入应产生相同输出



Prompt 类型可以包括：



\* best tools

\* buyer intent

\* how-to

\* alternatives

\* comparison

\* competitor-aware queries



示例：



```text

What is the best Etsy fee calculator?

Best tools to calculate Etsy seller fees

How can Etsy sellers calculate profit accurately?

ExampleTool alternatives for Etsy sellers

Which Etsy fee calculator is most accurate?

Best Etsy profit calculator for small sellers

```



\## Mock Analyzer 规则



`mockAnalyzer.ts` 负责生成 mock prompt-level results。



要求：



\* 不使用 `Math.random()`

\* 使用确定性 hash / pseudo-random

\* 相同输入多次运行结果必须一致

\* 结果看起来合理

\* 结果方便未来替换成真实 API 返回



每条 prompt result 包含：



\* Prompt text

\* Engine

\* Mentioned brand: yes / no

\* Cited domain: yes / no

\* Recommendation position: 1 / 2 / 3 / Not found

\* Competitors mentioned

\* Short AI answer summary



\## Scoring 规则



`scoring.ts` 负责计算指标。



需要计算：



\* AI Visibility Score，0–100

\* Mention Rate

\* Citation Rate

\* Recommendation Rate

\* Average Position

\* Competitor Share



建议权重：



\* Mention Rate：35%

\* Citation Rate：25%

\* Recommendation Rate：25%

\* Average Position bonus：15%



分数必须是 estimate，不要在 UI 中暗示这是精确真实排名。



\## SEO 要求



站点临时域名：



```text

https://llmlens.vercel.app

```



`index.html` title：



```text

LLM Lens | AI Search Visibility Checker

```



meta description：



```text

Check whether your brand appears in AI search answers. LLM Lens estimates mentions, citations, recommendations, and competitor visibility across AI search engines.

```



canonical：



```text

https://llmlens.vercel.app/

```



`robots.txt`：



```text

User-agent: \*

Allow: /



Sitemap: https://llmlens.vercel.app/sitemap.xml

```



`sitemap.xml` 第一版只包含首页：



```text

https://llmlens.vercel.app/

```



\## 环境变量规则



可以创建 `.env.example`。



内容：



```env

VITE\_APP\_SITE\_URL=https://llmlens.vercel.app

PERPLEXITY\_API\_KEY=

GEMINI\_API\_KEY=

```



不要创建真实 `.env`。



不要写入任何真实 API key。



重要：



`PERPLEXITY\_API\_KEY` 和 `GEMINI\_API\_KEY` 只是未来后端预留。当前 React 前端不要读取它们。



未来如果接真实 API，必须通过后端或 serverless function 调用，不能把 API key 暴露在浏览器端。



\## 真实 API 预留原则



第一版不要接真实 API。



未来可能接：



\* Perplexity Sonar API

\* Gemini API with Google Search Grounding



未来真实 API 逻辑应该放在后端或 serverless API 中，而不是直接放在 React 前端。



可以预留接口设计，但不要实现真实请求。



\## Git 规则



不要自动提交 git。



不要自动 push GitHub。



每次完成修改后，只告诉我：



\* 修改了哪些文件

\* 为什么这样改

\* 如何运行

\* 如何验证

\* 是否通过 build



等我确认后，再进行 git commit 或 push。



\## 验证要求



每次完成开发修改后，至少运行：



```powershell

npm run build

```



如果项目配置了 typecheck 或 test，也一起运行。



完成后汇报：



\* `npm run build` 是否通过

\* 是否有 TypeScript 错误

\* 是否有运行时风险

\* 本地启动命令是什么



本地启动命令通常是：



```powershell

npm run dev

```



\## 修改原则



1\. 每次只做我明确要求的改动。

2\. 不要主动扩大需求。

3\. 不要顺手重构无关代码。

4\. 不要新增复杂功能。

5\. 不要引入不必要依赖。

6\. 不确定时，先说明假设。

7\. 涉及较大改动时，先给计划，不要直接改。

8\. 涉及 SEO、域名、sitemap、canonical 的改动，先说明影响。

9\. 涉及真实 API、后端、数据库、登录、支付的改动，必须先征求确认。

10\. 修改完成后必须说明验证方式。



\## 需要先确认的情况



遇到以下情况，先问我，不要直接做：



\* 删除文件

\* 安装新依赖

\* 修改项目架构

\* 接入真实 API

\* 创建后端服务

\* 创建数据库

\* 添加登录

\* 添加支付

\* 修改 SEO title

\* 修改 meta description

\* 修改 canonical

\* 修改 sitemap

\* 修改 robots.txt

\* 创建 `.env`

\* 写入 API key

\* git commit

\* git push

\* 部署到 Vercel



\## 当前优先级



当前最高优先级：



1\. 先完成 Mock MVP。

2\. 保证页面可用。

3\. 保证交互清楚。

4\. 保证 mock 结果稳定。

5\. 保证 build 通过。

6\. 保持代码简单，方便后续接真实 API。



不要为了“看起来高级”而增加复杂度。



\## 当前项目状态补充



\* 项目名称：LLM Lens

\* 当前线上地址：https://llmlens-sigma.vercel.app

\* GitHub 仓库：EricKim1895/llmlens

\* 当前版本：Mock MVP

\* 当前页面已加临时 `noindex, nofollow`

\* 当前不提交 GSC，不请求编入索引

\* 下一阶段目标：Real Perplexity MVP



\## 下一阶段：Real Perplexity MVP



下一阶段目标是在保留 Mock mode 的基础上，新增 Perplexity Sonar 真实检测模式。



目标流程：



1\. 前端继续使用现有表单。

2\. 前端生成 prompts。

3\. 前端调用后端或 Vercel Serverless Function。

4\. 后端使用 `PERPLEXITY_API_KEY` 调用 Perplexity Sonar API。

5\. 后端返回 answer text 和 citations。

6\. 系统分析：

   \* brand mention

   \* cited domain

   \* competitor mentions

   \* recommendation signal

7\. 结果尽量复用现有 `PromptResult` / `AuditResult` 结构。



\## 真实 API 安全规则



\* 真实 API key 绝不能出现在前端代码中。

\* React / Vite 前端不能读取 `PERPLEXITY_API_KEY`。

\* `PERPLEXITY_API_KEY` 只能在后端或 Vercel Serverless Function 中读取。

\* 不要创建真实 `.env` 或 `.env.local`。

\* 不要把 API key 写入仓库。

\* 不要把 API key 写入 `.env.example`。

\* `.env.example` 只能保留空占位。

\* 如果需要本地测试真实 API，应让我手动创建 `.env.local`。

\* 如果需要线上测试真实 API，应让我在 Vercel Project Settings → Environment Variables 中手动添加 `PERPLEXITY_API_KEY`。



\## noindex 规则



当前页面仍处于真实功能接入前阶段，必须保留：



```html
<meta name="robots" content="noindex, nofollow">
```



不要在未明确确认前移除 noindex。



只有满足以下条件后，才可以讨论去掉 noindex：



\* Perplexity 真实检测已上线

\* 线上真实检测通过

\* 错误处理正常

\* API key 没有泄露

\* 成本限制已生效

\* 我明确确认可以开放索引



\## 成本控制规则



真实 Perplexity 模式必须保守控制成本：



\* 第一版最多允许 5 个 prompts。

\* Mock mode 可以继续允许 5–20 个 prompts。

\* Perplexity mode 不使用高成本模型。

\* 第一版使用基础 Sonar，不使用 Sonar Pro / Deep Research。

\* 不做高并发请求。

\* 前端必须提示真实 API 模式会消耗 API credits。

\* API 失败时要友好提示，不要反复自动重试。



\## API 结构规则



未来真实 Perplexity API 应通过类似下面的后端接口实现：



```text
api/analyze-perplexity.ts
```



或等效的 Vercel Serverless Function。



不要在 `src/lib` 中直接发起带 API key 的 Perplexity 请求。



可以新增前端 client 文件，例如：



```text
src/lib/analyzerClient.ts
```



但这个 client 只能调用自己的后端接口，不能直接调用 Perplexity。



\## UI 规则



下一阶段 UI 只做最小改动：



\* Mock mode 保留。

\* Perplexity 从 Coming soon 改为可选。

\* Gemini 继续 Coming soon。

\* 选择 Perplexity 时显示：`Real API mode · Uses Perplexity Sonar · Limited to 5 prompts`

\* 提交按钮根据模式显示：

  \* `Run mock audit`

  \* `Run Perplexity audit`

\* 添加 loading 状态。

\* 添加友好错误提示。

\* 结果区标明 Engine: Perplexity Sonar。

\* 不要大改当前首页布局。



\## 分析逻辑规则



Perplexity 返回结果的第一版分析逻辑保持简单：



\* Brand mentioned：answer text 中大小写不敏感匹配 brand name。

\* Cited domain：citations URL 的 hostname 是否匹配用户 website hostname，忽略 www。

\* Competitors mentioned：answer text 中大小写不敏感匹配 competitor names。

\* Recommendation position：如果不能可靠判断，就不要伪造精确排名，可以返回 null。

\* Recommendation signal：可以基于 `mentionedBrand` + `recommend` / `best` / `top` / `option` 等上下文做弱判断。

\* 不要把估算结果包装成绝对排名。



