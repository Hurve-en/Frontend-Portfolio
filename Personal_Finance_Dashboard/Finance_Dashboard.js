document.querySelectorAll(".menu-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    document
      .querySelectorAll(".menu-item")
      .forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
  });
});
