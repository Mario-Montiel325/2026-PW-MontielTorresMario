import Link from 'next/link';
import { useEffect, useState } from 'react';
import { pedirJSON } from '../lib/api';
import { formatearFecha } from '../lib/formato';
import {
  ROLES,
  esFechaPasada,
  hoy,
  validarCorreo,
  validarCupo,
  validarFecha,
  validarInstructor,
  validarNombre,
  validarNombreTaller,
  validarRol,
} from '../lib/validaciones';
import estilos from '../styles/Talleres.module.css';

const VACIO = { nombre: '', instructor: '', fecha: '', cupo: '30' };
const USUARIO_VACIO = { nombre: '', correo: '', rol: '' };

export default function Admin() {
  const [talleres, setTalleres] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formUsuario, setFormUsuario] = useState(USUARIO_VACIO);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      setTalleres(await pedirJSON('/talleres'));
      setUsuarios(await pedirJSON('/usuarios'));
    } catch (err) {
      setError(err.message);
    }
  }

  function cambiar(campo, valor) {
    setForm({ ...form, [campo]: valor });
  }

  function editar(taller) {
    setEditando(taller.id);
    setForm({
      nombre: taller.nombre,
      instructor: taller.instructor || '',
      fecha: String(taller.fecha).slice(0, 10),
      cupo: String(taller.cupo),
    });
    setError('');
    setExito('');
  }

  function cancelar() {
    setEditando(null);
    setForm(VACIO);
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setExito('');

    const nombre = form.nombre.trim();
    const instructor = form.instructor.trim();
    const cupo = Number(form.cupo);
    const original = talleres.find((t) => t.id === editando);
    const fechaOriginal = original ? String(original.fecha).slice(0, 10) : null;

    if (!validarNombreTaller(nombre)) return setError('El nombre del taller debe tener de 3 a 100 caracteres (letras, números y . , : + # ( ) -).');
    if (instructor && !validarInstructor(instructor)) return setError('El instructor debe tener de 3 a 100 letras (se permiten puntos, ej. "Ing. María López").');
    if (!validarFecha(form.fecha)) return setError('Elige una fecha válida.');
    if (form.fecha !== fechaOriginal && esFechaPasada(form.fecha)) return setError('La fecha no puede ser anterior a hoy.');
    if (!validarCupo(cupo)) return setError('El cupo debe ser un número entero entre 1 y 500.');
    if (original && cupo < original.asistentes) return setError(`El cupo no puede ser menor a los ${original.asistentes} registrados.`);
    const repetido = talleres.find((t) => t.id !== editando && t.nombre.trim().toLowerCase() === nombre.toLowerCase());
    if (repetido) return setError('Ya existe un taller con ese nombre.');

    const datos = { nombre, instructor: instructor || null, fecha: form.fecha, cupo };
    setEnviando(true);
    try {
      if (editando) {
        await pedirJSON(`/talleres/${editando}`, { method: 'PUT', body: JSON.stringify(datos) });
        setExito(`Taller "${nombre}" actualizado.`);
      } else {
        await pedirJSON('/talleres', { method: 'POST', body: JSON.stringify(datos) });
        setExito(`Taller "${nombre}" creado.`);
      }
      cancelar();
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function eliminarTaller(taller) {
    if (!confirm(`¿Eliminar el taller "${taller.nombre}"?`)) return;
    setError('');
    setExito('');
    try {
      await pedirJSON(`/talleres/${taller.id}`, { method: 'DELETE' });
      if (editando === taller.id) cancelar();
      setExito(`Taller "${taller.nombre}" eliminado.`);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function editarUsuario(id) {
    setError('');
    setExito('');
    try {
      const usuario = await pedirJSON(`/usuarios/${id}`);
      setUsuarioEditando(usuario.id);
      setFormUsuario({ nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol || '' });
    } catch (err) {
      setError(err.message);
    }
  }

  function cancelarUsuario() {
    setUsuarioEditando(null);
    setFormUsuario(USUARIO_VACIO);
  }

  async function guardarUsuario(e) {
    e.preventDefault();
    setError('');
    setExito('');

    const nombre = formUsuario.nombre.trim();
    const correo = formUsuario.correo.trim();
    const rol = formUsuario.rol;
    if (!validarNombre(nombre)) return setError('El nombre debe tener de 3 a 100 letras, sin números ni símbolos.');
    if (!validarCorreo(correo)) return setError('El correo no tiene un formato válido.');
    if (!validarRol(rol)) return setError(`El rol debe ser uno de: ${ROLES.join(', ')}.`);
    const repetido = usuarios.find((u) => u.id !== usuarioEditando && u.correo.toLowerCase() === correo.toLowerCase());
    if (repetido) return setError('Ya existe un usuario con ese correo.');

    try {
      await pedirJSON(`/usuarios/${usuarioEditando}`, { method: 'PUT', body: JSON.stringify({ nombre, correo, rol }) });
      setExito(`Usuario ${nombre} actualizado.`);
      cancelarUsuario();
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminarUsuario(usuario) {
    if (!confirm(`¿Eliminar a ${usuario.nombre}?`)) return;
    setError('');
    setExito('');
    try {
      await pedirJSON(`/usuarios/${usuario.id}`, { method: 'DELETE' });
      if (usuarioEditando === usuario.id) cancelarUsuario();
      setExito(`Usuario ${usuario.nombre} eliminado.`);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <h1>Administración</h1>

      <section className={estilos.panel}>
        <h2>{editando ? 'Editar taller' : 'Crear taller'}</h2>
        <form onSubmit={guardar} className="formulario">
          <input placeholder="Nombre del taller" value={form.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
          <input placeholder="Instructor (opcional)" value={form.instructor} onChange={(e) => cambiar('instructor', e.target.value)} />
          <input type="date" min={hoy()} value={form.fecha} onChange={(e) => cambiar('fecha', e.target.value)} />
          <input type="number" min="1" placeholder="Cupo" value={form.cupo} onChange={(e) => cambiar('cupo', e.target.value)} />
          <button type="submit" disabled={enviando}>
            {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear taller'}
          </button>
          {editando && <button type="button" onClick={cancelar}>Cancelar</button>}
        </form>
        {error && <p className="error">{error}</p>}
        {exito && <p className={estilos.exito}>{exito}</p>}
      </section>

      <h2>Talleres ({talleres.length})</h2>
      {talleres.length === 0 ? (
        <p>No hay talleres registrados.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Instructor</th>
              <th>Fecha</th>
              <th>Cupo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {talleres.map((t) => (
              <tr key={t.id}>
                <td><Link href={`/talleres/${t.id}`}>{t.nombre}</Link></td>
                <td>{t.instructor || 'Por confirmar'}</td>
                <td>{formatearFecha(t.fecha)}</td>
                <td>{t.cupo}</td>
                <td>
                  <button onClick={() => editar(t)}>Editar</button>{' '}
                  <button onClick={() => eliminarTaller(t)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Usuarios ({usuarios.length})</h2>
      <p><Link className={estilos.volver} href="/registro">+ Registrar usuario</Link></p>
      {usuarioEditando && (
        <section className={estilos.panel}>
          <h2>Editar usuario</h2>
          <form onSubmit={guardarUsuario} className="formulario">
            <input placeholder="Nombre" value={formUsuario.nombre} onChange={(e) => setFormUsuario({ ...formUsuario, nombre: e.target.value })} />
            <input type="email" placeholder="Correo" value={formUsuario.correo} onChange={(e) => setFormUsuario({ ...formUsuario, correo: e.target.value })} />
            <select value={formUsuario.rol} onChange={(e) => setFormUsuario({ ...formUsuario, rol: e.target.value })}>
              <option value="">Elige un rol</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button type="submit">Guardar cambios</button>
            <button type="button" onClick={cancelarUsuario}>Cancelar</button>
          </form>
        </section>
      )}
      {usuarios.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Boleta</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.correo}</td>
                <td>{u.boleta}</td>
                <td>{u.rol}</td>
                <td>
                  <button onClick={() => editarUsuario(u.id)}>Editar</button>{' '}
                  <button onClick={() => eliminarUsuario(u)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
