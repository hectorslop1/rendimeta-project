# Guía de Contribución - Rendimeta Monorepo

¡Gracias por contribuir al proyecto Rendimeta! Esta guía te ayudará a mantener la calidad y consistencia del código.

## 📋 Tabla de Contenidos

- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración del Entorno](#configuración-del-entorno)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Estándares de Código](#estándares-de-código)
- [Commits](#commits)
- [Pull Requests](#pull-requests)

## 📁 Estructura del Proyecto

```
rendimeta_project/
├── rendimeta-mobile/          # App móvil Flutter
│   ├── lib/                   # Código fuente Dart
│   ├── assets/                # Recursos (imágenes, etc.)
│   ├── test/                  # Tests unitarios
│   └── pubspec.yaml           # Dependencias Flutter
│
├── rendimeta-web/             # App web Next.js
│   ├── app/                   # App Router de Next.js
│   ├── components/            # Componentes React
│   ├── lib/                   # Utilidades y helpers
│   ├── prisma/                # Schema y migraciones
│   ├── public/                # Archivos estáticos
│   └── package.json           # Dependencias Node.js
│
├── scripts/                   # Scripts de gestión
│   ├── install-all.sh         # Instalar todo
│   ├── dev-all.sh             # Desarrollo
│   ├── clean-all.sh           # Limpiar builds
│   └── test-all.sh            # Ejecutar tests
│
├── .gitignore                 # Archivos ignorados
├── README.md                  # Documentación principal
└── CONTRIBUTING.md            # Esta guía
```

## 🛠️ Configuración del Entorno

### Requisitos Previos

#### Para desarrollo móvil:
- Flutter SDK ^3.11.0
- Dart SDK ^3.11.0
- Android Studio (para Android)
- Xcode (para iOS, solo macOS)
- Emulador o dispositivo físico

#### Para desarrollo web:
- Node.js >= 20.x
- npm o yarn
- PostgreSQL >= 14
- Editor de código (VSCode recomendado)

### Instalación Inicial

1. **Clonar el repositorio:**
```bash
git clone https://github.com/hectorslop1/redimeta-project.git
cd redimeta-project
```

2. **Instalar todas las dependencias:**
```bash
./scripts/install-all.sh
```

3. **Configurar variables de entorno:**

Para la app móvil (`.env` en raíz):
```env
# Configuración de la app móvil
API_URL=http://localhost:3000/api
```

Para la app web (`rendimeta-web/.env.local`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/rendimeta"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

4. **Configurar base de datos (solo web):**
```bash
cd rendimeta-web
npx prisma migrate dev
npx prisma db seed
```

## 🔄 Flujo de Trabajo

### 1. Crear un Branch

Siempre crea un branch desde `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nombre-de-la-funcionalidad
```

Convenciones de nombres de branches:
- `feature/` - Nueva funcionalidad
- `fix/` - Corrección de bugs
- `refactor/` - Refactorización de código
- `docs/` - Cambios en documentación
- `test/` - Añadir o modificar tests

### 2. Desarrollar

#### Para cambios en la app móvil:
```bash
cd rendimeta-mobile
flutter run
```

#### Para cambios en la app web:
```bash
cd rendimeta-web
npm run dev
```

#### Para ambos proyectos:
```bash
./scripts/dev-all.sh
```

### 3. Probar

Antes de hacer commit, asegúrate de que todo funciona:

```bash
# Tests de todo el monorepo
./scripts/test-all.sh

# O individualmente:
cd rendimeta-mobile && flutter test
cd rendimeta-web && npm run lint && npm run e2e
```

### 4. Commit

Sigue la convención de [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat(mobile): agregar pantalla de estadísticas"
```

Tipos de commit:
- `feat` - Nueva funcionalidad
- `fix` - Corrección de bug
- `docs` - Cambios en documentación
- `style` - Formato, punto y coma faltantes, etc.
- `refactor` - Refactorización de código
- `test` - Añadir tests
- `chore` - Mantenimiento

Scope (opcional):
- `mobile` - Cambios en rendimeta-mobile
- `web` - Cambios en rendimeta-web
- `scripts` - Cambios en scripts
- `deps` - Actualización de dependencias

### 5. Push y Pull Request

```bash
git push origin feature/nombre-de-la-funcionalidad
```

Luego crea un Pull Request en GitHub hacia `develop`.

## 📝 Estándares de Código

### Flutter (Mobile)

- Sigue las [Dart Style Guidelines](https://dart.dev/guides/language/effective-dart/style)
- Usa `flutter analyze` antes de hacer commit
- Formato automático: `flutter format .`
- Nombres de archivos en snake_case: `home_screen.dart`
- Nombres de clases en PascalCase: `HomeScreen`
- Nombres de variables en camelCase: `userName`

Ejemplo:
```dart
class HomeScreen extends StatelessWidget {
  final String userName;
  
  const HomeScreen({
    Key? key,
    required this.userName,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Home')),
      body: Center(child: Text('Hola, $userName')),
    );
  }
}
```

### Next.js (Web)

- Sigue las [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- Usa ESLint: `npm run lint`
- Nombres de archivos en kebab-case: `user-profile.tsx`
- Componentes en PascalCase: `UserProfile`
- Funciones y variables en camelCase: `getUserData`
- Usa TypeScript para todo

Ejemplo:
```typescript
interface UserProfileProps {
  userId: string;
  userName: string;
}

export default function UserProfile({ userId, userName }: UserProfileProps) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{userName}</h1>
      <p>ID: {userId}</p>
    </div>
  );
}
```

### Estilos (Web)

- Usa Tailwind CSS para estilos
- Componentes reutilizables en `components/ui/`
- Sigue el sistema de diseño establecido

## 💬 Commits

### Formato

```
<tipo>(<scope>): <descripción corta>

[cuerpo opcional]

[footer opcional]
```

### Ejemplos

```bash
# Funcionalidad nueva
feat(mobile): agregar pantalla de perfil de usuario

# Corrección de bug
fix(web): corregir error en cálculo de estadísticas

# Documentación
docs: actualizar guía de instalación

# Refactorización
refactor(mobile): simplificar lógica de autenticación

# Múltiples proyectos
feat(mobile,web): integrar sistema de notificaciones
```

## 🔍 Pull Requests

### Checklist antes de crear PR

- [ ] El código compila sin errores
- [ ] Todos los tests pasan
- [ ] El código sigue los estándares de estilo
- [ ] Se agregaron tests para nueva funcionalidad
- [ ] La documentación está actualizada
- [ ] No hay conflictos con `develop`

### Plantilla de PR

```markdown
## Descripción
Breve descripción de los cambios realizados.

## Tipo de cambio
- [ ] Nueva funcionalidad
- [ ] Corrección de bug
- [ ] Refactorización
- [ ] Documentación

## Proyecto afectado
- [ ] rendimeta-mobile
- [ ] rendimeta-web
- [ ] Ambos

## ¿Cómo probar?
Pasos para probar los cambios:
1. ...
2. ...

## Screenshots (si aplica)
[Agregar capturas de pantalla]

## Checklist
- [ ] Tests pasan
- [ ] Código formateado
- [ ] Documentación actualizada
```

## 🐛 Reportar Bugs

Usa el sistema de Issues de GitHub con la siguiente información:

- **Título descriptivo**
- **Proyecto afectado** (mobile/web)
- **Pasos para reproducir**
- **Comportamiento esperado**
- **Comportamiento actual**
- **Screenshots** (si aplica)
- **Entorno** (versión de Flutter/Node, OS, etc.)

## 💡 Sugerir Funcionalidades

Crea un Issue con:

- **Título claro**
- **Descripción detallada**
- **Justificación** (¿por qué es necesario?)
- **Propuesta de implementación** (opcional)
- **Mockups** (si aplica)

## 📞 Contacto

- **Móvil**: @hectorslop1
- **Web**: @CB-Luna

---

¡Gracias por contribuir a Rendimeta! 🚀
