'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export default function DetalleGarantia() {
  const [garantia, setGarantia] = useState(null)
  const [fotos, setFotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editandoEstado, setEditandoEstado] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [viendoFoto, setViendoFoto] = useState(null)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    loadGarantia()
  }, [params.id, router])

  const loadGarantia = async () => {
    try {
      const { data, error } = await supabase
        .from('garantias')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setGarantia(data)
      setNuevoEstado(data.estado)

      // Cargar fotos de evidencia
      const { data: fotosData, error: fotosError } = await supabase
        .from('garantias_fotos')
        .select('*')
        .eq('garantia_id', params.id)
        .order('created_at', { ascending: true })

      if (fotosError) throw fotosError
      setFotos(fotosData || [])
    } catch (error) {
      console.error('Error loading garantia:', error)
      alert('Error al cargar garantía')
    } finally {
      setLoading(false)
    }
  }

  const handleActualizarEstado = async () => {
    try {
      const { error } = await supabase
        .from('garantias')
        .update({ estado: nuevoEstado })
        .eq('id', params.id)

      if (error) throw error

      setGarantia({ ...garantia, estado: nuevoEstado })
      setEditandoEstado(false)
      alert('Estado actualizado correctamente')
    } catch (error) {
      console.error('Error updating estado:', error)
      alert('Error al actualizar estado')
    }
  }

  const getEstadoColor = (estado) => {
    const colors = {
      recibido: 'bg-blue-100 text-blue-800 border-blue-300',
      en_revision: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      reparado: 'bg-green-100 text-green-800 border-green-300',
      entregado: 'bg-gray-100 text-gray-800 border-gray-300',
      sin_solucion: 'bg-red-100 text-red-800 border-red-300',
    }
    return colors[estado] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getEstadoLabel = (estado) => {
    const labels = {
      recibido: 'Recibido',
      en_revision: 'En Revisión',
      reparado: 'Reparado',
      entregado: 'Entregado',
      sin_solucion: 'Sin Solución',
    }
    return labels[estado] || estado
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  if (!garantia) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">Garantía no encontrada</p>
        <button onClick={() => router.push('/garantias')} className="btn-primary">
          Volver a Garantías
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Detalle de Garantía #{garantia.id}</h1>
          <p className="text-gray-600 mt-1">
            Registrada el {format(new Date(garantia.created_at), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
        <button
          onClick={() => router.push('/garantias')}
          className="btn-secondary"
        >
          ← Volver
        </button>
      </div>

      {/* Estado */}
      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Estado Actual</h2>
            {!editandoEstado ? (
              <span className={`inline-block px-4 py-2 rounded-lg font-medium border-2 ${getEstadoColor(garantia.estado)}`}>
                {getEstadoLabel(garantia.estado)}
              </span>
            ) : (
              <div className="flex items-center space-x-3">
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  className="input-field"
                >
                  <option value="recibido">Recibido</option>
                  <option value="en_revision">En Revisión</option>
                  <option value="reparado">Reparado</option>
                  <option value="entregado">Entregado</option>
                  <option value="sin_solucion">Sin Solución</option>
                </select>
                <button onClick={handleActualizarEstado} className="btn-primary">
                  Guardar
                </button>
                <button onClick={() => setEditandoEstado(false)} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            )}
          </div>
          {!editandoEstado && (
            <button
              onClick={() => setEditandoEstado(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Cambiar Estado
            </button>
          )}
        </div>
      </div>

      {/* Datos del Cliente */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Datos del Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Nombre</label>
            <p className="text-gray-900 font-medium">{garantia.nombre_cliente}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">NIT / Cédula</label>
            <p className="text-gray-900 font-medium">{garantia.documento}</p>
          </div>
        </div>
      </div>

      {/* Datos del Producto */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🔧 Datos del Producto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Referencia</label>
            <p className="text-gray-900 font-medium">{garantia.referencia}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Marca</label>
            <p className="text-gray-900 font-medium">{garantia.marca}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Tipo de Equipo</label>
            <p className="text-gray-900 font-medium capitalize">
              {garantia.tipo_equipo.replace('_', ' ')}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Fecha de Compra</label>
            <p className="text-gray-900 font-medium">
              {garantia.fecha_compra 
                ? format(new Date(garantia.fecha_compra), 'dd/MM/yyyy')
                : 'No especificada'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Descripción de la Falla */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">⚠️ Descripción de la Falla</h2>
        <p className="text-gray-900 whitespace-pre-wrap">{garantia.descripcion_falla}</p>
      </div>

      {/* Accesorios */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📦 Accesorios Incluidos</h2>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <span className={`w-6 h-6 rounded flex items-center justify-center ${garantia.trae_caja ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              {garantia.trae_caja ? '✓' : '✗'}
            </span>
            <span className="text-gray-700">Caja original</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`w-6 h-6 rounded flex items-center justify-center ${garantia.trae_cables ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              {garantia.trae_cables ? '✓' : '✗'}
            </span>
            <span className="text-gray-700">Cables</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`w-6 h-6 rounded flex items-center justify-center ${garantia.trae_cargador ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              {garantia.trae_cargador ? '✓' : '✗'}
            </span>
            <span className="text-gray-700">Cargador</span>
          </div>
        </div>
      </div>

      {/* Observaciones */}
      {garantia.observaciones && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📝 Observaciones</h2>
          <p className="text-gray-900 whitespace-pre-wrap">{garantia.observaciones}</p>
        </div>
      )}

      {/* Fotos de Evidencia */}
      {fotos.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📸 Fotos de Evidencia</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fotos.map((foto) => (
              <div
                key={foto.id}
                className="relative group cursor-pointer"
                onClick={() => setViendoFoto(foto.url_foto)}
              >
                <img
                  src={foto.url_foto}
                  alt={foto.descripcion || 'Evidencia'}
                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                  <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
                {foto.descripcion && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{foto.descripcion}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para ver foto completa */}
      {viendoFoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setViendoFoto(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
              onClick={() => setViendoFoto(null)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={viendoFoto}
              alt="Vista completa"
              className="max-w-full max-h-screen object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Timeline de Estado */}
      <div className="card bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">⏱️ Información de Registro</h2>
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-500">Fecha de Registro:</span>
            <span className="ml-2 text-gray-900">
              {format(new Date(garantia.created_at), 'dd/MM/yyyy HH:mm')}
            </span>
          </div>
          {garantia.updated_at && garantia.updated_at !== garantia.created_at && (
            <div>
              <span className="text-sm font-medium text-gray-500">Última Actualización:</span>
              <span className="ml-2 text-gray-900">
                {format(new Date(garantia.updated_at), 'dd/MM/yyyy HH:mm')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
