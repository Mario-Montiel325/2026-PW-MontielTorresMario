const patrones = {
    nombre: /^[A-Za-zÁÉÍÓÚÑáéíóúñÜü\s]{2,60}$/,
    boleta: /^\d{10}$/,
    fecha: /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
};

const mensajes = {
    nombre: "Debe contener solo letras (2 a 60 caracteres)",
    boleta: "Debe tener 10 digitos",
    fecha: "Debe tener formato DD/MM/AAAA",
};

function validarCampo(campo, valor) {
    return patrones[campo].test(valor.trim());
}

if (typeof document !== 'undefined') {
    const formulario = document.getElementById('form-registro');

    formulario.addEventListener('submit', (evento) => {
        evento.preventDefault();

        let formularioValido = true;

        for (const campo of Object.keys(patrones)) {
            const input = document.getElementById(campo);
            const errorSpan = document.getElementById(`error-${campo}`);
            const esValido = validarCampo(campo, input.value);

            input.classList.toggle('invalido', !esValido);
            errorSpan.textContent = esValido ? '' : mensajes[campo];

            if (!esValido) {
                formularioValido = false;
            }
        }

        const mensajeExito = document.getElementById('mensaje-exito');
        mensajeExito.textContent = formularioValido ? 'Registro exitoso!' : '';
        mensajeExito.classList.toggle('activo', formularioValido);
    });
}