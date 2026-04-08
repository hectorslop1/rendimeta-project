# Guía de Deployment - Rendimeta Monorepo

Esta guía explica cómo subir el monorepo al repositorio final y configurar el deployment para producción.

## 📋 Tabla de Contenidos

- [Subir al Repositorio Final](#subir-al-repositorio-final)
- [Deployment Móvil](#deployment-móvil)
- [Deployment Web](#deployment-web)
- [CI/CD](#cicd)
- [Monitoreo](#monitoreo)

## 🚀 Subir al Repositorio Final

### 1. Verificar Estado Actual

```bash
# Verificar que estás en la raíz del monorepo
pwd
# Debe mostrar: /Users/hectorlopez/Desktop/Proyectos/rendimeta_project

# Verificar estado de git
git status
```

### 2. Configurar Git (si es necesario)

```bash
# Configurar usuario
git config user.name "Tu Nombre"
git config user.email "tu@email.com"

# Verificar configuración
git config --list
```

### 3. Verificar Remotes Actuales

```bash
# Ver remotes configurados
git remote -v

# Si hay remotes antiguos, eliminarlos
git remote remove origin
```

### 4. Agregar Repositorio Final

```bash
# Agregar el nuevo remote
git remote add origin https://github.com/hectorslop1/rendimeta-project.git

# Verificar
git remote -v
```

### 5. Preparar Commit Inicial

```bash
# Ver archivos modificados
git status

# Agregar todos los archivos del monorepo
git add .

# Crear commit inicial
git commit -m "feat: configuración inicial del monorepo Rendimeta

- Integración de rendimeta-mobile (Flutter) y rendimeta-web (Next.js)
- Scripts de gestión del monorepo
- Configuración de CI/CD con GitHub Actions
- Documentación completa (README, CONTRIBUTING, ARCHITECTURE, SETUP)
- Templates para Issues y Pull Requests
- Configuración de VSCode y herramientas de desarrollo"
```

### 6. Subir al Repositorio

```bash
# Crear rama main (si no existe)
git branch -M main

# Subir al repositorio
git push -u origin main

# Si el repositorio ya tiene contenido y quieres forzar
# CUIDADO: Esto sobrescribirá el contenido remoto
# git push -u origin main --force
```

### 7. Crear Rama de Desarrollo

```bash
# Crear y cambiar a rama develop
git checkout -b develop

# Subir rama develop
git push -u origin develop

# Configurar develop como rama por defecto en GitHub
# Ir a: Settings > Branches > Default branch > develop
```

### 8. Proteger Ramas Principales

En GitHub, ir a **Settings > Branches > Branch protection rules**:

#### Para `main`:

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Include administrators

#### Para `develop`:

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging

## 📱 Deployment Móvil

### Android (Google Play Store)

#### 1. Preparar App para Release

```bash
cd rendimeta-mobile

# Actualizar versión en pubspec.yaml
# version: 1.0.0+1
```

#### 2. Generar Keystore

```bash
# Generar keystore para firma
keytool -genkey -v -keystore ~/rendimeta-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias rendimeta
```

#### 3. Configurar Firma

Crear `rendimeta-mobile/android/key.properties`:

```properties
storePassword=<password>
keyPassword=<password>
keyAlias=rendimeta
storeFile=<ruta-al-keystore>
```

#### 4. Build Release

```bash
flutter build appbundle --release
# O para APK
flutter build apk --release
```

#### 5. Subir a Google Play Console

1. Ir a https://play.google.com/console
2. Crear nueva aplicación
3. Subir el archivo `.aab` o `.apk`
4. Completar información de la app
5. Publicar

### iOS (App Store)

#### 1. Configurar en Xcode

```bash
cd rendimeta-mobile
open ios/Runner.xcworkspace
```

#### 2. Configurar Signing

- Seleccionar equipo de desarrollo
- Configurar Bundle Identifier
- Habilitar "Automatically manage signing"

#### 3. Build Release

```bash
flutter build ios --release
```

#### 4. Subir a App Store Connect

1. Abrir Xcode
2. Product > Archive
3. Distribuir a App Store
4. Completar información en App Store Connect
5. Enviar para revisión

## 🌐 Deployment Web

### Opción 1: Vercel (Recomendado)

#### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login

```bash
vercel login
```

#### 3. Deploy

```bash
cd rendimeta-web
vercel
```

#### 4. Configurar Variables de Entorno

En Vercel Dashboard:

- Settings > Environment Variables
- Agregar todas las variables de `.env.local`

#### 5. Configurar Base de Datos

Opciones:

- **Vercel Postgres**: Integración nativa
- **Supabase**: PostgreSQL gestionado
- **Railway**: PostgreSQL + hosting

#### 6. Deploy a Producción

```bash
vercel --prod
```

### Opción 2: Railway

#### 1. Crear cuenta en Railway

https://railway.app/

#### 2. Crear nuevo proyecto

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar
cd rendimeta-web
railway init
```

#### 3. Agregar PostgreSQL

```bash
railway add postgresql
```

#### 4. Deploy

```bash
railway up
```

### Opción 3: Netlify

#### 1. Crear cuenta en Netlify

https://www.netlify.com/

#### 2. Conectar repositorio

- New site from Git
- Seleccionar repositorio
- Configurar build:
  - Base directory: `rendimeta-web`
  - Build command: `npm run build`
  - Publish directory: `.next`

#### 3. Configurar variables de entorno

En Netlify Dashboard:

- Site settings > Environment variables

## 🔄 CI/CD

### GitHub Actions

Los workflows ya están configurados en `.github/workflows/`:

#### `ci.yml` - Continuous Integration

Se ejecuta en cada push y PR:

- Tests de Flutter
- Tests de Next.js
- Lint y análisis de código
- Security scan

#### `deploy-web.yml` - Deploy Web

Se ejecuta en push a `main`:

- Build de producción
- Deploy a Vercel
- Migraciones de base de datos

### Configurar Secrets

En GitHub: **Settings > Secrets and variables > Actions**

Agregar:

```
DATABASE_URL=postgresql://...
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...
```

## 📊 Monitoreo

### Logs y Errores

#### Sentry (Recomendado)

```bash
# Instalar en web
cd rendimeta-web
npm install @sentry/nextjs

# Configurar
npx @sentry/wizard@latest -i nextjs
```

#### Firebase Crashlytics (Móvil)

```bash
cd rendimeta-mobile
flutter pub add firebase_crashlytics
```

### Analytics

#### Google Analytics

Para web:

```bash
cd rendimeta-web
npm install @next/third-parties
```

Para móvil:

```bash
cd rendimeta-mobile
flutter pub add firebase_analytics
```

## 🔒 Seguridad

### Checklist de Seguridad

- [ ] Variables de entorno no están en el código
- [ ] Secrets de GitHub configurados
- [ ] HTTPS habilitado en producción
- [ ] CORS configurado correctamente
- [ ] Rate limiting implementado
- [ ] Validación de inputs
- [ ] Sanitización de datos
- [ ] Autenticación segura (JWT)
- [ ] Passwords hasheados (bcrypt)

### Rotación de Secrets

```bash
# Generar nuevos secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Actualizar en:
# - .env.local (desarrollo)
# - Vercel/Railway (producción)
# - GitHub Secrets (CI/CD)
```

## 📈 Escalabilidad

### Base de Datos

- **Connection Pooling**: Usar PgBouncer
- **Índices**: Optimizar queries frecuentes
- **Backups**: Configurar backups automáticos

### Caching

- **Redis**: Para sesiones y cache
- **CDN**: Para archivos estáticos

### Monitoring

- **Uptime**: UptimeRobot, Pingdom
- **Performance**: Vercel Analytics, Lighthouse
- **Logs**: Datadog, LogRocket

## 🔄 Workflow de Release

### 1. Desarrollo

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad
# Crear PR hacia develop
```

### 2. Testing

```bash
# En develop
./scripts/test-all.sh
```

### 3. Release

```bash
git checkout main
git merge develop
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags
```

### 4. Deploy Automático

GitHub Actions se encargará del deploy automáticamente.

## 📞 Soporte

Para problemas de deployment:

1. Revisar logs de CI/CD en GitHub Actions
2. Revisar logs de Vercel/Railway
3. Crear Issue en el repositorio

---

**Repositorio Final**: https://github.com/hectorslop1/rendimeta-project.git

¡Éxito con el deployment! 🚀
