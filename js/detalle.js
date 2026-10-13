// Detalle de una incidencia: RF_07 (estado) · RF_09 (asignar área) · RF_10 (actualizar estado)
// RF_11 (registrar solución), RF_12 (cerrar incidencia), según el rol
const sesion = requerirSesion();
iniciarCabecera(sesion);

const id = Number(new URLSearchParams(window.location.search).get("id"));
const lista = obtenerIncidencias();
const incidencia = lista.find(i => i.id === id);
const contenedor = por("contenido");

function opciones(valores, actual) {
    return valores.map(v => `<option${v === actual ? " selected" : ""}>${escapar(v)}</option>`).join("");
}

// Indicador de avance: Pendiente > En proceso > Resuelta > Cerrada
function pasos(estado) {
    const actual = ESTADOS.indexOf(estado);
    return '<ol class="estado-pasos">' + ESTADOS.map((e, k) =>
        `<li class="${k < actual ? "hecho" : k === actual ? "actual" : ""}"><span>${k < actual ? '<i class="bi bi-check-lg"></i>' : k + 1}</span>${e}</li>`
    ).join("") + "</ol>";
}

// Mensaje de validación: no vuelve a dibujar la página para no perder lo que el usuario escribió
function avisoError(texto) {
    const caja = por("avisoDetalle");
    mostrarAviso(caja, texto, true);
    caja.scrollIntoView({ behavior: "smooth", block: "center" });
}

function guardarCambios(aviso) {
    if (!guardarIncidencias(lista)) { pintar("No se pudo guardar: el almacenamiento del navegador está lleno", true); return; }
    pintar(aviso);
}

