# Dashboard de Productividad - Rendichicas Gasolineras

## Contexto

Rendichicas (Grupo Rendilitros) requiere un sistema de dashboards para control de productividad de sus 71 estaciones de combustible distribuidas en 5 estados (Baja California, Chihuahua, Nayarit, Sinaloa, Sonora). El sistema debe visualizar 7 categorías de KPIs con filtros geográficos y temporales, exportación de reportes, y datos semilla realistas.

## Stack Tecnológico

- **Frontend**: Next.js 15 (App Router) + React + TypeScript
- **Gráficos**: Recharts
- **Base de datos**: PostgreSQL 17 (Docker) + Prisma ORM
- **Estilos**: Tailwind CSS + shadcn/ui
- **Estado**: TanStack Query + React Context (filtros)
- **Infraestructura**: Docker + Docker Compose
- **Extras**: next-themes, lucide-react, date-fns, exceljs

---

## Estructura del Proyecto

```text
gaslogistica/dashboard/
├── docker-compose.yml             # PostgreSQL containerizado
├── .env                           # Variables de entorno (DATABASE_URL)
├── prisma/
│   ├── schema.prisma              # Esquema BD (10 tablas)
│   ├── seed.ts                    # Datos semilla (71 estaciones + 365 días KPIs)
│   └── migrations/
├── docs/
│   ├── plan-proyecto.md           # Este documento
│   └── kpis-referencia.md         # Referencia de KPIs del sector gasolinero
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Layout raíz (providers)
│   │   ├── globals.css
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # Shell: sidebar + topbar + filtros
│   │   │   ├── page.tsx           # Vista General
│   │   │   ├── estados/           # Vista por Estado
│   │   │   ├── estaciones/        # Vista por Sucursal
│   │   │   ├── tendencias/        # Vista de Tendencias
│   │   │   ├── operativos/        # KPIs Operativos
│   │   │   ├── financieros/       # KPIs Financieros
│   │   │   ├── productividad/     # KPIs Productividad
│   │   │   ├── inventario/        # KPIs Inventario
│   │   │   ├── clientes/          # KPIs Cliente
│   │   │   ├── cumplimiento/      # KPIs Cumplimiento
│   │   │   └── ambientales/       # KPIs Ambientales
│   │   └── api/
│   │       ├── stations/route.ts
│   │       ├── states/route.ts
│   │       ├── kpis/{category}/route.ts  (7 rutas)
│   │       ├── trends/route.ts
│   │       └── export/route.ts
│   ├── components/
│   │   ├── ui/                    # Primitivos (shadcn/ui)
│   │   ├── layout/                # Sidebar, Topbar, FilterBar
│   │   ├── charts/                # Wrappers de Recharts
│   │   └── domain/                # Componentes de negocio por módulo KPI
│   ├── hooks/                     # use-filters, use-kpi-data, use-stations, etc.
│   ├── lib/                       # prisma, utils, formatters, constants
│   ├── providers/                 # QueryProvider, ThemeProvider, FilterProvider
│   └── types/                     # station, kpi, filters, api
```

---

## Infraestructura Docker

### docker-compose.yml

- **PostgreSQL 17**: Puerto 5441 (externo) → 5432 (interno), volumen persistente `pgdata`
- **Credenciales**: usuario `rendichicas`, base `gaslogistica_db`
- **Healthcheck**: pg_isready cada 5s

### Comandos de operación

```bash
# Levantar base de datos
docker compose up -d

# Ejecutar migraciones
npx prisma migrate dev

# Poblar datos semilla
npx prisma db seed

# Iniciar aplicación
npm run dev

# Detener base de datos
docker compose down

# Detener y eliminar datos
docker compose down -v
```

---

## Esquema de Base de Datos (PostgreSQL + Prisma)

### Entidades Geográficas

- **states**: id, name, code (BC, SON, CHIH, SIN, NAY)
- **cities**: id, name, stateId → states
- **stations**: id, name, address, neighborhood, postalCode, cityId → cities, latitude?, longitude?, pumpCount, tankCount, tankCapacity, hasConvenienceStore, isActive

### Tablas KPI (granularidad diaria por estación)

| Tabla | Campos Clave |
| --- | --- |
| **operational_kpis** | fuelVolumeLiters, regularLiters, premiumLiters, dieselLiters, tankUtilizationPct, pumpThroughput, equipmentDowntimeMin, dispatchAccuracyPct |
| **financial_kpis** | fuelGrossMarginPct, fuelGrossMarginMxn, storeMarginPct, storeRevenueMxn, ebitdaMxn, totalRevenueMxn, operatingCostsMxn, operatingCostsPct |
| **productivity_kpis** | salesPerLaborHour, transactionsPerHour, pumpProductivity, staffEfficiencyPct, laborHours, totalTransactions |
| **inventory_kpis** | inventoryTurnover, shrinkagePct, shrinkageLiters, daysOfInventory, deliveryEfficiencyPct, inventoryAccuracyPct |
| **customer_kpis** | customerTraffic, averageTicketMxn, storeConversionPct, npsScore, loyaltyParticipationPct |
| **compliance_kpis** | regulatoryCompliancePct, safetyIncidents, tankLeakTestsPassed/Total, preventiveMaintenancePct |
| **environmental_kpis** | vocEmissionsKg, waterContentPct, energyConsumptionKwh |

