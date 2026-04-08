# Guía de Configuración Inicial - Rendimeta Monorepo

Esta guía te ayudará a configurar el entorno de desarrollo para el monorepo de Rendimeta.

## 📋 Requisitos Previos

### Para Desarrollo Móvil (Flutter)

1. **Flutter SDK 3.11.0 o superior**
   ```bash
   # Verificar instalación
   flutter --version
   
   # Si no está instalado, visita:
   # https://docs.flutter.dev/get-started/install
   ```

2. **Android Studio** (para desarrollo Android)
   - Descargar desde: https://developer.android.com/studio
   - Instalar Android SDK y emulador

3. **Xcode** (para desarrollo iOS - solo macOS)
   - Instalar desde App Store
   - Ejecutar: `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`
   - Ejecutar: `sudo xcodebuild -runFirstLaunch`

### Para Desarrollo Web (Next.js)

1. **Node.js 20.x o superior**
   ```bash
   # Verificar instalación
   node --version
   npm --version
   
   # Si no está instalado, visita:
   # https://nodejs.org/
   ```

2. **PostgreSQL 14 o superior**
   ```bash
   # macOS (con Homebrew)
   brew install postgresql@16
   brew services start postgresql@16
   
   # Linux (Ubuntu/Debian)
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Descargar desde: https://www.postgresql.org/download/windows/
   ```

## 🚀 Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone https://github.com/hectorslop1/redimeta-project.git
cd redimeta-project
```

### 2. Configurar Variables de Entorno

#### Para la App Móvil

Copiar el archivo de ejemplo:
```bash
cp .env.example .env
```

Editar `.env` y configurar:
```env
API_URL=http://localhost:3000/api
```

**Nota**: Si usas un dispositivo físico, reemplaza `localhost` con la IP de tu computadora:
```env
API_URL=http://192.168.1.100:3000/api
```

#### Para la App Web

Crear archivo de variables de entorno:
```bash
cd rendimeta-web
cp ../.env.example .env.local
```

Editar `rendimeta-web/.env.local`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/rendimeta"
NEXT_PUBLIC_API_URL="http://localhost:3000"
JWT_SECRET="tu-clave-secreta-super-segura-cambia-esto"
JWT_EXPIRES_IN="7d"
SESSION_SECRET="otra-clave-secreta-super-segura-cambia-esto"
```

**Importante**: Cambia las claves secretas por valores únicos y seguros.

### 3. Configurar Base de Datos (PostgreSQL)

#### Crear la base de datos:

```bash
# Conectarse a PostgreSQL
psql postgres

# Crear usuario (si no existe)
CREATE USER postgres WITH PASSWORD 'password';

# Crear base de datos
CREATE DATABASE rendimeta;

# Dar permisos
GRANT ALL PRIVILEGES ON DATABASE rendimeta TO postgres;

# Salir
\q
```

#### Ejecutar migraciones:

```bash
cd rendimeta-web
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

### 4. Instalar Dependencias

#### Opción A: Instalar todo automáticamente

```bash
# Desde la raíz del monorepo
./scripts/install-all.sh
```

#### Opción B: Instalar manualmente

**App Móvil:**
```bash
cd rendimeta-mobile
flutter pub get
cd ..
```

**App Web:**
```bash
cd rendimeta-web
npm install
npx prisma generate
cd ..
```

### 5. Verificar Instalación

#### Verificar Flutter:
```bash
cd rendimeta-mobile
flutter doctor
```

Resolver cualquier problema que aparezca.

#### Verificar Next.js:
```bash
cd rendimeta-web
npm run build
```

## 🏃 Ejecutar en Desarrollo

### Opción A: Ejecutar ambos proyectos

```bash
# Desde la raíz del monorepo
./scripts/dev-all.sh
```

### Opción B: Ejecutar individualmente

#### App Móvil:

1. **Iniciar emulador Android:**
   ```bash
   # Listar emuladores disponibles
   flutter emulators
   
   # Iniciar emulador
   flutter emulators --launch <emulator_id>
   ```

2. **O conectar dispositivo físico:**
   - Android: Habilitar "Depuración USB" en opciones de desarrollador
   - iOS: Confiar en la computadora desde el dispositivo

3. **Ejecutar app:**
   ```bash
   cd rendimeta-mobile
   flutter run
   
   # O con hot reload
   flutter run --hot
   ```

#### App Web:

```bash
cd rendimeta-web
npm run dev
```

Abrir navegador en: http://localhost:3000

## 🧪 Ejecutar Tests

### Todos los tests:
```bash
./scripts/test-all.sh
```

### Tests individuales:

**Móvil:**
```bash
cd rendimeta-mobile
flutter test
```

**Web:**
```bash
cd rendimeta-web
npm run lint
npm run e2e
```

## 🛠️ Herramientas Útiles

### Prisma Studio (Visualizar base de datos)

```bash
cd rendimeta-web
npx prisma studio
```

Abre en: http://localhost:5555

### Flutter DevTools

```bash
flutter pub global activate devtools
flutter pub global run devtools
```

### Limpiar builds

```bash
# Limpiar todo
./scripts/clean-all.sh

# O individualmente
cd rendimeta-mobile && flutter clean
cd rendimeta-web && rm -rf node_modules .next
```

## 📱 Configuración de Dispositivos

### Android

1. Habilitar opciones de desarrollador:
   - Ir a Ajustes > Acerca del teléfono
   - Tocar "Número de compilación" 7 veces

2. Habilitar depuración USB:
   - Ir a Ajustes > Opciones de desarrollador
   - Activar "Depuración USB"

3. Conectar dispositivo y verificar:
   ```bash
   flutter devices
   ```

### iOS (solo macOS)

1. Conectar iPhone/iPad
2. Confiar en la computadora desde el dispositivo
3. Verificar:
   ```bash
   flutter devices
   ```

## 🔧 Solución de Problemas Comunes

### Flutter no encuentra dispositivos

```bash
# Android
flutter doctor --android-licenses
adb devices

# iOS
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### Error de conexión a base de datos

```bash
# Verificar que PostgreSQL esté corriendo
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Verificar conexión
psql -U postgres -d rendimeta
```

### Error "Cannot find module" en Next.js

```bash
cd rendimeta-web
rm -rf node_modules package-lock.json
npm install
```

### Error de Prisma

```bash
cd rendimeta-web
npx prisma generate
npx prisma migrate reset
```

## 📚 Recursos Adicionales

- [Documentación de Flutter](https://docs.flutter.dev/)
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Guía de Contribución](./CONTRIBUTING.md)
- [Arquitectura del Proyecto](./ARCHITECTURE.md)

## 🆘 Obtener Ayuda

Si encuentras problemas:

1. Revisa la [documentación](./README.md)
2. Busca en [Issues existentes](https://github.com/hectorslop1/redimeta-project/issues)
3. Crea un [nuevo Issue](https://github.com/hectorslop1/redimeta-project/issues/new)

## ✅ Checklist de Configuración

- [ ] Flutter SDK instalado y funcionando
- [ ] Node.js y npm instalados
- [ ] PostgreSQL instalado y corriendo
- [ ] Variables de entorno configuradas
- [ ] Base de datos creada y migrada
- [ ] Dependencias instaladas (móvil y web)
- [ ] Tests pasando
- [ ] App móvil corriendo en emulador/dispositivo
- [ ] App web corriendo en localhost:3000

---

¡Listo! Ahora estás preparado para desarrollar en Rendimeta 🚀
