# 🚀 Sistema Completo de Cotizaciones - Tintas y Tecnología

Sistema profesional de gestión de cotizaciones con carrito de productos, generación de PDF/JPG, integración con WhatsApp, **módulo de garantías** y **módulo de taller**.

## ✨ Características Completas

### 🔐 Autenticación
- ✅ Login seguro con validación en Supabase
- ✅ Sesión persistente
- ✅ 2 vendedores (Eash y Nayleth)

### 📊 Dashboard
- ✅ Estadísticas en tiempo real
- ✅ Contador de cotizaciones, clientes, productos, garantías y **taller**
- ✅ Acciones rápidas
- ✅ Diseño moderno y responsive

### 📋 Gestión de Cotizaciones
- ✅ Crear cotizaciones con carrito de productos
- ✅ Buscar y agregar productos dinámicamente
- ✅ Editar cantidades y precios en tiempo real
- ✅ Cálculos automáticos (subtotal, descuento, IVA, total)
- ✅ Lista de cotizaciones con filtros
- ✅ Ver detalle completo
- ✅ Estados (pendiente, aceptada, rechazada)
- ✅ Eliminar cotizaciones

### 🔧 Gestión de Garantías
- ✅ Registrar productos en garantía
- ✅ Datos del cliente (nombre, NIT/cédula)
- ✅ Datos del producto (referencia, marca, tipo de equipo)
- ✅ Fecha de compra
- ✅ Descripción detallada de la falla
- ✅ Registro de accesorios (caja, cables, cargador)
- ✅ Observaciones adicionales (rayones, golpes, etc.)
- ✅ Estados: Recibido, En Revisión, Reparado, Entregado, Sin Solución
- ✅ Búsqueda y filtrado
- ✅ Actualización de estados

### 🛠️ Gestión de Taller (NUEVO)
- ✅ Registro de servicios (mantenimiento, reparación, revisión)
- ✅ Datos del cliente (nombre, teléfono)
- ✅ Datos del equipo (referencia, tipo, marca)
- ✅ Registro de accesorios (cables, cargador, caja, otros)
- ✅ Observaciones detalladas del estado
- ✅ **Carga de múltiples fotos** (hasta 10 fotos, 5MB cada una)
- ✅ Estados: Recibido, Diagnóstico, Reparando, Listo, Entregado, Sin Solución, Abandonado
- ✅ **Aviso legal de 90 días** (productos abandonados según Código de Comercio)
- ✅ Contador automático de días transcurridos
- ✅ Alertas de tiempo (30, 60, 90 días)
- ✅ Búsqueda y filtrado avanzado
- ✅ Galería de fotos con vista ampliada

### 👥 Gestión de Clientes
- ✅ CRUD completo de clientes
- ✅ Búsqueda en tiempo real
- ✅ Datos: nombre, teléfono, NIT, email, dirección, ciudad
- ✅ Historial asociado a vendedor

### 🛍️ Gestión de Productos
- ✅ CRUD completo de productos
- ✅ Carga directa de imágenes
- ✅ Vista previa antes de crear
- ✅ Validación de tipo y tamaño (máx 5MB)
- ✅ Almacenamiento en Supabase Storage
- ✅ URL pública generada automáticamente

### 📄 Generación de Documentos
- ✅ Botón para generar PDF (implementación básica)
- ✅ Botón para generar imagen JPG (implementación básica)
- ✅ Plantilla lista para personalizar

### 📱 Integración WhatsApp
- ✅ Envío directo desde la cotización
- ✅ Mensaje pre-formateado con datos de la cotización
- ✅ Apertura de WhatsApp con un click

### 📈 Reportes
- ✅ Estadísticas generales
- ✅ Reportes del mes actual
- ✅ Métricas de ventas
- ✅ Promedios y totales

## 🛠️ Tecnologías

- **Frontend**: Next.js 14 (App Router)
- **Estilos**: Tailwind CSS
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **PDF**: jspdf
- **Imágenes**: html2canvas
- **Fechas**: date-fns

## 📦 Instalación

### Requisitos Previos
- Node.js 18+ 
- Cuenta en Supabase
- Cuenta en Vercel (para deployment)

### Instalación Local

1. **Clonar/Extraer el proyecto**
```bash
cd panel-admin-completo
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear archivo `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://cxxifwpwarbrrodtzyqn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

5. **Abrir en navegador**
```
http://localhost:3000
```

## 🚀 Deployment en Vercel

