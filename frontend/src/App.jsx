import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminHome from './pages/AdminHome'
import Caja from './pages/Caja'
import Cocina from './pages/Cocina'

/**
 * Componente raíz que decide a dónde ir según el estado de auth.
 */
function RootRedirect() {
  const { usuario, cargando } = useAuth()

  if (cargando) return null

  if (!usuario) return <Navigate to="/login" replace />

  if (usuario.rol === 'admin' || usuario.rol === 'superadmin') {
    return <Navigate to="/admin" replace />
  }
  if (usuario.rol === 'cajero') {
    return <Navigate to="/caja" replace />
  }
  if (usuario.rol === 'cocina') {
    return <Navigate to="/cocina" replace />
  }
  return <Navigate to="/login" replace />
}


export default function App() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-center" />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin', 'superadmin']}>
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caja"
          element={
            <ProtectedRoute roles={['cajero', 'admin']}>
              <Caja />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cocina"
          element={
            <ProtectedRoute roles={['cocina', 'admin']}>
              <Cocina />
            </ProtectedRoute>
          }
        />

        {/* Catch-all: redirige a la raíz */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}