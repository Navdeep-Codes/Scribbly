document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll("nav a");
  const pages = document.querySelectorAll(".page");

  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = link.getAttribute("data-page");

      // Hide all pages
      pages.forEach(p => p.classList.add("hidden"));

      // Show selected page
      const selectedPage = document.getElementById(page);
      if (selectedPage) selectedPage.classList.remove("hidden");
    });
  });

  // Default: show dashboard
  document.getElementById("dashboard").classList.remove("hidden");
});
