import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'

export default function Caja() {
  const { usuario } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header titulo="Caja" />
      <main className="max-w-4xl mx-auto p-4">
        <div className="bg-gray-800 rounded-xl p-6 mt-4">
          <h2 className="text-xl font-bold text-yellow-400 mb-2">
            Caja — {usuario.nombre}
          </h2>
          <p className="text-gray-500 text-sm">
            🚧 Pendiente: menú con carrito + crear pedidos (con offline)
          </p>
        </div>
      </main>
    </div>
  )
}