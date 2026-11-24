// Sección 6: la sesión con JWT. El token se guarda en localStorage y este JavaScript lo manda
// en cada petición dentro del header Authorization; el navegador no hace nada solo.
(() => {
    const $ = (id) => document.getElementById(id);

    let tokenActual = localStorage.getItem("token") || "";

    function guardarToken(token) {
        tokenActual = token || "";
        if (tokenActual) localStorage.setItem("token", tokenActual);
        else localStorage.removeItem("token");
    }

    async function llamar(metodo, url, cuerpo, conToken) {
        const opciones = { method: metodo, headers: {} };
        if (cuerpo !== undefined) {
            opciones.headers["Content-Type"] = "application/json";
            opciones.body = JSON.stringify(cuerpo);
        }
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
        return { status: respuesta.status, datos };
    }

    // Un JWT son 3 partes en Base64URL separadas por puntos: cabecera.payload.firma.
    // atob() solo entiende Base64 normal y regresa bytes sueltos, por eso se arregla el
    // alfabeto, el relleno y se vuelve a juntar como UTF-8 (acentos y eñes).
    function base64UrlAObjeto(trozo) {
        const normal = trozo.replace(/-/g, "+").replace(/_/g, "/");
        const relleno = normal + "=".repeat((4 - (normal.length % 4)) % 4);
        const comoUtf8 = atob(relleno)
            .split("")
            .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
            .join("");
        return JSON.parse(decodeURIComponent(comoUtf8));
    }

    function objetoABase64Url(objeto) {
        const comoBytes = encodeURIComponent(JSON.stringify(objeto)).replace(
            /%([0-9A-F]{2})/g,
            (_, hex) => String.fromCharCode(parseInt(hex, 16)),
        );
        return btoa(comoBytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    function decodificarToken(token) {
        if (!token) return null;
        const partes = token.split(".");
        if (partes.length !== 3) return null;
        try {
            return { payload: base64UrlAObjeto(partes[1]), partes };
        } catch (error) {
            return null;
        }
    }

    function pintarToken() {
        const estado = $("estado-token");
        const decodificado = decodificarToken(tokenActual);

        if (!decodificado) {
            estado.textContent = "Sin token";
            estado.className = "estado sin-sesion";
            $("token-coloreado").textContent = "—";
            $("payload-decodificado").textContent = "—";
            return;
        }

        const { payload, partes } = decodificado;
        const restante = Math.round(payload.exp - Date.now() / 1000);
        estado.textContent = `Token de ${payload.usuario} · rol ${payload.rol} · vence en ${restante} s (según el reloj del navegador)`;
        estado.className = restante > 0 ? "estado con-sesion" : "estado sin-sesion";

        const caja = $("token-coloreado");
        caja.replaceChildren();
        const clases = ["segmento-cabecera", "segmento-payload", "segmento-firma"];
        partes.forEach((parte, indice) => {
            const span = document.createElement("span");
            span.className = clases[indice];
            span.textContent = parte;
            caja.append(span);
            if (indice < 2) caja.append(".");
        });
        $("payload-decodificado").textContent = JSON.stringify(payload, null, 2);
    }

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

    function fecha(valor) {
        return valor ? new Date(valor).toLocaleString() : "—";
    }

    function filaMensaje(cuerpo, columnas, texto) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = columnas;
        celda.textContent = texto;
        fila.append(celda);
        cuerpo.append(fila);
    }

    function agregarFila(cuerpo, textos) {
        const fila = document.createElement("tr");
        for (const texto of textos) {
            const celda = document.createElement("td");
            celda.textContent = texto;
            fila.append(celda);
        }
        cuerpo.append(fila);
        return fila;
    }

    // Las tablas del admin solo se piden si el token dice que eres admin; aun así el servidor
    // vuelve a revisar el rol y regresa 403 si no lo eres.
    async function pintarAdmin() {
        const decodificado = decodificarToken(tokenActual);
        const esAdmin = Boolean(decodificado && decodificado.payload.rol === "admin");
        $("aviso-admin").hidden = esAdmin;
        $("zona-admin").hidden = !esAdmin;
        if (!esAdmin) return;

        const activos = await llamar("GET", "/api/jwt/admin/sesiones", undefined, true);
        const cuerpoActivos = $("tabla-activos");
        cuerpoActivos.replaceChildren();
        if (activos.status !== 200) {
            filaMensaje(cuerpoActivos, 4, `${activos.status} · ${activos.datos ? activos.datos.error : "Error"}`);
        } else if (activos.datos.tokens.length === 0) {
            filaMensaje(cuerpoActivos, 4, "(sin sesiones activas)");
        } else {
            for (const t of activos.datos.tokens) {
                const esTuyo = t.jti === activos.datos.tuyo;
                const fila = agregarFila(cuerpoActivos, [esTuyo ? `${t.usuario} (tú)` : t.usuario, t.rol, fecha(t.expira)]);
                const celda = document.createElement("td");
                if (!esTuyo) {
                    const boton = document.createElement("button");
                    boton.type = "button";
                    boton.className = "peligro";
                    boton.textContent = "Cerrar sesión";
                    boton.addEventListener("click", () => revocarSesion(t.jti));
                    celda.append(boton);
                }
                fila.append(celda);
            }
        }

        const revocados = await llamar("GET", "/api/jwt/diagnostico/revocados", undefined, true);
        const cuerpoRevocados = $("tabla-revocados");
        cuerpoRevocados.replaceChildren();
        if (revocados.status !== 200) {
            filaMensaje(cuerpoRevocados, 2, `${revocados.status} · ${revocados.datos ? revocados.datos.error : "Error"}`);
        } else if (revocados.datos.tokens.length === 0) {
            filaMensaje(cuerpoRevocados, 2, "(sin tokens revocados)");
        } else {
            for (const t of revocados.datos.tokens) {
                agregarFila(cuerpoRevocados, [t.usuario, fecha(t.expira)]);
            }
        }
    }

    async function refrescarJWT() {
        pintarToken();
        await pintarAdmin();
    }

    async function revocarSesion(jti) {
        const url = "/api/jwt/admin/revocar";
        const { status, datos } = await llamar("POST", url, { jti }, true);
        anotar("POST", url, status, datos);
        await refrescarJWT();
    }

    $("btn-login-jwt").addEventListener("click", async () => {
        const url = "/api/jwt/login";
        const { status, datos } = await llamar("POST", url, {
            usuario: $("usuario").value,
            contrasena: $("contrasena").value,
        });
        anotar("POST", url, status, datos);
        if (status === 200 && datos && datos.token) guardarToken(datos.token);
        await refrescarJWT();
    });

    document.querySelectorAll("[data-jwt-url]").forEach((boton) => {
        boton.addEventListener("click", async () => {
            const { jwtMetodo: metodo, jwtUrl: url } = boton.dataset;
            const conToken = boton.dataset.jwtSintoken !== "true";
            const { status, datos } = await llamar(metodo, url, undefined, conToken);
            anotar(metodo, url, status, datos);
            if (url === "/api/jwt/refresh" && status === 200 && datos.token) guardarToken(datos.token);
            await refrescarJWT();
        });
    });

    // Cambia el rol en el payload pero deja la firma vieja: el servidor lo detecta y responde 401.
    $("btn-alterar-rol").addEventListener("click", async () => {
        const decodificado = decodificarToken(tokenActual);
        if (!decodificado) return;
        const [cabecera, , firma] = decodificado.partes;
        const payload = objetoABase64Url({ ...decodificado.payload, rol: "admin" });
        guardarToken([cabecera, payload, firma].join("."));
        anotar("--", "localStorage", "--", { mensaje: "Cambiaste el rol a admin sin volver a firmar. Prueba GET /api/jwt/admin/reporte" });
        await refrescarJWT();
    });

    $("btn-borrar-token").addEventListener("click", async () => {
        guardarToken("");
        anotar("--", "localStorage", "--", { mensaje: "Token borrado del navegador (el servidor no se entera)" });
        await refrescarJWT();
    });

    $("btn-actualizar-jwt").addEventListener("click", refrescarJWT);

    refrescarJWT();
})();