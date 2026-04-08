# Plan: Modulo de Control de Productividad RH para Gasolineras

## Contexto

El dashboard actual (`dashboard/`) monitorea KPIs a nivel de **estacion** (operativos, financieros, productividad, inventario, clientes, cumplimiento, ambientales) pero **no tiene seguimiento a nivel de empleado** ni **sistema de autenticacion**. No existen tablas de usuarios, empleados, productos perifericos, asistencia, ni cuotas individuales. Todas las rutas son publicas sin proteccion.

Se requiere:
1. Un **sistema de autenticacion y control de acceso** con login, roles de usuario y proteccion de rutas
2. Un **modulo completo de control de productividad de recursos humanos** inspirado en un sistema de telecomunicaciones documentado en `dashboard/docs/infoproductividad/`, adaptado al contexto de gasolineras

El sistema debe ser **configurable** (no hardcoded para "Rendichicas") para poder usarse en cualquier cadena de gasolineras.

**Documentos de referencia analizados:**
- `productividad-RH.md` — Clasificacion por cumplimiento (Premium >120%, Productivo 90-119%, Transicion 80-89%, No Productivo <79%), seguimiento por hora, semaforos
- `score-meta.jpeg` — Planificacion operativa por ejecutivo con timeline horario y gamificacion
- `seguixhora-mes.jpeg` — Grid de seguimiento hora x coordinador con semaforo rojo/amarillo/verde
- `ejem-grafico.jpeg` — Dashboard individual con donuts por categoria y badges de clasificacion
- `PPTO PERIFERICOS 26.xlsx` — 9 categorias de productos perifericos (~113 SKUs) + esquema de comisiones por tier
- `Altas al 27 de Junio.xlsm` — Rankings de ejecutivos, cuotas prepago/pospago, KPIs por region

---

## Fase 0: Autenticacion y Control de Acceso

**Estado actual**: No existe ningun sistema de autenticacion. No hay modelo User, middleware, sesiones, ni proteccion de rutas. Todas las paginas y APIs son publicas.

### 0.1 Modelo de Datos de Autenticacion

Archivo: `prisma/schema.prisma`

**Decisión de diseño: Tabla `Role` unificada (Opción A)**. Se usa una sola tabla `Role` tanto para el acceso al sistema como para la clasificación operativa del empleado. No se usa enum hardcodeado. Los permisos de acceso se derivan del campo `level` del rol asignado. Esto permite crear/editar roles desde la UI sin necesidad de migraciones.

```
User — id, email(unique), passwordHash, firstName, lastName, roleId→Role, employeeId?→Employee, stationIds(JSON)?, isActive, lastLoginAt?, createdAt, updatedAt
Session — id, userId→User, token(unique), expiresAt, ipAddress?, userAgent?, createdAt
```

El `User` apunta a la **tabla `Role`** (definida en Fase 1.2) mediante `roleId`. El campo `level` del rol determina los permisos:

```
level 5 — Super Administrador: Acceso total, gestion de usuarios, configuracion del sistema
level 4 — Administrador: Gestion de catalogos, cuotas, comisiones, evaluaciones
level 3 — Gerente Regional: Ve todas las estaciones de su region, aprueba comisiones
level 2 — Gerente de Estacion: Ve solo su(s) estacion(es), gestiona empleados de su estacion
level 1 — Supervisor / Encargado de Turno: Ve datos de su estacion y turno, seguimiento horario
level 0 — Despachador / Cajero / Empleado: Ve solo su propio desempeno, logros, comisiones
```

**Relacion con Employee**: Un `User` puede estar vinculado opcionalmente a un `Employee` (para que gerentes y empleados vean datos relevantes a su persona/estacion). Los usuarios de level 4-5 no necesitan vinculo a empleado.

**Ventajas de este enfoque:**
- Un solo sistema de roles — sin duplicacion ni confusion
- Los roles se administran desde `/admin/roles` sin migraciones
- El `level` da un orden jerarquico claro para evaluar permisos (`user.role.level >= 3` en vez de verificar enum)
- Se pueden crear roles intermedios o especializados (ej: "Auditor" con level 3 pero sin gestion de empleados) si se necesita en el futuro

### 0.2 Pantalla de Login — `/login`

**Diseno:**
- Pagina fullscreen centrada (fuera del layout del dashboard)
- Logo de la empresa (leido de SystemConfig) + nombre del sistema
- Formulario: Email + Password + boton "Iniciar Sesion"
- Opcion "Recordar sesion" (extiende duracion del token)
- Mensajes de error inline (credenciales invalidas, usuario inactivo)
- Soporte dark mode
- Responsive (mobile-friendly)

### 0.3 API de Autenticacion

| Ruta | Metodo | Proposito |
|---|---|---|
| `/api/auth/login` | POST | Autenticar usuario (email + password) → devuelve token + datos usuario |
| `/api/auth/logout` | POST | Invalidar sesion actual |
| `/api/auth/me` | GET | Obtener usuario autenticado actual (validar token) |
| `/api/auth/change-password` | PUT | Cambiar contraseña (requiere password actual) |

**Implementacion:**
- Hasheo de passwords con **bcryptjs** (dependencia nueva a instalar)
- Tokens de sesion: UUID aleatorio almacenado en tabla `Session` con expiracion configurable (default 24h, con "recordar" 30 dias)
- Token enviado como **httpOnly cookie** (`session_token`) para seguridad contra XSS
- Alternativa: header `Authorization: Bearer <token>` para llamadas API programaticas

### 0.4 Middleware de Proteccion de Rutas

