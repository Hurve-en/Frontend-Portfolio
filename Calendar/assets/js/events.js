/** ===============================
 *  EVENTS.JS - Event Management
 *  =============================== */

const EventsView = (() => {
  // DOM references
  const selectedDateEl = document.getElementById("selected-date");
  const selectedWeekdayEl = document.getElementById("selected-weekday");
  const eventsList = document.getElementById("events-list");

  // Render selected day and its events
  function renderSelectedDay(appState) {
    if (!appState.selectedDate) {
      selectedDateEl.textContent = "—";
      selectedWeekdayEl.textContent = "Select a day";
      eventsList.innerHTML = `<p class="muted small">No day selected — choose a day on the calendar.</p>`;
      return;
    }

    const d = Utils.fromISODate(appState.selectedDate);
    selectedDateEl.textContent = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    selectedWeekdayEl.textContent = Utils.weekdayName(d);

    const evs = (appState.events[appState.selectedDate] || [])
      .slice()
      .sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });

    if (evs.length === 0) {
      eventsList.innerHTML = `<p class="muted small">No events for this day. Click +Add to create one.</p>`;
      return;
    }

    eventsList.innerHTML = "";
    evs.forEach((ev) => {
      const item = document.createElement("div");
      item.className = `event-item cat-${ev.category || "other"}`;

      const timeStr = ev.time
        ? `<div class="event-time">${ev.time}</div>`
        : `<div class="event-time muted small">All day</div>`;

      const categoryBadge = ev.category
        ? `<span class="event-category ${ev.category}">${ev.category.charAt(0).toUpperCase() + ev.category.slice(1)}</span>`
        : "";

      item.innerHTML = `
        <div class="meta">
          <div style="flex: 1">
            <div class="title">${Utils.escapeHtml(ev.title)}</div>
            ${ev.desc ? `<div class="muted small">${Utils.escapeHtml(ev.desc)}</div>` : ""}
            ${categoryBadge}
          </div>
          <div>${timeStr}</div>
        </div>
      `;

      item.addEventListener("click", () =>
        EventModal.openForEdit(appState, appState.selectedDate, ev.id),
      );
      eventsList.appendChild(item);
    });
  }

  // Add or update event
  function saveEvent(appState, dateStr, title, category, time, desc, eventId) {
    if (!appState.events[dateStr]) appState.events[dateStr] = [];

    if (eventId) {
      // Update existing - find old date first
      let oldDate = null;
      for (const [date, evs] of Object.entries(appState.events)) {
        const idx = evs.findIndex((e) => e.id === eventId);
        if (idx !== -1) {
          oldDate = date;
          break;
        }
      }

      if (oldDate) {
        const arr = appState.events[oldDate];
        const idx = arr.findIndex((e) => e.id === eventId);
        if (idx !== -1) {
          arr[idx].title = title;
          arr[idx].category = category;
          arr[idx].time = time;
          arr[idx].desc = desc;

          // Move to new date if changed
          if (oldDate !== dateStr) {
            const movedEvent = arr.splice(idx, 1)[0];
            appState.events[dateStr].push(movedEvent);
            if (arr.length === 0) delete appState.events[oldDate];
          }
        }
      }
    } else {
      // Create new
      const newEv = {
        id: "e_" + Date.now().toString(36),
        title,
        category,
        time,
        desc,
      };
      appState.events[dateStr].push(newEv);
    }

    StorageManager.saveState(appState);
  }

  // Delete event
  function deleteEvent(appState, dateStr, eventId) {
    const arr = appState.events[dateStr] || [];
    const idx = arr.findIndex((e) => e.id === eventId);
    if (idx !== -1) arr.splice(idx, 1);
    if (arr.length === 0) delete appState.events[dateStr];
    StorageManager.saveState(appState);
  }

  // Public API
  return {
    renderSelectedDay,
    saveEvent,
    deleteEvent,
  };
})();

/** ===============================
 *  EVENT MODAL.JS - Modal for event form
 *  =============================== */

const EventModal = (() => {
  const modal = document.getElementById("modal");
  const evtForm = document.getElementById("event-form");
  const evtTitle = document.getElementById("evt-title");
  const evtCategory = document.getElementById("evt-category");
  const evtTime = document.getElementById("evt-time");
  const evtDesc = document.getElementById("evt-desc");
  const evtDate = document.getElementById("evt-date");
  const saveEventBtn = document.getElementById("save-event");
  const cancelEventBtn = document.getElementById("cancel-event");
  const deleteEventBtn = document.getElementById("delete-event");

  let editingEventId = null;
  let editingDateStr = null;

  // Open modal to add event
  function openForDate(dateIso) {
    editingEventId = null;
    editingDateStr = null;
    evtForm.reset();
    evtDate.value = dateIso;
    evtCategory.value = "other";
    deleteEventBtn.classList.add("hidden");
    modal.classList.remove("hidden");
    evtTitle.focus();
  }

  // Open modal to edit event
  function openForEdit(appState, dateIso, evId) {
    const evs = appState.events[dateIso] || [];
    const ev = evs.find((e) => e.id === evId);
    if (!ev) return;
    editingEventId = evId;
    editingDateStr = dateIso;
    evtTitle.value = ev.title;
    evtCategory.value = ev.category || "other";
    evtTime.value = ev.time || "";
    evtDesc.value = ev.desc || "";
    evtDate.value = dateIso;
    deleteEventBtn.classList.remove("hidden");
    modal.classList.remove("hidden");
    evtTitle.focus();
  }

  // Close modal
  function close() {
    editingEventId = null;
    editingDateStr = null;
    modal.classList.add("hidden");
    evtForm.reset();
  }

  // Form submit handler
  evtForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = evtTitle.value.trim();
    if (!title) return alert("Please add a title.");

    const category = evtCategory.value || "other";
    const time = evtTime.value || null;
    const desc = evtDesc.value.trim() || null;
    const dateStr = evtDate.value;

    if (!dateStr) return alert("Invalid date.");

    // Save event through app state
    const appState = window.AppState;
    EventsView.saveEvent(
      appState,
      dateStr,
      title,
      category,
      time,
      desc,
      editingEventId,
    );

    close();
    CalendarView.render(appState);
    appState.selectedDate = dateStr;
    EventsView.renderSelectedDay(appState);
  });

  // Delete button
  deleteEventBtn.addEventListener("click", () => {
    if (!editingEventId || !editingDateStr) return;
    const appState = window.AppState;
    EventsView.deleteEvent(appState, editingDateStr, editingEventId);
    close();
    CalendarView.render(appState);
    if (appState.selectedDate === editingDateStr) {
      EventsView.renderSelectedDay(appState);
    }
  });

  // Cancel button
  cancelEventBtn.addEventListener("click", () => close());

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      close();
    }
  });

  // Public API
  return {
    openForDate,
    openForEdit,
    close,
  };
})();
