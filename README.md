# PSPDB 骰娘隐私声明生成器

公共骰娘隐私声明通用范本（PSPDB）V1.0.0 及其授权说明的在线编辑与导出工具。

**在线地址：<https://lyjjl.github.io/pspdb-site/>**

## 功能

- 两份文档的正文直接以输入框形式编辑，所见即所得
- 一键复制全文（纯文本）
- 导出 TXT / Markdown
- 预览采用公文式排版：思源宋体、思源黑体、霞鹜文楷（均为开源字体），数字使用 Times New Roman

## 本地开发

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm build
```

构建产物输出到 `dist/`，生产环境资源路径为 `/pspdb-site/`。

## 部署

推送到 `main` 分支后，GitHub Actions 自动构建并发布到 GitHub Pages 项目子路径
`/pspdb-site/`，不影响用户根路径站点。

## 来源与许可

文档内容基于《公共骰娘隐私声明通用范本（PSPDB）V1.0.0》及其授权说明，
原作者：白世求祈。采用、转载或修改请遵守 CC BY-SA 4.0 并保留署名。

本工具仅作参考，不构成法律合规保证。
