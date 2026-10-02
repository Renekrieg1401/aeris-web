(function () {
  // ---------- API-Basis (Backend-Scaffold, server/index.js, Port 3010) ----------
  // KORREKTUR-POTENZIAL (frontend-ui -> backend-server): server/index.js setzt
  // aktuell keine CORS-Header. Fetches von hier (anderer Origin/Port, da die
  // Pool-Seiten separat statisch ausgeliefert werden) werden vom Browser
  // geblockt, bis der Scaffold `cors`-Middleware oder Express-Static-Serving
  // ergänzt. Diese Datei ist davon unabhängig korrekt — der Block ist ein
  // Laufzeit-/Deployment-Thema, kein Fehler in diesem Code.
  window.AERIS_POOL_API_BASE = 'http://localhost:3010';
  window.AERIS_POOL_SESSION_KEY = 'aeris_pool_session_token';

  // ---------- Sidebar (1:1 Mechanik aus aeris-web/app.js) ----------
  var menuToggle = document.getElementById('ae-menu-toggle');
  var sidebar = document.getElementById('ae-sidebar');
  var sidebarBackdrop = document.getElementById('ae-sidebar-backdrop');
  var sidebarClose = document.getElementById('ae-sidebar-close');
  if (menuToggle && sidebar && sidebarBackdrop && sidebarClose) {
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
    sidebar.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeSidebar); });
    document.addEventListener('keydown', function (e) { if (sidebarOpen && e.key === 'Escape') closeSidebar(); });
  }

  // ---------- Kleiner Fetch-Helper mit einheitlicher Fehlerbehandlung ----------
  window.aerisPoolFetch = async function (path, options) {
    options = options || {};
    var url = window.AERIS_POOL_API_BASE + path;
    try {
      var res = await fetch(url, options);
      var data = null;
      try { data = await res.json(); } catch (_e) { data = null; }
      return { ok: res.ok, status: res.status, data: data };
    } catch (networkErr) {
      // Typischer Fall im Scaffold-Stadium: CORS-Block oder Server nicht gestartet.
      return { ok: false, status: 0, data: null, networkError: true, message: String(networkErr) };
    }
  };

  window.AERIS_BUNDESLAENDER = [
    'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg',
    'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen',
    'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt',
    'Schleswig-Holstein', 'Thüringen',
  ];
  window.AERIS_STELLENBESCHREIBUNG_LABELS = {
    sucheStammkunde: 'Sucht Stammkunde(n)',
    bieteStammkunde: 'Bietet sich als Stammkraft an',
    sucheSpringer: 'Sucht Springer-Einsätze',
    bieteSpringer: 'Bietet sich als Springer an',
    mixStelle: 'Mix-Stelle (flexibel)',
  };
  window.AERIS_KALENDER_ART_LABELS = {
    springerVertretung: 'Springer-Vertretung gesucht',
    weitereStammkraftGesucht: 'Weitere Stammkraft gesucht',
  };
})();
