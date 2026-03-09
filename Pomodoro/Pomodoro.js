/* script.js
   Vibe Pomodoro logic — vanilla JS.
   - Timer with start / pause / reset
   - SVG circle progress control
   - Settings modal + persisted settings
   - Tasks (add/complete/remove) persisted
   - Daily pomodoro counter persisted
   - Soft chime via WebAudio
*/

/* ===== Utilities & state ===== */
const LS_KEY = 'vibe-pomodoro-v1';

// Default config
const defaults = {
  settings: { focus: 25, short: 5, long: 15, autoReset: true, theme: 'dark' },
  tasks: [],
  daily: { date: todayKey(), done: 0 }
};

let state = loadState();
let timer = {
  mode: 'focus',        // 'focus' | 'short' | 'long'
  duration: seconds(state.settings.focus * 60),
  remaining: seconds(state.settings.focus * 60),
  running: false,
  interval: null
};

// DOM references
const timeDisplay = document.getElementById('time-display');
const labelDisplay = document.getElementById('session-label');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const tabs = document.querySelectorAll('.session-tabs .tab');
const ring = document.querySelector('.progress-ring .ring');
const counterDone = document.getElementById('counter-done');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const taskProgress = document.getElementById('task-progress');
const settingsModal = document.getElementById('settings-modal');
const openSettingsBtn = document.getElementById('open-settings');
const closeSettingsBtn = document.getElementById('close-settings');
const saveSettingsBtn = document.getElementById('save-settings');
const settingFocus = document.getElementById('setting-focus');
const settingShort = document.getElementById('setting-short');
const settingLong = document.getElementById('setting-long');
const settingAuto = document.getElementById('setting-auto');
const modeToggle = document.getElementById('mode-toggle');
const addPomodoroBtn = document.getElementById('add-pomodoro');
const clearCompletedBtn = document.getElementById('clear-completed');

// audio context for chime
let audioCtx = null;

/* ===== Initialization ===== */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  restoreSettingsUI();
  attachEventHandlers();
  renderTasks();
  updateDailyCounterUI();
  updateTaskProgressUI();
  setMode(timer.mode, false); // initialize UI
  drawRing(); // set initial circle dashoffset
});

/* ===== State persistence ===== */
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      localStorage.setItem(LS_KEY, JSON.stringify(defaults));
      return JSON.parse(JSON.stringify(defaults));
    }
    const parsed = JSON.parse(raw);

    // validate & fill defaults
    parsed.settings = Object.assign({}, defaults.settings, parsed.settings || {});
    parsed.tasks = parsed.tasks || [];
    // daily reset if date changed
    const today = todayKey();
    if (!parsed.daily || parsed.daily.date !== today) {
      parsed.daily = { date: today, done: 0 };
    }
    return parsed;
  } catch (e) {
    console.error('Load state failed', e);
    localStorage.setItem(LS_KEY, JSON.stringify(defaults));
    return JSON.parse(JSON.stringify(defaults));
  }
}

function saveState() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Save failed', e);
  }
}

