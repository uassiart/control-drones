import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Personal() {
  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const { user } = useAuth()

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    email: '',
    es_jefe: false,
    activo: true
  })

  // Cargar personal
  useEffect(() => {
    cargarPersonal()
  }, [])

  const cargarPersonal = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('personal')
      .select('*')
      .order('nombre')
    
    if (!error) setPersonal(data)
    setLoading(false)
  }

  // Guardar (crear o editar)
  const guardarPersonal = async (e) => {
    e.preventDefault()
    
    if (editing) {
      // Actualizar
      const { error } = await supabase
        .from('personal')
        .update(formData)
        .eq('id', editing)
      
      if (!error) {
        alert('Personal actualizado correctamente')
        setEditing(null)
        setShowForm(false)
        setFormData({ nombre: '', cedula: '', email: '', es_jefe: false, activo: true })
        cargarPersonal()
      } else {
        alert('Error al actualizar: ' + error.message)
      }
    } else {
      // Crear
      const { error } = await supabase
        .from('personal')
        .insert([formData])
      
      if (!error) {
        alert('Personal creado correctamente')
        setShowForm(false)
        setFormData({ nombre: '', cedula: '', email: '', es_jefe: false, activo: true })
        cargarPersonal()
      } else {
        alert('Error al crear: ' + error.message)
      }
    }
  }

  // Eliminar (desactivar)
  const desactivarPersonal = async (id) => {
    if (confirm('¿Desactivar este personal?')) {
      const { error } = await supabase
        .from('personal')
        .update({ activo: false })
        .eq('id', id)
      
      if (!error) {
        cargarPersonal()
      } else {
        alert('Error: ' + error.message)
      }
    }
  }

  // Editar (cargar datos en el formulario)
  const editarPersonal = (item) => {
    setEditing(item.id)
    setFormData({
      nombre: item.nombre,
      cedula: item.cedula,
      email: item.email,
      es_jefe: item.es_jefe,
      activo: item.activo
    })
    setShowForm(true)
  }

  if (loading) return <div className="p-8 text-center">Cargando personal...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Personal</h1>
        <button
          onClick={() => {
            setEditing(null)
            setFormData({ nombre: '', cedula: '', email: '', es_jefe: false, activo: true })
            setShowForm(!showForm)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : 'Agregar Personal'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editing ? 'Editar Personal' : 'Nuevo Personal'}
          </h2>
          <form onSubmit={guardarPersonal}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cédula</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  value={formData.cedula}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.es_jefe}
                    onChange={(e) => setFormData({ ...formData, es_jefe: e.target.checked })}
                  />
                  Es Jefe
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  />
                  Activo
                </label>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                {editing ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de personal */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cédula</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {personal.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No hay personal registrado</td>
              </tr>
            ) : (
              personal.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">{item.nombre}</td>
                  <td className="px-6 py-4">{item.cedula}</td>
                  <td className="px-6 py-4">{item.email}</td>
                  <td className="px-6 py-4">{item.es_jefe ? 'Jefe' : 'Responsable'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${item.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => editarPersonal(item)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                    {item.activo && (
                      <button
                        onClick={() => desactivarPersonal(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Desactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}