import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <button
              onClick={signOut}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Cerrar Sesión
            </button>
          </div>
          <p className="text-gray-700 mb-4">Bienvenido, {user?.email}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Link to="/personal" className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 text-center">
              <h3 className="font-bold text-blue-800">👤 Personal</h3>
              <p className="text-sm text-gray-600">Gestionar responsables y jefes</p>
            </Link>
            <Link to="/drones" className="bg-green-50 p-4 rounded-lg hover:bg-green-100 text-center">
              <h3 className="font-bold text-green-800">🛸 Drones</h3>
              <p className="text-sm text-gray-600">Gestionar flota de drones</p>
            </Link>
            <Link to="/reportes" className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 text-center">
              <h3 className="font-bold text-purple-800">📊 Reportes</h3>
              <p className="text-sm text-gray-600">Ver estadísticas y reportes</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}