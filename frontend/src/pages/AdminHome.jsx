import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'

const SECCIONES = [
  {
    path: '/admin/pedidos',
    titulo: 'Pedidos del día',
    descripcion: 'Ver y gestionar todos los pedidos',
    emoji: '📋',
    color: 'bg-blue-900/40 hover:bg-blue-900/60 border-blue-700',
  },
  {
    path: '/admin/menu',
    titulo: 'Menú',
    descripcion: 'Productos y precios',
    emoji: '🍽️',
    color: 'bg-yellow-900/40 hover:bg-yellow-900/60 border-yellow-700',
  },
  {
    path: '/admin/reportes',
    titulo: 'Reportes',
    descripcion: 'Resumen del día',
    emoji: '📊',
    color: 'bg-green-900/40 hover:bg-green-900/60 border-green-700',
  },
  {
    path: '/admin/usuarios',
    titulo: 'Usuarios',
    descripcion: 'Cajeros y cocina',
    emoji: '👥',
    color: 'bg-purple-900/40 hover:bg-purple-900/60 border-purple-700',
  },
]


export default function AdminHome() {
  const { usuario } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header titulo="Admin" />

      <main className="max-w-2xl mx-auto p-4">
        <div className="bg-gray-800/60 rounded-xl p-4 mb-6">
          <h2 className="text-lg font-bold text-yellow-400">
            ¡Bienvenido, {usuario.nombre}!
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Selecciona una sección para administrar
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {SECCIONES.map((s) => (
            <Link
              key={s.path}
              to={s.path}
              className={`${s.color} border-2 rounded-xl p-4 transition-colors active:scale-95`}
            >
              <div className="text-4xl mb-2">{s.emoji}</div>
              <p className="font-bold text-base">{s.titulo}</p>
              <p className="text-xs text-gray-400 mt-1">{s.descripcion}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}