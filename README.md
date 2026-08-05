# weread-enhancer

微信阅读网页版优化。

## 功能

### 主页

- 隐藏推荐及榜单

### 书架

- 隐藏账户信息及下载链接

### 阅读器

- 更换字体（提供宋体、楷体及黑体，分别选用[汉仪新人文宋](https://www.hanyi.com.cn/productdetail.php?id=758)、[汉仪旗黑](https://www.hanyi.com.cn/productdetail.php?id=832)及[方正新楷体](https://www.foundertype.com/index.php/FontInfo/index/id/290)）
- 取消两端对齐，使用左对齐
- 单独指定西文字体（见下）
- 更换背景色
- 简化控制栏

## 单独指定西文字体

将字体文件放入 `weread-enhancer/fonts/`，命名为 `latin.woff2`（也支持 `latin.ttf`、`latin.otf`），然后在弹窗中勾选“Latin font from fonts/latin.woff2”。

西文与数字使用该字体，中文仍使用所选的中文字体，由 `@font-face` 的 `unicode-range` 逐字符分派。范围为 `U+0020-024F, U+1E00-1EFF`，**刻意不含 U+2000-206F**（通用标点）：中文正文里的 `——`、`“ ”`、`…` 应由中文字体渲染为全角，交给西文字体会变成窄西文字形。

未放入字体文件、或未勾选时，字体栈会自动回落到中文字体，无需其他改动。

注意：该选项对“字体”为 **Default** 时无效——此时正文使用微信读书自带字体，扩展并未接管字体栈。请选择宋体／楷体／黑体／自定义中的任一项。

## 已知问题

1. 登录入口默认隐藏，请临时取消勾选“隐藏推荐”以恢复显示

## 截图

![阅读器](/screenshot.png "阅读器")

## 安装

1. 克隆或下载本仓库，在基于 Chromium 的浏览器扩展页中启用开发者模式，并选择仓库子文件夹 `weread-enhancer` 作为“已解压的扩展程序文件”
2. 通过[扩展商店](https://chromewebstore.google.com/detail/weread-enhancer/hpahddocpjnehfakhmjkepmnaihffdmn)安装
