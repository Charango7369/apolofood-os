import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Inyecta el JWT en todas las requests si existe en localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('apolofood_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Maneja 401 (token expirado o inválido) → fuerza logout
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('apolofood_token')
      localStorage.removeItem('apolofood_user')
      // Solo recarga si no estamos ya en login (evita loop)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    const mensaje = err.response?.data?.detail || err.message || 'Error de conexión'
    return Promise.reject(new Error(mensaje))
  }
)

// === Auth ===
export const authAPI = {
  login: async (telefono, password) => {
    // El endpoint usa OAuth2PasswordRequestForm: form-encoded, no JSON
    const formData = new URLSearchParams()
    formData.append('username', telefono)
    formData.append('password', password)
    const response = await axios.post(
      `${BASE_URL}/auth/login`,
      formData,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    return response.data
  },
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}

// === Pedidos ===
export const pedidosAPI = {
  crear: (payload) => api.post('/pedidos/', payload),
  listar: () => api.get('/pedidos/'),
  cambiarEstado: (id, estado) => api.patch(`/pedidos/${id}/estado`, { estado }),
}

// === Menú ===
export const menuAPI = {
  obtener: () => api.get('/menu/'),
  crearProducto: (payload) => api.post('/menu/productos', payload),
}

// === Reportes ===
export const reportesAPI = {
  resumen: () => api.get('/reportes/resumen'),
}

// === Usuarios ===
export const usuariosAPI = {
  listar: () => api.get('/usuarios/'),
  crear: (payload) => api.post('/usuarios/', payload),
  desactivar: (id) => api.patch(`/usuarios/${id}/desactivar`),
}

export default api