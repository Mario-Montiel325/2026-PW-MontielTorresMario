// La página solo usa el token que tiene guardado en localStorage y lo manda ella misma
// en cada petición, dentro del header Authorization. A diferencia de la demo con sesión,
// aquí el navegador no hace nada solo: todo el trabajo de "acordarse quién soy" lo hace
// este JavaScript.
const $ = (id) => document.getElementById(id);

// Una sola función para no repetir fetch + try/catch en cada botón, igual que en demo.js.
async function llamar(metodo, url, cuerpo) {
    const opciones = { method: metodo };
    if (cuerpo !== undefined) {
        opciones.headers = { "Content-Type": "application/json" };
        opciones.body = JSON.stringify(cuerpo);
    }
    const respuesta = await fetch(url, opciones);

    let datos = null;
    try {
        datos = await respuesta.json();
    } catch (error) {
        datos = null;
    }

    return { status: respuesta.status, datos };
}

// Tarjeta 6: pide /api/config y lo pinta tal cual.
async function pintarConfig() {
    const { datos } = await llamar("GET", "/api/config");
    $("config-jwt").textContent = JSON.stringify(datos, null, 2);
}

// Guardamos el token en una variable para no estar leyendo localStorage todo el tiempo,
// pero la fuente de verdad sigue siendo localStorage (por eso cada vez que cambia,
// también lo guardamos ahí con guardarToken()).
let tokenActual = localStorage.getItem("token") || "";

function guardarToken(token) {
    tokenActual = token || "";
    if (tokenActual) {
        localStorage.setItem("token", tokenActual);
    } else {
        localStorage.removeItem("token");
    }
}

// Un JWT viene en 3 partes separadas por puntos: cabecera.payload.firma.
// Las primeras dos están en Base64URL. Por eso no puedo usar atob() directo,
// primero tengo que regresarle su forma de Base64 normal.
function base64UrlADecodificado(trozo) {
    const normal = trozo.replace(/-/g, "+").replace(/_/g, "/");
    const relleno = normal + "=".repeat((4 - (normal.length % 4)) % 4);
    const binario = atob(relleno);
    // atob() nos da el texto como si cada caracter fuera 1 byte (Latin-1), pero el
    // JSON original venía en UTF-8, donde acentos y eñes ocupan más de un byte.
    // Aquí "reempaquetamos" cada byte como %XX y usamos decodeURIComponent para
    // que los vuelva a juntar correctamente como UTF-8.
    const comoUtf8 = binario
        .split("")
        .map(
            (caracter) => "%" + caracter.charCodeAt(0).toString(16).padStart(2, "0"),
        )
        .join("");
    return JSON.parse(decodeURIComponent(comoUtf8));
}

// Parte el token en sus 3 pedazos y decodifica los primeros dos (la firma no es
// JSON, son puros bytes, esa la dejamos tal cual). Regresa null si el token no
// tiene forma de JWT.
function decodificarToken(token) {
    if (!token) return null;
    const partes = token.split(".");
    if (partes.length !== 3) return null;
    try {
        return {
            cabecera: base64UrlADecodificado(partes[0]),
            payload: base64UrlADecodificado(partes[1]),
            firma: partes[2],
            crudo: { cabecera: partes[0], payload: partes[1], firma: partes[2] },
        };
    } catch (error) {
        return null;
    }
}

