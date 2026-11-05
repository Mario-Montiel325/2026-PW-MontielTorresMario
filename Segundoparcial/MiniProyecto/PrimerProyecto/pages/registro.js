import { useState } from 'react';
import { pedirJSON } from '../lib/api';
import { validarBoleta, validarContrasena, validarCorreo, validarNombre } from '../lib/validaciones';
import estilos from '../styles/Talleres.module.css';

const VACIO = { nombre: '', correo: '', boleta: '', contrasena: '' };

export default function Registro() {
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [enviando, setEnviando] = useState(false);

  function cambiar(campo, valor) {
    setForm({ ...form, [campo]: valor });
  }

  async function registrar(e) {
    e.preventDefault();
    setError('');
    setExito('');

    const nombre = form.nombre.trim();
    const correo = form.correo.trim();
    const boleta = form.boleta.trim();
    if (!validarNombre(nombre)) return setError('El nombre debe tener de 3 a 100 letras, sin números ni símbolos.');
    if (!validarCorreo(correo)) return setError('El correo no tiene un formato válido.');
    if (!validarBoleta(boleta)) return setError('La boleta debe tener 10 dígitos.');
    if (!validarContrasena(form.contrasena)) return setError('La contraseña debe tener de 8 a 64 caracteres, con al menos una letra y un número.');

    setEnviando(true);
    try {
      await pedirJSON('/usuarios', {
        method: 'POST',
        body: JSON.stringify({ nombre, correo, boleta, contrasena: form.contrasena }),
      });
      setExito(`¡Listo! ${nombre} quedó registrado(a).`);
      setForm(VACIO);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main>
      <h1>Registro de usuario</h1>
      <section className={estilos.panel}>
        <form onSubmit={registrar} className="formulario">
          <input placeholder="Nombre completo" value={form.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
          <input type="email" placeholder="Correo" value={form.correo} onChange={(e) => cambiar('correo', e.target.value)} />
          <input placeholder="Boleta (10 dígitos)" value={form.boleta} onChange={(e) => cambiar('boleta', e.target.value)} />
          <input type="password" placeholder="Contraseña (8+ con letra y número)" value={form.contrasena} onChange={(e) => cambiar('contrasena', e.target.value)} />
          <button type="submit" disabled={enviando}>{enviando ? 'Registrando…' : 'Registrarme'}</button>
        </form>
        {error && <p className="error">{error}</p>}
        {exito && <p className={estilos.exito}>{exito}</p>}
      </section>
    </main>
  );
}
