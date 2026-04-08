import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Real approximate coordinates per station based on neighborhood/address
// Tijuana stations georeferenced to actual neighborhoods
const STATION_COORDS: Record<string, { lat: number; lng: number }> = {
  // === TIJUANA ===
  "Rendichicas Calle 7": { lat: 32.5270, lng: -117.0330 },           // Centro
  "Rendichicas Flor": { lat: 32.4960, lng: -117.0200 },              // Mariano Matamoros Centro
  "Rendichicas La Mesa": { lat: 32.5120, lng: -117.0180 },           // La Mesa
  "Rendichicas 20 de Nov": { lat: 32.5180, lng: -117.0650 },         // 20 de Noviembre
  "Rendichicas 5 y 10": { lat: 32.5050, lng: -117.0280 },            // Contreras Oeste
  "Rendichicas 6193": { lat: 32.4880, lng: -117.0380 },              // Lomas de Matamoros
  "Rendichicas 8070": { lat: 32.5000, lng: -117.0100 },              // Mariano Matamoros Norte
  "Rendichicas Benítez": { lat: 32.5150, lng: -117.0550 },           // Las Flores
  "Rendichicas Blvd 2000": { lat: 32.5040, lng: -117.0450 },         // Ejido Francisco Villa
  "Rendichicas Cuarteles": { lat: 32.4920, lng: -117.0630 },         // Gutiérrez Ovalle
  "Rendichicas Cucapah": { lat: 32.4800, lng: -117.0150 },           // Buenos Aires Sur
  "Rendichicas El Tigre": { lat: 32.4930, lng: -117.0050 },          // Mariano Matamoros
  "Rendichicas Flor 2": { lat: 32.4890, lng: -117.0250 },            // Mariano Matamoros Sur
  "Rendichicas Flores": { lat: 32.5080, lng: -117.0500 },            // Nueva Aurora
  "Rendichicas Fun": { lat: 32.5060, lng: -117.0700 },               // El Rubí
  "Rendichicas Gato Bronco": { lat: 32.5020, lng: -117.0400 },       // Campestre Murua
  "Rendichicas La V": { lat: 32.5200, lng: -117.0800 },              // El Cortez / Libramiento Sur
  "Rendichicas Libram": { lat: 32.5100, lng: -117.0580 },            // Obrera / Rosas Magallón
  "Rendichicas Los Pinos": { lat: 32.4950, lng: -117.0730 },         // Los Venados Oeste
  "Rendichicas Maclovio": { lat: 32.4700, lng: -116.9500 },          // Rancho Florido - carretera a Mexicali
  "Rendichicas Murua": { lat: 32.4980, lng: -117.0420 },             // Campestre Murua
  "Rendichicas Otay": { lat: 32.5350, lng: -117.0250 },              // Garita de Otay
  "Rendichicas Refugio 1": { lat: 32.4650, lng: -116.9600 },         // Florido 1 Sección - zona este
  "Rendichicas Refugio 2": { lat: 32.4670, lng: -116.9570 },         // Florido 1 - zona este
  "Rendichicas San Agustín": { lat: 32.4750, lng: -117.0000 },       // La Gloria Poblado
  "Rendichicas Santa Fe": { lat: 32.3700, lng: -117.0700 },          // San Antonio de Los Buenos - sur de TJ
  "Rendichicas Soler": { lat: 32.4850, lng: -117.1200 },             // Soler - zona Playas de Tijuana
  "Rendichicas Tecno": { lat: 32.5250, lng: -117.0100 },             // Tomas Aquino / Calz Tecnológico
  "Rendichicas Transpenin": { lat: 32.3600, lng: -117.0580 },        // Playas de Rosarito - sur
  "Rendichicas Villa": { lat: 32.5130, lng: -117.0350 },             // San Luis

  // === MEXICALI ===
  "Rendichicas Lázaro 1": { lat: 32.6200, lng: -115.4350 },          // Villafontana
  "Rendichicas Cetys": { lat: 32.6320, lng: -115.4520 },             // Rivera / CETYS
  "Rendichicas Isabel": { lat: 32.6250, lng: -115.4600 },            // Los Viñedos
  "Rendichicas Lázaro 3": { lat: 32.6150, lng: -115.4700 },          // Ampliación Villa Verde
  "Rendichicas Terán": { lat: 32.6100, lng: -115.4400 },             // Camino Viejo / Héctor Terán

  // === CHIHUAHUA ===
  "Rendichicas A.Lat": { lat: 28.6350, lng: -106.1050 },             // Miramar
  "Rendichicas Arcad": { lat: 28.6100, lng: -106.0850 },             // Arcadias
  "Rendichicas C.Real": { lat: 28.6550, lng: -106.1200 },            // Camino Real
  "Rendichicas Campesina": { lat: 28.6700, lng: -106.0700 },         // Campesina
  "Rendichicas Indust": { lat: 28.6450, lng: -106.1300 },            // Nombre de Dios
  "Rendichicas La 46": { lat: 28.6200, lng: -106.0800 },             // Dale
  "Rendichicas Mares": { lat: 28.6600, lng: -106.1100 },             // Mármol / Fuentes Mares
  "Rendichicas Pablo": { lat: 28.6500, lng: -106.0500 },             // Aeropuerto
  "Rendichicas Pistol": { lat: 28.6300, lng: -106.1000 },            // José Meneses
  "Rendichicas Nueva": { lat: 28.6400, lng: -106.1150 },             // Mármol / Nueva España

  // === MEOQUI ===
  "Rendichicas Meoqui": { lat: 28.2720, lng: -105.4820 },            // Centro

  // === TEPIC ===
  "Rendichicas P Sánchez": { lat: 21.5040, lng: -104.8950 },         // Tepic Centro

  // === CULIACÁN ===
  "Rendichicas Benjamín H": { lat: 24.7700, lng: -107.3800 },        // Infonavit Barrancos
  "Rendichicas Bravo": { lat: 24.8050, lng: -107.3900 },             // Almada
  "Rendichicas Lola Beltrán": { lat: 24.8100, lng: -107.4200 },      // Ejido Humaya
  "Rendichicas Lomas": { lat: 24.7900, lng: -107.4100 },             // Lomas del Boulevard
  "Rendichicas Revolución": { lat: 24.8000, lng: -107.3700 },        // Guadalupe Victoria

  // === CIUDAD OBREGÓN ===
  "Rendichicas Michoacán": { lat: 27.4650, lng: -109.9350 },         // Luis Echeverría
  "Rendichicas Náinari": { lat: 27.4900, lng: -109.9500 },           // Morelos
  "Rendichicas Coahuila": { lat: 27.4800, lng: -109.9400 },          // Campestre
  "Rendichicas La 200": { lat: 27.4950, lng: -109.9600 },            // Hidalgo
  "Rendichicas Misiones": { lat: 27.4700, lng: -109.9200 },          // Cajeme
  "Rendichicas Tetabiate": { lat: 27.4850, lng: -109.9450 },         // Centro

  // === HERMOSILLO ===
  "Rendichicas Aero": { lat: 29.1050, lng: -110.9700 },              // El Llano / García Morales
  "Rendichicas Aeropuerto 2": { lat: 29.1020, lng: -110.9650 },      // El Llano
  "Rendichicas Nayarit 2": { lat: 29.0650, lng: -110.9550 },         // San Benito
  "Rendichicas Nayarit": { lat: 29.0700, lng: -110.9600 },           // Olivares
  "Rendichicas Perinorte 1": { lat: 29.0850, lng: -110.9800 },       // Jesús García
  "Rendichicas Perinorte": { lat: 29.0800, lng: -110.9750 },         // Balderrama
  "Rendichicas Reforma": { lat: 29.0680, lng: -110.9500 },           // San Benito
  "Rendichicas Salazar": { lat: 29.0550, lng: -110.9400 },           // Misión San Jerónimo

  // === NAVOJOA ===
  "Rendichicas Villas": { lat: 27.0710, lng: -109.4430 },            // Del Lago
};

async function main() {
  const stations = await prisma.station.findMany();
  let updated = 0;
  let notFound = 0;

  for (const station of stations) {
    const coords = STATION_COORDS[station.name];
    if (!coords) {
      console.warn(`No coords mapping for: ${station.name}`);
      notFound++;
      continue;
    }

    await prisma.station.update({
      where: { id: station.id },
      data: {
        latitude: coords.lat,
        longitude: coords.lng,
      },
    });
    updated++;
  }

  console.log(`Updated: ${updated}, Not found: ${notFound}`);

  // Verify Tijuana stations
  const tjStations = await prisma.station.findMany({
    where: { city: { name: "Tijuana" } },
    orderBy: { name: "asc" },
  });
  console.log("\n=== Tijuana verification ===");
  for (const s of tjStations) {
    const inMexico = s.latitude! < 32.54;
    console.log(`  ${inMexico ? "OK" : "!!"}  ${s.latitude}, ${s.longitude}  ${s.name}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
