export const ROLES = ['alumno', 'admin', 'instructor'];

export function validarCorreo(correo) {
  if (typeof correo !== 'string') return false;
  const limpio = correo.trim();
  return limpio.length <= 100 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio);
}

export function validarBoleta(boleta) {
  if (typeof boleta !== 'string') return false;
  return /^\d{10}$/.test(boleta.trim());
}

export function validarContrasena(contrasena) {
  if (typeof contrasena !== 'string') return false;
  if (contrasena.length < 8 || contrasena.length > 64) return false;
  return /[A-Za-z]/.test(contrasena) && /\d/.test(contrasena);
}

export function validarNombre(nombre) {
  if (typeof nombre !== 'string') return false;
  const limpio = nombre.trim();
  if (limpio.length < 3 || limpio.length > 100) return false;
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+( [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(limpio);
}

export function validarNombreTaller(nombre) {
  if (typeof nombre !== 'string') return false;
  const limpio = nombre.trim();
  if (limpio.length < 3 || limpio.length > 100) return false;
  return /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ.,:+#()\- ]+$/.test(limpio) && /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(limpio);
}

export function validarInstructor(instructor) {
  if (typeof instructor !== 'string') return false;
  const limpio = instructor.trim();
  if (limpio.length < 3 || limpio.length > 100) return false;
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.]+( [A-Za-zÁÉÍÓÚÜÑáéíóúüñ.]+)*$/.test(limpio);
}

export function validarFecha(fecha) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const d = new Date(anio, mes - 1, dia);
  return d.getFullYear() === anio && d.getMonth() === mes - 1 && d.getDate() === dia;
}

export function hoy() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function esFechaPasada(fecha) {
  return String(fecha).slice(0, 10) < hoy();
}

export function validarCupo(cupo) {
  return Number.isInteger(cupo) && cupo > 0 && cupo <= 500;
}

export function validarRol(rol) {
  return typeof rol === 'string' && ROLES.includes(rol.trim().toLowerCase());
}
