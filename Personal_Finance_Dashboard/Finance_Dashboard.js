// This JavaScript file handles the interactive behavior of the Personal Finance Dashboard.
// It manages menu navigation and user interactions to make the page dynamic.

// Add click event listeners to all menu items in the sidebar
// When a menu item is clicked, it becomes active and others are deactivated
document.querySelectorAll(".menu-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    // Prevent the default link behavior (since these are # links)
    e.preventDefault();

    // Remove the 'active' class from all menu items
    document
      .querySelectorAll(".menu-item")
      .forEach((i) => i.classList.remove("active"));

    // Add the 'active' class to the clicked menu item
    item.classList.add("active");
  });
});
