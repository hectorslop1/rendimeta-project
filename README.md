# Rendimeta - Monorepo

Monorepo unificado del proyecto **Rendimeta**, que integra la aplicación móvil y la plataforma web para la gestión de productividad de despachadores.

## 📁 Estructura del Proyecto

```
rendimeta_project/
├── rendimeta-mobile/     # Aplicación móvil Flutter
├── rendimeta-web/        # Aplicación web Next.js
├── scripts/              # Scripts de gestión del monorepo
├── .env                  # Variables de entorno compartidas
└── README.md            # Este archivo
```

## 🚀 Proyectos

### 📱 Rendimeta Mobile

- **Tecnología**: Flutter (Dart)
- **Descripción**: App móvil de productividad para despachadores
- **Directorio**: `./rendimeta-mobile/`
- **Repositorio original**: https://github.com/hectorslop1/rendimeta.git

### 🌐 Rendimeta Web

- **Tecnología**: Next.js 16 + React 19 + TypeScript
- **Descripción**: Dashboard web para gestión y análisis
- **Directorio**: `./rendimeta-web/`
- **Repositorio original**: https://github.com/CB-Luna/gaslogistica.git

## 🛠️ Requisitos Previos

### Para la aplicación móvil:

- Flutter SDK ^3.11.0
- Dart SDK ^3.11.0
- Android Studio / Xcode (según plataforma)

### Para la aplicación web:

- Node.js >= 20.x
- npm o yarn
- PostgreSQL (para la base de datos)

## 📦 Instalación

### Instalación completa (ambos proyectos):

```bash
# Desde la raíz del monorepo
./scripts/install-all.sh
```

### Instalación individual:

#### Aplicación Móvil:

```bash
cd rendimeta-mobile
flutter pub get
```

#### Aplicación Web:

```bash
cd rendimeta-web
npm install
```

## 🏃 Desarrollo

### Ejecutar ambos proyectos:

```bash
./scripts/dev-all.sh
```

### Ejecutar proyectos individualmente:

#### Aplicación Móvil:

```bash
cd rendimeta-mobile
flutter run
```

#### Aplicación Web:

```bash
cd rendimeta-web
npm run dev
```

La aplicación web estará disponible en `http://localhost:3000`

## 🏗️ Build

### Build de producción - Móvil:

```bash
cd rendimeta-mobile

# Android
flutter build apk --release

# iOS
flutter build ios --release
```

### Build de producción - Web:

```bash
cd rendimeta-web
npm run build
npm start
```

## 🗄️ Base de Datos (Web)

La aplicación web utiliza Prisma como ORM con PostgreSQL.

### Configurar base de datos:

```bash
cd rendimeta-web

# Ejecutar migraciones
npx prisma migrate dev

# Generar cliente Prisma
npx prisma generate

# Poblar base de datos (seed)
npx prisma db seed
```

### Abrir Prisma Studio:

```bash
cd rendimeta-web
npx prisma studio
```

## 🧪 Testing

### Tests - Móvil:

```bash
cd rendimeta-mobile
flutter test
```

### Tests - Web:

```bash
cd rendimeta-web

# Tests E2E con Playwright
npm run e2e

# Tests E2E con interfaz
npm run e2e:headed
```

## 📝 Variables de Entorno

### Móvil (.env en raíz):

Configurar variables necesarias para la app móvil.

### Web (rendimeta-web/.env.local):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/rendimeta"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## 🔄 Git Workflow

Este monorepo sigue una estructura de branches:

- `main`: Producción
- `develop`: Desarrollo
- `feature/*`: Nuevas características
- `fix/*`: Correcciones

### Commits:

Usar conventional commits:

```
feat(mobile): agregar nueva funcionalidad
fix(web): corregir bug en dashboard
docs: actualizar README
```

## 🤝 Contribución

1. Crear un branch desde `develop`
2. Realizar cambios en el proyecto correspondiente
3. Hacer commit con mensajes descriptivos
4. Crear Pull Request hacia `develop`

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

## 👥 Equipo

- **Móvil**: @hectorslop1
- **Web**: @CB-Luna

## 🔗 Enlaces

- **Monorepo**: https://github.com/hectorslop1/rendimeta-project.git
- **Móvil (original)**: https://github.com/hectorslop1/rendimeta.git
- **Web (original)**: https://github.com/CB-Luna/gaslogistica.git

## 📞 Soporte

Para reportar issues o solicitar features, usar el sistema de Issues de GitHub.
