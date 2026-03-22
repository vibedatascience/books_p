/* Navigation + scroll reveal + chapter loader + scroll spy + mobile TOC */
(function () {
  'use strict';

  // Sticky nav shadow
  var nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 4);
    }, { passive: true });
  }

  // Scroll reveal
  var revealObs;
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    els.forEach(function (el) { revealObs.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('visible'); });
  }

  // --- Chapter partial loader ---
  var container = document.getElementById('chapters-content');
  if (container) {
    var partials = container.getAttribute('data-chapters');
    if (partials) {
      var chapters = partials.split(',').map(function (s) { return s.trim(); });
      var chain = Promise.resolve();
      chapters.forEach(function (src) {
        chain = chain.then(function () {
          return fetch(src)
            .then(function (r) { return r.ok ? r.text() : ''; })
            .then(function (html) {
              if (!html) return;
              var wrapper = document.createElement('div');
              wrapper.innerHTML = html;
              var child = wrapper.firstElementChild || wrapper;
              container.appendChild(child);

              var scripts = wrapper.querySelectorAll('script');
              scripts.forEach(function (old) {
                var s = document.createElement('script');
                if (old.src) { s.src = old.src; } else { s.textContent = old.textContent; }
                document.body.appendChild(s);
              });

              if (revealObs) {
                child.querySelectorAll('.reveal').forEach(function (el) { revealObs.observe(el); });
              }

              initScrollSpy();
            });
        });
      });
    }
  }

  // --- Scroll Spy for sidebar + mobile TOC ---
  function initScrollSpy() {
    var links = document.querySelectorAll('.sidebar-chapters a');
    if (!links.length) return;

    var sections = [];
    var seen = {};
    links.forEach(function (link) {
      var id = link.getAttribute('href');
      if (id && id.startsWith('#') && !seen[id]) {
        var el = document.getElementById(id.substring(1));
        if (el) {
          sections.push({ id: id, el: el });
          seen[id] = true;
        }
      }
    });

    if (!sections.length) return;

    function update() {
      var scrollY = window.scrollY + 80;
      var currentId = null;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].el.offsetTop <= scrollY) {
          currentId = sections[i].id;
        }
      }
      links.forEach(function (l) {
        if (l.getAttribute('href') === currentId) {
          l.classList.add('active');
        } else {
          l.classList.remove('active');
        }
      });
    }

    window.removeEventListener('scroll', window._spyFn);
    window._spyFn = update;
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  initScrollSpy();

  // --- Mobile TOC drawer ---
  var tocBtn = document.getElementById('mobileTocBtn');
  var tocDrawer = document.getElementById('mobileTocDrawer');
  var tocOverlay = document.getElementById('mobileTocOverlay');

  if (tocBtn && tocDrawer && tocOverlay) {
    function openDrawer() {
      tocDrawer.classList.add('open');
      tocOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      tocDrawer.classList.remove('open');
      tocOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    tocBtn.addEventListener('click', function () {
      if (tocDrawer.classList.contains('open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    tocOverlay.addEventListener('click', closeDrawer);

    // Close drawer when a link is tapped
    tocDrawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeDrawer();
      });
    });

    // Hide TOC button when at top of page (no need yet)
    var lastScroll = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      // Show button only after scrolling past the header area
      if (y > 200) {
        tocBtn.style.opacity = '1';
        tocBtn.style.pointerEvents = 'auto';
      } else {
        tocBtn.style.opacity = '0';
        tocBtn.style.pointerEvents = 'none';
      }
      lastScroll = y;
    }, { passive: true });

    // Initial state
    tocBtn.style.opacity = '0';
    tocBtn.style.pointerEvents = 'none';
    tocBtn.style.transition = 'opacity 0.2s, transform 0.2s';
  }
})();
