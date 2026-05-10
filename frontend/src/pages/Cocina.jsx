import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'

export default function Cocina() {
  const { usuario } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header titulo="Cocina" />
      <main className="max-w-4xl mx-auto p-4">
        <div className="bg-gray-800 rounded-xl p-6 mt-4">
          <h2 className="text-xl font-bold text-yellow-400 mb-2">
            Cocina — {usuario.nombre}
          </h2>
          <p className="text-gray-500 text-sm">
            🚧 Pendiente: lista de pedidos pendientes con cambio de estado
          </p>
        </div>
      </main>
    </div>
  )
}