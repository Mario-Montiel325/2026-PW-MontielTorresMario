const crypto = require('crypto');
const pool = require('../bd-local');

// Un alumno puede tener hasta dos registros por taller:
// el que tiene fecha anterior al taller es su inscripción y el del día del taller (o después) es su llegada.
const RESUMEN_POR_ALUMNO = `
    MIN(a.nombre_alumno) AS nombre_alumno,
    MIN(CASE WHEN DATE(a.fecha_registro) < t.fecha THEN a.id END) AS inscripcion_id,
    MIN(CASE WHEN DATE(a.fecha_registro) < t.fecha THEN a.fecha_registro END) AS inscrito_en,
    MIN(CASE WHEN DATE(a.fecha_registro) >= t.fecha THEN a.id END) AS llegada_id,
    MIN(CASE WHEN DATE(a.fecha_registro) >= t.fecha THEN a.fecha_registro END) AS llego_en`;

async function obtenerAsistenciaPorId(id) {
    const [filas] = await pool.query('SELECT id, taller_id, nombre_alumno, boleta, fecha_registro FROM asistencias WHERE id = ?', [id]);
    return filas[0];
}

async function buscarEnTaller(taller_id, boleta) {
    const [filas] = await pool.query(`
        SELECT a.boleta, ${RESUMEN_POR_ALUMNO}
        FROM asistencias a
        JOIN talleres t ON t.id = a.taller_id
        WHERE a.taller_id = ? AND a.boleta = ?
        GROUP BY a.boleta`, [taller_id, boleta]);
    return filas[0];
}

async function buscarMismoDia(boleta, fecha, taller_id) {
    const [filas] = await pool.query(`
        SELECT t.id, t.nombre
        FROM asistencias a
        JOIN talleres t ON t.id = a.taller_id
        WHERE a.boleta = ? AND t.fecha = ? AND t.id <> ?
        LIMIT 1`, [boleta, fecha, taller_id]);
    return filas[0];
}

async function buscarChoqueAlMover(taller_id, fecha) {
    const [filas] = await pool.query(`
        SELECT a.nombre_alumno, t.nombre AS taller
        FROM asistencias a
        JOIN asistencias b ON b.boleta = a.boleta AND b.taller_id <> a.taller_id
        JOIN talleres t ON t.id = b.taller_id
        WHERE a.taller_id = ? AND t.fecha = ?
        LIMIT 1`, [taller_id, fecha]);
    return filas[0];
}

async function contarTalleresPorBoleta(boleta) {
    const [filas] = await pool.query('SELECT COUNT(DISTINCT taller_id) AS total FROM asistencias WHERE boleta = ?', [boleta]);
    return Number(filas[0].total);
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
        SELECT a.boleta, ${RESUMEN_POR_ALUMNO}
        FROM asistencias a
        JOIN talleres t ON t.id = a.taller_id
        WHERE a.taller_id = ?
        GROUP BY a.boleta
        ORDER BY nombre_alumno`, [taller_id]);
    return filas;
}

async function consultarAsistenciaAlumno(boleta) {
    const [filas] = await pool.query(`
        SELECT t.id AS taller_id, t.nombre AS taller, t.fecha, a.boleta, ${RESUMEN_POR_ALUMNO}
        FROM asistencias a
        JOIN talleres t ON t.id = a.taller_id
        WHERE a.boleta = ?
        GROUP BY t.id, t.nombre, t.fecha, a.boleta
        ORDER BY t.fecha DESC`, [boleta]);
    return filas;
}

async function quitarAlumnoDeTaller(taller_id, boleta) {
    const [info] = await pool.query('DELETE FROM asistencias WHERE taller_id = ? AND boleta = ?', [taller_id, boleta]);
    return info.affectedRows > 0;
}

async function eliminarAsistencia(id) {
    const [info] = await pool.query('DELETE FROM asistencias WHERE id = ?', [id]);
    return info.affectedRows > 0;
}

module.exports = {
    obtenerAsistenciaPorId,
    buscarEnTaller,
    buscarMismoDia,
    buscarChoqueAlMover,
    contarTalleresPorBoleta,
    registrarAsistencia,
    consultarAsistenciaTaller,
    consultarAsistenciaAlumno,
    quitarAlumnoDeTaller,
    eliminarAsistencia,
}
