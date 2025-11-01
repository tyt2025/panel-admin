'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function EditarCotizacion() {
  const params = useParams()
  const router = useRouter()
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCliente, setSelectedCliente] = useState('')
  const [carrito, setCarrito] = useState([])
  const [descuento, setDescuento] = useState(0)
  const [iva, setIva] = useState(0)
  const [observaciones, setObservaciones] = useState('')
  const [validezDias, setValidezDias] = useState(5)
  const [loading, setLoading] = useState(true)
  const [cotizacionOriginal, setCotizacionOriginal] = useState(null)
  const [vendedorId, setVendedorId] = useState(null)
  const [mostrarDesglose, setMostrarDesglose] = useState(false)

  // Estados para Domicilio
  const [incluirDomicilio, setIncluirDomicilio] = useState(false)
  const [domicilios, setDomicilios] = useState([])
  const [searchDomicilio, setSearchDomicilio] = useState('')
  const [selectedDomicilio, setSelectedDomicilio] = useState(null)

  // Estados para Taller
  const [incluirTaller, setIncluirTaller] = useState(false)
  const [tipoServicioTaller, setTipoServicioTaller] = useState('mantenimiento')
  const [precioServicioTaller, setPrecioServicioTaller] = useState(0)
  const [descripcionServicioTaller, setDescripcionServicioTaller] = useState('')

  useEffect(() => {
    // Obtener vendedor_id del usuario
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setVendedorId(user.vendedor_id)
    }
  }, [])

  useEffect(() => {
    if (vendedorId) {
      loadData()
      loadDomicilios()
    }
  }, [params.id, vendedorId])

  const loadDomicilios = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_rates')
        .select('*')
        .order('neighborhood')

      if (error) throw error
      setDomicilios(data || [])
    } catch (error) {
      console.error('Error loading domicilios:', error)
    }
  }

  const loadData = async () => {
    try {
      // Cargar cotización existente
      const { data: cotData } = await supabase
        .from('cotizaciones')
        .select('*, clientes(*)')
        .eq('id', params.id)
        .single()

      // Cargar items de la cotización
      const { data: itemsData } = await supabase
        .from('cotizacion_items')
        .select('*, productos(*)')
        .eq('cotizacion_id', params.id)

      if (cotData) {
        setCotizacionOriginal(cotData)
        setSelectedCliente(cotData.cliente_id)
        setDescuento(cotData.descuento || 0)
        setIva(cotData.iva || 0)
        setObservaciones(cotData.observaciones || '')
        setValidezDias(cotData.validez_dias || 5)
        setMostrarDesglose(cotData.mostrar_desglose_iva || false)

        // Cargar datos de domicilio si existen
        if (cotData.delivery_id) {
          setIncluirDomicilio(true)
          const { data: deliveryData } = await supabase
            .from('delivery_rates')
            .select('*')
            .eq('id', cotData.delivery_id)
            .single()
          
          if (deliveryData) {
            setSelectedDomicilio(deliveryData)
            setSearchDomicilio(deliveryData.neighborhood)
          }
        }

        // Convertir items a formato de carrito
        if (itemsData) {
          const carritoData = itemsData.map(item => ({
            id: item.producto_id,
            product_code: item.productos.product_code,
            product_name: item.productos.product_name,
            description: item.productos.description,
            image_url_png: item.productos.image_url_png,
            cantidad: item.cantidad,
            precio: item.precio_unitario
          }))
          setCarrito(carritoData)
        }
      }

      // Cargar clientes y productos del vendedor
      const [clientesRes, productosRes] = await Promise.all([
        supabase
          .from('clientes')
          .select('*')
          .eq('vendedor_id', vendedorId)
          .order('nombre'),
        supabase
          .from('productos')
          .select('*')
          .order('product_name')
      ])

      setClientes(clientesRes.data || [])
      setProductos(productosRes.data || [])
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar la cotización')
    } finally {
      setLoading(false)
    }
  }

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item.id === producto.id)
    if (existe) {
      setCarrito(carrito.map(item =>
        item.id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ))
    } else {
      setCarrito([...carrito, {
        id: producto.id,
        product_code: producto.product_code,
        product_name: producto.product_name,
        description: producto.description,
        image_url_png: producto.image_url_png,
        cantidad: 1,
        precio: producto.price_cop || producto.price || 0
      }])
    }
  }

  const actualizarCantidad = (id, cantidad) => {
    if (cantidad <= 0) {
      setCarrito(carrito.filter(item => item.id !== id))
    } else {
      setCarrito(carrito.map(item =>
        item.id === id ? { ...item, cantidad } : item
      ))
    }
  }

  const actualizarPrecio = (id, precio) => {
    setCarrito(carrito.map(item =>
      item.id === id ? { ...item, precio: parseFloat(precio) || 0 } : item
    ))
  }

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id))
  }

  const domiciliosFiltrados = domicilios.filter(d =>
    d.neighborhood.toLowerCase().includes(searchDomicilio.toLowerCase())
  )

  const seleccionarDomicilio = (domicilio) => {
    setSelectedDomicilio(domicilio)
    setSearchDomicilio(domicilio.neighborhood)
  }

  const calcularTotales = () => {
    const subtotal = carrito.reduce((sum, item) => 
      sum + (item.cantidad * item.precio), 0
    )
    
    // Si mostrar desglose está activo, los precios incluyen IVA del 19%
    let baseImponible = subtotal
    let ivaMonto = 0
    
    if (mostrarDesglose) {
      // Base imponible = Precio con IVA / 1.19
      baseImponible = subtotal / 1.19
      // IVA = Precio con IVA - Base imponible
      ivaMonto = subtotal - baseImponible
    } else {
      // Lógica antigua cuando no hay desglose
      const descuentoMonto = subtotal * (descuento / 100)
      const subtotalConDescuento = subtotal - descuentoMonto
      ivaMonto = subtotalConDescuento * (iva / 100)
    }
    
    const descuentoMonto = subtotal * (descuento / 100)
    const subtotalConDescuento = subtotal - descuentoMonto
    
    // Agregar domicilio si está activo
    const domicilioMonto = (incluirDomicilio && selectedDomicilio) ? selectedDomicilio.price_cop : 0
    
    // Agregar servicio de taller si está activo
    const tallerMonto = incluirTaller ? (parseFloat(precioServicioTaller) || 0) : 0
    
    const total = subtotalConDescuento + (mostrarDesglose ? 0 : ivaMonto) + domicilioMonto + tallerMonto

    return { 
      subtotal, 
      descuentoMonto, 
      ivaMonto, 
      baseImponible,
      domicilioMonto, 
      tallerMonto, 
      total, 
      subtotalConDescuento 
    }
  }

  const guardarCambios = async () => {
    if (!selectedCliente) {
      alert('Selecciona un cliente')
      return
    }

    if (carrito.length === 0) {
      alert('Agrega al menos un producto')
      return
    }

    if (incluirDomicilio && !selectedDomicilio) {
      alert('Selecciona un barrio para el domicilio')
      return
    }

    if (incluirTaller && !precioServicioTaller) {
      alert('Ingresa el precio del servicio de taller')
      return
    }

    try {
      const totales = calcularTotales()
      const userData = JSON.parse(localStorage.getItem('user'))

      // Actualizar cotización
      const cotizacionUpdate = {
        cliente_id: selectedCliente,
        subtotal: totales.subtotal,
        descuento: descuento,
        iva: iva,
        total: totales.total,
        observaciones: observaciones,
        validez_dias: validezDias,
        fecha: new Date().toISOString(),
        delivery_id: incluirDomicilio && selectedDomicilio ? selectedDomicilio.id : null,
        delivery_price: incluirDomicilio && selectedDomicilio ? selectedDomicilio.price_cop : 0,
        mostrar_desglose_iva: mostrarDesglose,
        iva_monto: totales.ivaMonto,
        base_imponible: totales.baseImponible
      }

      const { error: cotError } = await supabase
        .from('cotizaciones')
        .update(cotizacionUpdate)
        .eq('id', params.id)

      if (cotError) throw cotError

      // Eliminar items anteriores
      await supabase
        .from('cotizacion_items')
        .delete()
        .eq('cotizacion_id', params.id)

      // Insertar nuevos items
      const items = carrito.map(item => ({
        cotizacion_id: params.id,
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.cantidad * item.precio
      }))

      const { error: itemsError } = await supabase
        .from('cotizacion_items')
        .insert(items)

      if (itemsError) throw itemsError

      // Si se agregó servicio de taller, crear registro en tabla taller
      if (incluirTaller) {
        const clienteData = clientes.find(c => c.id === selectedCliente)
        
        const tallerData = {
          cliente_nombre: clienteData?.nombre || 'Cliente',
          cliente_telefono: clienteData?.telefono || '',
          tipo_servicio: tipoServicioTaller,
          observaciones: descripcionServicioTaller || 'Servicio agregado desde cotización',
          estado: 'recibido',
          vendedor_id: userData.vendedor_id,
          cotizacion_id: params.id,
          precio_estimado: parseFloat(precioServicioTaller) || 0
        }

        const { error: tallerError } = await supabase
          .from('taller')
          .insert([tallerData])

        if (tallerError) {
          console.error('Error al crear registro de taller:', tallerError)
        }
      }

      alert('¡Cotización actualizada exitosamente!')
      router.push(`/cotizaciones/${params.id}`)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar la cotización')
    }
  }

  const productosFiltrados = (productos || []).filter(p =>
    p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.product_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totales = calcularTotales()

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="max-w-6xl mx-auto p-6">
            <p>Cargando...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Editar Cotización #{cotizacionOriginal?.numero}</h1>
            <button
              onClick={() => router.push(`/cotizaciones/${params.id}`)}
              className="btn-secondary"
            >
              ← Cancelar
            </button>
          </div>

          {/* Formulario */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cliente */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Cliente</h3>
                <select
                  value={selectedCliente}
                  onChange={(e) => setSelectedCliente(e.target.value)}
                  className="input"
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} - {c.telefono}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buscar Productos */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Buscar Productos</h3>
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input mb-4"
                />
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {productosFiltrados.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
                    </p>
                  ) : (
                    productosFiltrados.map(p => (
                      <div
                        key={p.id}
                        onClick={() => agregarAlCarrito(p)}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition"
                      >
                        {p.image_url_png && (
                          <img src={p.image_url_png} alt={p.product_name} className="w-12 h-12 object-contain" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{p.product_name}</p>
                          <p className="text-sm text-gray-600">{p.product_code}</p>
                        </div>
                        <span className="font-bold text-blue-600">${(p.price_cop || p.price || 0).toLocaleString('es-CO')}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Carrito */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Productos en la Cotización</h3>
                {carrito.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay productos agregados</p>
                ) : (
                  <div className="space-y-3">
                    {carrito.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {item.image_url_png && (
                          <img src={item.image_url_png} alt={item.product_name} className="w-16 h-16 object-contain" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-600">{item.product_code}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => actualizarCantidad(item.id, parseInt(e.target.value))}
                            className="w-16 px-2 py-1 border rounded text-center"
                          />
                          <span className="text-gray-500">×</span>
                          <input
                            type="number"
                            min="0"
                            value={item.precio}
                            onChange={(e) => actualizarPrecio(item.id, e.target.value)}
                            className="w-28 px-2 py-1 border rounded text-right"
                          />
                          <button
                            onClick={() => eliminarDelCarrito(item.id)}
                            className="text-red-600 hover:text-red-800 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sección de Domicilio */}
              <div className="card border-2 border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    🚚 Envío a Domicilio
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incluirDomicilio}
                      onChange={(e) => {
                        setIncluirDomicilio(e.target.checked)
                        if (!e.target.checked) {
                          setSelectedDomicilio(null)
                          setSearchDomicilio('')
                        }
                      }}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="text-sm font-medium">Incluir envío</span>
                  </label>
                </div>

                {incluirDomicilio && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Buscar Barrio</label>
                      <input
                        type="text"
                        placeholder="Ej: El Rodadero, Centro, Gaira..."
                        value={searchDomicilio}
                        onChange={(e) => setSearchDomicilio(e.target.value)}
                        className="input"
                      />
                    </div>

                    {searchDomicilio && domiciliosFiltrados.length > 0 && !selectedDomicilio && (
                      <div className="max-h-48 overflow-y-auto border rounded-lg">
                        {domiciliosFiltrados.slice(0, 10).map(d => (
                          <div
                            key={d.id}
                            onClick={() => seleccionarDomicilio(d)}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center"
                          >
                            <span className="font-medium">{d.neighborhood}</span>
                            <span className="text-green-600 font-bold">
                              ${d.price_cop.toLocaleString('es-CO')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedDomicilio && (
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-green-800">
                              📍 {selectedDomicilio.neighborhood}
                            </p>
                            <p className="text-sm text-green-600">
                              Costo: ${selectedDomicilio.price_cop.toLocaleString('es-CO')}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedDomicilio(null)
                              setSearchDomicilio('')
                            }}
                            className="text-red-600 hover:text-red-800 font-bold text-xl"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sección de Taller */}
              <div className="card border-2 border-orange-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    🛠️ Servicio de Taller
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incluirTaller}
                      onChange={(e) => {
                        setIncluirTaller(e.target.checked)
                        if (!e.target.checked) {
                          setTipoServicioTaller('mantenimiento')
                          setPrecioServicioTaller(0)
                          setDescripcionServicioTaller('')
                        }
                      }}
                      className="w-5 h-5 text-orange-600"
                    />
                    <span className="text-sm font-medium">Incluir servicio</span>
                  </label>
                </div>

                {incluirTaller && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tipo de Servicio</label>
                      <select
                        value={tipoServicioTaller}
                        onChange={(e) => setTipoServicioTaller(e.target.value)}
                        className="input"
                      >
                        <option value="mantenimiento">🔧 Mantenimiento</option>
                        <option value="reparacion">🛠️ Reparación</option>
                        <option value="revision">🔍 Revisión</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Precio del Servicio</label>
                      <input
                        type="number"
                        min="0"
                        value={precioServicioTaller}
                        onChange={(e) => setPrecioServicioTaller(e.target.value)}
                        placeholder="Ej: 50000"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
                      <textarea
                        value={descripcionServicioTaller}
                        onChange={(e) => setDescripcionServicioTaller(e.target.value)}
                        placeholder="Describe el servicio a realizar..."
                        className="input"
                        rows="3"
                      />
                    </div>

                    {precioServicioTaller > 0 && (
                      <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
                        <p className="text-sm font-semibold text-orange-800">
                          {tipoServicioTaller === 'mantenimiento' && '🔧 Mantenimiento'}
                          {tipoServicioTaller === 'reparacion' && '🛠️ Reparación'}
                          {tipoServicioTaller === 'revision' && '🔍 Revisión'}
                          {' '}- ${parseFloat(precioServicioTaller).toLocaleString('es-CO')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Columna Lateral - Resumen */}
            <div className="space-y-6">
              {/* Configuración */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Configuración</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Validez (días)</label>
                    <input
                      type="number"
                      min="1"
                      value={validezDias}
                      onChange={(e) => setValidezDias(parseInt(e.target.value))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Descuento (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={descuento}
                      onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">IVA (%)</label>
                    <select
                      value={iva}
                      onChange={(e) => setIva(parseFloat(e.target.value))}
                      className="input"
                    >
                      <option value="0">0% (Sin IVA)</option>
                      <option value="5">5%</option>
                      <option value="19">19%</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mostrarDesglose}
                        onChange={(e) => setMostrarDesglose(e.target.checked)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-medium">Mostrar desglose de IVA (19%)</span>
                    </label>
                    <p className="text-xs text-gray-500 ml-6">Los precios incluyen IVA, se mostrará el desglose en la cotización</p>
                  </div>
                </div>
              </div>

              {/* Totales */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Resumen</h3>
                <div className="space-y-2">
                  {mostrarDesglose && (
                    <>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Base imponible:</span>
                        <span className="font-medium">${totales.baseImponible?.toLocaleString('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>IVA (19%):</span>
                        <span className="font-medium">${totales.ivaMonto?.toLocaleString('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                      </div>
                      <div className="flex justify-between font-medium text-gray-700">
                        <span>Subtotal (con IVA):</span>
                        <span>${totales.subtotal?.toLocaleString('es-CO')}</span>
                      </div>
                    </>
                  )}
                  {!mostrarDesglose && (
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">${totales.subtotal.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {descuento > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento ({descuento}%):</span>
                      <span>-${totales.descuentoMonto.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {iva > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>IVA ({iva}%):</span>
                      <span>+${totales.ivaMonto.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {incluirDomicilio && selectedDomicilio && (
                    <div className="flex justify-between text-green-600">
                      <span>🚚 Domicilio:</span>
                      <span>+${totales.domicilioMonto.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {incluirTaller && totales.tallerMonto > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>🛠️ Servicio Taller:</span>
                      <span>+${totales.tallerMonto.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-blue-600">${totales.total.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Observaciones</h3>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="input"
                  rows="4"
                  placeholder="Observaciones adicionales..."
                />
              </div>

              {/* Botón Guardar */}
              <button
                onClick={guardarCambios}
                className="btn-primary w-full"
              >
                💾 Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
