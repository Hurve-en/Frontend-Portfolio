/* Minimalist Calendar / Planner — script.js
   - Month switching
   - Add / edit / delete events
   - Highlight today / selected day
   - Persist in localStorage (mini-planner-v1)
   - Accessible modal and keyboard-friendly controls
*/

/* -------- Storage & State -------- */
const STORAGE_KEY = 'mini-planner-v1';

// Basic app state
const appState = {
  viewDate: new Date(),    // current month view (Date)
  selectedDate: null,      // ISO 'YYYY-MM-DD' for day selected
  events: {}               // map dateStr -> [events]
};

// DOM refs
const daysGrid = document.getElementById('days-grid');
const currentMonthLabel = document.getElementById('current-month');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const todayBtn = document.getElementById('today-btn');
const selectedDateEl = document.getElementById('selected-date');
const selectedWeekdayEl = document.getElementById('selected-weekday');
const eventsList = document.getElementById('events-list');
const addEventBtn = document.getElementById('add-event');

const modal = document.getElementById('modal');
const evtForm = document.getElementById('event-form');
const evtTitle = document.getElementById('evt-title');
const evtTime = document.getElementById('evt-time');
const evtDesc = document.getElementById('evt-desc');
const evtDate = document.getElementById('evt-date');
const saveEventBtn = document.getElementById('save-event');
const cancelEventBtn = document.getElementById('cancel-event');
const deleteEventBtn = document.getElementById('delete-event');

let editingEvent = null; // { id, dateStr } when editing, null when creating

/* -------- Utilities -------- */
// Format date to YYYY-MM-DD
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}
function fromISODate(iso) {
  const [y,m,dd] = iso.split('-').map(Number);
  return new Date(y,m-1,dd);
}
function niceMonthYear(d) {
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}
function weekdayName(d) {
  return d.toLocaleString(undefined, { weekday: 'long' });
}

// load & save
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.viewDate) appState.viewDate = new Date(parsed.viewDate);
    if (parsed.selectedDate) appState.selectedDate = parsed.selectedDate;
    if (parsed.events) appState.events = parsed.events;
  } catch (e) {
    console.warn('Load failed', e);
  }
}
function saveState() {
  const toSave = {
    viewDate: appState.viewDate.toISOString(),
    selectedDate: appState.selectedDate,
    events: appState.events
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

/* -------- Rendering calendar -------- */
function renderCalendar() {
  // Clear grid
  daysGrid.innerHTML = '';

  const view = new Date(appState.viewDate.getFullYear(), appState.viewDate.getMonth(), 1);
  currentMonthLabel.textContent = niceMonthYear(view);

  const firstWeekday = new Date(view.getFullYear(), view.getMonth(), 1).getDay(); // 0..6
  const daysInMonth = new Date(view.getFullYear(), view.getMonth()+1, 0).getDate();

  // prev month's tail
  const prevMonthDays = firstWeekday;
  const prevMonthLastDate = new Date(view.getFullYear(), view.getMonth(), 0).getDate();

  // we will display 6 rows of 7 = 42 cells to keep layout stable
  const totalCells = 42;
  let dayCounter = 0;

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'day';
    cell.setAttribute('role','gridcell');
    // compute corresponding date
    let cellDate;
    if (i < prevMonthDays) {
      const d = prevMonthLastDate - prevMonthDays + 1 + i;
      cellDate = new Date(view.getFullYear(), view.getMonth()-1, d);
      cell.classList.add('out');
    } else if (i >= prevMonthDays + daysInMonth) {
      const d = i - (prevMonthDays + daysInMonth) + 1;
      cellDate = new Date(view.getFullYear(), view.getMonth()+1, d);
      cell.classList.add('out');
    } else {
      const d = i - prevMonthDays + 1;
      cellDate = new Date(view.getFullYear(), view.getMonth(), d);
    }

    const iso = toISODate(cellDate);
    const num = document.createElement('div');
    num.className = 'num';
    num.textContent = cellDate.getDate();
    cell.appendChild(num);

    // dots for events
    const dots = document.createElement('div');
    dots.className = 'events-dot';
    const evs = appState.events[iso] || [];
    // show up to 3 dots (distinct colors by time)
    evs.slice(0,3).forEach((e, idx) => {
      const dot = document.createElement('div');
      dot.className = 'event-dot';
      // color hint based on presence of time or not
      dot.style.background = e.time ? 'var(--accent-2)' : 'var(--accent)';
      dots.appendChild(dot);
    });
    cell.appendChild(dots);

    // today highlighting
    const todayIso = toISODate(new Date());
    if (iso === todayIso) {
      cell.classList.add('today');
    }
    // selected
    if (iso === appState.selectedDate) {
      cell.classList.add('selected');
    }

    // click => select day
    cell.addEventListener('click', () => {
      appState.selectedDate = iso;
      saveState();
      renderCalendar();
      renderSelectedDay();
    });

    // keyboard: allow focusing days (make them tab-focusable)
    cell.setAttribute('tabindex','0');
    cell.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        cell.click();
      }
    });

    daysGrid.appendChild(cell);
    dayCounter++;
  }
}