/* ===== Timer helpers ===== */
function seconds(n) { return Math.round(n); }
function formatTime(s) {
  s = Math.max(0, Math.floor(s));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

/* ===== Timer core ===== */
function setMode(mode, resetRemaining = true) {
  timer.mode = mode;
  // choose duration from settings
  const min = (mode === 'focus') ? state.settings.focus : (mode === 'short' ? state.settings.short : state.settings.long);
  timer.duration = min * 60;
  if (resetRemaining) timer.remaining = timer.duration;
  updateTimerUI();
  // update active tab
  tabs.forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  labelDisplay.textContent = mode === 'focus' ? 'Focus' : (mode === 'short' ? 'Short Break' : 'Long Break');
  drawRing();
}

function updateTimerUI() {
  timeDisplay.textContent = formatTime(timer.remaining);
  // enable/disable buttons
  startBtn.disabled = timer.running;
  pauseBtn.disabled = !timer.running;
  resetBtn.disabled = !timer.running && timer.remaining === timer.duration;
  // set aria-labels
  startBtn.setAttribute('aria-pressed', String(timer.running));
}

function startTimer() {
  if (timer.running) return;
  timer.running = true;
  const startAt = Date.now();
  const endAt = startAt + timer.remaining * 1000;

  timer.interval = setInterval(() => {
    const now = Date.now();
    timer.remaining = Math.max(0, Math.round((endAt - now) / 1000));
    updateTimerUI();
    drawRing();
    if (timer.remaining <= 0) {
      stopTimer();
      onTimerEnd();
    }
  }, 250);

  updateTimerUI();
}

function pauseTimer() {
  if (!timer.running) return;
  timer.running = false;
  clearInterval(timer.interval);
  timer.interval = null;
  updateTimerUI();
}

function stopTimer() {
  timer.running = false;
  if (timer.interval) { clearInterval(timer.interval); timer.interval = null; }
  timer.remaining = 0;
  updateTimerUI();
}

function resetTimer() {
  pauseTimer();
  timer.remaining = timer.duration;
  updateTimerUI();
  drawRing();
}

function onTimerEnd() {
  playChime();
  // if focus finished => count as pomodoro done
  if (timer.mode === 'focus') {
    state.daily.done = (state.daily.done || 0) + 1;
    saveStateLocal();
    updateDailyCounterUI();
  }
  // auto behavior
  if (state.settings.autoReset) {
    // If focus -> go to short, if short -> focus, if long -> focus
    if (timer.mode === 'focus') setMode('short');
    else setMode('focus');
    // auto-start next? keep paused to give user control — design choice
    // startTimer(); // optional: auto-start next session
  } else {
    // leave at finished (0) and let user choose
  }
}

/* ===== SVG ring drawing ===== */
function drawRing() {
  // ring is an SVG circle r=48 -> circumference = 2πr
  const r = 48;
  const c = 2 * Math.PI * r;
  const progress = (timer.duration === 0) ? 0 : (timer.remaining / timer.duration);
  const offset = c * (1 - progress);
  if (ring) {
    ring.style.strokeDasharray = `${c} ${c}`;
    ring.style.strokeDashoffset = offset;
    // subtle color change for mode
    if (timer.mode === 'focus') ring.style.stroke = 'url(#grad)'; // fallback
    if (timer.mode === 'focus') ring.style.stroke = 'url(#)'; // not used; keep static color via CSS
  }
  timeDisplay.textContent = formatTime(timer.remaining);
}

/* ===== Event wiring ===== */
function attachEventHandlers() {
  // Start / pause / reset
  startBtn?.addEventListener('click', () => { startTimer(); });
  pauseBtn?.addEventListener('click', () => { pauseTimer(); });
  resetBtn?.addEventListener('click', () => { resetTimer(); });

  // Tabs
  tabs.forEach(t => t.addEventListener('click', (e) => {
    const mode = t.dataset.mode;
    setMode(mode, true);
  }));

  // Open/close settings
  openSettingsBtn?.addEventListener('click', () => { openSettings(); });
  closeSettingsBtn?.addEventListener('click', () => { closeSettings(); });
  saveSettingsBtn?.addEventListener('click', (ev) => {
    ev.preventDefault();
    saveSettingsFromUI();
    closeSettings();
  });

  // settings modal background close (click outside)
  settingsModal?.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettings();
  });

  // Task form submit
  taskForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;
    addTask(text);
    taskInput.value = '';
  });

  // quick add pomodoro
  addPomodoroBtn?.addEventListener('click', () => {
    state.daily.done = (state.daily.done || 0) + 1;
    saveStateLocal();
    updateDailyCounterUI();
  });

  // clear completed tasks
  clearCompletedBtn?.addEventListener('click', () => {
    state.tasks = state.tasks.filter(t => !t.done);
    saveStateLocal();
    renderTasks();
  });

  // theme toggle
  modeToggle?.addEventListener('click', () => {
    state.settings.theme = (state.settings.theme === 'dark') ? 'light' : 'dark';
    applyTheme();
    saveStateLocal();
  });

  // quick-mode radio buttons
  document.querySelectorAll('input[name="quick-mode"]').forEach(node => {
    node.addEventListener('change', (e) => {
      setMode(e.target.value, true);
    });
  });
}

