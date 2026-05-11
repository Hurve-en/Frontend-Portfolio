/* Export Module - PDF export and JSON backup/import */

const Export = (() => {
  // Export entries to PDF using jsPDF
  function exportEntriesToPDF(list, filename = "journal-export.pdf") {
    try {
      if (!window.jspdf || !window.jspdf.jsPDF) {
        Utils.showToast("PDF library not loaded");
        return;
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const left = 40;
      const topStart = 60;
      let y = topStart;
      doc.setFont("Helvetica");

      list.forEach((e, idx) => {
        const mood = UI.moods.find((m) => m.id === e.mood);
        doc.setFontSize(14);
        doc.text(`${e.title || "(No title)"}`, left, y);
        y += 18;
        doc.setFontSize(10);
        doc.text(
          `${
            mood ? mood.emoji + " " + mood.label + " • " : ""
          }${new Date(e.createdAt).toLocaleString()}`,
          left,
          y,
        );
        y += 16;
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(e.body || "", 520);
        doc.text(lines, left, y);
        y += lines.length * 14 + 18;

        if (e.tags && e.tags.length) {
          doc.setFontSize(10);
          doc.text("Tags: " + e.tags.join(", "), left, y);
          y += 18;
        }

        if (idx < list.length - 1 && y > 700) {
          doc.addPage();
          y = topStart;
        } else if (idx < list.length - 1) {
          y += 8;
          doc.setDrawColor(230);
          doc.line(left, y, 560, y);
          y += 12;
        }
      });

      doc.save(filename);
    } catch (err) {
      console.error("PDF Export failed", err);
      Utils.showToast("Export failed (console)");
    }
  }

  // Download all entries as JSON backup
  function downloadJSON() {
    const entries = Storage.getAllEntries();
    const payload = JSON.stringify(entries, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "journal-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import entries from JSON file
  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(reader.result);
        Storage.importEntries(arr);
        Filters.renderEntriesList();
        Utils.showToast("Imported entries");
      } catch (e) {
        alert("Import failed: " + e.message);
      }
    };
    reader.readAsText(file);
  }

  // Public API
  return {
    exportEntriesToPDF,
    downloadJSON,
    importJSON,
  };
})();
