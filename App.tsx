import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Package, Layers, AlertTriangle, CheckCircle2, 
  RefreshCw, LayoutDashboard, ArrowDownLeft, ArrowUpRight,
  Search, Box, Plus, FileSpreadsheet, FileText, History, UserCheck
} from 'lucide-react';

interface Area { id: number; nombre: string; }
interface Categoria { id: number; nombre: string; }
interface Producto {
  id: string;
  codigo_interno: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: string;
  imagen_principal?: string;
}
interface Movimiento {
  tipo: string;
  fecha: string;
  producto: string;
  cantidad: number;
  detalle: string;
}

export default function App() {
  const user = { nombre: "Administrador General", rol: "admin" };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'movimientos'>('dashboard');
  const [areas, setAreas] = useState<Area[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([{ id: 1, nombre: "General" }]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSalidaOpen, setModalSalidaOpen] = useState(false);
  const [modalEntradaOpen, setModalEntradaOpen] = useState(false);

  // Forms
  const [formProd, setFormProd] = useState({ 
    codigo_interno: '', 
    nombre: '', 
    categoria_id: 1, 
    unidad_medida: 'Pieza', 
    stock_actual: 0, 
    stock_minimo: 5, 
    stock_maximo: 100, 
    descripcion: '' 
  });
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [formSalida, setFormSalida] = useState({ area_id: 1, producto_id: '', cantidad: 1, descripcion: '' });
  const [formEntrada, setFormEntrada] = useState({ producto_id: '', cantidad: 1, folio_factura: '', proveedor: '', observaciones: '' });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resA, resC, resP, resM] = await Promise.all([
        axios.get('http://localhost:8000/api/v1/areas'),
        axios.get('http://localhost:8000/api/v1/categorias'),
        axios.get('http://localhost:8000/api/v1/productos'),
        axios.get('http://localhost:8000/api/v1/movimientos')
      ]);

      const listaAreas = resA.data.data || [];
      const listaCats = resC.data.data || [];
      const prods = resP.data.data || [];

      setAreas(listaAreas);
      if (listaCats.length > 0) {
        setCategorias(listaCats);
        setFormProd(prev => ({ ...prev, categoria_id: listaCats[0].id }));
      } else {
        setCategorias([{ id: 1, nombre: "General / Insumos" }]);
      }

      setProductos(prods);
      setMovimientos(resM.data.data || []);
      
      if (listaAreas.length > 0) {
        setFormSalida(prev => ({ ...prev, area_id: listaAreas[0].id }));
      }
      if (prods.length > 0) {
        setFormSalida(prev => ({ ...prev, producto_id: prods[0].id }));
        setFormEntrada(prev => ({ ...prev, producto_id: prods[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    localStorage.clear();
    cargarDatos(); 
  }, []);

  const handleGuardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('codigo_interno', formProd.codigo_interno);
    formData.append('nombre', formProd.nombre);
    formData.append('categoria_id', String(formProd.categoria_id || 1));
    formData.append('unidad_medida', formProd.unidad_medida);
    formData.append('stock_actual', String(formProd.stock_actual));
    formData.append('stock_minimo', String(formProd.stock_minimo));
    formData.append('stock_maximo', String(formProd.stock_maximo));
    formData.append('descripcion', formProd.descripcion || '');
    if (imagenFile) formData.append('imagen', imagenFile);

    try {
      await axios.post('http://localhost:8000/api/v1/productos', formData);
      alert("✅ Producto registrado correctamente");
      setModalOpen(false);
      setImagenFile(null);
      setFormProd({ 
        codigo_interno: '', 
        nombre: '', 
        categoria_id: categorias[0]?.id || 1, 
        unidad_medida: 'Pieza', 
        stock_actual: 0, 
        stock_minimo: 5, 
        stock_maximo: 100, 
        descripcion: '' 
      });
      cargarDatos();
    } catch (err: any) { 
      const errorDetail = err.response?.data?.detail;
      const msg = typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail;
      alert(`Error al guardar producto: ${msg || "Verifica los datos enviados"}`); 
    }
  };

  const handleRegistrarEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/api/v1/entradas', formEntrada);
      alert(`✅ Entrada procesada. Stock actualizado: ${res.data.nuevo_stock}`);
      setModalEntradaOpen(false);
      cargarDatos();
    } catch (err: any) { alert(err.response?.data?.detail || "Error registrando entrada"); }
  };

  const handleRegistrarSalida = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/api/v1/salidas', formSalida);
      alert(`✅ Salida procesada. Stock restante: ${res.data.stock_restante}`);
      setModalSalidaOpen(false);
      cargarDatos();
    } catch (err: any) { alert(err.response?.data?.detail || "Error registrando salida"); }
  };

  const prodsFiltrados = productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.codigo_interno.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/90 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
            <div className="bg-sky-600 p-2 rounded-xl text-white shadow-lg shadow-sky-600/30"><Box className="w-6 h-6" /></div>
            <div>
              <h1 className="text-base font-black text-white leading-tight">ALMACÉN PRO</h1>
              <p className="text-[10px] text-slate-400 font-mono">v1.0.0 • ERP SYSTEM</p>
            </div>
          </div>

          <nav className="p-4 space-y-1 text-sm font-medium">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Menú Principal</p>
            
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${activeTab === 'dashboard' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800/60'}`}>
              <LayoutDashboard className="w-4 h-4" /> Inventario
            </button>

            <button onClick={() => setActiveTab('movimientos')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${activeTab === 'movimientos' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800/60'}`}>
              <History className="w-4 h-4 text-emerald-400" /> Kárdex / Movimientos
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-sky-400" />
            <div>
              <p className="text-xs font-bold text-white">{user.nombre}</p>
              <p className="text-[10px] text-slate-500 uppercase">{user.rol}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* CONTENIDO */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-8 py-4 flex justify-between items-center sticky top-0 z-40">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input type="text" placeholder="Buscar producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500" />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => window.open('http://localhost:8000/api/v1/reportes/excel')} className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl transition">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button onClick={() => window.open('http://localhost:8000/api/v1/reportes/pdf')} className="flex items-center gap-1.5 text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-2 rounded-xl transition">
              <FileText className="w-4 h-4" /> PDF
            </button>
            
            <button onClick={() => setModalEntradaOpen(true)} className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl transition ml-2">
              <ArrowUpRight className="w-4 h-4" /> + Entrada
            </button>
            <button onClick={() => setModalSalidaOpen(true)} className="flex items-center gap-1 text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-2 rounded-xl transition">
              <ArrowDownLeft className="w-4 h-4" /> - Salida
            </button>
            <button onClick={() => setModalOpen(true)} className="flex items-center gap-1 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-2 rounded-xl transition">
              <Plus className="w-4 h-4" /> Producto
            </button>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="p-8 space-y-8 overflow-y-auto">
          {activeTab === 'dashboard' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-base font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-sky-400" /> Catálogo de Inventario En Vivo</h2>
                <button onClick={cargarDatos} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-[11px] uppercase bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Foto</th>
                      <th className="px-6 py-4">Código</th>
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4 text-center">Estatus</th>
                      <th className="px-6 py-4 text-right">Existencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {prodsFiltrados.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-3">
                          {p.imagen_principal ? (
                            <img src={`http://localhost:8000${p.imagen_principal}`} className="w-10 h-10 object-cover rounded-lg border border-slate-700" />
                          ) : ( <div className="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center text-slate-600 border border-slate-800"><Package className="w-5 h-5" /></div> )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-bold text-sky-400">{p.codigo_interno}</td>
                        <td className="px-6 py-4 font-bold text-white">{p.nombre}</td>
                        <td className="px-6 py-4 text-center">
                          {p.stock_actual <= p.stock_minimo ? (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Stock Bajo</span>
                          ) : (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Correcto</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-white text-base">{p.stock_actual}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-base font-bold text-white flex items-center gap-2"><History className="w-5 h-5 text-emerald-400" /> Kárdex de Movimientos (Entradas y Salidas)</h2>
              </div>
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-[11px] uppercase bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Fecha/Hora</th>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4">Cantidad</th>
                    <th className="px-6 py-4">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {movimientos.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="px-6 py-3 font-bold">
                        {m.tipo === 'ENTRADA' ? (
                          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">+ ENTRADA</span>
                        ) : (
                          <span className="text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20">- SALIDA</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">{m.fecha}</td>
                      <td className="px-6 py-4 font-bold text-white">{m.producto}</td>
                      <td className="px-6 py-4 font-black">{m.cantidad}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">{m.detalle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* MODAL ENTRADA */}
      {modalEntradaOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2"><ArrowUpRight className="w-5 h-5 text-emerald-400" /> Registrar Entrada (Reabastecimiento)</h3>
            <form onSubmit={handleRegistrarEntrada} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Producto</label>
                <select value={formEntrada.producto_id} onChange={e => setFormEntrada({...formEntrada, producto_id: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Cantidad Comprada</label>
                <input type="number" min="1" required value={formEntrada.cantidad} onChange={e => setFormEntrada({...formEntrada, cantidad: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Proveedor / Folio Factura</label>
                <input type="text" placeholder="Ej: Electríca del Norte / FAC-1029" value={formEntrada.proveedor} onChange={e => setFormEntrada({...formEntrada, proveedor: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalEntradaOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold">Procesar Entrada</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SALIDA */}
      {modalSalidaOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2"><ArrowDownLeft className="w-5 h-5 text-amber-400" /> Registrar Salida de Material</h3>
            <form onSubmit={handleRegistrarSalida} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Área Solicitante</label>
                <select value={formSalida.area_id} onChange={e => setFormSalida({...formSalida, area_id: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
                  {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Producto</label>
                <select value={formSalida.producto_id} onChange={e => setFormSalida({...formSalida, producto_id: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock_actual})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Cantidad a Entregar</label>
                <input type="number" min="1" required value={formSalida.cantidad} onChange={e => setFormSalida({...formSalida, cantidad: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalSalidaOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold">Procesar Salida</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO PRODUCTO COMPLETO */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-sky-400" /> Registrar Nuevo Producto</h3>
            <form onSubmit={handleGuardarProducto} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Código Interno</label>
                  <input type="text" required placeholder="P-1001" value={formProd.codigo_interno} onChange={e => setFormProd({...formProd, codigo_interno: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Categoría</label>
                  <select value={formProd.categoria_id} onChange={e => setFormProd({...formProd, categoria_id: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nombre del Producto</label>
                <input type="text" required placeholder="Jamón / Lámpara LED" value={formProd.nombre} onChange={e => setFormProd({...formProd, nombre: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Stock Inicial</label>
                  <input type="number" min="0" value={formProd.stock_actual} onChange={e => setFormProd({...formProd, stock_actual: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Stock Mínimo Alerta</label>
                  <input type="number" min="0" value={formProd.stock_minimo} onChange={e => setFormProd({...formProd, stock_minimo: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Fotografía del Producto</label>
                <input type="file" accept="image/*" onChange={e => e.target.files && setImagenFile(e.target.files[0])} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-400" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
