import { openDB } from 'idb'

const DB_NAME = 'apolofood'
const DB_VERSION = 1
const STORE_PEDIDOS = 'pedidos_offline'

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_PEDIDOS)) {
        const store = db.createObjectStore(STORE_PEDIDOS, { keyPath: 'offlineId' })
        store.createIndex('sincronizado', 'sincronizado')
      }
    },
  })
}

export const offlineDB = {
  async guardarPedido(pedido) {
    const db = await getDB()
    await db.put(STORE_PEDIDOS, { ...pedido, sincronizado: false, creadoEn: Date.now() })
  },
  async obtenerPendientes() {
    const db = await getDB()
    return db.getAllFromIndex(STORE_PEDIDOS, 'sincronizado', IDBKeyRange.only(false))
  },
  async marcarSincronizado(offlineId) {
    const db = await getDB()
    const pedido = await db.get(STORE_PEDIDOS, offlineId)
    if (pedido) await db.put(STORE_PEDIDOS, { ...pedido, sincronizado: true })
  },
  async contarPendientes() {
    const p = await this.obtenerPendientes()
    return p.length
  },
}
