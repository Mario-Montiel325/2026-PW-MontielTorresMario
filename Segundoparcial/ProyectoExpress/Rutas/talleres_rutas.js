const express = require('express');
const talleres = require('../Controlador/talleres_controlador');
const asistencia = require('../Controlador/asistencia_controlador');

const router = express.Router();

router.get('/', talleres.listarTalleres);
router.get('/:id', talleres.obtenerTaller);
router.post('/', talleres.crearTaller);
router.put('/:id', talleres.actualizarTaller);
router.delete('/:id', talleres.eliminarTaller);
router.get('/:id/asistencias', asistencia.consultarAsistenciaTaller);

module.exports = router;
