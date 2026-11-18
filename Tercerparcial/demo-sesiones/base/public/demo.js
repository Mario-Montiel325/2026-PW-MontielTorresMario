// La página solo hace fetch a la API. El navegador manda la cookie solo (misma página, mismo servidor).
const $ = (id) => document.getElementById(id);

// Todas las peticiones pasan por aquí para no repetir fetch y para que un 401/403 o una respuesta que no sea JSON no truene la página.
async function llamar(metodo, url, cuerpo) {
  const opciones = { method: metodo };
  if (cuerpo !== undefined) {
    opciones.headers = { 'Content-Type': 'application/json' };
    opciones.body = JSON.stringify(cuerpo);
  }
  const respuesta = await fetch(url, opciones);
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }
  return { status: respuesta.status, datos };
}

// El color deja ver de un vistazo si fue éxito, 401 (no sé quién eres), 403 (sé quién eres pero no puedes) u otro error.
function claseDelCodigo(status) {
  if (status >= 200 && status < 300) return 'codigo ok';
  if (status === 401) return 'codigo e401';
  if (status === 403) return 'codigo e403';
  return 'codigo error';
}

// La bitácora deja evidencia de cada respuesta; uso textContent porque el JSON trae texto del servidor y con innerHTML se podría colar un XSS.
function anotar(metodo, url, status, datos) {
  const li = document.createElement('li');

  const codigo = document.createElement('span');
  codigo.className = claseDelCodigo(status);
  codigo.textContent = status;

  const peticion = document.createElement('span');
  peticion.textContent = ` ${metodo} ${url}`;

  const json = document.createElement('pre');
  json.textContent = JSON.stringify(datos, null, 2);

  li.append(codigo, peticion, json);
  $('bitacora').prepend(li);
}

// El único que sabe si sigo con sesión es el servidor, por eso se le pregunta en lugar de confiar en lo que tenga la página.
async function mostrarEstado() {
  const { status, datos } = await llamar('GET', '/api/sesion');
  const estado = $('estado');

  if (status === 200 && datos && datos.usuario) {
    const { nombre, rol } = datos.usuario;
    estado.textContent = `${nombre} (${rol}) · sesión ${datos.sesion} · vence en ${datos.expiraEnSegundos} s`;
    estado.className = 'estado con-sesion';
  } else {
    estado.textContent = `Sin sesión (el servidor responde ${status})`;
    estado.className = 'estado sin-sesion';
  }

  $('cookie-js').textContent = document.cookie || '(vacío)';
}

// Sirve para ver que los datos de la sesión viven en el servidor; se vacía el tbody antes para que las filas no se dupliquen.
async function mostrarSesiones() {
  const { status, datos } = await llamar('GET', '/api/diagnostico/sesiones');
  const tabla = $('tabla-sesiones');
  tabla.replaceChildren();

  if (status !== 200 || !datos) {
    $('donde').textContent = `No se pudo leer el diagnóstico (${status})`;
    agregarFila(tabla, ['(sin sesiones)']);
    return;
  }

  $('donde').textContent = datos.almacen === 'memoria'
    ? 'En la memoria del servidor (se pierden al reiniciar)'
    : 'En MySQL, tabla sessions (sobreviven a un reinicio)';

  const sesiones = datos.sesiones || [];
  if (sesiones.length === 0) {
    agregarFila(tabla, ['(sin sesiones)']);
    return;
  }

  for (const s of sesiones) {
    const vence = s.expira ? new Date(s.expira).toLocaleTimeString() : '—';
    const fila = agregarFila(tabla, [s.esLaTuya ? `${s.sesion} (la tuya)` : s.sesion, s.usuario || '(sin login)', s.visitas, vence]);
    if (s.esLaTuya) fila.className = 'tuya';
  }
}

// Las celdas también llevan datos del servidor (el usuario), así que van con textContent; una sola celda ocupa las 4 columnas.
function agregarFila(tabla, valores) {
  const fila = document.createElement('tr');
  for (const valor of valores) {
    const celda = document.createElement('td');
    celda.textContent = valor;
    if (valores.length === 1) celda.colSpan = 4;
    fila.append(celda);
  }
  tabla.append(fila);
  return fila;
}

// Después de cualquier acción cambian el estado y la tabla a la vez, así que se refrescan juntos.
async function refrescarTodo() {
  await Promise.all([mostrarEstado(), mostrarSesiones()]);
}

// Login sin recargar: si la página se recargara se perdería la bitácora.
$('form-login').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const cuerpo = { usuario: $('usuario').value, contrasena: $('contrasena').value };
  const { status, datos } = await llamar('POST', '/api/login', cuerpo);
  anotar('POST', '/api/login', status, datos);
  await refrescarTodo();
});

// Para no escribir la contraseña de ejemplo cada vez que se cambia de usuario.
$('usuario').addEventListener('change', () => {
  $('contrasena').value = `${$('usuario').value}12345`;
});

// Un solo recorrido para todos los botones: cada uno ya dice en su data-metodo y data-url qué pedir.
document.querySelectorAll('button[data-url]').forEach((boton) => {
  boton.addEventListener('click', async () => {
    const { metodo, url } = boton.dataset;
    const { status, datos } = await llamar(metodo, url);
    anotar(metodo, url, status, datos);
    await refrescarTodo();
  });
});

$('btn-refrescar').addEventListener('click', refrescarTodo);
$('btn-sesiones').addEventListener('click', mostrarSesiones);

// El script está al final del body, así que el DOM ya existe y no hace falta esperar DOMContentLoaded.
async function iniciar() {
  const { datos } = await llamar('GET', '/api/config');
  $('config').textContent = JSON.stringify(datos, null, 2);
  await refrescarTodo();
}

iniciar();
