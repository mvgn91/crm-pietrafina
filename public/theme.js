// theme.js — interruptor claro/oscuro compartido por las 4 vistas.
// Solo persistencia local (localStorage) y atributo data-theme. Sin Firebase ni datos.

(function () {
  const KEY = "pf-theme";
  const root = document.documentElement;

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    const esOscuro = theme === "dark";
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.setAttribute(
        "aria-label",
        esOscuro ? "Activar tema claro" : "Activar tema oscuro",
      );
      btn.setAttribute(
        "title",
        esOscuro ? "Activar tema claro" : "Activar tema oscuro",
      );
      const icono = btn.querySelector("i[data-lucide]");
      if (icono) icono.setAttribute("data-lucide", esOscuro ? "sun" : "moon");
    });
    if (typeof lucide !== "undefined") lucide.createIcons();
    if (persist) localStorage.setItem(KEY, theme);
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  }

  applyTheme(localStorage.getItem(KEY) === "dark" ? "dark" : "light", false);

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
      });
    });
    if (typeof lucide !== "undefined") lucide.createIcons();
  });
})();
