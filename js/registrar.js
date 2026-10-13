// RF_03 - Registrar incidencias · RF_04 - Adjuntar fotografía · RF_05 - Registrar ubicación
// (todos los roles pueden registrar). RNF_04: se validan los datos obligatorios antes de guardar.
const sesion = requerirSesion();
iniciarCabecera(sesion);

const form = por("formIncidencia");
por("categoria").innerHTML = '<option value="">Selecciona...</option>' + CATEGORIAS.map(c => `<option>${c}</option>`).join("");
const campoFoto = iniciarCampoFoto("");

form.addEventListener("submit", function (event) {
    event.preventDefault();
    const msg = por("mensaje");
    msg.hidden = true;

    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }

    const lista = obtenerIncidencias();
    const id = lista.length ? Math.max(...lista.map(i => i.id)) + 1 : 1;

    const nueva = {
        id: id,
        titulo: por("titulo").value.trim(),
        categoria: por("categoria").value,
        ubicacion: por("ubicacion").value.trim(),
        descripcion: por("descripcion").value.trim(),
        foto: campoFoto.valor(),
        estado: "Pendiente",
        prioridad: "Media",          // el administrador la ajusta después
        area: "",                    // el administrador la asigna después
        solucion: null,
        fecha: new Date().toLocaleDateString("es-PE"),
        usuario: sesion.usuario,
        comentarios: []
    };
    agregarComentario(nueva, sesion, "Incidencia registrada", true);
    lista.push(nueva);

    if (!guardarIncidencias(lista)) {
        mostrarAviso(msg, "No se pudo guardar: el almacenamiento del navegador está lleno. Prueba con una foto más liviana o sin foto.", true);
        return;
    }
    form.reset();
    form.classList.remove("was-validated");
    campoFoto.limpiar();
    mostrarAviso(msg, "Incidencia #" + id + " registrada correctamente. Puedes seguirla desde \"Incidencias\".", false);
});
