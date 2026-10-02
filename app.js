  (function () {
    // ---------- Immer oben starten (kein Browser-Scroll-Restore, kein Anchor-Autojump) ----------
    // Frueher scrollRestoration-Fix bereits im <head> (vor Rendering) gesetzt.
    function forceTop() {
      var prevBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      document.documentElement.style.scrollBehavior = prevBehavior;
    }
    forceTop();
    window.addEventListener('load', forceTop);
    window.addEventListener('pageshow', forceTop);

    // ---------- Scroll-to-Top-Button ----------
    var scrollTopBtn = document.getElementById('ae-scrolltop');
    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) { scrollTopBtn.classList.add('ae-scrolltop--visible'); }
      else { scrollTopBtn.classList.remove('ae-scrolltop--visible'); }
    });
    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ---------- Offcanvas-Sidebar (mobil) — Fokus-Management analog Legal-Overlay ----------
    var menuToggle = document.getElementById('ae-menu-toggle');
    var sidebar = document.getElementById('ae-sidebar');
    var sidebarBackdrop = document.getElementById('ae-sidebar-backdrop');
    var sidebarClose = document.getElementById('ae-sidebar-close');
    var sidebarOpen = false;
    function openSidebar() {
      sidebar.classList.add('ae-sidebar--open');
      sidebarBackdrop.classList.add('ae-sidebar-backdrop--visible');
      sidebar.setAttribute('aria-hidden', 'false');
      menuToggle.setAttribute('aria-expanded', 'true');
      sidebarOpen = true;
      var firstLink = sidebar.querySelector('a, button');
      if (firstLink) firstLink.focus();
    }
    function closeSidebar() {
      if (!sidebarOpen) return;
      sidebar.classList.remove('ae-sidebar--open');
      sidebarBackdrop.classList.remove('ae-sidebar-backdrop--visible');
      sidebar.setAttribute('aria-hidden', 'true');
      menuToggle.setAttribute('aria-expanded', 'false');
      sidebarOpen = false;
      menuToggle.focus();
    }
    menuToggle.addEventListener('click', openSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarBackdrop.addEventListener('click', closeSidebar);
    sidebar.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeSidebar);
    });
    document.addEventListener('keydown', function (e) {
      if (!sidebarOpen) return;
      if (e.key === 'Escape') { closeSidebar(); return; }
      if (e.key === 'Tab') {
        var focusable = getFocusable(sidebar);
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });

    // ---------- Legal-Overlays ----------
    var legalBackdrop = document.getElementById('ae-legal-backdrop');
    var activeLegal = null;
    var legalTrigger = null;
    function getFocusable(container) {
      return Array.prototype.slice.call(
        container.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])')
      );
    }
    function openLegal(target, trigger) {
      legalTrigger = trigger || document.activeElement;
      target.classList.remove('ae-legal-hidden');
      legalBackdrop.classList.add('ae-legal-backdrop--visible');
      document.body.style.overflow = 'hidden';
      activeLegal = target;
      var closeBtn = target.querySelector('.ae-legal-close');
      if (closeBtn) closeBtn.focus();
    }
    function closeLegal() {
      if (!activeLegal) return;
      activeLegal.classList.add('ae-legal-hidden');
      legalBackdrop.classList.remove('ae-legal-backdrop--visible');
      document.body.style.overflow = '';
      activeLegal = null;
      if (legalTrigger && typeof legalTrigger.focus === 'function') legalTrigger.focus();
      legalTrigger = null;
    }
    // Backdrop liegt hinter der fixed/inset:0-Section (niedrigerer z-index) und
    // empfängt daher nie Klicks — Listener stattdessen auf jede Section selbst,
    // schließt nur bei Klick außerhalb der .ae-card (Fix testing-qa-Befund #1).
    document.querySelectorAll('.ae-legal-section').forEach(function (section) {
      section.addEventListener('click', function (e) {
        if (e.target === e.currentTarget) closeLegal();
      });
    });
    document.querySelectorAll('.ae-legal-close').forEach(function (btn) {
      btn.addEventListener('click', closeLegal);
    });
    document.addEventListener('keydown', function (e) {
      if (!activeLegal) return;
      if (e.key === 'Escape') { closeLegal(); return; }
      if (e.key === 'Tab') {
        var focusable = getFocusable(activeLegal);
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });
    document.querySelectorAll('[data-legal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = document.getElementById(btn.dataset.legal);
        if (target) openLegal(target, btn);
      });
    });
    // Deep-Link-Support (Art. 13 DSGVO / §5 DDG): externer Aufruf mit
    // #ae-legal-impressum/-datenschutz (z. B. von pool/registrieren.html,
    // pool/login.html, pool/kalender.html) oeffnet das Overlay sofort beim
    // Laden — reuse von openLegal(), analog aeris/app.js:143-148.
    if (location.hash === '#ae-legal-impressum' || location.hash === '#ae-legal-datenschutz') {
      var hashTarget = document.getElementById(location.hash.slice(1));
      if (hashTarget) openLegal(hashTarget, null);
    }

    // ---------- Kontaktformular (mailto-Fallback, kein Backend) ----------
    var contactForm = document.getElementById('ae-contact-form');
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('ae-cf-name').value;
      var email = document.getElementById('ae-cf-email').value;
      var message = document.getElementById('ae-cf-message').value;
      var subject = encodeURIComponent('Erstkontakt AERIS von ' + name);
      var body = encodeURIComponent(message + '\n\nAntwort an: ' + email);
      window.location.href = 'mailto:r.krieg.home@gmail.com?subject=' + subject + '&body=' + body;
    });
  })();
