import { openDB } from 'idb'

const DB_NAME = 'apolofood'
// IMPORTANTE: subimos a v2 porque cambiamos el tipo de la key del índice (boolean → 0/1)
const DB_VERSION = 2
const STORE_PEDIDOS = 'pedidos_offline'


async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Si veníamos de v1 con datos, los borramos (eran inutilizables igual)
      if (oldVersion < 2 && db.objectStoreNames.contains(STORE_PEDIDOS)) {
        db.deleteObjectStore(STORE_PEDIDOS)
      }
      const store = db.createObjectStore(STORE_PEDIDOS, { keyPath: 'offlineId' })
      // 'sincronizado' guarda 0 (no) o 1 (sí). IndexedDB no acepta booleanos como keys.
      store.createIndex('sincronizado', 'sincronizado')
    },
  })
}


export const offlineDB = {
  async guardarPedido(pedido) {
    const db = await getDB()
    await db.put(STORE_PEDIDOS, {
      ...pedido,
      sincronizado: 0,
      creadoEn: Date.now(),
    })
  },

  async obtenerPendientes() {
    const db = await getDB()
    return db.getAllFromIndex(STORE_PEDIDOS, 'sincronizado', IDBKeyRange.only(0))
  },

  async marcarSincronizado(offlineId) {
    const db = await getDB()
    const pedido = await db.get(STORE_PEDIDOS, offlineId)
    if (pedido) {
      await db.put(STORE_PEDIDOS, { ...pedido, sincronizado: 1 })
    }
  },

  async contarPendientes() {
    const lista = await this.obtenerPendientes()
    return lista.length
  },
}