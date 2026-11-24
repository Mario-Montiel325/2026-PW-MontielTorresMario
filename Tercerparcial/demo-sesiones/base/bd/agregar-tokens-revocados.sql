USE demo_sesiones;

CREATE TABLE IF NOT EXISTS tokens_revocados (
    jti VARCHAR(36) NOT NULL,
    usuario VARCHAR(30) NOT NULL,
    expira DATETIME NOT NULL,
    revocado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (jti)
);

CREATE TABLE IF NOT EXISTS tokens_emitidos (
    jti VARCHAR(36) NOT NULL,
    usuario VARCHAR(30) NOT NULL,
    rol VARCHAR(10) NOT NULL,
    emitido DATETIME NOT NULL,
    expira DATETIME NOT NULL,
    PRIMARY KEY (jti)
);