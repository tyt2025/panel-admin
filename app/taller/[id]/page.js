'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { jsPDF } from 'jspdf'
import { format } from 'date-fns'

export default function DetalleServicioTaller() {
  const router = useRouter()
  const params = useParams()
  const servicioId = params.id

  const [user, setUser] = useState(null)
  const [servicio, setServicio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actualizandoEstado, setActualizandoEstado] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [mostrarModalFoto, setMostrarModalFoto] = useState(false)
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(userData))
    cargarServicio()
  }, [router, servicioId])

  const cargarServicio = async () => {
    try {
      const { data, error } = await supabase
        .from('taller')
        .select('*')
        .eq('id', servicioId)
        .single()

      if (error) throw error
      setServicio(data)
    } catch (error) {
      console.error('Error al cargar servicio:', error)
      alert('Error al cargar el servicio')
    } finally {
      setLoading(false)
    }
  }

  const actualizarEstado = async (nuevoEstado) => {
    if (!confirm(`¿Cambiar estado a "${getEstadoNombre(nuevoEstado)}"?`)) return

    setActualizandoEstado(true)
    try {
      const updates = {
        estado: nuevoEstado,
        fecha_actualizacion: new Date().toISOString()
      }

      // Si el estado es "entregado", agregar fecha de entrega
      if (nuevoEstado === 'entregado') {
        updates.fecha_entrega = new Date().toISOString()
      }

      const { error } = await supabase
        .from('taller')
        .update(updates)
        .eq('id', servicioId)

      if (error) throw error

      alert('✅ Estado actualizado correctamente')
      cargarServicio()
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      alert('Error al actualizar el estado')
    } finally {
      setActualizandoEstado(false)
    }
  }

  const eliminarServicio = async () => {
    if (!confirm('⚠️ ¿Estás seguro de eliminar este servicio? Esta acción no se puede deshacer.')) return
    if (!confirm('🔴 ÚLTIMA CONFIRMACIÓN: ¿Realmente deseas eliminar este servicio?')) return

    setEliminando(true)
    try {
      const { error } = await supabase
        .from('taller')
        .delete()
        .eq('id', servicioId)

      if (error) throw error

      alert('✅ Servicio eliminado correctamente')
      router.push('/taller')
    } catch (error) {
      console.error('Error al eliminar servicio:', error)
      alert('Error al eliminar el servicio')
    } finally {
      setEliminando(false)
    }
  }

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
      <span className={`px-4 py-2 rounded-full text-sm font-medium ${estilos[estado]}`}>
        {nombres[estado]}
      </span>
    )
  }

  const getEstadoNombre = (estado) => {
    const nombres = {
      recibido: 'Recibido',
      diagnostico: 'En Diagnóstico',
      reparando: 'Reparando',
      listo: 'Listo',
      entregado: 'Entregado',
      sin_solucion: 'Sin Solución',
      abandonado: 'Abandonado'
    }
    return nombres[estado]
  }

  const getTipoServicioInfo = (tipo) => {
    const info = {
      mantenimiento: { nombre: '🔧 Mantenimiento', color: 'text-blue-600' },
      reparacion: { nombre: '⚙️ Reparación', color: 'text-red-600' },
      revision: { nombre: '🔍 Revisión', color: 'text-green-600' }
    }
    return info[tipo]
  }

  const generarPDF = async () => {
    try {
      const doc = new jsPDF()
      
      // Colores
      const primaryColor = [240, 0, 0] // Rojo
      const textColor = [51, 51, 51]
      
      // Header con logo y empresa
      doc.setFillColor(...primaryColor)
      doc.rect(0, 0, 220, 40, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.text('TINTAS Y TECNOLOGÍA', 105, 15, { align: 'center' })
      
      doc.setFontSize(11)
      doc.text('Comprobante de Servicio Técnico', 105, 25, { align: 'center' })
      
      doc.setFontSize(9)
      doc.text('Calle 14 # 5-44 local 1 Barrio Centro, Santa Marta', 105, 32, { align: 'center' })
      doc.text('WhatsApp: 3102605693 - 3122405144', 105, 37, { align: 'center' })
      
      doc.setTextColor(...textColor)
      let yPos = 50
      
      // Número de Servicio y Tipo
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      const tipoServicioInfo = getTipoServicioInfo(servicio.tipo_servicio)
      doc.text(`SERVICIO #${servicio.id}`, 20, yPos)
      yPos += 7
      
      doc.setFontSize(11)
      doc.text(tipoServicioInfo.nombre, 20, yPos)
      yPos += 7
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Fecha de ingreso: ${format(new Date(servicio.fecha_ingreso), 'dd/MM/yyyy')}`, 20, yPos)
      yPos += 10
      
      // Estado
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('ESTADO:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(getEstadoNombre(servicio.estado).toUpperCase(), 50, yPos)
      yPos += 10
      
      // Línea separadora
      doc.setDrawColor(200, 200, 200)
      doc.line(20, yPos, 190, yPos)
      yPos += 8
      
      // Datos del Cliente
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('DATOS DEL CLIENTE', 20, yPos)
      yPos += 7
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('Nombre:', 20, yPos)
      doc.text(servicio.cliente_nombre || 'No especificado', 50, yPos)
      yPos += 6
      
      doc.text('Teléfono:', 20, yPos)
      doc.text(servicio.cliente_telefono || 'No especificado', 50, yPos)
      yPos += 10
      
      // Línea separadora
      doc.line(20, yPos, 190, yPos)
      yPos += 8
      
      // Datos del Equipo
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('DATOS DEL EQUIPO', 20, yPos)
      yPos += 7
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('Tipo:', 20, yPos)
      doc.text(servicio.tipo_equipo || 'No especificado', 50, yPos)
      yPos += 6
      
      doc.text('Marca:', 20, yPos)
      doc.text(servicio.marca || 'No especificada', 50, yPos)
      yPos += 6
      
      doc.text('Referencia:', 20, yPos)
      doc.text(servicio.referencia || 'No especificada', 50, yPos)
      yPos += 10
      
      // Línea separadora
      doc.line(20, yPos, 190, yPos)
      yPos += 8
      
      // Accesorios
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('ACCESORIOS INCLUIDOS', 20, yPos)
      yPos += 7
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`${servicio.trae_cables ? '✓' : '✗'} Cables`, 25, yPos)
      yPos += 6
      doc.text(`${servicio.trae_cargador ? '✓' : '✗'} Cargador`, 25, yPos)
      yPos += 6
      doc.text(`${servicio.trae_caja ? '✓' : '✗'} Caja`, 25, yPos)
      yPos += 6
      
      if (servicio.otros_accesorios) {
        doc.text('Otros:', 25, yPos)
        doc.text(servicio.otros_accesorios, 45, yPos)
        yPos += 6
      }
      yPos += 4
      
      // Observaciones
      if (servicio.observaciones) {
        if (yPos > 240) {
          doc.addPage()
          yPos = 20
        }
        doc.line(20, yPos, 190, yPos)
        yPos += 8
        
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('OBSERVACIONES', 20, yPos)
        yPos += 7
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        const obsLines = doc.splitTextToSize(servicio.observaciones, 170)
        obsLines.forEach(line => {
          if (yPos > 260) {
            doc.addPage()
            yPos = 20
          }
          doc.text(line, 20, yPos)
          yPos += 5
        })
        yPos += 5
      }
      
      // Precio Estimado
      if (servicio.precio_estimado && servicio.precio_estimado > 0) {
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
        doc.line(20, yPos, 190, yPos)
        yPos += 8
        
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('PRECIO ESTIMADO', 20, yPos)
        yPos += 7
        
        doc.setFontSize(14)
        doc.text(`$${Math.round(servicio.precio_estimado).toLocaleString('es-CO')}`, 20, yPos)
        yPos += 10
      }
      
      // Información Legal
      if (yPos > 230) {
        doc.addPage()
        yPos = 20
      }
      doc.line(20, yPos, 190, yPos)
      yPos += 8
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('INFORMACIÓN IMPORTANTE', 20, yPos)
      yPos += 7
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text('• Según la Ley 1480 de 2011, los equipos no reclamados después de 90 días', 20, yPos)
      yPos += 4
      doc.text('  se consideran abandonados y pueden ser dispuestos por el establecimiento.', 20, yPos)
      yPos += 4
      const diasTranscurridos = Math.floor((new Date() - new Date(servicio.fecha_ingreso)) / (1000 * 60 * 60 * 24))
      const diasRestantes = 90 - diasTranscurridos
      doc.text(`• Días transcurridos: ${diasTranscurridos} | Días restantes: ${diasRestantes > 0 ? diasRestantes : 'EQUIPO ABANDONADO'}`, 20, yPos)
      yPos += 4
      doc.text('• Conserve este comprobante para reclamar su equipo.', 20, yPos)
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        
        let footerY = 270
        doc.setDrawColor(200, 200, 200)
        doc.line(20, footerY, 190, footerY)
        footerY += 5
        
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text('Tintas y Tecnología | tintasytecnologia2018@gmail.com', 105, footerY, { align: 'center' })
        footerY += 4
        doc.text('www.tintasytecnologia.com | Horario: Lun-Sáb 8:00am-6:20pm', 105, footerY, { align: 'center' })
        footerY += 4
        doc.text(`Página ${i} de ${pageCount} | Servicio #${servicio.id}`, 105, footerY, { align: 'center' })
      }
      
      // Descargar PDF
      doc.save(`Servicio-Taller-${servicio.id}.pdf`)
      
    } catch (error) {
      console.error('Error al generar PDF:', error)
      alert('Error al generar el PDF')
    }
  }

  const calcularDiasTranscurridos = (fechaIngreso) => {
    const inicio = new Date(fechaIngreso)
    const hoy = new Date()
    const diferencia = Math.floor((hoy - inicio) / (1000 * 60 * 60 * 24))
    return diferencia
  }

  const abrirModalFoto = (url) => {
    setFotoSeleccionada(url)
    setMostrarModalFoto(true)
  }

  const cerrarModalFoto = () => {
    setMostrarModalFoto(false)
    setFotoSeleccionada(null)
  }

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando servicio...</div>
      </div>
    )
  }

  if (!servicio) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Servicio no encontrado</p>
        <button onClick={() => router.push('/taller')} className="btn-primary mt-4">
          Volver a Taller
        </button>
      </div>
    )
  }

  const diasTranscurridos = calcularDiasTranscurridos(servicio.fecha_ingreso)
  const diasRestantes = 90 - diasTranscurridos
  const tipoServicioInfo = getTipoServicioInfo(servicio.tipo_servicio)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <button 
            onClick={() => router.push('/taller')}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
          >
            ← Volver a Taller
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Servicio #{servicio.id}</h1>
          <p className={`text-xl font-semibold mt-1 ${tipoServicioInfo.color}`}>
            {tipoServicioInfo.nombre}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <button
            onClick={generarPDF}
            className="btn-primary"
          >
            📄 Descargar PDF
          </button>
          {getEstadoBadge(servicio.estado)}
        </div>
      </div>

      {/* Alerta de Tiempo */}
      <div className={`card ${diasRestantes < 30 ? 'bg-red-50 border-2 border-red-200' : diasRestantes < 60 ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-blue-50 border-2 border-blue-200'}`}>
        <div className="flex items-start">
          <span className="text-2xl mr-3">
            {diasRestantes < 30 ? '🚨' : diasRestantes < 60 ? '⚠️' : '📅'}
          </span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Tiempo en Taller</h3>
            <p className="text-sm text-gray-700 mt-1">
              <strong>{diasTranscurridos} días</strong> desde el ingreso
              {diasRestantes > 0 ? (
                <> • Quedan <strong>{diasRestantes} días</strong> antes de considerarse abandonado</>
              ) : (
                <> • <strong className="text-red-600">Producto abandonado según ley</strong></>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Información del Cliente */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">👤 Información del Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Nombre</p>
            <p className="font-semibold text-gray-900">{servicio.nombre_cliente}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Teléfono</p>
            <p className="font-semibold text-gray-900">{servicio.telefono}</p>
          </div>
        </div>
      </div>

      {/* Información del Equipo */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">💻 Información del Equipo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Tipo de Equipo</p>
            <p className="font-semibold text-gray-900">{servicio.tipo_equipo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Marca</p>
            <p className="font-semibold text-gray-900">{servicio.marca}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Referencia / Modelo</p>
            <p className="font-semibold text-gray-900">{servicio.referencia}</p>
          </div>
        </div>
      </div>

      {/* Accesorios */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📦 Accesorios que Trae</h3>
        <div className="flex flex-wrap gap-3">
          {servicio.trae_cables && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              ✓ Cables
            </span>
          )}
          {servicio.trae_cargador && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              ✓ Cargador
            </span>
          )}
          {servicio.trae_caja && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              ✓ Caja
            </span>
          )}
          {!servicio.trae_cables && !servicio.trae_cargador && !servicio.trae_caja && (
            <span className="text-gray-500">Sin accesorios estándar</span>
          )}
        </div>
        {servicio.otros_accesorios && (
          <div className="mt-3">
            <p className="text-sm text-gray-600">Otros Accesorios:</p>
            <p className="font-medium text-gray-900">{servicio.otros_accesorios}</p>
          </div>
        )}
      </div>

      {/* Observaciones */}
      {servicio.observaciones && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📝 Observaciones del Estado</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{servicio.observaciones}</p>
        </div>
      )}

      {/* Fotos */}
      {servicio.fotos && servicio.fotos.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📸 Fotos del Equipo ({servicio.fotos.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {servicio.fotos.map((url, index) => (
              <div 
                key={index} 
                className="cursor-pointer hover:opacity-80 transition"
                onClick={() => abrirModalFoto(url)}
              >
                <img 
                  src={url} 
                  alt={`Foto ${index + 1}`}
                  className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fechas */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 Fechas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Fecha de Ingreso</p>
            <p className="font-semibold text-gray-900">
              {new Date(servicio.fecha_ingreso).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Última Actualización</p>
            <p className="font-semibold text-gray-900">
              {new Date(servicio.fecha_actualizacion).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          {servicio.fecha_entrega && (
            <div>
              <p className="text-sm text-gray-600">Fecha de Entrega</p>
              <p className="font-semibold text-gray-900">
                {new Date(servicio.fecha_entrega).toLocaleDateString('es-CO', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cambiar Estado */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🔄 Cambiar Estado del Servicio</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => actualizarEstado('recibido')}
            disabled={actualizandoEstado || servicio.estado === 'recibido'}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📥 Recibido
          </button>
          <button
            onClick={() => actualizarEstado('diagnostico')}
            disabled={actualizandoEstado || servicio.estado === 'diagnostico'}
            className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔍 Diagnóstico
          </button>
          <button
            onClick={() => actualizarEstado('reparando')}
            disabled={actualizandoEstado || servicio.estado === 'reparando'}
            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⚙️ Reparando
          </button>
          <button
            onClick={() => actualizarEstado('listo')}
            disabled={actualizandoEstado || servicio.estado === 'listo'}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Listo
          </button>
          <button
            onClick={() => actualizarEstado('entregado')}
            disabled={actualizandoEstado || servicio.estado === 'entregado'}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📤 Entregado
          </button>
          <button
            onClick={() => actualizarEstado('sin_solucion')}
            disabled={actualizandoEstado || servicio.estado === 'sin_solucion'}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ❌ Sin Solución
          </button>
          <button
            onClick={() => actualizarEstado('abandonado')}
            disabled={actualizandoEstado || servicio.estado === 'abandonado'}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🚫 Abandonado
          </button>
        </div>
      </div>

      {/* Botón Eliminar */}
      <div className="card bg-red-50 border-2 border-red-200">
        <h3 className="text-lg font-semibold text-red-800 mb-2">🗑️ Zona de Peligro</h3>
        <p className="text-sm text-gray-700 mb-4">
          Una vez eliminado, no podrás recuperar este servicio.
        </p>
        <button
          onClick={eliminarServicio}
          disabled={eliminando}
          className="btn-danger"
        >
          {eliminando ? 'Eliminando...' : 'Eliminar Servicio'}
        </button>
      </div>

      {/* Modal para ver foto en grande */}
      {mostrarModalFoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={cerrarModalFoto}
        >
          <div className="relative max-w-4xl max-h-screen">
            <button
              onClick={cerrarModalFoto}
              className="absolute top-4 right-4 bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold hover:bg-gray-200"
            >
              ×
            </button>
            <img 
              src={fotoSeleccionada} 
              alt="Foto ampliada"
              className="max-w-full max-h-screen object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
