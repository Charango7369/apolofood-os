import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { reportesAPI } from '../lib/api'
import { toast } from 'sonner'
import Header from '../components/Header'

export default function AdminReportes() {
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await reportesAPI.resumen()
      setResumen(data)
      setUltimaActualizacion(new Date().toLocaleTimeString('es-BO'))
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
    const t = setInterval(cargar, 30000)
    return () => clearInterval(t)
  }, [cargar])

  const ticketPromedio = resumen && resumen.total_pedidos > 0
    ? resumen.ingresos / resumen.total_pedidos
    : 0

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header titulo="Reportes" />

      <main className="max-w-2xl mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <Link to="/admin" className="text-sm text-gray-400 hover:text-white">← Volver</Link>
          <button
            onClick={cargar}
            disabled={cargando}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg disabled:opacity-50"
          >
            {cargando ? '...' : '↻ Actualizar'}
          </button>
        </div>

        {ultimaActualizacion && (
          <p className="text-xs text-gray-500 mb-4">
            Última actualización: {ultimaActualizacion} · auto-refresca cada 30s
          </p>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 mb-4">
            {error}
          </div>
        )}

        {resumen && (
          <>
            <div className="bg-gray-800/60 rounded-xl p-4 mb-4 text-center">
              <p className="text-sm text-gray-400">
                {new Date(resumen.fecha + 'T12:00:00').toLocaleDateString('es-BO', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-5 text-center">
                <p className="text-5xl font-bold text-white">{resumen.total_pedidos}</p>
                <p className="text-blue-200 text-sm mt-2">Pedidos</p>
              </div>
              <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-5 text-center">
                <p className="text-3xl font-bold text-yellow-300">
                  Bs {resumen.ingresos.toFixed(2)}
                </p>
                <p className="text-yellow-200 text-sm mt-2">Ingresos</p>
              </div>
            </div>

            <div className="bg-gray-800/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                Bs {ticketPromedio.toFixed(2)}
              </p>
              <p className="text-gray-400 text-sm mt-1">Ticket promedio</p>
            </div>

            <p className="text-xs text-gray-500 text-center mt-6">
              Los pedidos cancelados no se cuentan
            </p>
          </>
        )}

        {cargando && !resumen && (
          <p className="text-center text-yellow-400 py-8">Cargando reporte...</p>
        )}
      </main>
    </div>
  )
}