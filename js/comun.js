// ====== Funciones compartidas por todas las páginas ======
const ROLES = { ADMIN: "Administrador", DOCENTE: "Docente/Personal", ESTUDIANTE: "Estudiante", AREA: "Área responsable" };
const ESTADOS = ["Pendiente", "En proceso", "Resuelta", "Cerrada"];
const PRIORIDADES = ["Baja", "Media", "Alta"];
const CATEGORIAS = ["Infraestructura", "Equipos / Tecnología", "Limpieza", "Seguridad", "Otro"];
const AREAS = ["Mantenimiento", "Soporte TI", "Limpieza", "Seguridad", "Servicios Generales"];
// Área que se sugiere al administrador según la categoría de la incidencia
const AREA_POR_CATEGORIA = {
    "Infraestructura": "Mantenimiento",
    "Equipos / Tecnología": "Soporte TI",
    "Limpieza": "Limpieza",
    "Seguridad": "Seguridad",
    "Otro": "Servicios Generales"
};

const CLASE_ESTADO = { "Pendiente": "text-bg-warning", "En proceso": "text-bg-info", "Resuelta": "text-bg-success", "Cerrada": "text-bg-secondary" };
const CLASE_PRIORIDAD = { "Baja": "text-bg-success", "Media": "text-bg-warning", "Alta": "text-bg-danger" };

const USUARIOS_INICIALES = [
    { usuario: "estudiante", clave: "1234", rol: ROLES.ESTUDIANTE, nombre: "Estudiante de prueba", activo: true },
    { usuario: "docente", clave: "1234", rol: ROLES.DOCENTE, nombre: "Docente de prueba", activo: true },
    { usuario: "admin", clave: "1234", rol: ROLES.ADMIN, nombre: "Administrador", activo: true },
    { usuario: "area", clave: "1234", rol: ROLES.AREA, nombre: "Área de Mantenimiento", area: "Mantenimiento", activo: true }
];

// ---------- Utilidades ----------
function leer(clave, defecto) {
    try {
        const valor = JSON.parse(localStorage.getItem(clave));
        return valor === null || valor === undefined ? defecto : valor;
    } catch (e) { return defecto; }
}
// Devuelve false si no se pudo guardar (por ejemplo, cuando la foto ocupa demasiado espacio)
function guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); return true; }
    catch (e) { return false; }
}
function por(id) { return document.getElementById(id); }

function escapar(texto) {
    const d = document.createElement("div");
    d.textContent = texto === undefined || texto === null ? "" : texto;
    return d.innerHTML;
}
function badgeEstado(estado) {
    return `<span class="badge ${CLASE_ESTADO[estado] || "text-bg-light"}">${escapar(estado)}</span>`;
}
function badgePrioridad(prioridad) {
    return `<span class="badge ${CLASE_PRIORIDAD[prioridad] || "text-bg-light"}">${escapar(prioridad)}</span>`;
}
// Muestra un mensaje (alert de Bootstrap) dentro del elemento indicado
function mostrarAviso(elemento, texto, esError) {
    elemento.className = "alert alert-" + (esError ? "danger" : "success");
    elemento.textContent = texto;
    elemento.hidden = false;
}

// ---------- Datos ----------
function obtenerUsuarios() {
    let u = leer("usuarios", null);
    if (!u) {
        u = USUARIOS_INICIALES.slice();
        guardar("usuarios", u);
    } else if (!u.some(x => x.usuario === "area")) {
        // Datos de una versión anterior: se agrega la cuenta de prueba del área responsable
        u.push(USUARIOS_INICIALES.find(x => x.usuario === "area"));
        guardar("usuarios", u);
    }
    return u;
}
function guardarUsuarios(lista) { return guardar("usuarios", lista); }
function obtenerIncidencias() { return leer("incidencias", []); }
function guardarIncidencias(lista) { return guardar("incidencias", lista); }
function rolDe(usuario) {
    const u = obtenerUsuarios().find(x => x.usuario === usuario);
    return u ? u.rol : "";
}

// ---------- Sesión ----------
// Devuelve la sesión válida o redirige. Si se pasan roles, solo esos pueden entrar.
function requerirSesion(rolesPermitidos) {
    const guardada = leer("sesion", null);
    const real = guardada && obtenerUsuarios().find(u => u.usuario === guardada.usuario && u.activo !== false);
    if (!real) {
        localStorage.removeItem("sesion");
        location.replace("login.html");
        throw new Error("Sin sesión");
    }
    // el rol y el área siempre salen de la lista de usuarios
    const sesion = { usuario: real.usuario, rol: real.rol, nombre: real.nombre || real.usuario, area: real.area || "" };
    if (rolesPermitidos && !rolesPermitidos.includes(sesion.rol)) {
        location.replace("consultar.html");
        throw new Error("Sin permiso");
    }
    return sesion;
}

