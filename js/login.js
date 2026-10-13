// RF_02 - Iniciar sesión
// Si ya hay sesión, no tiene sentido ver el login
if (localStorage.getItem("sesion")) {
    window.location.href = "consultar.html";
}

por("formLogin").addEventListener("submit", function (event) {
    event.preventDefault();
    const usuario = por("usuario").value.trim().toLowerCase();
    const clave = por("clave").value;
    const error = por("error");

    const encontrado = obtenerUsuarios().find(u => u.usuario === usuario && u.clave === clave);

    if (!encontrado) {
        mostrarAviso(error, "Usuario o contraseña incorrectos", true);
    } else if (encontrado.activo === false) {
        mostrarAviso(error, "Tu cuenta está desactivada. Contacta al administrador", true);
    } else {
        guardar("sesion", { usuario: encontrado.usuario, rol: encontrado.rol });
        window.location.href = "consultar.html";
    }
});
