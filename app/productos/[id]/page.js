'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export default function DetalleProducto() {
  const params = useParams()
  const router = useRouter()
  const [producto, setProducto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    loadProducto()
  }, [params.id])

  const loadProducto = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      
      if (!data) {
        alert('Producto no encontrado')
        router.push('/productos')
        return
      }

      setProducto(data)
    } catch (error) {
      console.error('Error loading producto:', error)
      alert('Error al cargar el producto')
      router.push('/productos')
    } finally {
      setLoading(false)
    }
  }

  const eliminarProducto = async () => {
    if (!confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setDeleting(true)

      // Eliminar producto de la base de datos
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      alert('Producto eliminado correctamente')
      router.push('/productos')
    } catch (error) {
      console.error('Error deleting producto:', error)
      alert('Error al eliminar el producto')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando producto...</div>
      </div>
    )
  }

  if (!producto) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Producto no encontrado</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con botones */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/productos')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a Productos
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/productos/${params.id}/editar`)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
          >
            ✏️ Editar Producto
          </button>
          <button
            onClick={eliminarProducto}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Eliminando...' : '🗑️ Eliminar'}
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Imagen */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Imagen del Producto</h3>
            <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
              {producto.image_url_png || producto.main_image_url ? (
                <Image
                  src={producto.image_url_png || producto.main_image_url}
                  alt={producto.product_name}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-sm">Sin imagen</p>
                  </div>
                </div>
              )}
            </div>

            {/* Estado del producto */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Estado:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  producto.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {producto.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Stock:</span>
                <span className={`px-3 py-1 rounded text-xs font-semibold ${
                  (producto.available_stock || 0) > 10
                    ? 'bg-green-100 text-green-800'
                    : (producto.available_stock || 0) > 0
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {producto.available_stock || 0} unidades
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha - Información */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información básica */}
          <div className="card">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {producto.product_name}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              SKU: <span className="font-mono font-semibold">{producto.sku}</span>
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Precio</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${(producto.price_cop || producto.price || 0).toLocaleString('es-CO')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Marca</p>
                <p className="text-lg font-semibold text-gray-900">
                  {producto.brand || 'Sin marca'}
                </p>
              </div>
            </div>

            {producto.short_description && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Descripción Corta:</p>
                <p className="text-gray-600">{producto.short_description}</p>
              </div>
            )}

            {producto.description && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Descripción Completa:</p>
                <p className="text-gray-600 whitespace-pre-wrap">{producto.description}</p>
              </div>
            )}
          </div>

          {/* Detalles adicionales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles Adicionales</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">Categoría</p>
                <p className="font-semibold text-gray-900">{producto.category || 'N/A'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">Subcategoría</p>
                <p className="font-semibold text-gray-900">{producto.category_sub || 'N/A'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">Garantía</p>
                <p className="font-semibold text-gray-900">
                  {producto.warranty_months || 0} meses
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">Stock Disponible</p>
                <p className="font-semibold text-gray-900">
                  {producto.available_stock || 0}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">ID del Producto</p>
                <p className="font-semibold text-gray-900 font-mono">#{producto.id}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">Destacado</p>
                <p className="font-semibold text-gray-900">
                  {producto.is_featured ? 'Sí' : 'No'}
                </p>
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Sistema</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Creado</p>
                <p className="font-semibold text-gray-900">
                  {new Date(producto.created_at).toLocaleString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              {producto.updated_at && (
                <div>
                  <p className="text-gray-600">Última Actualización</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(producto.updated_at).toLocaleString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
