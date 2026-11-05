const talleresModel = require('../Modelo/talleres_modelo');
const asistenciaModel = require('../Modelo/asistencia_modelo');

const {validarNombreTaller, validarInstructor, validarFecha, esFechaPasada, validarCupo} = require('../validaciones');

const ERROR_NOMBRE = 'El nombre del taller debe tener de 3 a 100 caracteres (letras, números y . , : + # ( ) -)';
const ERROR_INSTRUCTOR = 'El instructor debe tener de 3 a 100 letras (se permiten puntos, ej. "Ing. María López")';
const ERROR_FECHA = 'La fecha no es válida (usa AAAA-MM-DD)';
const ERROR_CUPO = 'El cupo debe ser un número entero entre 1 y 500';

function instructorVacio(instructor){
    return instructor === null || (typeof instructor === 'string' && instructor.trim() === '');
}

function validarCampos({nombre, instructor, fecha, cupo}){
    if(nombre !== undefined && !validarNombreTaller(nombre)) return ERROR_NOMBRE;
    if(instructor !== undefined && !instructorVacio(instructor) && !validarInstructor(instructor)) return ERROR_INSTRUCTOR;
    if(fecha !== undefined && !validarFecha(fecha)) return ERROR_FECHA;
    if(cupo !== undefined && !validarCupo(cupo)) return ERROR_CUPO;
    return null;
}

function alumnos(n){
    return `${n} ${n === 1 ? 'alumno registrado' : 'alumnos registrados'}`;
}

function limpiarInstructor(instructor){
    if(instructor === undefined) return undefined;
    return instructorVacio(instructor) ? null : instructor.trim();
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
    if(nombre === undefined || fecha === undefined){
        return res.status(400).json({error: 'nombre y fecha son obligatorios'});
    }
    const error = validarCampos({nombre, instructor, fecha, cupo});
    if(error) return res.status(400).json({error});
    if(esFechaPasada(fecha)) return res.status(400).json({error: 'No se puede crear un taller con fecha pasada'});

    try{
        if(await talleresModel.buscarPorNombre(nombre)) return res.status(409).json({error: 'Ya existe un taller con ese nombre'});

        const instructorLimpio = limpiarInstructor(instructor);
        if(instructorLimpio){
            const otro = await talleresModel.buscarPorInstructorYFecha(instructorLimpio, fecha);
            if(otro) return res.status(409).json({error: `${otro.instructor} ya da el taller "${otro.nombre}" ese día`});
        }

        const taller = await talleresModel.crearTaller({nombre: nombre.trim(), instructor: instructorLimpio, fecha, cupo});
        res.status(201).json(taller);
    }catch(error){
        if(error.code === 'ER_DUP_ENTRY') return res.status(409).json({error: 'Ya existe un taller con ese nombre'});
        res.status(500).json({error: error.message});
    }
}

async function actualizarTaller(req, res) {
    const {nombre, instructor, fecha, cupo} = req.body;
    if(nombre === undefined && instructor === undefined && fecha === undefined && cupo === undefined){
        return res.status(400).json({error: 'Envía al menos uno de: nombre, instructor, fecha, cupo'});
    }
    const error = validarCampos({nombre, instructor, fecha, cupo});
    if(error) return res.status(400).json({error});

    try{
        const actual = await talleresModel.obtenerTallerPorId(req.params.id);
        if(!actual) return res.status(404).json({error: 'Taller no encontrado'});

        const fechaActual = String(actual.fecha).slice(0, 10);
        const cambiaFecha = fecha !== undefined && fecha !== fechaActual;
        const fechaFinal = cambiaFecha ? fecha : fechaActual;
        const instructorFinal = instructor !== undefined ? limpiarInstructor(instructor) : actual.instructor;

        if(cambiaFecha && esFechaPasada(fecha)){
            return res.status(400).json({error: 'No se puede mover el taller a una fecha pasada'});
        }
        if(instructorFinal && (cambiaFecha || instructor !== undefined)){
            const otro = await talleresModel.buscarPorInstructorYFecha(instructorFinal, fechaFinal, actual.id);
            if(otro) return res.status(409).json({error: `${otro.instructor} ya da el taller "${otro.nombre}" ese día`});
        }
        if(cambiaFecha){
            const choque = await asistenciaModel.buscarChoqueAlMover(actual.id, fecha);
            if(choque) return res.status(409).json({error: `No se puede mover: ${choque.nombre_alumno} ya tiene el taller "${choque.taller}" ese día`});
        }
        if(cupo !== undefined && cupo < actual.asistentes){
            return res.status(409).json({error: `El cupo no puede ser menor a ${alumnos(actual.asistentes)}`});
        }
        if(nombre !== undefined){
            const otro = await talleresModel.buscarPorNombre(nombre);
            if(otro && otro.id !== actual.id) return res.status(409).json({error: 'Ya existe un taller con ese nombre'});
        }

        const taller = await talleresModel.actualizarTaller(req.params.id, {
            nombre: nombre?.trim(),
            instructor: limpiarInstructor(instructor),
            fecha,
            cupo,
        });
        res.json(taller);
    }catch(error){
        if(error.code === 'ER_DUP_ENTRY') return res.status(409).json({error: 'Ya existe un taller con ese nombre'});
        res.status(500).json({error: error.message});
    }
}

async function eliminarTaller(req, res) {
    try{
        const taller = await talleresModel.obtenerTallerPorId(req.params.id);
        if(!taller) return res.status(404).json({error: 'Taller no encontrado'});
        if(taller.asistentes > 0) return res.status(409).json({error: `El taller tiene ${alumnos(taller.asistentes)}; quítalos antes de eliminarlo`});

        await talleresModel.eliminarTaller(req.params.id);
        res.status(204).send();
    }catch(error){
        if(error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({error: 'El taller tiene asistencias registradas'});
        res.status(500).json({error: error.message});
    }
}

module.exports = {listarTalleres, obtenerTaller, crearTaller, actualizarTaller, eliminarTaller}
