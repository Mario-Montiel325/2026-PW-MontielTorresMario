const talleresModel = require('../Modelo/talleresyasistencia_modelo');

async function listarTalleres(req, res) {
    try{
        const talleres = await talleresModel.listarTalleres();
        res.json(talleres);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

async function registrarAlumno(req, res) {
    const {usuario_id, taller_id} = req.body;
    if(!usuario_id || !taller_id){
        return res.status(400).json({error: 'usuario_id y taller_id son obligatorios'});
    }
    try{
        const inscripcion = await talleresModel.registrarAlumno({usuario_id, taller_id});
        res.status(201).json(inscripcion);
    }catch(error){
        if(error.code === 'ER_DUP_ENTRY') return res.status(409).json({error: 'El alumno ya está inscrito en este taller'});
        if(error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(404).json({error: 'Alumno o taller no encontrado'});
        res.status(500).json({error: error.message});
    }
}
