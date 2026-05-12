const Export = (() => {
  function exportJSON() {
    const posts = Actions.getPosts();
    const data = JSON.stringify(posts, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `microblog-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.showToast("Posts exported", "success");
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(reader.result);
        if (!Array.isArray(arr)) throw new Error("Invalid file");
        const currentPosts = Actions.getPosts();
        const merged = arr.concat(currentPosts);
        Storage.savePosts(merged);
        Actions.loadState();
        Actions.refreshFeed();
        UI.updateStats(merged);
        UI.showToast(`${arr.length} posts imported`, "success");
      } catch (e) {
        UI.showToast(`Import failed: ${e.message}`, "error");
      }
    };
    reader.readAsText(file);
  }

  return { exportJSON, importJSON };
})();