**Archivo nuevo**: `src/middleware.ts` (Next.js middleware)

**Logica:**
- Rutas publicas (no requieren auth): `/login`, `/api/auth/login`
- Todas las demas rutas requieren cookie `session_token` valida
- Si no hay token o token invalido/expirado → redirect a `/login`
- Las rutas API sin token valido → respuesta 401

### 0.5 Control de Acceso por Rol (Permisos)

**Matriz de permisos por nivel de rol:**

La logica de permisos se evalua con `user.role.level` (no con enum). El middleware y los componentes `PermissionGate` verifican el level.

| Seccion | Lvl 5 (Super Admin) | Lvl 4 (Admin) | Lvl 3 (Gte Regional) | Lvl 2 (Gte Estacion) | Lvl 1 (Supervisor) | Lvl 0 (Empleado) |
|---|---|---|---|---|---|---|
| Dashboard KPIs existentes | ✅ Todo | ✅ Todo | ✅ Su region | ✅ Su estacion | ✅ Su estacion | ❌ |
| `/rh` Dashboard general | ✅ | ✅ | ✅ Su region | ✅ Su estacion | ✅ Su estacion | ❌ |
| `/rh/empleados` Gestion | ✅ | ✅ | ✅ Lectura | ✅ Su estacion | ❌ | ❌ |
| `/rh/seguimiento-horario` | ✅ | ✅ | ✅ | ✅ Su estacion | ✅ Su turno | Solo propio |
| `/rh/planificador` | ✅ | ✅ | ✅ | ✅ | ✅ Su turno | Solo propio |
| `/rh/leaderboard` | ✅ | ✅ | ✅ Su region | ✅ Su estacion | ✅ Su estacion | ✅ Su estacion |
| `/rh/comisiones` | ✅ | ✅ Gestionar | ✅ Aprobar | ✅ Ver | ❌ | Solo propias |
| `/rh/gamificacion` | ✅ | ✅ | ✅ | ✅ | ✅ | Solo propio |
| `/rh/asistencia` | ✅ | ✅ | ✅ | ✅ Su estacion | ❌ | Solo propia |
| `/rh/evaluaciones` | ✅ | ✅ | ✅ | ✅ Su estacion | ❌ | Solo propia |
| `/admin/*` Administracion | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/admin/configuracion` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestion de usuarios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Ejemplo en codigo**: `if (user.role.level >= 4)` para verificar acceso admin, `if (user.role.level >= 2)` para gestion de estacion, etc.

### 0.6 Gestion de Usuarios — `/admin/usuarios`

**Acceso**: Solo SUPER_ADMIN

**Pantalla:**
- Header con boton "Nuevo Usuario"
- DataTable: Email, Nombre, Rol, Empleado Vinculado, Estacion(es), Activo, Ultimo Login, Acciones
- Modal crear/editar: Email, Nombre, Apellido, Rol(select), Empleado vinculado(select opcional), Estaciones asignadas(multi-select), Activo toggle
- Al crear: generar password temporal y mostrarla una vez (o enviar por email si hay SMTP configurado)
- Accion: "Reset Password" → genera nueva password temporal
- Accion: "Desactivar" → soft delete, invalida todas las sesiones activas

### 0.7 Perfil de Usuario y Cambio de Contraseña

**Accesible desde topbar** (icono de usuario / dropdown):
- Ver perfil: nombre, email, rol, estacion(es) asignada(s)
- Cambiar contraseña: password actual + nueva + confirmar nueva
- Cerrar sesion

### 0.8 Provider de Autenticacion

**Archivo nuevo**: `src/providers/auth-provider.tsx`

```
AuthProvider — Contexto global con:
  - user: UserRecord | null (incluye user.role con name y level)
  - isLoading: boolean
  - login(email, password): Promise
  - logout(): Promise
  - hasMinLevel(level: number): boolean  // ej: hasMinLevel(4) para admin+
  - canAccessStation(stationId): boolean
