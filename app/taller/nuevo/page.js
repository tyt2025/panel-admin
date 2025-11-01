'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NuevoServicioTaller() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [formData, setFormData] = useState({
    tipo_servicio: 'reparacion',
    nombre_cliente: '',
    telefono: '',
    referencia: '',
    tipo_equipo: 'computador',
    marca: '',
    trae_cables: false,
    trae_cargador: false,
    trae_caja: false,
    otros_accesorios: '',
    observaciones: '',
    estado: 'recibido'
  })
  const [fotosSeleccionadas, setFotosSeleccionadas] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    
    // Validar tamaño (máx 5MB por foto)
    const archivosValidos = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} es muy grande. Máximo 5MB por foto.`)
        return false
      }
      return true
    })

    // Validar formato
    const formatosValidos = archivosValidos.filter(file => {
      const tipo = file.type
      if (!tipo.startsWith('image/')) {
        alert(`${file.name} no es una imagen válida.`)
        return false
      }
      return true
    })

    // Agregar nuevas fotos (máximo 10 fotos en total)
    const fotosActuales = fotosSeleccionadas.length
    const espacioDisponible = 10 - fotosActuales
    
    if (formatosValidos.length > espacioDisponible) {
      alert(`Solo puedes subir ${espacioDisponible} fotos más. Máximo 10 fotos en total.`)
      return
    }

    // Crear URLs de preview
    const newPreviewUrls = formatosValidos.map(file => URL.createObjectURL(file))
    
    setFotosSeleccionadas(prev => [...prev, ...formatosValidos])
    setPreviewUrls(prev => [...prev, ...newPreviewUrls])
  }

  const eliminarFoto = (index) => {
    // Liberar URL del preview
    URL.revokeObjectURL(previewUrls[index])
    
    setFotosSeleccionadas(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const subirFotos = async () => {
    if (fotosSeleccionadas.length === 0) return []

    setUploadingPhotos(true)
    const fotosUrls = []

    try {
      for (const foto of fotosSeleccionadas) {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        const extension = foto.name.split('.').pop()
        const nombreArchivo = `${timestamp}-${random}.${extension}`
        const rutaCompleta = `TALLER_FOTOS/${nombreArchivo}`

        const { data, error } = await supabase.storage
          .from('taller-fotos')
          .upload(rutaCompleta, foto)

        if (error) throw error

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('taller-fotos')
          .getPublicUrl(rutaCompleta)

        fotosUrls.push(urlData.publicUrl)
      }

      return fotosUrls
    } catch (error) {
      console.error('Error al subir fotos:', error)
      alert('Error al subir las fotos. Intenta de nuevo.')
      return []
    } finally {
      setUploadingPhotos(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validaciones
    if (!formData.nombre_cliente.trim()) {
      alert('El nombre del cliente es obligatorio')
      return
    }
    if (!formData.telefono.trim()) {
      alert('El teléfono del cliente es obligatorio')
      return
    }
    if (!formData.referencia.trim()) {
      alert('La referencia del equipo es obligatoria')
      return
    }
    if (!formData.marca.trim()) {
      alert('La marca del equipo es obligatoria')
      return
    }

    setLoading(true)

    try {
      // Obtener usuario actual
      const userData = localStorage.getItem('user')
      if (!userData) {
        router.push('/login')
        return
      }
      const user = JSON.parse(userData)

      // Subir fotos si hay
      const fotosUrls = await subirFotos()

      // Guardar servicio
      const { data, error } = await supabase
        .from('taller')
        .insert({
          vendedor_id: user.vendedor_id,
          tipo_servicio: formData.tipo_servicio,
          nombre_cliente: formData.nombre_cliente.trim(),
          telefono: formData.telefono.trim(),
          referencia: formData.referencia.trim(),
          tipo_equipo: formData.tipo_equipo,
          marca: formData.marca.trim(),
          trae_cables: formData.trae_cables,
          trae_cargador: formData.trae_cargador,
          trae_caja: formData.trae_caja,
          otros_accesorios: formData.otros_accesorios.trim() || null,
          observaciones: formData.observaciones.trim() || null,
          fotos: fotosUrls.length > 0 ? fotosUrls : null,
          estado: formData.estado
        })
        .select()

      if (error) throw error

      alert('✅ Servicio registrado exitosamente')
      router.push('/taller')
    } catch (error) {
      console.error('Error al registrar servicio:', error)
      alert('Error al registrar el servicio. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🛠️ Registrar Servicio en Taller</h1>
        <p className="text-gray-600 mt-1">Registra un nuevo servicio de mantenimiento, reparación o revisión</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Servicio */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tipo de Servicio</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
              formData.tipo_servicio === 'mantenimiento' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300'
            }`}>
              <input
                type="radio"
                name="tipo_servicio"
                value="mantenimiento"
                checked={formData.tipo_servicio === 'mantenimiento'}
                onChange={handleInputChange}
                className="mr-3"
              />
              <div>
                <div className="font-semibold text-gray-900">🔧 Mantenimiento</div>
                <div className="text-sm text-gray-600">Limpieza y mantenimiento preventivo</div>
              </div>
            </label>

            <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
              formData.tipo_servicio === 'reparacion' 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-200 hover:border-red-300'
            }`}>
              <input
                type="radio"
                name="tipo_servicio"
                value="reparacion"
                checked={formData.tipo_servicio === 'reparacion'}
                onChange={handleInputChange}
                className="mr-3"
              />
              <div>
                <div className="font-semibold text-gray-900">⚙️ Reparación</div>
                <div className="text-sm text-gray-600">Reparar fallas o daños</div>
              </div>
            </label>

            <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
              formData.tipo_servicio === 'revision' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-green-300'
            }`}>
              <input
                type="radio"
                name="tipo_servicio"
                value="revision"
                checked={formData.tipo_servicio === 'revision'}
                onChange={handleInputChange}
                className="mr-3"
              />
              <div>
                <div className="font-semibold text-gray-900">🔍 Revisión</div>
                <div className="text-sm text-gray-600">Diagnóstico y cotización</div>
              </div>
            </label>
          </div>
        </div>

        {/* Datos del Cliente */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos del Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Cliente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombre_cliente"
                value={formData.nombre_cliente}
                onChange={handleInputChange}
                placeholder="Nombre completo"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="3001234567"
                className="input"
                required
              />
            </div>
          </div>
        </div>

        {/* Datos del Equipo */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos del Equipo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referencia / Modelo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="referencia"
                value={formData.referencia}
                onChange={handleInputChange}
                placeholder="Ej: HP Pavilion 15, Canon MG2410"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Equipo <span className="text-red-500">*</span>
              </label>
              <select
                name="tipo_equipo"
                value={formData.tipo_equipo}
                onChange={handleInputChange}
                className="input"
                required
              >
                <option value="computador">💻 Computador</option>
                <option value="portatil">🖥️ Portátil</option>
                <option value="impresora">🖨️ Impresora</option>
                <option value="parlante">🔊 Parlante</option>
                <option value="teclado">⌨️ Teclado</option>
                <option value="mouse">🖱️ Mouse</option>
                <option value="monitor">🖥️ Monitor</option>
                <option value="tablet">📱 Tablet</option>
                <option value="otro">📦 Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marca <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleInputChange}
                placeholder="Ej: HP, Dell, Lenovo, Canon"
                className="input"
                required
              />
            </div>
          </div>
        </div>

        {/* Accesorios */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Accesorios que Trae</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="trae_cables"
                checked={formData.trae_cables}
                onChange={handleInputChange}
                className="mr-3 w-5 h-5 text-blue-600"
              />
              <span className="text-gray-700">🔌 Cables</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="trae_cargador"
                checked={formData.trae_cargador}
                onChange={handleInputChange}
                className="mr-3 w-5 h-5 text-blue-600"
              />
              <span className="text-gray-700">🔋 Cargador</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="trae_caja"
                checked={formData.trae_caja}
                onChange={handleInputChange}
                className="mr-3 w-5 h-5 text-blue-600"
              />
              <span className="text-gray-700">📦 Caja</span>
            </label>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Otros Accesorios
            </label>
            <input
              type="text"
              name="otros_accesorios"
              value={formData.otros_accesorios}
              onChange={handleInputChange}
              placeholder="Ej: Mouse inalámbrico, audífonos, manuales, etc."
              className="input"
            />
          </div>
        </div>

        {/* Observaciones */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Observaciones del Estado</h3>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleInputChange}
            placeholder="Describe el estado del equipo: rayones, golpes, partes faltantes, etc."
            rows={4}
            className="input"
          />
          <p className="text-sm text-gray-500 mt-2">
            💡 Anota cualquier daño visible, rayones, golpes, partes sueltas, etc.
          </p>
        </div>

        {/* Carga de Fotos */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Fotos del Equipo</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subir Fotos (Opcional - Máximo 10 fotos, 5MB cada una)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formatos: JPG, PNG, GIF, WEBP • Máximo 5MB por foto • Hasta 10 fotos
              </p>
            </div>

            {/* Preview de Fotos */}
            {previewUrls.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Fotos Seleccionadas ({previewUrls.length}/10)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => eliminarFoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Aviso Legal */}
        <div className="card bg-yellow-50 border-2 border-yellow-200">
          <div className="flex items-start">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Aviso Legal Importante</h3>
              <p className="text-sm text-gray-700 mb-2">
                De acuerdo con el <strong>Código de Comercio de Colombia, Artículos 669 y siguientes</strong> sobre el contrato de depósito mercantil, 
                después de <strong>90 días calendario</strong> sin que el cliente reclame su equipo, este será considerado como <strong>PRODUCTO ABANDONADO</strong>.
              </p>
              <p className="text-sm text-gray-700 mb-2">
                Tintas y Tecnología no se hará responsable por productos abandonados después de este periodo. El equipo podrá ser:
              </p>
              <ul className="text-sm text-gray-700 list-disc list-inside space-y-1 ml-4">
                <li>Vendido para recuperar costos de almacenamiento</li>
                <li>Reciclado o desechado según corresponda</li>
                <li>Donado a instituciones sin ánimo de lucro</li>
              </ul>
              <p className="text-xs text-gray-600 mt-3 font-semibold">
                📅 El cliente será notificado antes de que se cumpla el plazo de 90 días
              </p>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/taller')}
            className="btn-secondary flex-1"
            disabled={loading || uploadingPhotos}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={loading || uploadingPhotos}
          >
            {loading ? 'Guardando...' : uploadingPhotos ? 'Subiendo fotos...' : '✅ Registrar Servicio'}
          </button>
        </div>
      </form>
    </div>
  )
}
