# 🚀 Guía de Inicio Rápido - Rendimeta

> **Una herramienta de RendiChicas**

## ⚡ La Forma Más Rápida de Empezar

### Opción 1: Selector Interactivo (Recomendado)

Desde la raíz del proyecto:

```bash
./dev.sh
```

Verás un menú como este:

```
╔════════════════════════════════════════════════════════════╗
║                      RENDIMETA                             ║
║              Una herramienta de RendiChicas                ║
╚════════════════════════════════════════════════════════════╝

¿Qué aplicación deseas iniciar?

  1) 🌐 App Web (Next.js)
  2) 📱 App Móvil (Flutter)
  3) 🚀 Ambas aplicaciones
  0) ❌ Salir

Selecciona una opción [1-3]:
```

### Opción 2: App Web Directa

```bash
cd rendimeta-web
./dev.sh
```

**Esto hace TODO automáticamente:**
- ✅ Detiene procesos existentes en puerto 3000
- ✅ Instala dependencias (si faltan)
- ✅ Limpia caché de Next.js
- ✅ Inicia servidor de desarrollo
- ✅ **Abre el navegador automáticamente** en `http://localhost:3000/login`

---

## 🔐 Usuarios de Prueba

Una vez que el navegador se abra, verás la página de login con botones de "Acceso rápido":

| Usuario | Contraseña | Rol | Nivel |
|---------|------------|-----|-------|
| `admin@sistema.com` | `admin123` | Super Admin | 5 |
| `administrador@sistema.com` | `admin123` | Administrador | 4 |
| `gerente.regional@sistema.com` | `admin123` | Gerente Regional | 3 |
| `gerente.estacion@sistema.com` | `admin123` | Gerente Estación | 2 |
| `supervisor@sistema.com` | `admin123` | Encargado Turno | 1 |
| `empleado@sistema.com` | `admin123` | Despachador | 0 |

**Simplemente haz clic en cualquier botón** para acceder con ese usuario.

---

## 🎨 Qué Verás

### Branding Unificado
- **Nombre**: Rendimeta
- **Colores**: Magenta (#E6007A), Púrpura (#7A28FF), Cyan (#2DE2E2)
- **Tipografías**: Space Grotesk (títulos) + Manrope (cuerpo)
- **Endorsement**: "Una herramienta de RendiChicas"

### Funcionalidades Disponibles
- ✅ Dashboard principal con KPIs
- ✅ Módulos: Operativos, Financieros, Clientes, Productividad
- ✅ Gestión de estaciones
- ✅ Reportes y analytics
- ✅ Sistema de temas personalizables
- ✅ Modo oscuro/claro

---

## 🛑 Detener el Servidor

Simplemente presiona `Ctrl+C` en la terminal donde está corriendo.

El script limpiará todo automáticamente.

---

## 📱 App Móvil

Para la app móvil, necesitas:

1. **Flutter instalado** (https://flutter.dev/docs/get-started/install)
2. **Emulador o dispositivo físico conectado**

Luego:

```bash
./dev.sh
```

Selecciona opción `2` (App Móvil)

---

## ❓ Solución de Problemas

### Puerto 3000 ocupado

El script automáticamente detecta y detiene procesos en puerto 3000.

Si aún así tienes problemas:

```bash
# Matar manualmente procesos en puerto 3000
lsof -ti:3000 | xargs kill -9
```

### Dependencias no instaladas

El script detecta si faltan dependencias y las instala automáticamente.

Si quieres forzar reinstalación:

```bash
cd rendimeta-web
rm -rf node_modules package-lock.json
./dev.sh
```

### Navegador no se abre automáticamente

Abre manualmente: `http://localhost:3000/login`

---

## 📚 Más Información

- **Sistema de Diseño**: Ver `DESIGN_SYSTEM.md`
- **Arquitectura**: Ver `ARCHITECTURE.md`
- **Documentación completa**: Ver `README.md`

---

## 🎯 Siguiente Paso

Una vez que hayas probado la app web, el siguiente paso es:

**Integración con Backend PostgreSQL (IONOS)**

Para esto necesitarás proporcionar las credenciales del servidor.

---

**¿Listo para empezar? Ejecuta:**

```bash
./dev.sh
```

🚀 **¡Disfruta Rendimeta!**
