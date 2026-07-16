/* =========================================================
   湖南地平线广告 · 官网交互脚本
   导航 / 留资弹窗 / 悬浮CTA / 地图导航拉起 / 滚动动画 / 计数器
   ========================================================= */
(function () {
  "use strict";

  // 公司统一配置（后台可改）
  var CONFIG = {
    phone: "0746-8888888",       // 客服电话（示例，请替换真实号码）
    mobile: "18900000000",       // 移动号码
    lat: 26.4200,                // 永州公司坐标（示例）
    lng: 111.6130,
    name: "湖南地平线广告装饰有限公司",
    address: "湖南省永州市冷水滩区梧桐路地平线广告大厦",
    leadEndpoint: "",            // 留资接收端点：填你的后端API，或 Formspree/Web3Forms 等表单服务URL（留空则回退邮件）
    leadEmail: "service@dpx-ad.com" // 预留邮箱（未配置端点时，提交会生成发送至该邮箱的邮件草稿）
  };
  window.HORIZON_CONFIG = CONFIG;

  /* 留资自动发送：后台/表单服务端点优先；未配置则回退至预留邮箱(mailto) */
  function sendLead(payload) {
    var c = window.HORIZON_CONFIG;
    // 方式A：配置了后端API或表单服务(Formspree/Web3Forms等) → 真实POST，数据进入后台/邮箱
    if (c.leadEndpoint) {
      fetch(c.leadEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      }).catch(function () { /* 失败也已本地备份，忽略 */ });
      return;
    }
    // 方式B：未配端点时，回退至预留邮箱（打开邮件草稿，数据落入预留邮箱）
    if (c.leadEmail) {
      var subj = encodeURIComponent("【官网留资】" + payload.name + " / " + payload.type);
      var body = encodeURIComponent(
        "姓名：" + payload.name + "\n电话：" + payload.phone +
        "\n需求类型：" + payload.type + "\n备注：" + (payload.message || "无") +
        "\n来源页面：" + payload.page + "\n提交时间：" + payload.ts
      );
      window.location.href = "mailto:" + c.leadEmail + "?subject=" + subj + "&body=" + body;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNavToggle();
    initModal();
    initReveal();
    initCounters();
    initSmoothTop();
    bindPhoneLinks();
    bindNavigateLinks();
    initHeaderScroll();
  });

  /* ---------- 顶部导航滚动阴影 ---------- */
  function initHeaderScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var onScroll = function () {
      if (window.scrollY > 12) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 移动端导航 ---------- */
  function initNavToggle() {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      toggle.classList.toggle("open");
      links.classList.toggle("open");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        toggle.classList.remove("open");
        links.classList.remove("open");
      });
    });
  }

  /* ---------- 留资弹窗 ---------- */
  function initModal() {
    var overlay = document.getElementById("leadModal");
    if (!overlay) return;
    var openers = document.querySelectorAll("[data-open-modal]");
    var closeBtns = overlay.querySelectorAll("[data-close-modal]");
    var form = overlay.querySelector("form");
    var body = overlay.querySelector(".modal-body");
    var successTpl = overlay.querySelector("#modalSuccess");

    function open(type) {
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      var sel = overlay.querySelector('select[name="type"]');
      if (sel && type) { sel.value = type; }
    }
    function close() {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    }
    openers.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        open(btn.getAttribute("data-type") || "");
      });
    });
    closeBtns.forEach(function (b) { b.addEventListener("click", close); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    // 表单提交（示例：本地校验 + 预留后台/邮箱发送接口）
    document.querySelectorAll("form[data-lead-form]").forEach(function (f) {
      f.addEventListener("submit", handleSubmit);
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    var f = e.target;
    var name = (f.querySelector('[name="name"]') || {}).value || "";
    var phone = (f.querySelector('[name="phone"]') || {}).value || "";
    var type = (f.querySelector('[name="type"]') || {}).value || "";
    var msg = (f.querySelector('[name="message"]') || {}).value || "";

    if (!name.trim()) { alert("请填写您的称呼"); return; }
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) { alert("请填写正确的手机号码"); return; }

    var payload = { name: name, phone: phone, type: type, message: msg, ts: new Date().toISOString(), page: location.pathname };

    // 1) 本地备份（离线不丢失）
    try {
      var store = JSON.parse(localStorage.getItem("horizon_leads") || "[]");
      store.push(payload);
      localStorage.setItem("horizon_leads", JSON.stringify(store));
    } catch (err) {}

    // 2) 自动发送至后台 / 预留邮箱（真实网络请求）
    sendLead(payload);

    // 展示成功态
    var overlay = f.closest(".modal-overlay");
    if (overlay) {
      var body = overlay.querySelector(".modal-body");
      var head = overlay.querySelector(".modal-head");
      if (body) body.style.display = "none";
      if (head) head.style.display = "none";
      var s = overlay.querySelector("#modalSuccess");
      if (s) s.style.display = "block";
      setTimeout(function () {
        overlay.classList.remove("open");
        document.body.style.overflow = "";
        if (body) body.style.display = "";
        if (head) head.style.display = "";
        if (s) s.style.display = "none";
        f.reset();
      }, 2600);
    } else {
      // 页面内表单
      f.reset();
      showToast("提交成功！我们的顾问将尽快与您联系。");
    }
  }

  function showToast(text) {
    var t = document.createElement("div");
    t.textContent = text;
    t.style.cssText = "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#0b1e3a;color:#fff;padding:14px 22px;border-radius:12px;z-index:2000;box-shadow:0 12px 30px rgba(0,0,0,.25);font-size:14px;";
    document.body.appendChild(t);
    setTimeout(function () { t.style.transition = ".4s"; t.style.opacity = "0"; }, 2400);
    setTimeout(function () { t.remove(); }, 3000);
  }
  window.horizonToast = showToast;

  /* ---------- 电话链接 ---------- */
  function bindPhoneLinks() {
    document.querySelectorAll("[data-call]").forEach(function (a) {
      a.setAttribute("href", "tel:" + (window.HORIZON_CONFIG.phone || "").replace(/[^0-9+]/g, ""));
    });
  }

  /* ---------- 移动端拉起导航App ---------- */
  function bindNavigateLinks() {
    var c = window.HORIZON_CONFIG;
    document.querySelectorAll("[data-navigate]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var app = btn.getAttribute("data-navigate"); // amap / baidu / auto
        openNavigation(app, c);
      });
    });
  }

  function openNavigation(app, c) {
    var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    var name = encodeURIComponent(c.name);
    var addr = encodeURIComponent(c.address);
    var urls = {
      amap: "https://uri.amap.com/marker?position=" + c.lng + "," + c.lat + "&name=" + name,
      baidu: "http://api.map.baidu.com/marker?location=" + c.lat + "," + c.lng + "&title=" + name + "&content=" + addr + "&output=html&coord_type=gcj02"
    };
    if (isMobile) {
      // 尝试拉起对应App，失败回退网页
      if (app === "amap") {
        var amapScheme = "androidamap://viewMap?sourceApplication=horizon&poiname=" + name + "&lat=" + c.lat + "&lon=" + c.lng + "&dev=0";
        var iosAmap = "iosamap://viewMap?sourceApplication=horizon&poiname=" + name + "&lat=" + c.lat + "&lon=" + c.lng + "&dev=0";
        launchApp(/iPhone|iPad|iPod/i.test(navigator.userAgent) ? iosAmap : amapScheme, urls.amap);
        return;
      }
      if (app === "baidu") {
        var baiduScheme = "baidumap://map/marker?location=" + c.lat + "," + c.lng + "&title=" + name + "&content=" + addr + "&src=horizon&coord_type=gcj02";
        launchApp(baiduScheme, urls.baidu);
        return;
      }
    }
    // 桌面端或默认：打开网页地图
    window.open(urls.amap, "_blank");
  }

  function launchApp(scheme, fallback) {
    var t = Date.now();
    var timer = setTimeout(function () {
      if (Date.now() - t < 2000) { window.location.href = fallback; }
    }, 1200);
    window.location.href = scheme;
    window.addEventListener("pagehide", function () { clearTimeout(timer); });
  }

  /* ---------- 滚动进场动画 ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 0.08 + "s"; io.observe(el); });
  }

  /* ---------- 数字计数动画 ---------- */
  function initCounters() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, target = parseFloat(el.getAttribute("data-count"));
        var suffix = el.getAttribute("data-suffix") || "";
        var dur = 1400, start = 0, t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var val = (start + (target - start) * (1 - Math.pow(1 - p, 3)));
          el.textContent = (Number.isInteger(target) ? Math.round(val) : val.toFixed(1)) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 返回顶部 ---------- */
  function initSmoothTop() {
    document.querySelectorAll("[data-top]").forEach(function (b) {
      b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    });
  }
})();
