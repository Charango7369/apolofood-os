import { useState, useEffect } from 'react'
import { menuAPI } from '../lib/api'

const RESTAURANTE_ID = typeof import.meta !== 'undefined'
  ? (import.meta.env?.VITE_RESTAURANTE_ID || 'rest-demo-001')
  : 'rest-demo-001'

export function useMenu() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    menuAPI.obtener(RESTAURANTE_ID)
      .then(setProductos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  return { productos, cargando, error, restauranteId: RESTAURANTE_ID }
}
