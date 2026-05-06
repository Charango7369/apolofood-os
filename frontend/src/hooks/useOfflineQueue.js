import { useState, useEffect, useCallback } from 'react'
import { offlineDB } from '../lib/db'
import { pedidosAPI } from '../lib/api'
import { toast } from 'sonner'

function uuidv4() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

export function useOfflineQueue() {
  const [online, setOnline] = useState(navigator.onLine)
  const [pendientes, setPendientes] = useState(0)
  const [sincronizando, setSincronizando] = useState(false)

  useEffect(() => {
    const onOnline = () => { setOnline(true); toast.success('Conexión restaurada. Sincronizando...'); sincronizarPendientes() }
    const onOffline = () => { setOnline(false); toast.warning('Sin internet. Modo offline activado.') }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    offlineDB.contarPendientes().then(setPendientes)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  const crearPedido = useCallback(async (datosPedido) => {
    const offlineId = uuidv4()
    if (online) {
      try {
        const resultado = await pedidosAPI.crear({ ...datosPedido, offline_id: offlineId })
        toast.success(`Pedido #${resultado.id.slice(0,8)} enviado ✅`)
        return resultado
      } catch (err) {
        console.warn('Guardando offline:', err)
      }
    }
    await offlineDB.guardarPedido({ ...datosPedido, offlineId })
    const n = await offlineDB.contarPendientes()
    setPendientes(n)
    toast.info(`Pedido guardado offline (${n} pendiente${n > 1 ? 's' : ''})`)
    return { offline: true, offlineId }
  }, [online])

  const sincronizarPendientes = useCallback(async () => {
    if (sincronizando) return
    setSincronizando(true)
    try {
      const lista = await offlineDB.obtenerPendientes()
      let ok = 0
      for (const pedido of lista) {
        try {
          await pedidosAPI.crear({ ...pedido, offline_id: pedido.offlineId })
          await offlineDB.marcarSincronizado(pedido.offlineId)
          ok++
        } catch (e) { console.error(e) }
      }
      const restantes = await offlineDB.contarPendientes()
      setPendientes(restantes)
      if (ok > 0) toast.success(`${ok} pedido(s) sincronizado(s) ✅`)
    } finally { setSincronizando(false) }
  }, [sincronizando])

  return { online, pendientes, sincronizando, crearPedido, sincronizarPendientes }
}
