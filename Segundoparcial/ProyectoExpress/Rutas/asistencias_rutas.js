const express = require('express');
const asistencia = require('../Controlador/asistencia_controlador');

const router = express.Router();

router.post('/', asistencia.registrarAsistencia);
router.get('/alumno/:boleta', asistencia.consultarAsistenciaAlumno);
router.delete('/:id', asistencia.eliminarAsistencia);

module.exports = router;
