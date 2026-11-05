const asistenciaModel = require('../Modelo/asistencia_modelo');
const talleresModel = require('../Modelo/talleres_modelo');
const usuariosModel = require('../Modelo/usuarios_modelo');

const {validarBoleta, validarNombre, mismoNombre, yaEmpezo} = require('../validaciones');

async function registrarAsistencia(req, res) {
    const {taller_id, nombre_alumno, boleta} = req.body;
    if(!taller_id || !nombre_alumno || !boleta){
        return res.status(400).json({error: 'taller_id, nombre_alumno y boleta son obligatorios'});
    }
    if(!validarNombre(nombre_alumno)) return res.status(400).json({error: 'El nombre debe tener de 3 a 100 letras, sin números ni símbolos'});
    if(!validarBoleta(boleta)) return res.status(400).json({error: 'La boleta debe tener 10 digitos'});

    const nombre = nombre_alumno.trim();
    const boletaLimpia = String(boleta).trim();

    try{
        const taller = await talleresModel.obtenerTallerPorId(taller_id);
        if(!taller) return res.status(404).json({error: 'Taller no encontrado'});

        const fechaTaller = String(taller.fecha).slice(0, 10);
        const esLlegada = yaEmpezo(fechaTaller);
        const registro = await asistenciaModel.buscarEnTaller(taller_id, boletaLimpia);

        if(!esLlegada && registro) return res.status(409).json({error: 'Esa boleta ya está inscrita en este taller'});
        if(esLlegada && registro?.llegada_id) return res.status(409).json({error: 'La llegada de esa boleta ya está registrada'});
        if(registro && !mismoNombre(registro.nombre_alumno, nombre)){
            return res.status(409).json({error: `Esa boleta está inscrita a nombre de ${registro.nombre_alumno}`});
        }

        if(!registro){
            const mismoDia = await asistenciaModel.buscarMismoDia(boletaLimpia, fechaTaller, taller_id);
            if(mismoDia) return res.status(409).json({error: `Esa boleta ya está en el taller "${mismoDia.nombre}" el mismo día`});
            if(taller.asistentes >= taller.cupo) return res.status(409).json({error: 'El taller ya no tiene lugares'});
        }

        const usuario = await usuariosModel.buscarPorBoleta(boletaLimpia);
        if(usuario && !mismoNombre(usuario.nombre, nombre)){
            return res.status(409).json({error: `Esa boleta pertenece a ${usuario.nombre}`});
        }

        const asistencia = await asistenciaModel.registrarAsistencia({taller_id, nombre_alumno: nombre, boleta: boletaLimpia});
        res.status(201).json({...asistencia, tipo: esLlegada ? 'llegada' : 'inscripcion'});
    }catch(error){
        if(error.code === 'ER_DUP_ENTRY') return res.status(409).json({error: 'Esa boleta ya está registrada en este taller'});
        res.status(500).json({error: error.message});
    }
}

async function consultarAsistenciaTaller(req, res) {
    try{
        const taller = await talleresModel.obtenerTallerPorId(req.params.id);
        if(!taller) return res.status(404).json({error: 'Taller no encontrado'});
        const asistencia = await asistenciaModel.consultarAsistenciaTaller(req.params.id);
        res.json(asistencia);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

async function consultarAsistenciaAlumno(req, res) {
    if(!validarBoleta(req.params.boleta)) return res.status(400).json({error: 'La boleta debe tener 10 digitos'});
    try{
        const asistencia = await asistenciaModel.consultarAsistenciaAlumno(req.params.boleta);
        res.json(asistencia);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

async function eliminarAsistencia(req, res) {
    try{
        const asistencia = await asistenciaModel.obtenerAsistenciaPorId(req.params.id);
        if(!asistencia) return res.status(404).json({error: 'No se encontro la asistencia'});

        const taller = await talleresModel.obtenerTallerPorId(asistencia.taller_id);
        const fechaTaller = String(taller.fecha).slice(0, 10);
        const esInscripcion = String(asistencia.fecha_registro).slice(0, 10) < fechaTaller;
        if(esInscripcion && yaEmpezo(fechaTaller)){
            return res.status(409).json({error: 'El taller ya empezó; para sacarlo de la lista usa Quitar'});
        }

        await asistenciaModel.eliminarAsistencia(req.params.id);
        res.status(204).send();
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

async function quitarAlumno(req, res) {
    if(!validarBoleta(req.params.boleta)) return res.status(400).json({error: 'La boleta debe tener 10 digitos'});
    try{
        const taller = await talleresModel.obtenerTallerPorId(req.params.id);
        if(!taller) return res.status(404).json({error: 'Taller no encontrado'});
        const quitado = await asistenciaModel.quitarAlumnoDeTaller(req.params.id, req.params.boleta);
        if(!quitado) return res.status(404).json({error: 'Ese alumno no está en este taller'});
        res.status(204).send();
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

module.exports = {registrarAsistencia, consultarAsistenciaTaller, consultarAsistenciaAlumno, eliminarAsistencia, quitarAlumno}
