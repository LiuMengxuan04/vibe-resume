# VibeResume · Vibe 简历

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](package.json)
[![Web to PDF](https://img.shields.io/badge/web--to--PDF-Chromium-2563eb)](scripts/export-pdf.mjs)
[![Vibe Coding](https://img.shields.io/badge/vibe-coding-ff69b4)](#像-vibe-coding-一样编辑简历)
[![AI Editable](https://img.shields.io/badge/AI-editable-7c3aed)](skills/vibe-resume-editor/SKILL.md)
[![Open Source](https://img.shields.io/badge/open-source-111827)](https://github.com/LiuMengxuan04/vibe-resume)

> 像 vibe coding 一样编辑你的简历：告诉 AI 你想怎么改，它直接修改网页简历，再一键导出为 PDF。

VibeResume 是一个 **AI 友好、网页优先、可导出 PDF 的简历模板仓库**。你不需要在 Word、LaTeX 或浏览器打印预览里反复对齐版式；把简历维护成 `HTML + CSS`，让 AI 帮你改内容和排版，然后用脚本把网页看到的布局稳定导出为一页或两页 PDF。

[English](#english)

<p align="center">
  <img src="templates/internship-employment/standard-one-page/preview.png" alt="VibeResume 实习就业标准单页模板预览" width="31%" />
  <img src="templates/internship-employment/dense-two-page/preview-page-1.png" alt="VibeResume 实习就业高密度双页模板预览" width="31%" />
  <img src="templates/research-application/research-classic/preview.png" alt="VibeResume 科研申请模板预览" width="31%" />
</p>

- 示例网页：打开根目录 `index.html`，或进入下方模板目录
- 示例 PDF：[实习就业标准单页](export/vibe-resume-demo.pdf) · [实习就业高密度双页](export/vibe-resume-dense-two-page-demo.pdf) · [科研申请](export/vibe-resume-research-classic-demo.pdf)
- AI 使用说明：[skills/vibe-resume-editor/SKILL.md](skills/vibe-resume-editor/SKILL.md)

## 为什么做这个项目

传统简历维护经常卡在三个地方：

- 简历内容想让 AI 改，但 Word / PDF 不适合 AI 直接编辑。
- 网页看起来正常，浏览器“打印成 PDF”后版式却错位。
- 针对不同岗位微调简历时，内容、排版、PDF 导出很难形成稳定闭环。

VibeResume 的思路是：**把网页作为简历源文件，把 AI 当作编辑器，把 PDF 当作构建产物。**

## 核心特点

- **像 vibe coding 一样编辑简历**：直接告诉 AI 目标岗位、修改方向和版式要求，让它修改 `index.html` 与 `styles.css`。
- **网页即源文件**：简历内容、布局、图标、链接都在静态 HTML/CSS 中维护，天然适合 Git 版本管理。
- **一键导出 PDF**：使用 Chromium 渲染网页的 `screen` 布局；一页模板动态测量 `.page` 高度，双页模板识别 `.resume-page` 并按页导出。
- **分类模板**：`templates/internship-employment/` 提供两种实习就业模板，`templates/research-application/` 提供科研申请模板。
- **避免打印错位**：不依赖手动浏览器打印，不触发不可控的纸张边距、分页、缩放和 `@media print` 差异。
- **AI 配套 Skill**：仓库内置 `vibe-resume-editor`，可以作为 Codex-style skill 即插即用。
- **开源项目友好**：包含 README、License、示例 PDF、预览截图、导出脚本、依赖锁定和 mock 示例内容。

## 快速开始

> [!IMPORTANT]
> 浏览器只负责预览 HTML，不负责生成最终交付 PDF。请勿把浏览器“打印 / 另存为 PDF”的结果作为正式简历；最终 PDF 必须通过本项目官方导出脚本生成。

安装依赖：

```bash
npm install
```

本地预览（内置 Node 静态服务器，Windows / macOS / Linux 通用，无需 Python）：

```bash
npm run preview
```

然后访问：

```text
http://localhost:4173
```

导出 PDF：

```bash
npm run export:pdf
```

默认输出：

```text
export/vibe-resume-demo.pdf
```

导出高密度双页模板：

```bash
npm run export:pdf:dense-two-page
```

输出：

```text
export/vibe-resume-dense-two-page-demo.pdf
```

导出实习就业标准单页模板（分类目录版本）：

```bash
npm run export:pdf:internship-standard
```

导出科研申请模板：

```bash
npm run export:pdf:research-classic
```

输出：

```text
export/vibe-resume-research-classic-demo.pdf
```

也可以指定输出路径：

```bash
# Windows
npm run export -- export/my-resume.pdf
# macOS / Linux（两种方式等价）
npm run export -- export/my-resume.pdf
./export-pdf.sh export/my-resume.pdf
```

通用脚本也可以指定模板 HTML：

```bash
npm run export -- export/my-two-page-resume.pdf templates/internship-employment/dense-two-page/index.html
```

Windows 下也可以直接运行 `export-pdf.cmd`（与 `export-pdf.sh` 等价）：

```powershell
export-pdf.cmd export/my-resume.pdf
```

## 模板选择

### 实习就业

#### 标准一页模板

- 文件：`templates/internship-employment/standard-one-page/index.html` + `styles.css`
- 适合：经历较少、强调快速扫描、默认一页投递的简历。
- [预览](templates/internship-employment/standard-one-page/preview.png) · 导出：`npm run export:pdf:internship-standard`

根目录 `index.html` + `styles.css` 仍保留为兼容入口；`npm run export:pdf` 与 `npm run export:pdf:internship-standard` 均使用分类目录中的标准单页源文件。

#### Dense Two-Page 高密度技术模板

- 文件：`templates/internship-employment/dense-two-page/index.html` + `templates/internship-employment/dense-two-page/styles.css`
- 适合：算法、AI Agent、基础设施、研究与开源经历较多的候选人。
- 风格：白底、高密度正文、蓝色章节标题、细分隔线、浅色 Logo 标题条和详细技术 bullet。
- 页数：默认示例为两页；删除第二个 `.resume-page` 后，同一导出器会自动生成一页 PDF。
- [预览](templates/internship-employment/dense-two-page/preview.png) · 导出：`npm run export:pdf:dense-two-page`

当用户明确要求两页简历时，配套 Skill 会默认选择这个模板；未指定页数时仍沿用根目录的一页模板。

### 科研申请

#### Research Classic 科研申请模板

- 文件：`templates/research-application/research-classic/index.html` + `templates/research-application/research-classic/styles.css`
- 适合：博士申请、科研实习、研究助理与需要突出论文、代表性研究成果的候选人。
- 风格：连续长页、经典学术排版；代表作通过问题、方法、量化证据和发表状态建立扫读重点。
- [预览](templates/research-application/research-classic/preview.png) · 导出：`npm run export:pdf:research-classic`
- 说明：[`templates/research-application/research-classic/README.md`](templates/research-application/research-classic/README.md)
- 校徽说明：模板中的东南大学（SEU）校徽仅为示例；请自行准备并上传你的学校校徽，或删除该图片元素。

如果脚本找不到浏览器，可以手动指定 Chrome / Chromium：

```bash
# macOS / Linux
CHROME_PATH=/path/to/chrome ./export-pdf.sh

# Windows (PowerShell)
$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
npm run export:pdf
```

Windows 上无需手动指定：导出器会自动检测 `%LOCALAPPDATA%\ms-playwright`
下的 Playwright Chromium / headless shell，以及标准安装位置的 Chrome、
Edge 和 Chromium（`Program Files`、`Program Files (x86)`、`LOCALAPPDATA`）。

优先使用与当前 `playwright-core` 版本匹配的 Playwright Chromium。系统 Chrome
可能比项目依赖更新得更快；版本不兼容时，Chromium 偶尔会生成只有背景、边框和图片，
但没有正文文字的 PDF。导出器会检查生成文件的 PDF 文本绘制指令，发现这种情况时删除
无效文件并返回错误，而不是打印成功信息。

如果显式设置 `CHROME_PATH` 后出现文字层校验错误，请先取消该变量，让导出器自动选择
Playwright 缓存中的 Chromium：

```bash
unset CHROME_PATH
./export-pdf.sh export/my-resume.pdf
```

也可以把 `CHROME_PATH` 指向与项目 Playwright 版本匹配的 Chromium 可执行文件。文件名
建议避免 `*` 等 shell 特殊字符，即使路径已经放在引号中（PowerShell 中同理，如
`$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"`）。

在 Codex、CI、容器或其他受限环境中，Chromium 也可能因沙箱策略无法启动，
并出现 `Permission denied`、`MachPortRendezvousServer` 或浏览器启动后立即关闭。
导出器会把这些底层日志转换成可操作的提示。此时请在本机终端执行
`npm run export:pdf`（或 `./export-pdf.sh` / `export-pdf.cmd`），或为执行环境
开放启动无头浏览器所需的权限；设置 `CHROME_PATH` 只能选择浏览器，不能绕过系统沙箱。

## 像 Vibe Coding 一样编辑简历

推荐工作流：

1. 把你的目标岗位、目标公司、简历语言、已有经历和想强调的能力告诉 AI。
2. 让 AI 直接修改 `index.html`，把 mock 内容替换成你的真实简历。
3. 让 AI 调整 `styles.css`，控制密度、字号、宽度、间距、图标和模块顺序。
4. 在浏览器里预览，或者把截图发给 AI 继续微调。
5. 运行 `npm run export:pdf`，检查 PDF 是否仍是一页、内容是否完整。
6. 针对不同 JD 重复这个过程，形成多个岗位版本。

示例 prompt：

```text
请基于这个模板帮我制作 AI Agent 工程实习简历。
保持一页 PDF，突出 tool calling、RAG、Agent runtime、评测和工程化能力。
语气正式，不要堆关键词，不要编造我没有做过的经历。
```

## AI Skill

仓库内置一个 Codex-style skill：

```text
skills/vibe-resume-editor/SKILL.md
```

安装到本机 Codex：

```bash
mkdir -p ~/.codex/skills
cp -R skills/vibe-resume-editor ~/.codex/skills/
```

新开一个 Codex 会话后可以直接说：

```text
使用 vibe-resume-editor skill，把这份 Vibe 简历改成我的真实后端开发实习简历，并导出一页 PDF。
```

如果你的 AI 工具不支持 Codex skills，也可以把 `SKILL.md` 的内容复制到对话中作为项目说明。

## 示例内容声明

这个仓库里的简历内容是模板演示用 mock 数据。

- 姓名、学校、电话、邮箱、奖项、实习角色、项目描述、日期和技能均为虚构示例。
- `assets/avatar.png` 是 AI 生成头像，不是真实人物证件照。
- 高密度双页模板使用字节跳动、快手、美团和哔哩哔哩作为公司栏示例，并明确标注 `Mock 模拟经历`；所有实习内容与指标均为虚构演示。
- MiniCode 作为真实开源项目彩蛋保留：<https://github.com/LiuMengxuan04/MiniCode>。你可以替换成自己的开源项目、论文、产品或作品集。

## 关联项目

VibeResume 负责最后一公里：把简历内容维护成漂亮网页，并稳定导出 PDF。它可以和下面两个项目组成完整求职材料流水线：

- [鼠鼠实习妙妙工具](https://github.com/LiuMengxuan04/shushu-internship-tool)：AI 驱动的实习项目准备工具包。它可以根据目标 JD 选择 GitHub 项目、审计代码仓库、规划运行路径、设计可面试改造点，并生成 STAR 简历项目、核心代码讲解、面试 Q&A 和展示材料。
- [鼠鼠实习简历优化器](https://github.com/Sunanzhe2004/shushu-internship-resume-optimizer)：面向实习材料的简历整理工具。它把代码仓库、项目总结和业务背景等散乱材料先做成果审计，再按目标 JD 排序，生成简历 bullet、项目总结、STAR 草稿、面试 Q&A、风险检查清单和投递前检查表。

组合流程可以是：

```text
shushu-internship-tool
  -> 规划 / 构建 / 理解一个能投递、能面试的项目

shushu-internship-resume-optimizer
  -> 把项目证据、业务背景和经历材料整理成可投递表达

VibeResume
  -> 让 AI 修改网页简历，并导出稳定的一页或两页 PDF
```

## 图标与 Logo

公司和项目 Logo 是可选项。没有合适图标时，直接保留纯文本公司名即可，简历仍然应该完整、正式。

需要公司 Logo 时，Agent 应主动建议用户打开 [Iconfont](https://www.iconfont.cn/) 手动搜索、核对并下载 SVG，再将文件上传给 Agent。Agent 不应代替用户在 Iconfont 上凭关键字猜选，也不应用产品 Logo 冒充公司 Logo。如有公司官方品牌或媒体素材库，也可优先使用。

需要 AI 模型、产品或供应商图标时，先阅读 [LobeHub Icons 官方使用指南](https://lobehub.com/icons/skill.md)。LobeHub 标准流程是：

1. 安装 `@lobehub/icons`。
2. 查询包导出的 `toc`，核对 PascalCase `id`、品牌色和 `param.hasColor` / `hasBrandColor` 等变体。
3. 使用 `getLobeIconCDN(id.toLowerCase(), { format: 'svg', type: 'color', cdn: 'unpkg' })` 生成静态 SVG 地址。
4. 把选定 ID 加入 `scripts/sync-lobe-icons.mjs`，再运行 `npm run sync:logos` 将 SVG 下载到 `assets/logos/`；正式简历只引用本地文件，不热链 CDN。

如果要使用矢量图：

- 自己上传 SVG 到 `assets/logos/` 并在 `index.html` 中引用。
- 让 Agent 按上述官方 Skill 流程在 <https://lobehub.com/icons> 和 `toc` 中确认公司、产品、框架或开源项目图标。

科研申请模板中的东南大学（SEU）校徽仅用于展示图片位置和比例，不代表模板使用者的学校。使用时请自行上传并替换为你的学校校徽，或删除校徽。

当前双页示例中，字节跳动、快手和美团使用用户从 Iconfont 手动下载后提供的 SVG；哔哩哔哩使用 `@lobehub/icons` 的 `Bilibili.Color`。公司栏背景、左侧强调色与 Logo 主色呼应。公司名、Logo 和商标归各自权利方所有。

双页模板的 Logo 应保持透明直贴，不添加白色底座、白边、额外描边或装饰圆角。不要只机械统一 CSS 宽高：应根据 SVG 自带留白逐枚校准，使实际图形的视觉高度约占 44px 公司栏的 75%–80%。当前显示盒约为 35–39px；窄长图形可适度加宽，但不得拉伸或裁切。

## 项目结构

```text
.
├── assets/
│   ├── logos/
│   │   ├── bilibili-color.svg
│   │   ├── bytedance-iconfont.svg
│   │   ├── huawei-color.svg
│   │   ├── kuaishou-iconfont.svg
│   │   └── meituan-iconfont.svg
│   ├── fonts/
│   │   ├── eb-garamond-regular.woff2
│   │   ├── eb-garamond-semibold.woff2
│   │   └── eb-garamond-bold.woff2
│   ├── avatar.png
│   ├── minicode-logo.svg
│   └── preview.png
├── export/
│   ├── vibe-resume-demo.pdf
│   ├── vibe-resume-dense-two-page-demo.pdf
│   └── vibe-resume-research-classic-demo.pdf
├── skills/
│   └── vibe-resume-editor/
│       └── SKILL.md
├── scripts/
│   ├── export-pdf.mjs
│   ├── preview.mjs
│   └── sync-lobe-icons.mjs
├── templates/
│   ├── internship-employment/
│   │   ├── standard-one-page/
│   │   └── dense-two-page/
│   ├── research-application/
│   │   └── research-classic/
│   └── README.md
├── export-pdf.cmd
├── export-pdf.sh
├── index.html
├── styles.css
├── package.json
└── README.md
```

## 为什么不直接用浏览器打印

浏览器打印通常会从 `screen` 媒体切换到 `print` 媒体，触发不同的纸张大小、分页、边距、缩放、字体渲染和 `@media print` 规则，所以导出的 PDF 经常和网页预览不一致。

VibeResume 的导出脚本会打开所选模板 HTML，强制使用 `screen` 布局，隐藏工具栏；一页模板会测量 `.page` 的实际高度，分页模板会识别 `.resume-page` 并保持显式分页。这样生成的 PDF 才能稳定复现网页布局。

因此请严格区分：

- 浏览器：只用于查看和调试网页效果。
- `npm run export:pdf` / `npm run export:pdf:internship-standard` / `npm run export:pdf:dense-two-page` / `npm run export:pdf:research-classic` / `npm run export -- <output> <html>`（macOS/Linux 也可用 `./export-pdf.sh`，Windows 也可用 `export-pdf.cmd`）：用于生成最终交付 PDF。

无论是一页还是两页模板，正式 PDF 都必须走项目官方导出脚本。

## 致谢

VibeResume 的灵感来源之一，是与 [he11x / kexin](https://github.com/he11x) 的聊天交流。感谢这些关于 AI、简历维护和 vibe coding 工作流的讨论带来的启发。

## 开源协议

[MIT](LICENSE)

---

## English

VibeResume is a vibe-coding friendly web-to-PDF resume template repository. It includes two internship and employment templates plus a research application template.

### Highlights

- **AI-editable resume**: describe what you want, and let an AI agent update the HTML/CSS resume directly.
- **Web-first source**: content, layout, links, icons, and styling are all version-controlled as static files.
- **Stable PDF export**: Chromium renders the screen layout and exports either a measured continuous page or explicit `.resume-page` pages.
- **Template categories**: `templates/internship-employment/` contains standard one-page and dense technical layouts; `templates/research-application/` contains the research application layout.
- **Print mismatch avoidance**: no manual browser print workflow, no unexpected print-media pagination.
- **Codex-style skill included**: `skills/vibe-resume-editor/SKILL.md` gives agents project-specific editing and validation rules.
- **Open-source ready**: MIT license, badges, preview screenshot, sample PDF, export script, and mock demo content.

### Quick Start

> **Important:** Use the browser only to preview the HTML. Never deliver a PDF produced by browser Print / Save as PDF. Generate the final PDF with the repository's official export scripts.

```bash
npm install
npm run preview
npm run export:pdf
npm run export:pdf:internship-standard
npm run export:pdf:dense-two-page
npm run export:pdf:research-classic
```

Default PDF output:

```text
export/vibe-resume-demo.pdf
```

All of the commands above are cross-platform (Windows / macOS / Linux); no Python is required for `npm run preview`. For ad-hoc output paths use `npm run export -- <output.pdf> <input.html>`, or `export-pdf.cmd` on Windows / `./export-pdf.sh` on macOS and Linux.

### AI Workflow

1. Share your target role, target JD, resume language, and raw experience notes with an AI assistant.
2. Ask it to replace the mock content in `index.html` with your real resume.
3. Ask it to tune density, section order, typography, spacing, and icons in `styles.css`.
4. Preview the page, send screenshots back to the AI, and iterate.
5. Run `npm run export:pdf` and check the generated PDF.

### Demo Notice

The resume content in this repository is mock data. The avatar is AI-generated. The root one-page demo retains Huawei and Bilibili as demo-only placeholders; the dense two-page demo uses ByteDance, Kuaishou, Meituan, and Bilibili, each explicitly labeled `Mock 模拟经历`. None of the internship details describe real work experience. MiniCode is kept as a real open-source easter egg and can be replaced.

### Related Projects

- [shushu-internship-tool](https://github.com/LiuMengxuan04/shushu-internship-tool): turns a target JD into project selection, repository audit, runnable project planning, modification ideas, resume-ready STAR bullets, code explanations, interview Q&A, and presentation materials.
- [shushu-internship-resume-optimizer](https://github.com/Sunanzhe2004/shushu-internship-resume-optimizer): turns scattered internship materials into audited achievements, JD-ranked resume bullets, project summaries, STAR drafts, interview Q&A, risk checks, and application checklists.

Recommended pipeline:

```text
shushu-internship-tool -> shushu-internship-resume-optimizer -> VibeResume
```

### Acknowledgements

One source of inspiration for VibeResume was the conversation with [he11x / kexin](https://github.com/he11x) around AI, resume maintenance, and vibe-coding workflows.

### License

[MIT](LICENSE)
