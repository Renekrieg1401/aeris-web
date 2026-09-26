/* AERIS Buchhaltung – Application Logic */

const APP_VERSION = '2026-09-26-001';
const STORAGE_KEY_PIN_SET = 'ae-buchhaltung-pin-set';
const STORAGE_KEY_PIN_HASH = 'ae-buchhaltung-pin-hash';
const STORAGE_KEY_DATA = 'ae-buchhaltung-data';

window.dataPageVersion = APP_VERSION;
document.documentElement.setAttribute('data-page-version', APP_VERSION);

// Crypto: simple hash for PIN (NOT production-grade security)
async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'ae-salt-buchhaltung');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function aePinGateStart() {
  const isPinSet = localStorage.getItem(STORAGE_KEY_PIN_SET) === 'true';
  const pinForm = document.getElementById('ae-pin-form');
  const pinHint = document.getElementById('ae-pin-gate-hint');

  if (!pinForm) return;

  const pinInputs = Array.from({ length: 6 }).map((_, i) => {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.inputMode = 'numeric';
    inp.maxLength = '1';
    inp.pattern = '[0-9]';
    inp.className = 'ae-pin-input';
    inp.setAttribute('data-index', i);
    inp.style.cssText = `
      width: 2.5rem;
      height: 2.5rem;
      font-size: 1.5rem;
      text-align: center;
      background-color: #2D3A4D;
      border: 1px solid #3D4A60;
      border-radius: 0.5rem;
      color: #FFFFFF;
      font-weight: bold;
      transition: border-color 0.2s;
    `;

    inp.addEventListener('input', (e) => {
      if (e.target.value && /[0-9]/.test(e.target.value)) {
        if (i < 5) pinInputs[i + 1].focus();
      } else {
        e.target.value = '';
      }
    });

    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && i > 0) {
        pinInputs[i - 1].focus();
      } else if (e.key === 'Enter') {
        aePinSubmit();
      }
    });

    pinForm.appendChild(inp);
    return inp;
  });

  pinHint.textContent = isPinSet ? 'PIN eingeben zum Entsperren' : 'Neue PIN einrichten (6 Ziffern)';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.textContent = isPinSet ? 'Entsperren' : 'PIN speichern';
  submitBtn.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    background-color: #2B4570;
    color: #FFFFFF;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    margin-top: 1.5rem;
    transition: background-color 0.2s;
  `;
  submitBtn.addEventListener('click', aePinSubmit);
  submitBtn.addEventListener('mouseover', () => submitBtn.style.backgroundColor = '#3A5580');
  submitBtn.addEventListener('mouseout', () => submitBtn.style.backgroundColor = '#2B4570');
  pinForm.appendChild(submitBtn);

  pinInputs[0].focus();

  async function aePinSubmit() {
    const pin = pinInputs.map(inp => inp.value).join('');
    if (pin.length !== 6) {
      pinHint.textContent = '❌ Alle 6 Ziffern erforderlich';
      pinHint.style.color = '#FF6B6B';
      return;
    }

    const hash = await hashPin(pin);

    if (!isPinSet) {
      localStorage.setItem(STORAGE_KEY_PIN_SET, 'true');
      localStorage.setItem(STORAGE_KEY_PIN_HASH, hash);
      pinHint.textContent = '✓ PIN gespeichert. App wird entsperrt…';
      pinHint.style.color = '#A8E6A1';
      setTimeout(aePinGateHide, 800);
    } else {
      const storedHash = localStorage.getItem(STORAGE_KEY_PIN_HASH);
      if (hash === storedHash) {
        aePinGateHide();
      } else {
        pinHint.textContent = '❌ PIN falsch';
        pinHint.style.color = '#FF6B6B';
        pinInputs.forEach(inp => {
          inp.value = '';
          inp.style.borderColor = '#FF6B6B';
        });
        setTimeout(() => {
          pinInputs.forEach(inp => inp.style.borderColor = '#3D4A60');
          pinInputs[0].focus();
        }, 1500);
      }
    }
  }
}

function aePinGateHide() {
  const pinGate = document.getElementById('ae-pin-gate');
  const appRoot = document.getElementById('ae-app-root');
  if (pinGate) pinGate.classList.add('ae-legal-hidden');
  if (appRoot) appRoot.classList.remove('ae-legal-hidden');
  aeAppInit();
}

function aeAppInit() {
  aeTabSetup();
  aeHeaderLinks();
  loadAppData();
}

function aeTabSetup() {
  const tabs = document.querySelectorAll('[role="tab"]');
  const panels = document.querySelectorAll('[role="tabpanel"]');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.setAttribute('aria-selected', 'false');
        t.classList.remove('active');
      });
      panels.forEach(p => p.classList.remove('active'));

      tab.setAttribute('aria-selected', 'true');
      tab.classList.add('active');

      const panelId = tab.getAttribute('aria-controls');
      const panel = document.getElementById(panelId);
      if (panel) panel.classList.add('active');
    });
  });
}

function aeHeaderLinks() {
  const docsLink = document.querySelector('a[href="#doku"]');
  if (docsLink) {
    docsLink.addEventListener('click', (e) => {
      e.preventDefault();
      const docsUrl = '../aeris-app-finanz/index.html';
      window.location.href = docsUrl;
    });
  }
}

function loadAppData() {
  const data = localStorage.getItem(STORAGE_KEY_DATA);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      // Placeholder: würde hier Daten in der UI laden
    } catch (e) {
      console.warn('App data corrupt:', e);
    }
  }
}

function saveAppData(data) {
  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => {
    console.warn('Service Worker registration failed:', err);
  });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', aePinGateStart);
