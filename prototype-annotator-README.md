# Prototype Annotator — 原型需求标注工具

## 一句话介绍

在任何 HTML 原型页面中**添加一行代码**，即可在页面上**任意位置添加带编号的标注浮标**，点击浮标查看需求说明。标注数据保存在 `annotations.json` 文件中，随 HTML 一起提交 Git，团队所有人共享。

---

## 使用流程

```
产品经理                          研发
   │                              │
   ├─ 打开原型                     │
   │  Ctrl+Shift+. 进入编辑模式    │
   │  点击页面任意位置加标注       │
   │  输入需求说明 → 保存          │
   │  点击侧栏「保存到文件」       │
   │  → 下载 annotations.json      │
   │                              │
   ├─ 用下载的 JSON                │
   │  覆盖仓库中的 annotations.json │
   │  提交 Git                     │
   │                              ├─ git pull
   │                              │  打开原型页面
   │                              │  红色数字编号自动加载
   │                              │  点击编号查看需求说明
```

## 使用方法

### 第一步：复制文件

把 `prototype-annotator.js` 和 `annotations.json` 放到你的项目目录中。

### 第二步：引入页面

在 HTML 的 `</body>` 前加入：

```html
<script src="prototype-annotator.js"></script>
```

### 第三步：提交 Git

```
index.html
prototype-annotator.js
annotations.json    ← 标注数据（空数组 [] 初始状态）
```

---

## 激活编辑模式

| 方式 | 操作 |
|------|------|
| **快捷键** | `Ctrl + Shift + .`（句号键） |
| **URL 参数** | 网址末尾加 `?annotate` 后回车 |
| **控制台** | F12 → 输入 `__pa_enable()` 回车 |
| **双击大标题** | 双击页面上的大号标题文字 |

---

## 工作流详解

### 添加标注

```
激活编辑模式 → 点击页面任意位置 → 弹出输入框 → 输入说明 → 保存
→ 页面出现红色数字编号 → 退出编辑模式
```

### 导出标注数据

在侧栏点击 **「💾 保存到文件」** 按钮 → 浏览器下载 `annotations.json`

### 更新到仓库

```
用下载的 annotations.json 覆盖项目中的
git add annotations.json
git commit -m "更新标注数据"
git push
```

### 团队其他人

```
git pull
打开原型页面 → 红色编号自动加载 → 点击编号查看需求说明
```

> 💡 标注数据默认从 `annotations.json` 加载。如果没有该文件或加载失败，标注列表为空。

---

## 文件结构

```
项目目录/
├── index.html                 # 原型页面
├── prototype-annotator.js     # 标注工具
├── annotations.json           # 标注数据（提交 Git）
└── style.css                  # （可选）其他文件
```

---

## 常见问题

### Q: 标注数据存在哪里？
保存在 `annotations.json` 文件中，**提交到 Git** 后所有人共享。

### Q: 怎么让别人看到标注？
把 `annotations.json` 提交到 Git 即可。其他人拉取代码后打开页面自动加载。

### Q: 怎么让标注只有我能编辑？
`annotations.json` 是普通文本文件，编辑需要 Git 权限。其他人无法通过浏览器修改文件。

### Q: 标注太多能不能清理？
点击侧栏「🗑 清除」清空所有标注，再「保存到文件」覆盖 `annotations.json`。

### Q: 能不能在 HTML 里直接嵌入标注？
可以。在 `</head>` 前加入：

```html
<script>window.__pa_data = [...]</script>
```

脚本会优先使用 `__pa_data`，跳过 `annotations.json` 加载。适合 GitHub Pages 等纯静态部署。

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v3.0 | 2026-07-30 | 基于文件的工作流，annotations.json 存储，提交 Git 共享 |
| v2.0 | 2026-07-30 | 通用化，支持任意页面，5 种激活方式 |
| v1.0 | 2026-07-28 | 初始版本 |
