import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import Menu from './pages/Menu'
import Panel from './pages/Panel'
import Reportes from './pages/Reportes'

function NavLink({ to, children }) {
  const { pathname } = useLocation()
  const active = pathname === to
  return (
    <Link to={to} className={`px-4 py-2 rounded-lg font-medium transition-colors ${active ? 'bg-red-700 text-white' : 'text-gray-400 hover:text-white'}`}>
      {children}
    </Link>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster richColors position="top-center" />
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <span className="font-bold text-yellow-400 mr-4">🍽️ ApoloFoodOS</span>
          <NavLink to="/">Menú</NavLink>
          <NavLink to="/panel">Panel</NavLink>
          <NavLink to="/reportes">Reportes</NavLink>
        </div>
      </nav>
      <main className="py-6">
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/panel" element={<Panel />} />
          <Route path="/reportes" element={<Reportes />} />
        </Routes>
      </main>
    </div>
  )
}