// ---------- Estructura AdminLTE (barra superior + menú lateral) ----------
const MENU = [
    { href: "consultar.html", icono: "bi-card-list", texto: "Incidencias", activas: ["consultar.html", "detalle.html", "editar.html"] },
    { href: "registrar.html", icono: "bi-plus-circle", texto: "Registrar incidencia", activas: ["registrar.html"] },
    { href: "usuarios.html", icono: "bi-people", texto: "Usuarios", activas: ["usuarios.html"], roles: [ROLES.ADMIN] }
];

function iniciarCabecera(sesion) {
    const pagina = location.pathname.split("/").pop() || "index.html";
    const etiqueta = sesion.rol + (sesion.area ? " · " + sesion.area : "");

    por("appHeader").innerHTML = `
    <div class="container-fluid">
        <ul class="navbar-nav">
            <li class="nav-item">
                <a class="nav-link" data-lte-toggle="sidebar" href="#" role="button" aria-label="Mostrar u ocultar menú"><i class="bi bi-list"></i></a>
            </li>
        </ul>
        <ul class="navbar-nav ms-auto">
            <li class="nav-item">
                <a class="nav-link" href="#" data-lte-toggle="fullscreen" aria-label="Pantalla completa">
                    <i data-lte-icon="maximize" class="bi bi-arrows-fullscreen"></i>
                    <i data-lte-icon="minimize" class="bi bi-fullscreen-exit d-none"></i>
                </a>
            </li>
            <li class="nav-item dropdown">
                <a class="nav-link" href="#" id="bd-theme" aria-label="Modo de color" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="bi bi-sun-fill" data-lte-theme-icon="light"></i>
                    <i class="bi bi-moon-fill d-none" data-lte-theme-icon="dark"></i>
                    <i class="bi bi-circle-half d-none" data-lte-theme-icon="auto"></i>
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="bd-theme" style="--bs-dropdown-min-width: 8rem">
                    <li><button type="button" class="dropdown-item d-flex align-items-center" data-bs-theme-value="light" aria-pressed="false"><i class="bi bi-sun-fill me-2"></i>Claro<i class="bi bi-check-lg ms-auto d-none"></i></button></li>
                    <li><button type="button" class="dropdown-item d-flex align-items-center" data-bs-theme-value="dark" aria-pressed="false"><i class="bi bi-moon-fill me-2"></i>Oscuro<i class="bi bi-check-lg ms-auto d-none"></i></button></li>
                    <li><button type="button" class="dropdown-item d-flex align-items-center active" data-bs-theme-value="auto" aria-pressed="true"><i class="bi bi-circle-half me-2"></i>Automático<i class="bi bi-check-lg ms-auto d-none"></i></button></li>
                </ul>
            </li>
            <li class="nav-item dropdown user-menu">
                <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                    <i class="bi bi-person-circle me-1"></i>
                    <span class="d-none d-md-inline">${escapar(sesion.usuario)}</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-lg dropdown-menu-end">
                    <li class="user-header text-bg-primary">
                        <i class="bi bi-person-circle display-4"></i>
                        <p>${escapar(sesion.nombre)}<small>${escapar(etiqueta)}</small></p>
                    </li>
                    <li class="user-footer">
                        <a href="#" id="salir" class="btn btn-outline-secondary btn-flat float-end"><i class="bi bi-box-arrow-right me-1"></i>Cerrar sesión</a>
                    </li>
                </ul>
            </li>
        </ul>
    </div>`;

    const items = MENU.filter(m => !m.roles || m.roles.includes(sesion.rol)).map(m => `
        <li class="nav-item">
            <a href="${m.href}" class="nav-link${m.activas.includes(pagina) ? " active" : ""}">
                <i class="nav-icon bi ${m.icono}"></i><p>${m.texto}</p>
            </a>
        </li>`).join("");

    por("appSidebar").innerHTML = `
    <div class="sidebar-brand">
        <a href="consultar.html" class="brand-link">
            <i class="bi bi-shield-check fs-4 ms-3 me-2 text-primary"></i>
            <span class="brand-text fw-light">UniSolve</span>
        </a>
    </div>
    <div class="sidebar-wrapper">
        <nav class="mt-2" aria-label="Menú principal">
            <ul class="nav sidebar-menu flex-column" role="menu">${items}</ul>
        </nav>
    </div>`;

    por("salir").addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("sesion");
        window.location.href = "login.html";
    });
}

