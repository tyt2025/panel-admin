# 🔧 Módulo de Garantías - Panel Admin Tintas

## 📋 Descripción

Módulo completo de gestión de garantías para el Panel Admin Tintas y Tecnología. Permite registrar, consultar y gestionar productos que los clientes traen por garantía.

## ✨ Características

### Registro Completo de Garantías
- ✅ Datos del cliente (nombre, NIT/cédula)
- ✅ Datos del producto (referencia, marca, tipo de equipo)
- ✅ Fecha de compra
- ✅ Descripción detallada de la falla
- ✅ Registro de accesorios (caja, cables, cargador)
- ✅ Observaciones adicionales (rayones, golpes, etc.)
- ✅ Estados: Recibido, En Revisión, Reparado, Entregado, Sin Solución

### Gestión y Consulta
- ✅ Lista completa de garantías
- ✅ Búsqueda por cliente, documento, referencia o marca
- ✅ Estadísticas de garantías por estado
- ✅ Vista detallada de cada garantía
- ✅ Actualización de estados
- ✅ Historial de fechas (registro y última actualización)

### Integración con Dashboard
- ✅ Contador de garantías en dashboard principal
- ✅ Botón de acción rápida para registrar garantías
- ✅ Navegación desde el menú lateral

## 📦 Archivos Incluidos

### Nuevos Archivos Creados
```
app/garantias/
├── page.js                    # Lista de garantías
├── layout.js                  # Layout del módulo
├── nueva/
│   └── page.js               # Registrar nueva garantía
└── [id]/
    └── page.js               # Ver detalle de garantía

components/
└── Sidebar.js                 # Actualizado con opción de Garantías

app/dashboard/
└── page.js                    # Actualizado con contador de garantías

CREAR_TABLA_GARANTIAS.sql     # Script SQL para crear la tabla
INSTRUCCIONES_GARANTIAS.md    # Este archivo
```

## 🚀 Instalación

### Paso 1: Crear la Tabla en Supabase

1. Abre tu proyecto en Supabase
2. Ve a **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido de `CREAR_TABLA_GARANTIAS.sql`
5. Ejecuta el script (botón "Run")
6. Verifica que la tabla `garantias` se creó correctamente en **Table Editor**

### Paso 2: Subir el Código a GitHub

```bash
# Asegúrate de estar en la carpeta del proyecto
cd panel-admin-tintas-garantias

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Agregar módulo de Garantías"

# Subir a GitHub
git push origin main
```

### Paso 3: Redesplegar en Vercel

Si ya tienes el proyecto en Vercel:

1. Ve a tu proyecto en Vercel
2. El redespliegue se hará automáticamente al hacer push a GitHub
3. Espera 2-3 minutos
4. Verifica que el despliegue fue exitoso

Si es la primera vez:

