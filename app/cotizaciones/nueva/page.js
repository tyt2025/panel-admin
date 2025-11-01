'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NuevaCotizacion() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState([])
  const [searchProducto, setSearchProducto] = useState('')
  const [deliveryRates, setDeliveryRates] = useState([])
  const [incluirDomicilio, setIncluirDomicilio] = useState(false)
  const [searchBarrio, setSearchBarrio] = useState('')
  
  const [formData, setFormData] = useState({
    cliente_id: '',
    descuento: 0,
    iva: 0,
    observaciones: '',
    validez_dias: 5,
    delivery_id: null,
    delivery_price: 0
  })
  const [mostrarDesglose, setMostrarDesglose] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(userData))
    loadData(JSON.parse(userData))
  }, [router])

  const loadData = async (userData) => {
    try {
      const [clientesRes, productosRes, deliveryRes] = await Promise.all([
        supabase
          .from('clientes')
          .select('*')
          .eq('vendedor_id', userData.vendedor_id)
          .order('nombre'),
        supabase
          .from('productos')
          .select('*')
          .order('product_name'),
        supabase
          .from('delivery_rates')
          .select('*')
          .order('neighborhood')
      ])

      setClientes(clientesRes.data || [])
      setProductos(productosRes.data || [])
      setDeliveryRates(deliveryRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const agregarAlCarrito = (producto) => {
    const existente = carrito.find(item => item.producto_id === producto.id)
    if (existente) {
      setCarrito(carrito.map(item =>
        item.producto_id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ))
    } else {
      setCarrito([...carrito, {
        producto_id: producto.id,
        nombre: producto.product_name || producto.name,
        sku: producto.sku || '',
        precio_unitario: producto.price_cop || producto.price || 0,
        cantidad: 1
      }])
    }
    setSearchProducto('')
  }

  const actualizarCantidad = (producto_id, cantidad) => {
    if (cantidad <= 0) {
      setCarrito(carrito.filter(item => item.producto_id !== producto_id))
    } else {
      setCarrito(carrito.map(item =>
        item.producto_id === producto_id
          ? { ...item, cantidad: parseInt(cantidad) }
          : item
      ))
    }
  }

  const actualizarPrecio = (producto_id, precio) => {
    setCarrito(carrito.map(item =>
      item.producto_id === producto_id
        ? { ...item, precio_unitario: parseFloat(precio) || 0 }
        : item
    ))
  }

  const eliminarDelCarrito = (producto_id) => {
    setCarrito(carrito.filter(item => item.producto_id !== producto_id))
  }

  const calcularTotales = () => {
    const subtotal = carrito.reduce((sum, item) => 
      sum + (item.precio_unitario * item.cantidad), 0)
    
    // Si mostrar desglose está activo, los precios incluyen IVA del 19%
    let baseImponible = subtotal
    let ivaMonto = 0
    
    if (mostrarDesglose) {
      // Base imponible = Precio con IVA / 1.19
      baseImponible = subtotal / 1.19
      // IVA = Precio con IVA - Base imponible
      ivaMonto = subtotal - baseImponible
    }
    
    const descuentoMonto = subtotal * (formData.descuento / 100)
    const subtotalConDescuento = subtotal - descuentoMonto
    const domicilio = incluirDomicilio ? formData.delivery_price : 0
    const total = subtotalConDescuento + domicilio

    return { 
      subtotal, 
      descuentoMonto, 
      baseImponible, 
      ivaMonto, 
      domicilio, 
      total,
      subtotalConDescuento 
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (carrito.length === 0) {
      alert('Agrega al menos un producto')
      return
    }

    if (!formData.cliente_id) {
      alert('Selecciona un cliente')
      return
    }

    setLoading(true)

    try {
      const totales = calcularTotales()

      // Crear cotización
      const { data: cotizacion, error: cotError } = await supabase
        .from('cotizaciones')
        .insert([{
          cliente_id: formData.cliente_id,
          vendedor_id: user.vendedor_id,
          subtotal: totales.subtotal,
          descuento: formData.descuento,
          iva: formData.iva,
          delivery_id: incluirDomicilio ? formData.delivery_id : null,
          delivery_price: incluirDomicilio ? formData.delivery_price : 0,
          total: totales.total,
          observaciones: formData.observaciones,
          validez_dias: formData.validez_dias,
          estado: 'pendiente',
          mostrar_desglose_iva: mostrarDesglose,
          iva_monto: totales.ivaMonto,
          base_imponible: totales.baseImponible
        }])
        .select()
        .single()

      if (cotError) throw cotError

      // Crear items
      const items = carrito.map(item => ({
        cotizacion_id: cotizacion.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.precio_unitario * item.cantidad
      }))

      const { error: itemsError } = await supabase
        .from('cotizacion_items')
        .insert(items)

      if (itemsError) throw itemsError

      alert('Cotización creada exitosamente')
      router.push(`/cotizaciones/${cotizacion.id}`)
    } catch (error) {
      console.error('Error creating cotizacion:', error)
      alert('Error al crear cotización')
    } finally {
      setLoading(false)
    }
  }

  const productosFiltrados = productos.filter(p => {
    const searchLower = searchProducto.toLowerCase()
    const nombre = (p.product_name || p.name || '').toLowerCase()
    const sku = (p.sku || '').toLowerCase()
    return nombre.includes(searchLower) || sku.includes(searchLower)
  }).slice(0, 10)

  const totales = calcularTotales()

  if (!user) {
    return <div className="text-center">Cargando...</div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Nueva Cotización</h1>
        <button onClick={() => router.back()} className="btn-secondary">
          Volver
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">1. Datos del Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                value={formData.cliente_id}
                onChange={(e) => setFormData({...formData, cliente_id: e.target.value})}
                className="input-field"
                required
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Validez (días)
              </label>
              <input
                type="number"
                value={formData.validez_dias}
                onChange={(e) => setFormData({...formData, validez_dias: e.target.value})}
                className="input-field"
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">2. Productos</h3>
          
          {/* Buscar producto */}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar producto por nombre o SKU
            </label>
            <input
              type="text"
              placeholder="Escribe el nombre o SKU del producto..."
              value={searchProducto}
              onChange={(e) => setSearchProducto(e.target.value)}
              className="input-field"
            />
            {searchProducto && productosFiltrados.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 max-h-96 overflow-y-auto">
                {productosFiltrados.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => agregarAlCarrito(p)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Imagen del producto */}
                      <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                        {(p.image_url_png || p.main_image_url) ? (
                          <img
                            src={p.image_url_png || p.main_image_url}
                            alt={p.product_name || p.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Información del producto */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {p.product_name || p.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          SKU: {p.sku}
                        </div>
                        {p.brand && (
                          <div className="text-xs text-gray-600 mt-0.5">
                            {p.brand}
                          </div>
                        )}
                        <div className="text-sm font-semibold text-blue-600 mt-1">
                          ${(p.price_cop || p.price || 0).toLocaleString('es-CO')}
                        </div>
                      </div>

                      {/* Stock */}
                      <div className="flex-shrink-0">
                        <span className={`text-xs px-2 py-1 rounded ${
                          (p.available_stock || 0) > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          Stock: {p.available_stock || 0}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchProducto && productosFiltrados.length === 0 && (
              <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 p-4 text-center text-gray-500">
                No se encontraron productos
              </div>
            )}
          </div>

          {/* Carrito */}
          {carrito.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay productos agregados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Producto</th>
                    <th className="text-center py-2 px-2">Cantidad</th>
                    <th className="text-right py-2 px-2">Precio Unit.</th>
                    <th className="text-right py-2 px-2">Subtotal</th>
                    <th className="text-center py-2 px-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map(item => (
                    <tr key={item.producto_id} className="border-b">
                      <td className="py-2 px-2">{item.nombre}</td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => actualizarCantidad(item.producto_id, e.target.value)}
                          className="w-20 px-2 py-1 border rounded text-center"
                          min="1"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={item.precio_unitario}
                          onChange={(e) => actualizarPrecio(item.producto_id, e.target.value)}
                          className="w-32 px-2 py-1 border rounded text-right"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-medium">
                        ${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => eliminarDelCarrito(item.producto_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Domicilio (Opcional) */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">3. Envío a Domicilio (Opcional)</h3>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={incluirDomicilio}
                onChange={(e) => {
                  setIncluirDomicilio(e.target.checked)
                  if (!e.target.checked) {
                    setFormData({
                      ...formData,
                      delivery_id: null,
                      delivery_price: 0
                    })
                    setSearchBarrio('')
                  }
                }}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                ¿Incluir envío a domicilio?
              </span>
            </label>
          </div>

          {incluirDomicilio && (
            <div className="space-y-4 pt-4 border-t">
              {/* Buscador de barrio */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona el barrio/zona de entrega
                </label>
                <input
                  type="text"
                  placeholder="🔍 Buscar barrio, hotel o negocio..."
                  value={searchBarrio}
                  onChange={(e) => setSearchBarrio(e.target.value)}
                  className="input-field"
                />
                
                {searchBarrio && (
                  <div className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 max-h-64 overflow-y-auto">
                    {deliveryRates
                      .filter(d => 
                        d.neighborhood.toLowerCase().includes(searchBarrio.toLowerCase())
                      )
                      .slice(0, 20)
                      .map(delivery => (
                        <button
                          key={delivery.id}
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              delivery_id: delivery.id,
                              delivery_price: delivery.price_cop
                            })
                            setSearchBarrio(delivery.neighborhood)
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 transition-colors ${
                            formData.delivery_id === delivery.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-gray-900">
                                {delivery.neighborhood}
                              </div>
                            </div>
                            <div className="text-green-600 font-semibold">
                              ${delivery.price_cop.toLocaleString('es-CO')}
                            </div>
                          </div>
                        </button>
                      ))}
                    {deliveryRates.filter(d => 
                      d.neighborhood.toLowerCase().includes(searchBarrio.toLowerCase())
                    ).length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        No se encontró ese barrio. <br/>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('¿Deseas ir al módulo de Domicilios para agregarlo?')) {
                              router.push('/domicilios/nuevo')
                            }
                          }}
                          className="text-blue-600 underline mt-2"
                        >
                          Agregar nuevo domicilio
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Zona seleccionada */}
              {formData.delivery_id && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 font-medium">
                        🚚 Zona seleccionada:
                      </p>
                      <p className="text-lg font-bold text-green-900 mt-1">
                        {searchBarrio}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-700">Costo de envío</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${formData.delivery_price.toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Totales */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">{incluirDomicilio ? '4' : '3'}. Totales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descuento (%)
              </label>
              <input
                type="number"
                value={formData.descuento}
                onChange={(e) => setFormData({...formData, descuento: parseFloat(e.target.value) || 0})}
                className="input-field"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
            <div>
              <label className="flex items-center cursor-pointer h-full">
                <input
                  type="checkbox"
                  checked={mostrarDesglose}
                  onChange={(e) => setMostrarDesglose(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Mostrar desglose de IVA (19%)
                </span>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            {mostrarDesglose ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Base imponible:</span>
                  <span className="font-medium">${totales.baseImponible.toLocaleString('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA (19%):</span>
                  <span className="font-medium">${totales.ivaMonto.toLocaleString('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span className="text-gray-700">Subtotal (con IVA):</span>
                  <span>${totales.subtotal.toLocaleString('es-CO')}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${totales.subtotal.toLocaleString('es-CO')}</span>
              </div>
            )}
            {formData.descuento > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Descuento ({formData.descuento}%):</span>
                <span>-${totales.descuentoMonto.toLocaleString('es-CO')}</span>
              </div>
            )}
            {incluirDomicilio && formData.delivery_price > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Envío a domicilio:</span>
                <span>+${totales.domicilio.toLocaleString('es-CO')}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold border-t pt-2">
              <span>Total:</span>
              <span>${totales.total.toLocaleString('es-CO')}</span>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
              className="input-field"
              rows="3"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || carrito.length === 0}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Crear Cotización'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
