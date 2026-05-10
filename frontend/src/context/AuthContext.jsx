import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../lib/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'apolofood_token'
const USER_KEY = 'apolofood_user'


export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Al montar: si hay token guardado, restaurar usuario
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const userJson = localStorage.getItem(USER_KEY)

    if (token && userJson) {
      try {
        setUsuario(JSON.parse(userJson))
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }
    setCargando(false)
  }, [])

  const login = async (telefono, password) => {
    const data = await authAPI.login(telefono, password)
    localStorage.setItem(TOKEN_KEY, data.access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.usuario))
    setUsuario(data.usuario)
    return data.usuario
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (e) {
      // Si falla la llamada, igual cerramos sesión local
      console.warn('Logout backend falló:', e.message)
    }
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUsuario(null)
  }

  // Helpers de roles
  const esAdmin = usuario?.rol === 'admin'
  const esCajero = usuario?.rol === 'cajero'
  const esCocina = usuario?.rol === 'cocina'
  const esSuperadmin = usuario?.rol === 'superadmin'

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        login,
        logout,
        esAdmin,
        esCajero,
        esCocina,
        esSuperadmin,
        autenticado: !!usuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}