(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: scrolled state + mobile menu ---------- */
  var header = document.querySelector(".site-header");
  var nav = document.getElementById("nav");
  var menuBtn = document.getElementById("menuBtn");

  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", function () {
    setMenu(!nav.classList.contains("open"));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });

  /* ---------- Active nav link ---------- */
  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Terminal typing ---------- */
  var term = document.getElementById("term");
  var lines = [];
  try { lines = JSON.parse(term.getAttribute("data-lines")); } catch (err) { lines = []; }

  function makeLine(item) {
    var el = document.createElement("span");
    el.className = "t-" + item.t;
    return el;
  }

  function renderAll() {
    term.textContent = "";
    lines.forEach(function (item) {
      var el = makeLine(item);
      el.textContent = item.v;
      term.appendChild(el);
      term.appendChild(document.createTextNode("\n"));
    });
  }

  function typeTerminal() {
    term.textContent = "";
    var caret = document.createElement("span");
    caret.className = "t-caret";
    var i = 0;

    function nextLine() {
      if (i >= lines.length) return;
      var item = lines[i++];
      var el = makeLine(item);
      term.insertBefore(el, caret.parentNode ? caret : null);
      if (!caret.parentNode) term.appendChild(caret);

      if (item.t === "cmd") {
        var c = 0;
        (function typeChar() {
          el.textContent = item.v.slice(0, ++c);
          if (c < item.v.length) {
            setTimeout(typeChar, 28 + Math.random() * 35);
          } else {
            term.insertBefore(document.createTextNode("\n"), caret);
            setTimeout(nextLine, 320);
          }
        })();
      } else {
        el.textContent = item.v;
        term.insertBefore(document.createTextNode("\n"), caret);
        setTimeout(nextLine, 120);
      }
    }
    setTimeout(nextLine, 900);
  }

  if (term && lines.length) {
    if (reduceMotion) renderAll(); else typeTerminal();
  }

  /* ---------- Hero network canvas ---------- */
  var canvas = document.getElementById("net");
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, dpr = 1;
  var nodes = [];
  var packets = [];
  var mouse = { x: -999, y: -999 };
  var running = false;
  var LINK = 150;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var count = Math.max(24, Math.min(70, Math.round((W * H) / 20000)));
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: 1.5 + Math.random() * 1.8
      });
    }
    packets = [];
    if (reduceMotion) draw();
  }

  function neighbors(a) {
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var b = nodes[i];
      if (b === a) continue;
      var dx = a.x - b.x, dy = a.y - b.y;
      if (dx * dx + dy * dy < LINK * LINK) out.push(b);
    }
    return out;
  }

  function spawnPacket() {
    if (packets.length > 12) return;
    var a = nodes[(Math.random() * nodes.length) | 0];
    var near = neighbors(a);
    if (!near.length) return;
    var b = near[(Math.random() * near.length) | 0];
    packets.push({ a: a, b: b, t: 0, speed: 0.008 + Math.random() * 0.01 });
  }

  function step() {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    }
    if (Math.random() < 0.06) spawnPacket();
    for (var p = packets.length - 1; p >= 0; p--) {
      packets[p].t += packets[p].speed;
      if (packets[p].t >= 1) packets.splice(p, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var i, j, a, b, dx, dy, d;

    ctx.lineWidth = 1;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        dx = a.x - b.x; dy = a.y - b.y;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK) {
          ctx.strokeStyle = "rgba(120,155,235," + (0.28 * (1 - d / LINK)).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      // cursor link
      dx = a.x - mouse.x; dy = a.y - mouse.y;
      d = Math.sqrt(dx * dx + dy * dy);
      if (d < 180) {
        ctx.strokeStyle = "rgba(255,176,32," + (0.5 * (1 - d / 180)).toFixed(3) + ")";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }

    ctx.fillStyle = "rgba(159,182,238,.65)";
    for (i = 0; i < nodes.length; i++) {
      ctx.beginPath(); ctx.arc(nodes[i].x, nodes[i].y, nodes[i].r, 0, 6.2832); ctx.fill();
    }

    // packets: amber dots travelling along links
    for (i = 0; i < packets.length; i++) {
      var pk = packets[i];
      var x = pk.a.x + (pk.b.x - pk.a.x) * pk.t;
      var y = pk.a.y + (pk.b.y - pk.a.y) * pk.t;
      ctx.fillStyle = "rgba(255,176,32,.25)";
      ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "#ffb020";
      ctx.beginPath(); ctx.arc(x, y, 3, 0, 6.2832); ctx.fill();
    }
  }

  function loop() {
    if (!running) return;
    step(); draw();
    requestAnimationFrame(loop);
  }

  function start() { if (!running && !reduceMotion) { running = true; requestAnimationFrame(loop); } }
  function stop() { running = false; }

  resize();
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  var hero = document.querySelector(".hero");
  hero.addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  hero.addEventListener("pointerleave", function () { mouse.x = mouse.y = -999; });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? start() : stop();
    }).observe(hero);
  } else {
    start();
  }
  document.addEventListener("visibilitychange", function () {
    document.hidden ? stop() : start();
  });

  /* ---------- Copy email ---------- */
  var toast = document.getElementById("toast");
  var toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }

  var copyBtn = document.getElementById("copyEmail");
  copyBtn.addEventListener("click", function () {
    var email = copyBtn.getAttribute("data-email");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(
        function () { showToast("Email copied"); },
        function () { showToast("Couldn't copy. Select the email and copy it manually."); }
      );
    } else {
      showToast("Couldn't copy. Select the email and copy it manually.");
    }
  });

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
