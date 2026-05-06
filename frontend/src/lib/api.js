import axios from 'axios'

// En dev: Vite hace proxy de /api → localhost:8000
// En prod (Cloudflare Pages): VITE_API_URL = https://apolofood.up.railway.app
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const mensaje = err.response?.data?.detail || err.message || 'Error de conexión'
    return Promise.reject(new Error(mensaje))
  }
)

export const pedidosAPI = {
  crear:        (payload) => api.post('/pedidos/', payload),
  listar:       (restauranteId) => api.get('/pedidos/', { params: { restaurante_id: restauranteId } }),
  cambiarEstado:(id, estado) => api.patch(`/pedidos/${id}/estado`, { estado }),
}

export const menuAPI = {
  obtener: (restauranteId) => api.get(`/menu/${restauranteId}`),
}

export const reportesAPI = {
  resumen: (restauranteId) => api.get(`/reportes/resumen/${restauranteId}`),
}

export default api
