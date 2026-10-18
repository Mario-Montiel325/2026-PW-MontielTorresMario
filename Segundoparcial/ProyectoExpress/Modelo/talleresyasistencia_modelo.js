const pool = require('../bd-local');

//consultar todos los talleres
async function listarTalleres() {
    const [filas] = await pool.query('SELECT id, nombre, descripcion, cupo FROM talleres ORDER BY id');
    return filas;
}

//registrar alumno al taller
async function registrarAlumno({usuario_id, taller_id}) {
    const [info] = await pool.query(
        'INSERT INTO taller_alumnos (usuario_id, taller_id) VALUES (?, ?)', [usuario_id, taller_id]
    );
    return {id: info.insertId, usuario_id, taller_id};
}

//registrar asistencia
async function registrarAsistencia({usuario_id, taller_id, fecha}) {
    const [info] = await pool.query(
        'INSERT INTO asistencia (usuario_id, taller_id, fecha) VALUES (?, ?, COALESCE(?, CURDATE()))',
        [usuario_id, taller_id, fecha || null]
    );
    const [filas] = await pool.query('SELECT * FROM asistencia WHERE id = ?', [info.insertId]);
    return filas[0];
}

//consultar asistencia de un taller
async function consultarAsistenciaTaller(taller_id) {
    const [filas] = await pool.query(`
        SELECT a.id, a.fecha, u.id AS usuario_id, u.nombre, u.boleta
        FROM asistencia a
        JOIN usuarios u ON u.id = a.usuario_id
        WHERE a.taller_id = ?
        ORDER BY a.fecha DESC, u.nombre`, [taller_id]);
    return filas;
}


