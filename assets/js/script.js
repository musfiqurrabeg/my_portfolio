/* ═══════════════════════════════════════════════
   PORTFOLIO SCRIPT — script.js
   Data layer: localStorage + defaults from data.json
═══════════════════════════════════════════════ */

// ── DATA LAYER ────────────────────────────────────
function getData(key) {
  try {
    if (!DEFAULTS) {
      console.error('DEFAULTS not loaded yet.');
      return [];
    }
    const raw = localStorage.getItem('portfolio_' + key);
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULTS[key] || []));
  } catch (e) {
    console.error('Error loading data for key:', key, e);
    return (DEFAULTS && DEFAULTS[key]) || [];
  }
}

// ── DOM READY ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  dataReady.then(() => {
    initSidebar();
    initTabs();
    initAbout();
    initResume();
    initPortfolio();
    initContact();
    initModal();
  });
});

// ── STORAGE SYNC ───────────────────────────────────
// Three mechanisms to detect admin panel changes:
// 1. Native 'storage' event — fires instantly on OTHER tabs when localStorage changes
// 2. visibilitychange — refreshes when user switches back to this tab
// 3. Polling fallback — checks every 2 seconds as safety net

let lastStorageState = {};

function reloadSection(key) {
  if (key === 'profile') {
    initSidebar();
    initAbout();
  } else if (key === 'services') {
    initAbout();
  } else if (key === 'experience' || key === 'education' || key === 'skills') {
    skillsAnimated = false;
    initResume();
  } else if (key === 'projects') {
    initPortfolio();
  }
}

// 1. Instant cross-tab sync via native storage event
window.addEventListener('storage', e => {
  if (!e.key || !e.key.startsWith('portfolio_')) return;
  const key = e.key.replace('portfolio_', '');
  lastStorageState[key] = e.newValue || '';
  console.log('✓ Storage event — change detected:', key);
  reloadSection(key);
});

// 2. Refresh all sections when user switches back to this tab
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !DEFAULTS) return;
  const keys = ['profile', 'services', 'experience', 'education', 'skills', 'projects'];
  keys.forEach(key => {
    const raw = localStorage.getItem('portfolio_' + key) || '';
    if (raw !== (lastStorageState[key] || '')) {
      lastStorageState[key] = raw;
      console.log('✓ Tab focus — change detected:', key);
      reloadSection(key);
    }
  });
});

// 3. Polling fallback (catches edge cases)
function checkForStorageChanges() {
  if (!DEFAULTS) return;
  const keys = ['profile', 'services', 'experience', 'education', 'skills', 'projects'];
  
  keys.forEach(key => {
    const raw = localStorage.getItem('portfolio_' + key);
    const current = raw || '';
    const cached = lastStorageState[key];
    
    // Skip the very first check (initial population)
    if (cached === undefined) {
      lastStorageState[key] = current;
      return;
    }
    
    if (current !== cached) {
      lastStorageState[key] = current;
      console.log('✓ Poll — change detected:', key);
      reloadSection(key);
    }
  });
}

setInterval(checkForStorageChanges, 2000);

// ── SIDEBAR ───────────────────────────────────────
function initSidebar() {
  const p = getData('profile');
  if (!p || !p.name) return; // Profile not loaded yet

  const phone = p.phone || '';
  setText('sidebarName', p.name);
  setText('sidebarRoleBadge', p.role);
  setAttr('sidebarEmail', 'href', 'mailto:' + (p.email || ''));
  setText('sidebarEmail', p.email);
  setAttr('sidebarPhone', 'href', 'tel:' + phone.replace(/\s/g, ''));
  setText('sidebarPhone', phone);
  setText('sidebarLocation', p.location);
  // Social Links
  ['Github', 'Linkedin', 'Twitter', 'Facebook', 'Instagram'].forEach(sn => {
    const el = document.getElementById('social' + sn);
    const lnk = p[sn.toLowerCase()];
    if (el) {
      el.href = lnk || '#';
      el.style.display = 'inline-flex';
    }
  });

  // Avatar
  if (p.avatar) {
    const img = document.getElementById('sidebarAvatarImg');
    const initials = document.getElementById('sidebarAvatarInitials');
    if (img) {
      img.src = p.avatar;
      img.style.display = 'block';
    }
    if (initials) initials.style.display = 'none';
  }

  // Contact toggle (mobile) — only bind once
  const toggle = document.getElementById('contactToggle');
  const block  = document.getElementById('contactBlock');
  if (toggle && block && !toggle._listenerBound) {
    toggle._listenerBound = true;
    toggle.addEventListener('click', () => {
      const open = block.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      toggle.querySelector('span').textContent = open ? 'Hide Contacts' : 'Show Contacts';
    });
  }
}

