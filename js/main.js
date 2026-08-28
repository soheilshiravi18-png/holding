(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------------
     Gallery data — captions matched to the curated stills.
  --------------------------------------------------------------- */
  const galleryItems = [
    { src: 'assets/gallery/shot_01.webp', caption: 'نمای هوایی ورودی و استخر اختصاصی', big: true },
    { src: 'assets/gallery/shot_04.webp', caption: 'نمای شیشه‌ای ورودی اصلی ساختمان' },
    { src: 'assets/gallery/shot_03.webp', caption: 'لابی ورودی و پارکینگ نمایشی' },
    { src: 'assets/gallery/shot_06.webp', caption: 'آشپزخانه و فضای نشیمن باز' },
    { src: 'assets/gallery/shot_07.webp', caption: 'مسیر اختصاصی استخر سرپوشیده' },
    { src: 'assets/gallery/shot_09.webp', caption: 'پارکینگ نمایشی با نورپردازی ویژه', big: true },
    { src: 'assets/gallery/shot_08.webp', caption: 'راهروی شیشه‌ای میان درختان' },
    { src: 'assets/gallery/shot_11.webp', caption: 'فضای بازی و سرگرمی خانوادگی' },
    { src: 'assets/gallery/shot_12.webp', caption: 'بولینگ اختصاصی داخل مجموعه' },
    { src: 'assets/gallery/shot_13.webp', caption: 'سالن نشیمن با نورپردازی لوستر' },
    { src: 'assets/gallery/shot_10.webp', caption: 'نمای بیرونی ساختمان در غروب' },
    { src: 'assets/gallery/shot_15.webp', caption: 'زمین ورزشی روی پشت‌بام مجموعه', big: true },
  ];

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
  function initGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    grid.innerHTML = galleryItems
      .map(
        (item, i) => `
      <div class="gallery__item${item.big ? ' gallery__item--big' : ''}" data-index="${i}" data-cursor="مشاهده">
        <img src="${item.src}" alt="${item.caption}" loading="lazy">
        <span class="gallery__caption">${item.caption}</span>
      </div>`
      )
      .join('');

    const lightbox = document.getElementById('lightbox');
    const lbImage = document.getElementById('lbImage');
    const lbCaption = document.getElementById('lbCaption');
    let current = 0;

    const open = (i) => {
      current = i;
      lbImage.src = galleryItems[i].src;
      lbImage.alt = galleryItems[i].caption;
      lbCaption.textContent = galleryItems[i].caption;
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
