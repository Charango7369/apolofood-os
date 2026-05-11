import { useState, useEffect, useCallback, useMemo } from 'react'
import { pedidosAPI } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import Header from '../components/Header'

// Solo estos estados nos interesan en cocina
const ESTADOS_VISIBLES = ['pendiente', 'confirmado', 'en_preparacion']

const ESTADO_COLORS = {
  pendiente: 'bg-yellow-900/40 border-yellow-600/50',
  confirmado: 'bg-blue-900/40 border-blue-600/50',
  en_preparacion: 'bg-orange-900/40 border-orange-500/50',
}

const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_preparacion: 'Preparando',
}


function tiempoTranscurrido(creadoEn) {
  const ahora = Date.now()
  const creado = new Date(creadoEn).getTime()
  const minutos = Math.floor((ahora - creado) / 60000)
  if (minutos < 1) return 'Recién'
  if (minutos < 60) return `Hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  return `Hace ${horas} h ${minutos % 60} min`
}


export default function Cocina() {
  const { usuario } = useAuth()
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [actualizandoId, setActualizandoId] = useState(null)
  const [, forceUpdate] = useState(0)

  // Cargar pedidos
  const cargar = useCallback(async () => {
    try {
      const data = await pedidosAPI.listar()
      setPedidos(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [])

  // Cargar al montar y cada 15s
  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 15000)
    return () => clearInterval(interval)
  }, [cargar])

  // Tick cada 30s para refrescar el "hace X min"
  useEffect(() => {
    const t = setInterval(() => forceUpdate((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  // Filtrar solo los que cocina debe ver
  const pedidosVisibles = useMemo(() => {
    return pedidos
      .filter((p) => ESTADOS_VISIBLES.includes(p.estado))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // más viejos primero
  }, [pedidos])

  // Cambiar estado del pedido
  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    setActualizandoId(pedidoId)
    try {
      const actualizado = await pedidosAPI.cambiarEstado(pedidoId, nuevoEstado)
      // Actualizar en la lista local sin re-fetch
      setPedidos((prev) => prev.map((p) => p.id === pedidoId ? actualizado : p))

      const mensajes = {
        en_preparacion: 'Pedido en preparación 🍳',
        listo: 'Pedido listo para entrega ✅',
      }
      toast.success(mensajes[nuevoEstado] || 'Estado actualizado')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setActualizandoId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header titulo="Cocina" />

      {/* Banner conteo */}
      <div className="bg-orange-900/30 border-b border-orange-700/30 px-4 py-2 text-sm">
        🍳 <span className="font-bold">{pedidosVisibles.length}</span> pedido{pedidosVisibles.length !== 1 ? 's' : ''} activo{pedidosVisibles.length !== 1 ? 's' : ''}
        <span className="text-gray-400 ml-2">· se actualiza cada 15s</span>
      </div>

      <main className="max-w-2xl mx-auto p-4">
        {cargando && (
          <p className="text-center text-gray-400 py-8">Cargando pedidos...</p>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300">
            Error: {error}
            <button onClick={cargar} className="block mt-2 text-sm underline">Reintentar</button>
          </div>
        )}

        {!cargando && pedidosVisibles.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-3">🎉</div>
            <p className="text-gray-400">Sin pedidos pendientes</p>
            <p className="text-gray-600 text-sm mt-1">
              Tomate un descanso, María
            </p>
          </div>
        )}

        <div className="space-y-3">
          {pedidosVisibles.map((p) => {
            const procesando = actualizandoId === p.id
            return (
              <div
                key={p.id}
                className={`rounded-xl border-2 p-4 transition-opacity ${ESTADO_COLORS[p.estado]} ${procesando ? 'opacity-50' : ''}`}
              >
                {/* Cabecera del pedido */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-2xl font-bold">
                      {p.mesa ? `Mesa ${p.mesa}` : p.cliente_nombre}
                    </p>
                    {p.mesa && (
                      <p className="text-sm text-gray-400">{p.cliente_nombre}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 rounded bg-black/30 font-medium">
                      {ESTADO_LABELS[p.estado]}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {tiempoTranscurrido(p.created_at)}
                    </p>
                  </div>
                </div>

                {/* Detalles */}
                <div className="bg-black/30 rounded-lg p-3 mb-3 space-y-1">
                  {p.detalles?.map((d) => (
                    <div key={d.id} className="flex justify-between text-base">
                      <span>
                        <span className="font-bold text-yellow-400">{d.cantidad}x</span>{' '}
                        {d.producto_nombre}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Notas si las hay */}
                {p.notas && (
                  <div className="bg-yellow-900/20 border border-yellow-700/30 rounded p-2 mb-3 text-sm">
                    📝 {p.notas}
                  </div>
                )}

                {/* Botón de acción */}
                {(p.estado === 'pendiente' || p.estado === 'confirmado') && (
                  <button
                    onClick={() => cambiarEstado(p.id, 'en_preparacion')}
                    disabled={procesando}
                    className="w-full bg-orange-700 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg text-lg"
                  >
                    🍳 Comenzar a preparar
                  </button>
                )}

                {p.estado === 'en_preparacion' && (
                  <button
                    onClick={() => cambiarEstado(p.id, 'listo')}
                    disabled={procesando}
                    className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg text-lg"
                  >
                    ✅ Marcar listo
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}