```

**Hook**: `useAuth()` — acceso al contexto desde cualquier componente

**Integracion con FilterProvider**: Los filtros de estacion/estado se limitan automaticamente segun los permisos del usuario autenticado. Un gerente de estacion solo ve su estacion en los selectores.

### 0.9 API de Gestion de Usuarios

| Ruta | Metodo | Proposito |
|---|---|---|
| `/api/auth/users` | GET | Listar usuarios (solo SUPER_ADMIN) |
| `/api/auth/users` | POST | Crear usuario (solo SUPER_ADMIN) |
| `/api/auth/users/[id]` | GET | Detalle de usuario |
| `/api/auth/users/[id]` | PUT | Editar usuario (solo SUPER_ADMIN) |
| `/api/auth/users/[id]` | DELETE | Desactivar usuario (solo SUPER_ADMIN) |
| `/api/auth/users/[id]/reset-password` | POST | Reset password (solo SUPER_ADMIN) |

### 0.10 Dependencias Nuevas

```
bcryptjs — hasheo de passwords
@types/bcryptjs — tipos TypeScript
```

No se usa libreria de auth externa (NextAuth/Auth.js) para mantener control total y simplicidad. La implementacion es custom con cookies httpOnly + sesiones en DB.

### 0.11 Seed de Usuarios

Crear roles y usuarios iniciales en `prisma/seed.ts`. Los roles se crean primero (ver tabla en 1.2), luego los usuarios apuntando a ellos:

1. **Super Admin**: admin@sistema.com / admin123 (rol: "Super Administrador", level 5)
2. **Administrador**: administrador@sistema.com / admin123 (rol: "Administrador", level 4)
3. **Gerente Regional**: gerente.regional@sistema.com / admin123 (rol: "Gerente Regional", level 3, vinculado a region Sonora)
4. **Gerente Estacion**: gerente.estacion@sistema.com / admin123 (rol: "Gerente de Estacion", level 2, vinculado a una estacion)
5. **Supervisor**: supervisor@sistema.com / admin123 (rol: "Encargado de Turno", level 1)
6. **Empleado**: empleado@sistema.com / admin123 (rol: "Despachador", level 0, vinculado a un Employee)

Todas las passwords temporales para desarrollo. En produccion se cambian al primer uso.

---

## Fase 1: Modelo de Datos — Productividad RH (Prisma Schema)

Archivo: `prisma/schema.prisma`

### 1.1 Configuracion del Sistema
```
SystemConfig — id, companyName, companyShortName, brandColor, logoUrl, timezone, currency, operatingHoursStart(6), operatingHoursEnd(22)
```
Una sola fila. Permite parametrizar nombre de empresa, colores, horario operativo.

### 1.2 Roles (tabla unificada — acceso al sistema + puesto operativo)
```
Role — id, name(unique), description, level(Int), isActive, createdAt, updatedAt
```

**Tabla unica para ambos propositos**: el campo `level` determina tanto la jerarquia operativa como los permisos de acceso al sistema. No hay enum hardcodeado — los roles se crean/editan desde `/admin/roles`.

Roles iniciales (seed):

| name | level | Descripcion |
|---|---|---|
| Super Administrador | 5 | Acceso total al sistema |
| Administrador | 4 | Gestion de catalogos, cuotas, comisiones |
| Gerente Regional | 3 | Supervision de multiples estaciones |
| Gerente de Estacion | 2 | Gestion de una estacion |
| Encargado de Turno | 1 | Supervision de turno |
| Despachador | 0 | Empleado operativo de bombas |
| Cajero | 0 | Empleado operativo de caja |

Se pueden agregar mas roles desde la UI (ej: "Auditor" level 3, "Capacitador" level 1) sin migraciones.

**Relaciones**: `employees Employee[]`, `users User[]`.

### 1.3 Turnos
```
Shift — id, name(unique), startHour, endHour, isActive
```
Turnos: Matutino (6-14), Vespertino (14-22), Nocturno (22-6).

### 1.4 Empleados
```
Employee — id, employeeNumber(unique), firstName, lastName, email?, phone?, roleId→Role, shiftId→Shift, stationId→Station, hireDate, terminationDate?, status(ACTIVE|INACTIVE|ON_LEAVE|TERMINATED), avatarUrl?
```
El `roleId` apunta a la misma tabla `Role` unificada. Un empleado con rol "Despachador" (level 0) y un empleado con rol "Gerente de Estacion" (level 2) usan la misma tabla.

Relaciones inversas: salesRecords, attendances, quotaAssignments, commissionPayments, evaluations, achievements, gamificationScores, user?.

**Modificar Station existente** — agregar relaciones: `employees Employee[]`, `saleRecords SaleRecord[]`, `attendances Attendance[]`, `quotaTemplates QuotaTemplate[]`.

### 1.5 Categorias de Productos
```
ProductCategory — id, name(unique), code(unique), sortOrder, isActive
```
9 categorias del PPTO: ACCESORIOS, ACEITES, ADITIVO MP, ADITIVOS, AROMATIZANTE, BURRITOS, FLUIDOS, IMPULSO, OTROS.

### 1.6 Productos
```
Product — id, sku(unique), name, categoryId→ProductCategory, unitPrice, costPrice, unit("pieza"|"litro"|"paquete"), isActive
```

### 1.7 Plantillas de Cuotas y Asignaciones
```
QuotaTemplate — id, name, categoryId→ProductCategory, stationId?→Station, roleId?, monthlyTarget, isRevenue(bool), isActive
QuotaAssignment — id, employeeId→Employee, templateId?→QuotaTemplate, month(Date), dailyTarget, monthlyTarget, categoryName, @@unique([employeeId,month,categoryName])
```

### 1.8 Registros de Ventas (granularidad por hora)
```
SaleRecord — id, employeeId→Employee, productId→Product, stationId→Station, date(Date), hour(0-23), quantity, unitPrice, totalAmount, @@index([employeeId,date]), @@index([stationId,date]), @@index([date,hour])
```

### 1.9 Resumen Horario de Ventas (tabla de agregacion)
```
HourlySalesSummary — id, employeeId, stationId, date(Date), hour, totalUnits, totalRevenue, categoryBreakdown(JSON), quotaTarget, fulfillmentPct, @@unique([employeeId,date,hour])
```

### 1.10 Asistencia
```
Attendance — id, employeeId→Employee, stationId→Station, shiftId→Shift, date(Date), clockIn?, clockOut?, hoursWorked?, status(PRESENT|ABSENT|LATE|EARLY_LEAVE|DAY_OFF|VACATION|SICK_LEAVE), notes?, @@unique([employeeId,date])
```

### 1.11 Reglas y Pagos de Comisiones
```
CommissionRule — id, name, categoryId→ProductCategory, tierMinPct, tierMaxPct?, commissionPct, commissionFixed?, isActive
CommissionPayment — id, employeeId→Employee, month(Date), categoryName, salesAmount, quotaAmount, fulfillmentPct, commissionRate, commissionAmount, status(CALCULATED|APPROVED|PAID), @@unique([employeeId,month,categoryName])
```

### 1.12 Evaluaciones de Desempeno
```
PerformanceEvaluation — id, employeeId→Employee, evaluationMonth(Date), overallFulfillmentPct, classification(PREMIUM|PRODUCTIVE|TRANSITION|NON_PRODUCTIVE), fuelSalesAmount, peripheralSalesAmount, attendanceScore, notes?, evaluatedBy?, @@unique([employeeId,evaluationMonth])
```

### 1.13 Gamificacion
```
AchievementDefinition — id, code(unique), name, description, iconEmoji, category("sales"|"attendance"|"streak"|"milestone"), pointValue, condition(JSON), isActive
EmployeeAchievement — id, employeeId→Employee, achievementId→AchievementDefinition, earnedAt, metadata?(JSON), @@unique([employeeId,achievementId])
GamificationScore — id, employeeId→Employee, month(Date), totalPoints, salesPoints, attendancePoints, streakPoints, bonusPoints, currentStreak, bestStreak, rank?, @@unique([employeeId,month])
```

**Total: 16 modelos nuevos (14 HR + User + Session) + 2 enums (EmployeeStatus, AttendanceStatus, CommissionStatus, PerformanceClass) + modificacion al modelo Station existente. Sin enum de roles — se usa tabla `Role` unificada con campo `level`.**

---

## Fase 2: API Routes

### Endpoints de Autenticacion — `/api/auth/`

| Ruta | Metodo | Proposito | Acceso |
|---|---|---|---|
| `/api/auth/login` | POST | Login (email+password) → cookie + user data | Publico |
| `/api/auth/logout` | POST | Cerrar sesion, invalidar token | Autenticado |
| `/api/auth/me` | GET | Obtener usuario actual | Autenticado |
| `/api/auth/change-password` | PUT | Cambiar password propia | Autenticado |
| `/api/auth/users` | GET, POST | Listar/crear usuarios | SUPER_ADMIN |
| `/api/auth/users/[id]` | GET, PUT, DELETE | Detalle/editar/desactivar usuario | SUPER_ADMIN |
| `/api/auth/users/[id]/reset-password` | POST | Reset password | SUPER_ADMIN |

### CRUD Endpoints HR — `/api/hr/`

Patron nuevo: CRUD builder (`src/lib/crud-route-builder.ts`) que soporte GET(list+detail), POST, PUT, DELETE con paginacion, busqueda y ordenamiento. **Todos los endpoints HR requieren autenticacion.** Las operaciones de escritura (POST, PUT, DELETE) requieren rol ADMIN o superior.

| Recurso | Ruta | Metodos |
|---|---|---|
| Config | `/api/hr/config` | GET, PUT |
| Roles | `/api/hr/roles`, `/api/hr/roles/[id]` | GET, POST, PUT, DELETE |
| Turnos | `/api/hr/shifts`, `/api/hr/shifts/[id]` | GET, POST, PUT, DELETE |
| Empleados | `/api/hr/employees`, `/api/hr/employees/[id]` | GET, POST, PUT, DELETE |
| Categorias | `/api/hr/categories`, `/api/hr/categories/[id]` | GET, POST, PUT, DELETE |
| Productos | `/api/hr/products`, `/api/hr/products/[id]` | GET, POST, PUT, DELETE |
| Plantillas Cuota | `/api/hr/quotas/templates`, `.../[id]` | GET, POST, PUT, DELETE |
| Asignacion Cuota | `/api/hr/quotas/assignments` | GET, POST |
| Generar Cuotas | `/api/hr/quotas/assignments/generate` | POST |
| Reglas Comision | `/api/hr/commissions/rules`, `.../[id]` | GET, POST, PUT, DELETE |
| Calcular Comisiones | `/api/hr/commissions/calculate` | POST |
| Pagos Comision | `/api/hr/commissions/payments`, `.../[id]/approve` | GET, PUT |
| Ventas | `/api/hr/sales`, `/api/hr/sales/bulk` | GET, POST |
| Asistencia | `/api/hr/attendance`, `.../[id]`, `.../summary` | GET, POST, PUT |
| Evaluaciones | `/api/hr/evaluations`, `.../[id]` | GET, POST, PUT |
| Logros | `/api/hr/gamification/achievements`, `.../[id]` | GET, POST, PUT |
| Verificar Logros | `/api/hr/gamification/check` | POST |
| Scores | `/api/hr/gamification/scores` | GET |

### Dashboard Endpoints (solo lectura, datos agregados)

| Endpoint | Proposito |
|---|---|
| `/api/hr/dashboard/overview` | KPIs resumen: total empleados, % cumplimiento promedio, distribucion por clasificacion |
| `/api/hr/dashboard/hourly-tracking` | Grid de semaforo hora x empleado para una estacion/fecha |
| `/api/hr/dashboard/daily-planner` | Planificador diario de cuota para un empleado/fecha |
| `/api/hr/dashboard/leaderboard` | Rankings globales, por estado, ciudad, estacion |
| `/api/hr/dashboard/performance-trend` | Tendencias de desempeno mensual |
| `/api/hr/dashboard/category-analysis` | Ventas por categoria (treemap/pie) |
| `/api/hr/dashboard/station-comparison` | Comparativo de estaciones por metricas RH |
| `/api/hr/dashboard/shift-analysis` | Analisis de desempeno por turno |
| `/api/hr/export` | Exportacion a Excel (reusar patron existente de ExcelJS) |

---

## Fase 3: Tipos y Hooks

### Archivo `src/types/auth.ts`
Interfaces: `UserRecord` (con `role: RoleRecord` incluido), `SessionRecord`, `LoginRequest`, `LoginResponse`, `ChangePasswordRequest`. No hay enum `UserRole` — los permisos se derivan de `user.role.level`.

### Archivo `src/types/hr.ts`
Interfaces principales: `EmployeeRecord`, `RoleRecord`, `ShiftRecord`, `ProductCategoryRecord`, `ProductRecord`, `QuotaTemplateRecord`, `QuotaAssignmentRecord`, `CommissionRuleRecord`, `CommissionPaymentRecord`, `SaleRecordData`, `AttendanceRecord`, `PerformanceEvaluationRecord`, `AchievementDefinitionRecord`, `EmployeeAchievementRecord`, `GamificationScoreRecord`, `HourlySalesCell`, `HourlyTrackingRow`, `LeaderboardEntry`, `HrOverviewKpis`, `DailyPlannerSlot`, `SystemConfigRecord`, `PerformanceClassification`.

### Archivo `src/hooks/use-auth.ts`
`useAuth()` — acceso al AuthProvider (user, login, logout, hasPermission, canAccessStation).

### Archivo `src/hooks/use-hr-data.ts` (queries)
`useHrOverview()`, `useEmployees(filters)`, `useEmployee(id)`, `useHourlyTracking(stationId, date)`, `useDailyPlanner(employeeId, date)`, `useLeaderboard(scope, month)`, `usePerformanceTrend(employeeId)`, `useCategoryAnalysis(filters)`, `useStationComparison(filters)`, `useShiftAnalysis(stationId)`, `useGamificationScores(employeeId)`, `useCommissionPayments(employeeId, month)`, `useAttendanceSummary(stationId)`.

### Archivo `src/hooks/use-hr-crud.ts` (mutations)
`useCreateEmployee()`, `useUpdateEmployee()`, `useDeleteEmployee()`, `useCreateProduct()`, `useUpdateProduct()`, etc. Cada mutation usa `useMutation` con invalidacion de queries relacionados en `onSuccess`.

---

## Fase 4: Componentes

### Componentes de Autenticacion — `src/components/auth/`
| Componente | Descripcion |
|---|---|
| `LoginForm` | Formulario de login (email + password + recordar + submit) |
| `UserMenu` | Dropdown en topbar: nombre, rol, cambiar password, cerrar sesion |
| `ProtectedRoute` | Wrapper que verifica permisos de rol antes de renderizar children |
| `PermissionGate` | Componente que muestra/oculta contenido segun permisos del usuario |

### Componentes de dominio HR — `src/components/domain/hr/`
| Componente | Descripcion |
|---|---|
| `TrafficLightCell` | Celda coloreada (verde >=90%, amarillo 80-89%, rojo <80%) con monto y tooltip |
| `HourlyTrackingGrid` | Tabla completa: filas=empleados, columnas=horas, celdas=semaforo |
| `EmployeePerformanceCard` | Card con donuts por categoria + badge clasificacion |
| `QuotaProgressBar` | Barra segmentada por tiers con marcador de posicion actual |
| `ClassificationBadge` | Badge coloreado: Premium(dorado), Productivo(verde), Transicion(amarillo), No Productivo(rojo) |
| `LeaderboardTable` | Tabla de rankings con medallas top 3 |
| `AchievementBadge` | Badge individual con icono, nombre, fecha |
| `AchievementGallery` | Grid de todos los logros (ganados resaltados, pendientes grises) |
| `DailyPlannerTimeline` | Timeline horizontal del turno con bloques por hora |
| `CommissionCalculatorCard` | Desglose de comision por categoria con totales |
| `EmployeeScoreRing` | Ring chart de puntos de gamificacion |
| `StreakIndicator` | Racha actual con icono de fuego |
| `ShiftPerformanceCard` | Comparativo de turnos |

### Componentes CRUD reutilizables — `src/components/crud/`
| Componente | Descripcion |
|---|---|
| `DataTable` | Tabla sorteable/paginada con acciones por fila |
| `FormModal` | Modal para crear/editar con campos de formulario |
| `ConfirmDialog` | Dialogo de confirmacion para eliminaciones |
| `SearchInput` | Busqueda con debounce |
| `StatusBadge` | Badge Activo/Inactivo |
| `Pagination` | Navegacion de paginas |

---

## Fase 5: Pantallas

### 5.0 Pantalla de Login — `/login`
- **Layout propio** (fullscreen, sin sidebar ni topbar del dashboard)
- Logo de empresa (desde SystemConfig) centrado
- Formulario: Email, Password, checkbox "Recordar sesion", boton "Iniciar Sesion"
- Mensajes de error inline
- Redirect a `/` despues de login exitoso
- Si ya esta autenticado, redirect automatico a `/`

### 5.1 Gestion de Usuarios — `/admin/usuarios` (Solo SUPER_ADMIN)
- Header con boton "Nuevo Usuario"
- DataTable: Email, Nombre, Rol, Empleado Vinculado, Estacion(es), Activo, Ultimo Login, Acciones
- Modal crear: Email, Nombre, Apellido, Rol(select), Empleado(select opcional), Estaciones(multi-select), Password temporal generada
- Modal editar: mismos campos sin password
- Acciones: Editar, Reset Password, Desactivar/Activar

### Navegacion (actualizar `NAV_ITEMS` en `src/lib/constants.ts`)
```
--- Items existentes (KPIs, estados, estaciones, tendencias) ---
--- Separador "Productividad RH" ---
/rh                     → RH General (UserCheck)
/rh/empleados           → Empleados (Users)
/rh/seguimiento-horario → Seguimiento Horario (Clock)
/rh/planificador        → Planificador Diario (CalendarClock)
/rh/leaderboard         → Ranking (Trophy)
/rh/comisiones          → Comisiones (Coins)
/rh/gamificacion        → Gamificacion (Gamepad2)
--- Separador "Administracion" ---
/admin/usuarios         → Usuarios (UserCog)
/admin/catalogo         → Catalogo (Package)
/admin/cuotas           → Cuotas (Target)
/admin/configuracion    → Configuracion (Settings)
```

Los items del sidebar se muestran/ocultan segun el rol del usuario autenticado.

### 5.2 Dashboard RH General — `/rh`
- **4 cards resumen**: Total empleados activos, % cumplimiento promedio (con trend), empleados Premium+Productivo, empleados No Productivos
- **Pie chart**: Distribucion por clasificacion (colores semaforo)
- **Line chart**: Tendencia % cumplimiento promedio ultimos 6 meses
- **Top 5 / Bottom 5**: Ranking de empleados por cumplimiento
- **Bar chart**: Cumplimiento promedio por estacion

### 5.3 Gestion de Empleados — `/rh/empleados`
- Header con boton "Nuevo Empleado"
- Busqueda + filtros (estacion, rol, status, turno)
- DataTable: # Empleado, Nombre, Rol, Estacion, Turno, Status, Fecha Ingreso, Acciones
- Modal crear/editar con campos del modelo
- Opcion: "Crear cuenta de usuario" al crear/editar empleado (vincula User↔Employee)

### 5.4 Detalle Individual Empleado — `/rh/empleados/[id]`
- Header: foto, nombre, rol, estacion, turno, fecha ingreso, badge clasificacion
- 4 cards: % Cumplimiento, Ventas MXN, Racha actual, Puntos gamificacion
- Grid de donuts por categoria (fulfillment % cada una)
- Line chart: tendencia mensual
- Mini grid semaforo del dia actual
- Logros recientes
- Resumen de comisiones del mes

### 5.5 Seguimiento Horario (PANTALLA PRINCIPAL) — `/rh/seguimiento-horario`
- Selector de fecha + estacion
- **Grid semaforo**: Filas=empleados, Columnas=horas (6:00-21:00 = 16 cols)
- Cada celda: `TrafficLightCell` con monto e indicador de color
- Columnas derecha: total dia, acumulado mes, % cumplimiento mes
- Fila footer: totales por hora de la estacion
- Leyenda: Verde(>=90%), Amarillo(80-89%), Rojo(<80%)

### 5.6 Planificador Diario — `/rh/planificador`
- Selector de empleado + fecha
- Timeline horizontal del turno con bloques horarios
- Tabla: Hora | Meta Unidades | Meta MXN | Real | % Cumplimiento | Status
- Desglose por categoria: que debe vender cada hora
- Acumulado progresivo mostrando si va en camino

### 5.7 Ranking / Leaderboard — `/rh/leaderboard`
- Selector de alcance: Global / Por Estado / Por Ciudad / Por Estacion
- Selector de periodo: Mes actual / Mes anterior / Custom
- Podio top 3 con medallas
- Tabla completa: Posicion, Empleado, Estacion, Badge clasificacion, % Cumplimiento, Ventas MXN, Puntos, Tendencia

### 5.8 Comisiones — `/rh/comisiones`
- Selector de mes + filtro estacion
- 4 cards: Total comisiones, Promedio, Mayor ganador, Presupuesto vs real
- Tabla expandible por empleado: Categoria | Ventas | Cuota | % | Tier | Tasa | Comision MXN | Status
- Acciones: Calcular (mes nuevo), Aprobar, Marcar pagado

### 5.9 Gamificacion — `/rh/gamificacion`
- Score ring del empleado seleccionado (puntos por categoria)
- Top 10 por puntos totales del mes
- Galeria de logros (ganados vs pendientes)
- Racha actual + mejor racha
- Tendencia mensual de puntos (bar chart)

### 5.10 Asistencia — `/rh/asistencia`
- Filtros: rango fechas + estacion
- 4 cards: % Asistencia, Horas promedio, Faltas, Retardos
- Heatmap calendario de asistencia (ECharts calendar)
- Tabla: Fecha | Empleado | Turno | Entrada | Salida | Horas | Status

### 5.11 Evaluaciones — `/rh/evaluaciones`
- Selector de mes + filtros
- Pie chart distribucion de clasificaciones
- Comparativo vs mes anterior (bar charts lado a lado)
- Tabla: Empleado | Estacion | % Cumplimiento | Clasificacion | Ventas Combustible | Ventas Perifericos | Score Asistencia
- Boton generar evaluaciones automaticas

### 5.12 Analisis por Categorias — `/rh/analisis-categorias`
- Filtros: estacion, empleado, rango fechas
- Treemap por ingresos por categoria
- Bar chart apilado: categorias por estacion
- Tabla top productos: Producto | Categoria | Unidades | Ingresos | Promedio/empleado
- Line chart tendencia por categoria

### 5.13 Comparativo Estaciones — `/rh/comparativo-estaciones`
- Filtros: estado, ciudad, rango fechas
- Tabla ranking: Estacion | Empleados | % Cumplimiento Prom | % Premium | % No Productivo | Ventas Totales
- Bar chart cumplimiento por estacion (coloreado por clasificacion)

### 5.14 Analisis por Turnos — `/rh/analisis-turnos`
- Selector estacion + rango fechas
- Cards comparativos por turno: cumplimiento, empleados, ventas
- Heatmap: intensidad de ventas hora x turno
- Line chart tendencia comparativa por turno

### Pantallas Administrativas (CRUD)

| Ruta | Contenido | Acceso Minimo |
|---|---|---|
| `/admin/usuarios` | CRUD usuarios del sistema | SUPER_ADMIN |
| `/admin/catalogo` | Landing con links a categorias y productos | ADMIN |
| `/admin/catalogo/categorias` | CRUD: Nombre, Codigo, Orden, Activo | ADMIN |
| `/admin/catalogo/productos` | CRUD: SKU, Nombre, Categoria(select), Precio, Costo, Unidad, Activo | ADMIN |
| `/admin/cuotas` | CRUD plantillas: Nombre, Categoria, Estacion?, Rol?, Meta mensual, Es ingreso? | ADMIN |
| `/admin/cuotas/asignaciones` | Selector mes + estacion, boton "Generar desde plantillas", tabla editable | ADMIN |
| `/admin/comisiones` | CRUD reglas: Categoria, Tier Min%, Tier Max%, Tasa%, Monto Fijo | ADMIN |
| `/admin/roles` | CRUD: Nombre, Descripcion, Nivel | ADMIN |
| `/admin/turnos` | CRUD: Nombre, Hora Inicio, Hora Fin | ADMIN |
| `/admin/logros` | CRUD: Codigo, Nombre, Descripcion, Icono, Categoria, Puntos, Condicion | ADMIN |
| `/admin/configuracion` | Formulario config del sistema | SUPER_ADMIN |

---

## Fase 6: Seed Data

Extender `prisma/seed.ts`:
1. SystemConfig — 1 fila con valores default ("Mi Gasolinera")
2. **Usuarios del sistema** — 6 usuarios con diferentes roles (ver seccion 0.11)
3. Roles de empleado — 6 roles de gasolinera
4. Turnos — 3 turnos
5. 9 Categorias + ~113 productos del PPTO PERIFERICOS
6. 3-8 empleados por estacion (~350-500 total)
7. Vincular algunos empleados a los usuarios creados
8. Plantillas y asignaciones de cuota (ultimos 6 meses)
9. Registros de venta horarios (ultimos 90 dias, batch insert)
10. Resumenes horarios pre-agregados
11. Asistencia (ultimos 90 dias, ~95% presente)
12. Reglas de comision (3 tiers x 9 categorias = 27 reglas)
13. Pagos de comision calculados (ultimos 3 meses)
14. Evaluaciones de desempeno (ultimos 6 meses, dist: 15% Premium, 45% Productivo, 25% Transicion, 15% No Productivo)
15. ~20 definiciones de logros + logros ganados segun data
16. Scores de gamificacion mensuales

---

## Fase 7: Orden de Implementacion

### Sprint 0 — Autenticacion y Control de Acceso
- Instalar bcryptjs
- Modelos Prisma: Role (tabla unificada), User, Session — sin enum de roles
- Migracion de base de datos
- Tipos: `src/types/auth.ts`
- API endpoints: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/change-password`
- Middleware Next.js (`src/middleware.ts`) para proteccion de rutas
- AuthProvider (`src/providers/auth-provider.tsx`) + hook `useAuth()`
- **Pagina de Login** (`/login`)
- Componentes: LoginForm, UserMenu, ProtectedRoute, PermissionGate
- Integracion en Topbar (UserMenu con dropdown)
- Integracion en Sidebar (filtrar items segun rol)
- Integracion en FilterProvider (limitar filtros segun permisos de estacion)
- API de gestion de usuarios: `/api/auth/users` (CRUD)
- **Pagina gestion usuarios** (`/admin/usuarios`)
- Seed: 6 usuarios iniciales
- **Proteger TODAS las rutas API existentes** (KPIs, stations, states, etc.)

