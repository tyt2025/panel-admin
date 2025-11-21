'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

// Función para obtener iniciales del cliente
const obtenerIniciales = (nombreCliente) => {
  if (!nombreCliente) return 'XX'
  
  const palabras = nombreCliente.trim().toUpperCase().split(' ')
  
  if (palabras.length === 1) {
    // Si solo hay un nombre, tomar las primeras 2 letras
    return palabras[0].substring(0, 2)
  } else {
    // Si hay nombre y apellido, tomar primera letra de cada uno
    return palabras[0].charAt(0) + palabras[1].charAt(0)
  }
}

// Función para generar número de cotización secuencial
const generarNumeroCotizacion = (cotizacion, todasLasCotizaciones = []) => {
  if (!cotizacion) return 'XX-3000'
  
  const iniciales = obtenerIniciales(cotizacion.clientes?.nombre || 'Cliente')
  
  // Contar cuántas cotizaciones existen antes de esta (basado en created_at)
  const fechaEsta = new Date(cotizacion.created_at).getTime()
  const cotizacionesAnteriores = todasLasCotizaciones.filter(c => {
    const fechaOtra = new Date(c.created_at).getTime()
    return fechaOtra < fechaEsta
  }).length
  
  // Número secuencial empezando desde 3001
  const numeroSecuencial = 3001 + cotizacionesAnteriores
  
  return `${iniciales}-${numeroSecuencial.toString().padStart(4, '0')}`
}

