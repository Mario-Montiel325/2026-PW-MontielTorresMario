const express = require('express');

const talleresRutas = require('./Rutas/talleres_rutas');
const asistenciasRutas = require('./Rutas/asistencias_rutas');
const usuariosRutas = require('./Rutas/usuarios_rutas');

const app = express();

app.use(express.json());
app.use((req, res, next) => {
    req.body ??= {};
    next();
});

const PORT = 4000;

app.get('/', (req, res) => {
    res.json({mensaje: 'API de Registro de Asistencia - CECyT 9 funcionando correctamente'});
});

app.get('/saludo', (req, res)=>{
    res.json({mensaje:'Hola esto es una prueba en GET'});
});

app.post('/eco', (req, res)=>{
    const {texto} = req.body;
    if(!texto){
        return res.status(400).json({error:'El texto es obligatorio'});
    }
    res.status(201).json({eco:texto});
});

app.use('/api/talleres', talleresRutas);
app.use('/api/asistencias', asistenciasRutas);
app.use('/api/usuarios', usuariosRutas);

app.listen(PORT, () =>{
    console.log(`Servidor escuchando en el puerto: ${PORT}`);
});
