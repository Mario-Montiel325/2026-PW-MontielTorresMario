const crypto = require('crypto');
const pool = require('../bd-local');

const COLUMNAS_TALLER = 'id, nombre, instructor, fecha, cupo, created_at';

async function listarTalleres() {
    const [filas] = await pool.query(`SELECT ${COLUMNAS_TALLER} FROM talleres ORDER BY fecha, nombre`);
    return filas;
}

async function obtenerTallerPorId(id) {
    const [filas] = await pool.query(`
        SELECT t.id, t.nombre, t.instructor, t.fecha, t.cupo, t.created_at,
            (SELECT COUNT(*) FROM asistencias a WHERE a.taller_id = t.id) AS asistentes
        FROM talleres t
        WHERE t.id = ?`, [id]);
    return filas[0];
}

async function crearTaller({nombre, instructor, fecha, cupo}) {
    const id = crypto.randomUUID();
    await pool.query(
        'INSERT INTO talleres (id, nombre, instructor, fecha, cupo) VALUES (?, ?, ?, ?, ?)',
        [id, nombre, instructor ?? null, fecha, cupo ?? 30]
    );
    return obtenerTallerPorId(id);
}

async function actualizarTaller(id, {nombre, instructor, fecha, cupo}) {
    const cambios = Object.entries({nombre, instructor, fecha, cupo}).filter(([, valor]) => valor !== undefined);
    if(cambios.length === 0) return obtenerTallerPorId(id);

    const columnas = cambios.map(([columna]) => `${columna} = ?`).join(', ');

    const [info] = await pool.query(`UPDATE talleres SET ${columnas} WHERE id = ?`, [...cambios.map(([, valor]) => valor), id]);
    if(info.affectedRows === 0) return undefined;
    return obtenerTallerPorId(id);
}

async function eliminarTaller(id) {
    const [info] = await pool.query('DELETE FROM talleres WHERE id = ?', [id]);
    return info.affectedRows > 0;
}

module.exports = {listarTalleres, obtenerTallerPorId, crearTaller, actualizarTaller, eliminarTaller}
