const talleresModel = require('../Modelo/talleres_modelo');

function cupoInvalido(cupo){
    return cupo !== undefined && (!Number.isInteger(cupo) || cupo <= 0);
}

function fechaInvalida(error){
    return error.code === 'ER_TRUNCATED_WRONG_VALUE' || error.code === 'ER_WRONG_VALUE';
}

async function listarTalleres(req, res) {
    try{
        const talleres = await talleresModel.listarTalleres();
        res.json(talleres);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

async function obtenerTaller(req, res) {
    try{
        const taller = await talleresModel.obtenerTallerPorId(req.params.id);
        if(!taller) return res.status(404).json({error: 'Taller no encontrado'});
        res.json(taller);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

async function crearTaller(req, res) {
    const {nombre, instructor, fecha, cupo} = req.body;
    if(!nombre || !fecha){
        return res.status(400).json({error: 'nombre y fecha son obligatorios'});
    }
    if(cupoInvalido(cupo)){
        return res.status(400).json({error: 'El cupo debe ser un número entero mayor a 0'});
    }
    try{
        const taller = await talleresModel.crearTaller({nombre, instructor, fecha, cupo});
        res.status(201).json(taller);
    }catch(error){
        if(fechaInvalida(error)) return res.status(400).json({error: 'La fecha no es válida (usa AAAA-MM-DD)'});
        if(error.code === 'ER_DUP_ENTRY') return res.status(409).json({error: 'Ya existe un taller con ese nombre'});
        res.status(500).json({error: error.message});
    }
}

async function actualizarTaller(req, res) {
    const {nombre, instructor, fecha, cupo} = req.body;
    if(nombre === undefined && instructor === undefined && fecha === undefined && cupo === undefined){
        return res.status(400).json({error: 'Envía al menos uno de: nombre, instructor, fecha, cupo'});
    }
    if(cupoInvalido(cupo)){
        return res.status(400).json({error: 'El cupo debe ser un número entero mayor a 0'});
    }
    try{
        const taller = await talleresModel.actualizarTaller(req.params.id, {nombre, instructor, fecha, cupo});
        if(!taller) return res.status(404).json({error: 'Taller no encontrado'});
        res.json(taller);
    }catch(error){
        if(fechaInvalida(error)) return res.status(400).json({error: 'La fecha no es válida (usa AAAA-MM-DD)'});
        if(error.code === 'ER_DUP_ENTRY') return res.status(409).json({error: 'Ya existe un taller con ese nombre'});
        res.status(500).json({error: error.message});
    }
}

async function eliminarTaller(req, res) {
    try{
        const eliminado = await talleresModel.eliminarTaller(req.params.id);
        if(!eliminado) return res.status(404).json({error: 'Taller no encontrado'});
        res.status(204).send();
    }catch(error){
        if(error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({error: 'El taller tiene asistencias registradas'});
        res.status(500).json({error: error.message});
    }
}

module.exports = {listarTalleres, obtenerTaller, crearTaller, actualizarTaller, eliminarTaller}
