import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { menuAPI } from '../lib/api'
import { toast } from 'sonner'
import Header from '../components/Header'

export default function AdminMenu() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [actualizandoId, setActualizandoId] = useState(null)

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')

  const cargar = useCallback(async () => {
    try {
      const data = await menuAPI.obtener()
      setProductos(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const limpiarForm = () => {
    setNombre('')
    setDescripcion('')
    setPrecio('')
    setMostrarForm(false)
  }

  const crear = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return toast.error('Nombre obligatorio')
    const precioNum = parseFloat(precio)
    if (isNaN(precioNum) || precioNum < 0) return toast.error('Precio inválido')

    setEnviando(true)
    try {
      await menuAPI.crearProducto({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        precio: precioNum,
        disponible: true,
      })
      toast.success('Producto creado')
      limpiarForm()
      await cargar()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const toggleDisponible = async (producto) => {
    setActualizandoId(producto.id)
    try {
      const actualizado = await menuAPI.actualizarProducto(producto.id, {
        disponible: !producto.disponible,
      })
      setProductos((prev) => prev.map((p) => p.id === producto.id ? actualizado : p))
      toast.success(actualizado.disponible ? 'Producto disponible' : 'Producto oculto')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActualizandoId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header titulo="Menú" />

      <main className="max-w-2xl mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <Link to="/admin" className="text-sm text-gray-400 hover:text-white">← Volver</Link>
          {!mostrarForm && (
            <button
              onClick={() => setMostrarForm(true)}
              className="bg-red-700 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-sm"
            >
              + Nuevo producto
            </button>
          )}
        </div>

        {mostrarForm && (
          <form onSubmit={crear} className="bg-gray-800 rounded-xl p-4 mb-6 space-y-3">
            <h3 className="font-bold text-yellow-400">Nuevo producto</h3>

            <input
              type="text"
              placeholder="Nombre del producto"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={enviando}
              autoFocus
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 disabled:opacity-50"
            />

            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={enviando}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 disabled:opacity-50"
            />

            <div className="flex items-center gap-2">
              <span className="text-gray-400">Bs</span>
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="0.00"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                disabled={enviando}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 disabled:opacity-50"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg"
              >
                {enviando ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={limpiarForm}
                disabled={enviando}
                className="px-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {cargando && <p className="text-center text-gray-400 py-8">Cargando...</p>}

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 mb-4">
            {error}
          </div>
        )}

        {!cargando && productos.length === 0 && !mostrarForm && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-400">Aún no tienes productos en el menú</p>
            <button
              onClick={() => setMostrarForm(true)}
              className="mt-4 text-yellow-400 underline text-sm"
            >
              Crear el primero
            </button>
          </div>
        )}

        <div className="space-y-2">
          {productos.map((p) => {
            const procesando = actualizandoId === p.id
            return (
              <div
                key={p.id}
                className={`bg-gray-800 rounded-lg p-3 flex items-center gap-3 transition-opacity ${
                  !p.disponible ? 'opacity-50' : ''
                } ${procesando ? 'opacity-30' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate flex items-center gap-2">
                    {p.nombre}
                    {!p.disponible && (
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                        oculto
                      </span>
                    )}
                  </p>
                  {p.descripcion && (
                    <p className="text-xs text-gray-400 truncate">{p.descripcion}</p>
                  )}
                </div>
                <p className="text-yellow-400 font-bold whitespace-nowrap">
                  Bs {p.precio.toFixed(2)}
                </p>
                <button
                  onClick={() => toggleDisponible(p)}
                  disabled={procesando}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                    p.disponible
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-green-800 hover:bg-green-700 text-green-200'
                  }`}
                >
                  {p.disponible ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}