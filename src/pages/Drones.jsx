import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import * as XLSX from 'xlsx'

// ============================================================
// LISTAS
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

const MARCAS_MODELOS = {
  'DJI': ['Matrice 200 Series', 'Matrice 300 RTK', 'Matrice 350 RTK', 'Matrice 300', 'Matrice 30', 'Inspire 2', 'Mavic 2 Enterprise Advance', 'Matrice 4T', 'Matrice 4TD', 'Mavic 3T'],
  'SKYDIO': ['Skydio Duo', 'Skydio X2'],
  'HYLIO': [],  // libre
  'Quantum-Systems': ['Vector']
}

const MARCAS = Object.keys(MARCAS_MODELOS)

const ESTADOS = ['ACC', 'EVA', 'PAR', 'MMP', 'AMO', 'AMR', 'AMI', 'AMP', 'NLA', 'AVP', 'LRA', 'LRM', 'ACL', 'APB', 'BAJ']
const ADQUISICIONES = ['PRENAL', 'COMODATO', 'INL', 'DONACION', 'CONVENIO', 'FONSECON', 'FONSET']
const CLASES = ['UAS', 'RPAS']
const CLASE2_OPCIONES = ['IA', 'IB', 'IC']
const ENTE_OPCIONES = ['PONAL', 'INL']
const ESPECIALIDADES = ['MNVCC', 'ESPECIALIDAD']