Todas con `@@unique([stationId, date])` e índices en `[stationId, date]` y `[date]`.

---

## API Routes

| Ruta | Método | Params | Descripción |
| --- | --- | --- | --- |
| `/api/stations` | GET | stateId, cityId, search | Listado de estaciones |
| `/api/stations/[id]` | GET | - | Detalle de estación |
| `/api/states` | GET | - | Estados con conteos |
| `/api/kpis/overview` | GET | stateId, cityId, stationId, from, to | KPIs consolidados |
| `/api/kpis/{category}` | GET | stateId, cityId, stationId, from, to, period, groupBy | KPIs por categoría |
| `/api/trends` | GET | kpiCategory, metric, stationId, from, to, granularity | Series temporales |
| `/api/export` | POST | format, kpiCategory, filters | Exportar PDF/Excel |

---

## Vistas del Dashboard

1. **Vista General** (`/`): Grid de KPI cards resumen + top/bottom estaciones + tendencias clave
2. **Vista por Estado** (`/estados`): Comparativo entre 5 estados con rankings
3. **Vista por Sucursal** (`/estaciones/[id]`): Detalle completo de 1 estación (7 módulos en tabs)
4. **Vista de Tendencias** (`/tendencias`): Gráficos históricos con selector de métrica
5. **7 páginas de KPI detallado**: Una por categoría con gráficos especializados

---

## Módulos KPI

### 1. Operativos

- Volumen de combustible vendido (litros/día, semana, mes)
- Utilización de tanques (%)
- Throughput por bomba (litros/bomba/hora)
- Tiempo de inactividad de equipos
- Precisión de despacho

### 2. Financieros

- Margen bruto de combustible (% y MXN)
- Margen de tienda de conveniencia
- EBITDA por estación
- Ingreso total por estación
- Costos operativos como % de ingresos

### 3. Productividad

- Ventas por hora-trabajo (MXN)
- Transacciones por hora
- Productividad por bomba (litros/bomba/día)
- Eficiencia de personal (%)

### 4. Inventario y Suministro

- Rotación de inventario
- Merma / shrinkage (% y litros)
- Días de inventario
- Eficiencia de entregas (%)
- Precisión de inventario (%)

### 5. Cliente

- Tráfico de clientes (conteo)
- Ticket promedio (MXN)
- Tasa de conversión tienda (%)
- Net Promoter Score (NPS)
- Participación en programa de lealtad (%)

### 6. Cumplimiento y Seguridad

- Cumplimiento regulatorio (%)
- Incidentes de seguridad (conteo)
- Pruebas de fuga en tanques (pasadas/totales)
- Mantenimiento preventivo completado (%)

### 7. Ambientales

- Emisiones de COV (kg)
- Contenido de agua en tanques (%)
- Consumo energético (kWh)

---

## Fases de Implementación

### Fase 1: Fundación

- Inicializar Next.js + instalar dependencias
- Docker Compose para PostgreSQL
- Prisma schema + migración
- Types, lib utilities, providers

### Fase 2: Datos Semilla

- Seed script con 71 estaciones del archivo `gasolinerasinfo.md`
- 365 días de datos KPI realistas (patrones estacionales, variación fin de semana)
- ~180K filas totales de KPI

### Fase 3: UI Shell

- Componentes UI (shadcn/ui), Sidebar, Topbar, FilterBar
- Dashboard layout con navegación
- Tema dark/light

### Fase 4: API Routes

- Rutas CRUD estaciones y estados
- 7 rutas KPI con filtros geográficos/temporales y agregación
- Ruta de tendencias y exportación

### Fase 5: Gráficos y Componentes

- Wrappers de Recharts con paleta Rendichicas
- KpiCard, TrendIndicator, DataTable, PeriodSelector
- Componentes de dominio por módulo

### Fase 6: Páginas Dashboard

- Vista General → 7 módulos KPI → Estados → Estaciones → Tendencias

### Fase 7: Exportación y Pulido

- PDF y Excel via exceljs
- Loading skeletons, empty states, responsive

---

## Verificación

1. `docker compose up -d` — PostgreSQL corriendo en Docker
2. `npx prisma migrate dev` — schema válido
3. `npx prisma db seed` — 71 estaciones + ~180K filas KPI generadas
4. `npm run dev` — app corre en localhost:3000
5. Navegar por las 11 vistas del dashboard
6. Filtrar por estado/ciudad/estación y verificar que datos cambian
7. Cambiar periodo (día/semana/mes) y verificar agregación
8. Toggle dark/light theme
9. Exportar reporte PDF y Excel
