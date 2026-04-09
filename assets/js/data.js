/* ═══════════════════════════════════════════════
   PORTFOLIO DATA — Loader
   Fetches defaults from data.json.
   Edit data.json to update portfolio content.
═══════════════════════════════════════════════ */

let DEFAULTS = null;

// Empty fallback in case data.json fails to load
const EMPTY_DEFAULTS = {
  profile: { name: '', username: '', role: '', bio: '', email: '', phone: '', location: '', github: '#', linkedin: '#', twitter: '#', facebook: '#', instagram: '#', upwork: '#', avatar: '' },
  services: [],
  experience: [],
  education: [],
  skills: [],
  projects: [],
};

// Promise that resolves when DEFAULTS is ready
const dataReady = fetch('assets/data/data.json')
  .then(res => {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
  .then(data => {
    DEFAULTS = data;
    console.log('✓ data.json loaded');
  })
  .catch(err => {
    console.error('Failed to load data.json:', err);
    DEFAULTS = EMPTY_DEFAULTS;
  });