export default function VerCotizacion() {
  const params = useParams()
  const router = useRouter()
  const [cotizacion, setCotizacion] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [userPhone, setUserPhone] = useState('')
  const printRef = useRef(null)
  const [todasCotizaciones, setTodasCotizaciones] = useState([])

  useEffect(() => {
    loadCotizacion()
    
    // Obtener teléfono del usuario
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      if (user.username === 'tintasytecnologia1') {
        setUserPhone('3102605693')
      } else if (user.username === 'tintasytecnologia2') {
        setUserPhone('3122405144')
      }
    }
  }, [params.id])

  const loadCotizacion = async () => {
    try {
      // Obtener datos del usuario desde localStorage
      const userData = localStorage.getItem('user')
      const user = userData ? JSON.parse(userData) : null
      
      const [cotRes, itemsRes, todasCotRes] = await Promise.all([
        supabase
          .from('cotizaciones')
          .select(`
            *,
            clientes (*),
            delivery_rates (neighborhood, price_cop)
          `)
          .eq('id', params.id)
          .single(),
        supabase
          .from('cotizacion_items')
          .select(`
            *,
            productos (product_name, image_url_png, description)
          `)
          .eq('cotizacion_id', params.id),
        // Cargar todas las cotizaciones para calcular el número secuencial
        user ? supabase
          .from('cotizaciones')
          .select('id, created_at')
          .eq('vendedor_id', user.vendedor_id)
          .order('created_at', { ascending: true })
        : Promise.resolve({ data: [] })
      ])

      setCotizacion(cotRes.data)
      setItems(itemsRes.data || [])
      setTodasCotizaciones(todasCotRes.data || [])
    } catch (error) {
      console.error('Error loading cotizacion:', error)
    } finally {
      setLoading(false)
    }
  }

  // Función para cortar texto en el último signo de puntuación
  const truncateAtPunctuation = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text
    
    const truncated = text.substring(0, maxLength)
    const lastPeriod = truncated.lastIndexOf('.')
    const lastComma = truncated.lastIndexOf(',')
    const lastPunctuation = Math.max(lastPeriod, lastComma)
    
    if (lastPunctuation > 0) {
      return truncated.substring(0, lastPunctuation + 1)
    }
    return truncated
  }

  const generarPDF = async () => {
    try {
      // Mostrar indicador de carga
      const loadingMsg = document.createElement('div')
      loadingMsg.innerHTML = '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px;border-radius:8px;z-index:9999;font-size:16px;">⏳ Generando PDF...<br><small>Por favor espera</small></div>'
      document.body.appendChild(loadingMsg)

      const doc = new jsPDF()
      
      // Configuración de colores - ROJO
      const primaryColor = [240, 0, 0] // Rojo #f00000
      const textColor = [51, 51, 51]
      
      // OPTIMIZACIÓN: Pre-cargar todas las imágenes en paralelo
      const imageCache = {}
      
      // Función helper para cargar imagen con timeout y validación
      const loadImageWithTimeout = async (url, timeout = 8000) => {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), timeout)
          
          const response = await fetch(url, { 
            signal: controller.signal,
            mode: 'cors',
            cache: 'force-cache'
          })
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            console.log('Error HTTP cargando imagen:', url, response.status)
            return null
          }
          
          const blob = await response.blob()
          
          // Validar que el blob sea una imagen
          if (!blob.type.startsWith('image/')) {
            console.log('Blob no es una imagen:', url, blob.type)
            return null
          }
          
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              try {
                const result = reader.result
                if (result && typeof result === 'string' && result.startsWith('data:image')) {
                  resolve(result)
                } else {
                  console.log('Data URL inválido para:', url)
                  resolve(null)
                }
              } catch (e) {
                console.log('Error procesando imagen:', url, e)
                resolve(null)
              }
            }
            reader.onerror = () => {
              console.log('Error FileReader para:', url)
              resolve(null)
            }
            reader.readAsDataURL(blob)
          })
        } catch (error) {
          console.log('Error cargando imagen:', url, error.message || error)
          return null
        }
      }
      
      // Pre-cargar logo y todas las imágenes de productos en paralelo
      const imagesToLoad = [
        { key: 'logo', url: 'https://cxxifwpwarbrrodtzyqn.supabase.co/storage/v1/object/public/Logo/logo%20circulo%20(1).png' },
        { key: 'domicilio', url: 'https://cxxifwpwarbrrodtzyqn.supabase.co/storage/v1/object/public/Logo/domicilio.png' },
        ...items.filter(item => item.productos?.image_url_png).map((item, idx) => ({
          key: `product_${idx}`,
          url: item.productos.image_url_png
        }))
      ]
      
      await Promise.all(
        imagesToLoad.map(async ({ key, url }) => {
          imageCache[key] = await loadImageWithTimeout(url)
        })
      )
      
      // Encabezado con logo
      doc.setFillColor(...primaryColor)
      doc.rect(0, 0, 210, 40, 'F')
      
      // Agregar logo
      if (imageCache.logo) {
        try {
          doc.addImage(imageCache.logo, 'PNG', 15, 6, 30, 30)
        } catch (e) {
          console.log('Error agregando logo:', e.message)
        }
      }
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('TINTAS Y TECNOLOGÍA', 105, 20, { align: 'center' })
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text('Soluciones Tecnológicas Profesionales', 105, 30, { align: 'center' })
      
      // Número de cotización con fecha al lado
      doc.setTextColor(...textColor)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(`COTIZACIÓN #${generarNumeroCotizacion(cotizacion, todasCotizaciones)}`, 20, 55)
      
      // Fecha al lado derecho del número de cotización
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Fecha: ${format(new Date(cotizacion.fecha), 'dd/MM/yyyy')}`, 150, 55)
      
      // Información del cliente y cotización
      let yPos = 70
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('INFORMACIÓN DEL CLIENTE', 20, yPos)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      yPos += 8
      
      // Romper el nombre del cliente en múltiples líneas si es muy largo
      const nombreCliente = `Cliente: ${cotizacion.clientes?.nombre || 'N/A'}`
      const lineasCliente = doc.splitTextToSize(nombreCliente, 85) // Máximo 85 puntos de ancho
      doc.text(lineasCliente, 20, yPos)
      yPos += lineasCliente.length * 6 // Ajustar yPos según las líneas usadas
      
      doc.text(`Teléfono: ${cotizacion.clientes?.telefono || 'N/A'}`, 20, yPos)
      
      if (cotizacion.clientes?.nit) {
        yPos += 6
        doc.text(`NIT: ${cotizacion.clientes.nit}`, 20, yPos)
      }
      
      if (cotizacion.clientes?.email) {
        yPos += 6
        const emailTexto = `Email: ${cotizacion.clientes.email}`
        const lineasEmail = doc.splitTextToSize(emailTexto, 85)
        doc.text(lineasEmail, 20, yPos)
      }
      
      // Información de la cotización (lado derecho) - SIN FECHA - Movido más a la derecha
      yPos = 70
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('INFORMACIÓN DE LA COTIZACIÓN', 120, yPos)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      yPos += 8
      doc.text(`Validez: ${cotizacion.validez_dias} días`, 120, yPos)
      yPos += 6
      doc.text(`Estado: ${cotizacion.estado}`, 120, yPos)
      
      // Tabla de productos con imágenes
      yPos = 110
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('PRODUCTOS', 20, yPos)
      
      yPos += 10
      
      // Encabezados de tabla
      doc.setFillColor(240, 240, 240)
      doc.rect(20, yPos - 5, 170, 8, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('Imagen', 24, yPos)
      doc.text('Producto', 50, yPos)
      doc.text('Cant.', 140, yPos, { align: 'center' })
      doc.text('Precio', 165, yPos, { align: 'right' })
      doc.text('Total', 185, yPos, { align: 'right' })
      
      yPos += 8
      
      // Items con imágenes y descripciones
      doc.setFont('helvetica', 'normal')
      for (let index = 0; index < items.length; index++) {
        const item = items[index]
        
        // OPTIMIZADO: Aumentar umbral para permitir más contenido en página 1
        if (yPos > 235) {
          doc.addPage()
          yPos = 20
        }
        
        const startY = yPos
        
        // Usar imagen del cache (ya pre-cargada)
        const cachedImage = imageCache[`product_${index}`]
        if (cachedImage) {
          try {
            doc.addImage(cachedImage, 'PNG', 22, startY, 20, 20)
          } catch (e) {
            console.log(`Error agregando imagen producto ${index}:`, e.message)
          }
        }
        
        // Nombre del producto
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        const productNameLines = doc.splitTextToSize(item.productos?.product_name || 'N/A', 55)
        doc.text(productNameLines, 50, startY + 3)
        
        // Descripción del producto (cortada en el último signo de puntuación)
        if (item.productos?.description) {
          const truncatedDesc = truncateAtPunctuation(item.productos.description, 200)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(6)
          doc.setTextColor(85, 85, 85)
          const descLines = doc.splitTextToSize(truncatedDesc, 55)
          doc.text(descLines, 50, startY + 3 + (productNameLines.length * 3) + 2)
          doc.setTextColor(...textColor)
        }
        
        // Cantidad, precio y total (alineados a la mitad de la fila)
        const middleY = startY + 12
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text(item.cantidad.toString(), 140, middleY, { align: 'center' })
        doc.text(`$${item.precio_unitario?.toLocaleString('es-CO')}`, 165, middleY, { align: 'right' })
        doc.setFont('helvetica', 'bold')
        doc.text(`$${item.subtotal?.toLocaleString('es-CO')}`, 185, middleY, { align: 'right' })
        
        // Línea separadora
        yPos = startY + 26
        doc.setDrawColor(230, 230, 230)
        doc.line(20, yPos, 190, yPos)
        yPos += 4
      }
      
      // DOMICILIO (si existe)
      if (cotizacion.delivery_id && cotizacion.delivery_rates) {
        // OPTIMIZADO: Aumentar umbral
        if (yPos > 235) {
          doc.addPage()
          yPos = 20
        }
        
        const startY = yPos
        
        // Usar imagen del domicilio del cache
        const deliveryImage = imageCache.domicilio
        if (deliveryImage) {
          try {
            doc.addImage(deliveryImage, 'PNG', 22, startY, 20, 20)
          } catch (e) {
            console.log('Error agregando imagen domicilio:', e.message)
          }
        } else {
          // Fallback: mostrar texto ENVÍO si falla la imagen
          doc.setFillColor(240, 240, 240)
          doc.rect(22, startY, 20, 20, 'F')
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7)
          doc.text('ENVÍO', 32, startY + 12, { align: 'center' })
        }
        
        // Nombre del domicilio
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.text(`Envío a Domicilio - ${cotizacion.delivery_rates.neighborhood}`, 50, startY + 3)
        
        // Descripción
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6)
        doc.setTextColor(85, 85, 85)
        doc.text('Servicio de entrega a domicilio', 50, startY + 8)
        doc.setTextColor(...textColor)
        
        // Cantidad, precio y total
        const middleY = startY + 12
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text('1', 140, middleY, { align: 'center' })
        doc.text(`$${cotizacion.delivery_rates.price_cop?.toLocaleString('es-CO')}`, 165, middleY, { align: 'right' })
        doc.setFont('helvetica', 'bold')
        doc.text(`$${cotizacion.delivery_rates.price_cop?.toLocaleString('es-CO')}`, 185, middleY, { align: 'right' })
        
        // Línea separadora
        yPos = startY + 26
        doc.setDrawColor(230, 230, 230)
        doc.line(20, yPos, 190, yPos)
        yPos += 4
      }
      
      // OPTIMIZADO: Reducir espaciado antes de totales
      yPos += 5
      
      // OPTIMIZADO: Verificación más permisiva para totales
      if (yPos > 245) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      // Mostrar desglose del IVA si está activado
      if (cotizacion.mostrar_desglose_iva) {
        doc.text('Base imponible:', 115, yPos)
        doc.text(`$${Math.round(cotizacion.base_imponible || 0).toLocaleString('es-CO')}`, 190, yPos, { align: 'right' })
        yPos += 6
        doc.text('IVA (19%):', 115, yPos)
        doc.text(`$${Math.round(cotizacion.iva_monto || 0).toLocaleString('es-CO')}`, 190, yPos, { align: 'right' })
        yPos += 6
        doc.setFont('helvetica', 'bold')
        doc.text('Subtotal (con IVA):', 115, yPos)
        doc.text(`$${Math.round(cotizacion.subtotal || 0).toLocaleString('es-CO')}`, 190, yPos, { align: 'right' })
        doc.setFont('helvetica', 'normal')
        yPos += 8
      }
      
      if (cotizacion.descuento > 0) {
        if (!cotizacion.mostrar_desglose_iva) {
          doc.text('Subtotal:', 115, yPos)
          doc.text(`$${Math.round(cotizacion.subtotal || 0).toLocaleString('es-CO')}`, 190, yPos, { align: 'right' })
          yPos += 6
        }
        doc.setTextColor(220, 38, 38)
        doc.text(`Descuento (${cotizacion.descuento}%):`, 115, yPos)
        doc.text(`-$${Math.round((cotizacion.subtotal * cotizacion.descuento) / 100).toLocaleString('es-CO')}`, 190, yPos, { align: 'right' })
        doc.setTextColor(...textColor)
        yPos += 8
      }
      
      // Domicilio (si existe)
      if (cotizacion.delivery_id && cotizacion.delivery_rates) {
        doc.setTextColor(22, 163, 74)
        doc.text('Envío a domicilio:', 115, yPos)
        doc.text(`+$${Math.round(cotizacion.delivery_rates.price_cop || 0).toLocaleString('es-CO')}`, 190, yPos, { align: 'right' })
        doc.setTextColor(...textColor)
        yPos += 8
      }
      
      // Retenciones (si existen)
      const tieneRetenciones = (cotizacion.retefuente > 0 || cotizacion.reteiva > 0 || cotizacion.ica > 0 || cotizacion.reteica > 0) &&
        (cotizacion.monto_retefuente > 0 || cotizacion.monto_reteiva > 0 || cotizacion.monto_ica > 0 || cotizacion.monto_reteica > 0)
      
      if (tieneRetenciones) {
        // Verificar espacio para todas las retenciones
        if (yPos > 235) {
          doc.addPage()
          yPos = 20
        }
        
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.text('Retenciones:', 115, yPos)
        yPos += 6
        doc.setFont('helvetica', 'normal')
        
        if (cotizacion.retefuente > 0 && cotizacion.monto_retefuente > 0) {
          doc.setTextColor(255, 140, 0) // Naranja
          doc.text(`Retefuente (${cotizacion.retefuente}%):`, 120, yPos)
          doc.text(`-$${Math.round(cotizacion.monto_retefuente).toLocaleString('es-CO')}`, 190, yPos, { align: 'right' })
          doc.setTextColor(...textColor)
          yPos += 5
        }
        
        if (cotizacion.reteiva > 0 && cotizacion.monto_reteiva > 0) {
          doc.setTextColor(59, 130, 246) // Azul
          doc.text(`ReteIVA (${cotizacion.reteiva}%):`, 120, yPos)
          doc.text(`-$${Math.round(cotizacion.monto_reteiva).toLocaleString('es-CO')}`, 190, yPos, { align: 'right' })
          doc.setTextColor(...textColor)
          yPos += 5
        }
        
        if (cotizacion.ica > 0 && cotizacion.monto_ica > 0) {
          doc.setTextColor(168, 85, 247) // Morado
          doc.text(`ICA (${cotizacion.ica}%):`, 120, yPos)
          doc.text(`-$${Math.round(cotizacion.monto_ica).toLocaleString('es-CO')}`, 190, yPos, { align: 'right' })
          doc.setTextColor(...textColor)
          yPos += 5
        }
        
        if (cotizacion.reteica > 0 && cotizacion.monto_reteica > 0) {
          doc.setTextColor(34, 197, 94) // Verde
          doc.text(`ReteICA (${cotizacion.reteica}%):`, 120, yPos)
          doc.text(`-$${Math.round(cotizacion.monto_reteica).toLocaleString('es-CO')}`, 190, yPos, { align: 'right' })
          doc.setTextColor(...textColor)
          yPos += 5
        }
        
        yPos += 3
      }
      
      // OPTIMIZADO: Verificación más permisiva antes del total
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      
      // Total destacado
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(...primaryColor)
      doc.text('TOTAL A PAGAR:', 115, yPos)
      doc.text(`$${cotizacion.total?.toLocaleString('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`, 190, yPos, { align: 'right' })
      doc.setTextColor(...textColor)
      
      // Vendedor (con espacio considerable después del total)
      if (cotizacion.nombre_vendedor) {
        yPos += 20 // Bastante espacio después del total
        
        // Verificar si necesitamos una nueva página
        if (yPos > 245) {
          doc.addPage()
          yPos = 20
        }
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(85, 85, 85)
        doc.text('Vendedor:', 115, yPos)
        doc.setFont('helvetica', 'bold')
        doc.text(cotizacion.nombre_vendedor, 140, yPos)
        doc.setTextColor(...textColor)
      }
      
      // Observaciones
      if (cotizacion.observaciones) {
        yPos += 10
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.text('OBSERVACIONES:', 20, yPos)
        
        yPos += 8
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        const obsLines = doc.splitTextToSize(cotizacion.observaciones, 170)
        obsLines.forEach(line => {
          if (yPos > 260) {
            doc.addPage()
            yPos = 20
          }
          doc.text(line, 20, yPos)
          yPos += 5
        })
      }
      
      // OPTIMIZADO: Footer dinámico que se ajusta al contenido
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        
        // OPTIMIZADO: Footer más compacto que se ajusta mejor
        let footerY = 265
        
        // Línea separadora
        doc.setDrawColor(200, 200, 200)
        doc.line(20, footerY, 190, footerY)
        footerY += 4
        
        // Información de contacto del negocio
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...textColor)
        doc.text('Tintas y Tecnología', 105, footerY, { align: 'center' })
        footerY += 3.5
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        doc.text('Calle 14 # 5-44 local 1 Barrio Centro, Santa Marta', 105, footerY, { align: 'center' })
        footerY += 3.5
        
        doc.text('Tel: 3102605693 | WhatsApp: 3102605693 - 3122405144', 105, footerY, { align: 'center' })
        footerY += 3.5
        
        doc.text('tintasytecnologia2018@gmail.com | www.tintasytecnologia.com', 105, footerY, { align: 'center' })
        footerY += 3.5
        
        doc.text('Horario: Lun-Sáb 8:00am-6:20pm | Dom y Festivos 9:00am-12:30pm', 105, footerY, { align: 'center' })
        footerY += 4
        
        // Número de cotización y página
        doc.setFontSize(7)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(150, 150, 150)
        doc.text(`Cotización #${generarNumeroCotizacion(cotizacion, todasCotizaciones)} | Página ${i} de ${pageCount}`, 105, footerY, { align: 'center' })
      }
      
      // Guardar PDF
      doc.save(`Cotizacion-${generarNumeroCotizacion(cotizacion, todasCotizaciones)}.pdf`)
      
      // Remover mensaje de loading
      document.body.removeChild(loadingMsg)
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar PDF. Verifica la consola.')
      // Remover mensaje de loading en caso de error
      const loadingMsg = document.querySelector('div[style*="Generando PDF"]')
      if (loadingMsg) {
        document.body.removeChild(loadingMsg.parentElement)
      }
    }
  }

  const generarJPG = async () => {
    try {
      const element = printRef.current
      if (!element) return

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const link = document.createElement('a')
      link.download = `Cotizacion-${generarNumeroCotizacion(cotizacion, todasCotizaciones)}.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.95)
      link.click()
    } catch (error) {
      console.error('Error generando JPG:', error)
      alert('Error al generar imagen. Verifica la consola.')
    }
  }

  const enviarPorWhatsApp = () => {
    // Validar que el cliente tenga teléfono
    if (!cotizacion.clientes?.telefono) {
      alert('El cliente no tiene un número de teléfono registrado')
      return
    }

    // Limpiar el número de teléfono (remover espacios, guiones, etc.)
    const telefonoCliente = cotizacion.clientes.telefono.replace(/\D/g, '')
    
    // Validar que el número tenga al menos 10 dígitos
    if (telefonoCliente.length < 10) {
      alert('El número de teléfono del cliente no es válido')
      return
    }

    // Formatear el número con código de país si no lo tiene
    const numeroFormateado = telefonoCliente.startsWith('57') 
      ? telefonoCliente 
      : `57${telefonoCliente}`

    // Crear el mensaje para WhatsApp
    const mensaje = `¡Hola ${cotizacion.clientes.nombre}! 👋

Te envío la cotización #${generarNumeroCotizacion(cotizacion, todasCotizaciones)} con el detalle de los productos:

${items.map(item => 
  `• ${item.productos?.product_name} - Cantidad: ${item.cantidad} - $${item.subtotal?.toLocaleString('es-CO')}`
).join('\n')}

${cotizacion.delivery_id && cotizacion.delivery_rates ? 
  `• Envío a domicilio - ${cotizacion.delivery_rates.neighborhood}: $${cotizacion.delivery_rates.price_cop?.toLocaleString('es-CO')}\n` : ''}
💰 *TOTAL: $${cotizacion.total?.toLocaleString('es-CO')}*

Esta cotización es válida por ${cotizacion.validez_dias} días.

¿Te gustaría proceder con esta compra? Estoy aquí para ayudarte con cualquier pregunta. 😊

📍 Tintas y Tecnología
Calle 14 # 5-44 local 1, Santa Marta
📱 WhatsApp: 3102605693 - 3122405144`

    // Codificar el mensaje para URL
    const mensajeCodificado = encodeURIComponent(mensaje)
    
    // Crear el enlace de WhatsApp
    const urlWhatsApp = `https://wa.me/${numeroFormateado}?text=${mensajeCodificado}`
    
    // Abrir WhatsApp en una nueva pestaña
    window.open(urlWhatsApp, '_blank')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (!cotizacion) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Cotización no encontrada</div>
      </div>
    )
  }

  return (
    <>
      {/* Vista para pantalla */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Cotización #{generarNumeroCotizacion(cotizacion, todasCotizaciones)}</h1>
            <p className="text-gray-600 mt-1"><strong>Fecha:</strong> {format(new Date(cotizacion.fecha), 'dd/MM/yyyy')}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/cotizaciones/${params.id}/editar`)}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Editar
            </button>
            <button
              onClick={generarPDF}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Descargar PDF
            </button>
            <button
              onClick={generarJPG}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Descargar JPG
            </button>
            <button
              onClick={enviarPorWhatsApp}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Enviar por WhatsApp
            </button>
            <button
              onClick={() => router.push('/cotizaciones')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Volver
            </button>
          </div>
        </div>

        {/* Información de la cotización en pantalla */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="max-w-full">
              <h3 className="text-lg font-bold mb-3">Información del Cliente</h3>
              <p className="break-words"><strong>Cliente:</strong> {cotizacion.clientes?.nombre}</p>
              <p><strong>Teléfono:</strong> {cotizacion.clientes?.telefono}</p>
              {cotizacion.clientes?.nit && <p><strong>NIT:</strong> {cotizacion.clientes.nit}</p>}
              {cotizacion.clientes?.email && <p className="break-words"><strong>Email:</strong> {cotizacion.clientes.email}</p>}
            </div>
            <div className="max-w-full">
              <h3 className="text-lg font-bold mb-3">Información de la Cotización</h3>
              <p><strong>Validez:</strong> {cotizacion.validez_dias} días</p>
              <p><strong>Estado:</strong> {cotizacion.estado}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3">Productos</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Producto</th>
                    <th className="px-4 py-2 text-center">Cantidad</th>
                    <th className="px-4 py-2 text-right">Precio Unit.</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="px-4 py-2">{item.productos?.product_name}</td>
                      <td className="px-4 py-2 text-center">{item.cantidad}</td>
                      <td className="px-4 py-2 text-right">${item.precio_unitario?.toLocaleString('es-CO')}</td>
                      <td className="px-4 py-2 text-right font-bold">${item.subtotal?.toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                  
                  {cotizacion.delivery_id && cotizacion.delivery_rates && (
                    <tr className="border-b bg-blue-50">
                      <td className="px-4 py-2">Envío a Domicilio - {cotizacion.delivery_rates.neighborhood}</td>
                      <td className="px-4 py-2 text-center">1</td>
                      <td className="px-4 py-2 text-right">${cotizacion.delivery_rates.price_cop?.toLocaleString('es-CO')}</td>
                      <td className="px-4 py-2 text-right font-bold">${cotizacion.delivery_rates.price_cop?.toLocaleString('es-CO')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-80 bg-gray-50 p-4 rounded">
              {cotizacion.descuento > 0 && (
                <>
                  <div className="flex justify-between mb-2">
                    <span>Subtotal:</span>
                    <span className="font-bold">${cotizacion.subtotal?.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between mb-2 text-red-600">
                    <span>Descuento ({cotizacion.descuento}%):</span>
                    <span>-${((cotizacion.subtotal * cotizacion.descuento) / 100).toLocaleString('es-CO')}</span>
                  </div>
                </>
              )}
              {cotizacion.delivery_id && cotizacion.delivery_rates && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>Envío a domicilio:</span>
                  <span>+${cotizacion.delivery_rates.price_cop?.toLocaleString('es-CO')}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t-2 text-xl font-bold text-red-600">
                <span>TOTAL:</span>
                <span>${cotizacion.total?.toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>

          {cotizacion.observaciones && (
            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h4 className="font-bold mb-2">Observaciones:</h4>
              <p className="text-sm">{cotizacion.observaciones}</p>
            </div>
          )}
        </div>
      </div>

      {/* Plantilla oculta para impresión/JPG */}
      <div ref={printRef} style={{ position: 'absolute', left: '-9999px', width: '800px', backgroundColor: 'white', padding: '40px' }}>
        <div style={{ backgroundColor: '#f00000', padding: '30px', marginBottom: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <img 
            src="https://cxxifwpwarbrrodtzyqn.supabase.co/storage/v1/object/public/Logo/logo%20circulo%20(1).png" 
            alt="Logo"
            crossOrigin="anonymous"
            style={{ position: 'absolute', left: '20px', height: '75px', width: 'auto' }}
          />
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ color: 'white', fontSize: '32px', margin: '0', fontWeight: 'bold' }}>
              TINTAS Y TECNOLOGÍA
            </h1>
            <p style={{ color: 'white', fontSize: '16px', margin: '10px 0 0 0' }}>
              Soluciones Tecnológicas Profesionales
            </p>
          </div>
        </div>

        {/* Título con fecha */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: 0 }}>
            COTIZACIÓN #{generarNumeroCotizacion(cotizacion, todasCotizaciones)}
          </h2>
          <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
            <strong>Fecha:</strong> {format(new Date(cotizacion.fecha), 'dd/MM/yyyy')}
          </p>
        </div>

        {/* Información */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', gap: '40px' }}>
          <div style={{ flex: '0 0 48%', maxWidth: '48%' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>
              INFORMACIÓN DEL CLIENTE
            </h3>
            <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
              <p style={{ wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}><strong>Cliente:</strong> {cotizacion.clientes?.nombre}</p>
              <p><strong>Teléfono:</strong> {cotizacion.clientes?.telefono}</p>
              {cotizacion.clientes?.nit && <p><strong>NIT:</strong> {cotizacion.clientes.nit}</p>}
              {cotizacion.clientes?.email && <p style={{ wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}><strong>Email:</strong> {cotizacion.clientes.email}</p>}
            </div>
          </div>
          <div style={{ flex: '0 0 48%', maxWidth: '48%' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>
              INFORMACIÓN DE LA COTIZACIÓN
            </h3>
            <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
              <p><strong>Validez:</strong> {cotizacion.validez_dias} días</p>
              <p><strong>Estado:</strong> {cotizacion.estado}</p>
            </div>
          </div>
        </div>

        {/* Productos con imágenes */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>
            PRODUCTOS
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', width: '80px' }}>Imagen</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Producto</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd', width: '60px' }}>Cant.</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd', width: '100px' }}>Precio</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd', width: '100px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    {item.productos?.image_url_png && (
                      <img 
                        src={item.productos.image_url_png} 
                        alt="Producto"
                        crossOrigin="anonymous"
                        style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                      />
                    )}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}>
                      {item.productos?.product_name}
                    </div>
                    {item.productos?.description && (
                      <div style={{ fontSize: '10px', color: '#555', lineHeight: '1.5', maxWidth: '320px' }}>
                        {truncateAtPunctuation(item.productos.description, 180)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>{item.cantidad}</td>
                  <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                    ${item.precio_unitario?.toLocaleString('es-CO')}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
                    ${item.subtotal?.toLocaleString('es-CO')}
                  </td>
                </tr>
              ))}
              
              {/* Domicilio (si existe) */}
              {cotizacion.delivery_id && cotizacion.delivery_rates && (
                <tr style={{ backgroundColor: '#eff6ff' }}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <img 
                      src="https://cxxifwpwarbrrodtzyqn.supabase.co/storage/v1/object/public/Logo/domicilio.png" 
                      alt="Domicilio"
                      crossOrigin="anonymous"
                      style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                    />
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}>
                      Envío a Domicilio - {cotizacion.delivery_rates.neighborhood}
                    </div>
                    <div style={{ fontSize: '10px', color: '#555', lineHeight: '1.5' }}>
                      Servicio de entrega a domicilio
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>1</td>
                  <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                    ${cotizacion.delivery_rates.price_cop?.toLocaleString('es-CO')}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
                    ${cotizacion.delivery_rates.price_cop?.toLocaleString('es-CO')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totales - CON DESGLOSE DE IVA */}
        <div style={{ marginLeft: 'auto', width: '400px', backgroundColor: '#f9fafb', padding: '25px', borderRadius: '8px', marginBottom: '30px' }}>
          {cotizacion.mostrar_desglose_iva && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span>Base imponible:</span>
                <span style={{ fontWeight: 'bold' }}>${Math.round(cotizacion.base_imponible || 0).toLocaleString('es-CO')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span>IVA (19%):</span>
                <span style={{ fontWeight: 'bold' }}>${Math.round(cotizacion.iva_monto || 0).toLocaleString('es-CO')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', fontSize: '14px', fontWeight: 'bold' }}>
                <span>Subtotal (con IVA):</span>
                <span>${Math.round(cotizacion.subtotal || 0).toLocaleString('es-CO')}</span>
              </div>
            </>
          )}
          {cotizacion.descuento > 0 && (
            <>
              {!cotizacion.mostrar_desglose_iva && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                  <span>Subtotal:</span>
                  <span style={{ fontWeight: 'bold' }}>${Math.round(cotizacion.subtotal || 0).toLocaleString('es-CO')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', fontSize: '14px', color: '#dc2626' }}>
                <span>Descuento ({cotizacion.descuento}%):</span>
                <span>-${Math.round((cotizacion.subtotal * cotizacion.descuento) / 100).toLocaleString('es-CO')}</span>
              </div>
            </>
          )}
          {cotizacion.delivery_id && cotizacion.delivery_rates && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', fontSize: '14px', color: '#16a34a' }}>
              <span>Envío a domicilio:</span>
              <span>+${Math.round(cotizacion.delivery_rates.price_cop || 0).toLocaleString('es-CO')}</span>
            </div>
          )}
          
          {/* Retenciones */}
          {((cotizacion.retefuente > 0 && cotizacion.monto_retefuente > 0) ||
            (cotizacion.reteiva > 0 && cotizacion.monto_reteiva > 0) ||
            (cotizacion.ica > 0 && cotizacion.monto_ica > 0) ||
            (cotizacion.reteica > 0 && cotizacion.monto_reteica > 0)) && (
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>
                Retenciones:
              </div>
              {cotizacion.retefuente > 0 && cotizacion.monto_retefuente > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#ff8c00' }}>
                  <span>Retefuente ({cotizacion.retefuente}%):</span>
                  <span>-${Math.round(cotizacion.monto_retefuente).toLocaleString('es-CO')}</span>
                </div>
              )}
              {cotizacion.reteiva > 0 && cotizacion.monto_reteiva > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#3b82f6' }}>
                  <span>ReteIVA ({cotizacion.reteiva}%):</span>
                  <span>-${Math.round(cotizacion.monto_reteiva).toLocaleString('es-CO')}</span>
                </div>
              )}
              {cotizacion.ica > 0 && cotizacion.monto_ica > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#a855f7' }}>
                  <span>ICA ({cotizacion.ica}%):</span>
                  <span>-${Math.round(cotizacion.monto_ica).toLocaleString('es-CO')}</span>
                </div>
              )}
              {cotizacion.reteica > 0 && cotizacion.monto_reteica > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#22c55e' }}>
                  <span>ReteICA ({cotizacion.reteica}%):</span>
                  <span>-${Math.round(cotizacion.monto_reteica).toLocaleString('es-CO')}</span>
                </div>
              )}
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '18px', borderTop: '2px solid #ddd', fontSize: '22px', fontWeight: 'bold', color: '#f00000' }}>
            <span>TOTAL A PAGAR:</span>
            <span>${Math.round(cotizacion.total || 0).toLocaleString('es-CO')}</span>
          </div>
        </div>

        {/* Observaciones */}
        {cotizacion.observaciones && (
          <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>OBSERVACIONES:</h4>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.6' }}>{cotizacion.observaciones}</p>
          </div>
        )}

        {/* Footer con información de negocio completa - SIN EMOJIS Y CON AMBOS WHATSAPP */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ marginBottom: '15px' }}>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0 0 10px 0' }}>
              Tintas y Tecnología
            </p>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
              Calle 14 # 5-44 local 1 Barrio Centro, Santa Marta
            </p>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
              WhatsApp: 3102605693 | WhatsApp: 3122405144
            </p>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
              tintasytecnologia2018@gmail.com | www.tintasytecnologia.com
            </p>
            <p style={{ fontSize: '11px', color: '#888', margin: '5px 0' }}>
              Horario: Lun-Sáb 8:00am-6:20pm | Dom y Festivos 9:00am-12:30pm
            </p>
          </div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '15px' }}>
            <p style={{ margin: '0' }}>Cotización #{generarNumeroCotizacion(cotizacion, todasCotizaciones)}</p>
          </div>
        </div>
      </div>
    </>
  )
}
