(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------------
     Gallery — auto-discovers images instead of a hard-coded list.
     Just drop new files into assets/gallery/ named shot_01, shot_02,
     shot_03 ... up to shot_30, in any of the extensions below, and
     they will appear automatically — no code edits needed.
  --------------------------------------------------------------- */
  const GALLERY_MAX = 30;
  const GALLERY_EXTENSIONS = ['webp', 'jpg', 'jpeg', 'png'];

  function probeImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function findSlotImage(index) {
    const n = String(index).padStart(2, '0');
    for (const ext of GALLERY_EXTENSIONS) {
      const found = await probeImage(`assets/gallery/shot_${n}.${ext}`);
      if (found) return found;
    }
    return null;
  }

  async function discoverGalleryItems() {
    const found = [];
    let consecutiveMisses = 0;
    for (let i = 1; i <= GALLERY_MAX; i++) {
      const src = await findSlotImage(i);
      if (src) {
        found.push(src);
        consecutiveMisses = 0;
      } else {
        consecutiveMisses++;
        // Numbering is meant to be sequential (shot_01, shot_02, ...).
        // Once we hit a few empty slots in a row, assume the album ends
        // there instead of probing all the way to GALLERY_MAX every time.
        if (consecutiveMisses >= 3) break;
      }
    }
    return found;
  }

  /* ---------------------------------------------------------------
     Custom cursor
  --------------------------------------------------------------- */
  function initCursor() {
    if (isCoarsePointer || !window.gsap) return;
    const dot = document.querySelector('.cursor');
    const ring = document.querySelector('.cursor-ring');
    const label = document.querySelector('.cursor-ring__label');
    if (!dot || !ring) return;

    const qDotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
    const qDotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
    const qRingX = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3.out' });
    const qRingY = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3.out' });

    window.addEventListener('mousemove', (e) => {
      qDotX(e.clientX); qDotY(e.clientY);
      qRingX(e.clientX); qRingY(e.clientY);
      if (!dot.classList.contains('is-active')) {
        dot.classList.add('is-active');
        ring.classList.add('is-active');
      }
    }, { once: false });
    document.addEventListener('mouseleave', () => {
      dot.classList.remove('is-active');
      ring.classList.remove('is-active');
    });

    const bound = new WeakSet();
    const attach = () => {
      document.querySelectorAll('[data-cursor]').forEach((el) => {
        if (bound.has(el)) return;
        bound.add(el);
        const text = el.getAttribute('data-cursor') || '';
        el.addEventListener('mouseenter', () => {
          gsap.to(ring, { width: text ? 84 : 60, height: text ? 84 : 60, duration: 0.35, ease: 'power3.out' });
          gsap.to(dot, { scale: 0, duration: 0.25 });
          if (label) { label.textContent = text; gsap.to(label, { opacity: 1, duration: 0.25 }); }
        });
        el.addEventListener('mouseleave', () => {
          gsap.to(ring, { width: 40, height: 40, duration: 0.35, ease: 'power3.out' });
          gsap.to(dot, { scale: 1, duration: 0.25 });
          if (label) gsap.to(label, { opacity: 0, duration: 0.2 });
        });
      });
    };
    attach();
    new MutationObserver(attach).observe(document.body, { childList: true, subtree: true });
  }

  /* ---------------------------------------------------------------
     Navbar: scrolled state + mobile menu
  --------------------------------------------------------------- */
  function initNavbar() {
    const nav = document.querySelector('.navbar');
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const burger = document.getElementById('burgerBtn');
    const menu = document.getElementById('mobileMenu');
    burger.addEventListener('click', () => {
      burger.classList.toggle('is-open');
      menu.classList.toggle('is-open');
    });
    menu.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        burger.classList.remove('is-open');
        menu.classList.remove('is-open');
      })
    );
  }

  /* ---------------------------------------------------------------
     Scroll reveal (IntersectionObserver — robust, no GSAP dependency)
  --------------------------------------------------------------- */
  function initReveals() {
    const els = document.querySelectorAll('.reveal-up, .reveal-left');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach((el) => el.classList.add('is-revealed'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------
     Animated stat counters
  --------------------------------------------------------------- */
  function initCounters() {
    const nums = document.querySelectorAll('.stat-card__num');
    if (!nums.length) return;

    const animate = (el) => {
      const target = parseInt(el.getAttribute('data-count'), 10) || 0;
      const obj = { v: 0 };
      if (window.gsap && !reduceMotion) {
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => (el.textContent = Math.round(obj.v).toString()),
        });
      } else {
        el.textContent = target.toString();
      }
    };

    if (!('IntersectionObserver' in window)) {
      nums.forEach(animate);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    nums.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------
     Parallax on the About section image stack
  --------------------------------------------------------------- */
  function initParallax() {
    if (!window.gsap || !window.ScrollTrigger || reduceMotion) return;
    const big = document.querySelector('.about__frame:not(.about__frame--small)');
    const small = document.querySelector('.about__frame--small');
    if (big) {
      gsap.to(big, {
        y: -40, ease: 'none',
        scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: 1 },
      });
    }
    if (small) {
      gsap.to(small, {
        y: 30, ease: 'none',
        scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: 1 },
      });
    }
  }

  /* ---------------------------------------------------------------
     Magnetic buttons
  --------------------------------------------------------------- */
  function initMagnetic() {
    if (isCoarsePointer || !window.gsap) return;
    document.querySelectorAll('.magnetic').forEach((btn) => {
      const strength = 18;
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        gsap.to(btn, { x: (x / r.width) * strength, y: (y / r.height) * strength, duration: 0.4, ease: 'power3.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ---------------------------------------------------------------
     3D tilt on service cards
  --------------------------------------------------------------- */
  function initTilt() {
    if (isCoarsePointer || !window.gsap) return;
    document.querySelectorAll('.tilt').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, {
          rotateY: px * 10,
          rotateX: -py * 10,
          duration: 0.5,
          ease: 'power2.out',
          transformPerspective: 700,
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
      });
    });
  }

  /* ---------------------------------------------------------------
     Gallery grid + lightbox
  --------------------------------------------------------------- */
  async function initGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="gallery__loading">در حال بارگذاری تصاویر…</div>';
    const galleryItems = await discoverGalleryItems();

    if (!galleryItems.length) {
      grid.innerHTML = '';
      return;
    }

    grid.innerHTML = galleryItems
      .map(
        (src, i) => `
      <div class="gallery__item" data-index="${i}" data-cursor="مشاهده">
        <img src="${src}" alt="نمونه‌کار هلدینگ گیتی‌پسند" loading="lazy">
      </div>`
      )
      .join('');

    const lightbox = document.getElementById('lightbox');
    const lbImage = document.getElementById('lbImage');
    const lbCaption = document.getElementById('lbCaption');
    if (lbCaption) lbCaption.style.display = 'none';
    let current = 0;

    const open = (i) => {
      current = i;
      lbImage.src = galleryItems[i];
      lbImage.alt = 'نمونه‌کار هلدینگ گیتی‌پسند';
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
    };
    const step = (dir) => {
      current = (current + dir + galleryItems.length) % galleryItems.length;
      open(current);
    };

    grid.querySelectorAll('.gallery__item').forEach((el) => {
      el.addEventListener('click', () => open(parseInt(el.dataset.index, 10)));
    });
    document.getElementById('lbClose').addEventListener('click', close);
    document.getElementById('lbPrev').addEventListener('click', () => step(-1));
    document.getElementById('lbNext').addEventListener('click', () => step(1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    window.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  /* ---------------------------------------------------------------
     Team avatars — swap in a real photo automatically if present
  --------------------------------------------------------------- */
  function initTeamPhotos() {
    document.querySelectorAll('.team-card__avatar[data-photo]').forEach((el) => {
      const src = el.getAttribute('data-photo');
      const test = new Image();
      test.onload = () => {
        el.innerHTML = '';
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        el.appendChild(img);
      };
      test.onerror = () => {}; // keep the monogram placeholder
      test.src = src;
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initNavbar();
    initReveals();
    initCounters();
    initParallax();
    initMagnetic();
    initTilt();
    initGallery();
    initTeamPhotos();
  });
})();
