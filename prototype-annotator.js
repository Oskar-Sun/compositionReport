/**
 * ============================================================
 * Prototype Annotator — 原型需求标注工具
 * ============================================================
 *
 * 在任何 HTML 原型页面中加入此脚本即可使用需求标注功能。
 *
 * 用法：
 *   <script src="prototype-annotator.js"></script>
 *
 * 后门进入编辑模式（三选一）：
 *   1. 快速点击页面标题文字 5 次（1.5 秒内）
 *   2. 按 Ctrl+Shift+. （句号键）
 *   3. 双击页面底部文字
 *
 * 功能：
 *   - 点击任意位置添加标注（自动编号）
 *   - 标注跟随页面滚动
 *   - 所有人可查看标注内容
 *   - 标注数据保存在浏览器本地
 *
 * ============================================================
 */

(function () {
  'use strict';

  // ============================================================
  // 1. 注入 CSS
  // ============================================================
  var css = `
/* ---- Prototype Annotator ---- */
.pa-toggle{position:fixed;bottom:24px;left:24px;z-index:9999;padding:10px 20px;border-radius:40px;background:#1a73e8;color:#fff;border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 4px 16px rgba(26,115,232,.4);display:none;align-items:center;gap:6px;transition:transform .15s}
.pa-toggle:hover{transform:translateY(-2px)}
.pa-toggle .blink{width:8px;height:8px;border-radius:50%;background:#fff;display:inline-block;animation:pa-blink 1.2s infinite}
@keyframes pa-blink{0%,100%{opacity:1}50%{opacity:.3}}
body.pa-edit *{cursor:crosshair!important}
.pa-pin{position:absolute;z-index:999;width:26px;height:26px;border-radius:50%;background:#c5221f;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(197,34,31,.6);border:2px solid #fff;user-select:none;pointer-events:auto;transition:transform .1s}
.pa-pin:hover{transform:scale(1.2);z-index:1000}
.pa-pin.done{background:#1e7e34;box-shadow:0 2px 8px rgba(30,126,52,.5)}
.pa-indicator{position:fixed;top:0;left:0;right:0;z-index:99999;background:#c5221f;color:#fff;text-align:center;font-size:12px;padding:4px 0;font-weight:500;display:none;letter-spacing:.5px}
.pa-indicator.show{display:block}
.pa-modal{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:20000;align-items:center;justify-content:center}
.pa-modal.open{display:flex}
.pa-modal-box{background:#fff;border-radius:10px;display:flex;flex-direction:column;box-shadow:0 16px 48px rgba(0,0,0,.25);animation:pa-slideUp .15s ease}
@keyframes pa-slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.pa-sidebar{position:fixed;right:16px;top:80px;z-index:9998;width:260px;max-height:calc(100vh - 120px);overflow-y:auto;background:#fff;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.12);padding:14px;display:none;font-size:13px;font-family:inherit}
.pa-sidebar.open{display:block}
.pa-sidebar .pa-s-title{font-weight:600;font-size:13px;color:#1a1a2e;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.pa-sidebar .pa-s-item{padding:8px 10px;border-radius:6px;margin-bottom:4px;cursor:pointer;transition:background .15s;border:1px solid #eef0f4}
.pa-sidebar .pa-s-item:hover{background:#fafbfc}
.pa-sidebar .pa-s-item .pa-si-hdr{display:flex;align-items:center;gap:6px;margin-bottom:2px}
.pa-sidebar .pa-s-item .pa-si-n{width:18px;height:18px;border-radius:50%;background:#c5221f;color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.pa-sidebar .pa-s-item .pa-si-n.done{background:#1e7e34}
.pa-sidebar .pa-s-item .pa-si-l{font-size:11px;color:#98a2b3;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pa-sidebar .pa-s-item .pa-si-t{font-size:12px;color:#344054;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-all}
.pa-sidebar .pa-s-del{width:100%;text-align:center;padding:6px;border:none;background:transparent;color:#98a2b3;font-size:11px;cursor:pointer;font-family:inherit;border-radius:4px;margin-top:4px}
.pa-sidebar .pa-s-del:hover{color:#c5221f;background:#fce8e6}
@keyframes pa-slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@media print{.pa-toggle,.pa-sidebar,.pa-indicator{display:none!important}}
`;

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ============================================================
  // 2. 注入 HTML
  // ============================================================
  var html = `
<button class="pa-toggle" id="paToggle">&#x1F4DD; <span class="blink"></span> 添加标注</button>
<div class="pa-indicator" id="paIndicator">&#x270F;&#xFE0F; 编辑模式 · 任意位置点加标注 · <span style="cursor:pointer;text-decoration:underline" id="paExitBtn">退出</span></div>
<div class="pa-modal" id="paEditModal">
  <div class="pa-modal-box" style="width:400px;padding:16px;gap:8px;">
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="font-size:13px;font-weight:600;color:#1a1a2e;">标注 <span id="paLabel"></span></span>
      <span id="paSaveHint" style="font-size:11px;color:#98a2b3;flex:1;"></span>
      <button id="paEditClose" style="border:none;background:transparent;font-size:16px;cursor:pointer;color:#98a2b3;padding:0;line-height:1;">&#10005;</button>
    </div>
    <textarea id="paInput" placeholder="输入需求说明..." style="width:100%;min-height:100px;border:1px solid #d0d5dd;border-radius:6px;padding:10px;font-size:13px;font-family:inherit;color:#344054;resize:vertical;line-height:1.6;box-sizing:border-box;"></textarea>
    <div style="display:flex;gap:6px;justify-content:flex-end;">
      <button id="paDelBtn" style="color:#c5221f;border-color:#c5221f;padding:4px 12px;border-radius:6px;border:1px solid;background:#fff;font-size:12px;cursor:pointer;font-family:inherit;">&#128465; 删除</button>
      <button id="paCancelBtn" style="padding:4px 12px;border-radius:6px;border:1px solid #d0d5dd;background:#fff;font-size:12px;cursor:pointer;font-family:inherit;">取消</button>
      <button id="paSaveBtn" style="padding:4px 14px;border-radius:6px;border:none;background:#1a73e8;color:#fff;font-size:12px;cursor:pointer;font-family:inherit;">&#128190; 保存</button>
    </div>
  </div>
</div>
<div class="pa-modal" id="paViewModal">
  <div class="pa-modal-box" style="width:400px;padding:16px;gap:8px;">
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="font-size:13px;font-weight:600;color:#1a1a2e;">标注 <span id="paViewLabel"></span></span>
      <span id="paViewMeta" style="font-size:11px;color:#98a2b3;flex:1;"></span>
      <button id="paViewClose" style="border:none;background:transparent;font-size:16px;cursor:pointer;color:#98a2b3;padding:0;line-height:1;">&#10005;</button>
    </div>
    <div style="min-height:60px;background:#f8f9fa;border-radius:6px;padding:12px;line-height:1.6;font-size:14px;color:#344054;white-space:pre-wrap;border-left:3px solid #1a73e8;" id="paViewContent">暂无内容</div>
    <div style="display:flex;justify-content:flex-end;"><button id="paViewCloseBtn" style="padding:4px 14px;border-radius:6px;border:1px solid #d0d5dd;background:#fff;font-size:12px;cursor:pointer;font-family:inherit;">关闭</button></div>
  </div>
</div>
<div class="pa-sidebar" id="paSidebar">
  <div class="pa-s-title">&#128196; 标注清单（<span id="paCount">0</span>）<span style="margin-left:auto;font-weight:400;font-size:11px;color:#98a2b3;cursor:pointer" id="paSideToggle">收起 &#10005;</span></div>
  <div id="paList"></div>
  <button class="pa-s-del" id="paClearBtn">&#128465; 清除所有标注</button>
</div>
`;

  var div = document.createElement('div');
  div.innerHTML = html;
  div.id = 'paRoot';
  document.body.appendChild(div);

  // ============================================================
  // 3. JS 逻辑
  // ============================================================
  var editMode = false;
  var editingId = null;
  var clickCount = 0;
  var clickTimer = null;
  var STORAGE_KEY = 'pa_annotations';

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
  // Data
  // ============================================================
  function getReqs() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveReqs(arr) { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

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
      p.style.position = 'absolute';

      var parent = null;
      if (r.sectionIdx >= 0) {
        var sections = document.querySelectorAll('.report-section, .pa-section');
        parent = sections[r.sectionIdx];
      }
      if (!parent) { parent = document.querySelector('.container, .pa-container, body') || document.body; }

      // 兼容旧数据（视口坐标）
      var top = r.offsetY || 0;
      var left = r.offsetX || 0;
      if (!top && !left && (r.y || r.x)) { top = r.y || 0; left = r.x || 0; }

      // 如果父元素是 body/container，用视口坐标；否则用相对坐标
      if (parent === document.body || parent === document.querySelector('.container') || parent.classList.contains('pa-container')) {
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
      h += '<div class="pa-s-item" onclick="window.__pa.' + fn + '(\'' + r.id + '\')"><div class="pa-si-hdr"><span class="pa-si-n' + dn + '">' + (r.num || (i + 1)) + '</span><span class="pa-si-l">#' + (r.num || (i + 1)) + '</span></div><div class="pa-si-t">' + preview + '</div></div>';
    }
    list.innerHTML = h;
    renderPins();
  }

  // ============================================================
  // Modals
  // ============================================================
  function openEdit(req) {
    if (!req || typeof req === 'string') { req = findReq(req); if (!req) return; }
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
    var a = getReqs();
    for (var i = 0; i < a.length; i++) {
      if (a[i].id === editingId) {
        a[i].text = input.value;
        a[i].updatedAt = new Date().toLocaleString('zh-CN');
        a[i].done = !!(a[i].text && a[i].text.trim());
        break;
      }
    }
    saveReqs(a);
    renderSidebar();
    closeEdit();
  }

  function deleteReq() {
    if (!editingId || !confirm('删除此标注？')) return;
    saveReqs(getReqs().filter(function (r) { return r.id !== editingId; }));
    renderSidebar();
    closeEdit();
  }

  function findReq(id) { var a = getReqs(); for (var i = 0; i < a.length; i++) { if (a[i].id === id) return a[i]; } return null; }

  function openView(req) {
    if (!req || typeof req === 'string') { req = findReq(req); if (!req) return; }
    viewLabel.textContent = '#' + (req.num || '?');
    viewContent.textContent = (req.text && req.text.trim()) ? req.text : '(暂无内容)';
    viewMeta.textContent = (req.createdAt || '') + (req.updatedAt ? ' · ' + req.updatedAt : '');
    viewModal.classList.add('open');
  }

  function closeView() { viewModal.classList.remove('open'); }

  // Expose to window for sidebar onclick
  window.__pa = { openEdit: openEdit, openView: openView };

  // ============================================================
  // Mode control
  // ============================================================
  function enableEdit() {
    if (editMode) return;
    editMode = true;
    toggle.style.display = 'flex';
    indicator.classList.add('show');
    sidebar.classList.add('open');
    renderSidebar();
  }

  function disableEdit() {
    editMode = false;
    toggle.style.display = 'none';
    indicator.classList.remove('show');
    sidebar.classList.remove('open');
    document.body.classList.remove('pa-edit');
    toggle.textContent = '📝 添加标注';
  }

  // ============================================================
  // Backdoors
  // ============================================================
  // 1) 标题点5次
  document.addEventListener('click', function (e) {
    if (editMode) return;
    var t = e.target;
    if (t && (t.classList.contains('pa-title') || t.closest('.pa-title') || t.tagName === 'TITLE' ||
        (t.textContent && t.textContent.indexOf('✏️') >= 0) ||
        (t.textContent && t.textContent.indexOf('作文批改报告') >= 0))) {
      clickCount++;
      if (clickCount === 1) clickTimer = setTimeout(function () { clickCount = 0; }, 1500);
      if (clickCount >= 5) { clickCount = 0; clearTimeout(clickTimer); enableEdit(); }
    }
  });

  // 2) Ctrl+Shift+.
  document.addEventListener('keydown', function (e) {
    if (e.key === '.' && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      if (editMode) disableEdit(); else enableEdit();
    }
  });

  // 3) 双击底部
  document.addEventListener('dblclick', function (e) {
    if (editMode) return;
    var t = e.target;
    if (t && t.textContent && t.textContent.indexOf('交互原型') >= 0) { enableEdit(); }
  });

  // ============================================================
  // Click to add pin (edit mode)
  // ============================================================
  document.addEventListener('click', function (e) {
    if (!editMode) return;
    if (e.target.closest('.pa-pin') || e.target.closest('.pa-modal') || e.target.closest('.pa-sidebar') ||
        e.target.closest('.pa-toggle') || e.target.closest('.pa-indicator')) return;

    var sec = e.target.closest('.report-section, .pa-section');
    var sectionIdx = -1;
    var offsetX = 0, offsetY = 0;
    var fixedTop = 0, fixedLeft = 0;

    if (sec) {
      var sections = document.querySelectorAll('.report-section, .pa-section');
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
    if (!confirm('确认清除所有标注？')) return;
    localStorage.removeItem(STORAGE_KEY);
    renderSidebar();
  };

  // Escape closes modals
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeEdit(); closeView(); }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && editModal.classList.contains('open')) {
      e.preventDefault();
      saveReq();
    }
  });

  // ============================================================
  // Init
  // ============================================================
  renderSidebar();

  // Re-render on resize (for fixed-position pins)
  var rt = null;
  window.addEventListener('resize', function () {
    if (rt) clearTimeout(rt);
    rt = setTimeout(function () { renderPins(); }, 200);
  });

  console.log('✅ Prototype Annotator loaded');
  console.log('   双击底部文字 / 标题点5次 / Ctrl+Shift+. 开启编辑模式');

})();