// ---------- Responsabilidades por rol ----------
//  Estudiante : registra incidencias (con foto y ubicación), ve solo las suyas, edita/cancela las suyas
//               mientras estén Pendientes, comenta, y confirma el cierre o reabre cuando se resuelven.
//  Docente    : todo lo del estudiante + ve (y comenta) las incidencias reportadas por estudiantes.
//  Área resp. : ve las incidencias asignadas a su área, actualiza su estado y registra la solución.
//  Admin      : ve todas, asigna el área, cambia estado y prioridad, edita/elimina cualquiera,
//               cierra incidencias resueltas, comenta y gestiona usuarios.
const Permisos = {
    puedeVer(s, i) {
        if (s.rol === ROLES.ADMIN || i.usuario === s.usuario) return true;
        if (s.rol === ROLES.DOCENTE) return rolDe(i.usuario) === ROLES.ESTUDIANTE;
        if (s.rol === ROLES.AREA) return !!i.area && i.area === s.area;
        return false;
    },
    esPropia(s, i) { return i.usuario === s.usuario; },
    puedeEditar(s, i) { return s.rol === ROLES.ADMIN || (i.usuario === s.usuario && i.estado === "Pendiente"); },
    puedeEliminar(s, i) { return s.rol === ROLES.ADMIN || (i.usuario === s.usuario && i.estado === "Pendiente"); },
    puedeGestionar(s) { return s.rol === ROLES.ADMIN; },   // asignar área, estado y prioridad
    puedeAtender(s, i) {                                   // actualizar estado y registrar la solución
        const responsable = s.rol === ROLES.ADMIN || (s.rol === ROLES.AREA && !!i.area && i.area === s.area);
        return responsable && (i.estado === "En proceso" || i.estado === "Resuelta");
    },
    puedeCerrar(s, i) {                                    // confirmar la solución y cerrar / reabrir
        return i.estado === "Resuelta" && (i.usuario === s.usuario || s.rol === ROLES.ADMIN);
    },
    puedeComentar(s, i) { return Permisos.puedeVer(s, i) && (s.rol === ROLES.ADMIN || i.estado !== "Cerrada"); }
};

function incidenciasVisibles(sesion) {
    return obtenerIncidencias().filter(i => Permisos.puedeVer(sesion, i));
}

function agregarComentario(incidencia, sesion, texto, esSistema) {
    if (!incidencia.comentarios) incidencia.comentarios = [];
    incidencia.comentarios.push({
        autor: sesion.usuario,
        rol: sesion.rol,
        fecha: new Date().toLocaleString("es-PE"),
        texto: texto,
        sistema: !!esSistema
    });
}

// ---------- Fotografía de la incidencia (RF_04) ----------
// Reduce la imagen (máx. 900 px, JPEG) para que quepa en el almacenamiento del navegador
function comprimirImagen(archivo, maxLado, calidad) {
    maxLado = maxLado || 900;
    calidad = calidad || 0.75;
    return new Promise(function (resolve, reject) {
        if (!archivo.type.startsWith("image/")) { reject(new Error("El archivo debe ser una imagen (JPG o PNG)")); return; }
        const lector = new FileReader();
        lector.onerror = function () { reject(new Error("No se pudo leer la imagen")); };
        lector.onload = function () {
            const img = new Image();
            img.onerror = function () { reject(new Error("La imagen no es válida")); };
            img.onload = function () {
                const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(img.width * escala);
                canvas.height = Math.round(img.height * escala);
                canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", calidad));
            };
            img.src = lector.result;
        };
        lector.readAsDataURL(archivo);
    });
}

// Enlaza el campo de foto de registrar.html y editar.html (ids: foto, vistaPrevia, btnQuitarFoto, errorFoto)
function iniciarCampoFoto(fotoInicial) {
    const input = por("foto"), vista = por("vistaPrevia"), quitar = por("btnQuitarFoto"), error = por("errorFoto");
    let actual = fotoInicial || "";

    function pintar() {
        vista.hidden = !actual;
        quitar.hidden = !actual;
        if (actual) vista.src = actual;
    }
    input.addEventListener("change", async function () {
        error.textContent = "";
        const archivo = input.files[0];
        if (!archivo) return;
        try { actual = await comprimirImagen(archivo); }
        catch (e) { error.textContent = e.message; input.value = ""; }
        pintar();
    });
    quitar.addEventListener("click", function () { actual = ""; input.value = ""; pintar(); });
    pintar();
    return { valor: function () { return actual; }, limpiar: function () { actual = ""; input.value = ""; pintar(); } };
}
