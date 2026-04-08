# 🚀 Quick Start - Rendimeta Monorepo

Guía rápida para comenzar a trabajar con el monorepo.

---

## ⚡ Inicio Rápido (5 minutos)

### 1️⃣ Instalar Dependencias

```bash
./scripts/install-all.sh
```

### 2️⃣ Configurar Variables de Entorno

```bash
# Copiar ejemplo
cp .env.example .env

# Editar .env con tus valores
# API_URL=http://localhost:3000/api
```

### 3️⃣ Configurar Base de Datos (solo web)

```bash
cd rendimeta-web
cp ../.env.example .env.local

# Editar .env.local con tu DATABASE_URL
# DATABASE_URL="postgresql://postgres:password@localhost:5432/rendimeta"

# Ejecutar migraciones
npx prisma migrate dev
npx prisma db seed
```

### 4️⃣ Ejecutar Proyectos

```bash
# Ambos proyectos
./scripts/dev-all.sh

# O individualmente:
npm run dev:mobile    # Flutter
npm run dev:web       # Next.js (http://localhost:3000)
```

---

## 📦 Subir al Repositorio Final

### Checklist de Pre-Push

- [ ] Todos los archivos están commiteados
- [ ] Los tests pasan: `./scripts/test-all.sh`
- [ ] Las variables de entorno están configuradas
- [ ] `.env` está en `.gitignore` (no se subirá)

### Comandos

```bash
# 1. Verificar estado
git status

# 2. Agregar remote del repositorio final
git remote add origin https://github.com/hectorslop1/redimeta-project.git

# 3. Verificar remote
git remote -v

# 4. Commit inicial (si no está hecho)
git add .
git commit -m "feat: configuración inicial del monorepo Rendimeta"

# 5. Push a main
git branch -M main
git push -u origin main

# 6. Crear y push develop
git checkout -b develop
git push -u origin develop
```

---

## 🎯 Comandos Más Usados

### Desarrollo
```bash
./scripts/dev-all.sh              # Ejecutar todo
npm run dev:mobile                # Solo móvil
npm run dev:web                   # Solo web
```

### Testing
```bash
./scripts/test-all.sh             # Todos los tests
npm run test:mobile               # Tests Flutter
npm run test:web                  # Tests Next.js
npm run lint:mobile               # Lint Flutter
npm run lint:web                  # Lint Next.js
```

### Base de Datos
```bash
npm run prisma:studio             # Ver datos (http://localhost:5555)
npm run prisma:migrate            # Crear migración
npm run prisma:generate           # Generar cliente
npm run prisma:seed               # Poblar datos
```

### Limpieza
```bash
./scripts/clean-all.sh            # Limpiar todo
```

### Build
```bash
npm run build:mobile:android      # Build Android
npm run build:mobile:ios          # Build iOS
npm run build:web                 # Build Web
```

---

## 📚 Documentación

- **[README.md](./README.md)** - Documentación principal
- **[SETUP.md](./SETUP.md)** - Configuración detallada
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guía de contribución
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura técnica
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guía de deployment
- **[MONOREPO_SUMMARY.md](./MONOREPO_SUMMARY.md)** - Resumen completo

---

## 🆘 Problemas Comunes

### "Flutter no encuentra dispositivos"
```bash
flutter doctor
flutter devices
```

### "Error de conexión a base de datos"
```bash
# Verificar que PostgreSQL esté corriendo
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Verificar conexión
psql -U postgres -d rendimeta
```

### "Cannot find module"
```bash
cd rendimeta-web
rm -rf node_modules package-lock.json
npm install
```

### "Prisma error"
```bash
cd rendimeta-web
npx prisma generate
npx prisma migrate reset
```

---

## 📞 Ayuda

- **Issues**: https://github.com/hectorslop1/redimeta-project/issues
- **Móvil**: @hectorslop1
- **Web**: @CB-Luna

---

**¡Listo para desarrollar!** 🎉
