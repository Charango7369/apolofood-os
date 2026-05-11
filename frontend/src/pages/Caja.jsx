import { useState, useEffect, useMemo } from 'react'
import { menuAPI } from '../lib/api'
import { useOfflineQueue } from '../hooks/useOfflineQueue'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import Header from '../components/Header'

export default function Caja() {
  const { usuario } = useAuth()
  const { online, pendientes, sincronizando, crearPedido } = useOfflineQueue()

  const [productos, setProductos] = useState([])
  const [cargandoMenu, setCargandoMenu] = useState(true)
  const [errorMenu, setErrorMenu] = useState(null)

  const [carrito, setCarrito] = useState([])
  const [cliente, setCliente] = useState('')
  const [mesa, setMesa] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [filtro, setFiltro] = useState('')

  // Cargar menú al montar
  useEffect(() => {
    menuAPI.obtener()
      .then(setProductos)
      .catch((e) => setErrorMenu(e.message))
      .finally(() => setCargandoMenu(false))
  }, [])

  // Productos filtrados por búsqueda
  const productosFiltrados = useMemo(() => {
    if (!filtro.trim()) return productos
    const f = filtro.toLowerCase()
    return productos.filter((p) => p.nombre.toLowerCase().includes(f))
  }, [productos, filtro])

  // Total del carrito
  const total = useMemo(
    () => carrito.reduce((acc, i) => acc + i.precio_unitario * i.cantidad, 0),
    [carrito]
  )

  const cantidadTotal = carrito.reduce((acc, i) => acc + i.cantidad, 0)

  // Agregar/incrementar
  const agregar = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.producto_id === producto.id)
      if (existe) {
        return prev.map((p) =>
          p.producto_id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        )
      }
      return [...prev, {
        producto_id: producto.id,
        producto_nombre: producto.nombre,
        precio_unitario: producto.precio,
        cantidad: 1,
      }]
    })
  }

  // Decrementar/quitar
  const decrementar = (producto_id) => {
    setCarrito((prev) =>
      prev
        .map((p) => p.producto_id === producto_id ? { ...p, cantidad: p.cantidad - 1 } : p)
        .filter((p) => p.cantidad > 0)
    )
  }

  const cantidadEnCarrito = (productoId) => {
    return carrito.find((p) => p.producto_id === productoId)?.cantidad || 0
  }

  const limpiarCarrito = () => {
    if (carrito.length === 0) return
    if (confirm('¿Limpiar el carrito?')) {
      setCarrito([])
      setCliente('')
      setMesa('')
    }
  }

  const enviar = async () => {
    if (!cliente.trim()) {
      toast.error('Ingresa el nombre del cliente')
      return
    }
    if (carrito.length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    setEnviando(true)
    try {
      await crearPedido({
        cliente_nombre: cliente.trim(),
        mesa: mesa.trim() || null,
        detalles: carrito,
      })
      // Limpiar después de éxito
      setCarrito([])
      setCliente('')
      setMesa('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-32">
      <Header titulo="Caja" />

      {/* Estado de conexión */}
      <div className={`px-4 py-2 text-sm font-medium ${
        online ? 'bg-green-900/40 text-green-300' : 'bg-yellow-900/60 text-yellow-200'
      }`}>
        {online ? '🟢 En línea' : '🟡 Sin internet — los pedidos se guardarán en este celular'}
        {pendientes > 0 && (
          <span className="ml-2">
            · {pendientes} pendiente{pendientes > 1 ? 's' : ''} de sincronizar
            {sincronizando && ' (enviando...)'}
          </span>
        )}
      </div>

      <main className="max-w-2xl mx-auto p-4">
        {/* Buscador */}
        <input
          type="text"
          placeholder="Buscar producto..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none mb-4"
        />

        {/* Lista de productos */}
        {cargandoMenu && (
          <p className="text-center text-gray-400 py-8">Cargando menú...</p>
        )}
        {errorMenu && (
          <p className="text-center text-red-400 py-8">{errorMenu}</p>
        )}
        {!cargandoMenu && productosFiltrados.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            {filtro ? 'Sin resultados' : 'Sin productos en el menú'}
          </p>
        )}

        <div className="space-y-2">
          {productosFiltrados.map((p) => {
            const cant = cantidadEnCarrito(p.id)
            return (
              <div key={p.id} className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.nombre}</p>
                  {p.descripcion && (
                    <p className="text-xs text-gray-400 truncate">{p.descripcion}</p>
                  )}
                  <p className="text-yellow-400 font-bold">Bs {p.precio.toFixed(2)}</p>
                </div>
                {cant === 0 ? (
                  <button
                    onClick={() => agregar(p)}
                    className="bg-red-700 hover:bg-red-600 text-white font-bold w-12 h-12 rounded-lg text-2xl flex items-center justify-center"
                    aria-label={`Agregar ${p.nombre}`}
                  >
                    +
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-gray-700 rounded-lg">
                    <button
                      onClick={() => decrementar(p.id)}
                      className="text-white font-bold w-10 h-10 rounded-l-lg hover:bg-gray-600 text-xl"
                      aria-label="Quitar uno"
                    >
                      −
                    </button>
                    <span className="font-bold w-8 text-center">{cant}</span>
                    <button
                      onClick={() => agregar(p)}
                      className="text-white font-bold w-10 h-10 rounded-r-lg hover:bg-gray-600 text-xl"
                      aria-label="Agregar uno más"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>

      {/* Carrito flotante (sticky abajo) */}
      {carrito.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t-2 border-yellow-400 shadow-2xl">
          <div className="max-w-2xl mx-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold">
                🛒 {cantidadTotal} ítem{cantidadTotal > 1 ? 's' : ''} ·
                <span className="text-yellow-400 ml-1">Bs {total.toFixed(2)}</span>
              </p>
              <button
                onClick={limpiarCarrito}
                className="text-xs text-gray-400 underline"
              >
                Limpiar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <input
                type="text"
                placeholder="Nombre cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                disabled={enviando}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 disabled:opacity-50 text-sm"
              />
              <input
                type="text"
                placeholder="Mesa (opcional)"
                value={mesa}
                onChange={(e) => setMesa(e.target.value)}
                disabled={enviando}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 disabled:opacity-50 text-sm"
              />
            </div>

            <button
              onClick={enviar}
              disabled={enviando}
              className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-lg"
            >
              {enviando ? 'Enviando...' : `Crear pedido · Bs ${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}