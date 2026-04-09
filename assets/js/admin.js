/* ═══════════════════════════════════════════════
   ADMIN.JS — Portfolio Admin Panel
═══════════════════════════════════════════════ */

// ── INITIALIZATION CHECK ──────────────────────────
console.log('✓ admin.js loaded');

// ── AUTH ──────────────────────────────────────────
// NOTE: Client-side only — credentials are visible in source.
// This is a demo-level guard, not real security.
const CREDENTIALS = { user: 'admin', pass: 'portfolio2024' };
const SESSION_KEY  = 'portfolio_admin_session';

function checkSession() {
  return localStorage.getItem(SESSION_KEY) === 'true';
}

function login(user, pass) {
  return user === CREDENTIALS.user && pass === CREDENTIALS.pass;
}

// ── STORAGE ───────────────────────────────────────
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

function saveData(key, val) {
  try {
    localStorage.setItem('portfolio_' + key, JSON.stringify(val));
    
    // Dispatch custom event for same-page updates
    window.dispatchEvent(new CustomEvent('portfolioDataChanged', {
      detail: { key, value: val }
    }));
    console.log('✓ Data saved and broadcasted:', key);
  } catch (e) {
    console.error('Error saving data for key:', key, e);
    alert('Failed to save. Storage may be full.');
  }
}

// ── SANITIZATION ────────────────────────────────────
// Trim and limit input sizes. HTML escaping is handled by the
// rendering layer (esc() in script.js / admin listItem) to
// avoid double-encoding.
function sanitizeInput(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength);
}

function sanitizeUrl(str) {
  if (typeof str !== 'string') return '#';
  str = str.trim();
  if (!str) return '';
  if (str === '#') return '#';
  // Allow http(s), protocol-relative, and relative URLs; block javascript: etc.
  if (/^(https?:\/\/|\/\/|\/|[a-zA-Z0-9._~-])/i.test(str) && !/^javascript:/i.test(str)) return str;
  return '#';
}

// ── ID GENERATION ─────────────────────────────────
function genId(items) {
  if (!items || !items.length) return 1;
  return Math.max(...items.map(i => i.id || 0)) + 1;
}

// ── INIT ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  dataReady.then(() => {
    initLogin();
    if (checkSession()) showAdmin();
  });
});

// ── LOGIN ─────────────────────────────────────────
function initLogin() {
  const loginBtn  = document.getElementById('loginBtn');
  const loginUser = document.getElementById('loginUser');
  const loginPass = document.getElementById('loginPass');
  const loginErr  = document.getElementById('loginErr');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!loginBtn || !loginUser || !loginPass) {
    console.error('Login elements not found in DOM');
    return;
  }

  function tryLogin() {
    const u = loginUser.value.trim();
    const p = loginPass.value;
    console.log('Login attempt with user:', u);
    if (login(u, p)) {
      console.log('✓ Login successful');
      localStorage.setItem(SESSION_KEY, 'true');
      showAdmin();
    } else {
      console.log('✗ Login failed - wrong credentials');
      if (loginErr) loginErr.textContent = 'Wrong username or password.';
      loginPass.value = '';
    }
  }

  loginBtn.addEventListener('click', tryLogin);
  loginPass.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
  loginUser.addEventListener('keydown', e => { if (e.key === 'Enter') loginPass.focus(); });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(SESSION_KEY);
      location.reload();
    });
  }
}

function showAdmin() {
  try {
    const loginScreen = document.getElementById('loginScreen');
    const adminLayout = document.getElementById('adminLayout');
    
    if (!loginScreen || !adminLayout) {
      console.error('Admin layout elements not found');
      return;
    }
    
    loginScreen.classList.add('hidden');
    adminLayout.style.display = 'flex';
    initAdmin();
  } catch (e) {
    console.error('Error showing admin panel:', e);
    alert('Error logging in. Check console for details.');
  }
}

