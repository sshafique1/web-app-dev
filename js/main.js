/* ==========================================================
   main.js - shared behaviour for every page
   Features
     - mobile navigation toggle
     - sticky header shadow and scroll progress bar
     - scroll reveal animations (IntersectionObserver)
     - animated number counters and skill bars
     - cursor-follow glow on cards
     - typing effect on the home page
     - back-to-top button
     - cookie consent banner (stored in localStorage)
     - automatic footer year
   ========================================================== */

"use strict";

document.addEventListener("DOMContentLoaded", function () {
  initNav();
  initScrollEffects();
  initReveal();
  initCardGlow();
  initTyping();
  initCookieBanner();
  setYear();
});

/* Opens and closes the mobile menu and keeps aria-expanded in sync */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) {
    return;
  }

  toggle.addEventListener("click", function () {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    links.classList.toggle("open", !open);
  });

  // close the menu with the Escape key for keyboard users
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && links.classList.contains("open")) {
      toggle.setAttribute("aria-expanded", "false");
      links.classList.remove("open");
      toggle.focus();
    }
  });
}

/* Header shadow, reading progress bar and back-to-top button */
function initScrollEffects() {
  const header = document.querySelector(".site-header");
  const bar = document.querySelector(".progress-bar");
  const topBtn = document.querySelector(".to-top");

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    if (header) {
      header.classList.toggle("scrolled", y > 20);
    }
    if (bar && max > 0) {
      bar.style.width = (y / max) * 100 + "%";
    }
    if (topBtn) {
      topBtn.classList.toggle("show", y > 600);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (topBtn) {
    topBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

/* Reveals elements, runs counters and fills skill bars when they scroll into view */
function initReveal() {
  const items = document.querySelectorAll(".reveal, [data-count], .skill-fill");

  // fallback for very old browsers - just show everything
  if (!("IntersectionObserver" in window)) {
    items.forEach(showItem);
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        showItem(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(function (el) {
    observer.observe(el);
  });
}

function showItem(el) {
  el.classList.add("visible");

  if (el.dataset.count) {
    countUp(el, parseInt(el.dataset.count, 10));
  }
  if (el.classList.contains("skill-fill")) {
    el.style.width = el.dataset.level + "%";
  }
}

/* Animates a number from 0 to its target using requestAnimationFrame */
function countUp(el, target) {
  const duration = 1600;
  const start = performance.now();
  const suffix = el.dataset.suffix || "";

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(target * eased) + suffix;
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}

/* Moves the gold glow on each card to follow the mouse pointer */
function initCardGlow() {
  document.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.backgroundImage = "radial-gradient(circle at " + x + "px " + y + "px, rgba(212, 175, 106, 0.12), rgba(212, 175, 106, 0) 45%)";
    });
    card.addEventListener("pointerleave", function () {
      card.style.backgroundImage = "";
    });
  });
}

/* Types and deletes a list of words in the home page hero */
function initTyping() {
  const el = document.querySelector(".typed");
  if (!el) {
    return;
  }

  const words = JSON.parse(el.dataset.words);
  let wordIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const word = words[wordIndex];
    charIndex += deleting ? -1 : 1;
    el.textContent = word.substring(0, charIndex);

    let delay = deleting ? 45 : 95;

    if (!deleting && charIndex === word.length) {
      delay = 1800;          // pause at the full word
      deleting = true;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 350;
    }
    setTimeout(tick, delay);
  }
  tick();
}

/* GDPR cookie notice - remembers the visitor's choice so it only shows once */
function initCookieBanner() {
  const banner = document.querySelector(".cookie-banner");
  if (!banner) {
    return;
  }

  let choice = null;
  try {
    choice = localStorage.getItem("cookieChoice");
  } catch (err) {
    choice = null; // storage blocked, banner will simply show each visit
  }

  if (!choice) {
    setTimeout(function () {
      banner.classList.add("show");
    }, 900);
  }

  banner.querySelectorAll("[data-cookie]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      try {
        localStorage.setItem("cookieChoice", btn.dataset.cookie);
      } catch (err) {
        /* ignore - choice just will not persist */
      }
      banner.classList.remove("show");
    });
  });
}

/* Keeps the copyright year current */
function setYear() {
  document.querySelectorAll(".year").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
}
