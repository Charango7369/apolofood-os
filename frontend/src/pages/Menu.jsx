import { useState } from 'react'
import { useMenu } from '../hooks/useMenu'
import { useOfflineQueue } from '../hooks/useOfflineQueue'
import { toast } from 'sonner'

export default function Menu() {
  const { productos, cargando, error, restauranteId } = useMenu()
  const { online, pendientes, crearPedido } = useOfflineQueue()
  const [carrito, setCarrito] = useState([])
  const [cliente, setCliente] = useState('')
  const [enviando, setEnviando] = useState(false)

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.producto_id === producto.id)
      if (existe) return prev.map((p) => p.producto_id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p)
      return [...prev, { producto_id: producto.id, producto_nombre: producto.nombre, precio_unitario: producto.precio, cantidad: 1 }]
    })
    toast.success(`${producto.nombre} agregado`)
  }

  const total = carrito.reduce((acc, i) => acc + i.precio_unitario * i.cantidad, 0)

  const enviarPedido = async () => {
    if (!cliente.trim()) return toast.error('Ingresa tu nombre')
    if (carrito.length === 0) return toast.error('El carrito está vacío')
    setEnviando(true)
    try {
      await crearPedido({
        restaurante_id: restauranteId,
        cliente_nombre: cliente,
        detalles: carrito,
      })
      setCarrito([])
      setCliente('')
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return <div className="flex justify-center p-10 text-yellow-400">Cargando menú...</div>
  if (error) return <div className="p-6 text-red-400">Error: {error}</div>

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Estado de conexión */}
      <div className={`mb-4 px-3 py-2 rounded text-sm font-medium ${online ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
        {online ? '🟢 En línea' : '🟡 Offline'}{pendientes > 0 && ` · ${pendientes} pedido(s) pendiente(s) de sincronizar`}
      </div>

      <h1 className="text-2xl font-bold text-yellow-400 mb-6">🍽️ Menú</h1>

      {/* Productos */}
      <div className="grid gap-3 mb-6">
        {productos.map((p) => (
          <div key={p.id} className="flex justify-between items-center bg-gray-800 rounded-lg p-4">
            <div>
              <p className="font-semibold">{p.nombre}</p>
              {p.descripcion && <p className="text-sm text-gray-400">{p.descripcion}</p>}
              <p className="text-yellow-400 font-bold mt-1">Bs {p.precio.toFixed(2)}</p>
            </div>
            <button
              onClick={() => agregarAlCarrito(p)}
              className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold"
            >+</button>
          </div>
        ))}
      </div>

      {/* Carrito */}
      {carrito.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <h2 className="font-bold text-lg mb-3">🛒 Tu pedido</h2>
          {carrito.map((item) => (
            <div key={item.producto_id} className="flex justify-between text-sm py-1">
              <span>{item.cantidad}x {item.producto_nombre}</span>
              <span className="text-yellow-400">Bs {(item.precio_unitario * item.cantidad).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-gray-700 mt-3 pt-3 font-bold flex justify-between">
            <span>Total</span>
            <span className="text-yellow-400">Bs {total.toFixed(2)}</span>
          </div>
          <input
            className="mt-4 w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500"
            placeholder="Tu nombre"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />
          <button
            onClick={enviarPedido}
            disabled={enviando}
            className="mt-3 w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg"
          >
            {enviando ? 'Enviando...' : 'Hacer pedido'}
          </button>
        </div>
      )}
    </div>
  )
}