function pintar(aviso, esError) {
    const prio = incidencia.prioridad || "Media";
    const comentarios = incidencia.comentarios || [];
    let izquierda = "", derecha = "";

    // ---- Datos de la incidencia ----
    izquierda += `<div class="card card-primary card-outline">
        <div class="card-header"><h3 class="card-title">Incidencia #${incidencia.id}: ${escapar(incidencia.titulo)}</h3></div>
        <div class="card-body">
            ${pasos(incidencia.estado)}
            <dl class="row mb-3">
                <dt class="col-sm-4">Estado</dt><dd class="col-sm-8">${badgeEstado(incidencia.estado)}</dd>
                <dt class="col-sm-4">Prioridad</dt><dd class="col-sm-8">${badgePrioridad(prio)}</dd>
                <dt class="col-sm-4">Categoría</dt><dd class="col-sm-8">${escapar(incidencia.categoria)}</dd>
                <dt class="col-sm-4">Ubicación</dt><dd class="col-sm-8">${escapar(incidencia.ubicacion)}</dd>
                <dt class="col-sm-4">Área asignada</dt><dd class="col-sm-8">${incidencia.area ? escapar(incidencia.area) : '<span class="text-secondary">Sin asignar</span>'}</dd>
                <dt class="col-sm-4">Fecha</dt><dd class="col-sm-8">${escapar(incidencia.fecha)}</dd>
                <dt class="col-sm-4">Registrada por</dt><dd class="col-sm-8">${escapar(incidencia.usuario)} (${escapar(rolDe(incidencia.usuario))})</dd>
            </dl>
            <h6>Descripción</h6>
            <p class="descripcion">${escapar(incidencia.descripcion)}</p>
            ${incidencia.foto ? `<h6>Evidencia fotográfica</h6><img class="foto-incidencia img-fluid rounded border" src="${incidencia.foto}" alt="Fotografía de la incidencia">` : ""}
        </div>
    </div>`;

    // ---- Solucion registrada ----
    if (incidencia.solucion) {
        izquierda += `<div class="card card-success card-outline">
            <div class="card-header"><h3 class="card-title"><i class="bi bi-check-circle me-1"></i>Solución aplicada</h3></div>
            <div class="card-body">
                <p class="descripcion mb-2">${escapar(incidencia.solucion.texto)}</p>
                <small class="text-secondary">Registrada por ${escapar(incidencia.solucion.por)} · ${escapar(incidencia.solucion.fecha)}</small>
            </div>
        </div>`;
    }

    // ---- Seguimiento / historial ----
    izquierda += `<div class="card"><div class="card-header"><h3 class="card-title">Seguimiento</h3></div>`;
    izquierda += comentarios.length
        ? '<ul class="list-group list-group-flush">' + comentarios.map(c => `
            <li class="list-group-item comentario${c.sistema ? " sistema" : ""}">
                <small><i class="bi ${c.sistema ? "bi-clock-history" : "bi-chat-left-text"} me-1"></i><strong>${escapar(c.autor)}</strong> (${escapar(c.rol)}) · ${escapar(c.fecha)}</small>
                <div>${escapar(c.texto)}</div>
            </li>`).join("") + "</ul>"
        : '<div class="card-body text-secondary">Aún no hay movimientos</div>';
    if (Permisos.puedeComentar(sesion, incidencia)) {
        izquierda += `<div class="card-body border-top">
            <label for="txtComentario" class="form-label">Agregar comentario</label>
            <textarea id="txtComentario" class="form-control" rows="2" maxlength="300"></textarea>
            <button class="btn btn-primary mt-2" id="btnComentar" type="button"><i class="bi bi-send me-1"></i>Enviar comentario</button>
        </div>`;
    } else {
        izquierda += '<div class="card-footer text-secondary">La incidencia está cerrada: ya no admite comentarios.</div>';
    }
    izquierda += "</div>";

    // ---- Administrador: asignar area, estado y prioridad (RF_09, RF_10) ----
    if (Permisos.puedeGestionar(sesion)) {
        const sugerida = incidencia.area || AREA_POR_CATEGORIA[incidencia.categoria] || "";
        derecha += `<div class="card card-warning card-outline">
            <div class="card-header"><h3 class="card-title">Gestión (administrador)</h3></div>
            <div class="card-body">
                <label for="selArea" class="form-label">Área responsable</label>
                <select id="selArea" class="form-select">
                    <option value="">Sin asignar</option>
                    ${opciones(AREAS, incidencia.area ? incidencia.area : "")}
                </select>
                ${incidencia.area ? "" : `<div class="form-text">Sugerida según la categoría: <a href="#" id="usarSugerida" data-area="${escapar(sugerida)}">${escapar(sugerida)}</a>. Al asignarla, la incidencia pasa a "En proceso".</div>`}
                <label for="selEstado" class="form-label mt-3">Estado</label>
                <select id="selEstado" class="form-select">${opciones(ESTADOS, incidencia.estado)}</select>
                <label for="selPrioridad" class="form-label mt-3">Prioridad</label>
                <select id="selPrioridad" class="form-select">${opciones(PRIORIDADES, prio)}</select>
                <button class="btn btn-warning mt-3" id="btnActualizar" type="button"><i class="bi bi-save me-1"></i>Guardar cambios</button>
            </div>
        </div>`;
    }

    // ---- Área responsable / administrador: atención y solución (RF_10, RF_11) ----
    if (Permisos.puedeAtender(sesion, incidencia)) {
        derecha += `<div class="card card-info card-outline">
            <div class="card-header"><h3 class="card-title">Atención de la incidencia</h3></div>
            <div class="card-body">
                <label for="selAtencion" class="form-label">Estado de la atención</label>
                <select id="selAtencion" class="form-select">${opciones(["En proceso", "Resuelta"], incidencia.estado)}</select>
                <label for="txtSolucion" class="form-label mt-3">Acciones realizadas / solución aplicada</label>
                <textarea id="txtSolucion" class="form-control" rows="4" maxlength="500" placeholder="Describe lo que se hizo para solucionar la incidencia">${incidencia.solucion ? escapar(incidencia.solucion.texto) : ""}</textarea>
                <div class="form-text">La solución es obligatoria para marcar la incidencia como Resuelta.</div>
                <button class="btn btn-info mt-3" id="btnAtender" type="button"><i class="bi bi-save me-1"></i>Guardar atención</button>
            </div>
        </div>`;
    }

    // ---- Acciones: cerrar, reabrir, editar, eliminar (RF_08, RF_12) ----
    let botones = "";
    if (Permisos.puedeCerrar(sesion, incidencia)) {
        const textoCerrar = Permisos.esPropia(sesion, incidencia) ? "Confirmar solución y cerrar" : "Cerrar incidencia";
        botones += `<button class="btn btn-success" id="btnCerrar" type="button"><i class="bi bi-lock me-1"></i>${textoCerrar}</button> `;
        botones += '<button class="btn btn-outline-secondary" id="btnReabrir" type="button"><i class="bi bi-arrow-counterclockwise me-1"></i>Reabrir (no quedó resuelto)</button> ';
    }
    if (Permisos.puedeEditar(sesion, incidencia)) {
        botones += `<a class="btn btn-outline-primary" href="editar.html?id=${incidencia.id}"><i class="bi bi-pencil me-1"></i>Editar</a> `;
    }
    if (Permisos.puedeEliminar(sesion, incidencia)) {
        const texto = sesion.rol === ROLES.ADMIN ? "Eliminar" : "Cancelar incidencia";
        botones += `<button class="btn btn-outline-danger" id="btnEliminar" type="button"><i class="bi bi-trash me-1"></i>${texto}</button>`;
    }
    if (botones) derecha += `<div class="card"><div class="card-header"><h3 class="card-title">Acciones</h3></div><div class="card-body d-grid gap-2">${botones}</div></div>`;

    contenedor.innerHTML =
        `<div id="avisoDetalle" class="alert alert-${esError ? "danger" : "success"}"${aviso ? "" : " hidden"}>${escapar(aviso || "")}</div>` +
        `<div class="row"><div class="col-lg-8">${izquierda}</div><div class="col-lg-4">${derecha}</div></div>
         <a class="btn btn-secondary" href="consultar.html"><i class="bi bi-arrow-left me-1"></i>Volver</a>`;
    enlazar();
}