// ── ADMIN ─────────────────────────────────────────
function initAdmin() {
  try {
    if (!DEFAULTS) {
      console.error('DEFAULTS not loaded. Make sure data.js is loaded first.');
      alert('Error: Data not loaded. Please refresh the page.');
      return;
    }
    
    initPanelNav();
    initProfilePanel();
    initListPanel('services',   'service',   servicesConfig());
    initListPanel('experience', 'exp',       experienceConfig());
    initListPanel('education',  'education', educationConfig());
    initListPanel('skills',     'skill',     skillsConfig());
    initListPanel('projects',   'proj',      projectsConfig());
  } catch (e) {
    console.error('Error initializing admin:', e);
    alert('Error initializing admin panel. Check console for details.');
  }
}

// ── PANEL NAV ─────────────────────────────────────
function initPanelNav() {
  const btns = document.querySelectorAll('.admin-nav-btn');
  btns.forEach(btn => {
    if (btn._navBound) return;
    btn._navBound = true;
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('panel-' + btn.dataset.panel).classList.add('active');
    });
  });
}

// ── PROFILE ───────────────────────────────────────
function initProfilePanel() {
  const p = getData('profile');
  setValue('pName',      p.name);
  setValue('pRole',      p.role);
  setValue('pEmail',     p.email);
  setValue('pPhone',     p.phone);
  setValue('pLocation',  p.location);
  setValue('pGithub',    p.github);
  setValue('pLinkedin',  p.linkedin);
  setValue('pUpwork',    p.upwork);
  setValue('pTwitter',   p.twitter);
  setValue('pFacebook',  p.facebook);
  setValue('pInstagram', p.instagram);
  setValue('pAvatar',    p.avatar);
  setValue('pBio',       p.bio);

  const saveProfileBtn = document.getElementById('saveProfile');
  if (saveProfileBtn && !saveProfileBtn._bound) {
    saveProfileBtn._bound = true;
    saveProfileBtn.addEventListener('click', () => {
    const updated = {
      name:      sanitizeInput(val('pName'), 100),
      role:      sanitizeInput(val('pRole'), 80),
      email:     sanitizeInput(val('pEmail'), 100),
      phone:     sanitizeInput(val('pPhone'), 30),
      location:  sanitizeInput(val('pLocation'), 100),
      github:    sanitizeUrl(val('pGithub')),
      linkedin:  sanitizeUrl(val('pLinkedin')),
      upwork:    sanitizeUrl(val('pUpwork')),
      twitter:   sanitizeUrl(val('pTwitter')),
      facebook:  sanitizeUrl(val('pFacebook')),
      instagram: sanitizeUrl(val('pInstagram')),
      avatar:    sanitizeUrl(val('pAvatar')),
      bio:       sanitizeInput(val('pBio'), 1000),
    };
    saveData('profile', updated);
    flash('profileFlash');
  });
  }
}

