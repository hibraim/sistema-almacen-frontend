import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, ArrowDownLeft, 
  Search, Box, Plus, FileSpreadsheet, FileText, History, UserCheck,
  Edit2, Trash2, RefreshCw, Menu, X,
  Building2, ChevronRight, ChevronLeft, Tag, Image as ImageIcon, Sparkles, Layers, LayoutGrid, Table as TableIcon, Trash, ZoomIn
} from 'lucide-react';

interface SubArea { id: number; nombre: string; encargado: string; cargo: string; }
interface Area { id: number; nombre: string; encargado: string; cargo: string; subareas: SubArea[]; }
interface Categoria { id: number; nombre: string; descripcion?: string; }
interface Producto {
  id: string;
  codigo_interno: string;
  nombre: string;
  descripcion?: string;
  categoria_id: number;
  categoria_nombre: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  unidad_medida: string;
  imagen_principal?: string;
  distribucion_areas?: Record<string, number>;
}

export default function App() {
  const [usuario] = useState<any>(JSON.parse(localStorage.getItem('usuario_almacen') || '{"nombre": "Administrador General", "username": "admin", "rol": "admin"}'));

  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalogo' | 'movimientos' | 'areas' | 'categorias'>('dashboard');
  const [vistaModo, setVistaModo] = useState<'tarjetas' | 'tabla'>('tarjetas');
  const [sidebarOpen, setSidebarOpen] = useState(false);
   
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 24;

  const [areas, setAreas] = useState<Area[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [areaReporte, setAreaReporte] = useState('TODAS');

  // Estado para el Pop-Up de Imagen
  const [productoZoom, setProductoZoom] = useState<Producto | null>(null);

  // Autocompletado para Entradas
  const [busquedaEntrada, setBusquedaEntrada] = useState('');
  const [mostrarDropdownEntrada, setMostrarDropdownEntrada] = useState(false);
  const dropdownEntradaRef = useRef<HTMLDivElement>(null);

  // Autocompletado para Salidas
  const [busquedaProductoSalida, setBusquedaProductoSalida] = useState('');
  const [mostrarDropdownSalida, setMostrarDropdownSalida] = useState(false);
  const dropdownSalidaRef = useRef<HTMLDivElement>(null);

  // Modales
  const [modalEntradaOpen, setModalEntradaOpen] = useState(false);
  const [modalNuevoArticuloOpen, setModalNuevoArticuloOpen] = useState(false);
  const [modalSalidaOpen, setModalSalidaOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
   
  const [modalAreaOpen, setModalAreaOpen] = useState(false);
  const [modalSubAreaOpen, setModalSubAreaOpen] = useState<number | null>(null);
   
  const [modalCatOpen, setModalCatOpen] = useState(false);
  const [catEditar, setCatEditar] = useState<Categoria | null>(null);

  const [prodEditar, setProdEditar] = useState<Producto | null>(null);

  // Formularios con valores iniciales limpios (en blanco / 0)
  const [formNuevoArticulo, setFormNuevoArticulo] = useState({
    codigo_interno: '',
    nombre: '',
    categoria_id: '1',
    unidad_medida: 'Pieza',
    descripcion: '',
    imagen: null as File | null
  });

  const [formEntrada, setFormEntrada] = useState({ 
    codigo_interno: '', 
    nombre: '', 
    categoria_id: '1', 
    cantidad: 0, 
    unidad_medida: 'Pieza',
    area_id: '', // En blanco hasta que se seleccione
    proveedor: '', 
    recibio: usuario?.nombre || '',
    imagen: null as File | null 
  });

  const [formArea, setFormArea] = useState({ nombre: '', encargado: '', cargo: '' });
  const [formSubArea, setFormSubArea] = useState({ nombre: '', encargado: '', cargo: '' });
  const [formCat, setFormCat] = useState({ nombre: '', descripcion: '' });

  const [formSalida, setFormSalida] = useState({
    folio: '', 
    area_id: '', // En blanco hasta que se seleccione
    subarea_id: '', 
    producto_id: '', 
    producto_nombre_seleccionado: '',
    cantidad: 0, 
    destino_uso: '', 
    recibio_nombre: '', 
    entrego_nombre: usuario?.nombre || ''
  });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resA, resC, resP, resM] = await Promise.all([
        axios.get('https://sistema-almacen-backend.onrender.com/api/v1/areas').catch(() => null),
        axios.get('https://sistema-almacen-backend.onrender.com/api/v1/categorias').catch(() => null),
        axios.get('https://sistema-almacen-backend.onrender.com/api/v1/productos').catch(() => null),
        axios.get('https://sistema-almacen-backend.onrender.com/api/v1/movimientos').catch(() => null)
      ]);

      const listAreas = resA?.data?.data || [];
      setAreas(listAreas);
      if (resC?.data?.data) setCategorias(resC.data.data);
       
      const prods = resP?.data?.data || [];
      setProductos(prods);
      setMovimientos(resM?.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownSalidaRef.current && !dropdownSalidaRef.current.contains(event.target as Node)) {
        setMostrarDropdownSalida(false);
      }
      if (dropdownEntradaRef.current && !dropdownEntradaRef.current.contains(event.target as Node)) {
        setMostrarDropdownEntrada(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLimpiarKardex = async () => {
    if (confirm("⚠️ ¿Estás seguro de limpiar todo el Kárdex y movimientos de prueba? Esta acción dejará el sistema listo para operación real.")) {
      try {
        const res = await axios.delete('https://sistema-almacen-backend.onrender.com/api/v1/movimientos/limpiar');
        alert(`✨ ${res.data.message}`);
        cargarDatos();
      } catch (err) {
        alert("Error al limpiar el kárdex");
      }
    }
  };

  const handleCrearArticuloCatalogo = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('codigo_interno', formNuevoArticulo.codigo_interno || `SPM-${Date.now().toString().slice(-4)}`);
    formData.append('nombre', formNuevoArticulo.nombre);
    formData.append('categoria_id', formNuevoArticulo.categoria_id);
    formData.append('unidad_medida', formNuevoArticulo.unidad_medida);
    formData.append('descripcion', formNuevoArticulo.descripcion);
    if (formNuevoArticulo.imagen) formData.append('imagen', formNuevoArticulo.imagen);

    try {
      const res = await axios.post('https://sistema-almacen-backend.onrender.com/api/v1/articulos-catalogo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`✨ ${res.data.message}`);
      setModalNuevoArticuloOpen(false);
      setFormNuevoArticulo({ codigo_interno: '', nombre: '', categoria_id: '1', unidad_medida: 'Pieza', descripcion: '', imagen: null });
      cargarDatos();
    } catch (err: any) { alert(err.response?.data?.detail || "Error al agregar al catálogo"); }
  };

  const handleGuardarEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEntrada.area_id) {
      alert("⚠️ Por favor selecciona un Departamento / Área.");
      return;
    }
    const formData = new FormData();
    formData.append('codigo_interno', formEntrada.codigo_interno || `SPM-${Date.now().toString().slice(-4)}`);
    formData.append('nombre', formEntrada.nombre);
    formData.append('categoria_id', formEntrada.categoria_id || '1');
    formData.append('unidad_medida', formEntrada.unidad_medida || 'Pieza');
    formData.append('stock_actual', String(formEntrada.cantidad));
    formData.append('stock_minimo', '5');
    formData.append('stock_maximo', '1000');
    formData.append('area_id', formEntrada.area_id);
    formData.append('proveedor', formEntrada.proveedor || 'Proveedor General');
    formData.append('recibio', formEntrada.recibio);
     
    if (formEntrada.imagen) {
      formData.append('imagen', formEntrada.imagen);
    }

    try {
      const res = await axios.post('https://sistema-almacen-backend.onrender.com/api/v1/productos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`✨ ${res.data.message}`);
      setModalEntradaOpen(false);
      setFormEntrada({ codigo_interno: '', nombre: '', categoria_id: '1', cantidad: 0, unidad_medida: 'Pieza', area_id: '', proveedor: '', recibio: usuario?.nombre || '', imagen: null });
      setBusquedaEntrada('');
      cargarDatos();
    } catch (err) { alert("Error al registrar la entrada"); }
  };

  const handleActualizarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodEditar) return;
    try {
      await axios.put(`https://sistema-almacen-backend.onrender.com/api/v1/productos/${prodEditar.id}`, {
        codigo_interno: prodEditar.codigo_interno,
        nombre: prodEditar.nombre,
        stock_actual: prodEditar.stock_actual,
        unidad_medida: prodEditar.unidad_medida
      });
      alert("✨ Artículo actualizado correctamente");
      setModalEditOpen(false);
      setProdEditar(null);
      cargarDatos();
    } catch (err) { alert("Error al actualizar"); }
  };

  const handleEliminarProducto = async (id: string, nombre: string) => {
    if (confirm(`¿Eliminar artículo "${nombre}"?`)) {
      try { await axios.delete(`https://sistema-almacen-backend.onrender.com/api/v1/productos/${id}`); cargarDatos(); } catch (err) { alert("Error al eliminar"); }
    }
  };

  const handleGuardarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (catEditar) {
        await axios.put(`https://sistema-almacen-backend.onrender.com/api/v1/categorias/${catEditar.id}`, formCat);
        alert("✨ Categoría actualizada");
      } else {
        await axios.post('https://sistema-almacen-backend.onrender.com/api/v1/categorias', formCat);
        alert("✨ Categoría creada");
      }
      setModalCatOpen(false);
      setCatEditar(null);
      setFormCat({ nombre: '', descripcion: '' });
      cargarDatos();
    } catch (err: any) { alert(err.response?.data?.detail || "Error"); }
  };

  const handleEliminarCategoria = async (id: number, nombre: string) => {
    if (confirm(`¿Eliminar categoría "${nombre}"?`)) {
      try { await axios.delete(`https://sistema-almacen-backend.onrender.com/api/v1/categorias/${id}`); cargarDatos(); } catch (e) { alert("En uso"); }
    }
  };

  const handleGuardarArea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('https://sistema-almacen-backend.onrender.com/api/v1/areas', formArea);
      alert("✨ Área creada");
      setModalAreaOpen(false);
      setFormArea({ nombre: '', encargado: '', cargo: '' });
      cargarDatos();
    } catch (err) {}
  };

  const handleEliminarArea = async (id: number, nombre: string) => {
    if (confirm(`¿Eliminar área "${nombre}"?`)) {
      try { await axios.delete(`https://sistema-almacen-backend.onrender.com/api/v1/areas/${id}`); cargarDatos(); } catch (e) {}
    }
  };

  const handleGuardarSubArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSubAreaOpen) return;
    try {
      await axios.post('https://sistema-almacen-backend.onrender.com/api/v1/subareas', { ...formSubArea, area_id: modalSubAreaOpen });
      alert("✨ Sub-área creada");
      setModalSubAreaOpen(null);
      setFormSubArea({ nombre: '', encargado: '', cargo: '' });
      cargarDatos();
    } catch (err) {}
  };

  const handleEliminarSubArea = async (id: number, nombre: string) => {
    if (confirm(`¿Eliminar sub-área "${nombre}"?`)) {
      try { await axios.delete(`https://sistema-almacen-backend.onrender.com/api/v1/subareas/${id}`); cargarDatos(); } catch (e) {}
    }
  };

  const handleRegistrarSalida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSalida.area_id) {
      alert("⚠️ Selecciona la Dirección / Área solicitante.");
      return;
    }
    if (!formSalida.producto_id) {
      alert("⚠️ Selecciona un artículo válido.");
      return;
    }
    try {
      const payload = {
        folio: formSalida.folio,
        area_id: formSalida.area_id,
        subarea_id: formSalida.subarea_id ? Number(formSalida.subarea_id) : null,
        producto_id: formSalida.producto_id,
        cantidad: formSalida.cantidad,
        descripcion: `Uso: ${formSalida.destino_uso}`,
        recibio_nombre: formSalida.recibio_nombre,
        entrego_nombre: formSalida.entrego_nombre
      };
      await axios.post('https://sistema-almacen-backend.onrender.com/api/v1/salidas', payload);
      alert("✨ Salida procesada con éxito");
      setModalSalidaOpen(false);
      setFormSalida({ 
        folio: '', 
        area_id: '', 
        subarea_id: '', 
        producto_id: '', 
        producto_nombre_seleccionado: '',
        cantidad: 0, 
        destino_uso: '', 
        recibio_nombre: '', 
        entrego_nombre: usuario?.nombre || '' 
      });
      setBusquedaProductoSalida('');
      cargarDatos();
    } catch (err: any) { alert(err.response?.data?.detail || "Error en salida"); }
  };

  const prodsFiltrados = productos.map(p => {
    const query = busqueda.toLowerCase().trim();
    if (!query) return p;

    const nombreMatch = p.nombre.toLowerCase().includes(query);
    const codigoMatch = p.codigo_interno.toLowerCase().includes(query);
    const categoriaMatch = p.categoria_nombre.toLowerCase().includes(query);

    if (nombreMatch || codigoMatch || categoriaMatch) return p;

    if (p.distribucion_areas) {
      const distribucionFiltrada: Record<string, number> = {};
      let coincideArea = false;
      for (const [areaName, cant] of Object.entries(p.distribucion_areas)) {
        if (areaName.toLowerCase().includes(query)) {
          distribucionFiltrada[areaName] = cant;
          coincideArea = true;
        }
      }
      if (coincideArea) {
        return {
          ...p,
          distribucion_areas: distribucionFiltrada,
          stock_actual: Object.values(distribucionFiltrada).reduce((a, b) => a + b, 0)
        };
      }
    }
    return null;
  }).filter(Boolean) as Producto[];

  const productosEntradaFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busquedaEntrada.toLowerCase()) || 
    p.codigo_interno.toLowerCase().includes(busquedaEntrada.toLowerCase())
  ).slice(0, 15);

  const productosSalidaFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busquedaProductoSalida.toLowerCase()) || 
    p.codigo_interno.toLowerCase().includes(busquedaProductoSalida.toLowerCase())
  ).slice(0, 15);

  const totalPaginas = Math.ceil(prodsFiltrados.length / elementosPorPagina) || 1;
  const prodsPaginados = prodsFiltrados.slice((paginaActual - 1) * elementosPorPagina, paginaActual * elementosPorPagina);

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 shadow-xl md:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div>
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-600/20">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-wider text-slate-900 leading-tight">SISTEMA SPM</h1>
                <p className="text-[10px] text-blue-600 font-mono tracking-widest uppercase font-bold">MUNICIPAL ALMACÉN</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-slate-800 p-1"><X className="w-5 h-5" /></button>
          </div>

          <nav className="p-4 space-y-1.5 text-xs font-semibold">
            <p className="text-[10px] font-bold text-slate-400 uppercase px-3 mb-2">Menú Principal</p>
            <button onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-150 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-bold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              <LayoutDashboard className="w-4 h-4" /> Inventario General
            </button>
            <button onClick={() => { setActiveTab('catalogo'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-150 ${activeTab === 'catalogo' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-bold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              <Layers className="w-4 h-4" /> Catálogo de Artículos
            </button>
            <button onClick={() => { setActiveTab('areas'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-150 ${activeTab === 'areas' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-bold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              <Building2 className="w-4 h-4" /> Catálogo de Áreas
            </button>
            <button onClick={() => { setActiveTab('categorias'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-150 ${activeTab === 'categorias' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-bold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              <Tag className="w-4 h-4" /> Categorías
            </button>
            <button onClick={() => { setActiveTab('movimientos'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-150 ${activeTab === 'movimientos' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-bold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              <History className="w-4 h-4" /> Kárdex con Hora
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><UserCheck className="w-4 h-4" /></div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate">{usuario.nombre}</p>
              <p className="text-[10px] text-blue-600 uppercase font-mono font-semibold">{usuario.rol}</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-xs" />}

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50">
        
        <header className="border-b border-slate-200 bg-white px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3 shrink-0 shadow-xs flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-[200px] max-w-lg">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 bg-slate-100 rounded-xl text-slate-700 hover:bg-slate-200"><Menu className="w-5 h-5" /></button>
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
              <input type="text" placeholder="Buscar entre más de 1,000 artículos por nombre, código..." value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }} className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition" />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase hidden sm:inline">Área:</span>
              <select value={areaReporte} onChange={e => setAreaReporte(e.target.value)} className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer">
                <option value="TODAS">Todas</option>
                {areas.map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
              </select>
            </div>

            <a href={`https://sistema-almacen-backend.onrender.com/api/v1/reportes/excel?area=${encodeURIComponent(areaReporte)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 rounded-xl transition shadow-sm" title="Descargar Excel">
              <FileSpreadsheet className="w-4 h-4" /> <span className="hidden sm:inline">Excel</span>
            </a>
            
            <a href={`https://sistema-almacen-backend.onrender.com/api/v1/reportes/pdf?area=${encodeURIComponent(areaReporte)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3 py-2 rounded-xl transition shadow-sm" title="Descargar PDF">
              <FileText className="w-4 h-4" /> <span className="hidden sm:inline">PDF</span>
            </a>

            <button onClick={() => setModalSalidaOpen(true)} className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3.5 py-2 rounded-xl transition shadow-sm">
              <ArrowDownLeft className="w-4 h-4" /> <span>Salida</span>
            </button>
            <button onClick={() => setModalEntradaOpen(true)} className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 rounded-xl transition shadow-sm">
              <Plus className="w-4 h-4" /> <span>Entrada</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-800">
                    Inventario General ({prodsFiltrados.length} artículos encontrados)
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setVistaModo('tarjetas')} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${vistaModo === 'tarjetas' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <LayoutGrid className="w-3.5 h-3.5" /> Fichas
                  </button>
                  <button onClick={() => setVistaModo('tabla')} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${vistaModo === 'tabla' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <TableIcon className="w-3.5 h-3.5" /> Tabla
                  </button>
                  <button onClick={cargarDatos} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition ml-2"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
                </div>
              </div>

              {vistaModo === 'tarjetas' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {prodsPaginados.map((p) => (
                    <div key={p.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between">
                      <div>
                        <div onClick={() => setProductoZoom(p)} title="Clic para ver detalle" className="relative h-28 bg-slate-100 border-b border-slate-100 flex items-center justify-center overflow-hidden cursor-pointer group">
                          {p.imagen_principal ? (
                            <img src={`https://sistema-almacen-backend.onrender.com${p.imagen_principal}`} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 space-y-1">
                              <ImageIcon className="w-7 h-7 opacity-40" />
                              <span className="text-[9px]">Sin foto</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <ZoomIn className="w-5 h-5 drop-shadow" />
                          </div>
                          <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded pointer-events-none">
                            {p.codigo_interno}
                          </div>
                        </div>

                        <div className="p-3 space-y-2">
                          <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">{p.nombre}</h3>
                          
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-medium uppercase text-[9px]">Stock:</span>
                            <span className={`font-black px-2 py-0.5 rounded text-[10px] ${p.stock_actual > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                              {p.stock_actual} {p.unidad_medida}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setProdEditar(p); setModalEditOpen(true); }} title="Editar" className="p-1.5 bg-white hover:bg-blue-50 text-blue-600 rounded border border-slate-200"><Edit2 className="w-3 h-3" /></button>
                          <button onClick={() => handleEliminarProducto(p.id, p.nombre)} title="Eliminar" className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 rounded border border-slate-200"><Trash2 className="w-3 h-3" /></button>
                        </div>
                        <button onClick={() => {
                          setFormSalida(prev => ({ ...prev, producto_id: p.id, producto_nombre_seleccionado: `${p.codigo_interno} - ${p.nombre} (Stock: ${p.stock_actual} ${p.unidad_medida})` }));
                          setModalSalidaOpen(true);
                        }} className="flex items-center gap-1 text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-semibold px-2 py-1 rounded transition shadow-xs">
                          <ArrowDownLeft className="w-3 h-3" /> Salida
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-700 min-w-[700px]">
                      <thead className="text-[10px] uppercase bg-slate-100 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3.5 text-center w-14">Foto</th>
                          <th className="px-4 py-3.5">Código</th>
                          <th className="px-4 py-3.5">Artículo / Insumo</th>
                          <th className="px-4 py-3.5">Categoría</th>
                          <th className="px-4 py-3.5 text-right">Existencia Total</th>
                          <th className="px-4 py-3.5 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {prodsPaginados.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition duration-150">
                            <td className="px-4 py-3 text-center">
                              {p.imagen_principal ? (
                                <img onClick={() => setProductoZoom(p)} src={`https://sistema-almacen-backend.onrender.com${p.imagen_principal}`} alt={p.nombre} className="w-10 h-10 object-cover rounded-xl border border-slate-200 mx-auto shadow-xs cursor-pointer hover:scale-110 transition" title="Ver foto" />
                              ) : (
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mx-auto border border-slate-200">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-blue-600">{p.codigo_interno}</td>
                            <td className="px-4 py-3 font-bold text-slate-900 text-sm">{p.nombre}</td>
                            <td className="px-4 py-3 text-slate-600">{p.categoria_nombre}</td>
                            <td className="px-4 py-3 text-right font-black text-slate-900 text-sm">{p.stock_actual} <span className="text-[10px] font-normal text-slate-500">{p.unidad_medida}</span></td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => { setProdEditar(p); setModalEditOpen(true); }} title="Editar" className="p-2 bg-slate-100 hover:bg-blue-50 text-blue-600 rounded-xl transition border border-slate-200"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleEliminarProducto(p.id, p.nombre)} title="Eliminar" className="p-2 bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-xl transition border border-slate-200"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="px-6 py-4 bg-white border border-slate-200 rounded-2xl flex justify-between items-center text-xs shadow-xs">
                <p className="text-slate-500">Página <b>{paginaActual}</b> de <b>{totalPaginas}</b> (Mostrando {elementosPorPagina} por página)</p>
                <div className="flex items-center gap-2">
                  <button disabled={paginaActual === 1} onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))} className="p-2 bg-slate-100 disabled:opacity-30 rounded-xl text-slate-700 hover:bg-slate-200"><ChevronLeft className="w-4 h-4" /></button>
                  <button disabled={paginaActual >= totalPaginas} onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))} className="p-2 bg-slate-100 disabled:opacity-30 rounded-xl text-slate-700 hover:bg-slate-200"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'catalogo' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex-wrap gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Layers className="w-5 h-5 text-blue-600" /> Catálogo Maestro de Artículos</h2>
                </div>
                <button onClick={() => setModalNuevoArticuloOpen(true)} className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition shadow-sm">
                  <Plus className="w-4 h-4" /> Agregar al Catálogo
                </button>
              </div>
            </div>
          )}

          {activeTab === 'areas' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex-wrap gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-600" /> Catálogo de Direcciones y Áreas SPM</h2>
                </div>
                <button onClick={() => setModalAreaOpen(true)} className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition shadow-sm">
                  <Plus className="w-4 h-4" /> Nueva Dirección / Área
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {areas.map((a) => (
                  <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{a.nombre}</h3>
                        <p className="text-xs text-blue-600 mt-1 font-medium">👤 {a.encargado} <span className="text-slate-400">({a.cargo || 'Director'})</span></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModalSubAreaOpen(a.id)} className="text-[11px] bg-slate-100 hover:bg-slate-200 text-blue-600 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" /> Sub-área
                        </button>
                        <button onClick={() => handleEliminarArea(a.id, a.nombre)} className="p-2 text-rose-600 bg-rose-50 rounded-xl border border-rose-200"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'categorias' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex-wrap gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Tag className="w-5 h-5 text-purple-600" /> Catálogo de Categorías SPM</h2>
                </div>
                <button onClick={() => { setCatEditar(null); setFormCat({ nombre: '', descripcion: '' }); setModalCatOpen(true); }} className="flex items-center gap-2 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 rounded-xl transition shadow-sm">
                  <Plus className="w-4 h-4" /> Nueva Categoría
                </button>
              </div>
            </div>
          )}

          {activeTab === 'movimientos' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center flex-wrap gap-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2"><History className="w-4 h-4 text-emerald-600" /> Kárdex con Registro de Hora Exacta</h2>
                <button onClick={handleLimpiarKardex} className="flex items-center gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3.5 py-2 rounded-xl transition shadow-sm">
                  <Trash className="w-4 h-4" /> Limpiar Kárdex
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL ENTRADA (LIMPIO Y EN BLANCO) */}
      {modalEntradaOpen && (
        <div className="fixed inset-0 bg-slate-950/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600" /> Registrar Entrada de Artículo</h3>
              <button onClick={() => setModalEntradaOpen(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleGuardarEntrada} className="flex flex-col space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Código Interno</label>
                <input type="text" placeholder="Ej: CLOR-01" value={formEntrada.codigo_interno} onChange={e => setFormEntrada({...formEntrada, codigo_interno: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none font-mono font-bold" />
              </div>

              <div className="relative space-y-1" ref={dropdownEntradaRef}>
                <label className="block text-slate-700 font-semibold">Buscar o Escribir Artículo</label>
                <input type="text" required placeholder="Escribe para buscar existente o crear nuevo..." value={formEntrada.nombre} onChange={e => {
                  setFormEntrada({...formEntrada, nombre: e.target.value});
                  setBusquedaEntrada(e.target.value);
                  setMostrarDropdownEntrada(true);
                }} onFocus={() => setMostrarDropdownEntrada(true)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none" />

                {mostrarDropdownEntrada && busquedaEntrada.trim() !== '' && productosEntradaFiltrados.length > 0 && (
                  <div className="absolute left-0 right-0 top-16 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {productosEntradaFiltrados.map(p => (
                      <div key={p.id} onClick={() => {
                        setFormEntrada({
                          ...formEntrada,
                          codigo_interno: p.codigo_interno,
                          nombre: p.nombre,
                          categoria_id: String(p.categoria_id),
                          unidad_medida: p.unidad_medida
                        });
                        setBusquedaEntrada('');
                        setMostrarDropdownEntrada(false);
                      }} className="p-2.5 hover:bg-blue-50 cursor-pointer text-xs text-slate-800 transition flex items-center justify-between">
                        <div>
                          <span className="font-mono font-black text-blue-600 block text-[11px]">{p.codigo_interno}</span>
                          <span className="font-bold text-slate-900">{p.nombre}</span>
                        </div>
                        <span className="text-slate-500 text-[10px]">Stock: {p.stock_actual} {p.unidad_medida}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Categoría</label>
                <select value={formEntrada.categoria_id} onChange={e => setFormEntrada({...formEntrada, categoria_id: e.target.value})} className="w-full bg-slate-50 text-slate-900 font-bold border border-slate-300 rounded-xl p-2.5 outline-none">
                  {categorias.map(c => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Cantidad a Ingresar</label>
                  <input type="number" min="0" required value={formEntrada.cantidad} onChange={e => setFormEntrada({...formEntrada, cantidad: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Unidad de Medida</label>
                  <select value={formEntrada.unidad_medida} onChange={e => setFormEntrada({...formEntrada, unidad_medida: e.target.value})} className="w-full bg-slate-50 text-slate-900 font-bold border border-slate-300 rounded-xl p-2.5 outline-none">
                    <option value="Pieza">Pieza(s)</option>
                    <option value="Tibor">Tibor(es)</option>
                    <option value="Cubeta">Cubeta(s)</option>
                    <option value="Bidón">Bidón(es)</option>
                    <option value="Bulto">Bulto(s)</option>
                    <option value="Kg">Kilogramos (Kg)</option>
                    <option value="Tonelada">Tonelada(s)</option>
                    <option value="Litro">Litro(s)</option>
                    <option value="Metro">Metro(s)</option>
                    <option value="Caja">Caja(s)</option>
                    <option value="Paquete">Paquete(s)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">¿Para qué Departamento / Área es este material?</label>
                <select required value={formEntrada.area_id} onChange={e => setFormEntrada({...formEntrada, area_id: e.target.value})} className="w-full bg-blue-50 text-blue-900 font-bold border border-blue-200 rounded-xl p-2.5 outline-none">
                  <option value="" disabled>-- Selecciona un área o departamento --</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Fotografía (Opcional)</label>
                <input type="file" accept="image/*" onChange={e => setFormEntrada({...formEntrada, imagen: e.target.files ? e.target.files[0] : null})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-600 text-xs" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Proveedor (Opcional)</label>
                <input type="text" placeholder="Ej: Ferretería Municipal..." value={formEntrada.proveedor} onChange={e => setFormEntrada({...formEntrada, proveedor: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Quién Recibió en Almacén</label>
                <input type="text" required value={formEntrada.recibio} onChange={e => setFormEntrada({...formEntrada, recibio: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setModalEntradaOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm">Registrar Entrada</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SALIDA (LIMPIO Y EN BLANCO) */}
      {modalSalidaOpen && (
        <div className="fixed inset-0 bg-slate-950/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><ArrowDownLeft className="w-5 h-5 text-amber-600" /> Registrar Salida SPM</h3>
              <button onClick={() => setModalSalidaOpen(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleRegistrarSalida} className="flex flex-col space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Folio</label>
                <input type="text" placeholder="Ej: VALE-001" value={formSalida.folio} onChange={e => setFormSalida({...formSalida, folio: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none" />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Quién Solicita (Dirección / Área)</label>
                <select required value={formSalida.area_id} onChange={e => setFormSalida({...formSalida, area_id: e.target.value, subarea_id: ''})} className="w-full bg-slate-50 text-slate-900 font-bold border border-slate-300 rounded-xl p-3 outline-none">
                  <option value="" disabled>-- Selecciona un área o departamento --</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>

              <div className="relative space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-300" ref={dropdownSalidaRef}>
                <label className="block text-slate-700 font-semibold">Artículo / Insumo (Búsqueda Rápida)</label>
                <input type="text" placeholder="Escribe el nombre o código..." value={formSalida.producto_nombre_seleccionado || busquedaProductoSalida} onChange={e => {
                  setBusquedaProductoSalida(e.target.value);
                  setFormSalida({...formSalida, producto_nombre_seleccionado: '', producto_id: ''});
                  setMostrarDropdownSalida(true);
                }} onFocus={() => setMostrarDropdownSalida(true)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-xs focus:outline-none font-bold" />

                {mostrarDropdownSalida && (
                  <div className="absolute left-3 right-3 top-16 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {productosSalidaFiltrados.map(p => (
                      <div key={p.id} onClick={() => {
                        setFormSalida({
                          ...formSalida, 
                          producto_id: p.id, 
                          producto_nombre_seleccionado: `${p.codigo_interno} - ${p.nombre} (Stock: ${p.stock_actual} ${p.unidad_medida})`
                        });
                        setBusquedaProductoSalida('');
                        setMostrarDropdownSalida(false);
                      }} className="p-2.5 hover:bg-amber-50 cursor-pointer text-xs text-slate-800 transition flex items-center justify-between">
                        <div>
                          <span className="font-mono font-black text-amber-700 block text-[11px]">{p.codigo_interno}</span>
                          <span className="font-bold text-slate-900">{p.nombre}</span>
                        </div>
                        <span className="text-emerald-700 font-mono font-bold">Stock: {p.stock_actual} {p.unidad_medida}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Cantidad a Entregar</label>
                <input type="number" min="0" required value={formSalida.cantidad} onChange={e => setFormSalida({...formSalida, cantidad: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none" />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Destino / Uso</label>
                <input type="text" required placeholder="Reparación..." value={formSalida.destino_uso} onChange={e => setFormSalida({...formSalida, destino_uso: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none" />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Entrega</label>
                <input type="text" required value={formSalida.entrego_nombre} onChange={e => setFormSalida({...formSalida, entrego_nombre: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none" />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Recibe</label>
                <input type="text" required value={formSalida.recibio_nombre} onChange={e => setFormSalida({...formSalida, recibio_nombre: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none" />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setModalSalidaOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm">Procesar Salida</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP ZOOM IMAGEN */}
      {productoZoom && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">{productoZoom.codigo_interno}</span>
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-[240px]">{productoZoom.nombre}</h3>
              </div>
              <button onClick={() => setProductoZoom(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="relative h-56 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
              {productoZoom.imagen_principal ? (
                <img src={`https://sistema-almacen-backend.onrender.com${productoZoom.imagen_principal}`} alt={productoZoom.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 space-y-1">
                  <ImageIcon className="w-10 h-10 opacity-40" />
                  <span className="text-xs">Sin fotografía disponible</span>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-1">
              <button onClick={() => setProductoZoom(null)} className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm">Cerrar Ventana</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}