function enlazar() {
    // RF_09 y RF_10: el administrador asigna el área, cambia el estado y la prioridad
    if (por("usarSugerida")) por("usarSugerida").addEventListener("click", function (e) {
        e.preventDefault();
        por("selArea").value = this.dataset.area;
    });

    if (por("btnActualizar")) por("btnActualizar").addEventListener("click", function () {
        const area = por("selArea").value;
        let estado = por("selEstado").value;
        const estadoElegido = estado;
        const prio = por("selPrioridad").value;

        if (area && area !== (incidencia.area || "") && incidencia.estado === "Pendiente" && estado === "Pendiente") estado = "En proceso";
        if (estado !== "Pendiente" && !area) { avisoError("Asigna un área responsable antes de cambiar el estado"); return; }
        if ((estado === "Resuelta" || estado === "Cerrada") && !incidencia.solucion) {
            avisoError("Para marcarla como Resuelta o Cerrada, el área debe registrar primero la solución");
            return;
        }

        if (area !== (incidencia.area || "")) {
            agregarComentario(incidencia, sesion, area ? `Asignada al área "${area}"` : "Se quitó la asignación de área", true);
            incidencia.area = area;
        }
        if (estado !== incidencia.estado) {
            agregarComentario(incidencia, sesion, `Estado cambiado de "${incidencia.estado}" a "${estado}"`, true);
            incidencia.estado = estado;
        }
        if (prio !== (incidencia.prioridad || "Media")) {
            agregarComentario(incidencia, sesion, `Prioridad cambiada a "${prio}"`, true);
            incidencia.prioridad = prio;
        }
        guardarCambios("Cambios guardados" + (estado !== estadoElegido ? ": al asignar el área pasó a En proceso" : ""));
    });

    // RF_10 y RF_11: el área responsable actualiza el estado y registra la solución
    if (por("btnAtender")) por("btnAtender").addEventListener("click", function () {
        const estado = por("selAtencion").value;
        const texto = por("txtSolucion").value.trim();

        if (estado === "Resuelta") {
            if (!texto) { avisoError("Describe la solución aplicada para marcar la incidencia como Resuelta"); return; }
            incidencia.solucion = { texto: texto, fecha: new Date().toLocaleString("es-PE"), por: sesion.usuario };
            agregarComentario(incidencia, sesion, "Solución registrada: " + texto, true);
            if (incidencia.estado !== "Resuelta") {
                agregarComentario(incidencia, sesion, `Estado cambiado de "${incidencia.estado}" a "Resuelta"`, true);
                incidencia.estado = "Resuelta";
            }
            guardarCambios("Solución registrada: la incidencia quedó Resuelta");
        } else if (incidencia.estado !== "En proceso") {
            agregarComentario(incidencia, sesion, `Estado cambiado de "${incidencia.estado}" a "En proceso"`, true);
            incidencia.estado = "En proceso";
            incidencia.solucion = null;
            guardarCambios("La incidencia volvió a En proceso");
        } else {
            avisoError("No hay cambios que guardar: ya está En proceso");
        }
    });

    // RF_12: cerrar la incidencia ya solucionada, o reabrirla si el problema continúa
    if (por("btnCerrar")) por("btnCerrar").addEventListener("click", function () {
        incidencia.estado = "Cerrada";
        agregarComentario(incidencia, sesion, Permisos.esPropia(sesion, incidencia)
            ? "El usuario confirmó la solución y cerró la incidencia"
            : "El administrador cerró la incidencia", true);
        guardarCambios("Incidencia cerrada");
    });

    if (por("btnReabrir")) por("btnReabrir").addEventListener("click", function () {
        incidencia.estado = incidencia.area ? "En proceso" : "Pendiente";
        incidencia.solucion = null;
        agregarComentario(incidencia, sesion, "Se reabrió la incidencia: el problema continúa", true);
        guardarCambios("Incidencia reabierta");
    });

    if (por("btnEliminar")) por("btnEliminar").addEventListener("click", function () {
        if (!confirm("¿Seguro? Esta acción no se puede deshacer.")) return;
        guardarIncidencias(lista.filter(i => i.id !== incidencia.id));
        window.location.href = "consultar.html";
    });

    if (por("btnComentar")) por("btnComentar").addEventListener("click", function () {
        const texto = por("txtComentario").value.trim();
        if (!texto) return;
        agregarComentario(incidencia, sesion, texto, false);
        guardarCambios();
    });
}

if (!incidencia || !Permisos.puedeVer(sesion, incidencia)) {
    contenedor.innerHTML = '<div class="card"><div class="card-body"><h5>Incidencia no encontrada</h5><a class="btn btn-primary" href="consultar.html">Volver</a></div></div>';
} else {
    pintar();
}
