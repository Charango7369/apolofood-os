import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'

export default function AdminHome() {
  const { usuario } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header titulo="Panel Admin" />
      <main className="max-w-4xl mx-auto p-4">
        <div className="bg-gray-800 rounded-xl p-6 mt-4">
          <h2 className="text-xl font-bold text-yellow-400 mb-2">
            ¡Bienvenido, {usuario.nombre}!
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Restaurante: <span className="text-white">{usuario.restaurante_id}</span>
          </p>
          <p className="text-gray-500 text-sm">
            🚧 Pendiente: tabs de Menú · Pedidos · Reportes · Usuarios
          </p>
        </div>
      </main>
    </div>
  )
}