/* -------- Selected day & events rendering -------- */
function renderSelectedDay() {
  if (!appState.selectedDate) {
    selectedDateEl.textContent = '—';
    selectedWeekdayEl.textContent = 'Select a day';
    eventsList.innerHTML = `<p class="muted small">No day selected — choose a day on the calendar.</p>`;
    return;
  }
  const d = fromISO(appState.selectedDate);
  selectedDateEl.textContent = d.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
  selectedWeekdayEl.textContent = weekdayName(d);

  const evs = (appState.events[appState.selectedDate] || []).slice().sort((a,b) => {
    // sort by time (empty times at end)
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  if (evs.length === 0) {
    eventsList.innerHTML = `<p class="muted small">No events for this day. Click +Add to create one.</p>`;
    return;
  }

  eventsList.innerHTML = '';
  evs.forEach(ev => {
    const item = document.createElement('div');
    item.className = 'event-item';
    const time = ev.time ? `<div class="event-time">${ev.time}</div>` : `<div class="event-time muted small">All day</div>`;
    item.innerHTML = `
      <div class="meta">
        <div style="display:flex;flex-direction:column">
          <div class="title">${escapeHtml(ev.title)}</div>
          ${ev.desc ? `<div class="muted small">${escapeHtml(ev.desc)}</div>` : ''}
        </div>
        <div>${time}</div>
      </div>
    `;
    // clicking item => edit
    item.addEventListener('click', () => openModalForEdit(appState.selectedDate, ev.id));
    eventsList.appendChild(item);
  });
}

/* -------- Modal: create / edit events -------- */
function openModalForDate(dateIso) {
  editingEvent = null;
  evtForm.reset();
  evtDate.value = dateIso;
  deleteEventBtn.classList.add('hidden');
  modal.classList.remove('hidden');
  evtTitle.focus();
}
function openModalForEdit(dateIso, evId) {
  const evs = appState.events[dateIso] || [];
  const ev = evs.find(e => e.id === evId);
  if (!ev) return;
  editingEvent = { id:evId, date: dateIso };
  evtTitle.value = ev.title;
  evtTime.value = ev.time || '';
  evtDesc.value = ev.desc || '';
  evtDate.value = dateIso;
  deleteEventBtn.classList.remove('hidden');
  modal.classList.remove('hidden');
  evtTitle.focus();
}
function closeModal() {
  editingEvent = null;
  modal.classList.add('hidden');
  evtForm.reset();
}

/* save event from modal */
evtForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = evtTitle.value.trim();
  if (!title) return alert('Please add a title.');
  const time = evtTime.value || null;
  const desc = evtDesc.value.trim() || null;
  const dateStr = evtDate.value;
  if (!dateStr) return alert('Invalid date.');

  if (!appState.events[dateStr]) appState.events[dateStr] = [];
  if (editingEvent) {
    // update existing
    const arr = appState.events[editingEvent.date];
    const idx = arr.findIndex(x => x.id === editingEvent.id);
    if (idx !== -1) {
      arr[idx].title = title;
      arr[idx].time = time;
      arr[idx].desc = desc;
      // if edited date differs, move
      if (editingEvent.date !== dateStr) {
        arr.splice(idx,1);
        if (!appState.events[dateStr]) appState.events[dateStr] = [];
        appState.events[dateStr].push(arr[idx] || { id: editingEvent.id, title, time, desc });
      }
    }
  } else {
    // create new event
    const newEv = { id: 'e_' + Date.now().toString(36), title, time, desc };
    appState.events[dateStr].push(newEv);
  }

  saveState();
  closeModal();
  renderCalendar();
  // select day & show events
  appState.selectedDate = dateStr;
  renderSelectedDay();
});

/* cancel & delete handlers */
cancelEventBtn.addEventListener('click', () => closeModal());
deleteEventBtn.addEventListener('click', () => {
  if (!editingEvent) return;
  const arr = appState.events[editingEvent.date] || [];
  const idx = arr.findIndex(x => x.id === editingEvent.id);
  if (idx !== -1) arr.splice(idx,1);
  // cleanup empty arrays
  if (arr.length === 0) delete appState.events[editingEvent.date];
  saveState();
  closeModal();
  renderCalendar();
  if (appState.selectedDate === editingEvent.date) renderSelectedDay();
});

/* close modal on backdrop click */
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

/* keyboard escape to close modal */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
});

/* -------- Controls: navigation / add -------- */
prevMonthBtn.addEventListener('click', () => {
  appState.viewDate = new Date(appState.viewDate.getFullYear(), appState.viewDate.getMonth()-1, 1);
  saveState();
  renderCalendar();
});
nextMonthBtn.addEventListener('click', () => {
  appState.viewDate = new Date(appState.viewDate.getFullYear(), appState.viewDate.getMonth()+1, 1);
  saveState();
  renderCalendar();
});
todayBtn.addEventListener('click', () => {
  appState.viewDate = new Date();
  appState.selectedDate = toISODate(new Date());
  saveState();
  renderCalendar();
  renderSelectedDay();
});
addEventBtn.addEventListener('click', () => {
  const targetDate = appState.selectedDate || toISODate(new Date());
  openModalForDate(targetDate);
});

/* keyboard arrows for month switch when calendar focused */
daysGrid.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') prevMonthBtn.click();
  if (e.key === 'ArrowRight') nextMonthBtn.click();
});

/* -------- Init helpers -------- */
function fromISO(iso) { return fromISODate(iso); }

/* small escape helper */
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"']/g, function (m) {
    return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]);
  });
}

/* -------- Bootstrap -------- */
(function bootstrap(){
  loadState();
  // if no selected date, default to today
  if (!appState.selectedDate) appState.selectedDate = toISODate(new Date());
  renderCalendar();
  renderSelectedDay();
})();

// Save state on unload
window.addEventListener('beforeunload', saveState);