1. Ve a [vercel.com](https://vercel.com)
2. Click en "New Project"
3. Importa tu repositorio de GitHub
4. Configura las variables de entorno (si no lo has hecho):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click en "Deploy"

## 🎯 Cómo Usar

### Registrar una Nueva Garantía

1. Entra al panel con tu usuario
2. Haz click en **"Garantías"** en el menú lateral (ícono 🔧)
   - O usa el botón **"+ Registrar Garantía"** en el Dashboard
3. Llena el formulario con los datos:
   - **Datos del Cliente**: Nombre y documento
   - **Datos del Producto**: Referencia, marca, tipo y fecha de compra
   - **Descripción de la Falla**: Detalla el problema
   - **Accesorios**: Marca los que trae (caja, cables, cargador)
   - **Observaciones**: Anota rayones, golpes u otros detalles
   - **Estado**: Selecciona el estado inicial
4. Click en **"Registrar Garantía"**

### Consultar Garantías

1. Ve a **"Garantías"** en el menú lateral
2. Verás:
   - Total de garantías
   - Garantías por estado (En Revisión, Reparados, Entregados)
   - Lista completa con búsqueda
3. Usa la barra de búsqueda para filtrar por:
   - Nombre del cliente
   - Documento
   - Referencia del producto
   - Marca

### Ver Detalle de una Garantía

1. En la lista de garantías, click en **"Ver"**
2. Verás toda la información:
   - Datos del cliente
   - Datos del producto
   - Descripción de la falla
   - Accesorios incluidos
   - Observaciones
   - Fechas de registro y actualización
3. Puedes **cambiar el estado** haciendo click en "Cambiar Estado"

### Actualizar Estado de una Garantía

1. Entra al detalle de la garantía
2. Click en **"Cambiar Estado"**
3. Selecciona el nuevo estado:
   - **Recibido**: Acaba de llegar
   - **En Revisión**: Está siendo evaluado
   - **Reparado**: Ya fue solucionado
   - **Entregado**: Se devolvió al cliente
   - **Sin Solución**: No pudo repararse
4. Click en **"Guardar"**

## 📊 Tipos de Equipo Disponibles

El módulo soporta los siguientes tipos de equipo:

- Computador
- Laptop
- Impresora
- Monitor
- Teclado
- Mouse
- Tablet
- Celular
- Disco Duro
- Memoria RAM
- Otro

## 🔍 Campos de la Tabla `garantias`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | BIGSERIAL | ID único autoincremental |
| nombre_cliente | VARCHAR(255) | Nombre del cliente * |
| documento | VARCHAR(50) | NIT o cédula * |
| referencia | VARCHAR(255) | Referencia del producto * |
| marca | VARCHAR(100) | Marca del producto * |
| tipo_equipo | VARCHAR(50) | Tipo de equipo * |
| fecha_compra | DATE | Fecha de compra |
| descripcion_falla | TEXT | Descripción de la falla * |
| trae_caja | BOOLEAN | Si trae caja original |
| trae_cables | BOOLEAN | Si trae cables |
| trae_cargador | BOOLEAN | Si trae cargador |
| observaciones | TEXT | Observaciones adicionales |
| estado | VARCHAR(50) | Estado actual * |
| vendedor_id | INTEGER | ID del vendedor * |
| created_at | TIMESTAMP | Fecha de registro |
| updated_at | TIMESTAMP | Última actualización |

\* = Campo obligatorio

## 🎨 Personalización

### Agregar Más Tipos de Equipo

Edita el archivo `app/garantias/nueva/page.js`, línea ~110:

```javascript
<select name="tipo_equipo" ...>
  <option value="tu_nuevo_tipo">Tu Nuevo Tipo</option>
  // ... resto de opciones
</select>
```

### Agregar Más Estados

1. Actualiza el select en `app/garantias/nueva/page.js`
2. Actualiza las funciones `getEstadoColor` y `getEstadoLabel` en:
   - `app/garantias/page.js`
   - `app/garantias/[id]/page.js`

### Cambiar Colores de Estados

En los archivos `page.js`, busca la función `getEstadoColor`:

```javascript
const getEstadoColor = (estado) => {
  const colors = {
    recibido: 'bg-blue-100 text-blue-800',
    tu_estado: 'bg-tu_color-100 text-tu_color-800',
    // ...
  }
  return colors[estado] || 'bg-gray-100 text-gray-800'
}
```

## 🐛 Solución de Problemas

### Error: "relation public.garantias does not exist"
**Causa**: La tabla no fue creada en Supabase  
**Solución**: Ejecuta el script `CREAR_TABLA_GARANTIAS.sql` en Supabase

### No aparece la opción "Garantías" en el menú
**Causa**: El Sidebar no se actualizó  
**Solución**: Verifica que el archivo `components/Sidebar.js` tenga la entrada de Garantías

### El contador de garantías muestra 0 aunque hay registros
**Causa**: El dashboard no está consultando correctamente  
**Solución**: 
1. Verifica que la tabla `garantias` existe
2. Revisa que el campo `vendedor_id` esté correcto
3. Mira los logs en la consola del navegador (F12)

### Error al guardar garantía
**Causa**: Falta algún campo obligatorio  
**Solución**: Asegúrate de llenar todos los campos marcados con *

## 📈 Mejoras Futuras Sugeridas

- [ ] Imprimir ticket de recepción de garantía
- [ ] Envío de notificaciones por WhatsApp sobre cambios de estado
- [ ] Adjuntar fotos del equipo al registrar
- [ ] Historial de cambios de estado
- [ ] Tiempo promedio de reparación
- [ ] Reportes específicos de garantías
- [ ] Filtros avanzados por fecha y tipo de equipo
- [ ] Exportar lista de garantías a Excel

## 📞 Información del Proyecto

**Proyecto**: Panel Admin Tintas y Tecnología  
**Módulo**: Garantías  
**Versión**: 2.0.1  
**Fecha**: Octubre 2025

## 🎉 ¡Listo para Usar!

Con estos pasos, el módulo de Garantías estará completamente funcional en tu Panel Admin.

Si tienes dudas o problemas:
1. Revisa esta documentación
2. Verifica los logs en consola (F12)
3. Confirma que la tabla se creó en Supabase
4. Asegúrate de que el código se subió correctamente a GitHub

---

**Desarrollado para Tintas y Tecnología** ❤️
