'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NuevoServicioTaller() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
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
    valor_servicio: 0,
    abono: 0
  })
  const [fotos, setFotos] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])

  const tiposServicio = [
    { value: 'mantenimiento', label: '🧹 Mantenimiento', desc: 'Limpieza y mantenimiento preventivo' },
    { value: 'reparacion', label: '🔧 Reparación', desc: 'Reparar fallas o daños' },
    { value: 'revision', label: '🔍 Revisión', desc: 'Diagnóstico y cotización' }
  ]

  const tiposEquipo = [
    'Computador',
    'Portátil',
    'Impresora',
    'Monitor',
    'Tablet',
    'Celular',
    'Router',
    'Switch',
    'DVR',
    'Cámara',
    'Otro'
  ]

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files)
    
    // Validar máximo 10 fotos
    if (fotos.length + files.length > 10) {
      alert('Máximo 10 fotos permitidas')
      return
    }

    // Validar tamaño (5MB por foto)
    const oversized = files.filter(f => f.size > 5 * 1024 * 1024)
    if (oversized.length > 0) {
      alert('Algunas fotos superan el límite de 5MB')
      return
    }

    // Crear previews
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setPreviewUrls(prev => [...prev, ...newPreviews])
    setFotos(prev => [...prev, ...files])
  }

  function removePhoto(index) {
    setFotos(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  async function subirFotos() {
    if (fotos.length === 0) return []

    setUploading(true)
    const urls = []

    try {
      for (const foto of fotos) {
        const fileName = `${Date.now()}-${foto.name}`
        const { data, error } = await supabase.storage
          .from('taller-fotos')
          .upload(fileName, foto)

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from('taller-fotos')
          .getPublicUrl(fileName)

        urls.push(publicUrl)
      }

      return urls
    } catch (error) {
      console.error('Error al subir fotos:', error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    // Validaciones
    if (!formData.nombre_cliente.trim()) {
      alert('El nombre del cliente es obligatorio')
      return
    }
    if (!formData.telefono.trim()) {
      alert('El teléfono es obligatorio')
      return
    }
    if (!formData.referencia.trim()) {
      alert('La referencia del equipo es obligatoria')
      return
    }
    if (!formData.marca.trim()) {
      alert('La marca es obligatoria')
      return
    }

    // Validar que el abono no sea mayor al valor
    if (parseFloat(formData.abono) > parseFloat(formData.valor_servicio)) {
      alert('El abono no puede ser mayor al valor del servicio')
      return
    }

    setLoading(true)

    try {
      // Subir fotos
      const fotosUrls = await subirFotos()

      // Obtener vendedor_id del usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      
      // Guardar servicio
      const { data, error } = await supabase
        .from('taller')
        .insert([{
          vendedor_id: user?.id || 1,
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
          fotos: fotosUrls,
          estado: 'recibido',
          valor_servicio: parseFloat(formData.valor_servicio) || 0,
          abono: parseFloat(formData.abono) || 0
        }])
        .select()

      if (error) throw error

      alert('✅ Servicio registrado exitosamente')
      router.push(`/taller/${data[0].id}`)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al registrar el servicio: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const totalPagar = (parseFloat(formData.valor_servicio) || 0) - (parseFloat(formData.abono) || 0)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🛠️ Registrar Servicio en Taller</h1>
          <p className="text-gray-600 mt-2">Registra un nuevo servicio de mantenimiento, reparación o revisión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Servicio <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tiposServicio.map(tipo => (
                <label
                  key={tipo.value}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                    formData.tipo_servicio === tipo.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="tipo_servicio"
                    value={tipo.value}
                    checked={formData.tipo_servicio === tipo.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-2">{tipo.label.split(' ')[0]}</div>
                    <div className="font-medium text-gray-800">{tipo.label.split(' ')[1]}</div>
                    <div className="text-xs text-gray-500 mt-1">{tipo.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Cliente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre_cliente"
                  value={formData.nombre_cliente}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  onChange={handleChange}
                  placeholder="Ej: 3001234567"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Información del Equipo */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Equipo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referencia del Equipo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="referencia"
                  value={formData.referencia}
                  onChange={handleChange}
                  placeholder="Ej: HP Pavilion 15"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Equipo <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipo_equipo"
                  value={formData.tipo_equipo}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {tiposEquipo.map(tipo => (
                    <option key={tipo} value={tipo.toLowerCase()}>{tipo}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  placeholder="Ej: HP, Dell, Lenovo, Canon, Epson, etc."
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Accesorios */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Accesorios que Trae</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="trae_cables"
                  checked={formData.trae_cables}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-gray-700">📌 Cables</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="trae_cargador"
                  checked={formData.trae_cargador}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-gray-700">🔌 Cargador</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="trae_caja"
                  checked={formData.trae_caja}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-gray-700">📦 Caja</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Otros Accesorios
              </label>
              <input
                type="text"
                name="otros_accesorios"
                value={formData.otros_accesorios}
                onChange={handleChange}
                placeholder="Ej: Mouse inalámbrico, funda, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Información de Pago */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Información de Pago</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor del Servicio
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    name="valor_servicio"
                    value={formData.valor_servicio}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abono
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    name="abono"
                    value={formData.abono}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total a Pagar
                </label>
                <div className={`px-4 py-2 border-2 rounded-lg font-bold text-lg ${
                  totalPagar > 0 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'
                }`}>
                  ${totalPagar.toLocaleString('es-CO')}
                </div>
              </div>
            </div>
            {totalPagar < 0 && (
              <p className="text-red-600 text-sm mt-2">⚠️ El abono no puede ser mayor al valor del servicio</p>
            )}
          </div>

          {/* Observaciones */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Observaciones del Estado</h3>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows="4"
              placeholder="Describe el estado del equipo, rayones, golpes, partes faltantes, etc..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              💡 Ejemplo: Equipo con tapa trasera suelta, rayones laterales, pantalla en buen estado
            </p>
          </div>

          {/* Fotos del Equipo */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📸 Fotos del Equipo</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="foto-upload"
                disabled={fotos.length >= 10}
              />
              <label
                htmlFor="foto-upload"
                className={`cursor-pointer inline-block ${
                  fotos.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="text-4xl mb-4">📷</div>
                <p className="text-gray-600 mb-2">
                  Click para seleccionar imágenes o arrastra y suelta
                </p>
                <p className="text-sm text-gray-500">
                  Máximo 10 fotos • 5MB por foto
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {fotos.length}/10 fotos seleccionadas
                </p>
              </label>
            </div>

            {/* Preview de fotos */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aviso Legal */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800 font-medium">
                  Aviso Legal Importante:
                </p>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>De acuerdo con el <strong>Código de Comercio de Colombia, Artículo 969</strong> y siguientes sobre el contrato de depósito mercantil</li>
                  <li>Después de <strong>90 días calendario</strong>, si un equipo no es reclamado a pesar de haberlo notificado, podrá ser considerado como <strong>PRODUCTO ABANDONADO</strong></li>
                  <li>Vendedor podrá hacer uso del artículo para su disposición correspondiente</li>
                  <li>Devolucion o descarte según corresponda</li>
                </ul>
                <p className="mt-2 text-sm text-yellow-800">
                  ✅ El cliente será notificado cuando se acerque el límite de 90 días
                </p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/taller')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              disabled={loading || uploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || uploading || totalPagar < 0}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Guardando...' : uploading ? '📤 Subiendo fotos...' : '✅ Registrar Servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