### Paso 1: Subir a GitHub
1. Crea un repositorio en GitHub
2. Sube todos los archivos del proyecto

### Paso 2: Conectar con Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Click en "New Project"
3. Importa tu repositorio de GitHub
4. Framework: **Next.js** (detectado automáticamente)

### Paso 3: Variables de Entorno
Agrega estas 2 variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://cxxifwpwarbrrodtzyqn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4eGlmd3B3YXJicnJvZHR6eXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMjc5OTAsImV4cCI6MjA3MzgwMzk5MH0.tMgoakEvw8wsvrWZpRClZo3BpiUIJ4OQrQsiM4BGM54
```

### Paso 4: Deploy
1. Click "Deploy"
2. Espera 2-3 minutos
3. ¡Listo! ✅

## 👤 Usuarios de Prueba

**Vendedor 1 (Eash):**
- Usuario: `tintasytecnologia1`
- Contraseña: `@Np2026.ñ`
- Vendedor ID: 1

**Vendedor 2 (Nayleth):**
- Usuario: `tintasytecnologia2`
- Contraseña: `@Np2026.ñ`
- Vendedor ID: 2

## 📁 Estructura del Proyecto

```
panel-admin-completo/
├── app/
│   ├── dashboard/          # Dashboard principal
│   ├── login/              # Página de login
│   ├── cotizaciones/       # Gestión de cotizaciones
│   │   ├── nueva/          # Crear cotización
│   │   └── [id]/           # Ver detalle
│   ├── garantias/          # Gestión de garantías
│   │   ├── nueva/          # Registrar garantía
│   │   └── [id]/           # Ver detalle
│   ├── taller/             # Gestión de taller (NUEVO)
│   │   ├── nuevo/          # Registrar servicio
│   │   └── [id]/           # Ver detalle
│   ├── clientes/           # Gestión de clientes
│   │   └── nuevo/          # Crear cliente
│   ├── productos/          # Gestión de productos
│   │   └── nuevo/          # Crear producto
│   ├── reportes/           # Reportes y estadísticas
│   ├── layout.js           # Layout principal
│   ├── page.js             # Redirect a login
│   └── globals.css         # Estilos globales
├── components/
│   └── Sidebar.js          # Menú lateral
├── lib/
│   └── supabase.js         # Cliente de Supabase
├── CREAR_TABLA_GARANTIAS.sql       # SQL para tabla de garantías
├── CREAR_TABLA_TALLER.sql          # SQL para tabla de taller (NUEVO)
├── STORAGE_TALLER_SETUP.sql        # SQL para storage de fotos (NUEVO)
├── INSTRUCCIONES_GARANTIAS.md     # Documentación de garantías
├── DOCUMENTACION_TALLER.md        # Documentación de taller (NUEVO)
├── CHANGELOG_GARANTIAS.md         # Registro de cambios
├── package.json
├── next.config.js
├── tailwind.config.js
├── jsconfig.json
└── README.md
```

## 🎯 Guía de Uso

### Crear una Cotización

1. **Dashboard** → Click en "+ Nueva Cotización"
2. **Seleccionar cliente** de la lista
3. **Buscar productos** en el buscador
4. **Agregar al carrito** haciendo click en el producto
5. **Ajustar cantidades** y precios si es necesario
6. **Configurar descuento** e IVA
7. **Agregar observaciones** (opcional)
8. **Crear Cotización**

### Registrar una Garantía (NUEVO)

1. **Dashboard** → Click en "+ Registrar Garantía"
   - O ve a **Garantías** en el menú lateral
2. **Datos del Cliente**:
   - Nombre del cliente
   - NIT o cédula
3. **Datos del Producto**:
   - Referencia (modelo)
   - Marca
   - Tipo de equipo (computador, impresora, etc.)
   - Fecha de compra (opcional)
   - Descripción detallada de la falla
4. **Accesorios**:
   - Marca si trae: caja, cables, cargador
5. **Observaciones**:
   - Anota rayones, golpes, partes faltantes, etc.
6. **Estado**: Selecciona estado inicial
7. **Registrar Garantía**

### Registrar Servicio en Taller (NUEVO)

1. **Dashboard** → Click en "🛠️ Registrar en Taller"
   - O ve a **Taller** en el menú lateral → "+ Registrar Nuevo Servicio"
2. **Tipo de Servicio**:
   - Mantenimiento, Reparación o Revisión
3. **Datos del Cliente**:
   - Nombre completo
   - Teléfono
4. **Datos del Equipo**:
   - Referencia / Modelo
   - Tipo de equipo (computador, impresora, parlante, etc.)
   - Marca
5. **Accesorios**:
   - Marca si trae: cables, cargador, caja
   - Campo para otros accesorios
6. **Observaciones**:
   - Describe el estado: rayones, golpes, partes faltantes, etc.
7. **Fotos** (opcional):
   - Sube hasta 10 fotos (5MB cada una)
   - Vista previa automática
8. **Registrar Servicio**
9. **Importante**: Se mostrará el aviso legal de 90 días

### Ver y Gestionar Servicios de Taller

1. **Taller** → Ver lista completa
2. **Ver estadísticas** por estado
3. **Buscar** por cliente, teléfono, referencia o marca
4. **Filtrar** por estado
5. **Click en "Ver Detalle"** para ver información completa
6. **Ver fotos** (click para ampliar)
7. **Cambiar Estado** según avance del servicio
8. **Ver contador de días** y alertas de tiempo

### Ver y Enviar Cotización

1. **Lista de Cotizaciones** → Click en "Ver"
2. **Revisar detalle** de la cotización
3. **Generar PDF** para impresión
4. **Generar JPG** para redes sociales
5. **Enviar por WhatsApp** directamente

### Agregar Cliente

1. **Clientes** → "+ Nuevo Cliente"
2. **Llenar formulario** (nombre y teléfono obligatorios)
3. **Guardar Cliente**

## 🔧 Personalización

### Cambiar Logo
Edita el header en `components/Sidebar.js`

### Modificar Colores
Edita `tailwind.config.js`:
```js
colors: {
  primary: '#1e40af',  // Azul principal
  secondary: '#64748b', // Gris secundario
}
```

### Agregar Campos
1. Modificar tabla en Supabase
2. Actualizar formularios en las páginas correspondientes

## 📝 Próximas Mejoras Sugeridas

- [ ] Implementar generación de PDF completa
- [ ] Implementar generación de imagen JPG completa
- [ ] Agregar gráficas en reportes
- [ ] Exportar reportes a Excel
- [ ] Sistema de notificaciones
- [ ] Historial de cambios
- [ ] Duplicar cotizaciones
- [ ] Plantillas de cotización
- [ ] Multi-moneda
- [ ] Inventario de productos
- [ ] Imprimir ticket de garantía
- [ ] Notificaciones WhatsApp para garantías
- [ ] Adjuntar fotos en garantías
- [ ] Reportes de garantías
- [ ] **Imprimir ticket de servicio de taller**
- [ ] **Notificaciones automáticas de taller (60, 80, 90 días)**
- [ ] **Costos y presupuestos en taller**
- [ ] **Reportes de servicios de taller**

## 🆕 Novedades en v2.1.0

- ✅ **Módulo completo de Taller**
- ✅ Registro de servicios (mantenimiento, reparación, revisión)
- ✅ Carga de múltiples fotos (hasta 10 por servicio)
- ✅ Aviso legal de 90 días (productos abandonados)
- ✅ Contador automático de días transcurridos
- ✅ Alertas de tiempo por color
- ✅ Estados de servicio actualizables
- ✅ Galería de fotos con vista ampliada
- ✅ Contador de taller en dashboard
- ✅ Botón de acción rápida en dashboard

Ver `DOCUMENTACION_TALLER.md` para más detalles del nuevo módulo.

## 🆕 Novedades en v2.0.1

- ✅ Módulo completo de Garantías
- ✅ Contador de garantías en dashboard
- ✅ Estados de garantía actualizables
- ✅ Registro de accesorios
- ✅ Campo de observaciones

Ver `CHANGELOG_GARANTIAS.md` para más detalles.

## 🐛 Solución de Problemas

### Error: "Module not found"
- **Solución**: Verifica que jsconfig.json esté presente
- Asegúrate de tener todas las dependencias instaladas

### Error: "Can't connect to Supabase"
- **Solución**: Verifica las variables de entorno
- Confirma que la URL y Anon Key sean correctas

### Los datos no se cargan
- **Solución**: Verifica que las tablas existan en Supabase
- Confirma que el vendedor_id esté correctamente asignado

## 📞 Soporte

Para dudas o problemas:
1. Revisa la documentación
2. Verifica los logs en la consola del navegador
3. Revisa los logs de deployment en Vercel

## 📄 Licencia

Proyecto privado para Tintas y Tecnología

---

**Desarrollado con ❤️ para Tintas y Tecnología**

🚀 **¡Sistema listo para producción!**