### Sprint 1 — Fundacion HR
- Schema Prisma (14 modelos HR + enums + relacion Station — Role ya creado en Sprint 0)
- Migracion de base de datos
- Tipos TypeScript (`src/types/hr.ts`)
- CRUD route builder (`src/lib/crud-route-builder.ts`)
- Extension de api-helpers (paginacion, busqueda)
- Constantes HR (clasificaciones, colores, NAV_ITEMS)
- SystemConfig API + pagina `/admin/configuracion`

### Sprint 2 — CRUD de Entidades Base
- Componentes CRUD reutilizables (DataTable, FormModal, ConfirmDialog, etc.)
- Gestion de Roles + `/admin/roles`
- Gestion de Turnos + `/admin/turnos`
- Gestion de Empleados + `/rh/empleados` (lista + crear/editar/desactivar)
- Gestion de Categorias + `/admin/catalogo/categorias`
- Gestion de Productos + `/admin/catalogo/productos`

### Sprint 3 — Cuotas y Ventas
- Plantillas de cuota + `/admin/cuotas`
- Asignacion/generacion de cuotas + `/admin/cuotas/asignaciones`
- API de registro de ventas (individual + bulk)
- Reglas de comision + `/admin/comisiones`
- Seed data (empleados, productos, categorias, roles, turnos, cuotas)
- Actualizacion del sidebar

