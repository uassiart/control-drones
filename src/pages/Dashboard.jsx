import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  Users, 
  Drone, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState({
    totalDrones: 0,
    totalPersonal: 0,
    dronesActivos: 0,
    dronesMantenimiento: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const cargarEstadisticas = async () => {
    setLoading(true)
    
    const [dronesRes, personalRes] = await Promise.all([
      supabase.from('drones').select('*', { count: 'exact', head: false }),
      supabase.from('personal').select('*', { count: 'exact', head: false }).eq('activo', true),
    ])

    const dronesActivos = dronesRes.data?.filter(d => d.estado === 'ACL' || d.estado === 'LRA' || d.estado === 'LRM') || []
    const dronesMantenimiento = dronesRes.data?.filter(d => 
      ['MMP', 'AMO', 'AMR', 'AMI', 'AMP'].includes(d.estado)
    ) || []

    setStats({
      totalDrones: dronesRes.data?.length || 0,
      totalPersonal: personalRes.data?.length || 0,
      dronesActivos: dronesActivos.length,
      dronesMantenimiento: dronesMantenimiento.length,
    })
    setLoading(false)
  }

  const statsCards = [
    { icon: Drone, label: 'Total Drones', value: stats.totalDrones, color: 'text-[#003087]', bg: 'bg-[#003087]/10' },
    { icon: Users, label: 'Personal Activo', value: stats.totalPersonal, color: 'text-[#00a650]', bg: 'bg-[#00a650]/10' },
    { icon: CheckCircle, label: 'Drones Listos', value: stats.dronesActivos, color: 'text-green-600', bg: 'bg-green-100' },
    { icon: AlertTriangle, label: 'En Mantenimiento', value: stats.dronesMantenimiento, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  ]

  const quickActions = [
    { title: 'Registrar Dron', path: '/drones/nuevo', icon: Drone, color: 'bg-[#003087]' },
    { title: 'Asignar Dron', path: '/drones/asignar', icon: TrendingUp, color: 'bg-[#00a650]' },
    { title: 'Gestionar Personal', path: '/personal', icon: Users, color: 'bg-[#f9b81b]' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Bienvenido, {user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((item, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${item.bg}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : item.value}
                </p>
                <p className="text-sm text-gray-500">{item.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card title="Acciones Rápidas">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className={`${action.color} text-white p-4 rounded-xl flex items-center justify-between hover:opacity-90 transition-opacity`}
            >
              <div className="flex items-center gap-3">
                <action.icon className="w-5 h-5" />
                <span className="font-medium">{action.title}</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ))}
        </div>
      </Card>

      {/* Placeholder para futuras secciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Últimos Drones Agregados">
          <p className="text-gray-500 text-sm">Próximamente: Lista de últimos drones registrados</p>
        </Card>
        <Card title="Asignaciones Recientes">
          <p className="text-gray-500 text-sm">Próximamente: Historial de asignaciones recientes</p>
        </Card>
      </div>
    </div>
  )
}