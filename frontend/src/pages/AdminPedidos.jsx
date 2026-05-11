import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { pedidosAPI } from '../lib/api'
import { toast } from 'sonner'
import Header from '../components/Header'

const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_preparacion: 'Preparando',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

const ESTADO_COLORS = {
  pendiente: 'bg-yellow-900/40 border-yellow-700/50 text-yellow-200',
  confirmado: 'bg-blue-900/40 border-blue-700/50 text-blue-200',
  en_preparacion: 'bg-orange-900/40 border-orange-600/50 text-orange-200',
  listo: 'bg-green-900/40 border-green-700/50 text-green-200',
  entregado: 'bg-gray-800 border-gray-700 text-gray-400',
  cancelado: 'bg-red-900/40 border-red-700/50 text-red-300',
}

const FILTROS = [
  { key: 'activos', label: 'Activos', estados: ['pendiente', 'confirmado', 'en_preparacion', 'listo'] },
  { key: 'todos', label: 'Todos', estados: null },
  { key: 'entregados', label: 'Entregados', estados: ['entregado'] },
  { key: 'cancelados', label: 'Cancelados', estados: ['cancelado'] },
]


export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('activos')
  const [actualizandoId, setActualizandoId] = useState(null)

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

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 20000)
    return () => clearInterval(interval)
  }, [cargar])

  const pedidosFiltrados = useMemo(() => {
    const f = FILTROS.find((x) => x.key === filtro)
    if (!f.estados) return pedidos
    return pedidos.filter((p) => f.estados.includes(p.estado))
  }, [pedidos, filtro])

  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    if (nuevoEstado === 'cancelado') {
      if (!confirm('¿Cancelar este pedido? No se podrá deshacer.')) return
    }
    setActualizandoId(pedidoId)
    try {
      const actualizado = await pedidosAPI.cambiarEstado(pedidoId, nuevoEstado)
      setPedidos((prev) => prev.map((p) => p.id === pedidoId ? actualizado : p))
      toast.success(`Estado: ${ESTADO_LABELS[nuevoEstado]}`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setActualizandoId(null)
    }
  }

  // Acciones disponibles según estado actual (admin puede todo, pero respetando flujo lógico)
  const accionesDisponibles = (pedido) => {
    const acciones = []
    const e = pedido.estado

    if (e === 'pendiente') {
      acciones.push({ label: 'Confirmar', estado: 'confirmado', color: 'bg-blue-700' })
      acciones.push({ label: 'Cancelar', estado: 'cancelado', color: 'bg-red-700' })
    } else if (e === 'confirmado') {
      acciones.push({ label: 'En preparación', estado: 'en_preparacion', color: 'bg-orange-700' })
      acciones.push({ label: 'Cancelar', estado: 'cancelado', color: 'bg-red-700' })
    } else if (e === 'en_preparacion') {
      acciones.push({ label: 'Marcar listo', estado: 'listo', color: 'bg-green-700' })
      acciones.push({ label: 'Cancelar', estado: 'cancelado', color: 'bg-red-700' })
    } else if (e === 'listo') {
      acciones.push({ label: 'Entregar', estado: 'entregado', color: 'bg-green-700' })
      acciones.push({ label: 'Cancelar', estado: 'cancelado', color: 'bg-red-700' })
    }
    // entregado y cancelado: sin acciones (no se pueden modificar)
    return acciones
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header titulo="Pedidos" />

      <main className="max-w-2xl mx-auto p-4">
        <Link to="/admin" className="text-sm text-gray-400 hover:text-white inline-block mb-4">
          ← Volver
        </Link>

        {/* Filtros */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {FILTROS.map((f) => {
            const count = f.estados
              ? pedidos.filter((p) => f.estados.includes(p.estado)).length
              : pedidos.length
            return (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium ${
                  filtro === f.key
                    ? 'bg-yellow-400 text-gray-900'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {f.label} ({count})
              </button>
            )
          })}
        </div>

        {cargando && (
          <p className="text-center text-gray-400 py-8">Cargando pedidos...</p>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 mb-4">
            {error}
          </div>
        )}

        {!cargando && pedidosFiltrados.length === 0 && (
          <p className="text-center text-gray-500 py-12">Sin pedidos en esta categoría</p>
        )}

        <div className="space-y-3">
          {pedidosFiltrados.map((p) => {
            const procesando = actualizandoId === p.id
            const acciones = accionesDisponibles(p)
            return (
              <div
                key={p.id}
                className={`rounded-xl border-2 p-4 transition-opacity ${ESTADO_COLORS[p.estado]} ${procesando ? 'opacity-50' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-lg">
                      {p.cliente_nombre}
                      {p.mesa && <span className="text-sm font-normal text-gray-400 ml-2">· Mesa {p.mesa}</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(p.created_at).toLocaleString('es-BO')}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-black/40 font-medium">
                    {ESTADO_LABELS[p.estado]}
                  </span>
                </div>

                <div className="bg-black/30 rounded p-2 mb-3 text-sm">
                  {p.detalles?.map((d) => (
                    <div key={d.id} className="flex justify-between">
                      <span>{d.cantidad}x {d.producto_nombre}</span>
                      <span className="text-gray-400">Bs {d.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-yellow-400">Bs {p.total.toFixed(2)}</span>
                  </div>
                </div>

                {p.notas && (
                  <p className="text-xs text-gray-400 mb-2">📝 {p.notas}</p>
                )}

                {acciones.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {acciones.map((a) => (
                      <button
                        key={a.estado}
                        onClick={() => cambiarEstado(p.id, a.estado)}
                        disabled={procesando}
                        className={`${a.color} hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}