### Sprint 4 — Dashboards Principales
- Componentes HR: TrafficLightCell, ClassificationBadge, QuotaProgressBar, EmployeePerformanceCard
- Dashboard RH General (`/rh`)
- **Seguimiento Horario** (`/rh/seguimiento-horario`) — la vista estrella
- Planificador Diario (`/rh/planificador`)
- Detalle individual de empleado (`/rh/empleados/[id]`)
- Seed data de ventas horarias y resumenes

### Sprint 5 — Rankings y Comisiones
- LeaderboardTable + `/rh/leaderboard`
- CommissionCalculatorCard + `/rh/comisiones`
- Logica backend de calculo de comisiones por tiers
- Evaluaciones de desempeno + `/rh/evaluaciones`
- Asistencia + `/rh/asistencia`

### Sprint 6 — Gamificacion
- CRUD de logros + `/admin/logros`
- Motor de verificacion de logros (condiciones JSON)
- Componentes: AchievementBadge, AchievementGallery, StreakIndicator, EmployeeScoreRing
- Dashboard gamificacion + `/rh/gamificacion`
- Calculo de scores mensuales

### Sprint 7 — Analisis y Pulido
- Analisis por categorias + `/rh/analisis-categorias`
- Comparativo estaciones + `/rh/comparativo-estaciones`
- Analisis por turnos + `/rh/analisis-turnos`
- Exportacion Excel (`/api/hr/export`)
- Integracion SystemConfig en sidebar/topbar/metadata
- Revision responsive en todas las pantallas

