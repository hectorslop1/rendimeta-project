-- CreateTable
CREATE TABLE "states" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "pumpCount" INTEGER NOT NULL DEFAULT 4,
    "tankCount" INTEGER NOT NULL DEFAULT 3,
    "tankCapacityLiters" DOUBLE PRECISION NOT NULL DEFAULT 40000,
    "hasConvenienceStore" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_kpis" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "fuelVolumeLiters" DOUBLE PRECISION NOT NULL,
    "regularLiters" DOUBLE PRECISION NOT NULL,
    "premiumLiters" DOUBLE PRECISION NOT NULL,
    "dieselLiters" DOUBLE PRECISION NOT NULL,
    "tankUtilizationPct" DOUBLE PRECISION NOT NULL,
    "pumpThroughput" DOUBLE PRECISION NOT NULL,
    "equipmentDowntimeMin" INTEGER NOT NULL,
    "dispatchAccuracyPct" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operational_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_kpis" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "fuelGrossMarginPct" DOUBLE PRECISION NOT NULL,
    "fuelGrossMarginMxn" DOUBLE PRECISION NOT NULL,
    "storeMarginPct" DOUBLE PRECISION NOT NULL,
    "storeRevenueMxn" DOUBLE PRECISION NOT NULL,
    "ebitdaMxn" DOUBLE PRECISION NOT NULL,
    "totalRevenueMxn" DOUBLE PRECISION NOT NULL,
    "operatingCostsMxn" DOUBLE PRECISION NOT NULL,
    "operatingCostsPct" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productivity_kpis" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "salesPerLaborHour" DOUBLE PRECISION NOT NULL,
    "transactionsPerHour" DOUBLE PRECISION NOT NULL,
    "pumpProductivity" DOUBLE PRECISION NOT NULL,
    "staffEfficiencyPct" DOUBLE PRECISION NOT NULL,
    "laborHours" DOUBLE PRECISION NOT NULL,
    "totalTransactions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productivity_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_kpis" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "inventoryTurnover" DOUBLE PRECISION NOT NULL,
    "shrinkagePct" DOUBLE PRECISION NOT NULL,
    "shrinkageLiters" DOUBLE PRECISION NOT NULL,
    "daysOfInventory" DOUBLE PRECISION NOT NULL,
    "deliveryEfficiencyPct" DOUBLE PRECISION NOT NULL,
    "inventoryAccuracyPct" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_kpis" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "customerTraffic" INTEGER NOT NULL,
    "averageTicketMxn" DOUBLE PRECISION NOT NULL,
    "storeConversionPct" DOUBLE PRECISION NOT NULL,
    "npsScore" DOUBLE PRECISION NOT NULL,
    "loyaltyParticipationPct" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_kpis" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "regulatoryCompliancePct" DOUBLE PRECISION NOT NULL,
    "safetyIncidents" INTEGER NOT NULL,
    "tankLeakTestsPassed" INTEGER NOT NULL,
    "tankLeakTestsTotal" INTEGER NOT NULL,
    "preventiveMaintenancePct" DOUBLE PRECISION NOT NULL,
    "pendingMaintenanceTasks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environmental_kpis" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "vocEmissionsKg" DOUBLE PRECISION NOT NULL,
    "waterContentPct" DOUBLE PRECISION NOT NULL,
    "energyConsumptionKwh" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "environmental_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "states_name_key" ON "states"("name");

-- CreateIndex
CREATE UNIQUE INDEX "states_code_key" ON "states"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_stateId_key" ON "cities"("name", "stateId");

-- CreateIndex
CREATE INDEX "operational_kpis_date_idx" ON "operational_kpis"("date");

-- CreateIndex
CREATE INDEX "operational_kpis_stationId_date_idx" ON "operational_kpis"("stationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "operational_kpis_stationId_date_key" ON "operational_kpis"("stationId", "date");

-- CreateIndex
CREATE INDEX "financial_kpis_date_idx" ON "financial_kpis"("date");

-- CreateIndex
CREATE INDEX "financial_kpis_stationId_date_idx" ON "financial_kpis"("stationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "financial_kpis_stationId_date_key" ON "financial_kpis"("stationId", "date");

-- CreateIndex
CREATE INDEX "productivity_kpis_date_idx" ON "productivity_kpis"("date");

-- CreateIndex
CREATE INDEX "productivity_kpis_stationId_date_idx" ON "productivity_kpis"("stationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "productivity_kpis_stationId_date_key" ON "productivity_kpis"("stationId", "date");

-- CreateIndex
CREATE INDEX "inventory_kpis_date_idx" ON "inventory_kpis"("date");

-- CreateIndex
CREATE INDEX "inventory_kpis_stationId_date_idx" ON "inventory_kpis"("stationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_kpis_stationId_date_key" ON "inventory_kpis"("stationId", "date");

-- CreateIndex
CREATE INDEX "customer_kpis_date_idx" ON "customer_kpis"("date");

-- CreateIndex
CREATE INDEX "customer_kpis_stationId_date_idx" ON "customer_kpis"("stationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "customer_kpis_stationId_date_key" ON "customer_kpis"("stationId", "date");

-- CreateIndex
CREATE INDEX "compliance_kpis_date_idx" ON "compliance_kpis"("date");

-- CreateIndex
CREATE INDEX "compliance_kpis_stationId_date_idx" ON "compliance_kpis"("stationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_kpis_stationId_date_key" ON "compliance_kpis"("stationId", "date");

-- CreateIndex
CREATE INDEX "environmental_kpis_date_idx" ON "environmental_kpis"("date");

-- CreateIndex
CREATE INDEX "environmental_kpis_stationId_date_idx" ON "environmental_kpis"("stationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "environmental_kpis_stationId_date_key" ON "environmental_kpis"("stationId", "date");

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_kpis" ADD CONSTRAINT "operational_kpis_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_kpis" ADD CONSTRAINT "financial_kpis_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productivity_kpis" ADD CONSTRAINT "productivity_kpis_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_kpis" ADD CONSTRAINT "inventory_kpis_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_kpis" ADD CONSTRAINT "customer_kpis_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_kpis" ADD CONSTRAINT "compliance_kpis_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environmental_kpis" ADD CONSTRAINT "environmental_kpis_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
