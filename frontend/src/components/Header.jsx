import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'

const ROL_LABELS = {
  superadmin: 'Superadmin',
  admin: 'Administrador',
  cajero: 'Cajero',
  cocina: 'Cocina',
}

const ROL_COLORS = {
  superadmin: 'bg-purple-900 text-purple-200',
  admin: 'bg-blue-900 text-blue-200',
  cajero: 'bg-green-900 text-green-200',
  cocina: 'bg-orange-900 text-orange-200',
}


export default function Header({ titulo }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Sesión cerrada')
      navigate('/login')
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Izquierda: logo + título */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl">🍽️</span>
          <div className="min-w-0">
            <p className="font-bold text-yellow-400 leading-tight truncate">
              {titulo || 'ApoloFoodOS'}
            </p>
            {usuario && (
              <p className="text-xs text-gray-500 truncate">
                {usuario.nombre}
              </p>
            )}
          </div>
        </div>

        {/* Derecha: badge rol + menú */}
        <div className="flex items-center gap-3">
          {usuario && (
            <span className={`text-xs px-2 py-1 rounded font-medium hidden sm:inline ${ROL_COLORS[usuario.rol]}`}>
              {ROL_LABELS[usuario.rol]}
            </span>
          )}
          <div className="relative">
            <button
              onClick={() => setMenuAbierto((v) => !v)}
              className="text-gray-300 hover:text-white p-2"
              aria-label="Menú"
            >
              ⋮
            </button>
            {menuAbierto && (
              <>
                {/* Backdrop para cerrar al tocar fuera */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuAbierto(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm text-white font-medium truncate">
                      {usuario?.nombre}
                    </p>
                    <p className="text-xs text-gray-400">
                      {ROL_LABELS[usuario?.rol]}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-gray-700 rounded-b-lg"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}