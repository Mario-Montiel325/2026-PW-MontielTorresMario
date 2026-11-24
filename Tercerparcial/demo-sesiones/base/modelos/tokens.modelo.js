function crearModeloTokens(pool) {
    //necesitamos una funcion que se encargue de poder insertar dentro de la db los tokens que estaran revocados para que no se vuelvan a utilizar

    async function revocar(jti, usuario, exp) {
        await pool.query(
            "INSERT IGNORE INTO tokens_revocados (jti, usuario, expira) VALUES (?,?, FROM_UNIXTIME(?))",
            [jti, usuario, exp],
        );
    }

    //una funcion para verificar si el token esta revocado
    async function estaRevocado(jti) {
        const [filas] = await pool.query(
            "SELECT 1 FROM tokens_revocados WHERE jti=?",
            [String(jti || "")],
        );

        return filas.length > 0;
    }

    // una funcion para poder consultar todos los tokens revocados
    async function listar() {
        const [filas] = await pool.query(
            "SELECT jti, usuario, expira, revocado_en FROM tokens_revocados ORDER BY revocado_en DESC, jti",
        );
        return filas;
    }

    //cada token que se firma se guarda para que el admin vea quien tiene sesion
    async function registrar(jti, usuario, rol, iat, exp) {
        await pool.query(
            "INSERT INTO tokens_emitidos (jti, usuario, rol, emitido, expira) VALUES (?,?,?, FROM_UNIXTIME(?), FROM_UNIXTIME(?))",
            [jti, usuario, rol, iat, exp],
        );
    }

    //los tokens que siguen vivos: no han vencido y no estan en la lista negra
    async function activos() {
        const [filas] = await pool.query(
            "SELECT e.jti, e.usuario, e.rol, e.emitido, e.expira FROM tokens_emitidos e LEFT JOIN tokens_revocados r ON r.jti = e.jti WHERE r.jti IS NULL AND e.expira > NOW() ORDER BY e.emitido DESC",
        );
        return filas;
    }

    async function buscar(jti) {
        const [filas] = await pool.query(
            "SELECT jti, usuario, UNIX_TIMESTAMP(expira) AS exp FROM tokens_emitidos WHERE jti=?",
            [String(jti || "")],
        );
        return filas[0] || null;
    }

    return { revocar, estaRevocado, listar, registrar, activos, buscar };
}

module.exports = { crearModeloTokens };