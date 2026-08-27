/**
 * ============================================================
 * Prototype Annotator — 原型需求标注工具 v4.0（通用版）
 * ============================================================
 *
 * 用法：
 *   <!-- 1. 在引入脚本前配置（可选，不配置则使用默认值） -->
 *   <script>
 *   window.__pa_config = {
 *     // 视图配置：key=视图名, value=CSS选择器（定位该视图的容器元素）
 *     // 标注会根据所在视图自动隔离，切换视图时只显示对应视图的标注
 *     views: {
 *       class: '#classView',
 *       individual: '#individualView'
 *     },
 *
 *     // 滚动容器选择器（pin 定位的参考父元素）
 *     scrollContainer: '.container, main, #app',
 *
 *     // Section 选择器（标注可以吸附到这些区域）
 *     sectionSelector: '.pa-section, section, .report-section, .card, .block',
 *
 *     // 视图检测方式：
 *     //   'hidden-class' — 检查元素是否有 page-hidden class（默认）
 *     //   'display'      — 检查 display !== none
 *     viewDetection: 'hidden-class'
 *   };
 *   </script>
 *   <!-- 2. 引入 annotator -->
 *   <script src="prototype-annotator.js"></script>
 *   <!-- 3.（可选）在同目录放 annotations.js 作为种子数据 -->
 *   <script src="annotations.js"></script>
 *
 * 进入编辑模式：
 *   快捷键 Ctrl+Shift+.  或  网址加 ?annotate
 *   控制台 __pa_enable()
 *
 * 基于文件的工作流（annotations.js 是唯一数据源，不读 localStorage）：
 *   1. 页面加载时以 annotations.js 的内容为准
 *   2. 编辑后点侧栏「保存 annotations.js」→ 直接写回项目目录同名文件
 *      （需通过本地服务 start.bat 打开页面；双击 file:// 打开时浏览器禁止写
 *        磁盘，此时退回"下载副本"，请手动覆盖项目目录中的 annotations.js）
 *   3. 覆盖后的文件提交 Git，其他人拉取后打开页面即可看到全部标注
 *
 * ============================================================
 */