// ── TABS ──────────────────────────────────────────
function initTabs() {
  const navBtns  = document.querySelectorAll('.nav-btn');
  const bnavBtns = document.querySelectorAll('.bnav-btn');
  const panels   = document.querySelectorAll('.tab-panel');

  function switchTab(tab) {
    navBtns.forEach(b  => b.classList.toggle('active', b.dataset.tab === tab));
    bnavBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    panels.forEach(p => {
      const active = p.id === 'tab-' + tab;
      p.classList.toggle('active', active);
      // Trigger skill bars when resume becomes active
      if (active && tab === 'resume') triggerSkillBars();
    });
    // Scroll to top on tab change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navBtns.forEach(b  => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  bnavBtns.forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
}

// ── ABOUT ─────────────────────────────────────────
function initAbout() {
  const p = getData('profile');
  const services = getData('services');

  const bioEl = document.getElementById('aboutBio');
  if (bioEl && p.bio) bioEl.textContent = p.bio;

  // Contact page sync
  const phone = (p && p.phone) || '';
  setAttr('contactEmail', 'href', 'mailto:' + ((p && p.email) || ''));
  setText('contactEmail', (p && p.email) || '');
  setAttr('contactPhone', 'href', 'tel:' + phone.replace(/\s/g, ''));
  setText('contactPhone', phone);

  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  grid.innerHTML = '';
  services.forEach(s => {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.innerHTML = `
      <div class="service-icon">${esc(s.icon)}</div>
      <div class="service-title">${esc(s.title)}</div>
      <div class="service-desc">${esc(s.desc)}</div>
    `;
    grid.appendChild(card);
  });
}

// ── RESUME ────────────────────────────────────────
function initResume() {
  renderTimeline('experienceTimeline', getData('experience'));
  renderTimeline('educationTimeline', getData('education'));
  renderSkills(getData('skills'));
}

function renderTimeline(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  if (!items || !items.length) {
    el.innerHTML = '<p style="color:var(--muted2);font-size:13px;">No items yet. Add them via admin panel.</p>';
    return;
  }
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'tl-item';
    div.innerHTML = `
      <div class="tl-left">
        <div class="tl-dot"></div>
        <div class="tl-line"></div>
      </div>
      <div class="tl-body">
        <p class="tl-period">${esc(item.period)}</p>
        <p class="tl-title">${esc(item.title)}</p>
        <p class="tl-sub">${esc(item.org)}</p>
        ${item.desc ? `<p class="tl-desc">${esc(item.desc)}</p>` : ''}
      </div>
    `;
    el.appendChild(div);
  });
}

function renderSkills(skills) {
  const grid = document.getElementById('skillsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!skills || !skills.length) {
    grid.innerHTML = '<p class="empty-state">No skills yet. Add via admin panel.</p>';
    return;
  }
  skills.forEach(s => {
    const item = document.createElement('div');
    item.className = 'skill-item';
    const safePct = parseInt(s.pct) || 0;
    item.innerHTML = `
      <div class="skill-header">
        <span class="skill-name">${esc(s.name)}</span>
        <span class="skill-pct">${safePct}%</span>
      </div>
      <div class="skill-bar-bg">
        <div class="skill-bar-fill" data-pct="${safePct}"></div>
      </div>
    `;
    grid.appendChild(item);
  });
}

