import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import * as XLSX from 'xlsx'

// ============================================================
// LISTAS DE REGIONES Y UNIDADES
// ============================================================
const REGIONES_UNIDADES = {
  'REMSA': ['MEBOG', 'MESOA', 'COSOC', 'COENO'],
  'REGIÓN 1': ['METUN', 'DEBOY', 'DECUN', 'DEAMA', 'DESAP'],
  'REGIÓN 2': ['METIB', 'MENEV', 'DETOL', 'DEUIL', 'DECAQ', 'DEPUY'],
  'REGIÓN 3': ['MEPER', 'MEMAZ', 'DERIS', 'DECAL', 'DEQUI'],
  'REGIÓN 4': ['MECAL', 'MEPAS', 'MEPOY', 'DEVAL', 'DECAU', 'DENAR'],
  'REGIÓN 5': ['MEBUC', 'MECUC', 'DESAN', 'DENOR', 'DEARA', 'DEMAM'],
  'REGIÓN 6': ['MEVAL', 'MEMOT', 'DEANT', 'DECHO', 'DEURA', 'DECOR'],
  'REGIÓN 7': ['MEVIL', 'DEMET', 'DECAS', 'DEGUN', 'DEGUV', 'DEVIC', 'DEVAU'],
  'REGIÓN 8': ['MEBAR', 'MECAR', 'MESAN', 'MEVAP', 'DEATA', 'DEBOL', 'DEMAG', 'DEGUA', 'DESUC', 'DECES'],
  'DIRAN': ['AVIPO/SIART'],
  'DICAR': ['GOES H', 'UNIMIL'],
  'DIEPO': ['ECSAN', 'ESAVI', 'ESREY'],
  'DIJIN': ['DIJIN'],
  'DIPOL': ['DIPOL'],
  'DITRA': ['DITRA'],
  'JESEP': ['COPES', 'PONALSAR', 'UNDMO']
}

