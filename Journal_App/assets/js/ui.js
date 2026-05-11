/* UI Module - Display and rendering functions */

const UI = (() => {
  // Mood options
  const moods = [
    { id: "happy", emoji: "😊", label: "Happy" },
    { id: "neutral", emoji: "😐", label: "Neutral" },
    { id: "sad", emoji: "😢", label: "Sad" },
    { id: "angry", emoji: "😡", label: "Angry" },
    { id: "excited", emoji: "🤩", label: "Excited" },
    { id: "tired", emoji: "😴", label: "Tired" },
  ];

  // Update the greeting text based on time of day
  function updateGreeting() {
    const h = new Date().getHours();
    const greet =
      h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    document.getElementById("greeting").textContent = greet;
    document.getElementById("todayDate").textContent =
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
  }

  // Create mood filter buttons
  function renderMoodFilters() {
    const moodFiltersWrap = document.querySelector(".mood-filters");
    moodFiltersWrap.innerHTML = "";
    moods.forEach((m) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mood-chip";
      btn.dataset.mood = m.id;
      btn.innerHTML = `<span>${m.emoji}</span><span>${m.label}</span>`;
      btn.addEventListener("click", () => {
        btn.classList.toggle("active");
        Filters.renderEntriesList();
      });
      moodFiltersWrap.appendChild(btn);
    });
  }

  // Display the list of entries
  function renderEntriesList(filtered) {
    const entriesList = document.getElementById("entriesList");
    entriesList.innerHTML = "";

    if (!filtered.length) {
      entriesList.innerHTML = `<div class="muted">No entries found.</div>`;
      return;
    }

    filtered.forEach((e) => {
      const m = moods.find((x) => x.id === e.mood);
      const card = document.createElement("div");
      card.className = "entry-card";
      card.tabIndex = 0;
      card.innerHTML = `
        <div class="entry-meta">
          <div>
            <div class="entry-title">${e.title || "(No title)"}</div>
            <div class="entry-preview">${(e.body || "")
              .split("\n")[0]
              .slice(0, 100)}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div class="entry-date">${new Date(e.date).toLocaleDateString()}</div>
            <div class="entry-mood">${m ? m.emoji : "—"}</div>
          </div>
        </div>
      `;
      card.addEventListener("click", () => Actions.openDetail(e.id));
      card.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") Actions.openDetail(e.id);
      });
      entriesList.appendChild(card);
    });
  }

  // Render mood selector for editor
  function renderMoodSelector(activeMood = null) {
    const moodSelector = document.getElementById("moodSelector");
    moodSelector.innerHTML = "";
    moods.forEach((m) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mood-btn";
      b.dataset.mood = m.id;
      b.innerHTML = `<div>${m.emoji}</div><div>${m.label}</div>`;
      if (m.id === activeMood) b.classList.add("active");
      b.addEventListener("click", () => {
        Array.from(moodSelector.children).forEach((x) =>
          x.classList.remove("active"),
        );
        b.classList.add("active");
      });
      moodSelector.appendChild(b);
    });
  }

  // Get selected mood from selector
  function getSelectedMoodFromSelector() {
    const moodSelector = document.getElementById("moodSelector");
    const active = moodSelector.querySelector(".mood-btn.active");
    return active ? active.dataset.mood : null;
  }

  // Update word count display
  function updateWordCount() {
    const bodyInput = document.getElementById("bodyInput");
    const wordCountEl = document.getElementById("wordCount");
    const text = bodyInput.value || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    wordCountEl.textContent = `${words} words • ${text.length} chars`;
  }

  // Show editor form for new or existing entry
  function renderEditorFor(id = null) {
    const entryForm = document.getElementById("entryForm");
    const detailView = document.getElementById("detailView");
    const editorTitle = document.querySelector(".editor-title");
    const titleInput = document.getElementById("titleInput");
    const dateInput = document.getElementById("dateInput");
    const tagsInput = document.getElementById("tagsInput");
    const bodyInput = document.getElementById("bodyInput");
    const autoSaveStatus = document.getElementById("autoSaveStatus");

    detailView.classList.add("hidden");
    entryForm.classList.remove("hidden");

    if (id) {
      const e = Storage.getEntryById(id);
      if (!e) return;
      editorTitle.textContent = "Edit Entry";
      titleInput.value = e.title || "";
      dateInput.value = new Date(e.createdAt).toISOString().slice(0, 16);
      tagsInput.value = (e.tags || []).join(", ");
      bodyInput.value = e.body || "";
      renderMoodSelector(e.mood);
    } else {
      editorTitle.textContent = "New Entry";
      titleInput.value = "";
      dateInput.value = new Date().toISOString().slice(0, 16);
      tagsInput.value = "";
      bodyInput.value = "";
      renderMoodSelector(null);
    }

    updateWordCount();
    autoSaveStatus.textContent = Actions.isAutoSaveEnabled() ? "on" : "off";
    if (!Utils.prefersReduced) titleInput.focus();

    return id;
  }

  // Show detail view to read entry
  function renderDetail(e) {
    const entryForm = document.getElementById("entryForm");
    const detailView = document.getElementById("detailView");
    const detailTitle = document.getElementById("detailTitle");
    const detailMeta = document.getElementById("detailMeta");
    const detailBody = document.getElementById("detailBody");
    const detailTags = document.getElementById("detailTags");

    entryForm.classList.add("hidden");
    detailView.classList.remove("hidden");
    detailTitle.textContent = e.title || "(No title)";
    const m = moods.find((x) => x.id === e.mood);
    detailMeta.textContent = `${
      m ? m.emoji + " " + m.label + " • " : ""
    }${new Date(e.createdAt).toLocaleString()}`;
    detailBody.textContent = e.body || "";
    detailTags.textContent = (e.tags || []).map((t) => "#" + t).join(" ");
  }

  // Gather form data
  function gatherForm() {
    const titleInput = document.getElementById("titleInput");
    const dateInput = document.getElementById("dateInput");
    const tagsInput = document.getElementById("tagsInput");
    const bodyInput = document.getElementById("bodyInput");

    const title = titleInput.value.trim();
    const dateTime = dateInput.value;
    const dateISO = dateTime ? dateTime.slice(0, 10) : Utils.todayKey();
    const body = bodyInput.value;
    const tags = tagsInput.value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const mood = getSelectedMoodFromSelector();

    return { title, date: dateISO, body, tags, mood };
  }

  // Public API
  return {
    moods,
    updateGreeting,
    renderMoodFilters,
    renderEntriesList,
    renderMoodSelector,
    getSelectedMoodFromSelector,
    updateWordCount,
    renderEditorFor,
    renderDetail,
    gatherForm,
  };
})();
