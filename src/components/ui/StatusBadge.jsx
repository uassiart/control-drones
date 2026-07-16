export default function StatusBadge({ status, label }) {
  const variants = {
    activo: 'bg-green-100 text-green-800',
    inactivo: 'bg-red-100 text-red-800',
    jefe: 'bg-[#003087] text-white',
    responsable: 'bg-blue-100 text-blue-800',
    ACC: 'bg-red-100 text-red-800',
    ACL: 'bg-green-100 text-green-800',
    AMP: 'bg-yellow-100 text-yellow-800',
  }

  const defaultVariant = variants[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${defaultVariant}`}>
      {label || status}
    </span>
  )
}