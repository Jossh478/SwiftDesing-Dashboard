import { useState } from 'react'
import { Mail, Lock, LogIn, Activity, Loader2 } from 'lucide-react'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {

        console.log("Ingreso concedido a:", data.usuario.nombre);
        sessionStorage.setItem("sesionTitania", JSON.stringify(data.usuario));
        onLogin();
      } else {
        setError(data.message); 
      }
    } catch (err) {
      setError('Error de conexión con el servidor. Verifica el backend.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div 
      style={{ backgroundImage: "url('/img/background_black.jpg')" }} 
      className="min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center p-4 sm:p-8 font-sans"
    >
      <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-6xl min-h-[600px] flex flex-col md:flex-row rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden">
        
        <div className="w-full md:w-[450px] flex flex-col justify-center relative backdrop-blur-2xl bg-black/60 p-10 lg:p-12 border-r border-white/10">
          
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/5 mb-6 shadow-inner border border-white/10">
              <Activity className="text-emerald-400 w-7 h-7" />
            </div>
            <h2 className="text-3xl font-light tracking-widest uppercase text-white">
              Swift<span className="font-bold">Desing</span>
            </h2>
            <p className="text-gray-400 mt-2 text-sm font-light tracking-wide">
              Panel de Analítica (Batch)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-400 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl text-white bg-white/5 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white/10 transition-all placeholder-gray-500 font-light text-sm"
                  placeholder="admin@swiftdesing.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-400 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl text-white bg-white/5 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white/10 transition-all placeholder-gray-500 font-light text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-200 bg-red-900/40 p-3 rounded-lg border border-red-500/30 text-center backdrop-blur-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none transition-all mt-4 tracking-widest uppercase disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5 mr-3" />
              )}
              {loading ? 'Validando...' : 'Ingresar'}
            </button>
          </form>

          <div className="absolute bottom-10 left-12 flex space-x-2 items-center">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] text-gray-400 tracking-widest uppercase">Sistema Operativo</span>
          </div>
        </div>

        <div className="hidden md:flex flex-1 flex-col justify-center items-center p-12 relative bg-black/10">
          
          <div className="absolute top-10 right-10 flex space-x-8 text-[11px] tracking-[0.2em] text-white/70 font-semibold uppercase">
             <span className="hover:text-white cursor-pointer transition-colors">Analítica</span>
             <span className="hover:text-white cursor-pointer transition-colors">Logística</span>
             <span className="hover:text-white cursor-pointer transition-colors">Reportes</span>
          </div>

          <div className="relative z-10 w-full px-12 mt-20">
            <h1 className="text-7xl lg:text-9xl font-black text-white/90 tracking-tighter leading-none mix-blend-overlay">
              SWIFT
            </h1>
            <h1 className="text-7xl lg:text-9xl font-light text-white/90 tracking-widest leading-none mix-blend-overlay mt-2">
              DESING
            </h1>
          </div>
          
        </div>

      </div>
    </div>
  )
}