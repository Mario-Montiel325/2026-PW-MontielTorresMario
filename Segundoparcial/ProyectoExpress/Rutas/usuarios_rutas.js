const express = require('express');
const usuarios = require('../Controlador/usuario_controlador');

const router = express.Router();

router.get('/', usuarios.listarUsuarios);
router.get('/:id', usuarios.obtenerUsuario);
router.post('/', usuarios.crearUsuario);
router.put('/:id', usuarios.actualizarUsuario);
router.delete('/:id', usuarios.eliminarUsuario);

module.exports = router;
