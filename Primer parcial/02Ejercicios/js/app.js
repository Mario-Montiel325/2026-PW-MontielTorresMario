const talleres = [
    { nombre: 'Introducción a Python', instructor: 'Ing. María López', cupo: 25, inscritos: 25 },
    { nombre: 'Fundamentos de Redes', instructor: 'Ing. Carlos Ramírez', cupo: 30, inscritos: 18 },
    { nombre: 'Diseño de Bases de Datos', instructor: 'Ing. Ana Torres', cupo: 20, inscritos: 20 },
    { nombre: 'Desarrollo Web con JS', instructor: 'Ing. María López', cupo: 25, inscritos: 10 },
];

function pintarTabla(){
    const tbody = document.querySelector('#tabla-talleres tbody');
    tbody.innerHTML = talleres
        .map((t) => `
            <tr>
                <td>${t.nombre}</td>
                <td>${t.instructor}</td>
                <td>${t.cupo}</td>
                <td>${t.inscritos}</td>
            </tr>
        `)
        .join('');
}

const formArreglos = document.getElementById('form-arreglos');
const resultadoArreglos = document.getElementById('resultado-arreglo');
const selectOperacionArreglo = document.getElementById('operacion-arreglo');

formArreglos.addEventListener('submit', (evento) =>{
    evento.preventDefault();
    const operacion = selectOperacionArreglo.value;

    let resultado;

    switch(operacion){
    case 'forEach':
        resultado = talleres.map((t) => `${t.nombre} (${t.inscritos}/${t.cupo})`).join('\n');
        break;

    case 'map':
        resultado = talleres.map((t) => t.nombre).join('\n');
        break;

    case 'filter':
        resultado = talleres
            .filter((t) => t.inscritos >= t.cupo)
            .map((t) => t.nombre)
            .join('\n') || 'No hay talleres con cupo lleno';
        break;

    case 'find': {
        const instructor = 'Ing. María López';
        const taller = talleres.find((t) => t.instructor === instructor);
        resultado = taller
            ? `${taller.nombre} — ${taller.instructor}`
            : `No se encontró taller de ${instructor}`;
        break;
    }

    case 'reduce': {
        const totalInscritos = talleres.reduce((acc, t) => acc + t.inscritos, 0);
        resultado = `Total de inscritos: ${totalInscritos}`;
        break;
    }

    case 'filterMap': {
        const conCupo = talleres.filter((t) => t.inscritos < t.cupo).map((t) => t.nombre);
        resultado = conCupo.join('\n') || "No hay talleres con cupo disponible";
        break;
    }
}

    resultadoArreglos.textContent = resultado;
});

pintarTabla();