const REGIONES = Object.keys(REGIONES_UNIDADES)

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Personal() {
  const { user } = useAuth()

  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterJefe, setFilterJefe] = useState('todos')
  const [showExcelModal, setShowExcelModal] = useState(false)
  const [excelFile, setExcelFile] = useState(null)
  const [excelData, setExcelData] = useState([])
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    grado: '',          // <-- PRIMERO
    nombre: '',
    cedula: '',
    email: '',
    telefono: '',
    cargo: '',
    region: '',
    unidad: '',
    es_jefe: false,
    activo: true
  })

  const [formErrors, setFormErrors] = useState({})

  // ============================================================
  // CARGAR PERSONAL
  // ============================================================
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

  // ============================================================
  // CRUD
  // ============================================================
  const guardarPersonal = async (e) => {
    e.preventDefault()
    setFormErrors({})

    const errors = {}
    if (!formData.grado.trim()) errors.grado = 'El grado es obligatorio'
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es obligatorio'
    if (!formData.cedula.trim()) errors.cedula = 'La cédula es obligatoria'
    if (!formData.email.trim()) errors.email = 'El email es obligatorio'
    if (!formData.region) errors.region = 'Seleccione una región'
    if (!formData.unidad) errors.unidad = 'Seleccione una unidad'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const dataToSave = { ...formData }

    if (editing) {
      const { error } = await supabase
        .from('personal')
        .update(dataToSave)
        .eq('id', editing)
      if (!error) {
        mostrarNotificacion('Personal actualizado correctamente', 'success')
        resetForm()
        cargarPersonal()
      } else {
        mostrarNotificacion('Error: ' + error.message, 'error')
      }
    } else {
      const { error } = await supabase
        .from('personal')
        .insert([dataToSave])
      if (!error) {
        mostrarNotificacion('Personal creado correctamente', 'success')
        resetForm()
        cargarPersonal()
      } else {
        mostrarNotificacion('Error: ' + error.message, 'error')
      }
    }
  }

  const desactivarPersonal = async (id) => {
    if (!confirm('¿Desactivar este personal?')) return
    const { error } = await supabase
      .from('personal')
      .update({ activo: false })
      .eq('id', id)
    if (!error) {
      mostrarNotificacion('Personal desactivado', 'info')
      cargarPersonal()
    } else {
      mostrarNotificacion('Error: ' + error.message, 'error')
    }
  }

  const activarPersonal = async (id) => {
    const { error } = await supabase
      .from('personal')
      .update({ activo: true })
      .eq('id', id)
    if (!error) {
      mostrarNotificacion('Personal activado', 'success')
      cargarPersonal()
    } else {
      mostrarNotificacion('Error: ' + error.message, 'error')
    }
  }

  const editarPersonal = (item) => {
    setEditing(item.id)
    setFormData({
      grado: item.grado || '',
      nombre: item.nombre || '',
      cedula: item.cedula || '',
      email: item.email || '',
      telefono: item.telefono || '',
      cargo: item.cargo || '',
      region: item.region || '',
      unidad: item.unidad || '',
      es_jefe: item.es_jefe || false,
      activo: item.activo !== undefined ? item.activo : true
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setShowForm(false)
    setEditing(null)
    setFormData({
      grado: '',
      nombre: '',
      cedula: '',
      email: '',
      telefono: '',
      cargo: '',
      region: '',
      unidad: '',
      es_jefe: false,
      activo: true
    })
    setFormErrors({})
  }

  // ============================================================
  // NOTIFICACIONES
  // ============================================================
  const [notificacion, setNotificacion] = useState(null)

  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    setNotificacion({ mensaje, tipo })
    setTimeout(() => setNotificacion(null), 4000)
  }

  // ============================================================
  // CARGA MASIVA DESDE EXCEL
  // ============================================================
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setExcelFile(file)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(firstSheet)
        setExcelData(json)
        if (json.length === 0) {
          mostrarNotificacion('El archivo está vacío o tiene formato incorrecto', 'error')
        } else {
          mostrarNotificacion(`Se cargaron ${json.length} registros desde Excel`, 'success')
        }
      } catch (err) {
        mostrarNotificacion('Error al leer el archivo: ' + err.message, 'error')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const importarDesdeExcel = async () => {
    if (excelData.length === 0) {
      mostrarNotificacion('No hay datos para importar', 'error')
      return
    }

    setImporting(true)
    let successCount = 0
    let errorCount = 0

    for (const row of excelData) {
      const item = {
        grado: row['Grado'] || row['grado'] || '',
        nombre: row['Nombre'] || row['nombre'] || '',
        cedula: String(row['Cédula'] || row['cedula'] || ''),
        email: row['Email'] || row['email'] || '',
        telefono: row['Teléfono'] || row['telefono'] || '',
        cargo: row['Cargo'] || row['cargo'] || '',
        region: row['Región'] || row['region'] || '',
        unidad: row['Unidad'] || row['unidad'] || '',
        es_jefe: row['Es Jefe'] ? true : false,
        activo: true
      }

      if (!item.nombre || !item.cedula || !item.email) {
        errorCount++
        continue
      }

      const { error } = await supabase.from('personal').insert([item])
      if (!error) successCount++
      else errorCount++
    }

    setImporting(false)
    setShowExcelModal(false)
    setExcelFile(null)
    setExcelData([])
    if (fileInputRef.current) fileInputRef.current.value = ''

    mostrarNotificacion(
      `Importación completada: ${successCount} exitosos, ${errorCount} errores`,
      errorCount > 0 ? 'warning' : 'success'
    )
    cargarPersonal()
  }

  // ============================================================
  // FILTROS
  // ============================================================
  const personalFiltrado = personal.filter(item => {
    const matchSearch =
      item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cedula?.includes(searchTerm) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchJefe =
      filterJefe === 'todos' ? true :
      filterJefe === 'jefes' ? item.es_jefe :
      !item.es_jefe

    return matchSearch && matchJefe
  })

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando personal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-6 lg:p-8">

      {/* ==================== NOTIFICACIÓN ==================== */}
      {notificacion && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm w-full transition-all ${
          notificacion.tipo === 'success' ? 'bg-green-600 text-white' :
          notificacion.tipo === 'error' ? 'bg-red-600 text-white' :
          'bg-blue-600 text-white'
        }`}>
          {notificacion.mensaje}
        </div>
      )}

      {/* ==================== HEADER INSTITUCIONAL ==================== */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#0B2D5C] rounded-2xl shadow-xl p-6 md:p-8 text-white mb-8 border-b-4 border-[#D4AF37]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">👤</span>
                <h1 className="text-3xl md:text-4xl font-bold tracking-wide">
                  Gestión de Personal
                </h1>
              </div>
              <p className="text-blue-200 text-sm md:text-base">
                Administre los responsables, operadores y jefes de la unidad
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <button
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="bg-[#D4AF37] hover:bg-[#c5a032] text-[#0B2D5C] font-bold px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-md"
              >
                <span>➕</span> Nuevo
              </button>
              <button
                onClick={() => setShowExcelModal(true)}
                className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-md"
              >
                <span>📊</span> Carga Masiva
              </button>
            </div>
          </div>
        </div>

        {/* ==================== FORMULARIO ==================== */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 border-l-4 border-[#D4AF37]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#0B2D5C]">
                {editing ? '✏️ Editar Personal' : '➕ Nuevo Personal'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarPersonal}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* ===== GRADO (PRIMERO) ===== */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grado <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${
                      formErrors.grado ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.grado}
                    onChange={(e) => setFormData({ ...formData, grado: e.target.value })}
                    placeholder="Mayor, Capitán, Teniente..."
                  />
                  {formErrors.grado && <p className="text-red-500 text-xs mt-1">{formErrors.grado}</p>}
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${
                      formErrors.nombre ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                  {formErrors.nombre && <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>}
                </div>

                {/* Cédula */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cédula <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${
                      formErrors.cedula ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  />
                  {formErrors.cedula && <p className="text-red-500 text-xs mt-1">{formErrors.cedula}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>

                {/* Cargo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    placeholder="Comandante, Jefe de Sección..."
                  />
                </div>

                {/* Región */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Región / Especialidad <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${
                      formErrors.region ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.region}
                    onChange={(e) => {
                      setFormData({ ...formData, region: e.target.value, unidad: '' })
                    }}
                  >
                    <option value="">Seleccione...</option>
                    {REGIONES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {formErrors.region && <p className="text-red-500 text-xs mt-1">{formErrors.region}</p>}
                </div>

                {/* Unidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${
                      formErrors.unidad ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.unidad}
                    onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                    disabled={!formData.region}
                  >
                    <option value="">Seleccione...</option>
                    {formData.region && REGIONES_UNIDADES[formData.region]?.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  {formErrors.unidad && <p className="text-red-500 text-xs mt-1">{formErrors.unidad}</p>}
                </div>

                {/* Es Jefe y Activo */}
                <div className="flex flex-col gap-2 justify-end">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.es_jefe}
                      onChange={(e) => setFormData({ ...formData, es_jefe: e.target.checked })}
                      className="w-4 h-4 text-[#D4AF37] rounded focus:ring-[#D4AF37]"
                    />
                    Es Jefe de Grupo
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="w-4 h-4 text-[#D4AF37] rounded focus:ring-[#D4AF37]"
                    />
                    Activo
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="bg-[#0B2D5C] hover:bg-[#1a3d7c] text-white font-semibold px-6 py-2 rounded-lg transition shadow-md"
                >
                  {editing ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-6 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================== FILTROS ==================== */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, cédula o email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Filtrar:</span>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37]"
              value={filterJefe}
              onChange={(e) => setFilterJefe(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="jefes">Solo Jefes</option>
              <option value="responsables">Solo Responsables</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Total: <span className="font-bold text-[#0B2D5C]">{personalFiltrado.length}</span>
          </div>
        </div>

        {/* ==================== TABLA ==================== */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#0B2D5C] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Grado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell">Cédula</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden xl:table-cell">Región/Unidad</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Rol</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {personalFiltrado.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      No hay personal registrado. ¡Agrega uno nuevo!
                    </td>
                  </tr>
                ) : (
                  personalFiltrado.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f0f4ff] transition">
                      <td className="px-4 py-3 font-medium text-[#0B2D5C]">{item.grado || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.nombre}</div>
                        <div className="text-xs text-gray-500 sm:hidden">{item.cedula}</div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">{item.cedula}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm">{item.email}</td>
                      <td className="px-4 py-3 hidden xl:table-cell text-sm">
                        {item.region} / {item.unidad}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.es_jefe ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#D4AF37] text-[#0B2D5C]">
                            ⭐ Jefe
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            👤 Responsable
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.activo ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          <button
                            onClick={() => editarPersonal(item)}
                            className="text-[#0B2D5C] hover:text-[#D4AF37] p-1 transition"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          {item.activo ? (
                            <button
                              onClick={() => desactivarPersonal(item.id)}
                              className="text-red-600 hover:text-red-800 p-1 transition"
                              title="Desactivar"
                            >
                              🔴
                            </button>
                          ) : (
                            <button
                              onClick={() => activarPersonal(item.id)}
                              className="text-green-600 hover:text-green-800 p-1 transition"
                              title="Activar"
                            >
                              🟢
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
            Mostrando {personalFiltrado.length} de {personal.length} registros
          </div>
        </div>

        {/* ==================== MODAL EXCEL ==================== */}
        {showExcelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-[#0B2D5C] text-white p-4 flex justify-between items-center rounded-t-2xl">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>📊</span> Carga Masiva desde Excel
                </h2>
                <button
                  onClick={() => {
                    setShowExcelModal(false)
                    setExcelFile(null)
                    setExcelData([])
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="text-white hover:text-[#D4AF37] text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <div className="bg-[#f0f4ff] border border-[#D4AF37] rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-[#0B2D5C]">📋 Instrucciones</h3>
                  <ul className="text-sm text-gray-700 list-disc pl-4 mt-2 space-y-1">
                    <li>El archivo debe ser <strong>.xlsx</strong> o <strong>.xls</strong></li>
                    <li>Columnas esperadas: <strong>Grado, Nombre, Cédula, Email, Teléfono, Cargo, Región, Unidad, Es Jefe</strong></li>
                    <li>La columna "Es Jefe" puede ser <strong>SI/NO</strong> o <strong>TRUE/FALSE</strong></li>
                    <li>Región y Unidad deben coincidir con los valores del sistema</li>
                    <li>
                      <button
                        onClick={descargarPlantillaExcel}
                        className="text-[#0B2D5C] font-semibold underline hover:text-[#D4AF37]"
                      >
                        📥 Descargar plantilla de ejemplo
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#D4AF37] transition">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excelFileInput"
                  />
                  <label htmlFor="excelFileInput" className="cursor-pointer">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-gray-600">
                      {excelFile ? excelFile.name : 'Haz clic para seleccionar un archivo Excel'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">.xlsx o .xls</p>
                  </label>
                </div>

                {excelData.length > 0 && (
                  <div className="mt-4 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {Object.keys(excelData[0] || {}).map((key) => (
                            <th key={key} className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {excelData.slice(0, 10).map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((val, i) => (
                              <td key={i} className="px-2 py-1 text-xs">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                        {excelData.length > 10 && (
                          <tr>
                            <td colSpan={Object.keys(excelData[0]).length} className="px-2 py-1 text-center text-gray-400">
                              ... y {excelData.length - 10} más
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowExcelModal(false)
                      setExcelFile(null)
                      setExcelData([])
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={importarDesdeExcel}
                    disabled={excelData.length === 0 || importing}
                    className={`px-6 py-2 bg-[#0B2D5C] text-white rounded-lg font-semibold transition ${
                      excelData.length === 0 || importing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#1a3d7c]'
                    }`}
                  >
                    {importing ? 'Importando...' : 'Importar Datos'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// FUNCIÓN PARA DESCARGAR PLANTILLA EXCEL
// ============================================================
function descargarPlantillaExcel() {
  const plantilla = [
    {
      'Grado': 'Mayor',
      'Nombre': 'Carlos Pérez',
      'Cédula': '1234567890',
      'Email': 'carlos.perez@ejemplo.com',
      'Teléfono': '3101234567',
      'Cargo': 'Comandante',
      'Región': 'REMSA',
      'Unidad': 'MEBOG',
      'Es Jefe': 'SI'
    },
    {
      'Grado': 'Capitán',
      'Nombre': 'Ana Gómez',
      'Cédula': '9876543210',
      'Email': 'ana.gomez@ejemplo.com',
      'Teléfono': '3107654321',
      'Cargo': 'Jefe de Sección',
      'Región': 'REGIÓN 5',
      'Unidad': 'MEBUC',
      'Es Jefe': 'NO'
    }
  ]

  const ws = XLSX.utils.json_to_sheet(plantilla)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Personal')
  XLSX.writeFile(wb, 'Plantilla_Personal.xlsx')
}