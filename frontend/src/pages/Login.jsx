import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!telefono.trim() || !password) {
      toast.error('Ingresa teléfono y contraseña')
      return
    }
    setEnviando(true)
    try {
      const user = await login(telefono.trim(), password)
      toast.success(`¡Bienvenido, ${user.nombre}!`)
      // Redirigir según rol
      if (user.rol === 'admin' || user.rol === 'superadmin') {
        navigate('/admin')
      } else if (user.rol === 'cajero') {
        navigate('/caja')
      } else if (user.rol === 'cocina') {
        navigate('/cocina')
      } else {
        navigate('/')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🍽️</div>
          <h1 className="text-3xl font-bold text-yellow-400">ApoloFoodOS</h1>
          <p className="text-gray-400 text-sm mt-1">Inicia sesión en tu restaurante</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              autoFocus
              placeholder="71234567"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              disabled={enviando}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={enviando}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-lg transition-colors"
          >
            {enviando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-8">
          ¿Olvidaste tu contraseña? Contacta al administrador.
        </p>
      </div>
    </div>
  )
}
