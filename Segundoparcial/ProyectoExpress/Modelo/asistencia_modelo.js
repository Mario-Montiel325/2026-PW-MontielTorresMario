const crypto = require('crypto');
const pool = require('../bd-local');

async function obtenerAsistenciaPorId(id) {
    const [filas] = await pool.query('SELECT id, taller_id, nombre_alumno, boleta, fecha_registro FROM asistencias WHERE id = ?', [id]);
    return filas[0];
}

async function registrarAsistencia({taller_id, nombre_alumno, boleta}) {
    const id = crypto.randomUUID();
    await pool.query(
        'INSERT INTO asistencias (id, taller_id, nombre_alumno, boleta) VALUES (?, ?, ?, ?)',
        [id, taller_id, nombre_alumno, boleta]
    );
    return obtenerAsistenciaPorId(id);
}

async function consultarAsistenciaTaller(taller_id) {
    const [filas] = await pool.query(`
        SELECT id, taller_id, nombre_alumno, boleta, fecha_registro
        FROM asistencias
        WHERE taller_id = ?
        ORDER BY fecha_registro, nombre_alumno`, [taller_id]);
    return filas;
}

async function consultarAsistenciaAlumno(boleta) {
    const [filas] = await pool.query(`
        SELECT a.id, a.fecha_registro, t.id AS taller_id, t.nombre AS taller
        FROM asistencias a
        JOIN talleres t ON t.id = a.taller_id
        WHERE a.boleta = ?
        ORDER BY a.fecha_registro DESC`, [boleta]);
    return filas;
}

async function eliminarAsistencia(id) {
    const [info] = await pool.query('DELETE FROM asistencias WHERE id = ?', [id]);
    return info.affectedRows > 0;
}

module.exports = {registrarAsistencia, consultarAsistenciaTaller, consultarAsistenciaAlumno, eliminarAsistencia}
