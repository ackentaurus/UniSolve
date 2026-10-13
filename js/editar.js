// RF_08 - Editar una incidencia
// Admin: cualquiera. Estudiante/Docente: solo las suyas y mientras estén Pendientes.
const sesion = requerirSesion();
iniciarCabecera(sesion);

const id = Number(new URLSearchParams(window.location.search).get("id"));
const lista = obtenerIncidencias();
const incidencia = lista.find(i => i.id === id);
const form = por("formEditar");

function bloque(titulo, texto, botones) {
    form.outerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">${titulo}</h3></div>
        <div class="card-body">${texto ? `<p>${texto}</p>` : ""}${botones}</div></div>`;
}

if (!incidencia || !Permisos.puedeVer(sesion, incidencia)) {
    bloque("Incidencia no encontrada", "", '<a class="btn btn-primary" href="consultar.html">Volver</a>');
} else if (!Permisos.puedeEditar(sesion, incidencia)) {
    bloque("No puedes editar esta incidencia",
        "Solo se pueden editar tus propias incidencias mientras estén en estado <strong>Pendiente</strong>. Si necesitas un cambio, agrega un comentario en el detalle.",
        `<a class="btn btn-primary" href="detalle.html?id=${incidencia.id}">Ver detalle</a> <a class="btn btn-secondary" href="consultar.html">Volver</a>`);
} else {
    por("encabezado").textContent = "Editar incidencia #" + incidencia.id;
    por("categoria").innerHTML = CATEGORIAS.map(c => `<option>${c}</option>`).join("");
    por("titulo").value = incidencia.titulo;
    por("categoria").value = incidencia.categoria;
    por("ubicacion").value = incidencia.ubicacion;
    por("descripcion").value = incidencia.descripcion;
    const campoFoto = iniciarCampoFoto(incidencia.foto);
    por("btnVolver").href = "detalle.html?id=" + incidencia.id;

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const msg = por("mensaje");
        msg.hidden = true;
        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }
        const copia = JSON.stringify(incidencia);
        incidencia.titulo = por("titulo").value.trim();
        incidencia.categoria = por("categoria").value;
        incidencia.ubicacion = por("ubicacion").value.trim();
        incidencia.descripcion = por("descripcion").value.trim();
        incidencia.foto = campoFoto.valor();
        agregarComentario(incidencia, sesion, "Incidencia editada", true);

        if (!guardarIncidencias(lista)) {
            Object.keys(incidencia).forEach(k => delete incidencia[k]);
            Object.assign(incidencia, JSON.parse(copia));
            mostrarAviso(msg, "No se pudo guardar: el almacenamiento del navegador está lleno. Prueba con una foto más liviana.", true);
            return;
        }
        mostrarAviso(msg, "Cambios guardados correctamente", false);
    });
}
