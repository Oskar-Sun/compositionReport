/**
 * ============================================================
 * Prototype Annotator — 原型需求标注工具 v3.0
 * ============================================================
 *
 * 基于文件的工作流：
 *   1. 页面加载时自动读取同目录下的 annotations.json
 *   2. 标注保存在内存中，编辑后点击"保存到文件"下载 JSON
 *   3. 下载的 JSON 覆盖仓库中的 annotations.json 一起提交 Git
 *   4. 其他人拉取代码后打开页面自动看到所有标注
 *
 * 用法：
 *   <script src="prototype-annotator.js"></script>
 *   （可选在同目录放 annotations.json 文件）
 *
 * 进入编辑模式：
 *   快捷键 Ctrl+Shift+.  或  网址加 ?annotate
 *   控制台 __pa_enable()
 *
 * ============================================================
 */
(function () {
  'use strict';
  window.__pa_enable = window.__pa_enable || function(){ console.warn('PA: 脚本加载中'); };
  window.__pa_disable = window.__pa_disable || function(){ console.warn('PA: 脚本加载中'); };

  try {

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
      '<span class="pa-s-del" id="paExportBtn" style="display:inline-block;width:auto;padding:4px 10px;color:#1a73e8;">💾 保存到文件</span>',
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
  // 加载 annotations.json
  // ============================================================
  function loadAnnotations() {
    // 优先使用硬编码数据
    if (window.__pa_data && Array.isArray(window.__pa_data)) {
      _annotations = window.__pa_data;
      _jsonLoaded = true;
      migrateAnnotations();
      return;
    }

    // 尝试从 annotations.json 加载
    try {
      var basePath = '';
      var scripts = document.getElementsByTagName('script');
      for (var si = 0; si < scripts.length; si++) {
        var s = scripts[si];
        if (s.src && s.src.indexOf('prototype-annotator') >= 0) {
          basePath = s.src.replace(/\/[^/]*$/, '/');
          break;
        }
      }
      var jsonPath = basePath + 'annotations.json';

      // file:// 协议用 fetch（XHR 在 file:// 下因 CORS 不可用）
      fetch(jsonPath).then(function(resp){
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.text();
      }).then(function(text){
        try {
          _annotations = JSON.parse(text);
        } catch(e) {}
        _jsonLoaded = true;
        migrateAnnotations();
        renderSidebar();
      }).catch(function(){
        _jsonLoaded = true;
        // 降级：从 localStorage 恢复
        try { var old = JSON.parse(localStorage.getItem('pa_annotations') || '{}'); var arr = old[window.location.pathname] || []; if (arr.length) { _annotations = arr; migrateAnnotations(); } } catch(e) {}
        renderSidebar();
      });
    } catch(e) {
      // 无法确定路径，直接完成初始化
      _jsonLoaded = true;
      renderSidebar();
    }
  }

  // ============================================================
  // 保存到文件
  // ============================================================
  function exportToFile() {
    var json = JSON.stringify(_annotations, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var now = new Date();
    var ts = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
    a.href = url;
    a.download = 'annotations.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ============================================================
  // Data 操作（全部基于内存 _annotations）
  // ============================================================
  function getReqs() { return _annotations; }
  function saveReqs(arr) { _annotations = arr; }
  // 备份到 localStorage（file:// 下 fetch 可能失败，localStorage 兜底）
  function backupToLocal() {
    try {
      var obj = {};
      obj[window.location.pathname] = _annotations;
      localStorage.setItem('pa_annotations', JSON.stringify(obj));
    } catch(e) {}
  }
  // 迁移旧数据：为没有 view 字段的标注自动分类
  function migrateAnnotations() {
    var changed = false;
    _annotations.forEach(function(r){
      if (r.view) return;
      changed = true;
      if (r.sectionIdx >= 4) r.view = 'individual';
      else if (r.sectionIdx >= 0 && r.sectionIdx <= 3) r.view = 'class';
      else r.view = 'unknown';
      // 对于 sectionIdx = -1 且没有 offset 只有 fixed 的旧数据，把 fixed 转成 offset
      if (r.sectionIdx === -1 && !r.offsetX && !r.offsetY && (r.fixedTop || r.fixedLeft)) {
        r.offsetX = r.fixedLeft || 0;
        r.offsetY = r.fixedTop || 0;
      }
    });
    if (changed) renderSidebar();
  }

  // ============================================================
  // Pins
  // ============================================================
  function getCurrentView() {
    var _cv = document.getElementById('classView');
    var _iv = document.getElementById('individualView');
    if (_cv && !_cv.classList.contains('page-hidden')) return 'class';
    if (_iv && !_iv.classList.contains('page-hidden')) return 'individual';
    return 'unknown';
  }
  function getCurrentViewContainer() {
    var v = getCurrentView();
    return document.getElementById(v === 'individual' ? 'individualView' : 'classView');
  }
  function renderPins() {
    document.querySelectorAll('.pa-pin').forEach(function (el) { el.remove(); });
    var curView = getCurrentView();
    // 只显示当前视图的标注
    var filtered = _annotations.filter(function(r){ return !r.view || r.view === curView || r.view === 'unknown'; });
    var scrollContainer = document.querySelector('.container, .pa-container, main, #app, .app') || document.body;
    if (scrollContainer && getComputedStyle(scrollContainer).position === 'static') scrollContainer.style.position = 'relative';
    filtered.forEach(function (r) {
      var p = document.createElement('div');
      p.className = 'pa-pin' + (r.done ? ' done' : '');
      p.textContent = r.num || '?';
      p.title = r.text ? r.text.substring(0, 40) : '';

      var parent = null;
      if (r.sectionIdx >= 0) {
        // 根据 view 字段选择正确的容器查找 section
        var _viewContainer = (r.view === 'individual') ? document.getElementById('individualView') : document.getElementById('classView');
        var _allSections = (_viewContainer ? _viewContainer : document).querySelectorAll('.pa-section, section, .report-section, .card, .block, .module');
        parent = _allSections[r.sectionIdx];
      }
      if (!parent) parent = scrollContainer;

      // sectionIdx=-1 且有 fixedTop/fixedLeft → 旧版视口坐标，用 position: fixed
      if (r.sectionIdx === -1 && (r.fixedTop !== undefined || r.fixedLeft !== undefined)) {
        p.style.position = 'fixed';
        p.style.top = (r.fixedTop || 0) + 'px';
        p.style.left = (r.fixedLeft || 0) + 'px';
      } else {
        if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
        p.style.position = 'absolute';
        p.style.top = top + 'px';
        p.style.left = left + 'px';
      }

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
    var visible = _annotations.filter(function(r){ return !r.view || r.view === curView || r.view === 'unknown'; });
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
    backupToLocal();
    renderSidebar();
    closeEdit();
  }
  function deleteReq() {
    if (!editingId || !confirm('删除此标注？')) return;
    _annotations = _annotations.filter(function (r) { return r.id !== editingId; });
    backupToLocal();
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
    if (e.key === '.' && e.ctrlKey && e.shiftKey) {
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
        e.target.closest('#paClearBtn')) return;

    var sec = e.target.closest('.pa-section, section, .report-section, .card, .block, .module');
    var sectionIdx = -1;
    var offsetX = 0, offsetY = 0;

    if (sec) {
      var sections = document.querySelectorAll('.pa-section, section, .report-section, .card, .block, .module');
      for (var i = 0; i < sections.length; i++) { if (sections[i] === sec) { sectionIdx = i; break; } }
      var rect = sec.getBoundingClientRect();
      offsetX = Math.round(e.clientX - rect.left);
      offsetY = Math.round(e.clientY - rect.top);
    } else {
      var ct = document.querySelector('.container, .pa-container, main, #app, .app') || document.body;
      var cr = ct.getBoundingClientRect();
      offsetX = Math.round(e.clientX - cr.left);
      offsetY = Math.round(e.clientY - cr.top);
    }
    // 判断当前是哪个视图
    var _cv = document.getElementById('classView');
    var _iv = document.getElementById('individualView');
    var _view = 'unknown';
    if (_cv && _iv) {
      if (!_cv.classList.contains('page-hidden')) _view = 'class';
      else if (!_iv.classList.contains('page-hidden')) _view = 'individual';
    }
    // 如果是 individual 视图，sectionIdx 只算 individualView 内的 .report-section
    if (_view === 'individual' && sec) {
      var _container = document.getElementById('individualView');
      if (_container) {
        var _secs = _container.querySelectorAll('.report-section');
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
    backupToLocal();
    renderSidebar();
    openEdit(r);
  });

  // ============================================================
  // Button bindings
  // ============================================================
  toggle.onclick = function () {
    // 只切换添加模式（十字光标），不退出编辑模式
    // 这样可以在编辑模式下自由操作侧栏按钮
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
    backupToLocal();
    renderSidebar();
  };
  $('paExportBtn').onclick = exportToFile;

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

  // ============================================================
  // Init
  // ============================================================
  loadAnnotations();

  console.log('%c📌 Prototype Annotator v3.0 loaded', 'font-weight:bold;color:#1a73e8');
  console.log('   快捷键 Ctrl+Shift+. → 编辑模式');
  console.log('   添加标注后点击侧栏「保存到文件」→ 下载 annotations.json');
  console.log('   将下载的 JSON 放到 HTML 同目录，提交 Git');

  _pa_ready = true;

  } catch(e) { console.warn('📌 PA init error:', e.message); }

})();
