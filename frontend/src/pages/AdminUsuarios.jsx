import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { usuariosAPI } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import Header from '../components/Header'

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


export default function AdminUsuarios() {
  const { usuario: yo } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [actualizandoId, setActualizandoId] = useState(null)

  // Form
  const [telefono, setTelefono] = useState('')
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('cajero')

  const cargar = useCallback(async () => {
    try {
      const data = await usuariosAPI.listar()
      setUsuarios(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const limpiarForm = () => {
    setTelefono('')
    setNombre('')
    setPassword('')
    setRol('cajero')
    setMostrarForm(false)
  }

  const crear = async (e) => {
    e.preventDefault()
    if (!telefono.trim()) return toast.error('Teléfono obligatorio')
    if (!nombre.trim()) return toast.error('Nombre obligatorio')
    if (password.length < 6) return toast.error('Contraseña mínimo 6 caracteres')

    setEnviando(true)
    try {
      await usuariosAPI.crear({
        telefono: telefono.trim(),
        nombre: nombre.trim(),
        password,
        rol,
      })
      toast.success(`${ROL_LABELS[rol]} creado`)
      limpiarForm()
      await cargar()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const desactivar = async (u) => {
    if (u.id === yo.id) return toast.error('No puedes desactivarte a ti mismo')
    if (!confirm(`¿Desactivar a ${u.nombre}? No podrá iniciar sesión.`)) return

    setActualizandoId(u.id)
    try {
      await usuariosAPI.desactivar(u.id)
      toast.success('Usuario desactivado')
      await cargar()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActualizandoId(null)
    }
  }

  const activar = async (u) => {
    setActualizandoId(u.id)
    try {
      await usuariosAPI.activar(u.id)
      toast.success(`${u.nombre} reactivado`)
      await cargar()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActualizandoId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header titulo="Usuarios" />

      <main className="max-w-2xl mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <Link to="/admin" className="text-sm text-gray-400 hover:text-white">← Volver</Link>
          {!mostrarForm && (
            <button
              onClick={() => setMostrarForm(true)}
              className="bg-red-700 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-sm"
            >
              + Nuevo usuario
            </button>
          )}
        </div>

        {/* Formulario */}
        {mostrarForm && (
          <form onSubmit={crear} className="bg-gray-800 rounded-xl p-4 mb-6 space-y-3">
            <h3 className="font-bold text-yellow-400">Nuevo usuario</h3>

            <input
              type="text"
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={enviando}
              autoFocus
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 disabled:opacity-50"
            />

            <input
              type="tel"
              inputMode="numeric"
              placeholder="Teléfono (ej: 71234567)"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              disabled={enviando}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 disabled:opacity-50"
            />

            <input
              type="text"
              placeholder="Contraseña inicial (mín 6)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={enviando}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 disabled:opacity-50"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRol('cajero')}
                disabled={enviando}
                className={`py-2 rounded-lg font-medium ${
                  rol === 'cajero' ? 'bg-green-700 text-white' : 'bg-gray-900 text-gray-400'
                }`}
              >
                💰 Cajero
              </button>
              <button
                type="button"
                onClick={() => setRol('cocina')}
                disabled={enviando}
                className={`py-2 rounded-lg font-medium ${
                  rol === 'cocina' ? 'bg-orange-700 text-white' : 'bg-gray-900 text-gray-400'
                }`}
              >
                🍳 Cocina
              </button>
            </div>

            <p className="text-xs text-gray-500">
              💡 Anota la contraseña y mándala por WhatsApp al usuario.
              No podrás verla después.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg"
              >
                {enviando ? 'Creando...' : 'Crear usuario'}
              </button>
              <button
                type="button"
                onClick={limpiarForm}
                disabled={enviando}
                className="px-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {cargando && <p className="text-center text-gray-400 py-8">Cargando...</p>}

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {usuarios.map((u) => {
            const procesando = actualizandoId === u.id
            const esYo = u.id === yo.id
            return (
              <div
                key={u.id}
                className={`bg-gray-800 rounded-lg p-3 transition-opacity ${
                  !u.activo ? 'opacity-40' : ''
                } ${procesando ? 'opacity-30' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{u.nombre}</p>
                      {esYo && (
                        <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded">
                          tú
                        </span>
                      )}
                      {!u.activo && (
                        <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                          desactivado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">📱 {u.telefono}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${ROL_COLORS[u.rol]}`}>
                    {ROL_LABELS[u.rol]}
                  </span>
                </div>

                {u.activo && !esYo && u.rol !== 'admin' && u.rol !== 'superadmin' && (
                  <button
                    onClick={() => desactivar(u)}
                    disabled={procesando}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 underline disabled:opacity-50"
                  >
                    Desactivar
                  </button>
                )}

                {!esYo && u.rol !== 'admin' && u.rol !== 'superadmin' && (
                  <button
                    onClick={() => u.activo ? desactivar(u) : activar(u)}
                    disabled={procesando}
                    className={`mt-2 text-xs underline disabled:opacity-50 ${
                    u.activo
                      ? 'text-red-400 hover:text-red-300'
                      : 'text-green-400 hover:text-green-300'
              }`}
            >
              {u.activo ? 'Desactivar' : 'Reactivar'}
                </button>
        )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}