let skillsAnimated = false;
function triggerSkillBars() {
  if (skillsAnimated) return;
  skillsAnimated = true;
  setTimeout(() => {
    document.querySelectorAll('.skill-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.pct + '%';
    });
  }, 80);
}

// ── PORTFOLIO ─────────────────────────────────────
function initPortfolio() {
  renderPortfolio();
}

function renderPortfolio() {
  const grid = document.getElementById('portfolioGrid');
  if (!grid) return;
  const projects = getData('projects');
  grid.innerHTML = '';

  if (!projects || !projects.length) {
    grid.innerHTML = '<p class="empty-state">No projects yet. Add via admin panel.</p>';
    return;
  }

  projects.forEach(p => {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.id = p.id;
    card.innerHTML = `
      <div class="project-thumb">
        ${p.thumb
          ? `<img src="${esc(p.thumb)}" alt="${esc(p.title)}" loading="lazy" />`
          : `<div class="project-thumb-placeholder">${esc(p.thumbEmoji || '📦')}</div>`
        }
        <div class="project-overlay">
          <div class="project-overlay-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
        </div>
      </div>
      <div class="project-info">
        <h3 class="project-title">${esc(p.title)}</h3>
        <button class="project-view-btn">View
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    `;
    card.addEventListener('click', () => openModal(p));
    grid.appendChild(card);
  });
}

// ── MODAL ─────────────────────────────────────────
function initModal() {
  const backdrop = document.getElementById('modalBackdrop');
  const closeBtn = document.getElementById('modalClose');
  if (!backdrop || !closeBtn) return;

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

function openModal(p) {
  const modalImg = document.getElementById('modalImg');
  if (p.thumb) {
    modalImg.src = p.thumb;
    modalImg.alt = p.title;
  } else {
    modalImg.removeAttribute('src');
    modalImg.alt = '';
  }

  document.getElementById('modalYear').textContent  = p.year;
  document.getElementById('modalTitle').textContent = p.title;
  document.getElementById('modalDesc').textContent  = p.desc;
  document.getElementById('modalCta').href    = p.liveUrl || '#';

  const tagsEl = document.getElementById('modalTags');
  tagsEl.innerHTML = (p.tags || []).map(t => `<span class="modal-tag">${esc(t)}</span>`).join('');

  // Hide img if no thumb
  const imgWrap = document.querySelector('.modal-img-wrap');
  if (imgWrap) imgWrap.style.display = p.thumb ? 'block' : 'none';

  document.getElementById('modalBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}

// ── CONTACT FORM ──────────────────────────────────
function initContact() {
  const form = document.getElementById('contactForm');
  if (!form || form._listenerBound) return;
  form._listenerBound = true;

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    const name    = document.getElementById('formName');
    const email   = document.getElementById('formEmail');
    const message = document.getElementById('formMessage');

    clearErr('errName'); clearErr('errEmail'); clearErr('errMessage');
    name.classList.remove('error'); email.classList.remove('error'); message.classList.remove('error');

    if (!name.value.trim()) {
      showErr('errName', 'Name is required');
      name.classList.add('error');
      valid = false;
    }
    if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      showErr('errEmail', 'Valid email required');
      email.classList.add('error');
      valid = false;
    }
    if (!message.value.trim() || message.value.trim().length < 10) {
      showErr('errMessage', 'Message too short (min 10 chars)');
      message.classList.add('error');
      valid = false;
    }

    if (!valid) return;

    // Simulate send
    const btn = form.querySelector('.submit-btn');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Sending…';

    setTimeout(() => {
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Send Message';
      document.getElementById('formSuccess').textContent = '✓ Message sent successfully!';
      form.reset();
      setTimeout(() => { document.getElementById('formSuccess').textContent = ''; }, 4000);
    }, 1200);
  });
}

// ── UTILS ─────────────────────────────────────────
function esc(str) {
  if (str == null) return '';
  if (typeof str !== 'string') return String(str);
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setAttr(id, attr, val) {
  const el = document.getElementById(id);
  if (el) el.setAttribute(attr, val);
}

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErr(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = '';
}
