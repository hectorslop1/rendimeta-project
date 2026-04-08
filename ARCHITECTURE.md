# Arquitectura - Rendimeta Monorepo

Este documento describe la arquitectura técnica del proyecto Rendimeta, incluyendo decisiones de diseño, patrones utilizados y estructura de datos.

## 📋 Tabla de Contenidos

- [Visión General](#visión-general)
- [Arquitectura Móvil](#arquitectura-móvil)
- [Arquitectura Web](#arquitectura-web)
- [Comunicación entre Proyectos](#comunicación-entre-proyectos)
- [Base de Datos](#base-de-datos)
- [Seguridad](#seguridad)
- [Escalabilidad](#escalabilidad)

## 🎯 Visión General

Rendimeta es un sistema de gestión de productividad para despachadores, compuesto por:

1. **App Móvil (Flutter)**: Interfaz principal para despachadores en campo
2. **Dashboard Web (Next.js)**: Panel de administración y análisis de datos

### Stack Tecnológico

#### Móvil
- **Framework**: Flutter 3.11+
- **Lenguaje**: Dart
- **State Management**: Provider
- **Networking**: HTTP package
- **Storage**: SharedPreferences
- **UI**: Material Design + Custom Components

#### Web
- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **UI**: React 19 + Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **State Management**: TanStack Query (React Query)
- **Charts**: ECharts, Recharts
- **Maps**: Leaflet + React Leaflet

## 📱 Arquitectura Móvil

### Estructura de Carpetas

```
rendimeta-mobile/
├── lib/
│   ├── main.dart                 # Entry point
│   ├── models/                   # Modelos de datos
│   ├── providers/                # State management (Provider)
│   ├── screens/                  # Pantallas de la app
│   ├── widgets/                  # Widgets reutilizables
│   ├── services/                 # Servicios (API, storage)
│   ├── utils/                    # Utilidades y helpers
│   └── constants/                # Constantes y configuración
├── assets/                       # Recursos estáticos
└── test/                         # Tests unitarios
```

### Patrón de Arquitectura

**Provider Pattern** para state management:

```dart
// Provider
class UserProvider extends ChangeNotifier {
  User? _user;
  
  User? get user => _user;
  
  Future<void> loadUser() async {
    _user = await _userService.getUser();
    notifyListeners();
  }
}

// Uso en Widget
class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final user = context.watch<UserProvider>().user;
    return Text('Hola, ${user?.name}');
  }
}
```

### Flujo de Datos

```
UI (Screen/Widget)
    ↓
Provider (State Management)
    ↓
Service (Business Logic)
    ↓
API Client (HTTP)
    ↓
Backend API
```

### Características Principales

1. **Autenticación**: Login con credenciales
2. **Dashboard**: Métricas de productividad
3. **Tareas**: Gestión de tareas diarias
4. **Estadísticas**: Visualización de rendimiento
5. **Notificaciones**: Alertas y recordatorios
6. **Modo Offline**: Caché local con SharedPreferences

## 🌐 Arquitectura Web

### Estructura de Carpetas

```
rendimeta-web/
├── app/                          # App Router (Next.js 16)
│   ├── (auth)/                   # Grupo de rutas de autenticación
│   ├── (dashboard)/              # Grupo de rutas del dashboard
│   ├── api/                      # API Routes
│   ├── layout.tsx                # Layout raíz
│   └── page.tsx                  # Página principal
├── components/
│   ├── ui/                       # Componentes base (shadcn/ui)
│   ├── charts/                   # Componentes de gráficos
│   ├── forms/                    # Componentes de formularios
│   └── layout/                   # Componentes de layout
├── lib/
│   ├── prisma.ts                 # Cliente Prisma
│   ├── auth.ts                   # Lógica de autenticación
│   ├── utils.ts                  # Utilidades
│   └── validations.ts            # Validaciones
├── prisma/
│   ├── schema.prisma             # Schema de base de datos
│   ├── migrations/               # Migraciones
│   └── seed.ts                   # Datos de prueba
└── public/                       # Archivos estáticos
```

### Patrón de Arquitectura

**Server Components + Client Components** (Next.js 16):

```typescript
// Server Component (por defecto)
export default async function DashboardPage() {
  const data = await prisma.user.findMany();
  return <DashboardView data={data} />;
}

// Client Component
'use client';
export function InteractiveChart({ data }: Props) {
  const [filter, setFilter] = useState('all');
  return <Chart data={filterData(data, filter)} />;
}
```

### Flujo de Datos

```
UI (Component)
    ↓
Server Action / API Route
    ↓
Prisma ORM
    ↓
PostgreSQL Database
```

### Características Principales

1. **Dashboard**: Visualización de métricas en tiempo real
2. **Gestión de Usuarios**: CRUD de despachadores
3. **Reportes**: Generación de reportes en Excel
4. **Mapas**: Visualización geográfica de rutas
5. **Análisis**: Gráficos y estadísticas avanzadas
6. **Autenticación**: Sistema de login seguro

## 🔄 Comunicación entre Proyectos

### API REST

La app web expone una API REST que consume la app móvil:

```
POST   /api/auth/login           # Autenticación
GET    /api/users/:id            # Obtener usuario
GET    /api/tasks                # Listar tareas
POST   /api/tasks                # Crear tarea
PUT    /api/tasks/:id            # Actualizar tarea
DELETE /api/tasks/:id            # Eliminar tarea
GET    /api/stats                # Obtener estadísticas
```

### Formato de Respuesta

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}

// Error
{
  "success": false,
  "error": "Mensaje de error",
  "code": "ERROR_CODE"
}
```

### Autenticación

- **Método**: JWT (JSON Web Tokens)
- **Header**: `Authorization: Bearer <token>`
- **Expiración**: 7 días
- **Refresh**: Endpoint `/api/auth/refresh`

## 🗄️ Base de Datos

### Schema Principal (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(USER)
  tasks     Task[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      Status   @default(PENDING)
  priority    Priority @default(MEDIUM)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Role {
  ADMIN
  USER
}

enum Status {
  PENDING
  IN_PROGRESS
  COMPLETED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}
```

### Migraciones

```bash
# Crear migración
npx prisma migrate dev --name add_user_table

# Aplicar migraciones
npx prisma migrate deploy

# Resetear base de datos (solo dev)
npx prisma migrate reset
```

## 🔒 Seguridad

### Autenticación y Autorización

1. **Passwords**: Hash con bcrypt (10 rounds)
2. **JWT**: Firmado con secret key
3. **HTTPS**: Obligatorio en producción
4. **CORS**: Configurado para dominios permitidos

### Validación de Datos

```typescript
// Ejemplo con Zod
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});
```

### Variables de Entorno

- Nunca commitear archivos `.env`
- Usar `.env.example` como plantilla
- Rotar secrets regularmente

## 📈 Escalabilidad

### Estrategias

1. **Caching**: Redis para datos frecuentes
2. **CDN**: Archivos estáticos en CDN
3. **Database Indexing**: Índices en campos frecuentes
4. **Code Splitting**: Lazy loading de componentes
5. **Image Optimization**: Next.js Image component

### Monitoreo

- **Logs**: Structured logging
- **Metrics**: Performance metrics
- **Errors**: Error tracking (Sentry)
- **Analytics**: User analytics

### Deployment

#### Móvil
- **Android**: Google Play Store
- **iOS**: Apple App Store
- **CI/CD**: GitHub Actions

#### Web
- **Hosting**: Vercel / Railway
- **Database**: PostgreSQL (Supabase / Railway)
- **CI/CD**: GitHub Actions

## 🔮 Futuro

### Roadmap Técnico

1. **WebSockets**: Comunicación en tiempo real
2. **Push Notifications**: Notificaciones push
3. **Offline-First**: Sincronización offline
4. **GraphQL**: Migrar de REST a GraphQL
5. **Microservicios**: Separar backend en servicios

---

Última actualización: Abril 2026
