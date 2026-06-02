'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatCLP } from '@/lib/utils';

// Agregados los 3 campos nuevos al estado inicial vacío
const EMPTY = { nombre: '', descripcion: '', precio: '', stock: '', categoria_id: '', imagen: null, codigo_barra: '', precio_compra: '', stock_minimo: '' };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | product object
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/products${params}`).then((r) => setProducts(r.data)).catch(console.error);
  }, [search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(console.error);
  }, []);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };

  const openEdit = (p) => {
    // Setear los valores guardados en la fila para cargarlos al editar
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precio: p.precio,
      stock: p.stock,
      categoria_id: p.categoria_id || '',
      imagen: null,
      codigo_barra: p.codigo_barra || '',
      precio_compra: p.precio_compra || 0,
      stock_minimo: p.stock_minimo || 0
    });
    setModal(p);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();

      // Enviamos los datos uno por uno de forma explícita para asegurar que lleguen bien
      fd.append('nombre', form.nombre);
      fd.append('descripcion', form.descripcion || '');
      fd.append('precio', String(form.precio));
      fd.append('stock', String(form.stock || 0));
      fd.append('categoria_id', form.categoria_id || '');
      fd.append('codigo_barra', form.codigo_barra);
      fd.append('precio_compra', String(form.precio_compra || 0));
      fd.append('stock_minimo', String(form.stock_minimo || 0));

      if (form.imagen) {
        fd.append('imagen', form.imagen);
      }

      if (modal === 'create') {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.put(`/products/${modal.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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
    if (!confirm('¿Desactivar este producto?')) return;
    await api.delete(`/products/${id}`).catch(console.error);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <button onClick={openCreate} className="btn-primary">+ Nuevo producto</button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre, descripción o código..."
          className="input max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-header">Cód. Barra</th>
              <th className="table-header">Nombre</th>
              <th className="table-header">Categoría</th>
              <th className="table-header">P. Compra</th>
              <th className="table-header">P. Venta</th>
              <th className="table-header">Stock (Mín)</th>
              <th className="table-header">Estado</th>
              <th className="table-header">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 && (
              <tr><td colSpan={8} className="table-cell text-center text-gray-400 py-8">Sin productos</td></tr>
            )}
            {products.map((p) => {
              // Condición de alerta si el stock actual cae por debajo o igual al mínimo estipulado
              const esStockBajo = p.stock <= (p.stock_minimo || 0);

              return (
                <tr key={p.id} className={`hover:bg-gray-50 ${esStockBajo && p.activo ? 'bg-red-50 hover:bg-red-100/70' : ''}`}>
                  <td className="table-cell text-xs font-mono font-semibold text-gray-600">{p.codigo_barra || '—'}</td>
                  <td className="table-cell font-medium">
                    {p.nombre}
                    {esStockBajo && p.activo && <span className="block text-[10px] text-red-600 font-bold mt-0.5">⚠️ REABASTECER</span>}
                  </td>
                  <td className="table-cell text-gray-500">{p.categoria_nombre || '—'}</td>
                  <td className="table-cell text-gray-500">{formatCLP(p.precio_compra || 0)}</td>
                  <td className="table-cell font-semibold">{formatCLP(p.precio)}</td>
                  <td className="table-cell">
                    <span className={esStockBajo && p.activo ? 'text-red-600 font-bold' : ''}>
                      {p.stock} <span className="text-xs text-gray-400 font-normal">({p.stock_minimo || 0})</span>
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-indigo-600 hover:underline text-sm">Editar</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline text-sm">Eliminar</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{modal === 'create' ? 'Nuevo Producto' : 'Editar Producto'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barra / SKU *</label>
                <input required type="text" className="input" value={form.codigo_barra} onChange={(e) => setForm({ ...form, codigo_barra: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input required className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea className="input" rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">P. Compra (CLP)</label>
                  <input type="number" min="0" className="input" value={form.precio_compra} onChange={(e) => setForm({ ...form, precio_compra: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">P. Venta (CLP) *</label>
                  <input required type="number" min="0" className="input" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
                  <input type="number" min="0" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                  <input type="number" min="0" className="input" value={form.stock_minimo} onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select className="input" value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}>
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
                <input type="file" accept="image/*" className="text-sm text-gray-600"
                  onChange={(e) => setForm({ ...form, imagen: e.target.files[0] })} />
              </div>
              <div className="flex gap-3 pt-2">
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