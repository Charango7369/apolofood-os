import { registerSW as _register } from 'virtual:pwa-register'

export function registerSW() {
  if ('serviceWorker' in navigator) {
    const updateSW = _register({
      onNeedRefresh() {
        if (confirm('Nueva versión disponible. ¿Actualizar?')) {
          updateSW(true)
        }
      },
      onOfflineReady() {
        console.log('✅ ApoloFoodOS listo para uso offline')
      },
    })
  }
}
