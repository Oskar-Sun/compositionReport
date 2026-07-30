/**
 * ============================================================
 * Prototype Annotator — 原型需求标注工具 v2.0
 * ============================================================
 *
 * 在任何 HTML 原型页面中加入此脚本即可使用需求标注功能。
 *
 * 用法：
 *   <script src="prototype-annotator.js"></script>
 *
 * 进入编辑模式（五种方式）：
 *   1. 快捷键     Ctrl + Shift + . （句号键）
 *   2. URL参数    在网址后加 ?annotate 刷新页面
 *   3. 控制台    在 F12 控制台输入 __pa() 回车
 *   4. 任意标题   双击页面中任意标题/大号文字
 *   5. 底部双击   双击页面最底部的文字区域
 *
 * 功能：
 *   - 点击任意位置添加标注（自动编号）
 *   - 标注跟随页面滚动
 *   - 所有人可点击数字查看标注内容
 *   - 标注数据保存在浏览器本地
 *   - 同一域名下所有页面共享标注（方便多页原型）
 *
 * ============================================================
 */
(function () {
  'use strict';

  // ===== 0. 预检测：URL 参数后门 =====
  if (window.location.search.indexOf('annotate') >= 0) {
    sessionStorage.setItem('__pa_auto', '1');
  }

  // ============================================================
  // 1. 注入 CSS
  // ============================================================
  var css = '.pa-toggle{position:fixed;bottom:24px;left:24px;z-index:9999;padding:10px 20px;border-radius:40px;background:#1a73e8;color:#fff;border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 4px 16px rgba(26,115,232,.4);display:none;align-items:center;gap:6px;transition:transform .15s}.pa-toggle:hover{transform:translateY(-2px)}.pa-toggle .blink{width:8px;height:8px;border-radius:50%;background:#fff;display:inline-block;animation:pa-blink 1.2s infinite}@keyframes pa-blink{0%,100%{opacity:1}50%{opacity:.3}}body.pa-edit *{cursor:crosshair!important}.pa-pin{position:absolute;z-index:999;width:26px;height:26px;border-radius:50%;background:#c5221f;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(197,34,31,.6);border:2px solid #fff;user-select:none;pointer-events:auto;transition:transform .1s}.pa-pin:hover{transform:scale(1.2);z-index:1000}.pa-pin.done{background:#1e7e34;box-shadow:0 2px 8px rgba(30,126,52,.5)}.pa-indicator{position:fixed;top:0;left:0;right:0;z-index:99999;background:#c5221f;color:#fff;text-align:center;font-size:12px;padding:4px 0;font-weight:500;display:none;letter-spacing:.5px;font-family:sans-serif}.pa-indicator.show{display:block}.pa-indicator a{color:#fff;text-decoration:underline;cursor:pointer;margin-left:8px}.pa-modal{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:20000;align-items:center;justify-content:center}.pa-modal.open{display:flex}.pa-modal-box{background:#fff;border-radius:10px;display:flex;flex-direction:column;box-shadow:0 16px 48px rgba(0,0,0,.25);animation:pa-slideUp .15s ease}.pa-modal-box textarea{width:100%;box-sizing:border-box}@keyframes pa-slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.pa-sidebar{position:fixed;right:16px;top:80px;z-index:9998;width:260px;max-height:calc(100vh - 120px);overflow-y:auto;background:#fff;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.12);padding:14px;display:none;font-size:13px;font-family:sans-serif}.pa-sidebar.open{display:block}.pa-sidebar .pa-s-title{font-weight:600;font-size:13px;color:#1a1a2e;margin-bottom:10px;display:flex;align-items:center;gap:6px}.pa-sidebar .pa-s-item{padding:8px 10px;border-radius:6px;margin-bottom:4px;cursor:pointer;transition:background .15s;border:1px solid #eef0f4;font-family:sans-serif}.pa-sidebar .pa-s-item:hover{background:#fafbfc}.pa-sidebar .pa-s-item .pa-si-hdr{display:flex;align-items:center;gap:6px;margin-bottom:2px}.pa-sidebar .pa-s-item .pa-si-n{width:18px;height:18px;border-radius:50%;background:#c5221f;color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}.pa-sidebar .pa-s-item .pa-si-n.done{background:#1e7e34}.pa-sidebar .pa-s-item .pa-si-l{font-size:11px;color:#98a2b3;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pa-sidebar .pa-s-item .pa-si-t{font-size:12px;color:#344054;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-all}.pa-sidebar .pa-s-del{width:100%;text-align:center;padding:6px;border:none;background:transparent;color:#98a2b3;font-size:11px;cursor:pointer;font-family:inherit;border-radius:4px;margin-top:4px}.pa-sidebar .pa-s-del:hover{color:#c5221f;background:#fce8e6}@media print{.pa-toggle,.pa-sidebar,.pa-indicator{display:none!important}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ============================================================
  // 2. 注入 HTML
  // ============================================================
  var html = [
    '<button class="pa-toggle" id="paToggle">📝 <span class="blink"></span> 添加标注</button>',
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
      '<button class="pa-s-del" id="paClearBtn">🗑 清除所有标注</button>',
    '</div>'
  ].join('');

  var div = document.createElement('div');
  div.innerHTML = html;
  div.style.display = 'none'; // start hidden, will show after injection
  document.body.appendChild(div);
  div.style.display = '';

  // ============================================================
  // 3. JS 逻辑
  // ============================================================
  var editMode = false;
  var editingId = null;
  var STORAGE_KEY = 'pa_annotations';
  var pageUrl = window.location.pathname;

  // DOM refs
  var $ = function (id) { return document.getElementById(id); };
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
  // Data (per-page, so different pages don't conflict)
  // ============================================================
  function getReqs() {
    try {
      var all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return all[pageUrl] || [];
    } catch (e) { return []; }
  }
  function saveReqs(arr) {
    try {
      var all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      all[pageUrl] = arr;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  // ============================================================
  // Pins
  // ============================================================
  function renderPins() {
    document.querySelectorAll('.pa-pin').forEach(function (el) { el.remove(); });
    var reqs = getReqs();
    reqs.forEach(function (r) {
      var p = document.createElement('div');
      p.className = 'pa-pin' + (r.done ? ' done' : '');
      p.textContent = r.num || '?';
      p.title = r.text ? r.text.substring(0, 40) : '';

      var parent = null;
      if (r.sectionIdx >= 0) {
        var sections = document.querySelectorAll('.pa-section, section, .report-section, .card, .block, .module');
        parent = sections[r.sectionIdx];
      }
      if (!parent) {
        parent = document.querySelector('.container, .pa-container, main, #app, .app') || document.body;
      }

      var top = r.offsetY || 0;
      var left = r.offsetX || 0;
      if (!top && !left && (r.y || r.x)) { top = r.y || 0; left = r.x || 0; }

      var isPageLevel = (parent === document.body || parent === document.querySelector('.container'));
      if (isPageLevel || r.fixedTop || r.fixedLeft) {
        p.style.position = 'fixed';
        p.style.top = (r.fixedTop || top) + 'px';
        p.style.left = (r.fixedLeft || left) + 'px';
      } else {
        if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
        p.style.top = top + 'px';
        p.style.left = left + 'px';
      }

      p.onclick = function () {
        var a = getReqs();
        for (var i = 0; i < a.length; i++) {
          if (a[i].id === r.id) {
            if (editMode) openEdit(a[i]); else openView(a[i]);
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
    var reqs = getReqs();
    count.textContent = reqs.length;
    if (!reqs.length) {
      list.innerHTML = '<div style="padding:20px;text-align:center;color:#98a2b3;font-size:12px;">点击页面任意位置<br>添加标注</div>';
      renderPins();
      return;
    }
    reqs.sort(function (a, b) { return (a.num || 0) - (b.num || 0); });
    var h = '';
    for (var i = 0; i < reqs.length; i++) {
      var r = reqs[i];
      var preview = (r.text || '(空)').substring(0, 40);
      var dn = r.done ? ' done' : '';
      var fn = editMode ? 'openEdit' : 'openView';
      h += '<div class="pa-s-item" onclick="window.__pa.' + fn + '(' + i + ')"><div class="pa-si-hdr"><span class="pa-si-n' + dn + '">' + (r.num || (i + 1)) + '</span><span class="pa-si-l">#' + (r.num || (i + 1)) + '</span></div><div class="pa-si-t">' + preview + '</div></div>';
    }
    list.innerHTML = h;
    renderPins();
  }

  // Expose for sidebar onclick
  window.__pa = {
    openEdit: function (idx) { var a = getReqs(); if (a[idx]) openEdit(a[idx]); },
    openView: function (idx) { var a = getReqs(); if (a[idx]) openView(a[idx]); }
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

  function closeEdit() {
    editModal.classList.remove('open');
    editingId = null;
  }

  function saveReq() {
    if (!editingId) return;
    var a = getReqs();
    var found = false;
    for (var i = 0; i < a.length; i++) {
      if (a[i].id === editingId) {
        a[i].text = input.value;
        a[i].updatedAt = new Date().toLocaleString('zh-CN');
        a[i].done = !!(a[i].text && a[i].text.trim());
        found = true;
        break;
      }
    }
    if (found) { saveReqs(a); renderSidebar(); }
    closeEdit();
  }

  function deleteReq() {
    if (!editingId || !confirm('删除此标注？')) return;
    saveReqs(getReqs().filter(function (r) { return r.id !== editingId; }));
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
    indicator.classList.add('show');
    sidebar.classList.add('open');
    renderSidebar();
  }

  function disableEdit() {
    editMode = false;
    document.body.classList.remove('pa-edit');
    toggle.style.display = 'none';
    indicator.classList.remove('show');
    sidebar.classList.remove('open');
  }

  // ============================================================
  // Backdoors  —  5 种方式激活
  // ============================================================

  // 1) Ctrl + Shift + .  （最通用，任何页面都有效）
  document.addEventListener('keydown', function (e) {
    if (e.key === '.' && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (editMode) disableEdit(); else enableEdit();
    }
  });

  // 2) 双击页面中任意大号文字（h1/h2/h3/大字标题）
  var dbCount = 0, dbTimer = null;
  document.addEventListener('dblclick', function (e) {
    if (editMode) return;
    var t = e.target;
    if (!t || !t.textContent) return;
    var tag = t.tagName || '';
    var fs = window.getComputedStyle(t).fontSize;
    var size = parseInt(fs) || 0;
    // 双击 h1/h2/h3/strong 或字号 >= 20px 的文字
    if (/^H[1-3]$/i.test(tag) || tag === 'STRONG' || tag === 'TH' || size >= 20) {
      enableEdit();
      return;
    }
    // 双击页面底部区域（靠近 footer）
    var rect = t.getBoundingClientRect();
    var vh = window.innerHeight;
    if (rect.bottom > vh - 80 && rect.top < vh) {
      dbCount++;
      if (dbCount === 1) dbTimer = setTimeout(function () { dbCount = 0; }, 1000);
      if (dbCount >= 2) { dbCount = 0; clearTimeout(dbTimer); enableEdit(); }
    }
  });

  // 3) 控制台后门：任意时候执行 __pa() 开启
  window.__pa_enable = enableEdit;
  window.__pa_disable = disableEdit;

  // 4) URL 参数后门：在网址后加 ?annotate 刷新自动开启
  if (sessionStorage.getItem('__pa_auto')) {
    sessionStorage.removeItem('__pa_auto');
    setTimeout(enableEdit, 500);
  }

  // 5) 点击页面标题 5 次（兼容任何页面：找 h1 或 page title）
  var titleClickCount = 0, titleClickTimer = null;
  document.addEventListener('click', function (e) {
    if (editMode) return;
    var t = e.target;
    if (!t) return;
    var tag = t.tagName || '';
    // 点击的是 h1 或 title 标签，或 font-size >= 22px 的文字
    var fs = window.getComputedStyle(t).fontSize;
    var size = parseInt(fs) || 0;
    if (tag === 'H1' || tag === 'TITLE' || size >= 22 || (t.closest && t.closest('h1'))) {
      titleClickCount++;
      if (titleClickCount === 1) titleClickTimer = setTimeout(function () { titleClickCount = 0; }, 1500);
      if (titleClickCount >= 5) {
        titleClickCount = 0; clearTimeout(titleClickTimer);
        enableEdit();
      }
    }
  });

  // ============================================================
  // Click to add pin
  // ============================================================
  document.addEventListener('click', function (e) {
    if (!editMode) return;
    if (e.target.closest('.pa-pin') || e.target.closest('.pa-modal') ||
        e.target.closest('.pa-sidebar') || e.target.closest('.pa-toggle') ||
        e.target.closest('.pa-indicator')) return;

    var sec = e.target.closest('.pa-section, section, .report-section, .card, .block, .module');
    var sectionIdx = -1;
    var offsetX = 0, offsetY = 0;
    var fixedTop = 0, fixedLeft = 0;

    if (sec) {
      var sections = document.querySelectorAll('.pa-section, section, .report-section, .card, .block, .module');
      for (var i = 0; i < sections.length; i++) { if (sections[i] === sec) { sectionIdx = i; break; } }
      var rect = sec.getBoundingClientRect();
      offsetX = Math.round(e.clientX - rect.left);
      offsetY = Math.round(e.clientY - rect.top);
    } else {
      fixedTop = Math.round(e.clientY);
      fixedLeft = Math.round(e.clientX);
    }

    var reqs = getReqs();
    var mn = 0;
    reqs.forEach(function (r) { if ((r.num || 0) > mn) mn = r.num; });
    var r = {
      id: 'p' + Date.now(),
      num: mn + 1,
      sectionIdx: sectionIdx,
      offsetX: offsetX,
      offsetY: offsetY,
      fixedTop: fixedTop,
      fixedLeft: fixedLeft,
      text: '',
      createdAt: new Date().toLocaleString('zh-CN'),
      updatedAt: '',
      done: false
    };
    reqs.push(r);
    saveReqs(reqs);
    renderSidebar();
    openEdit(r);
  });

  // ============================================================
  // Button bindings
  // ============================================================
  toggle.onclick = function () { document.body.classList.toggle('pa-edit'); };
  $('paExitBtn').onclick = disableEdit;
  $('paEditClose').onclick = closeEdit;
  $('paCancelBtn').onclick = closeEdit;
  $('paSaveBtn').onclick = saveReq;
  $('paDelBtn').onclick = deleteReq;
  $('paViewClose').onclick = closeView;
  $('paViewCloseBtn').onclick = closeView;
  $('paSideToggle').onclick = function () { sidebar.classList.toggle('open'); };
  $('paClearBtn').onclick = function () {
    if (!confirm('确认清除当前页面的所有标注？')) return;
    localStorage.removeItem(STORAGE_KEY);
    renderSidebar();
  };

  // Keyboard: Escape to close, Ctrl+Enter to save
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeEdit(); closeView(); }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && editModal.classList.contains('open')) {
      e.preventDefault(); saveReq();
    }
  });

  // Window resize: refresh pins
  var rt = null;
  window.addEventListener('resize', function () {
    if (rt) clearTimeout(rt);
    rt = setTimeout(function () { renderPins(); }, 200);
  });

  // ============================================================
  // Init
  // ============================================================
  renderSidebar();

  console.log('%c📌 Prototype Annotator loaded', 'font-weight:bold;color:#1a73e8');
  console.log('   快捷键 Ctrl+Shift+. → 开启编辑模式');
  console.log('   控制台 __pa_enable() → 开启 / __pa_disable() → 关闭');
  console.log('   URL 加 ?annotate → 刷新后自动开启');

})();