// ── GENERIC LIST PANEL ────────────────────────────
// config = { dataKey, listId, formId, formTitleId, addBtnId, saveBtnId, cancelBtnId, flashId,
//            fields[], renderItem(item) }
function initListPanel(dataKey, _prefix, config) {
  const addBtn    = document.getElementById(config.addBtnId);
  const form      = document.getElementById(config.formId);
  const saveBtn   = document.getElementById(config.saveBtnId);
  const cancelBtn = document.getElementById(config.cancelBtnId);
  const titleEl   = document.getElementById(config.formTitleId);
  const listEl    = document.getElementById(config.listId);

  // Validate all required elements exist
  if (!addBtn || !form || !saveBtn || !cancelBtn || !titleEl || !listEl) {
    console.warn(`Skipping panel initialization for "${dataKey}": Missing required elements`);
    return;
  }

  renderList(dataKey, config);

  // Guard: only bind event listeners once per panel
  if (listEl._bound) return;
  listEl._bound = true;

  let editingId = null;

  addBtn.addEventListener('click', () => {
    editingId = null;
    titleEl.textContent = 'New ' + config.label;
    config.fields.forEach(f => setValue(f.id, f.default != null ? f.default : ''));
    if (config.onFormOpen) config.onFormOpen(null);
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  cancelBtn.addEventListener('click', () => {
    form.style.display = 'none';
    editingId = null;
  });

  saveBtn.addEventListener('click', () => {
    if (saveBtn.disabled) return;
    saveBtn.disabled = true;

    const items = getData(dataKey);
    const newItem = { id: editingId || genId(items) };
    config.fields.forEach(f => {
      let value = f.transform ? f.transform(val(f.id)) : val(f.id);
      // Auto-sanitize string fields except arrays and numbers
      if (typeof value === 'string' && !Array.isArray(value)) {
        value = sanitizeInput(value, 500);
      }
      newItem[f.key] = value;
    });
    if (config.computeExtra) Object.assign(newItem, config.computeExtra(newItem));

    if (editingId) {
      const idx = items.findIndex(i => i.id == editingId);
      if (idx !== -1) items[idx] = newItem;
      else items.push(newItem);
    } else {
      items.push(newItem);
    }
    saveData(dataKey, items);
    
    // UI Updates
    flash(config.flashId);
    renderList(dataKey, config);
    form.style.display = 'none';
    editingId = null;
    
    setTimeout(() => { saveBtn.disabled = false; }, 300);
  });

  // Event delegation for edit/delete
  listEl.addEventListener('click', e => {
    const editBtn = e.target.closest('[data-action="edit"]');
    const delBtn  = e.target.closest('[data-action="del"]');

    if (editBtn) {
      const id = parseInt(editBtn.dataset.id);
      const items = getData(dataKey);
      const item = items.find(i => i.id === id);
      if (!item) return;
      editingId = id;
      titleEl.textContent = 'Edit ' + config.label;
      config.fields.forEach(f => setValue(f.id, item[f.key] !== undefined ? item[f.key] : ''));
      if (config.onFormOpen) config.onFormOpen(item);
      form.style.display = 'block';
      form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (delBtn) {
      const id = parseInt(delBtn.dataset.id);
      if (!confirm('Delete this item?')) return;
      const items = getData(dataKey).filter(i => i.id != id);
      saveData(dataKey, items);
      
      const flashEl = document.getElementById(config.flashId);
      if (flashEl) {
        const origText = flashEl.textContent;
        flashEl.textContent = 'Deleted item';
        flash(config.flashId);
        setTimeout(() => { flashEl.textContent = origText; }, 2000);
      }
      
      renderList(dataKey, config);
    }
  });
}

function renderList(dataKey, config) {
  const el = document.getElementById(config.listId);
  const items = getData(dataKey);
  if (!el) return;
  if (!items || !items.length) {
    el.innerHTML = '<p style="color:var(--muted-2);font-family:var(--font-m);font-size:12px;padding:16px 0;">No items yet. Click Add to get started.</p>';
    return;
  }
  el.innerHTML = items.map(item => config.renderItem(item)).join('');
}

function listItem(id, title, sub) {
  return `
    <div class="list-item">
      <div class="list-item-body">
        <div class="list-item-title">${esc(title)}</div>
        ${sub ? `<div class="list-item-sub">${esc(sub)}</div>` : ''}
      </div>
      <div class="list-item-actions">
        <button class="item-btn edit" data-action="edit" data-id="${id}">Edit</button>
        <button class="item-btn del"  data-action="del"  data-id="${id}">Delete</button>
      </div>
    </div>
  `;
}

// HTML escaping for safe innerHTML insertion
function esc(str) {
  if (typeof str !== 'string') return String(str != null ? str : '');
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── CONFIGS ───────────────────────────────────────
function servicesConfig() {
  return {
    label: 'Service', dataKey: 'services',
    listId: 'servicesList', formId: 'serviceForm', formTitleId: 'serviceFormTitle',
    addBtnId: 'addServiceBtn', saveBtnId: 'saveService', cancelBtnId: 'cancelService',
    flashId: 'serviceFlash',
    fields: [
      { id: 'sIcon',  key: 'icon',  default: '⚡' },
      { id: 'sTitle', key: 'title', default: '' },
      { id: 'sDesc',  key: 'desc',  default: '' },
    ],
    renderItem: item => listItem(item.id, item.icon + ' ' + item.title, item.desc),
  };
}

function experienceConfig() {
  return {
    label: 'Experience', dataKey: 'experience',
    listId: 'experienceList', formId: 'expForm', formTitleId: 'expFormTitle',
    addBtnId: 'addExpBtn', saveBtnId: 'saveExp', cancelBtnId: 'cancelExp',
    flashId: 'expFlash',
    fields: [
      { id: 'eperiod', key: 'period', default: '' },
      { id: 'etitle',  key: 'title',  default: '' },
      { id: 'eorg',    key: 'org',    default: '' },
      { id: 'edesc',   key: 'desc',   default: '' },
    ],
    renderItem: item => listItem(item.id, item.title, item.org + ' · ' + item.period),
  };
}

function educationConfig() {
  return {
    label: 'Education', dataKey: 'education',
    listId: 'educationList', formId: 'eduForm', formTitleId: 'eduFormTitle',
    addBtnId: 'addEduBtn', saveBtnId: 'saveEdu', cancelBtnId: 'cancelEdu',
    flashId: 'eduFlash',
    fields: [
      { id: 'eduPeriod', key: 'period', default: '' },
      { id: 'eduTitle',  key: 'title',  default: '' },
      { id: 'eduOrg',    key: 'org',    default: '' },
      { id: 'eduDesc',   key: 'desc',   default: '' },
    ],
    renderItem: item => listItem(item.id, item.title, item.org + ' · ' + item.period),
  };
}

function skillsConfig() {
  // Range slider sync — bind once
  const range = document.getElementById('skPct');
  const rangeVal = document.getElementById('skPctVal');
  if (range && rangeVal && !range._bound) {
    range._bound = true;
    range.addEventListener('input', () => { rangeVal.textContent = range.value + '%'; });
  }

  return {
    label: 'Skill', dataKey: 'skills',
    listId: 'skillsList', formId: 'skillForm', formTitleId: 'skillFormTitle',
    addBtnId: 'addSkillBtn', saveBtnId: 'saveSkill', cancelBtnId: 'cancelSkill',
    flashId: 'skillFlash',
    fields: [
      { id: 'skName', key: 'name', default: '' },
      { id: 'skPct',  key: 'pct',  default: 75, transform: v => parseInt(v) },
    ],
    onFormOpen: item => {
      const rangeVal = document.getElementById('skPctVal');
      const range    = document.getElementById('skPct');
      if (item) { range.value = item.pct; rangeVal.textContent = item.pct + '%'; }
      else       { range.value = 75;      rangeVal.textContent = '75%'; }
    },
    renderItem: item => listItem(item.id, item.name, item.pct + '% proficiency'),
  };
}

function projectsConfig() {
  return {
    label: 'Project', dataKey: 'projects',
    listId: 'projectsList', formId: 'projForm', formTitleId: 'projFormTitle',
    addBtnId: 'addProjBtn', saveBtnId: 'saveProj', cancelBtnId: 'cancelProj',
    flashId: 'projFlash',
    fields: [
      { id: 'prTitle',   key: 'title',   default: '' },
      { id: 'prYear',    key: 'year',    default: new Date().getFullYear().toString() },
      { id: 'prEmoji',   key: 'thumbEmoji', default: '📦' },
      { id: 'prThumb',   key: 'thumb',   default: '' },
      { id: 'prExcerpt', key: 'excerpt', default: '' },
      { id: 'prDesc',    key: 'desc',    default: '' },
      { id: 'prTags',    key: 'tags',    default: '', transform: v => v.split(',').map(t => t.trim()).filter(Boolean) },
      { id: 'prUrl',     key: 'liveUrl', default: '#' },
    ],
    onFormOpen: item => {
      if (item && item.tags) setValue('prTags', Array.isArray(item.tags) ? item.tags.join(', ') : item.tags);
    },
    renderItem: item => listItem(item.id, item.title, item.year || ''),
  };
}

// ── UTILS ─────────────────────────────────────────
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function setValue(id, v) {
  const el = document.getElementById(id);
  if (el) el.value = v !== undefined && v !== null ? v : '';
}

function flash(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 2000);
}
