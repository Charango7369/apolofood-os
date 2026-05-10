import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Envuelve rutas privadas. Si no hay sesión → redirige a /login.
 * Si se especifica `roles`, valida que el usuario tenga uno de ellos.
 *
 * Uso:
 *   <ProtectedRoute><MiPagina /></ProtectedRoute>
 *   <ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>
 */
export default function ProtectedRoute({ children, roles = null }) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-yellow-400">
        Cargando...
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(usuario.rol)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-6 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-red-400 mb-2">Acceso denegado</h1>
        <p className="text-gray-400">
          Tu rol ({usuario.rol}) no tiene permiso para esta página.
        </p>
      </div>
    )
  }

  return children
}