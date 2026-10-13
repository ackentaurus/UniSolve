// RF_06 - Consultar las incidencias registradas, RF_07 - Consultar el estado
// Admin ve todas, Docente ve las suyas + las de estudiantes, Estudiante solo las suyas
// Área responsable ve las asignadas a su área
const sesion = requerirSesion();
iniciarCabecera(sesion);

const esEstudiante = sesion.rol === ROLES.ESTUDIANTE;
const esAdmin = sesion.rol === ROLES.ADMIN;
const esArea = sesion.rol === ROLES.AREA;

const subtitulos = {
    [ROLES.ADMIN]: "Gestionas todas las incidencias del sistema: asigna el área, la prioridad, cambia el estado y responde.",
    [ROLES.DOCENTE]: "Ves tus incidencias y las reportadas por estudiantes. Puedes comentarlas.",
    [ROLES.ESTUDIANTE]: "Aquí ves solo las incidencias que tú registraste.",
    [ROLES.AREA]: "Ves las incidencias asignadas a tu área (" + sesion.area + "): actualiza su estado y registra la solución."
};
por("subtitulo").textContent = subtitulos[sesion.rol];

// Opciones de los filtros
por("filtroEstado").innerHTML = '<option value="">Todos los estados</option>' + ESTADOS.map(e => `<option>${e}</option>`).join("");
por("filtroCategoria").innerHTML = '<option value="">Todas las categorías</option>' + CATEGORIAS.map(c => `<option>${c}</option>`).join("");

const filtroOrigen = por("filtroOrigen");
const filtroArea = por("filtroArea");
if (!esEstudiante && !esArea) {
    por("colOrigen").hidden = false;
    let opciones = '<option value="">Todas las visibles</option><option value="mias">Solo las mías</option><option value="estudiantes">De estudiantes</option>';
    if (esAdmin) opciones += '<option value="docentes">De docentes/personal</option>';
    filtroOrigen.innerHTML = opciones;
}
if (esAdmin) {
    por("colArea").hidden = false;
    filtroArea.innerHTML = '<option value="">Todas las áreas</option><option value="__sin">Sin asignar</option>' + AREAS.map(a => `<option>${a}</option>`).join("");
}
if (esEstudiante) por("tablaIncidencias").classList.add("sin-autor");

const tbody = por("tabla");

function pintarResumen(visibles) {
    const tarjetas = [
        ["Total", visibles.length, "text-bg-primary", "bi-collection"],
        ["Pendiente", visibles.filter(i => i.estado === "Pendiente").length, CLASE_ESTADO["Pendiente"], "bi-hourglass-split"],
        ["En proceso", visibles.filter(i => i.estado === "En proceso").length, CLASE_ESTADO["En proceso"], "bi-gear"],
        ["Resuelta", visibles.filter(i => i.estado === "Resuelta").length, CLASE_ESTADO["Resuelta"], "bi-check-circle"],
        ["Cerrada", visibles.filter(i => i.estado === "Cerrada").length, CLASE_ESTADO["Cerrada"], "bi-lock"]
    ];
    por("resumen").innerHTML = tarjetas.map(t => `
        <div class="col-6 col-md-4 col-xl">
            <div class="info-box">
                <span class="info-box-icon ${t[2]} shadow-sm"><i class="bi ${t[3]}"></i></span>
                <div class="info-box-content">
                    <span class="info-box-text">${t[0]}</span>
                    <span class="info-box-number">${t[1]}</span>
                </div>
            </div>
        </div>`).join("");
}

function pintarTabla() {
    const texto = por("buscar").value.toLowerCase();
    const estado = por("filtroEstado").value;
    const categoria = por("filtroCategoria").value;
    const origen = filtroOrigen.value;
    const area = filtroArea.value;

    const visibles = incidenciasVisibles(sesion);
    pintarResumen(visibles);

    const lista = visibles.filter(i =>
        (i.titulo + " " + i.descripcion).toLowerCase().includes(texto) &&
        (estado === "" || i.estado === estado) &&
        (categoria === "" || i.categoria === categoria) &&
        (area === "" || (area === "__sin" ? !i.area : i.area === area)) &&
        (origen === "" ||
            (origen === "mias" && i.usuario === sesion.usuario) ||
            (origen === "estudiantes" && rolDe(i.usuario) === ROLES.ESTUDIANTE) ||
            (origen === "docentes" && rolDe(i.usuario) === ROLES.DOCENTE))
    ).sort((a, b) => b.id - a.id);

    por("contador").textContent = lista.length + " de " + visibles.length;

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center text-secondary py-4">No hay incidencias para mostrar</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(i => {
        const prio = i.prioridad || "Media";
        const editar = Permisos.puedeEditar(sesion, i)
            ? ` <a class="btn btn-sm btn-outline-secondary" href="editar.html?id=${i.id}" title="Editar"><i class="bi bi-pencil"></i></a>` : "";
        return `
        <tr>
            <td>#${i.id}</td>
            <td>
                <strong>${escapar(i.titulo)}</strong>${i.foto ? ' <i class="bi bi-camera text-secondary" title="Tiene fotografía"></i>' : ""}
                <div class="desc-corta small text-secondary">${escapar(i.descripcion)}</div>
            </td>
            <td>${escapar(i.categoria)}</td>
            <td>${escapar(i.ubicacion)}</td>
            <td>${escapar(i.fecha)}</td>
            <td class="col-autor">${escapar(i.usuario)}<div class="small text-secondary">${escapar(rolDe(i.usuario))}</div></td>
            <td>${i.area ? escapar(i.area) : '<span class="text-secondary">Sin asignar</span>'}</td>
            <td>${badgePrioridad(prio)}</td>
            <td>${badgeEstado(i.estado)}</td>
            <td class="text-nowrap"><a class="btn btn-sm btn-primary" href="detalle.html?id=${i.id}" title="Ver detalle"><i class="bi bi-eye"></i></a>${editar}</td>
        </tr>`;
    }).join("");
}

por("buscar").addEventListener("input", pintarTabla);
["filtroEstado", "filtroCategoria", "filtroOrigen", "filtroArea"].forEach(x => por(x).addEventListener("change", pintarTabla));
pintarTabla();
