# Sistema de Diseño Unificado - Rendimeta

> **Versión:** 1.0.0  
> **Última actualización:** Abril 2026

## 🎨 Identidad de Marca

### Nombre del Producto
**Rendimeta**

*"Una herramienta de RendiChicas"*

### Descripción
Sistema de gestión y productividad para estaciones de servicio, diseñado para vendedores, supervisores y gerencia.

---

## 🎯 Plataformas

- **App Móvil (Flutter)**: Optimizada para vendedores/despachadores
- **App Web (Next.js)**: Dirigida a gerencia y administración

---

## 🎨 Paleta de Colores

### Colores Primarios

| Color | Hex | Uso |
|-------|-----|-----|
| **Primary (Magenta)** | `#E6007A` | Acciones principales, CTAs, elementos destacados |
| **Secondary (Púrpura)** | `#7A28FF` | Elementos secundarios, gradientes |
| **Tertiary (Cyan)** | `#2DE2E2` | Acentos, información destacada |

### Colores de Estado

| Color | Hex | Uso |
|-------|-----|-----|
| **Success (Verde)** | `#00B894` | Confirmaciones, logros, metas cumplidas |
| **Warning (Naranja)** | `#FDAA5E` | Advertencias, alertas moderadas |
| **Error (Rojo)** | `#FF6B6B` | Errores, acciones destructivas |

### Colores de Gamificación

| Color | Hex | Uso |
|-------|-----|-----|
| **Gold** | `#FFD700` | Primer lugar, logros premium |
| **Silver** | `#C0C0C0` | Segundo lugar |
| **Bronze** | `#CD7F32` | Tercer lugar |

### Colores Neutros (Light Mode)

| Color | Hex | Uso |
|-------|-----|-----|
| **Background** | `#F8F9FA` | Fondo principal |
| **Surface** | `#FFFFFF` | Tarjetas, paneles |
| **Text Primary** | `#2D3436` | Texto principal |
| **Text Secondary** | `#636E72` | Texto secundario |
| **Text Tertiary** | `#B2BEC3` | Texto deshabilitado, placeholders |
| **Border** | `#E2E8F0` | Bordes, separadores |

### Colores Neutros (Dark Mode)

| Color | Hex | Uso |
|-------|-----|-----|
| **Background** | `#121212` | Fondo principal |
| **Surface** | `#1E1E1E` | Tarjetas, paneles |
| **Text Primary** | `#ECECEC` | Texto principal |
| **Text Secondary** | `#A0A0A0` | Texto secundario |
| **Text Tertiary** | `#5A5A5A` | Texto deshabilitado |

---

## ✍️ Tipografía

### Familias Tipográficas

#### **Space Grotesk** (Display/Títulos)
- **Uso**: Títulos, encabezados, elementos destacados
- **Pesos**: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- **Características**: Moderna, geométrica, alta legibilidad

#### **Manrope** (Cuerpo/UI)
- **Uso**: Texto de cuerpo, UI, labels, botones
- **Pesos**: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- **Características**: Versátil, legible, profesional

### Escala Tipográfica

| Nivel | Tamaño | Peso | Familia | Uso |
|-------|--------|------|---------|-----|
| **Display Large** | 32px | 700 | Space Grotesk | Títulos principales |
| **Display Medium** | 28px | 700 | Space Grotesk | Subtítulos grandes |
| **Headline Large** | 24px | 700 | Space Grotesk | Encabezados de sección |
| **Headline Medium** | 20px | 600 | Space Grotesk | Encabezados secundarios |
| **Headline Small** | 18px | 600 | Space Grotesk | Encabezados terciarios |
| **Title Large** | 16px | 600 | Space Grotesk | Títulos de tarjetas |
| **Body Large** | 16px | 400 | Manrope | Texto principal |
| **Body Medium** | 14px | 400 | Manrope | Texto secundario |
| **Body Small** | 12px | 400 | Manrope | Texto pequeño, captions |
| **Label Large** | 14px | 600 | Manrope | Labels, botones |
| **Label Medium** | 12px | 600 | Manrope | Labels pequeños |
| **Label Small** | 10px | 500 | Manrope | Micro-labels |

---

## 🎭 Componentes UI

### Bordes y Radios

