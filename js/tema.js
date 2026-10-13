// Aplica el modo de color (claro/oscuro) antes de pintar la página, igual que AdminLTE
(() => {
    "use strict";
    const root = document.documentElement;
    let guardado = null;
    try { guardado = localStorage.getItem("lte-theme"); } catch (e) { /* sin localStorage */ }
    let tema = "light";
    if (guardado === "dark" || guardado === "light") tema = guardado;
    else if (globalThis.matchMedia("(prefers-color-scheme: dark)").matches) tema = "dark";
    root.setAttribute("data-bs-theme", tema);
    root.style.colorScheme = tema;
    root.setAttribute("data-lte-theme-resolved", "");
})();
