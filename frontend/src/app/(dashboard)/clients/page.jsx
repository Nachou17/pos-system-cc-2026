'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

const EMPTY = { rut: '', nombre: '', email: '', telefono: '', direccion: '' };

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(null); // 'create' | cliente_obj
  const [historyModal, setHistoryModal] = useState(null); // cliente_obj
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/clients${params}`).then((r) => setClients(r.data)).catch(console.error);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  
  const openEdit = (c) => {
    setForm({ 
      rut: c.rut, 
      nombre: c.nombre, 
      email: c.email || '', 
      telefono: c.telefono || '', 
      direccion: c.direccion || '' 
    });
    setModal(c);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') await api.post('/clients', form);
      else await api.put(`/clients/${modal.id}`, form);
      setModal(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este cliente?')) return;
    await api.delete(`/clients/${id}`).catch(console.error);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button onClick={openCreate} className="btn-primary">+ Nuevo cliente</button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre, RUT o email..."
          className="input max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-header">RUT</th>
              <th className="table-header">Nombre</th>
              <th className="table-header">Email</th>
              <th className="table-header">Teléfono</th>
              <th className="table-header">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.length === 0 && (
              <tr><td colSpan={5} className="table-cell text-center text-gray-400 py-8">Sin clientes</td></tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-sm">{c.rut}</td>
                <td className="table-cell font-medium">{c.nombre}</td>
                <td className="table-cell text-gray-500">{c.email || '—'}</td>
                <td className="table-cell text-gray-500">{c.telefono || '—'}</td>
                <td className="table-cell">
                  <div className="flex gap-3">
                    <button onClick={() => setHistoryModal(c)} className="text-green-600 hover:underline text-sm font-semibold">Historial</button>
                    <button onClick={() => openEdit(c)} className="text-indigo-600 hover:underline text-sm font-semibold">Editar</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:underline text-sm font-semibold">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Creación / Edición */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{modal === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RUT * (ej: 12345678-9)</label>
                  <input required className="input" placeholder="12345678-9"
                    value={form.rut}
                    disabled={modal !== 'create'}
                    onChange={(e) => setForm({ ...form, rut: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input required className="input" value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="input" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input className="input" placeholder="+56912345678" value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input className="input" value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : 'Guardar'}</button>
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Historial de Compras (Preparado para la fase de Ventas) */}
      {historyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Historial de Compras</h2>
              <button onClick={() => setHistoryModal(null)} className="text-gray-500 hover:text-black font-bold text-xl">&times;</button>
            </div>
            
            <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">Cliente: <span className="font-bold">{historyModal.nombre}</span> ({historyModal.rut})</p>
            </div>
            
            {/* Tabla Placeholder para las ventas */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-4 py-2 font-medium">ID Venta</th>
                    <th className="px-4 py-2 font-medium">Fecha</th>
                    <th className="px-4 py-2 font-medium">Total</th>
                    <th className="px-4 py-2 font-medium">Método Pago</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500 italic bg-gray-50">
                      Sin registros de compras recientes.
                      <br />
                      <span className="text-xs text-gray-400">(Módulo de ventas en desarrollo)</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button onClick={() => setHistoryModal(null)} className="btn-secondary px-6">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