| Elemento | Border Radius |
|----------|---------------|
| **Botones** | 16px |
| **Tarjetas** | 20px |
| **Inputs** | 12px |
| **Badges** | 8px |
| **Avatares** | 50% (circular) |

### Espaciado

Sistema basado en múltiplos de 4px:

| Tamaño | Valor | Uso |
|--------|-------|-----|
| **xs** | 4px | Espaciado mínimo |
| **sm** | 8px | Espaciado pequeño |
| **md** | 16px | Espaciado medio |
| **lg** | 24px | Espaciado grande |
| **xl** | 32px | Espaciado extra grande |
| **2xl** | 48px | Espaciado máximo |

### Elevación (Sombras)

```css
/* Light Mode */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.08);

/* Dark Mode */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.4);
```

---

## 🌈 Gradientes

### Gradiente Principal
```css
linear-gradient(135deg, #E6007A 0%, #7A28FF 100%)
```

### Gradiente XP/Progreso
```css
linear-gradient(90deg, #E6007A 0%, #7A28FF 50%, #2DE2E2 100%)
```

### Gradiente Sutil (Light)
```css
linear-gradient(135deg, #FFF0F7 0%, #F0ECFF 100%)
```

### Gradiente Sutil (Dark)
```css
linear-gradient(135deg, #2A1525 0%, #1E1830 100%)
```

---

## 📱 Adaptación por Plataforma

### App Móvil (Flutter)
- **Enfoque**: Gamificación, interacción táctil, feedback inmediato
- **Animaciones**: Flutter Animate para transiciones fluidas
- **Navegación**: Bottom Navigation Bar
- **Gestos**: Swipe, long-press, pull-to-refresh

### App Web (Next.js)
- **Enfoque**: Dashboards, visualización de datos, gestión
- **Navegación**: Sidebar + Topbar
- **Responsive**: Mobile-first, adaptable a tablets y desktop
- **Interacción**: Hover states, tooltips, modales

---

## 🎯 Principios de Diseño

### 1. **Consistencia**
Mantener coherencia visual y funcional entre ambas plataformas.

### 2. **Claridad**
Información clara, jerarquía visual definida, sin ambigüedades.

### 3. **Eficiencia**
Minimizar pasos para completar tareas, optimizar flujos de trabajo.

### 4. **Accesibilidad**
Contraste adecuado (WCAG AA), tamaños de fuente legibles, áreas táctiles mínimas de 44x44px.

### 5. **Feedback**
Respuesta visual inmediata a todas las acciones del usuario.

### 6. **Gamificación**
Elementos de juego para motivar y recompensar el desempeño.

---

## 🔄 Sincronización de Datos

Ambas aplicaciones se conectan al mismo backend PostgreSQL en IONOS:
- **Tiempo real**: Cambios reflejados entre plataformas
- **Roles**: Vendedor, Supervisor, Gerencia
- **Permisos**: Basados en nivel de acceso

---

## 📦 Implementación

### Flutter (App Móvil)
```dart
// Colores
AppColors.primary      // #E6007A
AppColors.secondary    // #7A28FF
AppColors.tertiary     // #2DE2E2

// Tipografía
GoogleFonts.spaceGrotesk()  // Títulos
GoogleFonts.manrope()       // Cuerpo
```

### Next.js (App Web)
```typescript
// Theme Config
defaultThemeConfig.primaryColor   // #E6007A
defaultThemeConfig.secondaryColor // #7A28FF
defaultThemeConfig.accentColor    // #2DE2E2

// CSS Variables
var(--app-primary-strong)
var(--font-display)  // Space Grotesk
var(--font-sans)     // Manrope
```

---

## 📝 Notas de Versión

### v1.0.0 (Abril 2026)
- ✅ Unificación de branding: **Rendimeta**
- ✅ Paleta de colores sincronizada
- ✅ Tipografías unificadas (Space Grotesk + Manrope)
- ✅ Sistema de tokens de diseño compartido
- ✅ Documentación completa del sistema de diseño

---

## 🚀 Próximos Pasos

1. ⏳ Integración con backend PostgreSQL (IONOS)
2. ⏳ Implementación de autenticación unificada
3. ⏳ Sincronización en tiempo real entre plataformas
4. ⏳ Sistema de notificaciones push
5. ⏳ Analytics y métricas unificadas
