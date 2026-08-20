# Prototype Annotator — 原型需求标注工具 使用说明

## 概述

一个可复用的 HTML 原型标注工具，零依赖、纯 vanilla JS。在原型页面上点击即可添加编号标注（需求注释/改进点），标注数据通过 Git 共享给团队。

## 快速接入（3 步）

### 第 1 步：复制文件

将以下两个文件复制到你的原型项目目录：

```
your-project/
├── prototype-annotator.js    ← 主脚本（必须）
├── annotations.js            ← 种子数据（可选，首次可为空文件）
└── essay-report.html         ← 你的原型页面（作文批改报告内容页）
```

### 第 2 步：配置（告诉脚本你的页面结构）

在 `essay-report.html` 中引入脚本之前，设置 `window.__pa_config`：

```html
<!-- ========== 标注工具配置 ========== -->
<script>
window.__pa_config = {

  // 【必填·核心】视图配置
  // key: 视图名称（自定义），value: 该视图容器元素的 CSS 选择器
  // 标注会按视图隔离——在 A 视图添加的标注，切换到 B 视图时自动隐藏
  // 如果原型只有一个页面（无视图切换），填写一个即可
  views: {
    home: '#homePage',
    detail: '#detailPage'
  },

  // 【可选】Section 选择器 — 标注可以吸附到哪些区域
  // 标注点击在区域内时，pin 会跟随该区域定位，而非整个页面
  // 默认值：'.pa-section, section, .report-section, .card, .block, .module'
  sectionSelector: '.card, .panel, .module-box',

  // 【可选】滚动容器选择器 — pin 定位的参考父元素
  // 默认值：'.container, .pa-container, main, #app, .app'
  scrollContainer: '.main-content',

  // 【可选】视图检测方式 — 如何判断当前哪个视图可见
  // 'hidden-class'（默认）: 检查元素是否有 'page-hidden' 这个 CSS class
  // 'display': 检查元素 display !== 'none'
  viewDetection: 'hidden-class'
};
</script>

<!-- ========== 引入标注工具 ========== -->
<script src="annotations.js"></script>
<script src="prototype-annotator.js"></script>
```

### 第 3 步：标记 Section 区域（推荐）

在你的 HTML 中，给需要标注的区块加上选择器（对应上面配置的 `sectionSelector`）：

```html
<div class="card">          <!-- ✅ 标注可以吸附到这里 -->
  <h2>分数分布</h2>
  ...
</div>

<div class="panel">         <!-- ✅ 标注也可以吸附到这里 -->
  <h2>学生列表</h2>
  ...
</div>
```

如果不加，标注会以整个页面容器为参考系。

---

## 功能说明

### 进入编辑模式

| 方式 | 操作 |
|---|---|
| 快捷键 | `Ctrl + Shift + .` |
| URL 参数 | 在网址后加 `?annotate` |
| 控制台 | 输入 `__pa_enable()` |
| 双击标题 | 双击页面中 H1-H3、粗体、大号文字 |

### 编辑操作

| 操作 | 方式 |
|---|---|
| 添加标注 | 编辑模式下点击页面任意位置 |
| 编辑/查看 | 点击红色 pin，或点击右侧栏列表项 |
| 删除标注 | 编辑弹窗中点击 🗑 删除 |
| 标记完成 | 输入内容后保存，pin 自动变绿 |
| 退出编辑 | 点击顶部红条「退出」或再按 `Ctrl+Shift+.` |

### 数据持久化

```
编辑 → localStorage 自动保存（刷新不丢）
     → 点击侧栏「保存 annotations.js」→ 下载文件
     → 将下载的 annotations.js 覆盖项目目录中的
     → git commit & push → 团队同步
```

其他成员拉取代码后，打开页面自动看到所有标注（首次从 `annotations.js` 读取种子，之后优先读 localStorage）。

### 视图隔离

如果原型有多个页面/视图，标注会自动按所在视图分组：

- 在"班级总览"页添加的标注 → 切换到"学生报告"页时自动隐藏
- 侧栏列表也只显示当前视图的标注
- 视图检测基于配置中的 `views` 和 `viewDetection`

---

## 常见场景配置示例

### 场景 1：单页面原型（无视图切换）

```html
<script>
window.__pa_config = {
  views: { main: 'body' },
  sectionSelector: '.section, .card'
};
</script>
```

### 场景 2：Tab 切换的多视图原型

```html
<script>
window.__pa_config = {
  views: {
    overview: '#tab-overview',
    detail: '#tab-detail',
    settings: '#tab-settings'
  },
  sectionSelector: '.widget, .panel',
  viewDetection: 'display'    // Tab 通常用 display:none 切换
};
</script>
```

### 场景 3：移动端原型（视口小，侧栏需要调整）

```html
<script>
window.__pa_config = {
  views: { main: '#app' },
  sectionSelector: '.card',
  scrollContainer: '#app'
};
</script>
```

---

## 标注数据结构

每条标注的 JSON 格式：

```json
{
  "id": "p1785396685326",       // 唯一 ID
  "num": 1,                      // 显示编号
  "view": "home",                // 所属视图（对应 views 配置的 key）
  "sectionIdx": 2,               // 吸附的区域索引（-1 = 页面级）
  "offsetX": 253,                // 相对 section/容器的 X 坐标
  "offsetY": 410,                // 相对 section/容器的 Y 坐标
  "text": "这里需要支持搜索功能",  // 标注内容
  "createdAt": "2026/7/30 15:31",
  "updatedAt": "2026/7/30 15:35",
  "done": true                   // 是否已完成
}
```

---

## 注意事项

1. **引入顺序**：`annotations.js` 必须在 `prototype-annotator.js` **之前**引入
2. **视图容器 ID**：`views` 配置中的选择器必须对应页面中真实存在的元素
3. **Section 选择器**：配置的选择器会在**视图容器内部**再次查询（视图隔离时），建议使用 class 而非 ID
4. **兼容性**：需要支持 `MutationObserver`、`NodeList.forEach` 的现代浏览器（Chrome/Edge/Firefox/Safari 2019+）
