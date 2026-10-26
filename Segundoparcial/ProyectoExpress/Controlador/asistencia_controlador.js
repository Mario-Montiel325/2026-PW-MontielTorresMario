const asistenciaModel = require('../Modelo/asistencia_modelo');

async function registrarAsistencia(req, res) {
    const {taller_id, nombre_alumno, boleta} = req.body;
    if(!taller_id || !nombre_alumno || !boleta){
        return res.status(400).json({error: 'taller_id, nombre_alumno y boleta son obligatorios'});
    }
    try{
        const asistencia = await asistenciaModel.registrarAsistencia({taller_id, nombre_alumno, boleta});
        res.status(201).json(asistencia);
    }catch(error){
        if(error.code === 'ER_DUP_ENTRY') return res.status(409).json({error: 'Esa asistencia ya está registrada'});
        res.status(500).json({error: error.message});
    }
}

async function consultarAsistenciaTaller(req, res) {
    try{
        const asistencia = await asistenciaModel.consultarAsistenciaTaller(req.params.id);
        res.json(asistencia);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

async function consultarAsistenciaAlumno(req, res) {
    try{
        const asistencia = await asistenciaModel.consultarAsistenciaAlumno(req.params.boleta);
        res.json(asistencia);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

async function eliminarAsistencia(req, res) {
    try{
        const eliminado = await asistenciaModel.eliminarAsistencia(req.params.id);
        if(!eliminado) return res.status(404).json({error: 'No se encontro la asistencia'});
        res.status(204).send();
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

module.exports = {registrarAsistencia, consultarAsistenciaTaller, consultarAsistenciaAlumno, eliminarAsistencia}
