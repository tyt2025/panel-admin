'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function TallerPage() {
  const [user, setUser] = useState(null)
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [stats, setStats] = useState({
    total: 0,
    recibido: 0,
    diagnostico: 0,
    reparando: 0,
    listo: 0,
    entregado: 0
  })
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(userData))
    loadServicios(JSON.parse(userData))
  }, [router])

  const loadServicios = async (userData) => {
    try {
      const { data, error } = await supabase
        .from('taller')
        .select('*')
        .eq('vendedor_id', userData.vendedor_id)
        .order('fecha_ingreso', { ascending: false })

      if (error) throw error

      setServicios(data || [])
      calcularStats(data || [])
    } catch (error) {
      console.error('Error al cargar servicios:', error)
      alert('Error al cargar los servicios de taller')
    } finally {
      setLoading(false)
    }
  }

  const calcularStats = (data) => {
    setStats({
      total: data.length,
      recibido: data.filter(s => s.estado === 'recibido').length,
      diagnostico: data.filter(s => s.estado === 'diagnostico').length,
      reparando: data.filter(s => s.estado === 'reparando').length,
      listo: data.filter(s => s.estado === 'listo').length,
      entregado: data.filter(s => s.estado === 'entregado').length
    })
  }

  const serviciosFiltrados = servicios.filter(servicio => {
    const coincideBusqueda = 
      servicio.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      servicio.telefono.includes(busqueda) ||
      servicio.referencia.toLowerCase().includes(busqueda.toLowerCase()) ||
      servicio.marca.toLowerCase().includes(busqueda.toLowerCase())
    
    const coincideEstado = 
      filtroEstado === 'todos' || servicio.estado === filtroEstado

    return coincideBusqueda && coincideEstado
  })

  const getEstadoBadge = (estado) => {
    const estilos = {
      recibido: 'bg-blue-100 text-blue-800',
      diagnostico: 'bg-yellow-100 text-yellow-800',
      reparando: 'bg-orange-100 text-orange-800',
      listo: 'bg-green-100 text-green-800',
      entregado: 'bg-gray-100 text-gray-800',
      sin_solucion: 'bg-red-100 text-red-800',
      abandonado: 'bg-purple-100 text-purple-800'
    }
    const nombres = {
      recibido: 'Recibido',
      diagnostico: 'En Diagnóstico',
      reparando: 'Reparando',
      listo: 'Listo',
      entregado: 'Entregado',
      sin_solucion: 'Sin Solución',
      abandonado: 'Abandonado'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${estilos[estado]}`}>
        {nombres[estado]}
      </span>
    )
  }

  const getTipoServicioBadge = (tipo) => {
    const estilos = {
      mantenimiento: 'bg-blue-100 text-blue-700',
      reparacion: 'bg-red-100 text-red-700',
      revision: 'bg-green-100 text-green-700'
    }
    const nombres = {
      mantenimiento: '🔧 Mantenimiento',
      reparacion: '⚙️ Reparación',
      revision: '🔍 Revisión'
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${estilos[tipo]}`}>
        {nombres[tipo]}
      </span>
    )
  }

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando servicios de taller...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🛠️ Servicios de Taller</h1>
          <p className="text-gray-600 mt-1">Gestiona los servicios de mantenimiento, reparación y revisión</p>
        </div>
        <button 
          onClick={() => router.push('/taller/nuevo')}
          className="btn-primary"
        >
          + Registrar Nuevo Servicio
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="card text-center">
          <p className="text-gray-600 text-sm">Total</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</h3>
        </div>
        <div className="card text-center">
          <p className="text-gray-600 text-sm">Recibidos</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1">{stats.recibido}</h3>
        </div>
        <div className="card text-center">
          <p className="text-gray-600 text-sm">Diagnóstico</p>
          <h3 className="text-2xl font-bold text-yellow-600 mt-1">{stats.diagnostico}</h3>
        </div>
        <div className="card text-center">
          <p className="text-gray-600 text-sm">Reparando</p>
          <h3 className="text-2xl font-bold text-orange-600 mt-1">{stats.reparando}</h3>
        </div>
        <div className="card text-center">
          <p className="text-gray-600 text-sm">Listos</p>
          <h3 className="text-2xl font-bold text-green-600 mt-1">{stats.listo}</h3>
        </div>
        <div className="card text-center">
          <p className="text-gray-600 text-sm">Entregados</p>
          <h3 className="text-2xl font-bold text-gray-600 mt-1">{stats.entregado}</h3>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Buscar por cliente, teléfono, referencia o marca
            </label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="input"
            >
              <option value="todos">Todos los estados</option>
              <option value="recibido">Recibido</option>
              <option value="diagnostico">En Diagnóstico</option>
              <option value="reparando">Reparando</option>
              <option value="listo">Listo</option>
              <option value="entregado">Entregado</option>
              <option value="sin_solucion">Sin Solución</option>
              <option value="abandonado">Abandonado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Servicios Registrados ({serviciosFiltrados.length})
        </h3>

        {serviciosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {busqueda || filtroEstado !== 'todos' 
                ? 'No se encontraron servicios con los filtros aplicados' 
                : 'No hay servicios registrados aún'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingreso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviciosFiltrados.map((servicio) => (
                  <tr key={servicio.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          #{servicio.id}
                        </span>
                        {getTipoServicioBadge(servicio.tipo_servicio)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{servicio.nombre_cliente}</div>
                      <div className="text-sm text-gray-500">{servicio.telefono}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{servicio.tipo_equipo}</div>
                      <div className="text-sm text-gray-500">{servicio.marca} - {servicio.referencia}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(servicio.fecha_ingreso).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {getEstadoBadge(servicio.estado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => router.push(`/taller/${servicio.id}`)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Ver Detalle →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
