/* XYZ Fitness Garage: scroll animation + interactions
   Requires GSAP, ScrollTrigger and Lenis (loaded in index.html). */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Cursor spotlight on glass surfaces ---------- */
  document.querySelectorAll(".spot").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", e.clientX - r.left + "px");
      el.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ---------- Offer countdown (set data-offer-end in index.html; keep it real) ---------- */
  var offer = document.getElementById("offer");
  if (offer) {
    var end = new Date(offer.dataset.offerEnd).getTime();
    var days = Math.ceil((end - Date.now()) / 86400000);
    if (!isNaN(end) && days > 0) {
      offer.textContent = "Free trial offer ends in " + days + (days === 1 ? " day." : " days.");
    }
  }

  /* ---------- Plan buttons pre-select the form ---------- */
  var planSelect = document.getElementById("planSelect");
  document.querySelectorAll("[data-plan]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (planSelect) planSelect.value = btn.dataset.plan;
    });
  });

  /* ---------- Join form ----------
     No backend is included. To receive leads, point FORM_ENDPOINT at a form service
     (Formspree, Web3Forms, Getform) or your own API. Without it, the form opens WhatsApp. */
  var FORM_ENDPOINT = "";               // e.g. "https://formspree.io/f/xxxxxxx"
  var WHATSAPP_NUMBER = "910000000000"; // country code + number, no plus sign

  var form = document.getElementById("joinForm");
  var msg = document.getElementById("formMsg");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name;
      var phone = form.elements.phone;
      var plan = form.elements.plan.value;
      [name, phone].forEach(function (f) { f.classList.remove("invalid"); });

      var phoneOk = /^[+\d][\d\s-]{7,}$/.test(phone.value.trim());
      if (!name.value.trim() || !phoneOk) {
        if (!name.value.trim()) name.classList.add("invalid");
        if (!phoneOk) phone.classList.add("invalid");
        msg.className = "form__msg err";
        msg.textContent = "Enter your name and a valid phone number.";
        return;
      }

      var text = "Hi, I'm " + name.value.trim() + ". I'd like a free trial week at XYZ Fitness Garage. Plan: " + plan + ". Phone: " + phone.value.trim();

      if (FORM_ENDPOINT) {
        msg.className = "form__msg";
        msg.textContent = "Sending...";
        fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ name: name.value.trim(), phone: phone.value.trim(), plan: plan })
        }).then(function (r) {
          if (!r.ok) throw new Error("bad response");
          msg.className = "form__msg ok";
          msg.textContent = "Booked. A coach will message you within a day.";
          form.reset();
        }).catch(function () {
          msg.className = "form__msg err";
          msg.textContent = "Could not send. Please call us or try again.";
        });
      } else {
        msg.className = "form__msg ok";
        msg.textContent = "Opening WhatsApp to confirm your free week.";
        window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text), "_blank", "noopener");
      }
    });
  }

  /* ---------- Split text helpers ---------- */
  var manifesto = document.querySelector("[data-words]");
  var words = [];
  if (manifesto) {
    var parts = manifesto.textContent.trim().split(/\s+/);
    manifesto.textContent = "";
    parts.forEach(function (word, i) {
      var s = document.createElement("span");
      s.className = "w";
      s.textContent = word;
      manifesto.appendChild(s);
      if (i < parts.length - 1) manifesto.appendChild(document.createTextNode(" "));
      words.push(s);
    });
  }

  var heroTitle = document.getElementById("heroTitle");
  var heroWords = [];
  if (heroTitle && !reduceMotion && hasGsap) {
    var label = heroTitle.textContent.trim();
    heroTitle.setAttribute("aria-label", label);
    heroTitle.textContent = "";
    label.split(/\s+/).forEach(function (w, i, arr) {
      var outer = document.createElement("span");
      outer.className = "hw";
      outer.setAttribute("aria-hidden", "true");
      var inner = document.createElement("span");
      inner.className = "hw__i";
      inner.textContent = w;
      outer.appendChild(inner);
      heroTitle.appendChild(outer);
      if (i < arr.length - 1) heroTitle.appendChild(document.createTextNode(" "));
      heroWords.push(inner);
    });
  }

  /* ---------- Fallback: no GSAP or reduced motion ---------- */
  function setFinalStates() {
    words.forEach(function (w) { w.classList.add("on"); });
    document.querySelectorAll("[data-count]").forEach(function (el) { el.textContent = el.dataset.count; });
    var ring = document.getElementById("ringFill");
    if (ring) ring.setAttribute("stroke-dashoffset", String(314 * (1 - 0.82)));
    document.querySelectorAll(".programs").forEach(function (p) { p.classList.add("is-swipe"); });
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    var door = document.getElementById("shutter");
    if (door) door.style.display = "none"; /* never leave the door shut if animation can't run */
  }

  if (!hasGsap || reduceMotion) {
    setFinalStates();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scrolling ---------- */
  var lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -20 });
    });
  });

  /* ---------- Cursor glow + magnetic buttons (mouse only) ---------- */
  var cursor = document.getElementById("cursor");
  if (finePointer && cursor) {
    var cx = gsap.quickTo(cursor, "x", { duration: 0.5, ease: "power3" });
    var cy = gsap.quickTo(cursor, "y", { duration: 0.5, ease: "power3" });
    window.addEventListener("pointermove", function (e) {
      cursor.classList.add("on");
      cx(e.clientX);
      cy(e.clientY);
    });
    document.addEventListener("pointerleave", function () { cursor.classList.remove("on"); });

    document.querySelectorAll(".magnetic").forEach(function (btn) {
      var bx = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
      var by = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        bx((e.clientX - (r.left + r.width / 2)) * 0.25);
        by((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      btn.addEventListener("pointerleave", function () { bx(0); by(0); });
    });

    /* 3D tilt on cards */
    document.querySelectorAll(".tilt").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", (px * 10).toFixed(2) + "deg");
        el.style.setProperty("--rx", (-py * 10).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- Chalk dust canvas in the hero ---------- */
  var canvas = document.getElementById("dust");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, motes = [];
    var resize = function () {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    var count = window.innerWidth < 700 ? 32 : 70;
    var spawn = function (anywhere) {
      return {
        x: Math.random() * W,
        y: anywhere ? Math.random() * H : H + 10,
        r: Math.random() * 2.2 + 0.4,
        vy: -(Math.random() * 0.35 + 0.08),
        vx: (Math.random() - 0.5) * 0.15,
        a: Math.random() * 0.5 + 0.15,
        hot: Math.random() < 0.18
      };
    };
    resize();
    for (var i = 0; i < count; i++) motes.push(spawn(true));
    window.addEventListener("resize", resize);

    var running = true;
    ScrollTrigger.create({
      trigger: ".hero", start: "top top", end: "+=130%",
      onToggle: function (self) { running = self.isActive; }
    });
    gsap.ticker.add(function () {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      motes.forEach(function (m, idx) {
        m.x += m.vx; m.y += m.vy;
        if (m.y < -10 || m.x < -10 || m.x > W + 10) motes[idx] = spawn(false);
        ctx.beginPath();
        ctx.fillStyle = m.hot ? "rgba(255,120,60," + m.a + ")" : "rgba(236,233,226," + m.a + ")";
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  /* ---------- Hero: door rolls up, headline rises, plate spins ---------- */
  var shutter = document.getElementById("shutter");
  var heroInside = document.querySelector(".hero__inside");
  var plateSpin = document.getElementById("plateSpin");

  if (shutter) {
    gsap.set(heroInside, { scale: 1.08 });
    gsap.set(".schedule", { y: 60, opacity: 0 });
    gsap.set(".chip", { scale: 0.6, opacity: 0 });
    gsap.set(".hero__copy > *:not(h1)", { y: 30, opacity: 0 });
    if (heroWords.length) gsap.set(heroWords, { yPercent: 115 });
    if (plateSpin) gsap.set(plateSpin, { scale: 0.7, rotate: -90, opacity: 0.2 });

    var heroTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "+=150%",
        scrub: 0.6,
        pin: ".hero__pin",
        anticipatePin: 1
      }
    });
    heroTl
      .to(".shutter__hint", { opacity: 0, duration: 0.08 }, 0)
      .to(shutter, { yPercent: -100, ease: "power1.in", duration: 1 }, 0)
      .to(heroInside, { scale: 1, ease: "none", duration: 1.4 }, 0)
      .to(plateSpin, { scale: 1, rotate: 360, opacity: 1, ease: "none", duration: 1.6 }, 0.2)
      .to(heroWords, { yPercent: 0, stagger: 0.07, ease: "power3.out", duration: 0.5 }, 0.7)
      .to(".hero__copy > *:not(h1)", { y: 0, opacity: 1, stagger: 0.08, duration: 0.4 }, 1.0)
      .to(".schedule", { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, 1.1)
      .to(".chip", { scale: 1, opacity: 1, stagger: 0.1, duration: 0.4, ease: "back.out(2)" }, 1.2)
      .to({}, { duration: 0.4 });
  }

  /* ---------- Facts: count up when they arrive ---------- */
  function countUp(el, to, dur) {
    var o = { v: 0 };
    gsap.to(o, {
      v: to, duration: dur || 1.6, ease: "power2.out",
      onUpdate: function () { el.textContent = Math.round(o.v); }
    });
  }
  document.querySelectorAll(".fact [data-count]").forEach(function (el) {
    el.textContent = "0";
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: function () { countUp(el, +el.dataset.count, 1.4); }
    });
  });
  gsap.from(".fact", {
    y: 50, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: ".facts", start: "top 85%", once: true }
  });

  /* ---------- Manifesto: words brighten as you read ---------- */
  if (words.length) {
    ScrollTrigger.create({
      trigger: manifesto,
      start: "top 80%",
      end: "bottom 45%",
      scrub: true,
      onUpdate: function (self) {
        var upTo = Math.floor(self.progress * words.length);
        words.forEach(function (w, i) { w.classList.toggle("on", i < upTo); });
      }
    });
  }

  /* ---------- Programs: horizontal scroll on desktop, swipe row on mobile ---------- */
  var programs = document.querySelector(".programs");
  var track = document.querySelector(".programs__track");
  var mm = gsap.matchMedia();

  mm.add("(min-width: 961px)", function () {
    programs.classList.remove("is-swipe");
    var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    gsap.to(track, {
      x: function () { return -distance(); },
      ease: "none",
      scrollTrigger: {
        trigger: ".programs__pin",
        start: "top top",
        end: function () { return "+=" + distance(); },
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true
      }
    });
    return function () { gsap.set(track, { clearProps: "transform" }); };
  });
  mm.add("(max-width: 960px)", function () { programs.classList.add("is-swipe"); });

  /* ---------- Big words slide sideways with scroll ---------- */
  var bwA = document.getElementById("bwA");
  var bwB = document.getElementById("bwB");
  if (bwA && bwB) {
    var bwDist = function (el) { return Math.max(0, el.scrollWidth - window.innerWidth); };
    gsap.fromTo(bwA, { x: 0 }, {
      x: function () { return -bwDist(bwA); }, ease: "none",
      scrollTrigger: { trigger: ".bigwords", start: "top bottom", end: "bottom top", scrub: 0.8, invalidateOnRefresh: true }
    });
    gsap.fromTo(bwB, { x: function () { return -bwDist(bwB); } }, {
      x: 0, ease: "none",
      scrollTrigger: { trigger: ".bigwords", start: "top bottom", end: "bottom top", scrub: 0.8, invalidateOnRefresh: true }
    });
  }

  /* ---------- Progress board: tilts flat, fills in ---------- */
  var board = document.getElementById("boardCard");
  if (board) {
    gsap.set(board, { "--bx": "32deg", "--bs": 0.86 });
    gsap.to(board, {
      "--bx": "0deg", "--bs": 1, ease: "none",
      scrollTrigger: { trigger: ".board-wrap", start: "top 90%", end: "top 25%", scrub: 0.6 }
    });

    var ringFill = document.getElementById("ringFill");
    var ringNum = document.getElementById("ringNum");
    var bars = gsap.utils.toArray("#bars span");
    gsap.set(bars, { "--grow": 0 });

    var boardTl = gsap.timeline({
      paused: true,
      scrollTrigger: { trigger: ".board-wrap", start: "top 55%", once: true, onEnter: function () { boardTl.play(); } }
    });
    boardTl
      .to(ringFill, { attr: { "stroke-dashoffset": 314 * (1 - 0.82) }, duration: 1.6, ease: "power3.out" }, 0)
      .add(function () { countUp(ringNum, 82, 1.6); }, 0)
      .to(bars, { "--grow": 1, duration: 0.9, stagger: 0.09, ease: "back.out(1.6)" }, 0.2)
      .add(function () {
        document.querySelectorAll(".board__prs [data-count]").forEach(function (el) { countUp(el, +el.dataset.count, 1.4); });
      }, 0.3);
  }

  /* ---------- 90 days: rail fills, active step highlights ---------- */
  var steps = gsap.utils.toArray(".step");
  var fill = document.getElementById("pathFill");
  var rail = document.getElementById("railFill");
  if (rail) {
    gsap.to(rail, {
      "--fill": 1, ease: "none",
      scrollTrigger: { trigger: ".path__list", start: "top 60%", end: "bottom 60%", scrub: 0.4 }
    });
    gsap.set(rail, { "--fill": 0.05 });
    rail.parentNode.style.setProperty("--fill", 0.05);
  }
  steps.forEach(function (step, i) {
    ScrollTrigger.create({
      trigger: step,
      start: "top 60%",
      end: "bottom 40%",
      onToggle: function (self) {
        if (self.isActive) {
          steps.forEach(function (s) { s.classList.toggle("is-active", s === step); });
          if (fill) fill.style.width = ((i + 1) / steps.length) * 100 + "%";
        }
      }
    });
  });

  /* ---------- Plans and testimonials: reveal in sequence ---------- */
  ScrollTrigger.batch(".reveal", {
    start: "top 88%",
    once: true,
    onEnter: function (batch) { batch.forEach(function (el) { el.classList.add("in"); }); }
  });

  /* ---------- Join panel: gentle rise ---------- */
  gsap.from(".join__inner", {
    y: 70, opacity: 0, duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: ".join", start: "top 85%", once: true }
  });

  /* ---------- Nav shadow ---------- */
  var nav = document.getElementById("nav");
  ScrollTrigger.create({
    start: 80,
    onUpdate: function (self) {
      nav.style.boxShadow = self.scroll() > 80
        ? "inset 0 1px 0 rgba(255,255,255,.28), 0 14px 40px rgba(0,0,0,.5)"
        : "";
    }
  });

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
