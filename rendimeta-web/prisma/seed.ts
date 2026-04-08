import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { STATIONS_SEED_DATA, STATES } from "../src/lib/constants";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function seasonalFactor(date: Date): number {
  const month = date.getMonth();
  // Higher fuel demand in summer (Jun-Aug) and December holidays
  const factors = [0.9, 0.88, 0.92, 0.95, 1.0, 1.08, 1.12, 1.1, 1.02, 0.95, 0.93, 1.05];
  return factors[month];
}

function weekendFactor(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 0.75 : day === 6 ? 0.85 : 1.0;
}

function stationSizeFactor(index: number, total: number): number {
  // Vary station size: some are bigger, some smaller
  const seed = ((index * 7 + 13) % total) / total;
  return 0.6 + seed * 0.8; // Range: 0.6 to 1.4
}

async function main() {
  console.log("Limpiando datos existentes...");
  // HR tables (must go before station/employee)
  await prisma.gamificationScore.deleteMany();
  await prisma.employeeAchievement.deleteMany();
  await prisma.achievementDefinition.deleteMany();
  await prisma.performanceEvaluation.deleteMany();
  await prisma.commissionPayment.deleteMany();
  await prisma.commissionRule.deleteMany();
  await prisma.hourlySalesSummary.deleteMany();
  await prisma.saleRecord.deleteMany();
  await prisma.quotaAssignment.deleteMany();
  await prisma.quotaTemplate.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.role.deleteMany();
  await prisma.systemConfig.deleteMany();
  // KPI tables
  await prisma.environmentalKpi.deleteMany();
  await prisma.complianceKpi.deleteMany();
  await prisma.customerKpi.deleteMany();
  await prisma.inventoryKpi.deleteMany();
  await prisma.productivityKpi.deleteMany();
  await prisma.financialKpi.deleteMany();
  await prisma.operationalKpi.deleteMany();
  await prisma.station.deleteMany();
  await prisma.city.deleteMany();
  await prisma.state.deleteMany();

  console.log("Creando estados...");
  const stateMap = new Map<string, string>();
  for (const s of STATES) {
    const state = await prisma.state.create({
      data: { name: s.name, code: s.code },
    });
    stateMap.set(s.name, state.id);
  }

  console.log("Creando ciudades...");
  const cityMap = new Map<string, string>();
  const uniqueCities = new Set<string>();
  for (const s of STATIONS_SEED_DATA) {
    const key = `${s.city}|${s.state}`;
    if (!uniqueCities.has(key)) {
      uniqueCities.add(key);
      const city = await prisma.city.create({
        data: {
          name: s.city,
          stateId: stateMap.get(s.state)!,
        },
      });
      cityMap.set(key, city.id);
    }
  }

  console.log("Creando 71 estaciones...");
  const stations: { id: string; index: number }[] = [];
  for (let i = 0; i < STATIONS_SEED_DATA.length; i++) {
    const s = STATIONS_SEED_DATA[i];
    const cityKey = `${s.city}|${s.state}`;
    const pumpCount = randInt(3, 8);
    const station = await prisma.station.create({
      data: {
        name: s.name,
        address: s.address,
        neighborhood: s.neighborhood,
        postalCode: s.postalCode,
        cityId: cityMap.get(cityKey)!,
        pumpCount,
        tankCount: randInt(2, 5),
        tankCapacityLiters: randInt(3, 8) * 10000,
        hasConvenienceStore: Math.random() > 0.15,
      },
    });
    stations.push({ id: station.id, index: i });
  }

  console.log("Generando datos KPI para 365 días...");
  const endDate = new Date("2026-03-25");
  const startDate = new Date("2025-03-25");
  const totalDays = 365;

  const BATCH_SIZE = 500;

  for (const { id: stationId, index: stIdx } of stations) {
    const sizeFactor = stationSizeFactor(stIdx, stations.length);

    // Base values for this station
    const baseFuelVolume = rand(5000, 12000) * sizeFactor;
    const baseNps = rand(40, 75);
    const baseTraffic = rand(200, 600) * sizeFactor;
    const baseTicket = rand(400, 800);

    const opBatch: Parameters<typeof prisma.operationalKpi.createMany>[0]["data"] = [];
    const finBatch: Parameters<typeof prisma.financialKpi.createMany>[0]["data"] = [];
    const prodBatch: Parameters<typeof prisma.productivityKpi.createMany>[0]["data"] = [];
    const invBatch: Parameters<typeof prisma.inventoryKpi.createMany>[0]["data"] = [];
    const custBatch: Parameters<typeof prisma.customerKpi.createMany>[0]["data"] = [];
    const compBatch: Parameters<typeof prisma.complianceKpi.createMany>[0]["data"] = [];
    const envBatch: Parameters<typeof prisma.environmentalKpi.createMany>[0]["data"] = [];

    for (let d = 0; d < totalDays; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);

      const sf = seasonalFactor(date);
      const wf = weekendFactor(date);
      const noise = rand(0.9, 1.1);
      const dayFactor = sf * wf * noise;

      // === OPERATIONAL ===
      const fuelVolume = baseFuelVolume * dayFactor;
      const regularPct = rand(0.55, 0.65);
      const premiumPct = rand(0.2, 0.3);
      const regularLiters = fuelVolume * regularPct;
      const premiumLiters = fuelVolume * premiumPct;
      const dieselLiters = fuelVolume * (1 - regularPct - premiumPct);

      opBatch.push({
        stationId,
        date,
        fuelVolumeLiters: +fuelVolume.toFixed(1),
        regularLiters: +regularLiters.toFixed(1),
        premiumLiters: +premiumLiters.toFixed(1),
        dieselLiters: +dieselLiters.toFixed(1),
        tankUtilizationPct: +rand(55, 92).toFixed(1),
        pumpThroughput: +rand(150, 450).toFixed(1),
        equipmentDowntimeMin: randInt(0, 45),
        dispatchAccuracyPct: +rand(99.2, 99.95).toFixed(2),
      });

      // === FINANCIAL ===
      const pricePerLiter = rand(21, 25);
      const totalRevenue = fuelVolume * pricePerLiter;
      const fuelMarginPct = rand(6, 14);
      const fuelMarginMxn = totalRevenue * (fuelMarginPct / 100);
      const storeRevenue = rand(3000, 15000) * sizeFactor * wf;
      const storeMarginPct = rand(28, 40);
      const operatingCosts = totalRevenue * rand(0.82, 0.92);
      const ebitda = totalRevenue + storeRevenue - operatingCosts;

      finBatch.push({
        stationId,
        date,
        fuelGrossMarginPct: +fuelMarginPct.toFixed(2),
        fuelGrossMarginMxn: +fuelMarginMxn.toFixed(2),
        storeMarginPct: +storeMarginPct.toFixed(2),
        storeRevenueMxn: +storeRevenue.toFixed(2),
        ebitdaMxn: +ebitda.toFixed(2),
        totalRevenueMxn: +(totalRevenue + storeRevenue).toFixed(2),
        operatingCostsMxn: +operatingCosts.toFixed(2),
        operatingCostsPct: +((operatingCosts / (totalRevenue + storeRevenue)) * 100).toFixed(2),
      });

      // === PRODUCTIVITY ===
      const laborHours = rand(40, 80) * sizeFactor;
      const totalTransactions = Math.round(baseTraffic * dayFactor * rand(0.7, 1.0));
      const salesPerLaborHour = (totalRevenue + storeRevenue) / laborHours;

      prodBatch.push({
        stationId,
        date,
        salesPerLaborHour: +salesPerLaborHour.toFixed(2),
        transactionsPerHour: +(totalTransactions / 16).toFixed(1),
        pumpProductivity: +(fuelVolume / randInt(3, 8)).toFixed(1),
        staffEfficiencyPct: +rand(72, 98).toFixed(1),
        laborHours: +laborHours.toFixed(1),
        totalTransactions,
      });

      // === INVENTORY ===
      invBatch.push({
        stationId,
        date,
        inventoryTurnover: +rand(0.8, 2.5).toFixed(2),
        shrinkagePct: +rand(0.05, 0.45).toFixed(3),
        shrinkageLiters: +(fuelVolume * rand(0.0005, 0.0045)).toFixed(1),
        daysOfInventory: +rand(2.5, 7).toFixed(1),
        deliveryEfficiencyPct: +rand(90, 100).toFixed(1),
        inventoryAccuracyPct: +rand(98.5, 99.98).toFixed(2),
      });

      // === CUSTOMER ===
      const traffic = Math.round(baseTraffic * dayFactor);
      custBatch.push({
        stationId,
        date,
        customerTraffic: traffic,
        averageTicketMxn: +(baseTicket * rand(0.9, 1.1)).toFixed(2),
        storeConversionPct: +rand(22, 42).toFixed(1),
        npsScore: +(baseNps + rand(-8, 8)).toFixed(1),
        loyaltyParticipationPct: +rand(15, 55).toFixed(1),
      });

      // === COMPLIANCE ===
      const leakTests = randInt(2, 6);
      compBatch.push({
        stationId,
        date,
        regulatoryCompliancePct: +rand(88, 100).toFixed(1),
        safetyIncidents: Math.random() > 0.95 ? randInt(1, 2) : 0,
        tankLeakTestsPassed: Math.random() > 0.05 ? leakTests : leakTests - 1,
        tankLeakTestsTotal: leakTests,
        preventiveMaintenancePct: +rand(75, 100).toFixed(1),
        pendingMaintenanceTasks: randInt(0, 5),
      });

      // === ENVIRONMENTAL ===
      envBatch.push({
        stationId,
        date,
        vocEmissionsKg: +(fuelVolume * rand(0.0001, 0.0005)).toFixed(3),
        waterContentPct: +rand(0.01, 0.15).toFixed(3),
        energyConsumptionKwh: +rand(80, 350).toFixed(1),
      });
    }

    // Insert in batches
    const insertBatches = async <T extends Record<string, unknown>>(
      data: T[],
      createMany: (args: { data: T[] }) => Promise<unknown>
    ) => {
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        await createMany({ data: data.slice(i, i + BATCH_SIZE) });
      }
    };

    await insertBatches(opBatch as Record<string, unknown>[], prisma.operationalKpi.createMany.bind(prisma.operationalKpi) as never);
    await insertBatches(finBatch as Record<string, unknown>[], prisma.financialKpi.createMany.bind(prisma.financialKpi) as never);
    await insertBatches(prodBatch as Record<string, unknown>[], prisma.productivityKpi.createMany.bind(prisma.productivityKpi) as never);
    await insertBatches(invBatch as Record<string, unknown>[], prisma.inventoryKpi.createMany.bind(prisma.inventoryKpi) as never);
    await insertBatches(custBatch as Record<string, unknown>[], prisma.customerKpi.createMany.bind(prisma.customerKpi) as never);
    await insertBatches(compBatch as Record<string, unknown>[], prisma.complianceKpi.createMany.bind(prisma.complianceKpi) as never);
    await insertBatches(envBatch as Record<string, unknown>[], prisma.environmentalKpi.createMany.bind(prisma.environmentalKpi) as never);

    if ((stIdx + 1) % 10 === 0 || stIdx === stations.length - 1) {
      console.log(`  Estación ${stIdx + 1}/${stations.length} completada`);
    }
  }

  // ============================================================
  // AUTH: Roles, Turnos, Usuarios
  // ============================================================
  console.log("\nCreando configuración del sistema...");
  await prisma.systemConfig.create({
    data: {
      companyName: "Rendichicas",
      companyShortName: "RC",
      brandColor: "#e11d48",
      timezone: "America/Mexico_City",
      currency: "MXN",
      operatingHoursStart: 6,
      operatingHoursEnd: 22,
    },
  });

  console.log("Creando roles...");
  const rolesData = [
    { name: "Super Administrador", description: "Acceso total al sistema", level: 5 },
    { name: "Administrador", description: "Gestión de catálogos, cuotas, comisiones", level: 4 },
    { name: "Gerente Regional", description: "Supervisión de múltiples estaciones", level: 3 },
    { name: "Gerente de Estación", description: "Gestión de una estación", level: 2 },
    { name: "Encargado de Turno", description: "Supervisión de turno", level: 1 },
    { name: "Despachador", description: "Empleado operativo de bombas", level: 0 },
    { name: "Cajero", description: "Empleado operativo de caja", level: 0 },
  ];

  const roleMap = new Map<string, string>();
  for (const r of rolesData) {
    const role = await prisma.role.create({ data: r });
    roleMap.set(r.name, role.id);
  }

  console.log("Creando turnos...");
  const shiftsData = [
    { name: "Matutino", startHour: 6, endHour: 14 },
    { name: "Vespertino", startHour: 14, endHour: 22 },
    { name: "Nocturno", startHour: 22, endHour: 6 },
  ];
  const shiftMap = new Map<string, string>();
  for (const s of shiftsData) {
    const shift = await prisma.shift.create({ data: s });
    shiftMap.set(s.name, shift.id);
  }

  console.log("Creando usuarios del sistema...");
  const passwordHash = await bcrypt.hash("admin123", 10);

  // Get first station for gerente de estación
  const firstStation = await prisma.station.findFirst();

  const usersData = [
    { email: "admin@sistema.com", firstName: "Admin", lastName: "Sistema", roleName: "Super Administrador" },
    { email: "administrador@sistema.com", firstName: "Carlos", lastName: "López", roleName: "Administrador" },
    { email: "gerente.regional@sistema.com", firstName: "María", lastName: "González", roleName: "Gerente Regional" },
    { email: "gerente.estacion@sistema.com", firstName: "Roberto", lastName: "Hernández", roleName: "Gerente de Estación", stationIds: firstStation ? [firstStation.id] : [] },
    { email: "supervisor@sistema.com", firstName: "Ana", lastName: "Martínez", roleName: "Encargado de Turno" },
    { email: "empleado@sistema.com", firstName: "Juan", lastName: "Pérez", roleName: "Despachador" },
  ];

  for (const u of usersData) {
    await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        roleId: roleMap.get(u.roleName)!,
        stationIds: "stationIds" in u && u.stationIds ? u.stationIds : Prisma.JsonNull,
      },
    });
  }

  console.log(`  ${rolesData.length} roles, ${shiftsData.length} turnos, ${usersData.length} usuarios`);

  // ============================================================
  // HR SEED DATA
  // ============================================================

  // ---------- 2. ProductCategory ----------
  console.log("\nCreando categorías de producto...");
  const categoriesData = [
    { name: "ACCESORIOS", code: "ACC", sortOrder: 1 },
    { name: "ACEITES", code: "ACE", sortOrder: 2 },
    { name: "ADITIVO MP", code: "AMP", sortOrder: 3 },
    { name: "ADITIVOS", code: "ADT", sortOrder: 4 },
    { name: "AROMATIZANTE", code: "ARO", sortOrder: 5 },
    { name: "BURRITOS", code: "BUR", sortOrder: 6 },
    { name: "FLUIDOS", code: "FLU", sortOrder: 7 },
    { name: "IMPULSO", code: "IMP", sortOrder: 8 },
    { name: "OTROS", code: "OTR", sortOrder: 9 },
  ];

  const categoryMap = new Map<string, string>();
  for (const c of categoriesData) {
    const cat = await prisma.productCategory.create({ data: c });
    categoryMap.set(c.code, cat.id);
  }
  console.log(`  ${categoriesData.length} categorías creadas`);

  // ---------- 3. Products ----------
  console.log("Creando productos...");
  const productsData: { sku: string; name: string; catCode: string; unitPrice: number; costPrice: number; unit?: string }[] = [
    // ACCESORIOS
    { sku: "ACC-001", name: "Fusible", catCode: "ACC", unitPrice: 15, costPrice: 5 },
    { sku: "ACC-002", name: "Cable USB", catCode: "ACC", unitPrice: 89, costPrice: 35 },
    { sku: "ACC-003", name: "Cargador auto", catCode: "ACC", unitPrice: 149, costPrice: 60 },
    { sku: "ACC-004", name: "Soporte celular", catCode: "ACC", unitPrice: 129, costPrice: 50 },
    { sku: "ACC-005", name: "Llavero", catCode: "ACC", unitPrice: 35, costPrice: 12 },
    // ACEITES
    { sku: "ACE-001", name: "Aceite motor 5W30", catCode: "ACE", unitPrice: 189, costPrice: 95 },
    { sku: "ACE-002", name: "Aceite motor 10W40", catCode: "ACE", unitPrice: 169, costPrice: 85 },
    { sku: "ACE-003", name: "Aceite sintético", catCode: "ACE", unitPrice: 349, costPrice: 180 },
    { sku: "ACE-004", name: "Aceite 2 tiempos", catCode: "ACE", unitPrice: 79, costPrice: 35 },
    { sku: "ACE-005", name: "Aceite transmisión", catCode: "ACE", unitPrice: 229, costPrice: 120 },
    // ADITIVO MP
    { sku: "AMP-001", name: "Aditivo gasolina premium", catCode: "AMP", unitPrice: 159, costPrice: 70 },
    { sku: "AMP-002", name: "Aditivo diesel premium", catCode: "AMP", unitPrice: 179, costPrice: 80 },
    { sku: "AMP-003", name: "Limpiador inyectores pro", catCode: "AMP", unitPrice: 199, costPrice: 90 },
    // ADITIVOS
    { sku: "ADT-001", name: "Aditivo gasolina", catCode: "ADT", unitPrice: 89, costPrice: 35 },
    { sku: "ADT-002", name: "Aditivo diesel", catCode: "ADT", unitPrice: 99, costPrice: 40 },
    { sku: "ADT-003", name: "Limpiador inyectores", catCode: "ADT", unitPrice: 119, costPrice: 50 },
    { sku: "ADT-004", name: "Aditivo radiador", catCode: "ADT", unitPrice: 79, costPrice: 30 },
    { sku: "ADT-005", name: "Aditivo aceite", catCode: "ADT", unitPrice: 109, costPrice: 45 },
    // AROMATIZANTE
    { sku: "ARO-001", name: "Aromatizante pino", catCode: "ARO", unitPrice: 35, costPrice: 10 },
    { sku: "ARO-002", name: "Aromatizante vainilla", catCode: "ARO", unitPrice: 35, costPrice: 10 },
    { sku: "ARO-003", name: "Aromatizante cereza", catCode: "ARO", unitPrice: 35, costPrice: 10 },
    { sku: "ARO-004", name: "Aromatizante nuevo", catCode: "ARO", unitPrice: 39, costPrice: 12 },
    // BURRITOS
    { sku: "BUR-001", name: "Burrito jamón", catCode: "BUR", unitPrice: 45, costPrice: 18 },
    { sku: "BUR-002", name: "Burrito frijol", catCode: "BUR", unitPrice: 35, costPrice: 14 },
    { sku: "BUR-003", name: "Burrito mixto", catCode: "BUR", unitPrice: 49, costPrice: 20 },
    { sku: "BUR-004", name: "Hot dog", catCode: "BUR", unitPrice: 39, costPrice: 15 },
    { sku: "BUR-005", name: "Torta", catCode: "BUR", unitPrice: 55, costPrice: 22 },
    // FLUIDOS
    { sku: "FLU-001", name: "Líquido frenos", catCode: "FLU", unitPrice: 89, costPrice: 40 },
    { sku: "FLU-002", name: "Anticongelante", catCode: "FLU", unitPrice: 119, costPrice: 55 },
    { sku: "FLU-003", name: "Líquido limpiaparabrisas", catCode: "FLU", unitPrice: 49, costPrice: 18 },
    { sku: "FLU-004", name: "Líquido dirección", catCode: "FLU", unitPrice: 99, costPrice: 45 },
    // IMPULSO
    { sku: "IMP-001", name: "Refresco 600ml", catCode: "IMP", unitPrice: 22, costPrice: 10 },
    { sku: "IMP-002", name: "Agua 500ml", catCode: "IMP", unitPrice: 15, costPrice: 5 },
    { sku: "IMP-003", name: "Café americano", catCode: "IMP", unitPrice: 29, costPrice: 8 },
    { sku: "IMP-004", name: "Café capuchino", catCode: "IMP", unitPrice: 39, costPrice: 12 },
    { sku: "IMP-005", name: "Galletas", catCode: "IMP", unitPrice: 18, costPrice: 8 },
    { sku: "IMP-006", name: "Papas", catCode: "IMP", unitPrice: 22, costPrice: 10 },
    // OTROS
    { sku: "OTR-001", name: "Franela", catCode: "OTR", unitPrice: 25, costPrice: 8 },
    { sku: "OTR-002", name: "Guantes", catCode: "OTR", unitPrice: 35, costPrice: 12 },
    { sku: "OTR-003", name: "Destapador", catCode: "OTR", unitPrice: 20, costPrice: 6 },
    { sku: "OTR-004", name: "Mapa carretero", catCode: "OTR", unitPrice: 65, costPrice: 25 },
    { sku: "OTR-005", name: "Botiquín", catCode: "OTR", unitPrice: 159, costPrice: 70 },
  ];

  const productIdMap = new Map<string, { id: string; unitPrice: number; catCode: string }>();
  const productsByCat = new Map<string, string[]>();
  for (const p of productsData) {
    const prod = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        categoryId: categoryMap.get(p.catCode)!,
        unitPrice: p.unitPrice,
        costPrice: p.costPrice,
        unit: p.unit ?? "pieza",
      },
    });
    productIdMap.set(p.sku, { id: prod.id, unitPrice: p.unitPrice, catCode: p.catCode });
    if (!productsByCat.has(p.catCode)) productsByCat.set(p.catCode, []);
    productsByCat.get(p.catCode)!.push(p.sku);
  }
  console.log(`  ${productsData.length} productos creados`);

  // ---------- 4. Employees ----------
  console.log("Creando empleados...");
  const firstNames = [
    "Juan", "Pedro", "Miguel", "José", "Luis", "Carlos", "Antonio", "Francisco",
    "María", "Ana", "Rosa", "Guadalupe", "Patricia", "Laura", "Carmen", "Alejandra",
    "Fernando", "Ricardo", "Alberto", "Sergio", "Jorge", "Rafael", "Arturo", "Enrique",
    "Claudia", "Verónica", "Leticia", "Adriana", "Gabriela", "Sandra", "Diana", "Silvia",
    "Héctor", "Raúl", "Manuel", "Daniel", "Eduardo", "Óscar", "Víctor", "Jesús",
    "Mariana", "Sofía", "Daniela", "Andrea", "Natalia", "Fernanda", "Valeria", "Isabella",
    "Martín", "Hugo", "Pablo", "Iván", "Tomás", "Samuel", "Rodrigo", "Felipe",
    "Monserrat", "Paola", "Karla", "Fabiola",
  ];
  const lastNames = [
    "García", "Hernández", "Martínez", "López", "González", "Rodríguez", "Pérez",
    "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Cruz",
    "Morales", "Reyes", "Gutiérrez", "Ortiz", "Ramos", "Vargas", "Castillo", "Mendoza",
    "Ruiz", "Aguilar", "Herrera", "Medina", "Domínguez", "Castro", "Romero",
  ];

  const hrStations = stations.slice(0, 10); // first 10 stations
  const shiftNames = ["Matutino", "Vespertino", "Nocturno"];
  const allEmployees: { id: string; stationId: string; shiftName: string; empNumber: string; roleName: string }[] = [];
  let empCounter = 1;

  // Fetch user records so we can link them
  const userEmpleado = await prisma.user.findUnique({ where: { email: "empleado@sistema.com" } });
  const userSupervisor = await prisma.user.findUnique({ where: { email: "supervisor@sistema.com" } });
  const userGerente = await prisma.user.findUnique({ where: { email: "gerente.estacion@sistema.com" } });

  let linkedEmpleado = false;
  let linkedSupervisor = false;
  let linkedGerente = false;

  for (const { id: stationId } of hrStations) {
    const empCount = randInt(5, 8);
    for (let e = 0; e < empCount; e++) {
      const empNum = `EMP-${String(empCounter).padStart(3, "0")}`;
      empCounter++;

      // Assign roles: first employee of first station = linked despachador, etc.
      let roleName: string;
      if (e === 0 && !linkedGerente) {
        roleName = "Gerente de Estación";
      } else if (e === 1 && !linkedSupervisor) {
        roleName = "Encargado de Turno";
      } else if (e < 2) {
        roleName = Math.random() < 0.3 ? "Encargado de Turno" : "Despachador";
      } else {
        const r = Math.random();
        roleName = r < 0.15 ? "Cajero" : r < 0.25 ? "Encargado de Turno" : "Despachador";
      }

      const shiftName = shiftNames[e % 3];
      const hireDate = new Date("2024-04-01");
      hireDate.setDate(hireDate.getDate() + randInt(0, 700)); // spread over ~2 years

      const fn = firstNames[randInt(0, firstNames.length - 1)];
      const ln1 = lastNames[randInt(0, lastNames.length - 1)];
      const ln2 = lastNames[randInt(0, lastNames.length - 1)];

      const emp = await prisma.employee.create({
        data: {
          employeeNumber: empNum,
          firstName: fn,
          lastName: `${ln1} ${ln2}`,
          email: `${empNum.toLowerCase()}@rendichicas.com`,
          roleId: roleMap.get(roleName)!,
          shiftId: shiftMap.get(shiftName)!,
          stationId,
          hireDate,
          status: "ACTIVE",
        },
      });

      // Link to users
      if (!linkedEmpleado && roleName === "Despachador" && userEmpleado) {
        await prisma.user.update({ where: { id: userEmpleado.id }, data: { employeeId: emp.id } });
        linkedEmpleado = true;
      } else if (!linkedSupervisor && roleName === "Encargado de Turno" && userSupervisor) {
        await prisma.user.update({ where: { id: userSupervisor.id }, data: { employeeId: emp.id } });
        linkedSupervisor = true;
      } else if (!linkedGerente && roleName === "Gerente de Estación" && userGerente) {
        await prisma.user.update({ where: { id: userGerente.id }, data: { employeeId: emp.id } });
        linkedGerente = true;
      }

      allEmployees.push({ id: emp.id, stationId, shiftName, empNumber: empNum, roleName });
    }
  }
  console.log(`  ${allEmployees.length} empleados creados`);

  // ---------- 5. QuotaTemplate ----------
  console.log("Creando plantillas de cuota...");
  const quotaTargets: Record<string, { monthly: number; isRevenue: boolean }> = {
    ACC: { monthly: 80, isRevenue: false },
    ACE: { monthly: 60, isRevenue: false },
    AMP: { monthly: 50, isRevenue: false },
    ADT: { monthly: 100, isRevenue: false },
    ARO: { monthly: 120, isRevenue: false },
    BUR: { monthly: 200, isRevenue: false },
    FLU: { monthly: 70, isRevenue: false },
    IMP: { monthly: 500, isRevenue: false },
    OTR: { monthly: 60, isRevenue: false },
  };

  const templateMap = new Map<string, string>();
  for (const [code, tgt] of Object.entries(quotaTargets)) {
    const tmpl = await prisma.quotaTemplate.create({
      data: {
        name: `Cuota ${categoriesData.find(c => c.code === code)!.name}`,
        categoryId: categoryMap.get(code)!,
        monthlyTarget: tgt.monthly,
        isRevenue: tgt.isRevenue,
      },
    });
    templateMap.set(code, tmpl.id);
  }
  console.log(`  ${Object.keys(quotaTargets).length} plantillas creadas`);

  // ---------- 6. QuotaAssignment ----------
  console.log("Creando asignaciones de cuota (3 meses)...");
  const quotaMonths = [
    new Date("2026-01-01"),
    new Date("2026-02-01"),
    new Date("2026-03-01"),
  ];

  const quotaAssignmentBatch: Parameters<typeof prisma.quotaAssignment.createMany>[0]["data"] = [];
  for (const emp of allEmployees) {
    for (const month of quotaMonths) {
      for (const [code, tgt] of Object.entries(quotaTargets)) {
        const catName = categoriesData.find(c => c.code === code)!.name;
        // Vary quota slightly per employee
        const empFactor = 0.8 + (parseInt(emp.empNumber.slice(4)) % 10) * 0.04;
        const monthlyTarget = Math.round(tgt.monthly * empFactor);
        quotaAssignmentBatch.push({
          employeeId: emp.id,
          templateId: templateMap.get(code)!,
          month,
          dailyTarget: +(monthlyTarget / 30).toFixed(2),
          monthlyTarget,
          categoryName: catName,
        });
      }
    }
  }
  // Batch insert
  for (let i = 0; i < quotaAssignmentBatch.length; i += BATCH_SIZE) {
    await prisma.quotaAssignment.createMany({ data: quotaAssignmentBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`  ${quotaAssignmentBatch.length} asignaciones de cuota creadas`);

  // ---------- 7. SaleRecord ----------
  console.log("Generando registros de venta (90 días)...");
  const salesStartDate = new Date("2025-12-28"); // 90 days back from 2026-03-28
  const SALES_DAYS = 90;
  let totalSales = 0;

  // Employee performance factor (some sell more, some less)
  const empPerformance = new Map<string, number>();
  for (const emp of allEmployees) {
    empPerformance.set(emp.id, 0.6 + Math.random() * 0.8); // 0.6 to 1.4
  }

  // Shift hour ranges
  const shiftHours: Record<string, number[]> = {
    Matutino: [6, 7, 8, 9, 10, 11, 12, 13],
    Vespertino: [14, 15, 16, 17, 18, 19, 20, 21],
    Nocturno: [22, 23, 0, 1, 2, 3, 4, 5],
  };

  // All category codes for iteration
  const catCodes = categoriesData.map(c => c.code);

  for (let dayOffset = 0; dayOffset < SALES_DAYS; dayOffset++) {
    const saleDate = new Date(salesStartDate);
    saleDate.setDate(saleDate.getDate() + dayOffset);
    const dayOfWeek = saleDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const dayBatch: Parameters<typeof prisma.saleRecord.createMany>[0]["data"] = [];

    for (const emp of allEmployees) {
      const perf = empPerformance.get(emp.id)!;
      const baseSalesPerDay = isWeekend ? randInt(8, 20) : randInt(12, 30);
      const salesCount = Math.round(baseSalesPerDay * perf);
      const hours = shiftHours[emp.shiftName];

      for (let s = 0; s < salesCount; s++) {
        // Pick a random category, weighted towards IMPULSO and BURRITOS
        const catWeight = Math.random();
        let catCode: string;
        if (catWeight < 0.30) catCode = "IMP";
        else if (catWeight < 0.50) catCode = "BUR";
        else if (catWeight < 0.60) catCode = "ADT";
        else if (catWeight < 0.68) catCode = "ARO";
        else if (catWeight < 0.76) catCode = "ACE";
        else if (catWeight < 0.82) catCode = "FLU";
        else if (catWeight < 0.88) catCode = "ACC";
        else if (catWeight < 0.94) catCode = "AMP";
        else catCode = "OTR";

        const prods = productsByCat.get(catCode)!;
        const sku = prods[randInt(0, prods.length - 1)];
        const prodInfo = productIdMap.get(sku)!;

        const quantity = catCode === "IMP" || catCode === "BUR" || catCode === "ARO"
          ? randInt(1, 3)
          : randInt(1, 2);
        const unitPrice = +(prodInfo.unitPrice * rand(0.95, 1.05)).toFixed(2);
        const hour = hours[randInt(0, hours.length - 1)];

        dayBatch.push({
          employeeId: emp.id,
          productId: prodInfo.id,
          stationId: emp.stationId,
          date: saleDate,
          hour,
          quantity,
          unitPrice,
          totalAmount: +(quantity * unitPrice).toFixed(2),
        });
      }
    }

    // Insert day batch
    for (let i = 0; i < dayBatch.length; i += BATCH_SIZE) {
      await prisma.saleRecord.createMany({ data: dayBatch.slice(i, i + BATCH_SIZE) });
    }
    totalSales += dayBatch.length;

    if ((dayOffset + 1) % 30 === 0 || dayOffset === SALES_DAYS - 1) {
      console.log(`  Ventas día ${dayOffset + 1}/${SALES_DAYS} - acumulado: ${totalSales.toLocaleString()}`);
    }
  }
  console.log(`  ${totalSales.toLocaleString()} registros de venta creados`);

  // ---------- 8. HourlySalesSummary ----------
  console.log("Pre-agregando resumen por hora...");
  // We'll query sale records grouped by employee/date/hour
  const hourlyAgg = await prisma.saleRecord.groupBy({
    by: ["employeeId", "stationId", "date", "hour"],
    _sum: { quantity: true, totalAmount: true },
  });

  // Build a map of employee daily quota targets
  const empQuotaDaily = new Map<string, number>();
  for (const emp of allEmployees) {
    // Average daily target across categories (simplified)
    let totalDaily = 0;
    for (const tgt of Object.values(quotaTargets)) {
      totalDaily += tgt.monthly / 30;
    }
    const empFactor = 0.8 + (parseInt(emp.empNumber.slice(4)) % 10) * 0.04;
    empQuotaDaily.set(emp.id, totalDaily * empFactor);
  }

  const hourlyBatch: Parameters<typeof prisma.hourlySalesSummary.createMany>[0]["data"] = [];
  for (const row of hourlyAgg) {
    const totalUnits = row._sum.quantity ?? 0;
    const totalRevenue = row._sum.totalAmount ?? 0;
    const dailyQuota = empQuotaDaily.get(row.employeeId) ?? 1;
    // Hourly target = daily / 8 hours
    const hourlyTarget = dailyQuota / 8;
    const fulfillmentPct = hourlyTarget > 0 ? +((totalUnits / hourlyTarget) * 100).toFixed(1) : 0;

    hourlyBatch.push({
      employeeId: row.employeeId,
      stationId: row.stationId,
      date: row.date,
      hour: row.hour,
      totalUnits: +totalUnits.toFixed(2),
      totalRevenue: +totalRevenue.toFixed(2),
      quotaTarget: +hourlyTarget.toFixed(2),
      fulfillmentPct,
    });
  }
  for (let i = 0; i < hourlyBatch.length; i += BATCH_SIZE) {
    await prisma.hourlySalesSummary.createMany({ data: hourlyBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`  ${hourlyBatch.length.toLocaleString()} resúmenes por hora creados`);

  // ---------- 9. Attendance ----------
  console.log("Generando asistencias (90 días)...");
  const attendanceBatch: Parameters<typeof prisma.attendance.createMany>[0]["data"] = [];

  for (const emp of allEmployees) {
    const shiftStart = shiftsData.find(s => s.name === emp.shiftName)!.startHour;
    const shiftEnd = shiftsData.find(s => s.name === emp.shiftName)!.endHour;

    for (let d = 0; d < SALES_DAYS; d++) {
      const attDate = new Date(salesStartDate.getTime());
      attDate.setDate(salesStartDate.getDate() + d);
      // Normalize to midnight for @db.Date
      const dateOnly = new Date(attDate.getFullYear(), attDate.getMonth(), attDate.getDate());

      const roll = Math.random();
      let status: "PRESENT" | "ABSENT" | "LATE" | "DAY_OFF" | "VACATION" | "SICK_LEAVE";
      if (roll < 0.92) status = "PRESENT";
      else if (roll < 0.95) status = "LATE";
      else if (roll < 0.97) status = "ABSENT";
      else if (roll < 0.98) status = "DAY_OFF";
      else if (roll < 0.99) status = "VACATION";
      else status = "SICK_LEAVE";

      let clockIn: Date | null = null;
      let clockOut: Date | null = null;
      let hoursWorked: number | null = null;

      if (status === "PRESENT" || status === "LATE") {
        const ciMinOffset = status === "LATE" ? randInt(5, 45) : randInt(-15, 5);
        clockIn = new Date(dateOnly);
        clockIn.setHours(shiftStart, Math.abs(ciMinOffset), 0, 0);

        const coMinOffset = randInt(0, 30);
        clockOut = new Date(dateOnly);
        const endH = shiftEnd < shiftStart ? shiftEnd + 24 : shiftEnd;
        clockOut.setHours(endH > 23 ? endH - 24 : shiftEnd, coMinOffset, 0, 0);
        if (shiftEnd < shiftStart) clockOut.setDate(clockOut.getDate() + 1);

        hoursWorked = Math.max(1, +((endH - shiftStart) + (coMinOffset - Math.abs(ciMinOffset)) / 60).toFixed(2));
      }

      attendanceBatch.push({
        employeeId: emp.id,
        stationId: emp.stationId,
        shiftId: shiftMap.get(emp.shiftName)!,
        date: dateOnly,
        clockIn,
        clockOut,
        hoursWorked,
        status,
      });
    }
  }
  for (let i = 0; i < attendanceBatch.length; i += BATCH_SIZE) {
    await prisma.attendance.createMany({ data: attendanceBatch.slice(i, i + BATCH_SIZE), skipDuplicates: true });
  }
  console.log(`  ${attendanceBatch.length.toLocaleString()} registros de asistencia creados`);

  // ---------- 10. CommissionRule ----------
  console.log("Creando reglas de comisión...");
  const commRuleBatch: Parameters<typeof prisma.commissionRule.createMany>[0]["data"] = [];
  for (const cat of categoriesData) {
    commRuleBatch.push(
      { name: `${cat.name} - Tier 1`, categoryId: categoryMap.get(cat.code)!, tierMinPct: 80, tierMaxPct: 99.99, commissionPct: 2 },
      { name: `${cat.name} - Tier 2`, categoryId: categoryMap.get(cat.code)!, tierMinPct: 100, tierMaxPct: 119.99, commissionPct: 5 },
      { name: `${cat.name} - Tier 3`, categoryId: categoryMap.get(cat.code)!, tierMinPct: 120, tierMaxPct: null, commissionPct: 8 },
    );
  }
  await prisma.commissionRule.createMany({ data: commRuleBatch });
  console.log(`  ${commRuleBatch.length} reglas de comisión creadas`);

  // ---------- 11. CommissionPayment ----------
  console.log("Calculando pagos de comisión (3 meses)...");
  const commPayBatch: Parameters<typeof prisma.commissionPayment.createMany>[0]["data"] = [];

  for (const month of quotaMonths) {
    const monthEnd = new Date(month);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    // Only process months that have passed or are current
    if (month > new Date("2026-03-28")) continue;

    for (const emp of allEmployees) {
      for (const cat of categoriesData) {
        // Get quota for this employee/month/category
        const empFactor = 0.8 + (parseInt(emp.empNumber.slice(4)) % 10) * 0.04;
        const monthlyTarget = Math.round(quotaTargets[cat.code].monthly * empFactor);

        // Simulate sales amount based on performance
        const perf = empPerformance.get(emp.id)!;
        const salesAmount = +(monthlyTarget * perf * rand(0.7, 1.3) * (productIdMap.get(productsByCat.get(cat.code)![0])!.unitPrice)).toFixed(2);
        const quotaAmount = +(monthlyTarget * (productIdMap.get(productsByCat.get(cat.code)![0])!.unitPrice)).toFixed(2);
        const fulfillmentPct = quotaAmount > 0 ? +((salesAmount / quotaAmount) * 100).toFixed(1) : 0;

        let commissionRate = 0;
        if (fulfillmentPct >= 120) commissionRate = 8;
        else if (fulfillmentPct >= 100) commissionRate = 5;
        else if (fulfillmentPct >= 80) commissionRate = 2;

        const commissionAmount = +(salesAmount * commissionRate / 100).toFixed(2);

        commPayBatch.push({
          employeeId: emp.id,
          month,
          categoryName: cat.name,
          salesAmount,
          quotaAmount,
          fulfillmentPct,
          commissionRate,
          commissionAmount,
          status: month < new Date("2026-03-01") ? "PAID" : "CALCULATED",
        });
      }
    }
  }
  for (let i = 0; i < commPayBatch.length; i += BATCH_SIZE) {
    await prisma.commissionPayment.createMany({ data: commPayBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`  ${commPayBatch.length.toLocaleString()} pagos de comisión creados`);

  // ---------- 12. PerformanceEvaluation ----------
  console.log("Generando evaluaciones de desempeño (6 meses)...");
  const evalMonths = [
    new Date("2025-10-01"), new Date("2025-11-01"), new Date("2025-12-01"),
    new Date("2026-01-01"), new Date("2026-02-01"), new Date("2026-03-01"),
  ];

  const evalBatch: Parameters<typeof prisma.performanceEvaluation.createMany>[0]["data"] = [];
  for (const emp of allEmployees) {
    const perf = empPerformance.get(emp.id)!;
    for (const month of evalMonths) {
      const overallPct = +(perf * rand(70, 130)).toFixed(1);

      let classification: "PREMIUM" | "PRODUCTIVE" | "TRANSITION" | "NON_PRODUCTIVE";
      // Distribution: ~15% Premium, ~45% Productive, ~25% Transition, ~15% Non-Productive
      if (overallPct >= 115) classification = "PREMIUM";
      else if (overallPct >= 85) classification = "PRODUCTIVE";
      else if (overallPct >= 65) classification = "TRANSITION";
      else classification = "NON_PRODUCTIVE";

      evalBatch.push({
        employeeId: emp.id,
        evaluationMonth: month,
        overallFulfillmentPct: overallPct,
        classification,
        fuelSalesAmount: +(rand(15000, 80000) * perf).toFixed(2),
        peripheralSalesAmount: +(rand(3000, 20000) * perf).toFixed(2),
        attendanceScore: +rand(80, 100).toFixed(1),
      });
    }
  }
  for (let i = 0; i < evalBatch.length; i += BATCH_SIZE) {
    await prisma.performanceEvaluation.createMany({ data: evalBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`  ${evalBatch.length.toLocaleString()} evaluaciones creadas`);

  // ---------- 13. AchievementDefinition ----------
  console.log("Creando definiciones de logros...");
  const achievementsData = [
    { code: "first_sale", name: "Primera Venta", description: "Realizar la primera venta", iconEmoji: "🎯", category: "sales", pointValue: 5, condition: { type: "first_sale" } },
    { code: "sales_10", name: "10 Ventas en un día", description: "Realizar 10 ventas en un solo día", iconEmoji: "🔥", category: "sales", pointValue: 10, condition: { type: "daily_sales", count: 10 } },
    { code: "sales_50", name: "50 Ventas en un día", description: "Realizar 50 ventas en un solo día", iconEmoji: "💎", category: "sales", pointValue: 50, condition: { type: "daily_sales", count: 50 } },
    { code: "perfect_day", name: "Día Perfecto", description: "100%+ en todas las categorías en un día", iconEmoji: "⭐", category: "sales", pointValue: 30, condition: { type: "perfect_day", minPct: 100 } },
    { code: "streak_3", name: "Racha de 3 días", description: "3 días consecutivos productivo", iconEmoji: "🔗", category: "streak", pointValue: 15, condition: { type: "streak", days: 3 } },
    { code: "streak_7", name: "Racha de 7 días", description: "7 días consecutivos productivo", iconEmoji: "⛓️", category: "streak", pointValue: 35, condition: { type: "streak", days: 7 } },
    { code: "streak_30", name: "Racha de 30 días", description: "30 días consecutivos productivo", iconEmoji: "🏆", category: "streak", pointValue: 100, condition: { type: "streak", days: 30 } },
    { code: "premium_month", name: "Mes Premium", description: "Clasificación Premium en un mes", iconEmoji: "👑", category: "performance", pointValue: 50, condition: { type: "classification", value: "PREMIUM" } },
    { code: "top_seller", name: "Mejor Vendedor del Mes", description: "Ser el mejor vendedor de la estación en un mes", iconEmoji: "🥇", category: "sales", pointValue: 40, condition: { type: "top_seller" } },
    { code: "attendance_perfect", name: "Asistencia Perfecta", description: "Asistencia perfecta en un mes", iconEmoji: "✅", category: "attendance", pointValue: 25, condition: { type: "perfect_attendance" } },
    { code: "early_bird", name: "Madrugador", description: "Check-in antes de la hora de turno", iconEmoji: "🌅", category: "attendance", pointValue: 5, condition: { type: "early_checkin" } },
    { code: "category_master", name: "Maestro de Categoría", description: "120%+ en una categoría", iconEmoji: "🎓", category: "sales", pointValue: 20, condition: { type: "category_fulfillment", minPct: 120 } },
    { code: "all_categories", name: "Todoterreno", description: "90%+ en todas las categorías", iconEmoji: "🌟", category: "sales", pointValue: 35, condition: { type: "all_categories", minPct: 90 } },
    { code: "team_player", name: "Jugador de Equipo", description: "Contribuir al éxito del equipo", iconEmoji: "🤝", category: "social", pointValue: 15, condition: { type: "team_contribution" } },
    { code: "rising_star", name: "Estrella en Ascenso", description: "Mejora >20% vs mes anterior", iconEmoji: "🚀", category: "performance", pointValue: 30, condition: { type: "improvement", minPct: 20 } },
  ];

  const achievementMap = new Map<string, string>();
  for (const a of achievementsData) {
    const ach = await prisma.achievementDefinition.create({ data: a });
    achievementMap.set(a.code, ach.id);
  }
  console.log(`  ${achievementsData.length} logros definidos`);

  // ---------- 14. EmployeeAchievement ----------
  console.log("Asignando logros a empleados...");
  const achCodes = achievementsData.map(a => a.code);
  const empAchBatch: Parameters<typeof prisma.employeeAchievement.createMany>[0]["data"] = [];
  const usedPairs = new Set<string>();

  for (const emp of allEmployees) {
    const numAch = randInt(3, 5);
    const shuffled = [...achCodes].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numAch && i < shuffled.length; i++) {
      const key = `${emp.id}|${shuffled[i]}`;
      if (usedPairs.has(key)) continue;
      usedPairs.add(key);

      const daysAgo = randInt(1, 90);
      const earnedAt = new Date("2026-03-28");
      earnedAt.setDate(earnedAt.getDate() - daysAgo);

      empAchBatch.push({
        employeeId: emp.id,
        achievementId: achievementMap.get(shuffled[i])!,
        earnedAt,
      });
    }
  }
  for (let i = 0; i < empAchBatch.length; i += BATCH_SIZE) {
    await prisma.employeeAchievement.createMany({ data: empAchBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`  ${empAchBatch.length} logros asignados`);

  // ---------- 15. GamificationScore ----------
  console.log("Calculando puntajes de gamificación (3 meses)...");
  const gamBatch: Parameters<typeof prisma.gamificationScore.createMany>[0]["data"] = [];

  for (const month of quotaMonths) {
    for (const emp of allEmployees) {
      const perf = empPerformance.get(emp.id)!;

      const salesPoints = Math.round(perf * rand(50, 200));
      const attendancePoints = Math.round(rand(70, 100));
      const streakDays = randInt(0, 20);
      const streakPoints = streakDays * 5;
      // Bonus from achievements
      const empAchCount = empAchBatch.filter(a => a.employeeId === emp.id).length;
      const bonusPoints = empAchCount * randInt(5, 15);
      const totalPoints = salesPoints + attendancePoints + streakPoints + bonusPoints;

      gamBatch.push({
        employeeId: emp.id,
        month,
        totalPoints,
        salesPoints,
        attendancePoints,
        streakPoints,
        bonusPoints,
        currentStreak: streakDays,
        bestStreak: Math.max(streakDays, randInt(streakDays, 30)),
      });
    }
  }
  for (let i = 0; i < gamBatch.length; i += BATCH_SIZE) {
    await prisma.gamificationScore.createMany({ data: gamBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`  ${gamBatch.length} puntajes de gamificación creados`);

  console.log("\n--- HR seed data completado ---");

  const counts = {
    states: await prisma.state.count(),
    cities: await prisma.city.count(),
    stations: await prisma.station.count(),
    operational: await prisma.operationalKpi.count(),
    financial: await prisma.financialKpi.count(),
    productivity: await prisma.productivityKpi.count(),
    inventory: await prisma.inventoryKpi.count(),
    customer: await prisma.customerKpi.count(),
    compliance: await prisma.complianceKpi.count(),
    environmental: await prisma.environmentalKpi.count(),
    categories: await prisma.productCategory.count(),
    products: await prisma.product.count(),
    employees: await prisma.employee.count(),
    quotaTemplates: await prisma.quotaTemplate.count(),
    quotaAssignments: await prisma.quotaAssignment.count(),
    saleRecords: await prisma.saleRecord.count(),
    hourlySummaries: await prisma.hourlySalesSummary.count(),
    attendances: await prisma.attendance.count(),
    commissionRules: await prisma.commissionRule.count(),
    commissionPayments: await prisma.commissionPayment.count(),
    evaluations: await prisma.performanceEvaluation.count(),
    achievements: await prisma.achievementDefinition.count(),
    empAchievements: await prisma.employeeAchievement.count(),
    gamification: await prisma.gamificationScore.count(),
  };

  console.log("\nSeed completado:");
  console.log(`  ${counts.states} estados`);
  console.log(`  ${counts.cities} ciudades`);
  console.log(`  ${counts.stations} estaciones`);
  console.log(`  ${counts.operational} registros operativos`);
  console.log(`  ${counts.financial} registros financieros`);
  console.log(`  ${counts.productivity} registros productividad`);
  console.log(`  ${counts.inventory} registros inventario`);
  console.log(`  ${counts.customer} registros cliente`);
  console.log(`  ${counts.compliance} registros cumplimiento`);
  console.log(`  ${counts.environmental} registros ambientales`);
  const totalKpi =
    counts.operational + counts.financial + counts.productivity +
    counts.inventory + counts.customer + counts.compliance + counts.environmental;
  console.log(`  Total KPI: ${totalKpi.toLocaleString()} filas`);
  console.log(`  --- HR ---`);
  console.log(`  ${counts.categories} categorías de producto`);
  console.log(`  ${counts.products} productos`);
  console.log(`  ${counts.employees} empleados`);
  console.log(`  ${counts.quotaTemplates} plantillas de cuota`);
  console.log(`  ${counts.quotaAssignments} asignaciones de cuota`);
  console.log(`  ${counts.saleRecords.toLocaleString()} registros de venta`);
  console.log(`  ${counts.hourlySummaries.toLocaleString()} resúmenes por hora`);
  console.log(`  ${counts.attendances.toLocaleString()} registros de asistencia`);
  console.log(`  ${counts.commissionRules} reglas de comisión`);
  console.log(`  ${counts.commissionPayments.toLocaleString()} pagos de comisión`);
  console.log(`  ${counts.evaluations} evaluaciones`);
  console.log(`  ${counts.achievements} logros definidos`);
  console.log(`  ${counts.empAchievements} logros asignados`);
  console.log(`  ${counts.gamification} puntajes de gamificación`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
