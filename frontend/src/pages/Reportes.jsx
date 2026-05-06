import { useState, useEffect } from 'react'
import { reportesAPI } from '../lib/api'

const RESTAURANTE_ID = 'rest-demo-001'

export default function Reportes() {
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    reportesAPI.resumen(RESTAURANTE_ID)
      .then(setResumen)
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return <div className="p-10 text-center text-yellow-400">Cargando reporte...</div>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">📊 Reporte del Día</h1>
      {resumen && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-white">{resumen.total_pedidos}</p>
            <p className="text-gray-400 mt-1">Pedidos hoy</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-yellow-400">Bs {resumen.ingresos.toFixed(2)}</p>
            <p className="text-gray-400 mt-1">Ingresos hoy</p>
          </div>
        </div>
      )}
    </div>
  )
}