// La inversa: me vuelve a armar el Base64URL de un objeto. La necesito para
// "Alterar: rol → admin".
function decodificadoABase64Url(objeto) {
    const texto = JSON.stringify(objeto);
    const comoBytes = encodeURIComponent(texto).replace(
        /%([0-9A-F]{2})/g,
        (_, hex) => String.fromCharCode(parseInt(hex, 16)),
    );
    const base64 = btoa(comoBytes);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Pinta la tarjeta 1 completa: estado, token crudo dividido en colores, y los
// paneles de cabecera/payload decodificados.
function pintarToken() {
    const estado = $("estado-token");
    $("token-crudo").value = tokenActual;

    const decodificado = decodificarToken(tokenActual);

    if (!decodificado) {
        estado.textContent = "Sin token";
        estado.className = "estado sin-sesion";
        $("token-coloreado").textContent = "—";
        $("cabecera-decodificada").textContent = "—";
        $("payload-decodificado").textContent = "—";
        return;
    }

    const { cabecera, payload, crudo } = decodificado;

    const restante = Math.round(payload.exp - Date.now() / 1000);
    estado.textContent = `Token de ${payload.usuario} · rol ${payload.rol} · vence en ${restante} s (según el reloj del navegador)`;
    estado.className = restante > 0 ? "estado con-sesion" : "estado sin-sesion";

    const caja = $("token-coloreado");
    caja.replaceChildren();
    const partes = [
        { texto: crudo.cabecera, clase: "segmento-cabecera" },
        { texto: crudo.payload, clase: "segmento-payload" },
        { texto: crudo.firma, clase: "segmento-firma" },
    ];
    partes.forEach((parte, indice) => {
        const span = document.createElement("span");
        span.className = parte.clase;
        span.textContent = parte.texto;
        caja.append(span);
        if (indice < partes.length - 1) caja.append(".");
    });

    $("cabecera-decodificada").textContent = JSON.stringify(cabecera, null, 2);
    $("payload-decodificado").textContent = JSON.stringify(payload, null, 2);
}

// Pinta una línea en la bitácora, igual que en demo.js.
function anotar(metodo, url, status, datos) {
    const li = document.createElement("li");

    let clase = "error";
    if (status >= 200 && status < 300) clase = "ok";
    else if (status === 401) clase = "e401";
    else if (status === 403) clase = "e403";

    const codigo = document.createElement("span");
    codigo.className = `codigo ${clase}`;
    codigo.textContent = status;

    const linea = document.createElement("span");
    linea.textContent = ` ${metodo} ${url}`;

    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(datos, null, 2);

    li.append(codigo, linea, pre);
    $("bitacora-jwt").prepend(li);
}

// Tarjeta 4: filas en sessions (comparando con la demo vieja) + lista negra.
async function pintarAlmacen() {
    const sesiones = await llamar("GET", "/api/diagnostico/sesiones");
    const totalSesiones =
        sesiones.status === 200 && sesiones.datos
            ? sesiones.datos.sesiones.length
            : "?";
    $("filas-sessions").textContent =
        `Filas en la tabla sessions: ${totalSesiones}. Con JWT el servidor no crea ninguna.`;

    const revocados = await llamar("GET", "/api/jwt/diagnostico/revocados");
    const cuerpo = $("tabla-revocados");
    cuerpo.replaceChildren();

    const lista =
        revocados.status === 200 && revocados.datos ? revocados.datos.tokens : [];
    if (!lista || lista.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 2;
        celda.textContent = "(sin tokens revocados)";
        fila.append(celda);
        cuerpo.append(fila);
        return;
    }

    for (const t of lista) {
        const fila = document.createElement("tr");
        const textos = [
            t.usuario,
            t.expira ? new Date(t.expira).toLocaleString() : "—",
        ];
        for (const texto of textos) {
            const celda = document.createElement("td");
            celda.textContent = texto;
            fila.append(celda);
        }
        cuerpo.append(fila);
    }
}

// Tarjeta 5: lo que un script metido por XSS podría leer.
function pintarFugas() {
    $("local-storage-token").textContent =
        localStorage.getItem("token") || "(vacío)";
    $("cookie-js-jwt").textContent = document.cookie || "(vacío)";
}

// Junta todo lo que hay que refrescar después de cualquier acción.
async function refrescarTodo() {
    pintarToken();
    await pintarAlmacen();
    pintarFugas();
}

// --- Tarjeta 1: botones para manejar el token a mano ---
$("btn-usar-token").addEventListener("click", async () => {
    guardarToken($("token-crudo").value.trim());
    await refrescarTodo();
});

$("btn-alterar-rol").addEventListener("click", async () => {
    const decodificado = decodificarToken(tokenActual);
    if (!decodificado) return;
    const payloadAlterado = { ...decodificado.payload, rol: "admin" };
    const token = [
        decodificado.crudo.cabecera,
        decodificadoABase64Url(payloadAlterado),
        decodificado.crudo.firma,
    ].join(".");
    guardarToken(token);
    await refrescarTodo();
});

$("btn-borrar-token").addEventListener("click", async () => {
    guardarToken("");
    await refrescarTodo();
});

// --- Tarjeta 2: login ---
$("form-login-jwt").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const { status, datos } = await llamar("POST", "/api/jwt/login", {
        usuario: $("usuario-jwt").value,
        contrasena: $("contrasena-jwt").value,
    });
    if (status === 200 && datos && datos.token) {
        guardarToken(datos.token);
    }
    await refrescarTodo();
});

$("usuario-jwt").addEventListener("change", () => {
    $("contrasena-jwt").value = `${$("usuario-jwt").value}12345`;
});

// --- Tarjeta 3: botones que llaman a la API ---
async function ejecutar(metodo, url, conToken) {
    const opciones = { method: metodo, headers: {} };
    if (conToken && tokenActual) {
        opciones.headers.Authorization = `Bearer ${tokenActual}`;
    }
    const respuesta = await fetch(url, opciones);
    let datos = null;
    try {
        datos = await respuesta.json();
    } catch (error) {
        datos = null;
    }
    anotar(metodo, url, respuesta.status, datos);
    if (
        metodo === "POST" &&
        url === "/api/jwt/refresh" &&
        respuesta.status === 200 &&
        datos.token
    ) {
        guardarToken(datos.token);
    }
    await refrescarTodo();
}

document.querySelectorAll("[data-url]").forEach((boton) => {
    boton.addEventListener("click", () => {
        const conToken = boton.dataset.sintoken !== "true";
        ejecutar(boton.dataset.metodo, boton.dataset.url, conToken);
    });
});

// Arranque: en cuanto carga la página, pintamos todo con lo que ya hubiera
// guardado en localStorage de una visita anterior, y traemos la configuración.
async function iniciar() {
    await refrescarTodo();
    await pintarConfig();
}

iniciar();