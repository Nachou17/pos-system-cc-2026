'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const EMPTY = { nombre: '', email: '', password: '', rol_id: 2 }; // 2 = cajero por defecto

export default function UsersPage() {
  const [users, setUsers]   = useState([]);
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get('/users').then((r) => setUsers(r.data)).catch(console.error);

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  
  const openEdit = (u) => {
    // CORRECCIÓN: Convertimos el texto del rol que viene del backend de vuelta a su ID
    const rolIdAsignado = u.rol === 'admin' ? 1 : 2;
    setForm({ nombre: u.nombre, email: u.email, password: '', rol_id: rolIdAsignado });
    setModal(u);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Aseguramos que el rol_id se envíe como número (Integer) a PostgreSQL
      const payload = { ...form, rol_id: parseInt(form.rol_id, 10) };
      
      if (modal === 'create') {
        await api.post('/users', payload);
      } else {
        // En edición, no enviamos la contraseña
        delete payload.password; 
        await api.put(`/users/${modal.id}`, payload);
      }
      
      setModal(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este usuario?')) return;
    await api.delete(`/users/${id}`).catch(console.error);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <button onClick={openCreate} className="btn-primary">+ Nuevo usuario</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-header">Nombre</th>
              <th className="table-header">Email</th>
              <th className="table-header">Rol</th>
              <th className="table-header">Estado</th>
              <th className="table-header">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 && (
              <tr><td colSpan={5} className="table-cell text-center text-gray-400 py-8">Sin usuarios</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{u.nombre}</td>
                <td className="table-cell text-gray-500">{u.email}</td>
                <td className="table-cell">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${u.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.rol}
                  </span>
                </td>
                <td className="table-cell">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(u)} className="text-indigo-600 hover:underline text-sm font-semibold">Editar</button>
                    <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:underline text-sm font-semibold">Desactivar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">{modal === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input required className="input" value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input required type="email" className="input" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              
              {/* CORRECCIÓN: Solo se pide contraseña al crear, no al editar */}
              {modal === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                  <input type="password" className="input" required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select className="input" value={form.rol_id}
                  onChange={(e) => setForm({ ...form, rol_id: parseInt(e.target.value, 10) })}>
                  <option value={1}>Administrador</option>
                  <option value={2}>Cajero</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : 'Guardar'}</button>
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
