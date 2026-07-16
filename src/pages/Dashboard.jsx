import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { enviarCorreo } from '../lib/email'

export default function Dashboard() {
  const { user, signOut } = useAuth()

  const probarCorreo = async () => {
    try {
      await enviarCorreo(
        'uassiart@gmail.com',
        'Prueba desde Control Drones',
        '<h1>¡Hola!</h1><p>Este es un correo de prueba desde tu app de Control de Drones.</p>'
      )
      alert('✅ Correo enviado correctamente. Revisa tu bandeja de entrada (y spam).')
    } catch (error) {
      alert('❌ Error al enviar correo: ' + error.message)
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#0B2D5C]">Dashboard</h1>
            <button
              onClick={signOut}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Cerrar Sesión
            </button>
          </div>
          <p className="text-gray-700 mb-4">Bienvenido, {user?.email}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Link to="/personal" className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 text-center border-l-4 border-[#0B2D5C]">
              <h3 className="font-bold text-[#0B2D5C]">👤 Personal</h3>
              <p className="text-sm text-gray-600">Gestionar responsables y jefes</p>
            </Link>
            <Link to="/drones" className="bg-green-50 p-4 rounded-lg hover:bg-green-100 text-center border-l-4 border-[#0B2D5C]">
              <h3 className="font-bold text-[#0B2D5C]">🛸 Drones</h3>
              <p className="text-sm text-gray-600">Gestionar flota de drones</p>
            </Link>
            <div className="bg-purple-50 p-4 rounded-lg text-center border-l-4 border-[#0B2D5C]">
              <h3 className="font-bold text-[#0B2D5C]">📊 Reportes</h3>
              <p className="text-sm text-gray-600">Ver estadísticas y reportes</p>
            </div>
          </div>

          {/* ========== BOTÓN DE PRUEBA DE CORREOS ========== */}
          <div className="mt-8 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">🧪 Prueba de envío de correos con Resend</p>
            <button
              onClick={probarCorreo}
              className="bg-[#0B2D5C] hover:bg-[#1a3d7c] text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              Enviar correo de prueba
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}