// RF_01 - Registrar usuarios (autorregistro de estudiantes y docentes/personal)
// Los administradores y las áreas responsables las crea el administrador desde "Usuarios".
if (localStorage.getItem("sesion")) {
    window.location.href = "consultar.html";
}

const formRegistro = por("formRegistro");

formRegistro.addEventListener("submit", function (event) {
    event.preventDefault();
    const error = por("error");
    error.hidden = true;

    if (!formRegistro.checkValidity()) {
        formRegistro.classList.add("was-validated");
        return;
    }

    const nombre = por("nombre").value.trim();
    const usuario = por("usuario").value.trim().toLowerCase();
    const rol = por("rol").value;
    const clave = por("clave").value;
    const clave2 = por("clave2").value;

    if (!/^[a-z0-9._-]{3,20}$/.test(usuario)) { mostrarAviso(error, "Usuario: 3 a 20 caracteres (letras, números, . _ -)", true); return; }
    if (clave.length < 4) { mostrarAviso(error, "La contraseña debe tener al menos 4 caracteres", true); return; }
    if (clave !== clave2) { mostrarAviso(error, "Las contraseñas no coinciden", true); return; }

    const usuarios = obtenerUsuarios();
    if (usuarios.some(u => u.usuario === usuario)) { mostrarAviso(error, "Ese usuario ya existe, elige otro", true); return; }

    usuarios.push({ usuario: usuario, clave: clave, rol: rol, nombre: nombre, activo: true });
    guardarUsuarios(usuarios);
    guardar("sesion", { usuario: usuario, rol: rol });
    window.location.href = "consultar.html";
});
