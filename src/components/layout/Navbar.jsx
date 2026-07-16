import { Menu, User, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Navbar({ toggleSidebar }) {
  const { user } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-lg font-semibold text-[#003087] hidden sm:block">
            Sistema de Control de Drones
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative hover:bg-gray-100 p-2 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#003087] rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden md:block">
              {user?.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}