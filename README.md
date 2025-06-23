# weread-enhancer

微信阅读网页版优化。

更换背景色，取消强制两端对齐，增加行高，提供宋体、楷体、黑体替换，默认使用[汉仪新人文宋](https://www.hanyi.com.cn/productdetail.php?id=758)、[汉仪旗黑](https://www.hanyi.com.cn/productdetail.php?id=832)及[方正新楷体](https://www.foundertype.com/index.php/FontInfo/index/id/290)。

## 已知问题

1. 网页版登录入口被嵌套在一个推荐元素类中，请临时取消勾选“隐藏推荐”以恢复显示。
2. 左对齐样式将应用于阅读器内**所有元素**，包含原本被设定为居中或右对齐的文本，例如标题、落款等。更可靠的解决方式是创建 mock api 并劫持网络请求来返回修改后的 css 样式，目前是 `https://cdn.weread.qq.com/web/wrwebnjlogic/css/9.17fad35d.css`

## 截图

![阅读器](/screenshot.png "阅读器")

## 安装

克隆或下载本仓库，在基于 Chromium 的浏览器扩展页中启用开发者模式，并选择子文件夹 `weread-enhancer` 作为“已解压的扩展程序文件”。
