# CORRECCIÓN: Desglose de IVA en PDF de Cotización

## 📦 CONTENIDO DE ESTE ZIP

Este archivo contiene la corrección completa para el problema del desglose de IVA que no aparecía en el PDF de cotización.

### Archivos incluidos:

1. **SQL_AGREGAR_DESGLOSE_IVA.sql**
   - Script SQL para ejecutar en Supabase
   - Agrega las columnas necesarias a la tabla cotizaciones

2. **INSTRUCCIONES_CORRECCION_IVA.md**
   - Guía completa paso a paso
   - Explicación del problema y la solución
   - Instrucciones detalladas de implementación

3. **app/cotizaciones/nueva/page.js**
   - Archivo actualizado para crear cotizaciones
   - Guarda el desglose de IVA en la BD

4. **app/cotizaciones/[id]/page.js**
   - Archivo actualizado para ver cotizaciones
   - Muestra el desglose en pantalla y PDF

5. **app/cotizaciones/[id]/editar/page.js**
   - Archivo actualizado para editar cotizaciones
   - Permite modificar el desglose de IVA

## 🚀 INICIO RÁPIDO

### PASO 1: SQL en Supabase
```
1. Abre Supabase
2. Ve a SQL Editor
3. Ejecuta SQL_AGREGAR_DESGLOSE_IVA.sql
```

### PASO 2: Actualizar en GitHub
```
1. Reemplaza los 3 archivos .js en tu repo
2. Commit y push los cambios
3. Vercel desplegará automáticamente
```

### PASO 3: Probar
```
1. Crea una nueva cotización
2. Activa "Mostrar desglose de IVA (19%)"
3. Descarga el PDF
4. ✅ Verifica que aparezca el desglose
```

## 📖 DOCUMENTACIÓN COMPLETA

Lee el archivo **INSTRUCCIONES_CORRECCION_IVA.md** para:
- Explicación detallada del problema
- Instrucciones paso a paso
- Solución de problemas
- Notas importantes

## ✅ LO QUE SE CORRIGIÓ

- ✅ El desglose de IVA ahora se guarda en la base de datos
- ✅ El PDF muestra correctamente el desglose
- ✅ La vista en pantalla muestra el desglose
- ✅ Se puede editar el desglose en cotizaciones existentes
- ✅ Compatible con cotizaciones antiguas

---

**¿Dudas?** Revisa INSTRUCCIONES_CORRECCION_IVA.md
