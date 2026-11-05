// Funciones para mostrar datos del backend en pantalla. No hacen peticiones.

// El backend manda la fecha como texto 'AAAA-MM-DD'. Ojo: new Date('2026-10-26') la toma como medianoche
// en UTC y en México se mostraría el 25 de octubre. Por eso se arma con año, mes y día (hora local).
function aFechaLocal(fecha) {
  const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

export function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha';
  const local = aFechaLocal(fecha);
  if (isNaN(local)) return 'Sin fecha';
  return local.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// El backend manda fecha y hora como 'AAAA-MM-DD HH:MM:SS'.
export function formatearFechaHora(texto) {
  if (!texto) return '';
  const [fecha, hora = ''] = String(texto).split(/[ T]/);
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio} ${hora.slice(0, 5)}`.trim();
}

// true si la fecha del taller ya pasó (el taller de hoy todavía cuenta como próximo).
export function yaPaso(fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return aFechaLocal(fecha) < hoy;
}

// true si el taller es hoy o ya pasó: desde ese día se puede pasar lista.
export function yaEmpezo(fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return aFechaLocal(fecha) <= hoy;
}

// La boleta es un dato personal: en listas públicas solo se muestran los últimos 4 dígitos.
export function ocultarBoleta(boleta) {
  const texto = String(boleta);
  return '*'.repeat(Math.max(0, texto.length - 4)) + texto.slice(-4);
}
