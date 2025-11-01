# 🚚 MÓDULO DE DOMICILIOS v2.2.0

## ⚡ INICIO RÁPIDO

### 1️⃣ Ejecutar SQL en Supabase
1. Ve a: https://cxxifwpwarbrrodtzyqn.supabase.co
2. Abre `SQL Editor`
3. Copia y ejecuta: `SQL_AGREGAR_DOMICILIO_COTIZACIONES.sql`
4. Espera mensaje: "Columnas de domicilio agregadas exitosamente"

### 2️⃣ Subir a GitHub
1. Reemplaza todos los archivos del repositorio con este ZIP
2. Commit: "feat: módulo de domicilios v2.2.0"
3. Push a `main`

### 3️⃣ Vercel Deploy
- Deploy automático en ~2-3 minutos
- Verifica en: https://vercel.com/tintasytecnologias-projects/panel-admin

---

## ✅ QUÉ SE AGREGÓ

### Nuevos Archivos:
```
app/domicilios/
├── layout.js
├── page.js (lista de domicilios)
└── nuevo/page.js (agregar domicilio)

SQL_AGREGAR_DOMICILIO_COTIZACIONES.sql
DOCUMENTACION_DOMICILIOS.md
README_DOMICILIOS.md (este archivo)
```

### Archivos Modificados:
```
components/Sidebar.js
app/cotizaciones/nueva/page.js
```

---

## 🎯 NUEVAS FUNCIONALIDADES

### 1. Módulo de Domicilios
- 📋 Lista de 250 barrios con tarifas
- 🔍 Búsqueda en tiempo real
- ✏️ Edición inline de precios
- ➕ Agregar nuevos domicilios
- 🗑️ Eliminar domicilios
- 📊 Estadísticas (min/max/promedio)

### 2. Cotizaciones con Domicilio
- ✅ Checkbox opcional "Incluir envío"
- 🔍 Búsqueda de barrios
- 💰 Cálculo automático en totales
- 💾 Guardado de delivery_id y precio

### 3. Nuevo Enlace en Sidebar
- 🚚 Domicilios (entre Productos y Reportes)

---

## 📖 DOCUMENTACIÓN COMPLETA

Lee `DOCUMENTACION_DOMICILIOS.md` para:
- Ejemplos de uso
- Troubleshooting
- Estructura de base de datos
- Tips y mejores prácticas

---

## 🔥 VERIFICACIÓN RÁPIDA

Después del deploy, verifica:

1. ✅ Sidebar tiene opción "🚚 Domicilios"
2. ✅ `/domicilios` muestra 250 barrios
3. ✅ `/domicilios/nuevo` abre formulario
4. ✅ En cotizaciones aparece checkbox de domicilio
5. ✅ Buscar barrio funciona
6. ✅ Totales incluyen domicilio

---

## 📊 TARIFAS PRECARGADAS

- **$6,000** - Centro y cercanos (~110 barrios)
- **$7,000-$8,000** - Zona intermedia (~80 barrios)
- **$12,000-$15,000** - Alejados (~40 barrios)
- **$16,000-$26,000** - Turísticos (~20 barrios)

**Total:** 250 barrios de Santa Marta

---

## 🚀 ¡LISTO PARA USAR!

Después de seguir los 3 pasos, el sistema estará funcionando completamente.

**Usuarios:**
- `tintasytecnologia1` / `@Np2026.ñ`
- `tintasytecnologia2` / `@Np2026.ñ`

---

**Versión:** v2.2.0  
**Fecha:** 30 Octubre 2025  
**Proyecto:** Panel Admin Tintas y Tecnología