(function () {
  'use strict';
  window.__pa_enable = window.__pa_enable || function(){ console.warn('PA: 脚本加载中'); };
  window.__pa_disable = window.__pa_disable || function(){ console.warn('PA: 脚本加载中'); };

  try {

  // ============================================================
  // 配置解析
  // ============================================================
  var CFG = window.__pa_config || {};
  var VIEWS = CFG.views || { class: '#classView', individual: '#individualView' };
  var VIEW_ENTRIES = [];
  for (var _vk in VIEWS) { if (Object.prototype.hasOwnProperty.call(VIEWS, _vk)) VIEW_ENTRIES.push({ name: _vk, selector: VIEWS[_vk] }); }
  var SCROLL_SEL = CFG.scrollContainer || '.container, .pa-container, main, #app, .app';
  var SECTION_SEL = CFG.sectionSelector || '.pa-section, section, .report-section, .card, .block, .module';
  var VIEW_DETECT = CFG.viewDetection || 'hidden-class';

  // ============================================================
  // CSS
  // ============================================================
  var css = '.pa-toggle{position:fixed;bottom:24px;left:24px;z-index:9999;padding:10px 20px;border-radius:40px;background:#1a73e8;color:#fff;border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 4px 16px rgba(26,115,232,.4);display:none;align-items:center;gap:6px;transition:transform .15s}.pa-toggle:hover{transform:translateY(-2px)}body.pa-edit *{cursor:crosshair!important}.pa-pin{position:absolute;z-index:999;width:26px;height:26px;border-radius:50%;background:#c5221f;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(197,34,31,.6);border:2px solid #fff;user-select:none;pointer-events:auto;transition:transform .1s}.pa-pin:hover{transform:scale(1.2);z-index:1000}.pa-pin.done{background:#1e7e34;box-shadow:0 2px 8px rgba(30,126,52,.5)}.pa-indicator{position:fixed;top:0;left:0;right:0;z-index:99999;background:#c5221f;color:#fff;text-align:center;font-size:12px;padding:4px 0;font-weight:500;display:none;letter-spacing:.5px;font-family:sans-serif}.pa-indicator.show{display:block}.pa-indicator a{color:#fff;text-decoration:underline;cursor:pointer;margin-left:8px}.pa-modal{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:20000;align-items:center;justify-content:center}.pa-modal.open{display:flex}.pa-modal-box{background:#fff;border-radius:10px;display:flex;flex-direction:column;box-shadow:0 16px 48px rgba(0,0,0,.25);animation:pa-slideUp .15s ease}.pa-modal-box textarea{width:100%;box-sizing:border-box}@keyframes pa-slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.pa-sidebar{position:fixed;right:16px;top:80px;z-index:9998;width:260px;max-height:calc(100vh - 120px);overflow-y:auto;background:#fff;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.12);padding:14px;display:none;font-size:13px;font-family:sans-serif}.pa-sidebar.open{display:block}.pa-sidebar .pa-s-title{font-weight:600;font-size:13px;color:#1a1a2e;margin-bottom:10px;display:flex;align-items:center;gap:6px}.pa-sidebar .pa-s-item{padding:8px 10px;border-radius:6px;margin-bottom:4px;cursor:pointer;transition:background .15s;border:1px solid #eef0f4;font-family:sans-serif}.pa-sidebar .pa-s-item:hover{background:#fafbfc}.pa-sidebar .pa-s-item .pa-si-hdr{display:flex;align-items:center;gap:6px;margin-bottom:2px}.pa-sidebar .pa-s-item .pa-si-n{width:18px;height:18px;border-radius:50%;background:#c5221f;color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}.pa-sidebar .pa-s-item .pa-si-n.done{background:#1e7e34}.pa-sidebar .pa-s-item .pa-si-l{font-size:11px;color:#98a2b3;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pa-sidebar .pa-s-item .pa-si-t{font-size:12px;color:#344054;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-all}.pa-sidebar .pa-s-del{width:100%;text-align:center;padding:6px;border:none;background:transparent;color:#98a2b3;font-size:11px;cursor:pointer;font-family:inherit;border-radius:4px;margin-top:4px}.pa-sidebar .pa-s-del:hover{color:#c5221f;background:#fce8e6}@media print{.pa-toggle,.pa-sidebar,.pa-indicator{display:none!important}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ============================================================
  // HTML
  // ============================================================
  var html = [
    '<button class="pa-toggle" id="paToggle" style="display:none">📝 添加</button>',
    '<div class="pa-indicator" id="paIndicator">✏️ 编辑模式 — 点击任意位置添加标注 <a id="paExitBtn">退出</a></div>',
    '<div class="pa-modal" id="paEditModal"><div class="pa-modal-box" style="width:400px;padding:16px;gap:8px;">',
      '<div style="display:flex;align-items:center;gap:8px;">',
        '<span style="font-size:13px;font-weight:600;color:#1a1a2e;">标注 <span id="paLabel"></span></span>',
        '<span id="paSaveHint" style="font-size:11px;color:#98a2b3;flex:1;"></span>',
        '<button id="paEditClose" style="border:none;background:transparent;font-size:16px;cursor:pointer;color:#98a2b3;padding:0;line-height:1;">✕</button>',
      '</div>',
      '<textarea id="paInput" placeholder="输入需求说明..." style="width:100%;min-height:100px;border:1px solid #d0d5dd;border-radius:6px;padding:10px;font-size:13px;font-family:inherit;color:#344054;resize:vertical;line-height:1.6;box-sizing:border-box;"></textarea>',
      '<div style="display:flex;gap:6px;justify-content:flex-end;">',
        '<button id="paDelBtn" style="color:#c5221f;border-color:#c5221f;padding:4px 12px;border-radius:6px;border:1px solid;background:#fff;font-size:12px;cursor:pointer;font-family:inherit;">🗑 删除</button>',
        '<button id="paCancelBtn" style="padding:4px 12px;border-radius:6px;border:1px solid #d0d5dd;background:#fff;font-size:12px;cursor:pointer;font-family:inherit;">取消</button>',
        '<button id="paSaveBtn" style="padding:4px 14px;border-radius:6px;border:none;background:#1a73e8;color:#fff;font-size:12px;cursor:pointer;font-family:inherit;">💾 保存</button>',
      '</div>',
    '</div></div>',
    '<div class="pa-modal" id="paViewModal"><div class="pa-modal-box" style="width:400px;padding:16px;gap:8px;">',
      '<div style="display:flex;align-items:center;gap:8px;">',
        '<span style="font-size:13px;font-weight:600;color:#1a1a2e;">标注 <span id="paViewLabel"></span></span>',
        '<span id="paViewMeta" style="font-size:11px;color:#98a2b3;flex:1;"></span>',
        '<button id="paViewClose" style="border:none;background:transparent;font-size:16px;cursor:pointer;color:#98a2b3;padding:0;line-height:1;">✕</button>',
      '</div>',
      '<div style="min-height:60px;background:#f8f9fa;border-radius:6px;padding:12px;line-height:1.6;font-size:14px;color:#344054;white-space:pre-wrap;border-left:3px solid #1a73e8;" id="paViewContent">暂无内容</div>',
      '<div style="display:flex;justify-content:flex-end;"><button id="paViewCloseBtn" style="padding:4px 14px;border-radius:6px;border:1px solid #d0d5dd;background:#fff;font-size:12px;cursor:pointer;font-family:inherit;">关闭</button></div>',
    '</div></div>',
    '<div class="pa-sidebar" id="paSidebar">',
      '<div class="pa-s-title">📋 标注清单（<span id="paCount">0</span>）<span style="margin-left:auto;font-weight:400;font-size:11px;color:#98a2b3;cursor:pointer" id="paSideToggle">收起 ✕</span></div>',
      '<div id="paList"></div>',
      '<span class="pa-s-del" id="paClearBtn" style="display:inline-block;width:auto;padding:4px 10px;margin-right:4px;">🗑 清除</span>',
      '<span class="pa-s-del" id="paImportBtn" style="display:inline-block;width:auto;padding:4px 10px;color:#1a73e8;">📂 导入 JSON</span>',
      '<span class="pa-s-del" id="paExportBtn" style="display:inline-block;width:auto;padding:4px 10px;color:#1a73e8;">💾 保存 annotations.js</span>',
    '</div>'
  ].join('');

  var div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div);

  // ============================================================
  // JS 逻辑
  // ============================================================
  var editMode = false;
  var editingId = null;
  var _annotations = [];           // 内存中的标注数据
  var _jsonLoaded = false;         // 是否已从文件加载
  var _pa_url_annotate = false;

  if (window.location.search.indexOf('annotate') >= 0) {
    _pa_url_annotate = true;
    try { sessionStorage.setItem('__pa_auto', '1'); } catch(e) {}
  }

  // DOM refs
  var $ = function(id) { return document.getElementById(id); };
  var toggle = $('paToggle');
  var indicator = $('paIndicator');
  var sidebar = $('paSidebar');
  var list = $('paList');
  var count = $('paCount');
  var editModal = $('paEditModal');
  var viewModal = $('paViewModal');
  var input = $('paInput');
  var label = $('paLabel');
  var saveHint = $('paSaveHint');
  var viewLabel = $('paViewLabel');
  var viewContent = $('paViewContent');
  var viewMeta = $('paViewMeta');

  // ============================================================
  // 视图检测（基于配置）
  // ============================================================
  function getCurrentView() {
    for (var i = 0; i < VIEW_ENTRIES.length; i++) {
      var el = document.querySelector(VIEW_ENTRIES[i].selector);
      if (!el) continue;
      if (VIEW_DETECT === 'display') {
        if (el.offsetParent !== null || window.getComputedStyle(el).display !== 'none') return VIEW_ENTRIES[i].name;
      } else {
        // 默认 'hidden-class': page-hidden 类名
        if (!el.classList.contains('page-hidden')) return VIEW_ENTRIES[i].name;
      }
    }
    // 如果没有任何配置的视图可见，返回第一个已配置视图名（有 DOM 元素就认它）
    for (var j = 0; j < VIEW_ENTRIES.length; j++) {
      if (document.querySelector(VIEW_ENTRIES[j].selector)) return VIEW_ENTRIES[j].name;
    }
    return 'default';
  }

  function getCurrentViewContainer() {
    var v = getCurrentView();
    var sel = VIEWS[v];
    if (sel) return document.querySelector(sel);
    return document.body;
  }

  // ============================================================
  // 加载 annotations.js（唯一数据源，只从这里读，不读 localStorage）
  // ============================================================
  function loadAnnotations() {
    // annotations.js 通过 <script> 标签引入后挂在 window.__pa_data 上
    if (window.__pa_data && Array.isArray(window.__pa_data) && window.__pa_data.length > 0) {
      _annotations = JSON.parse(JSON.stringify(window.__pa_data));
    }

    _jsonLoaded = true;
    migrateAnnotations();
    renderSidebar();
  }

  // ============================================================
  // 导入 / 保存到文件
  // ============================================================
  function importFromFile() {
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.js,.json';
    fileInput.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          var text = ev.target.result;
          var arr;
          // 尝试直接解析为 JSON
          try { arr = JSON.parse(text); } catch(err) {
            // 尝试从 JS 文件中提取 __pa_data
            var match = text.match(/var\s+__pa_data\s*=\s*(\[[\s\S]*?\])\s*;/);
            if (match) arr = JSON.parse(match[1]);
            else { alert('文件格式错误，请导入 annotations.js 或 JSON 文件'); return; }
          }
          if (!Array.isArray(arr)) throw new Error('格式错误');
          _annotations = arr;
          syncPaData();
          migrateAnnotations();
          renderSidebar();
        } catch(err) { alert('文件格式错误，请确认是有效的标注数据'); }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  }

  function exportToFile() {
    var json = JSON.stringify(_annotations, null, 2);
    var jsContent = 'var __pa_data = ' + json + ';\n';

    // 通过本地服务（start.bat 或 node server.js）访问时，直接写回 annotations.js
    if (window.location.protocol !== 'file:') {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/save-annotations', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status === 200) {
          alert('✅ 已保存到 annotations.js');
        } else {
          downloadAsFile(jsContent);
        }
      };
      try {
        xhr.send(JSON.stringify({ content: jsContent }));
        return;
      } catch (e) { /* 退回下载 */ }
    }

    // file:// 双击打开：浏览器禁止写磁盘，退回下载副本（不打扰）
    downloadAsFile(jsContent);
  }

  function downloadAsFile(jsContent) {
    var blob = new Blob([jsContent], { type: 'text/javascript' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'annotations.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ============================================================
  // Data 操作
  // ============================================================
  function getReqs() { return _annotations; }
  function saveReqs(arr) { _annotations = arr; }
  function syncPaData() {
    // 只更新内存态，落盘由「保存 annotations.js」按钮写回文件完成
    try {
      window.__pa_data = JSON.parse(JSON.stringify(_annotations));
    } catch(e) {}
  }
  // 迁移旧数据格式（只处理坐标格式，不修改 view 归属）
  function migrateAnnotations() {
    var changed = false;
    var container = document.querySelector(SCROLL_SEL) || document.body;
    var cr = container.getBoundingClientRect();
    _annotations.forEach(function(r){
      // 旧格式：fixedTop/fixedLeft 绝对坐标 → offsetX/offsetY 相对坐标
      if (r.sectionIdx === -1 && (r.fixedTop !== undefined || r.fixedLeft !== undefined)) {
        if (!r.offsetX && !r.offsetY) {
          r.offsetX = Math.round((r.fixedLeft || 0) - cr.left + window.pageXOffset);
          r.offsetY = Math.round((r.fixedTop || 0) - cr.top + window.pageYOffset);
        }
        delete r.fixedTop;
        delete r.fixedLeft;
        changed = true;
      }
    });
    if (changed) renderSidebar();
  }

  // ============================================================
  // Pins
  // ============================================================
  function renderPins() {
    document.querySelectorAll('.pa-pin').forEach(function (el) { el.remove(); });
    var curView = getCurrentView();
    // 只显示当前视图的标注
    var filtered = _annotations.filter(function(r){ return !r.view || r.view === curView || r.view === 'unknown' || r.view === 'default'; });
    var scrollContainer = document.querySelector(SCROLL_SEL) || document.body;
    if (scrollContainer && window.getComputedStyle(scrollContainer).position === 'static') scrollContainer.style.position = 'relative';
    filtered.forEach(function (r) {
      var p = document.createElement('div');
      p.className = 'pa-pin' + (r.done ? ' done' : '');
      p.textContent = r.num || '?';
      p.title = r.text ? r.text.substring(0, 40) : '';

      var parent = null;
      if (r.sectionIdx >= 0) {
        // 根据 view 字段选择正确的容器查找 section
        var _vSel = VIEWS[r.view];
        var _viewContainer = _vSel ? document.querySelector(_vSel) : null;
        var _allSections = (_viewContainer ? _viewContainer : document).querySelectorAll(SECTION_SEL);
        parent = _allSections[r.sectionIdx];
      }
      if (!parent) parent = scrollContainer;

      var top = r.offsetY || r.fixedTop || r.y || 0;
      var left = r.offsetX || r.fixedLeft || r.x || 0;
      if (window.getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
      p.style.position = 'absolute';
      p.style.top = top + 'px';
      p.style.left = left + 'px';

      p.onclick = function () {
        for (var i = 0; i < _annotations.length; i++) {
          if (_annotations[i].id === r.id) {
            if (editMode) openEdit(_annotations[i]); else openView(_annotations[i]);
            return;
          }
        }
      };
      parent.appendChild(p);
    });
  }

  // ============================================================
  // Sidebar
  // ============================================================
  function renderSidebar() {
    if (!list) return;
    var curView = getCurrentView();
    var visible = _annotations.filter(function(r){ return !r.view || r.view === curView || r.view === 'unknown' || r.view === 'default'; });
    count.textContent = visible.length;
    if (!visible.length) {
      list.innerHTML = '<div style="padding:20px;text-align:center;color:#98a2b3;font-size:12px;">点击页面任意位置<br>添加标注</div>';
      renderPins();
      return;
    }
    visible.sort(function (a, b) { return (a.num || 0) - (b.num || 0); });
    var h = '';
    for (var i = 0; i < visible.length; i++) {
      var r = visible[i];
      var preview = (r.text || '(空)').substring(0, 40);
      var dn = r.done ? ' done' : '';
      h += '<div class="pa-s-item" onclick="window.__pa.' + (editMode ? 'openEditById' : 'openViewById') + '(\'' + r.id + '\')"><div class="pa-si-hdr"><span class="pa-si-n' + dn + '">' + (r.num || (i + 1)) + '</span><span class="pa-si-l">#' + (r.num || (i + 1)) + '</span></div><div class="pa-si-t">' + preview + '</div></div>';
    }
    list.innerHTML = h;
    renderPins();
  }

  function findReq(id) { for (var i = 0; i < _annotations.length; i++) { if (_annotations[i].id === id) return _annotations[i]; } return null; }
  window.__pa = {
    openEdit: function (idx) { if (_annotations[idx]) openEdit(_annotations[idx]); },
    openView: function (idx) { if (_annotations[idx]) openView(_annotations[idx]); },
    openEditById: function (id) { var r = findReq(id); if (r) openEdit(r); },
    openViewById: function (id) { var r = findReq(id); if (r) openView(r); }
  };

  // ============================================================
  // Modals
  // ============================================================
  function openEdit(req) {
    if (!req) return;
    editingId = req.id;
    label.textContent = '#' + (req.num || '?');
    input.value = req.text || '';
    saveHint.textContent = '';
    editModal.classList.add('open');
    input.focus();
  }
  function closeEdit() { editModal.classList.remove('open'); editingId = null; }
  function saveReq() {
    if (!editingId) return;
    for (var i = 0; i < _annotations.length; i++) {
      if (_annotations[i].id === editingId) {
        _annotations[i].text = input.value;
        _annotations[i].updatedAt = new Date().toLocaleString('zh-CN');
        _annotations[i].done = !!(_annotations[i].text && _annotations[i].text.trim());
        break;
      }
    }
    syncPaData();
    renderSidebar();
    closeEdit();
  }
  function deleteReq() {
    if (!editingId || !confirm('删除此标注？')) return;
    _annotations = _annotations.filter(function (r) { return r.id !== editingId; });
    syncPaData();
    renderSidebar();
    closeEdit();
  }
  function openView(req) {
    if (!req) return;
    viewLabel.textContent = '#' + (req.num || '?');
    viewContent.textContent = (req.text && req.text.trim()) ? req.text : '(暂无内容)';
    viewMeta.textContent = (req.createdAt || '') + (req.updatedAt ? ' · ' + req.updatedAt : '');
    viewModal.classList.add('open');
  }
  function closeView() { viewModal.classList.remove('open'); }

  // ============================================================
  // Mode control
  // ============================================================
  function enableEdit() {
    if (editMode) return;
    editMode = true;
    document.body.classList.add('pa-edit');
    toggle.style.display = 'flex';
    toggle.textContent = '✕ 关闭添加';
    indicator.classList.add('show');
    sidebar.classList.add('open');
    renderSidebar();
  }
  function disableEdit() {
    editMode = false;
    document.body.classList.remove('pa-edit');
    toggle.style.display = 'none';
    toggle.textContent = '📝 添加';
    indicator.classList.remove('show');
    sidebar.classList.remove('open');
  }

  // ============================================================
  // Backdoors
  // ============================================================
  document.addEventListener('keydown', function (e) {
    // Shift+句号在多数布局上产出 '>'，故用 e.code 判断，避免依赖字符
    if ((e.code === 'Period' || e.key === '.' || e.key === '>') && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      if (editMode) disableEdit(); else enableEdit();
    }
  });
  document.addEventListener('dblclick', function (e) {
    if (editMode) return;
    var t = e.target;
    if (!t) return;
    var tag = t.tagName || '';
    var fs = window.getComputedStyle(t).fontSize;
    var size = parseInt(fs) || 0;
    if (/^H[1-3]$/i.test(tag) || tag === 'STRONG' || tag === 'TH' || size >= 20) {
      enableEdit();
      return;
    }
    var rect = t.getBoundingClientRect();
    var vh = window.innerHeight;
    if (rect.bottom > vh - 80 && rect.top < vh) enableEdit();
  });
  if (_pa_url_annotate || (function(){try{return sessionStorage.getItem('__pa_auto')}catch(e){return null}})()) {
    try { sessionStorage.removeItem('__pa_auto'); } catch(e) {}
    setTimeout(enableEdit, 500);
  }
  window.__pa_enable = enableEdit;
  window.__pa_disable = disableEdit;

  // ============================================================
  // Click to add pin
  // ============================================================
  document.addEventListener('click', function (e) {
    if (!editMode || !document.body.classList.contains('pa-edit')) return;
    if (e.target.closest('.pa-pin') || e.target.closest('.pa-modal') ||
        e.target.closest('.pa-sidebar') || e.target.closest('.pa-toggle') ||
        e.target.closest('.pa-indicator') || e.target.closest('#paExportBtn') ||
        e.target.closest('#paClearBtn') || e.target.closest('#paImportBtn')) return;

    var sec = e.target.closest(SECTION_SEL);
    var sectionIdx = -1;
    var offsetX = 0, offsetY = 0;

    // 判断当前是哪个视图
    var _view = getCurrentView();

    if (sec) {
      var sections = document.querySelectorAll(SECTION_SEL);
      for (var i = 0; i < sections.length; i++) { if (sections[i] === sec) { sectionIdx = i; break; } }
      var rect = sec.getBoundingClientRect();
      offsetX = Math.round(e.clientX - rect.left);
      offsetY = Math.round(e.clientY - rect.top);
    } else {
      var ct = document.querySelector(SCROLL_SEL) || document.body;
      var cr = ct.getBoundingClientRect();
      offsetX = Math.round(e.clientX - cr.left);
      offsetY = Math.round(e.clientY - cr.top);
    }

    // 如果当前在某个配置的视图中，sectionIdx 只算该视图容器内的 section
    if (_view !== 'default' && sec) {
      var _container = getCurrentViewContainer();
      if (_container) {
        var _secs = _container.querySelectorAll(SECTION_SEL);
        var _newIdx = -1;
        for (var _si = 0; _si < _secs.length; _si++) { if (_secs[_si] === sec) { _newIdx = _si; break; } }
        if (_newIdx >= 0) sectionIdx = _newIdx;
      }
    }

    var mn = 0;
    _annotations.forEach(function (r) { if ((r.num || 0) > mn) mn = r.num; });
    var r = {
      id: 'p' + Date.now(),
      num: mn + 1,
      view: _view,
      sectionIdx: sectionIdx,
      offsetX: offsetX,
      offsetY: offsetY,
      text: '',
      createdAt: new Date().toLocaleString('zh-CN'),
      updatedAt: '',
      done: false
    };
    _annotations.push(r);
    syncPaData();
    renderSidebar();
    openEdit(r);
  });

  // ============================================================
  // Button bindings
  // ============================================================
  toggle.onclick = function () {
    var on = document.body.classList.toggle('pa-edit');
    toggle.textContent = on ? '✕ 关闭添加' : '📝 添加';
  };
  $('paExitBtn').onclick = disableEdit;
  $('paEditClose').onclick = closeEdit;
  $('paCancelBtn').onclick = closeEdit;
  $('paSaveBtn').onclick = saveReq;
  $('paDelBtn').onclick = deleteReq;
  $('paViewClose').onclick = closeView;
  $('paViewCloseBtn').onclick = closeView;
  $('paSideToggle').onclick = function () { sidebar.classList.toggle('open'); };
  $('paClearBtn').onclick = function () {
    if (!confirm('确认清除所有标注？')) return;
    _annotations = [];
    syncPaData();
    renderSidebar();
  };
  var _importBtn = $('paImportBtn');
  if (_importBtn) _importBtn.onclick = importFromFile;
  var _exportBtn = $('paExportBtn');
  if (_exportBtn) _exportBtn.onclick = exportToFile;

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeEdit(); closeView(); }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && editModal.classList.contains('open')) {
      e.preventDefault(); saveReq();
    }
  });

  var rt = null;
  window.addEventListener('resize', function () {
    if (rt) clearTimeout(rt);
    rt = setTimeout(function () { renderPins(); }, 200);
  });

  // 监听所有已配置视图的可见性变化
  var _viewObserver = new MutationObserver(function(){
    renderSidebar();
  });
  VIEW_ENTRIES.forEach(function(ve) {
    var _el = document.querySelector(ve.selector);
    if (_el) _viewObserver.observe(_el, { attributes: true, attributeFilter: ['class'] });
  });

  // ============================================================
  // Init
  // ============================================================
  loadAnnotations();

  // 打印配置信息
  var _viewNames = VIEW_ENTRIES.map(function(ve){ return ve.name; }).join(', ');
  console.log('%c📌 Prototype Annotator v4.0 loaded', 'font-weight:bold;color:#1a73e8');
  console.log('   视图: ' + _viewNames + ' | 检测: ' + VIEW_DETECT);
  console.log('   快捷键 Ctrl+Shift+. → 编辑模式');
  console.log('   添加标注后点击侧栏「保存 annotations.js」→ 下载文件覆盖到项目目录');

  } catch(e) { console.warn('📌 PA init error:', e.message); }

})();
