/* Actions Module - High-level entry operations */

const Actions = (() => {
  let currentId = null;
  let autoSaveEnabled = true;
  let autoSaveTimer = null;

  // Check if auto-save is enabled
  function isAutoSaveEnabled() {
    return autoSaveEnabled;
  }

  // Schedule auto-save
  function scheduleAutoSave() {
    if (!autoSaveEnabled) return;
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      const draft = UI.gatherForm();
      Storage.saveDraft(draft);
      document.getElementById("autoSaveStatus").textContent = "saved";
      setTimeout(
        () =>
          (document.getElementById("autoSaveStatus").textContent =
            autoSaveEnabled ? "on" : "off"),
        800,
      );
    }, 800);
  }

  // Load draft if any
  function loadDraftIfAny() {
    const draft = Storage.loadDraft();
    if (!draft) return;
    const titleInput = document.getElementById("titleInput");
    const bodyInput = document.getElementById("bodyInput");
    const tagsInput = document.getElementById("tagsInput");

    titleInput.value = draft.title || titleInput.value;
    bodyInput.value = draft.body || bodyInput.value;
    tagsInput.value = (draft.tags || []).join(", ");
    if (draft.mood) UI.renderMoodSelector(draft.mood);
  }

  // Create new entry
  function createEntry() {
    const data = UI.gatherForm();
    Storage.createEntry(data);
    Storage.clearDraft();
    Filters.renderEntriesList();
    Utils.showToast("Entry created");
    UI.renderEditorFor(null);
  }

  // Update entry
  function updateEntry() {
    if (!currentId) return;
    const data = UI.gatherForm();
    Storage.updateEntry(currentId, data);
    Storage.clearDraft();
    Filters.renderEntriesList();
    Utils.showToast("Entry updated");
    UI.renderEditorFor(null);
  }

  // Delete entry
  function deleteEntry() {
    if (!currentId) return Utils.showToast("Nothing to delete");
    if (!confirm("Delete this entry?")) return;
    Storage.deleteEntry(currentId);
    Filters.renderEntriesList();
    Utils.showToast("Entry deleted");
    UI.renderEditorFor(null);
  }

  // Open entry for editing
  function openEditor() {
    currentId = UI.renderEditorFor(null);
  }

  // Open entry for viewing
  function openDetail(id) {
    const e = Storage.getEntryById(id);
    if (!e) return;
    currentId = id;
    UI.renderDetail(e);
  }

  // Cancel editing
  function cancelEdit() {
    currentId = null;
    UI.renderEditorFor(null);
  }

  // Export single entry
  function exportEntry() {
    if (!currentId) return Utils.showToast("Open an entry to export");
    const e = Storage.getEntryById(currentId);
    if (e) Export.exportEntriesToPDF([e], `${e.title || "entry"}.pdf`);
  }

  // Export all visible entries
  function exportAll() {
    const entriesList = document.getElementById("entriesList");
    const list = Array.from(entriesList.querySelectorAll(".entry-card"))
      .map((n) => {
        const title = n.querySelector(".entry-title")?.textContent || "";
        return Storage.getAllEntries().find(
          (e) =>
            (e.title || "").startsWith(title) ||
            (e.body || "").startsWith(
              n.querySelector(".entry-preview")?.textContent || "",
            ),
        );
      })
      .filter(Boolean);

    if (!list.length) return Utils.showToast("No entries to export");
    Export.exportEntriesToPDF(list, "journal-export.pdf");
  }

  // Public API
  return {
    isAutoSaveEnabled,
    scheduleAutoSave,
    loadDraftIfAny,
    createEntry,
    updateEntry,
    deleteEntry,
    openEditor,
    openDetail,
    cancelEdit,
    exportEntry,
    exportAll,
    getCurrentId: () => currentId,
  };
})();