/* ===== Tasks logic ===== */
function addTask(text) {
  const task = { id: 't_' + Date.now().toString(36), text, done: false, created: Date.now() };
  state.tasks.unshift(task);
  saveStateLocal();
  renderTasks();
  updateTaskProgressUI();
}

function toggleTaskDone(id) {
  const t = state.tasks.find(x => x.id === id);
  if (t) t.done = !t.done;
  saveStateLocal();
  renderTasks();
  updateTaskProgressUI();
}

function removeTask(id) {
  state.tasks = state.tasks.filter(x => x.id !== id);
  saveStateLocal();
  renderTasks();
  updateTaskProgressUI();
}

function renderTasks() {
  if (!taskList) return;
  taskList.innerHTML = '';
  state.tasks.forEach(t => {
    const li = document.createElement('li');
    li.className = 'task-item' + (t.done ? ' done' : '');
    li.innerHTML = `
      <input type="checkbox" ${t.done ? 'checked' : ''} aria-label="Mark done" />
      <div style="flex:1">${escapeHtml(t.text)}</div>
      <button class="btn small remove">✕</button>
    `;
    const checkbox = li.querySelector('input[type=checkbox]');
    checkbox.addEventListener('change', () => toggleTaskDone(t.id));
    li.querySelector('.remove').addEventListener('click', () => removeTask(t.id));
    taskList.appendChild(li);
  });
}

/* ===== Settings UI ===== */
function openSettings() {
  restoreSettingsUI();
  settingsModal.classList.remove('hidden');
}
function closeSettings() {
  settingsModal.classList.add('hidden');
}
function restoreSettingsUI() {
  settingFocus.value = state.settings.focus;
  settingShort.value = state.settings.short;
  settingLong.value = state.settings.long;
  settingAuto.checked = !!state.settings.autoReset;
}
function saveSettingsFromUI() {
  const f = Math.max(1, parseInt(settingFocus.value || 25));
  const s = Math.max(1, parseInt(settingShort.value || 5));
  const l = Math.max(1, parseInt(settingLong.value || 15));
  state.settings.focus = f;
  state.settings.short = s;
  state.settings.long = l;
  state.settings.autoReset = !!settingAuto.checked;
  saveStateLocal();
  // Update timer durations if current mode matches
  setMode(timer.mode, true);
}

/* ===== UI helpers ===== */
function updateDailyCounterUI() {
  counterDone.textContent = state.daily?.done || 0;
}

function updateTaskProgressUI() {
  const total = state.tasks.length;
  const done = state.tasks.filter(t => t.done).length;
  const pct = total === 0 ? 0 : Math.round(done / total * 100);
  taskProgress.textContent = pct + '%';
}

/* ===== Persistence helper (local update) ===== */
function saveStateLocal() {
  saveState(); // helper wrapper
  // slight wrapper to update UI
  saveState();
}
function saveState() { saveStateCore(); }
function saveStateCore() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { console.warn('Failed saving state', e); } }

/* ===== Audio chime (soft) ===== */
function playChime() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime); // A5
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 1.5);
  } catch (e) {
    console.warn('Audio failed', e);
  }
}

/* ===== small utilities ===== */
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]);
  });
}

/* ===== Theme application ===== */
function applyTheme() {
  const root = document.documentElement;
  const theme = state.settings.theme || 'dark';
  if (theme === 'light') root.classList.add('light'); else root.classList.remove('light');
  modeToggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
}

/* ===== Init helpers ===== */
function updateDailyIfNeeded() {
  const today = todayKey();
  if (!state.daily || state.daily.date !== today) {
    state.daily = { date: today, done: 0 };
    saveStateCore();
  }
}
updateDailyIfNeeded();

/* ===== small safety: handle unload ===== */
window.addEventListener('beforeunload', () => {
  // store current remaining/duration into state (optional)
  saveStateCore();
});
