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

    // ---------- Legal-/Confirm-Overlays ----------
    // Stack statt Einzel-Variable (2026-10-02, Buchungs-Bestaetigungs-Overlay
    // kann ein zweites Overlay — die Widerrufsbelehrung — ueber sich oeffnen,
    // ohne das darunterliegende Overlay versehentlich zu schliessen/den
    // Scroll-Lock verfrueht aufzuheben).
    var legalBackdrop = document.getElementById('ae-legal-backdrop');
    var legalStack = []; // { target, trigger }
    function getFocusable(container) {
      return Array.prototype.slice.call(
        container.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])')
      );
    }
    function openLegal(target, trigger) {
      // z-index explizit pro Stacktiefe setzen (nicht nur per CSS-Fixwert
      // 200) — sonst gewinnt bei zwei gleichzeitig offenen Overlays die
      // DOM-Reihenfolge statt der tatsaechlichen Oeffnungsreihenfolge
      // (Buchungs-Overlay -> Widerruf-Link darin -> Widerruf-Overlay).
      target.style.zIndex = String(200 + legalStack.length);
      legalStack.push({ target: target, trigger: trigger || document.activeElement });
      target.classList.remove('ae-legal-hidden');
      legalBackdrop.classList.add('ae-legal-backdrop--visible');
      document.body.style.overflow = 'hidden';
      var closeBtn = target.querySelector('.ae-legal-close');
      if (closeBtn) closeBtn.focus();
    }
    function closeLegal() {
      var top = legalStack.pop();
      if (!top) return;
      top.target.classList.add('ae-legal-hidden');
      top.target.style.zIndex = '';
      if (legalStack.length) {
        var below = legalStack[legalStack.length - 1].target;
        var belowClose = below.querySelector('.ae-legal-close');
        if (belowClose) belowClose.focus();
      } else {
        legalBackdrop.classList.remove('ae-legal-backdrop--visible');
        document.body.style.overflow = '';
        if (top.trigger && typeof top.trigger.focus === 'function') top.trigger.focus();
      }
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
    // Gemeinsame Nachkontrolle fuer Klick- UND Tab-Randfall (DRY, 2026-10-02):
    // beide Ausloeser koennen activeElement auf <body> "parken" lassen (Safari/
    // WebKit vergibt dabei keinen echten Fokus, daher kein focusin-Event).
    // preferred wird zuerst versucht (Klick: das angeklickte Element; Tab: das
    // zuletzt bekannte Fokus-Ziel im Overlay), sonst .ae-legal-close, sonst
    // das erste getFocusable()-Element.
    function reclaimFocusFromBody(top, preferred) {
      setTimeout(function () {
        if (document.activeElement !== document.body) return;
        if (!legalStack.length || legalStack[legalStack.length - 1].target !== top) return;
        var candidate = preferred ||
          (top.__aeLastFocus && top.contains(top.__aeLastFocus) ? top.__aeLastFocus : null);
        if (candidate && typeof candidate.focus === 'function') candidate.focus();
        if (document.activeElement === document.body) {
          var closeBtn = top.querySelector('.ae-legal-close');
          var focusable = getFocusable(top);
          var restore = closeBtn || focusable[0];
          if (restore && typeof restore.focus === 'function') restore.focus();
        }
      }, 0);
    }
    document.addEventListener('keydown', function (e) {
      if (!legalStack.length) return;
      var current = legalStack[legalStack.length - 1].target;
      if (e.key === 'Escape') { closeLegal(); return; }
      if (e.key === 'Tab') {
        var focusable = getFocusable(current);
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        } else {
          // Runde 4 (2026-10-02): synchrone Index-Navigation statt
          // nachtraeglicher reclaimFocusFromBody()-Korrektur. Letztere liess
          // den nativen Tab-Default durchlaufen (kurzer <body>-Zwischenstand)
          // UND fiel immer auf ein FIXES Element (__aeLastFocus) zurueck,
          // wodurch der Fokus ab dem 2. Tab dauerhaft einfror. preventDefault()
          // verhindert den <body>-Zwischenstand strukturell, der naechste/
          // vorherige Index aus dem focusable-Array ersetzt das fixe Ziel.
          e.preventDefault();
          var idx = focusable.indexOf(document.activeElement);
          var target;
          if (idx === -1) {
            target = focusable[0];
          } else if (e.shiftKey) {
            target = focusable[(idx - 1 + focusable.length) % focusable.length];
          } else {
            target = focusable[(idx + 1) % focusable.length];
          }
          target.focus();
        }
      }
    });
    // Fokus-Leck-Fix (testing-qa-Fund 2026-10-02): Klick auf ein Nicht-Text-
    // Control (z. B. Checkbox) im Overlay vergibt in Safari/WebKit keinen
    // DOM-Fokus — activeElement faellt auf <body> zurueck. Der reine
    // Boundary-Trap oben greift dann nicht (activeElement ist weder first
    // noch last), der naechste Tab wandert per nativer Reihenfolge aus dem
    // Overlay heraus. focusin feuert bei JEDEM echten Fokuswechsel (auch dem
    // Leck-Tab) und holt den Fokus aktiv zurueck, sobald er das oberste
    // Overlay verlaesst.
    document.addEventListener('focusin', function (e) {
      if (!legalStack.length) return;
      var top = legalStack[legalStack.length - 1].target;
      if (top.contains(e.target)) { top.__aeLastFocus = e.target; return; }
      var closeBtn = top.querySelector('.ae-legal-close');
      var focusable = getFocusable(top);
      var restore = (top.__aeLastFocus && top.contains(top.__aeLastFocus))
        ? top.__aeLastFocus
        : (closeBtn || focusable[0]);
      if (restore && typeof restore.focus === 'function') restore.focus();
    });
    // Randfall-Fix (2026-10-02): Klick auf ein Nicht-Text-Control (Checkbox
    // etc.) im Overlay vergibt in Safari/WebKit gar keinen DOM-Fokus — es
    // feuert dabei kein focusin-Event, auf das der obige Handler reagieren
    // koennte, activeElement bleibt auf <body> "geparkt" (kein Leck in die
    // Hauptseite, nur unsaubere UX). Generischer, delegierter Klick-Listener
    // auf dem Overlay-Stack statt Einzelfall-Patch fuer #ae-booking-ack:
    // nach der Interaktion (setTimeout 0, Checkbox-Toggle/change laeuft
    // zuerst unveraendert durch) wird der Fokus zurueckgeholt, falls er auf
    // <body> haengen blieb.
    document.addEventListener('click', function (e) {
      if (!legalStack.length) return;
      var top = legalStack[legalStack.length - 1].target;
      if (!top.contains(e.target)) return;
      reclaimFocusFromBody(top, e.target);
    });
    document.querySelectorAll('[data-legal]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
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
    // Buchungs-Bestaetigungs-Overlay (2026-10-02): Submit oeffnet zunaechst
    // das Overlay statt sofort mailto auszuloesen — erst der dortige,
    // checkbox-gesperrte Button sendet tatsaechlich.
    var contactForm = document.getElementById('ae-contact-form');
    var bookingConfirmSection = document.getElementById('ae-booking-confirm');
    var bookingAck = document.getElementById('ae-booking-ack');
    var bookingConfirmBtn = document.getElementById('ae-booking-confirm-btn');
    function sendContactMailto() {
      var name = document.getElementById('ae-cf-name').value;
      var email = document.getElementById('ae-cf-email').value;
      var message = document.getElementById('ae-cf-message').value;
      var subject = encodeURIComponent('Erstkontakt AERIS von ' + name);
      var body = encodeURIComponent(message + '\n\nAntwort an: ' + email);
      window.location.href = 'mailto:r.krieg.home@gmail.com?subject=' + subject + '&body=' + body;
    }
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      bookingAck.checked = false;
      bookingConfirmBtn.disabled = true;
      openLegal(bookingConfirmSection, document.querySelector('#ae-contact-form button[type="submit"]'));
    });
    bookingAck.addEventListener('change', function () {
      bookingConfirmBtn.disabled = !bookingAck.checked;
    });
    bookingConfirmBtn.addEventListener('click', function () {
      if (bookingConfirmBtn.disabled) return;
      closeLegal();
      sendContactMailto();
    });
  })();
