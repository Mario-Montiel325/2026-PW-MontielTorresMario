import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { pedirJSON } from '../../lib/api';
import { formatearFecha, formatearFechaHora, ocultarBoleta, yaEmpezo } from '../../lib/formato';
import { validarBoleta, validarNombre } from '../../lib/validaciones';
import estilos from '../../styles/Talleres.module.css';

export default function DetalleTaller() {
  const router = useRouter();
  const { id } = router.query;

  const [taller, setTaller] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [errorCarga, setErrorCarga] = useState('');

  const [nombre, setNombre] = useState('');
  const [boleta, setBoleta] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.boleta) setBoleta(String(router.query.boleta));
    if (router.query.nombre) setNombre(String(router.query.nombre));
    cargar();
  }, [router.isReady, id]);

  async function cargar() {
    try {
      setTaller(await pedirJSON(`/talleres/${id}`));
      setAlumnos(await pedirJSON(`/talleres/${id}/asistencias`));
      setErrorCarga('');
    } catch (err) {
      setErrorCarga(err.message);
    }
  }

  async function enviar(datos, mensaje) {
    setError('');
    setExito('');
    setEnviando(true);
    try {
      await pedirJSON('/asistencias', {
        method: 'POST',
        body: JSON.stringify({ taller_id: id, ...datos }),
      });
      setExito(mensaje);
      await cargar();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setEnviando(false);
    }
  }

  async function borrar(ruta, pregunta, mensaje) {
    if (pregunta && !confirm(pregunta)) return;
    setError('');
    setExito('');
    try {
      await pedirJSON(ruta, { method: 'DELETE' });
      setExito(mensaje);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  if (errorCarga) {
    return (
      <main>
        <p className="error">{errorCarga}</p>
        <Link className={estilos.volver} href="/talleres">← Volver a talleres</Link>
      </main>
    );
  }
  if (!taller) return <main><p>Cargando taller…</p></main>;

  const empezo = yaEmpezo(taller.fecha);
  const ocupados = alumnos.length;
  const libres = Math.max(0, taller.cupo - ocupados);
  const lleno = libres === 0;
  const porcentaje = Math.min(100, (ocupados / taller.cupo) * 100);

  const inscritos = alumnos.filter((a) => a.inscripcion_id);
  const vinieron = alumnos.filter((a) => a.llegada_id);
  const faltan = inscritos.filter((a) => !a.llegada_id);
  const sinInscripcion = alumnos.filter((a) => !a.inscripcion_id);

  async function registrar(e) {
    e.preventDefault();
    setError('');
    setExito('');

    const n = nombre.trim();
    const b = boleta.trim();
    if (!validarNombre(n)) return setError('El nombre debe tener de 3 a 100 letras, sin números ni símbolos.');
    if (!validarBoleta(b)) return setError('La boleta debe tener 10 dígitos.');

    const existente = alumnos.find((a) => a.boleta === b);
    if (!empezo && existente) return setError('Esa boleta ya está inscrita en este taller.');
    if (empezo && existente?.llegada_id) return setError('La llegada de esa boleta ya está registrada.');
    if (!existente && lleno) return setError('El taller ya no tiene lugares.');

    const mensaje = empezo ? `Llegada de ${n} registrada.` : `¡Listo! ${n} quedó inscrito(a) en el taller.`;
    if (await enviar({ nombre_alumno: n, boleta: b }, mensaje)) {
      setNombre('');
      setBoleta('');
    }
  }

  function quitar(a) {
    borrar(
      `/talleres/${id}/asistencias/${a.boleta}`,
      `¿Quitar a ${a.nombre_alumno} del taller? Se borra su inscripción y su asistencia.`,
      `Se quitó a ${a.nombre_alumno} del taller.`
    );
  }

  function noVino(a) {
    borrar(`/asistencias/${a.llegada_id}`, null, `${a.nombre_alumno}: no vino.`);
  }

  function estado(a) {
    if (a.llegada_id) return <span className={estilos.exito}>Vino · {formatearFechaHora(a.llego_en)}</span>;
    return <span className={estilos.lleno}>No vino</span>;
  }

  const formulario = (
    <form onSubmit={registrar} className="formulario">
      <input placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <input placeholder="Boleta (10 dígitos)" value={boleta} onChange={(e) => setBoleta(e.target.value)} />
      <button type="submit" disabled={enviando}>
        {enviando ? 'Guardando…' : empezo ? 'Registrar llegada' : 'Inscribirme'}
      </button>
    </form>
  );

  return (
    <main>
      <Link className={estilos.volver} href="/talleres">← Volver a talleres</Link>
      <h1>{taller.nombre}</h1>

      <section className={estilos.panel}>
        <p><strong>Instructor:</strong> {taller.instructor || 'Por confirmar'}</p>
        <p><strong>Fecha:</strong> {formatearFecha(taller.fecha)}</p>
        <div className={estilos.barra}>
          <div className={estilos.relleno} style={{ width: `${porcentaje}%` }} />
        </div>
        <p>
          {ocupados} de {taller.cupo} lugares ocupados ·{' '}
          {lleno ? (
            <span className={estilos.lleno}>Taller lleno</span>
          ) : (
            `${libres} ${libres === 1 ? 'lugar libre' : 'lugares libres'}`
          )}
        </p>
      </section>

      {error && <p className="error">{error}</p>}
      {exito && <p className={estilos.exito}>{exito}</p>}

      {!empezo ? (
        <>
          <section className={estilos.panel}>
            <h2>Inscribirme</h2>
            {formulario}
          </section>

          <h2>Inscritos ({inscritos.length})</h2>
          <p>La lista de asistencia se podrá pasar a partir del {formatearFecha(taller.fecha)}.</p>
          {inscritos.length === 0 ? (
            <p>Todavía no hay inscritos. ¡Sé el primero!</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Boleta</th>
                  <th>Inscrito</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {inscritos.map((a, i) => (
                  <tr key={a.boleta}>
                    <td>{i + 1}</td>
                    <td>{a.nombre_alumno}</td>
                    <td>{ocultarBoleta(a.boleta)}</td>
                    <td>{formatearFechaHora(a.inscrito_en)}</td>
                    <td>
                      <button onClick={() => quitar(a)}>Quitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <>
          <h2>Lista de asistencia</h2>
          <div className={estilos.resumen}>
            <div className={estilos.cifra}>
              <strong>{inscritos.length}</strong>
              <span>Inscritos</span>
            </div>
            <div className={`${estilos.cifra} ${estilos.cifraVino}`}>
              <strong>{vinieron.length}</strong>
              <span>Vinieron</span>
            </div>
            <div className={`${estilos.cifra} ${estilos.cifraNoVino}`}>
              <strong>{faltan.length}</strong>
              <span>No vinieron</span>
            </div>
            {sinInscripcion.length > 0 && (
              <div className={estilos.cifra}>
                <strong>{sinInscripcion.length}</strong>
                <span>Sin inscripción</span>
              </div>
            )}
          </div>
          {alumnos.length === 0 ? (
            <p>Nadie se inscribió a este taller.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Boleta</th>
                  <th>Inscripción</th>
                  <th>¿Vino?</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {alumnos.map((a, i) => (
                  <tr key={a.boleta}>
                    <td>{i + 1}</td>
                    <td>{a.nombre_alumno}</td>
                    <td>{ocultarBoleta(a.boleta)}</td>
                    <td>{a.inscripcion_id ? formatearFechaHora(a.inscrito_en) : 'Sin inscripción'}</td>
                    <td>{estado(a)}</td>
                    <td>
                      <button
                        disabled={enviando || Boolean(a.llegada_id)}
                        onClick={() =>
                          enviar({ nombre_alumno: a.nombre_alumno, boleta: a.boleta }, `${a.nombre_alumno}: sí vino.`)
                        }
                      >
                        Sí vino
                      </button>{' '}
                      <button
                        disabled={!a.llegada_id || !a.inscripcion_id}
                        title={a.inscripcion_id ? '' : 'No estaba inscrito; si no vino, usa Quitar'}
                        onClick={() => noVino(a)}
                      >
                        No vino
                      </button>{' '}
                      <button onClick={() => quitar(a)}>Quitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <section className={estilos.panel}>
            <h2>Llegó alguien sin inscribirse</h2>
            {lleno ? <p>El taller ya no tiene lugares.</p> : formulario}
          </section>
        </>
      )}
    </main>
  );
}
