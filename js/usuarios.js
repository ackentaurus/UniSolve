// Gestión de usuarios (solo Administrador) · RF_01 desde el lado del administrador
const sesion = requerirSesion([ROLES.ADMIN]);
iniciarCabecera(sesion);

const tbody = por("tablaUsuarios");
const msg = por("mensaje");

function aviso(texto, error) {
    mostrarAviso(msg, texto, error);
}

function selectArea(valor, clase, datos, deshabilitado) {
    return `<select class="form-select form-select-sm ${clase}" ${datos}${deshabilitado ? " disabled" : ""}>` +
        AREAS.map(a => `<option${a === valor ? " selected" : ""}>${a}</option>`).join("") + "</select>";
}

function pintar() {
    const usuarios = obtenerUsuarios();
    const incidencias = obtenerIncidencias();
    tbody.innerHTML = usuarios.map(u => {
        const yo = u.usuario === sesion.usuario;
        const activo = u.activo !== false;
        const total = incidencias.filter(i => i.usuario === u.usuario).length;
        const selRol = `<select class="form-select form-select-sm selRol" data-u="${escapar(u.usuario)}"${yo ? " disabled" : ""}>` +
            Object.values(ROLES).map(r => `<option${r === u.rol ? " selected" : ""}>${r}</option>`).join("") + "</select>";
        const selArea = u.rol === ROLES.AREA ? '<div class="mt-1">' + selectArea(u.area, "selAreaUsuario", `data-u="${escapar(u.usuario)}"`, false) + "</div>" : "";
        return `<tr>
            <td><strong>${escapar(u.usuario)}</strong>${yo ? ' <small class="text-secondary">(tú)</small>' : ""}</td>
            <td>${escapar(u.nombre || "")}</td>
            <td>${selRol}${selArea}</td>
            <td>${total}</td>
            <td><span class="badge ${activo ? "text-bg-success" : "text-bg-secondary"}">${activo ? "Activo" : "Inactivo"}</span></td>
            <td class="text-nowrap">
                <a href="#" class="btn btn-sm btn-outline-secondary btnClave" data-u="${escapar(u.usuario)}"><i class="bi bi-key me-1"></i>Cambiar clave</a>
                ${yo ? "" : `<a href="#" class="btn btn-sm btn-outline-${activo ? "danger" : "success"} btnEstado" data-u="${escapar(u.usuario)}">${activo ? "Desactivar" : "Activar"}</a>`}
            </td>
        </tr>`;
    }).join("");
}

tbody.addEventListener("change", function (e) {
    const usuarios = obtenerUsuarios();
    const u = usuarios.find(x => x.usuario === e.target.dataset.u);
    if (!u) return;

    if (e.target.classList.contains("selRol")) {
        u.rol = e.target.value;
        if (u.rol === ROLES.AREA && !u.area) u.area = AREAS[0];
        guardarUsuarios(usuarios);
        aviso("Rol de " + u.usuario + " actualizado a " + u.rol);
        pintar();
    }
    if (e.target.classList.contains("selAreaUsuario")) {
        u.area = e.target.value;
        guardarUsuarios(usuarios);
        aviso(u.usuario + " ahora pertenece al área " + u.area);
    }
});

tbody.addEventListener("click", function (e) {
    const a = e.target.closest("a.btn");
    if (!a) return;
    e.preventDefault();
    const usuarios = obtenerUsuarios();
    const u = usuarios.find(x => x.usuario === a.dataset.u);

    if (a.classList.contains("btnEstado")) {
        u.activo = u.activo === false;
        guardarUsuarios(usuarios);
        aviso("Cuenta de " + u.usuario + (u.activo ? " activada" : " desactivada"));
        pintar();
    }
    if (a.classList.contains("btnClave")) {
        const nueva = prompt("Nueva contraseña para " + u.usuario + " (mínimo 4 caracteres):");
        if (nueva === null) return;
        if (nueva.length < 4) { aviso("La contraseña debe tener al menos 4 caracteres", true); return; }
        u.clave = nueva;
        guardarUsuarios(usuarios);
        aviso("Contraseña de " + u.usuario + " actualizada");
    }
});

const selNuevoRol = por("nuevoRol");
selNuevoRol.innerHTML = Object.values(ROLES).map(r => `<option>${r}</option>`).join("");
por("nuevaArea").innerHTML = AREAS.map(a => `<option>${a}</option>`).join("");

function actualizarCampoArea() {
    por("campoArea").hidden = selNuevoRol.value !== ROLES.AREA;
}
selNuevoRol.addEventListener("change", actualizarCampoArea);
actualizarCampoArea();

por("formUsuario").addEventListener("submit", function (e) {
    e.preventDefault();
    const usuario = por("nuevoUsuario").value.trim().toLowerCase();
    const nombre = por("nuevoNombre").value.trim();
    const clave = por("nuevaClave").value;
    const rol = selNuevoRol.value;

    if (!/^[a-z0-9._-]{3,20}$/.test(usuario)) { aviso("Usuario: 3 a 20 caracteres (letras, números, . _ -)", true); return; }
    if (clave.length < 4) { aviso("La contraseña debe tener al menos 4 caracteres", true); return; }

    const usuarios = obtenerUsuarios();
    if (usuarios.some(u => u.usuario === usuario)) { aviso("Ese usuario ya existe", true); return; }

    const nuevo = { usuario: usuario, clave: clave, rol: rol, nombre: nombre, activo: true };
    if (rol === ROLES.AREA) nuevo.area = por("nuevaArea").value;
    usuarios.push(nuevo);
    guardarUsuarios(usuarios);
    this.reset();
    actualizarCampoArea();
    aviso("Usuario " + usuario + " creado como " + rol + (nuevo.area ? " (" + nuevo.area + ")" : ""));
    pintar();
});

pintar();