// Departamentos y municipios (cargaremos desde Supabase)
// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Drones() {
  const { user } = useAuth()

  const [drones, setDrones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showExcelModal, setShowExcelModal] = useState(false)
  const [excelFile, setExcelFile] = useState(null)
  const [excelData, setExcelData] = useState([])
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)

  // Catálogos
  const [departamentos, setDepartamentos] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState([])

  const [formData, setFormData] = useState({
    ente: '',
    cuenta_contable: '',
    numero_inventario: '',
    numero_serie: '',
    marca: '',
    modelo: '',
    region_especialidad: '',
    unidad: '',
    especialidad: '',
    departamento: '',
    municipio: '',
    clase: '',
    clase2: '',
    matricula: '',
    packs_baterias: 0,
    horas_vuelo_totales: 0,
    seguro_poliza: '',
    adquisicion: '',
    entidad_adquisicion: '',
    estado: 'ACL',
    accesorios: ''
  })

  const [formErrors, setFormErrors] = useState({})

  // ============================================================
  // CARGAR CATÁLOGOS
  // ============================================================
  useEffect(() => {
    cargarDepartamentos()
    cargarMunicipios()
    cargarDrones()
  }, [])

  const cargarDepartamentos = async () => {
    const { data, error } = await supabase.from('departamentos').select('*').order('nombre')
    if (!error) setDepartamentos(data)
  }

  const cargarMunicipios = async () => {
    const { data, error } = await supabase.from('municipios').select('*').order('nombre')
    if (!error) setMunicipios(data)
  }

  const cargarDrones = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('drones')
      .select('*')
      .order('numero_serie')
    if (!error) setDrones(data)
    setLoading(false)
  }

  // ============================================================
  // CRUD
  // ============================================================
  const guardarDron = async (e) => {
    e.preventDefault()
    setFormErrors({})

    const errors = {}
    if (!formData.ente) errors.ente = 'Seleccione ENTE'
    if (!formData.cuenta_contable.trim()) errors.cuenta_contable = 'Cuenta contable es obligatoria'
    if (!formData.numero_inventario.trim()) errors.numero_inventario = 'Número inventario es obligatorio'
    if (!formData.numero_serie.trim()) errors.numero_serie = 'Número serie es obligatorio'
    if (!formData.marca) errors.marca = 'Seleccione marca'
    if (!formData.modelo) errors.modelo = 'Seleccione modelo'
    if (!formData.region_especialidad) errors.region_especialidad = 'Seleccione región'
    if (!formData.unidad) errors.unidad = 'Seleccione unidad'
    if (!formData.especialidad) errors.especialidad = 'Seleccione especialidad'
    if (!formData.departamento) errors.departamento = 'Seleccione departamento'
    if (!formData.municipio) errors.municipio = 'Seleccione municipio'
    if (!formData.clase) errors.clase = 'Seleccione clase'
    if (!formData.clase2) errors.clase2 = 'Seleccione clase2'
    if (!formData.matricula.trim()) errors.matricula = 'Matrícula es obligatoria'
    if (!formData.adquisicion) errors.adquisicion = 'Seleccione tipo de adquisición'
    if (!formData.estado) errors.estado = 'Seleccione estado'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const dataToSave = { 
      ...formData,
      packs_baterias: parseInt(formData.packs_baterias) || 0,
      horas_vuelo_totales: parseFloat(formData.horas_vuelo_totales) || 0
    }

    if (editing) {
      const { error } = await supabase
        .from('drones')
        .update(dataToSave)
        .eq('id', editing)
      if (!error) {
        mostrarNotificacion('Dron actualizado correctamente', 'success')
        resetForm()
        cargarDrones()
      } else {
        mostrarNotificacion('Error: ' + error.message, 'error')
      }
    } else {
      const { error } = await supabase
        .from('drones')
        .insert([dataToSave])
      if (!error) {
        mostrarNotificacion('Dron creado correctamente', 'success')
        resetForm()
        cargarDrones()
      } else {
        mostrarNotificacion('Error: ' + error.message, 'error')
      }
    }
  }

  const eliminarDron = async (id) => {
    if (!confirm('¿Eliminar este dron?')) return
    const { error } = await supabase
      .from('drones')
      .delete()
      .eq('id', id)
    if (!error) {
      mostrarNotificacion('Dron eliminado', 'success')
      cargarDrones()
    } else {
      mostrarNotificacion('Error: ' + error.message, 'error')
    }
  }

  const editarDron = (item) => {
    setEditing(item.id)
    setFormData({
      ente: item.ente || '',
      cuenta_contable: item.cuenta_contable || '',
      numero_inventario: item.numero_inventario || '',
      numero_serie: item.numero_serie || '',
      marca: item.marca || '',
      modelo: item.modelo || '',
      region_especialidad: item.region_especialidad || '',
      unidad: item.unidad || '',
      especialidad: item.especialidad || '',
      departamento: item.departamento || '',
      municipio: item.municipio || '',
      clase: item.clase || '',
      clase2: item.clase2 || '',
      matricula: item.matricula || '',
      packs_baterias: item.packs_baterias || 0,
      horas_vuelo_totales: item.horas_vuelo_totales || 0,
      seguro_poliza: item.seguro_poliza || '',
      adquisicion: item.adquisicion || '',
      entidad_adquisicion: item.entidad_adquisicion || '',
      estado: item.estado || 'ACL',
      accesorios: item.accesorios || ''
    })
    // Filtrar municipios según departamento seleccionado
    if (item.departamento) {
      const filtrados = municipios.filter(m => m.departamento_id === item.departamento)
      setMunicipiosFiltrados(filtrados)
    }
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setShowForm(false)
    setEditing(null)
    setFormData({
      ente: '',
      cuenta_contable: '',
      numero_inventario: '',
      numero_serie: '',
      marca: '',
      modelo: '',
      region_especialidad: '',
      unidad: '',
      especialidad: '',
      departamento: '',
      municipio: '',
      clase: '',
      clase2: '',
      matricula: '',
      packs_baterias: 0,
      horas_vuelo_totales: 0,
      seguro_poliza: '',
      adquisicion: '',
      entidad_adquisicion: '',
      estado: 'ACL',
      accesorios: ''
    })
    setFormErrors({})
    setMunicipiosFiltrados([])
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
        ente: row['ENTE'] || row['Ente'] || '',
        cuenta_contable: row['Cuenta Contable'] || row['cuenta_contable'] || '',
        numero_inventario: row['Número Inventario'] || row['numero_inventario'] || '',
        numero_serie: row['Número Serie'] || row['numero_serie'] || '',
        marca: row['Marca'] || row['marca'] || '',
        modelo: row['Modelo'] || row['modelo'] || '',
        region_especialidad: row['Región'] || row['region'] || '',
        unidad: row['Unidad'] || row['unidad'] || '',
        especialidad: row['Especialidad'] || row['especialidad'] || '',
        departamento: row['Departamento'] || row['departamento'] || '',
        municipio: row['Municipio'] || row['municipio'] || '',
        clase: row['Clase'] || row['clase'] || '',
        clase2: row['Clase2'] || row['clase2'] || '',
        matricula: row['Matrícula'] || row['matricula'] || '',
        packs_baterias: parseInt(row['Packs Baterías'] || 0),
        horas_vuelo_totales: parseFloat(row['Horas Vuelo'] || 0),
        seguro_poliza: row['Seguro Póliza'] || row['seguro_poliza'] || '',
        adquisicion: row['Adquisición'] || row['adquisicion'] || '',
        entidad_adquisicion: row['Entidad Adquisición'] || row['entidad_adquisicion'] || '',
        estado: row['Estado'] || row['estado'] || 'ACL',
        accesorios: row['Accesorios'] || row['accesorios'] || ''
      }

      // Validar campos obligatorios
      if (!item.ente || !item.cuenta_contable || !item.numero_serie || !item.matricula) {
        errorCount++
        continue
      }

      const { error } = await supabase.from('drones').insert([item])
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
    cargarDrones()
  }

  // ============================================================
  // FILTROS Y BÚSQUEDA
  // ============================================================
  const dronesFiltrados = drones.filter(item => {
    const matchSearch =
      item.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.marca?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  })

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando drones...</p>
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
                <span className="text-3xl">🛸</span>
                <h1 className="text-3xl md:text-4xl font-bold tracking-wide">
                  Gestión de Drones
                </h1>
              </div>
              <p className="text-blue-200 text-sm md:text-base">
                Administre la flota de aeronaves no tripuladas
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
                <span>➕</span> Nuevo Dron
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
                {editing ? '✏️ Editar Dron' : '➕ Nuevo Dron'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarDron}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* ENTE */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ENTE <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.ente ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.ente}
                    onChange={(e) => setFormData({ ...formData, ente: e.target.value })}
                  >
                    <option value="">Seleccione...</option>
                    {ENTE_OPCIONES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {formErrors.ente && <p className="text-red-500 text-xs mt-1">{formErrors.ente}</p>}
                </div>

                {/* Cuenta Contable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Contable <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.cuenta_contable ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.cuenta_contable}
                    onChange={(e) => setFormData({ ...formData, cuenta_contable: e.target.value })}
                  />
                  {formErrors.cuenta_contable && <p className="text-red-500 text-xs mt-1">{formErrors.cuenta_contable}</p>}
                </div>

                {/* Número Inventario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número Inventario <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.numero_inventario ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.numero_inventario}
                    onChange={(e) => setFormData({ ...formData, numero_inventario: e.target.value })}
                  />
                  {formErrors.numero_inventario && <p className="text-red-500 text-xs mt-1">{formErrors.numero_inventario}</p>}
                </div>

                {/* Número Serie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"># Serie <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.numero_serie ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.numero_serie}
                    onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                  />
                  {formErrors.numero_serie && <p className="text-red-500 text-xs mt-1">{formErrors.numero_serie}</p>}
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.marca ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.marca}
                    onChange={(e) => {
                      setFormData({ ...formData, marca: e.target.value, modelo: '' })
                    }}
                  >
                    <option value="">Seleccione...</option>
                    {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {formErrors.marca && <p className="text-red-500 text-xs mt-1">{formErrors.marca}</p>}
                </div>

                {/* Modelo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modelo <span className="text-red-500">*</span></label>
                  {formData.marca && MARCAS_MODELOS[formData.marca]?.length > 0 ? (
                    <select
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.modelo ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.modelo}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    >
                      <option value="">Seleccione...</option>
                      {MARCAS_MODELOS[formData.marca].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.modelo ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.modelo}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                      placeholder="Escriba el modelo"
                    />
                  )}
                  {formErrors.modelo && <p className="text-red-500 text-xs mt-1">{formErrors.modelo}</p>}
                </div>

                {/* Región */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Región/Especialidad <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.region_especialidad ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.region_especialidad}
                    onChange={(e) => {
                      setFormData({ ...formData, region_especialidad: e.target.value, unidad: '' })
                    }}
                  >
                    <option value="">Seleccione...</option>
                    {REGIONES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {formErrors.region_especialidad && <p className="text-red-500 text-xs mt-1">{formErrors.region_especialidad}</p>}
                </div>

                {/* Unidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.unidad ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.unidad}
                    onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                    disabled={!formData.region_especialidad}
                  >
                    <option value="">Seleccione...</option>
                    {formData.region_especialidad && REGIONES_UNIDADES[formData.region_especialidad]?.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  {formErrors.unidad && <p className="text-red-500 text-xs mt-1">{formErrors.unidad}</p>}
                </div>

                {/* Especialidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.especialidad ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.especialidad}
                    onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                  >
                    <option value="">Seleccione...</option>
                    {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  {formErrors.especialidad && <p className="text-red-500 text-xs mt-1">{formErrors.especialidad}</p>}
                </div>

                {/* Departamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departamento <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.departamento ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.departamento}
                    onChange={(e) => {
                      const deptoId = e.target.value
                      setFormData({ ...formData, departamento: deptoId, municipio: '' })
                      const filtrados = municipios.filter(m => m.departamento_id === deptoId)
                      setMunicipiosFiltrados(filtrados)
                    }}
                  >
                    <option value="">Seleccione...</option>
                    {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                  {formErrors.departamento && <p className="text-red-500 text-xs mt-1">{formErrors.departamento}</p>}
                </div>

                {/* Municipio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Municipio <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.municipio ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.municipio}
                    onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                    disabled={!formData.departamento}
                  >
                    <option value="">Seleccione...</option>
                    {municipiosFiltrados.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                  {formErrors.municipio && <p className="text-red-500 text-xs mt-1">{formErrors.municipio}</p>}
                </div>

                {/* Clase */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clase <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.clase ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.clase}
                    onChange={(e) => setFormData({ ...formData, clase: e.target.value })}
                  >
                    <option value="">Seleccione...</option>
                    {CLASES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {formErrors.clase && <p className="text-red-500 text-xs mt-1">{formErrors.clase}</p>}
                </div>

                {/* Clase2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clase2 <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.clase2 ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.clase2}
                    onChange={(e) => setFormData({ ...formData, clase2: e.target.value })}
                  >
                    <option value="">Seleccione...</option>
                    {CLASE2_OPCIONES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {formErrors.clase2 && <p className="text-red-500 text-xs mt-1">{formErrors.clase2}</p>}
                </div>

                {/* Matrícula */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.matricula ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  />
                  {formErrors.matricula && <p className="text-red-500 text-xs mt-1">{formErrors.matricula}</p>}
                </div>

                {/* Packs Baterías */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Packs Baterías</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    value={formData.packs_baterias}
                    onChange={(e) => setFormData({ ...formData, packs_baterias: e.target.value })}
                    min="0"
                  />
                </div>

                {/* Horas de Vuelo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horas de Vuelo</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    value={formData.horas_vuelo_totales}
                    onChange={(e) => setFormData({ ...formData, horas_vuelo_totales: e.target.value })}
                    min="0"
                  />
                </div>

                {/* Seguro Póliza */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seguro Póliza</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    value={formData.seguro_poliza}
                    onChange={(e) => setFormData({ ...formData, seguro_poliza: e.target.value })}
                  />
                </div>

                {/* Adquisición */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adquisición <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.adquisicion ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.adquisicion}
                    onChange={(e) => setFormData({ ...formData, adquisicion: e.target.value })}
                  >
                    <option value="">Seleccione...</option>
                    {ADQUISICIONES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  {formErrors.adquisicion && <p className="text-red-500 text-xs mt-1">{formErrors.adquisicion}</p>}
                </div>

                {/* Entidad Adquisición */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entidad Adquisición</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    value={formData.entidad_adquisicion}
                    onChange={(e) => setFormData({ ...formData, entidad_adquisicion: e.target.value })}
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${formErrors.estado ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  >
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  {formErrors.estado && <p className="text-red-500 text-xs mt-1">{formErrors.estado}</p>}
                </div>

                {/* Accesorios */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Accesorios</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    rows="2"
                    value={formData.accesorios}
                    onChange={(e) => setFormData({ ...formData, accesorios: e.target.value })}
                    placeholder="Ej: Batería extra, Cargador rápido, Filtro ND, etc."
                  />
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

        {/* ==================== BÚSQUEDA ==================== */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Buscar por serie, matrícula, modelo o marca..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-600">
            Total: <span className="font-bold text-[#0B2D5C]">{dronesFiltrados.length}</span>
          </div>
        </div>

        {/* ==================== TABLA ==================== */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#0B2D5C] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Serie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell">Matrícula</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">Marca</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell">Modelo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden xl:table-cell">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dronesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No hay drones registrados. ¡Agrega uno nuevo!
                    </td>
                  </tr>
                ) : (
                  dronesFiltrados.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f0f4ff] transition">
                      <td className="px-4 py-3 font-medium text-[#0B2D5C]">{item.numero_serie}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">{item.matricula}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{item.marca}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">{item.modelo}</td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.estado === 'ACL' ? 'bg-green-100 text-green-800' :
                          item.estado === 'ACC' || item.estado === 'BAJ' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          <button
                            onClick={() => editarDron(item)}
                            className="text-[#0B2D5C] hover:text-[#D4AF37] p-1 transition"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => eliminarDron(item.id)}
                            className="text-red-600 hover:text-red-800 p-1 transition"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
            Mostrando {dronesFiltrados.length} de {drones.length} registros
          </div>
        </div>

        {/* ==================== MODAL EXCEL ==================== */}
        {showExcelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-[#0B2D5C] text-white p-4 flex justify-between items-center rounded-t-2xl">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>📊</span> Carga Masiva de Drones
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
                    <li>Columnas esperadas: <strong>ENTE, Cuenta Contable, Número Inventario, Número Serie, Marca, Modelo, Región, Unidad, Especialidad, Departamento, Municipio, Clase, Clase2, Matrícula, Packs Baterías, Horas Vuelo, Seguro Póliza, Adquisición, Entidad Adquisición, Estado, Accesorios</strong></li>
                    <li>Los campos marcados con * son obligatorios</li>
                    <li>Los valores de Estado deben ser: ACC, EVA, PAR, MMP, AMO, AMR, AMI, AMP, NLA, AVP, LRA, LRM, ACL, APB, BAJ</li>
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
      'ENTE': 'PONAL',
      'Cuenta Contable': '1234567890',
      'Número Inventario': 'INV-001',
      'Número Serie': 'SN-001',
      'Marca': 'DJI',
      'Modelo': 'Matrice 300 RTK',
      'Región': 'REMSA',
      'Unidad': 'MEBOG',
      'Especialidad': 'MNVCC',
      'Departamento': 'Cundinamarca',
      'Municipio': 'Bogotá',
      'Clase': 'RPAS',
      'Clase2': 'IA',
      'Matrícula': 'MAT-001',
      'Packs Baterías': 2,
      'Horas Vuelo': 150.5,
      'Seguro Póliza': 'POL-001',
      'Adquisición': 'PRENAL',
      'Entidad Adquisición': 'DIRAN',
      'Estado': 'ACL',
      'Accesorios': 'Batería extra, Cargador rápido'
    }
  ]

  const ws = XLSX.utils.json_to_sheet(plantilla)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Drones')
  XLSX.writeFile(wb, 'Plantilla_Drones.xlsx')
}