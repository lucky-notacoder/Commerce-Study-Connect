(() => {
  const initMobileNavigation = () => {
    document.querySelectorAll(".site-header").forEach((header, index) => {
      const nav = header.querySelector(".main-nav");
      const brand = header.querySelector(".brand");
      if (!nav || !brand) return;

      const navId = nav.id || `main-nav-${index + 1}`;
      nav.id = navId;
      nav.setAttribute("aria-label", nav.getAttribute("aria-label") || "Main navigation");

      const toggle = document.createElement("button");
      toggle.className = "mobile-nav-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-label", "Open navigation menu");
      toggle.setAttribute("aria-controls", navId);
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = "<span></span><span></span>";
      brand.insertAdjacentElement("afterend", toggle);
      header.classList.add("has-mobile-nav");

      const closeMenu = () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation menu");
      };

      toggle.addEventListener("click", () => {
        const isOpen = toggle.getAttribute("aria-expanded") !== "true";
        nav.classList.toggle("is-open", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
      });

      nav.addEventListener("click", (event) => {
        if (event.target.closest("a")) closeMenu();
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMobileNavigation, { once: true });
  } else {
    initMobileNavigation();
  }
})();
