# ⚡ SUPABASE QUICKSTART - 5 MINUTOS

## 🎯 OBJETIVO

Conectar ambas apps (web + móvil) a Supabase para una demo funcional con datos reales y sincronización en tiempo real.

---

## 📝 PASOS RÁPIDOS

### 1️⃣ CREAR TABLAS (2 min)

1. Abre [Supabase SQL Editor](https://app.supabase.com/project/vvujsdloswwpdrpudkpx/sql)
2. Ejecuta `supabase-schema.sql` ▶️
3. Ejecuta `supabase-seed.sql` ▶️

### 2️⃣ CONFIGURAR AUTH (1 min)

1. Ve a **Authentication** → **Providers** → **Email**
2. Desactiva **"Confirm email"**
3. Guarda

### 3️⃣ PROBAR WEB (1 min)

```bash
cd rendimeta-web
npm run dev
```

Abre http://localhost:3000/demo

Login: `luis@sistema.com` / `admin123`

### 4️⃣ PROBAR MÓVIL (1 min)

```bash
cd rendimeta-mobile
flutter run
```

Navega a la pantalla Demo (agregar al menú)

---

## ✅ VERIFICACIÓN

- [ ] Puedes crear items en web
- [ ] Puedes crear items en móvil
- [ ] Los items aparecen en ambas apps
- [ ] Los cambios se sincronizan automáticamente
- [ ] Puedes completar/eliminar items desde cualquier app

---

## 🏗️ ARQUITECTURA

### Capa de Abstracción (Fácil de Migrar)

**Web:**
```typescript
import { getItems, createItem } from '@/lib/api';
```

**Móvil:**
```dart
import 'package:rendimeta/services/api_service.dart';
final items = await ItemsService.getItems();
```

### Cuando Migres al Backend Real

Solo cambias:
- Web: `src/lib/api/client.ts`
- Móvil: `lib/services/api/supabase_client.dart`

**Todo lo demás permanece igual.**

---

## 📚 DOCUMENTACIÓN COMPLETA

Ver `SUPABASE_SETUP.md` para:
- Detalles de arquitectura
- Ejemplos de código
- Guía de migración
- Troubleshooting

---

## 🚀 PRÓXIMOS PASOS

1. Integra la autenticación real (reemplaza mock)
2. Conecta las pantallas existentes a la API
3. Agrega manejo de errores
4. Implementa realtime donde sea necesario

---

## 🎨 PÁGINAS DEMO CREADAS

### Web
- `/demo` - CRUD completo con realtime

### Móvil
- `DemoScreen` - CRUD completo con realtime

Úsalas como referencia para integrar en el resto de la app.

---

## 💡 TIPS

- Los errores de TypeScript en la capa API son normales (tipos inferidos en runtime)
- Para producción, genera tipos con Supabase CLI
- La arquitectura está diseñada para migración sin dolor
- Todos los datos son temporales (demo)

---

**¿Listo para la demo? ¡Ejecuta los 4 pasos y tendrás todo funcionando!** 🎉
