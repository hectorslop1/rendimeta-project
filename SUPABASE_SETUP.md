# 🚀 GUÍA DE SETUP SUPABASE - RENDIMETA

Esta guía te ayudará a conectar ambas aplicaciones (web y móvil) a Supabase en minutos.

---

## 📋 PASO 1: CREAR TABLAS EN SUPABASE

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com/project/vvujsdloswwpdrpudkpx)
2. Ve a **SQL Editor** (menú lateral)
3. Crea un nuevo query
4. Copia y pega el contenido de `supabase-schema.sql`
5. Click en **Run** ▶️

**Resultado esperado:** Verás un mensaje de éxito y las tablas creadas.

---

## 📊 PASO 2: INSERTAR DATOS INICIALES (SEED)

1. En el mismo **SQL Editor**
2. Crea otro query nuevo
3. Copia y pega el contenido de `supabase-seed.sql`
4. Click en **Run** ▶️

**Resultado esperado:** La base de datos tendrá usuarios, items, badges, missions, etc.

---

## 🔐 PASO 3: CONFIGURAR AUTENTICACIÓN

### Deshabilitar confirmación de email (para demo)

1. Ve a **Authentication** → **Providers** → **Email**
2. Desactiva **"Confirm email"**
3. Guarda cambios

### Permitir signups (opcional)

1. En la misma sección
2. Asegúrate que **"Enable sign ups"** esté activado

---

## 🌐 PASO 4: VERIFICAR CONFIGURACIÓN

### Variables de entorno ya configuradas:

#### Web (`rendimeta-web/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://vvujsdloswwpdrpudkpx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Móvil (`rendimeta-mobile/lib/config/supabase_config.dart`):
```dart
class SupabaseConfig {
  static const String supabaseUrl = 'https://vvujsdloswwpdrpudkpx.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
}
```

✅ **Ya están configuradas, no necesitas hacer nada.**

---

## 🧪 PASO 5: PROBAR LA CONEXIÓN

### Web:

```bash
cd rendimeta-web
npm run dev
```

Abre http://localhost:3000/login

**Usuarios de prueba:**
- `luis@sistema.com` / `admin123`
- `admin@sistema.com` / `admin123`
- `supervisor@sistema.com` / `admin123`

### Móvil:

```bash
cd rendimeta-mobile
flutter run
```

Usa cualquiera de los usuarios de arriba.

---

## 📁 ARQUITECTURA DE LA CAPA API

### Web (`src/lib/api/`)

```
src/lib/api/
├── client.ts          # Cliente Supabase (REEMPLAZAR en migración)
├── types.ts           # Tipos de base de datos
├── auth.ts            # Funciones de autenticación (ESTABLE)
├── items.ts           # CRUD de items (ESTABLE)
├── users.ts           # Operaciones de usuarios (ESTABLE)
└── index.ts           # Exportaciones centralizadas
```

**Uso en componentes:**
```typescript
import { login, getItems, createItem } from '@/lib/api';

// Autenticación
const user = await login({ email, password });

// Items
const items = await getItems();
const newItem = await createItem({ title: 'Test', userId: user.id });
```

### Móvil (`lib/services/api/`)

```
lib/services/api/
├── supabase_client.dart    # Cliente Supabase (REEMPLAZAR en migración)
├── auth_service.dart       # Funciones de autenticación (ESTABLE)
├── items_service.dart      # CRUD de items (ESTABLE)
└── api_service.dart        # Exportaciones centralizadas
```

**Uso en widgets:**
```dart
import 'package:rendimeta/services/api_service.dart';

// Autenticación
final user = await AuthService.login(
  email: 'luis@sistema.com',
  password: 'admin123',
);

// Items
final items = await ItemsService.getItems();
final newItem = await ItemsService.createItem(
  title: 'Test',
  userId: user.id,
);
```

---

## 🔄 SINCRONIZACIÓN EN TIEMPO REAL

### Web:

```typescript
import { subscribeToItems } from '@/lib/api';

// En un componente
useEffect(() => {
  const unsubscribe = subscribeToItems((items) => {
    setItems(items);
  });
  
  return () => unsubscribe();
}, []);
```

### Móvil:

```dart
RealtimeChannel? _channel;

void _subscribeToItems() {
  _channel = ItemsService.subscribeToItems((items) {
    setState(() {
      _items = items;
    });
  });
}

@override
void dispose() {
  if (_channel != null) {
    ItemsService.unsubscribe(_channel!);
  }
  super.dispose();
}
```

---

## 🔧 MIGRACIÓN FUTURA AL BACKEND REAL

Cuando migres a tu backend real con PostgreSQL + Prisma:

### 1. Web - Solo cambia `client.ts`:

**Antes (Supabase):**
```typescript
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(url, key);
```

**Después (API REST):**
```typescript
export const apiClient = {
  get: (endpoint) => fetch(`/api${endpoint}`).then(r => r.json()),
  post: (endpoint, data) => fetch(`/api${endpoint}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(r => r.json()),
};
```

### 2. Móvil - Solo cambia `supabase_client.dart`:

**Antes (Supabase):**
```dart
import 'package:supabase_flutter/supabase_flutter.dart';
```

**Después (HTTP):**
```dart
import 'package:http/http.dart' as http;

class ApiClient {
  static const baseUrl = 'https://tu-api.com';
  
  static Future<dynamic> get(String endpoint) async {
    final response = await http.get(Uri.parse('$baseUrl$endpoint'));
    return jsonDecode(response.body);
  }
}
```

### 3. Las funciones públicas NO cambian:

✅ `login()`, `getItems()`, `createItem()` siguen iguales  
✅ Los componentes/widgets NO se tocan  
✅ Solo cambias la implementación interna  

---

## 📊 TABLAS DISPONIBLES

| Tabla | Descripción | Uso |
|-------|-------------|-----|
| `users` | Usuarios del sistema | Autenticación, perfiles |
| `items` | Items genéricos (CRUD demo) | Crear, leer, actualizar, eliminar |
| `badges` | Insignias disponibles | Sistema de gamificación |
| `user_badges` | Insignias desbloqueadas por usuario | Progreso del usuario |
| `daily_missions` | Misiones diarias | Objetivos del día |
| `user_missions` | Progreso de misiones | Tracking de completitud |
| `sales` | Ventas registradas | Historial de ventas |
| `training_videos` | Videos de capacitación | Contenido educativo |
| `user_training` | Videos completados | Progreso de capacitación |

---

## 🐛 TROUBLESHOOTING

### Error: "Missing Supabase environment variables"

**Web:**
- Verifica que `.env.local` existe en `rendimeta-web/`
- Reinicia el servidor de desarrollo

**Móvil:**
- Verifica que `lib/config/supabase_config.dart` existe
- Ejecuta `flutter clean && flutter pub get`

### Error: "Row Level Security policy violation"

Ve a Supabase Dashboard → Authentication → Policies y verifica que las políticas RLS estén creadas correctamente (se crean automáticamente con el schema SQL).

### Los datos no se sincronizan entre apps

1. Verifica que ambas apps usan el mismo proyecto de Supabase
2. Revisa la consola del navegador/terminal para errores
3. Asegúrate que las tablas tienen los mismos nombres

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Tablas creadas en Supabase (`supabase-schema.sql`)
- [ ] Datos iniciales insertados (`supabase-seed.sql`)
- [ ] Confirmación de email deshabilitada
- [ ] App web corriendo y conectada
- [ ] App móvil corriendo y conectada
- [ ] Login funcional en ambas apps
- [ ] Datos visibles en ambas apps
- [ ] CRUD funcional (crear/leer/actualizar/eliminar)
- [ ] Cambios se reflejan entre apps

---

## 🎯 PRÓXIMOS PASOS

1. **Integrar autenticación real** en los componentes existentes
2. **Reemplazar datos mock** con llamadas a la API
3. **Implementar realtime** donde sea necesario
4. **Agregar manejo de errores** robusto
5. **Preparar migración** al backend definitivo

---

## 📞 SOPORTE

Si encuentras problemas:

1. Revisa los logs de Supabase (Dashboard → Logs)
2. Verifica la consola del navegador/terminal
3. Asegúrate que las credenciales son correctas
4. Revisa que las tablas existen en Supabase

**Nota:** Esta es una configuración temporal para demo. No uses esto en producción sin implementar seguridad adicional (validación de inputs, rate limiting, etc.).