### Sprint 8 — Integracion y Testing
- Seed data completo con todas las entidades
- Links cruzados entre modulos existentes y HR
- Estados vacios y error boundaries
- Optimizacion de rendimiento (indices DB, paginacion, React.memo para grid pesado)
- Loading skeletons en todas las pantallas nuevas

---

## Archivos Criticos a Modificar/Crear

| Archivo | Cambio |
|---|---|
| `prisma/schema.prisma` | +16 modelos (Role unificada + User + Session + 13 HR), +3 enums, +4 relaciones en Station |
| `src/middleware.ts` | **Nuevo** — proteccion de rutas Next.js |
| `src/providers/auth-provider.tsx` | **Nuevo** — contexto de autenticacion |
| `src/hooks/use-auth.ts` | **Nuevo** — hook de autenticacion |
| `src/types/auth.ts` | **Nuevo** — interfaces de auth |
| `src/components/auth/` | **Nuevo** — LoginForm, UserMenu, ProtectedRoute, PermissionGate |
| `src/app/login/page.tsx` | **Nuevo** — pagina de login |
| `src/app/(dashboard)/admin/usuarios/page.tsx` | **Nuevo** — gestion de usuarios |
| `src/lib/constants.ts` | NAV_ITEMS, constantes clasificacion, colores HR |
| `src/lib/api-helpers.ts` | Helpers de paginacion, busqueda, CRUD responses, auth middleware |
| `src/lib/auth.ts` | **Nuevo** — utilidades de auth (hash, verify, session mgmt) |
| `src/lib/crud-route-builder.ts` | **Nuevo** — factory de rutas CRUD |
| `src/types/hr.ts` | **Nuevo** — todas las interfaces HR |
| `src/hooks/use-hr-data.ts` | **Nuevo** — hooks de queries HR |
| `src/hooks/use-hr-crud.ts` | **Nuevo** — hooks de mutations HR |
| `src/components/domain/hr/` | **Nuevo** — 13+ componentes de dominio |
| `src/components/crud/` | **Nuevo** — 6 componentes CRUD reutilizables |
| `src/components/layout/topbar.tsx` | Agregar UserMenu dropdown |
| `src/components/layout/sidebar.tsx` | Filtrar items segun rol del usuario |
| `src/app/layout.tsx` | Agregar AuthProvider al stack de providers |
| `prisma/seed.ts` | Extension masiva con usuarios + data HR |
| `package.json` | Agregar bcryptjs + @types/bcryptjs |

