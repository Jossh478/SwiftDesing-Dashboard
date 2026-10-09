import { useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { LayoutDashboard, Users, ShoppingCart, Download, Settings, Activity, LogOut, ShieldCheck, User as UserIcon, TrendingUp, Search, Sparkles, MapPin, Package, Kanban, LayoutGrid, FileJson, Cpu, X, Database, Bell, Store, Archive, AlertCircle, CheckCircle2, PackageSearch, Megaphone, Filter, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis, AreaChart, Area } from 'recharts'
import Login from './Login'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [vistaActiva, setVistaActiva] = useState('dashboard')
  const [perfilAbierto, setPerfilAbierto] = useState(false)

  useEffect(() => {
  const sesionGuardada = sessionStorage.getItem("sesionTitania");
  if (sesionGuardada) {
    setIsAuthenticated(true); 
  }
}, []);
  
  const [ventas, setVentas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [productos, setProductos] = useState([]) 
  const [campanas, setCampanas] = useState([]) 
  const [loading, setLoading] = useState(true)
  
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [vistaOperaciones, setVistaOperaciones] = useState('kanban') 

  const [insightIA, setInsightIA] = useState("Analizando cubos de datos...");

  const datosEvolucion = [
    { mes: 'Ene', ingresos: 4200, costos: 1800 },
    { mes: 'Feb', ingresos: 5100, costos: 2100 },
    { mes: 'Mar', ingresos: 4800, costos: 1950 },
    { mes: 'Abr', ingresos: 6300, costos: 2400 },
    { mes: 'May', ingresos: 7100, costos: 2800 },
    { mes: 'Jun', ingresos: 8500, costos: 3200 },
    { mes: 'Jul', ingresos: 9200, costos: 3500 },
    { mes: 'Ago', ingresos: 12400, costos: 4200 }, 
  ];

  const kpisMarketing = {
    cacPromedio: 14.50, 
    clvPromedio: 115.00, 
    ratio: '7.9x' 
  };

  const datosEmbudo = [
    { etapa: 'Vistas de Producto', cantidad: 12500, fill: '#818cf8' },
    { etapa: 'Clics y Detalles', cantidad: 4200, fill: '#6366f1' },
    { etapa: 'Añadidos al Carrito', cantidad: 1150, fill: '#4f46e5' },
    { etapa: 'Inicios Checkout', cantidad: 480, fill: '#4338ca' },
    { etapa: 'Compras Finales', cantidad: 156, fill: '#312e81' }
  ];

  const cargarDatos = () => {
    setLoading(true)
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    Promise.all([
      fetch(`${apiUrl}/api/ventas`).then(res => res.json()).catch(() => []),
      fetch(`${apiUrl}/api/usuarios`).then(res => res.json()).catch(() => []),
      fetch(`${apiUrl}/api/productos`).then(res => res.json()).catch(() => []),
      fetch(`${apiUrl}/api/campanas`).then(res => res.json()).catch(() => [])
    ])
    .then(([ventasData, usuariosData, productosData, campanasData]) => {
      setVentas(Array.isArray(ventasData) ? ventasData : [])
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : [])
      setProductos(Array.isArray(productosData) ? productosData : [])
      setCampanas(Array.isArray(campanasData) ? campanasData : [])
      setLoading(false)
    })
    .catch(error => {
      console.error("Error al cargar datos de Supabase:", error)
      setLoading(false)
    })

    fetch(`${apiUrl}/api/insights`)
      .then(res => res.json())
      .catch(() => ({success: false, insight: "Error de IA"}))
      .then(insightData => {
        if (insightData && insightData.insight) {
          setInsightIA(insightData.insight)
        } else {
          setInsightIA("No se pudo cargar el análisis predictivo.")
        }
      })
  }

  useEffect(() => {
    if (isAuthenticated) {
      cargarDatos()
    }
  }, [isAuthenticated])

  const productosEnRiesgo = productos.filter(p => p.coberturaDias <= 7 && p.stock < 999).length;

  const datosMatrizRentabilidad = productos.map(p => ({
    nombre: p.nombre,
    volumen: p.ventas,
    margen: p.margenPorcentaje,
    precio: p.precio
  }));


  const exportarAExcel = () => {
    const datosExportar = ventas.map(v => ({
      ID: v.id, Cliente: v.cliente, Ciudad: v.ubicacion?.ciudad, Estado: v.estado, Monto: v.monto
    }));
    const hoja = XLSX.utils.json_to_sheet(datosExportar);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Data_Batch");
    XLSX.writeFile(libro, "Analitica_SwiftDesing.xlsx");
  }

  const exportarAJson = () => {
    const dataStr = JSON.stringify(ventas, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Lote_Operaciones_Bruto.json';
    link.click();
  }

  const ingresoTotal = ventas.reduce((acc, curr) => acc + curr.monto, 0)
  const totalVentas = ventas.length
  const totalUsuarios = usuarios.length

  const ventasPorCiudad = ventas.reduce((acc, venta) => {
    const ciudad = venta.ubicacion?.ciudad || 'Otra';
    if (!acc[ciudad]) acc[ciudad] = 0;
    acc[ciudad] += venta.monto;
    return acc;
  }, {});

  const datosGraficoMarketing = Object.keys(ventasPorCiudad)
    .map(ciudad => ({ nombre: ciudad, total: ventasPorCiudad[ciudad] }))
    .sort((a, b) => b.total - a.total);

  const ciudadTop = datosGraficoMarketing.length > 0 ? datosGraficoMarketing[0].nombre : 'N/A';

  const ordenesPorEstado = ventas.reduce((acc, venta) => {
    const estado = venta.estado || 'Pendiente';
    if (!acc[estado]) acc[estado] = 0;
    acc[estado] += 1;
    return acc;
  }, {});

  const datosGraficoLogistica = Object.keys(ordenesPorEstado).map(estado => ({
    name: estado,
    value: ordenesPorEstado[estado]
  }));

  const COLORES_ESTADO = {
    'Completado': '#10b981',
    'Pendiente': '#f59e0b',
    'Cancelado': '#ef4444'
  };

  const ordenesFiltradas = useMemo(() => {
    return ventas.filter(venta => {
      const coincideBusqueda = (venta.cliente || '').toLowerCase().includes((busqueda || '').toLowerCase()) || 
                               (venta.id || '').toString().includes(busqueda);
      const coincideEstado = filtroEstado === 'Todos' || venta.estado === filtroEstado;
      return coincideBusqueda && coincideEstado;
    });
  }, [ventas, busqueda, filtroEstado]);

  const valorFiltradoTotal = ordenesFiltradas.reduce((acc, curr) => acc + curr.monto, 0);

  const TarjetaOrden = ({ venta }) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="p-4 border-b border-slate-100 flex justify-between items-start">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">#{venta.id}</span>
          <h4 className="font-semibold text-slate-800 mt-1 truncate max-w-[150px]" title={venta.cliente}>{venta.cliente}</h4>
        </div>
        <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
          venta.estado === 'Completado' ? 'bg-emerald-100 text-emerald-700' : 
          venta.estado === 'Cancelado' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {venta.estado}
        </span>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center text-xs text-slate-600">
          <MapPin size={14} className="text-slate-400 mr-2" />
          {venta.ubicacion?.ciudad || 'No especificada'}
        </div>
        <div className="flex items-center text-xs text-slate-600">
          <Package size={14} className="text-slate-400 mr-2" />
          Envío Estándar
        </div>
      </div>
      <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-between items-center">
        <span className="text-xs font-medium text-slate-500">Monto</span>
        <span className="text-sm font-bold text-indigo-700">${venta.monto.toFixed(2)}</span>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans relative overflow-hidden">
      
      {perfilAbierto && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="absolute inset-0" onClick={() => setPerfilAbierto(false)}></div>
          
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Configuración de Entorno</h2>
              <button onClick={() => setPerfilAbierto(false)} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
                  JV
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Josué Villegas</h3>
                  <p className="text-sm font-medium text-indigo-600 flex items-center">
                    <ShieldCheck size={14} className="mr-1" /> Administrador Global
                  </p>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                  <Database size={16} className="mr-2" /> Orígenes de Datos (Batch)
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mr-3">
                        <Store size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 text-sm">Conexión API Supabase</p>
                        <p className="text-xs text-emerald-600 font-medium">Conectado y Sincronizando</p>
                      </div>
                    </div>
                    <div className="relative inline-block w-10 h-6 rounded-full bg-emerald-500 cursor-pointer">
                      <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform transform translate-x-4"></span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                  <Bell size={16} className="mr-2" /> Umbrales Operativos
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-600 flex justify-between">
                      Límite de Órdenes Pendientes <span className="text-indigo-600">50</span>
                    </label>
                    <input type="range" min="10" max="100" defaultValue="50" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-2" />
                  </div>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={() => {
                  setPerfilAbierto(false)
                  setIsAuthenticated(false)
                  sessionStorage.removeItem("sesionTitania")
                  window.location.reload()
                }}
                className="w-full flex items-center justify-center px-4 py-3 text-sm font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              >
                <LogOut size={18} className="mr-2" /> Cerrar Sesión Segura
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 shadow-xl z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
          <Activity className="text-emerald-400 mr-3 animate-pulse" />
          <h1 className="text-lg font-bold text-white tracking-wider">SwiftDesing</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button 
            onClick={() => setVistaActiva('dashboard')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              vistaActiva === 'dashboard' ? 'bg-indigo-600/15 text-indigo-400 font-medium' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}>
            <LayoutDashboard size={20} className="mr-3" /> Analítica General
          </button>
          
          <button 
            onClick={() => setVistaActiva('inventario')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              vistaActiva === 'inventario' ? 'bg-indigo-600/15 text-indigo-400 font-medium' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}>
            <Archive size={20} className="mr-3" /> Catálogo & Inventario
          </button>

          <button 
            onClick={() => setVistaActiva('marketing')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              vistaActiva === 'marketing' ? 'bg-indigo-600/15 text-indigo-400 font-medium' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}>
            <Megaphone size={20} className="mr-3" /> Marketing & Ads
          </button>

          <button 
            onClick={() => setVistaActiva('ordenes')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              vistaActiva === 'ordenes' ? 'bg-indigo-600/15 text-indigo-400 font-medium' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}>
            <ShoppingCart size={20} className="mr-3" /> Centro Logacional
          </button>
          <button 
            onClick={() => setVistaActiva('usuarios')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              vistaActiva === 'usuarios' ? 'bg-indigo-600/15 text-indigo-400 font-medium' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}>
            <Users size={20} className="mr-3" /> Accesos y Roles
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 border-b border-slate-200 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {vistaActiva === 'dashboard' && 'Inteligencia de Negocio (Batch)'}
            {vistaActiva === 'inventario' && 'Rendimiento de Catálogo y Stock'}
            {vistaActiva === 'marketing' && 'Adquisición de Clientes y Conversión'}
            {vistaActiva === 'ordenes' && 'Centro de Operaciones Logísticas'}
            {vistaActiva === 'usuarios' && 'Gestión de Identidades'}
          </h2>
          <div className="flex items-center space-x-5">
            <div className="flex items-center px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              Supabase Conectado
            </div>
            
            <div className="flex items-center border-l pl-5 border-slate-200 cursor-pointer" onClick={() => setPerfilAbierto(true)}>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold shadow-md hover:shadow-lg transition-shadow">
                JV
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          
          {vistaActiva === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">Ingresos Consolidados</p>
                    <p className="text-3xl font-black text-slate-800 tracking-tight">${ingresoTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                  </div>
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp size={28} /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">Volumen de Lote</p>
                    <p className="text-3xl font-black text-slate-800 tracking-tight">{totalVentas}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl"><Package size={28} /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">Usuarios Activos</p>
                    <p className="text-3xl font-black text-slate-800 tracking-tight">{totalUsuarios}</p>
                  </div>
                  <div className="p-4 bg-amber-50 text-amber-600 rounded-xl"><Users size={28} /></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Evolución del Negocio (YTD)</h3>
                    <p className="text-sm text-slate-500 mt-1">Comparativa de ingresos brutos versus costos operativos mes a mes.</p>
                  </div>
                  <div className="flex space-x-4 text-sm font-medium">
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span> Ingresos</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> Costos</div>
                  </div>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={datosEvolucion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCostos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                      <RechartsTooltip 
                        contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        formatter={(value) => [`$${value}`, '']}
                      />
                      <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
                      <Area type="monotone" dataKey="costos" name="Costos" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCostos)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mb-8 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between overflow-hidden relative">
                <div className="absolute -right-10 -top-10 opacity-10">
                  <Cpu size={150} />
                </div>
                <div className="relative z-10 w-full">
                  <h3 className="flex items-center text-lg font-bold mb-3 text-indigo-300">
                    <Sparkles size={20} className="mr-2 text-indigo-400" /> Analítica Predictiva & Insights (Gemini AI)
                  </h3>
                  <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner">
                    <p className="text-sm text-slate-200 leading-relaxed font-medium">
                      {insightIA}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Mapa de Calor Comercial</h3>
                  <div className="h-64 w-full">
                    {loading ? (
                      <div className="h-full flex items-center justify-center text-slate-400">Procesando cubos de datos...</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosGraficoMarketing} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                          <RechartsTooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                            formatter={(value) => [`$${value.toFixed(2)}`, 'Volumen']}
                          />
                          <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={45} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Distribución de Estados</h3>
                  <div className="h-64 w-full">
                    {loading ? (
                      <div className="h-full flex items-center justify-center text-slate-400">Calculando...</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={datosGraficoLogistica}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            {datosGraficoLogistica.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORES_ESTADO[entry.name] || '#94a3b8'} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                            formatter={(value) => [value, 'Órdenes']}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '13px', fontWeight: 500}} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {vistaActiva === 'inventario' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div className={`rounded-xl p-6 shadow-sm flex items-center justify-between border ${productosEnRiesgo > 0 ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                  <div>
                    <h3 className="flex items-center text-lg font-bold mb-1">
                      {productosEnRiesgo > 0 ? <AlertCircle size={20} className="mr-2 text-red-600" /> : <CheckCircle2 size={20} className="mr-2 text-emerald-600" />}
                      Salud de Inventario
                    </h3>
                    <p className="text-sm font-medium opacity-80">
                      {productosEnRiesgo > 0 
                        ? `Alerta: Tienes ${productosEnRiesgo} producto(s) en riesgo inminente de quiebre de stock basado en el ritmo de ventas de la última semana.` 
                        : 'Tu catálogo físico tiene una cobertura superior a 7 días. El flujo logístico está optimizado.'}
                    </p>
                  </div>
                  <button className="hidden md:inline-flex items-center px-4 py-2 text-sm font-bold bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all text-slate-700">
                    <PackageSearch size={16} className="mr-2" /> Solicitar Reposición
                  </button>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Matriz de Rentabilidad (Volumen vs. Margen)</h3>
                    <p className="text-sm text-slate-500">Identifica rápidamente tus productos "Estrella" (esquina superior derecha: alto volumen y alto margen).</p>
                  </div>
                  <div className="h-80 w-full">
                    {loading ? (
                      <div className="h-full flex items-center justify-center text-slate-400">Procesando catálogo...</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis type="number" dataKey="volumen" name="Volumen (Ventas)" unit=" unds" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <YAxis type="number" dataKey="margen" name="Margen Bruto" unit="%" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <ZAxis type="number" dataKey="precio" range={[50, 400]} name="Precio Final" />
                          <RechartsTooltip 
                            cursor={{strokeDasharray: '3 3'}}
                            contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                            formatter={(value, name) => {
                              if (name === 'Margen Bruto') return [`${value}%`, name];
                              if (name === 'Precio Final') return [`$${value}`, name];
                              return [value, name];
                            }}
                            labelFormatter={() => ''} 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-xl">
                                    <p className="font-bold text-slate-800 text-sm mb-2">{data.nombre}</p>
                                    <p className="text-xs text-slate-600"><span className="font-semibold">Ventas:</span> {data.volumen} unds</p>
                                    <p className="text-xs text-slate-600"><span className="font-semibold">Margen:</span> {data.margen}%</p>
                                    <p className="text-xs text-slate-600"><span className="font-semibold">Precio Base:</span> ${data.precio}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Scatter name="Productos" data={datosMatrizRentabilidad} fill="#8b5cf6" fillOpacity={0.7} />
                        </ScatterChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Monitor de Riesgo y Cobertura de Stock</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                          <th className="px-6 py-4">Producto / SKU</th>
                          <th className="px-6 py-4 text-right">Precio Base</th>
                          <th className="px-6 py-4 text-right">Margen Neto</th>
                          <th className="px-6 py-4 text-center">Stock Actual</th>
                          <th className="px-6 py-4 text-center">Cobertura Est.</th>
                          <th className="px-6 py-4 text-center">Estado del Inventario</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-medium">Sincronizando inventario...</td></tr>
                        ) : productos.length === 0 ? (
                          <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-medium">No hay productos disponibles.</td></tr>
                        ) : (
                          productos.map((prod) => {
                            let estadoText = 'Stock Sano';
                            let estadoColor = 'bg-emerald-100 text-emerald-700';
                            
                            if (prod.stock >= 999) {
                              estadoText = 'Ilimitado (Digital)';
                              estadoColor = 'bg-slate-100 text-slate-600';
                            } else if (prod.stock === 0) {
                              estadoText = 'Agotado (Quiebre)';
                              estadoColor = 'bg-red-100 text-red-700 border border-red-200';
                            } else if (prod.coberturaDias <= 7) {
                              estadoText = 'Riesgo Crítico';
                              estadoColor = 'bg-orange-100 text-orange-700 border border-orange-200';
                            } else if (prod.coberturaDias <= 15) {
                              estadoText = 'Alerta Reposición';
                              estadoColor = 'bg-yellow-100 text-yellow-700';
                            }

                            return (
                              <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <p className="text-sm font-bold text-slate-800">{prod.nombre}</p>
                                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{prod.sku}</p>
                                </td>
                                <td className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">${prod.precio.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right">
                                  <span className={`text-sm font-bold ${prod.margenPorcentaje > 60 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                    {prod.margenPorcentaje}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-slate-700">
                                  {prod.stock >= 999 ? '∞' : prod.stock}
                                </td>
                                <td className="px-6 py-4 text-center text-sm text-slate-500 font-medium">
                                  {prod.stock >= 999 ? '-' : `${prod.coberturaDias} días`}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`inline-flex px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${estadoColor}`}>
                                    {estadoText}
                                  </span>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

             </div>
          )}

          {vistaActiva === 'marketing' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Costo Adq. Cliente (CAC)</p>
                  <div className="flex items-end space-x-2">
                    <p className="text-4xl font-black text-slate-800 tracking-tight">${kpisMarketing.cacPromedio.toFixed(2)}</p>
                    <span className="text-sm text-red-500 font-bold mb-1">+12%</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Promedio invertido en Marketing por cliente nuevo.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Customer Lifetime Value (CLV)</p>
                  <div className="flex items-end space-x-2">
                    <p className="text-4xl font-black text-slate-800 tracking-tight">${kpisMarketing.clvPromedio.toFixed(2)}</p>
                    <span className="text-sm text-emerald-500 font-bold mb-1">+5%</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Valor promedio generado por un cliente en su vida útil.</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl shadow-md border border-indigo-800 text-white">
                  <p className="text-sm font-semibold text-indigo-300 mb-1 uppercase tracking-wider">Ratio de Rentabilidad (CLV:CAC)</p>
                  <p className="text-4xl font-black tracking-tight">{kpisMarketing.ratio}</p>
                  <p className="text-xs text-indigo-200 mt-2 flex items-center">
                    <CheckCircle2 size={14} className="mr-1 text-emerald-400" /> Negocio altamente escalable (&gt; 3.0x).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                    <Filter size={20} className="mr-2 text-indigo-500" /> Embudo de Conversión (Sitio Web)
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">Mide exactamente en qué paso del proceso de compra los usuarios abandonan la tienda.</p>
                  
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datosEmbudo} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="etapa" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 500}} width={140} />
                        <RechartsTooltip 
                          cursor={{fill: '#f8fafc'}}
                          contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                          formatter={(value) => [value, 'Usuarios']}
                        />
                        <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} barSize={35}>
                          {datosEmbudo.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <Target size={20} className="mr-2 text-rose-500" /> Hallazgos y Acciones
                  </h3>
                  
                  <div className="flex-1 space-y-4">
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                      <h4 className="font-bold text-rose-800 text-sm mb-1">Caída Crítica en Checkout</h4>
                      <p className="text-xs text-rose-600">Solo el 41% de los que añaden al carrito inician el pago. Revisa costos de envío o habilita Apple/Google Pay.</p>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <h4 className="font-bold text-emerald-800 text-sm mb-1">Optimización de ROAS</h4>
                      <p className="text-xs text-emerald-700">La campaña "Meta Ads - Retargeting" tiene el mejor retorno. Aumentar el presupuesto diario en un 20%.</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <h4 className="font-bold text-slate-700 text-sm mb-1">Segmentación Ineficiente</h4>
                      <p className="text-xs text-slate-500">Pausar "Influencer IG - Promo". Su CAC ($50) supera el margen de ganancia de los productos promocionados.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800">Rendimiento Publicitario (Ad Spend & ROAS)</h3>
                  <p className="text-sm text-slate-500 mt-1">Comparativa de campañas activas para definir distribución de presupuesto.</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                        <th className="px-6 py-4">Campaña / Fuente</th>
                        <th className="px-6 py-4 text-right">Inversión (Gasto)</th>
                        <th className="px-6 py-4 text-center">Conversiones</th>
                        <th className="px-6 py-4 text-right">Costo x Adq. (CAC)</th>
                        <th className="px-6 py-4 text-right">Ingresos Atribuidos</th>
                        <th className="px-6 py-4 text-center">ROAS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-medium">Sincronizando Ad Accounts...</td></tr>
                      ) : campanas.length === 0 ? (
                        <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-medium">No hay campañas activas.</td></tr>
                      ) : (
                        campanas.map((campana) => {
                          const roasExcelente = campana.roas >= 3;
                          const roasMalo = campana.roas < 1.5;
                          
                          return (
                            <tr key={campana.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-800 text-sm">{campana.canal}</td>
                              <td className="px-6 py-4 text-right text-sm text-slate-600 font-medium">${campana.gasto.toFixed(2)}</td>
                              <td className="px-6 py-4 text-center text-sm font-bold text-indigo-600">{campana.conversiones}</td>
                              <td className="px-6 py-4 text-right text-sm text-slate-600 font-medium">
                                <span className={roasMalo ? 'text-red-500 font-bold' : ''}>${campana.cac.toFixed(2)}</span>
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-slate-700">${campana.ingresos.toFixed(2)}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-black tracking-wide ${
                                  roasExcelente ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                                  roasMalo ? 'bg-red-100 text-red-700 border border-red-200' : 
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {campana.roas.toFixed(1)}x
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {vistaActiva === 'ordenes' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 items-center justify-between">
               <div className="relative w-full lg:w-96">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <Search className="h-5 w-5 text-slate-400" />
                 </div>
                 <input
                   type="text"
                   value={busqueda}
                   onChange={(e) => setBusqueda(e.target.value)}
                   className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-sm"
                   placeholder="Filtrar lote por ID o Cliente..."
                 />
               </div>
               <div className="flex flex-wrap gap-3 items-center justify-center w-full lg:w-auto">
                 <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                   <button 
                     onClick={() => setVistaOperaciones('grid')}
                     className={`p-1.5 rounded-lg transition-colors ${vistaOperaciones === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                     title="Vista Cuadrícula">
                     <LayoutGrid size={18} />
                   </button>
                   <button 
                     onClick={() => setVistaOperaciones('kanban')}
                     className={`p-1.5 rounded-lg transition-colors ${vistaOperaciones === 'kanban' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                     title="Vista Kanban">
                     <Kanban size={18} />
                   </button>
                 </div>
                 <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                 <button onClick={exportarAExcel} className="inline-flex items-center px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                   <Download size={16} className="mr-2 text-emerald-600" /> Excel
                 </button>
                 <button onClick={exportarAJson} className="inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200">
                   <FileJson size={16} className="mr-2" /> Data Lake (JSON)
                 </button>
               </div>
             </div>

             {loading ? (
               <div className="text-center py-20 text-slate-400 font-medium">Sincronizando operaciones...</div>
             ) : (
               <>
                 {vistaOperaciones === 'grid' ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                     {ordenesFiltradas.length > 0 ? (
                       ordenesFiltradas.map(venta => <TarjetaOrden key={venta.id} venta={venta} />)
                     ) : (
                       <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">No hay órdenes que coincidan.</div>
                     )}
                   </div>
                 ) : (
                   <div className="flex gap-6 overflow-x-auto pb-4 items-start min-h-[60vh]">
                     {['Pendiente', 'Cancelado', 'Completado'].map(estado => {
                       const ordenesColumna = ordenesFiltradas.filter(o => o.estado === estado);
                       const coloresPilar = {
                         'Pendiente': 'border-t-amber-400 bg-amber-50/30',
                         'Cancelado': 'border-t-red-400 bg-red-50/30',
                         'Completado': 'border-t-emerald-400 bg-emerald-50/30'
                       };
                       return (
                         <div key={estado} className={`min-w-[320px] w-[320px] rounded-2xl bg-slate-100/50 border border-slate-200 p-4 border-t-4 ${coloresPilar[estado]}`}>
                           <div className="flex justify-between items-center mb-4">
                             <h4 className="font-bold text-slate-700 uppercase tracking-wide text-sm">{estado}</h4>
                             <span className="bg-white text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                               {ordenesColumna.length}
                             </span>
                           </div>
                           <div className="flex flex-col gap-4">
                             {ordenesColumna.map(venta => <TarjetaOrden key={venta.id} venta={venta} />)}
                             {ordenesColumna.length === 0 && (
                               <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400 text-sm font-medium">
                                 Lote vacío
                               </div>
                             )}
                           </div>
                         </div>
                       )
                     })}
                   </div>
                 )}
               </>
             )}
           </div>
          )}

          {vistaActiva === 'usuarios' && (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
               <h3 className="text-lg font-bold text-slate-800">Control de Accesos (Roles)</h3>
               <button onClick={cargarDatos} className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-all shadow-sm">
                 Actualizar Directorio
               </button>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                     <th className="px-6 py-4">Identidad</th>
                     <th className="px-6 py-4">Email Corporativo</th>
                     <th className="px-6 py-4">Nivel de Acceso</th>
                     <th className="px-6 py-4">Estatus</th>
                     <th className="px-6 py-4 text-right">Alta en Sistema</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {loading ? (
                     <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-medium">Validando identidades...</td></tr>
                   ) : usuarios.length === 0 ? (
                     <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No hay usuarios en la base de datos.</td></tr>
                   ) : (
                     usuarios.map((usuario) => (
                       <tr key={usuario.id} className="hover:bg-indigo-50/30 transition-colors">
                         <td className="px-6 py-4">
                           <div className="flex items-center">
                             <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 shadow-sm border border-indigo-200">
                               <UserIcon size={18} />
                             </div>
                             <span className="text-sm font-bold text-slate-800">{usuario.nombre}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-sm text-slate-600 font-medium">{usuario.email}</td>
                         <td className="px-6 py-4">
                           <div className="flex items-center text-sm font-bold text-slate-600">
                             {usuario.rol === 'admin' ? <ShieldCheck size={18} className="text-indigo-500 mr-2" /> : null}
                             <span className="capitalize">{usuario.rol}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <span className={`inline-flex px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                             usuario.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                           }`}>
                             {usuario.activo ? 'Activo' : 'Revocado'}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-sm text-slate-500 font-medium text-right">{usuario.fecha}</td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
           </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default App