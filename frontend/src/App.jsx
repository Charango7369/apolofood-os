import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminHome from './pages/AdminHome'
import AdminPedidos from './pages/AdminPedidos'
import AdminMenu from './pages/AdminMenu'
import AdminReportes from './pages/AdminReportes'
import AdminUsuarios from './pages/AdminUsuarios'
import Caja from './pages/Caja'
import Cocina from './pages/Cocina'


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

        {/* Rutas Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin', 'superadmin']}>
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pedidos"
          element={
            <ProtectedRoute roles={['admin', 'superadmin']}>
              <AdminPedidos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <ProtectedRoute roles={['admin', 'superadmin']}>
              <AdminMenu />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reportes"
          element={
            <ProtectedRoute roles={['admin', 'superadmin']}>
              <AdminReportes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute roles={['admin', 'superadmin']}>
              <AdminUsuarios />
            </ProtectedRoute>
          }
        />

        {/* Rutas Caja y Cocina */}
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}