/* XYZ Fitness Garage: scroll animation + interactions
   Requires GSAP, ScrollTrigger and Lenis (loaded in index.html). */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  var FORM_ENDPOINT = "";          // e.g. "https://formspree.io/f/xxxxxxx"
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

  /* ---------- Manifesto words (build spans even if GSAP fails) ---------- */
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

  if (!hasGsap || reduceMotion) {
    words.forEach(function (w) { w.classList.add("on"); });
    document.querySelectorAll(".programs").forEach(function (p) { p.classList.add("is-swipe"); });
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

  /* ---------- Hero: the garage door rolls up ---------- */
  var shutter = document.getElementById("shutter");
  var heroInside = document.querySelector(".hero__inside");
  if (shutter) {
    gsap.set(heroInside, { scale: 0.94, opacity: 0.4 });
    var heroTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "+=110%",
        scrub: 0.6,
        pin: ".hero__pin",
        anticipatePin: 1
      }
    });
    heroTl
      .to(shutter, { yPercent: -100, ease: "power1.in", duration: 1 }, 0)
      .to(heroInside, { scale: 1, opacity: 1, ease: "none", duration: 1 }, 0.1)
      .to(".shutter__hint", { opacity: 0, duration: 0.1 }, 0);
  }

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

  mm.add("(max-width: 960px)", function () {
    programs.classList.add("is-swipe");
  });

  /* ---------- 90 days: highlight the step in the middle of the screen ---------- */
  var steps = gsap.utils.toArray(".step");
  var fill = document.getElementById("pathFill");
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

  /* ---------- Plans and testimonials: one gentle stagger as each group arrives ---------- */
  [".plans__grid", ".proof__grid"].forEach(function (sel) {
    var group = document.querySelector(sel);
    if (!group) return;
    gsap.from(group.children, {
      y: 40, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.12,
      scrollTrigger: { trigger: group, start: "top 82%", once: true }
    });
  });

  /* ---------- Nav: tighten after hero ---------- */
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
