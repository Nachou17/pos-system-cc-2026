'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api'; // Ajusta los ../ según tu estructura de carpetas

export default function HistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  // Cargamos el historial apenas se abre la pantalla
  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const respuesta = await api.get('/sales');
        
        // 🚀 LA MAGIA DE LOS DATOS DE PRUEBA
        // Si la base de datos está vacía, inyectamos nuestras ventas falsas
        if (respuesta.data.length === 0) {
          setVentas([
            { 
              id: 1001, 
              total: 24500, 
              metodo_pago: 'debito', 
              estado: 'completada', 
              created_at: new Date().toISOString() // Hoy
            },
            { 
              id: 1002, 
              total: 3200, 
              metodo_pago: 'efectivo', 
              estado: 'completada', 
              created_at: new Date(Date.now() - 86400000).toISOString() // Ayer
            },
            { 
              id: 1003, 
              total: 15990, 
              metodo_pago: 'debito', 
              estado: 'anulada', 
              created_at: new Date(Date.now() - 172800000).toISOString() // Anteayer
            }
          ]);
        } else {
          // Si Joni ya logró guardar ventas reales en Azure, mostramos las de verdad
          setVentas(respuesta.data);
        }

      } catch (error) {
        console.error('Error al cargar las ventas:', error);
        alert('Hubo un problema al cargar el historial.');
      } finally {
        setCargando(false);
      }
    };

    cargarHistorial();
  }, []);

  // Función para que la fecha se vea bonita
  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-CL') + ' ' + fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  };

  // MAGIA DEL BUSCADOR: Filtra por N° de boleta, método de pago o estado
  const ventasFiltradas = ventas.filter((venta) => {
    const termino = busqueda.toLowerCase();
    return (
      venta.id.toString().includes(termino) ||
      venta.metodo_pago.toLowerCase().includes(termino) ||
      venta.estado.toLowerCase().includes(termino)
    );
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Historial de Ventas</h2>
      <p style={{ color: 'gray', marginBottom: '20px' }}>
        Aquí puedes revisar y buscar todas las transacciones realizadas en el sistema.
      </p>

      {/* EL BUSCADOR */}
      <input 
        type="text" 
        placeholder="Buscar por N° de boleta, método de pago o estado..." 
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ 
          width: '100%', 
          padding: '12px', 
          fontSize: '16px', 
          marginBottom: '20px', 
          border: '1px solid #ccc', 
          borderRadius: '5px' 
        }}
      />

      {/* LA TABLA DE RESULTADOS */}
      {cargando ? (
        <p>Cargando transacciones...</p>
      ) : (
        <div style={{ background: 'white', borderRadius: '10px', padding: '20px', border: '1px solid #ddd' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '10px' }}>N° Boleta</th>
                <th style={{ padding: '10px' }}>Fecha y Hora</th>
                <th style={{ padding: '10px' }}>Método de Pago</th>
                <th style={{ padding: '10px' }}>Estado</th>
                <th style={{ padding: '10px' }}>Total</th>
              </tr>
            </thead>
            
            <tbody>
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'gray' }}>
                    No se encontraron ventas que coincidan con tu búsqueda.
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((venta) => (
                  <tr key={venta.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>#{venta.id}</td>
                    <td style={{ padding: '10px' }}>{formatearFecha(venta.created_at)}</td>
                    
                    <td style={{ padding: '10px', textTransform: 'capitalize' }}>
                      {venta.metodo_pago}
                    </td>
                    
                    <td style={{ padding: '10px' }}>
                      <span style={{ 
                        background: venta.estado === 'completada' ? '#d4edda' : '#f8d7da',
                        color: venta.estado === 'completada' ? '#155724' : '#721c24',
                        padding: '5px 10px', 
                        borderRadius: '15px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        {venta.estado}
                      </span>
                    </td>
                    
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>
                      ${venta.total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            
          </table>
        </div>
      )}
    </div>
  );
}