**Reutilizar del proyecto existente:**
- `src/lib/formatters.ts` — formatCurrency, formatNumber, formatPercent
- `src/lib/date-utils.ts` — formatDateLabel, getDefaultDateRange
- `src/lib/utils.ts` — cn()
- `src/lib/api-helpers.ts` — parseFilters, buildKpiWhere, jsonResponse, errorResponse
- `src/hooks/use-kpi-data.ts` — patron buildQueryString y useQuery
- `src/components/charts/` — DashboardLineChart, DashboardAreaChart, DashboardBarChart, DashboardPieChart, ChartContainer
- `src/components/domain/KpiCard` — para summary cards
- `src/components/domain/TrendIndicator` — para tendencias
- `src/components/ui/skeleton.tsx` — KpiCardSkeleton, ChartSkeleton
- `src/providers/filter-provider.tsx` — patron a seguir para AuthProvider y HrFilterProvider

---

## Verificacion

1. **Auth**: Login con cada rol, verificar que rutas prohibidas redireccionan a login o muestran 403
2. **Permisos**: Verificar que EMPLEADO solo ve su data, GERENTE_ESTACION solo su estacion, etc.
3. **Sidebar**: Verificar que items se muestran/ocultan segun rol
4. **Schema**: `npx prisma migrate dev` sin errores, `npx prisma generate` genera tipos
5. **Seed**: `npx prisma db seed` genera datos completos (usuarios + HR) sin errores
6. **API CRUD**: Probar cada endpoint con curl/Postman — crear, listar, editar, eliminar
7. **Dashboard**: Navegar todas las pantallas, verificar datos, charts, filtros
8. **Semaforo**: Grid de seguimiento horario muestra colores correctos segun % cumplimiento
9. **Comisiones**: Calcular comisiones para un mes, verificar tiers aplicados correctamente
10. **Gamificacion**: Verificar logros, puntos, racha
11. **Responsivo**: Probar en mobile y desktop
12. **Dark mode**: Todas las pantallas nuevas soportan modo oscuro
13. **Configurabilidad**: Cambiar nombre de empresa en `/admin/configuracion` y verificar que se refleja en sidebar/topbar
14. **Seguridad**: Intentar acceder a APIs sin token → 401, acceder a admin sin rol → 403, passwords hasheados en DB
