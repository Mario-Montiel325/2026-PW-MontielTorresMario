const bcrypt = require('bcryptjs');

const usuariosModel = require('../Modelo/usuarios_modelo');
const asistenciaModel = require('../Modelo/asistencia_modelo');

const {ROLES, validarCorreo, validarBoleta, validarContrasena, validarNombre, validarRol, validarIdNumerico} = require('../validaciones');

const ERROR_NOMBRE = 'El nombre debe tener de 3 a 100 letras, sin números ni símbolos';
const ERROR_CONTRASENA = 'La contraseña debe tener de 8 a 64 caracteres, con al menos una letra y un número';
const ERROR_ROL = `El rol debe ser uno de: ${ROLES.join(', ')}`;

function esDuplicado(error){
    return error.code === 'ER_DUP_ENTRY' || error.code === '23505';
}

async function listarUsuarios(req, res) {
    try{
        const usuarios = await usuariosModel.listar();
        res.json(usuarios);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

async function obtenerUsuario(req, res) {
    if(!validarIdNumerico(req.params.id)) return res.status(400).json({error: 'El id del usuario no es válido'});
    try{
        const usuario = await usuariosModel.obtenerPorId(req.params.id);
        if(!usuario) return res.status(404).json({error : 'Usuario no encontrado'});
        res.json(usuario);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

async function crearUsuario(req,res) {
    const {nombre, correo, contrasena, boleta, rol} = req.body;

    if(!nombre || !correo || !contrasena || !boleta){
        return res.status(400).json({error : 'Los campos nombre, correo, contraseña, boleta son obligatorios'});
    }
    if(!validarNombre(nombre)) return res.status(400).json({error : ERROR_NOMBRE});
    if(!validarCorreo(correo)) return res.status(400).json({error : 'El correo no tiene un formato valido'});
    if(!validarBoleta(boleta)) return res.status(400).json({error : 'La boleta debe tener 10 digitos'});
    if(!validarContrasena(contrasena)) return res.status(400).json({error : ERROR_CONTRASENA});
    if(rol !== undefined && !validarRol(rol)) return res.status(400).json({error : ERROR_ROL});

    const correoLimpio = correo.trim().toLowerCase();
    const boletaLimpia = String(boleta).trim();

    try{
        if(await usuariosModel.buscarPorBoleta(boletaLimpia)) return res.status(409).json({error : 'Ya existe un usuario con esa boleta'});
        if(await usuariosModel.buscarPorCorreo(correoLimpio)) return res.status(409).json({error : 'Ya existe un usuario con ese correo'});

        const contrasenaHash = await bcrypt.hash(contrasena, 10);
        const usuario = await usuariosModel.crear({
            nombre: nombre.trim(),
            correo: correoLimpio,
            contrasenaHash,
            boleta: boletaLimpia,
            rol: rol?.trim().toLowerCase(),
        });
        res.status(201).json(usuario);
    }catch(error){
        if(esDuplicado(error)) return res.status(409).json({error : 'Ya existe un usuario con ese correo o boleta registrado'});
        res.status(500).json({error : error.message});
    }
}

async function actualizarUsuario(req, res) {
    const {nombre, correo, rol, boleta} = req.body;

    if(!validarIdNumerico(req.params.id)) return res.status(400).json({error: 'El id del usuario no es válido'});
    if(boleta !== undefined) return res.status(400).json({error: 'La boleta no se puede modificar'});
    if(nombre === undefined && correo === undefined && rol === undefined){
        return res.status(400).json({error: 'Se debe de llenar almenos uno de los campos de nombre, correo o rol para actualizar los datos'});
    }
    if(nombre !== undefined && !validarNombre(nombre)) return res.status(400).json({error: ERROR_NOMBRE});
    if(correo !== undefined && !validarCorreo(correo)) return res.status(400).json({error: 'El correo no tiene un formato valido'});
    if(rol !== undefined && !validarRol(rol)) return res.status(400).json({error: ERROR_ROL});

    const correoLimpio = correo?.trim().toLowerCase();

    try{
        const actual = await usuariosModel.obtenerPorId(req.params.id);
        if(!actual) return res.status(404).json({error : 'Usuario no encontrado'});

        if(correoLimpio !== undefined){
            const otro = await usuariosModel.buscarPorCorreo(correoLimpio);
            if(otro && String(otro.id) !== String(actual.id)) return res.status(409).json({error : 'Ya existe un usuario con ese correo'});
        }

        const usuario = await usuariosModel.actualizar(req.params.id, {
            nombre: nombre?.trim(),
            correo: correoLimpio,
            rol: rol?.trim().toLowerCase(),
        });
        res.json(usuario);
    } catch(error){
        if(esDuplicado(error)) return res.status(409).json({error : 'Ya existe un usuario con ese correo'});
        res.status(500).json({error : error.message})
    }
}

async function eliminarUsuario(req, res) {
    if(!validarIdNumerico(req.params.id)) return res.status(400).json({error: 'El id del usuario no es válido'});
    try{
        const usuario = await usuariosModel.obtenerPorId(req.params.id);
        if(!usuario) return res.status(404).json({error: 'No se encontro al usuario'});

        const total = await asistenciaModel.contarTalleresPorBoleta(usuario.boleta);
        if(total > 0){
            return res.status(409).json({error: `${usuario.nombre} está registrado en ${total} ${total === 1 ? 'taller' : 'talleres'}; quítalo de ahí antes de eliminarlo`});
        }

        await usuariosModel.eliminar(req.params.id);
        res.status(204).send();
    }catch(error){
        res.status(500).json({error : error.message});
    }
}

module.exports = {listarUsuarios, obtenerUsuario, crearUsuario, actualizarUsuario, eliminarUsuario}
