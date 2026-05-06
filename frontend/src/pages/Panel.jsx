import { useState, useEffect } from 'react'
import { pedidosAPI } from '../lib/api'
import { toast } from 'sonner'

const RESTAURANTE_ID = 'rest-demo-001'
const ESTADOS = ['pendiente', 'confirmado', 'en_preparacion', 'listo', 'entregado', 'cancelado']
const COLORES = {
  pendiente: 'bg-yellow-800 text-yellow-200',
  confirmado: 'bg-blue-800 text-blue-200',
  en_preparacion: 'bg-orange-800 text-orange-200',
  listo: 'bg-green-800 text-green-200',
  entregado: 'bg-gray-700 text-gray-300',
  cancelado: 'bg-red-900 text-red-300',
}

export default function Panel() {
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargar = () => {
    pedidosAPI.listar(RESTAURANTE_ID)
      .then(setPedidos)
      .catch((e) => toast.error(e.message))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar(); const t = setInterval(cargar, 15000); return () => clearInterval(t) }, [])

  const cambiarEstado = async (id, estado) => {
    try {
      const actualizado = await pedidosAPI.cambiarEstado(id, estado)
      setPedidos((prev) => prev.map((p) => p.id === id ? actualizado : p))
      toast.success(`Estado actualizado: ${estado}`)
    } catch (e) { toast.error(e.message) }
  }

  if (cargando) return <div className="p-10 text-center text-yellow-400">Cargando pedidos...</div>

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-yellow-400">📋 Panel del Restaurante</h1>
        <button onClick={cargar} className="text-sm text-gray-400 hover:text-white border border-gray-600 px-3 py-1 rounded">↻ Actualizar</button>
      </div>

      {pedidos.length === 0
        ? <p className="text-gray-500 text-center py-10">No hay pedidos aún</p>
        : pedidos.map((p) => (
          <div key={p.id} className="bg-gray-800 rounded-lg p-4 mb-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold">{p.cliente_nombre} {p.mesa && `· Mesa ${p.mesa}`}</p>
                <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleString('es-BO')}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded font-medium ${COLORES[p.estado]}`}>{p.estado}</span>
            </div>

            <div className="text-sm text-gray-300 mb-3">
              {p.detalles?.map((d) => (
                <div key={d.id} className="flex justify-between">
                  <span>{d.cantidad}x {d.producto_nombre}</span>
                  <span>Bs {d.subtotal.toFixed(2)}</span>
                </div>
              ))}
              <div className="font-bold text-yellow-400 mt-1 flex justify-between">
                <span>Total</span><span>Bs {p.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {ESTADOS.filter((e) => e !== p.estado).map((e) => (
                <button key={e} onClick={() => cambiarEstado(p.id, e)}
                  className="text-xs border border-gray-600 px-2 py-1 rounded hover:bg-gray-700">
                  → {e}
                </button>
              ))}
            </div>
          </div>
        ))
      }
    </div>
  )
}
