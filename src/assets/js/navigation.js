// Translate navigation labels only; the document and page content remain English.
document.addEventListener("DOMContentLoaded", () => {
  const source = document.getElementById("navigation-translations");
  if (!source) return;
  const translations = JSON.parse(source.textContent);
  const controls = document.querySelectorAll("[data-navigation-language]");
  let language = "en";
  try {
    language =
      localStorage.getItem("navigationLanguage") === "sw" ? "sw" : "en";
  } catch {}

  // Preserve English fallback text and restore it when switching back.
  const apply = () => {
    document.querySelectorAll("[data-nav-text]").forEach((node) => {
      const english = node.dataset.navText;
      node.textContent =
        language === "sw" ? translations[english] || english : english;
      node.lang = language === "sw" && translations[english] ? "sw" : "en";
    });
    document.querySelectorAll("[data-nav-aria]").forEach((node) => {
      node.setAttribute(
        "aria-label",
        language === "sw"
          ? translations[node.dataset.navAria] || node.dataset.navAria
          : node.dataset.navAria,
      );
      node.lang =
        language === "sw" && translations[node.dataset.navAria] ? "sw" : "en";
    });
    controls.forEach((button) => {
      button.disabled = false;
      button.classList.toggle(
        "active",
        button.dataset.navigationLanguage === language,
      );
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.navigationLanguage === language),
      );
    });
  };
  controls.forEach((button) =>
    button.addEventListener("click", () => {
      language = button.dataset.navigationLanguage === "sw" ? "sw" : "en";
      try {
        localStorage.setItem("navigationLanguage", language);
      } catch {}
      apply();
    }),
  );
  apply();
});
