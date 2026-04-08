import type { StationSeedData, KpiCategory } from "@/types";

export const STATES = [
  { name: "Baja California", code: "BC" },
  { name: "Chihuahua", code: "CHIH" },
  { name: "Nayarit", code: "NAY" },
  { name: "Sinaloa", code: "SIN" },
  { name: "Sonora", code: "SON" },
] as const;

export const CHART_COLORS = {
  primary: "#e11d48",
  secondary: "#f97316",
  tertiary: "#eab308",
  success: "#22c55e",
  info: "#3b82f6",
  warning: "#f59e0b",
  danger: "#ef4444",
  neutral: "#6b7280",
  regular: "#3b82f6",
  premium: "#e11d48",
  diesel: "#22c55e",
} as const;

export const CHART_PALETTE = [
  "#e11d48",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

export type NavItem =
  | { href: string; label: string; icon: string; minLevel?: number }
  | { type: "separator"; label?: string; minLevel?: number };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Vista General", icon: "LayoutDashboard" },
  { href: "/operativos", label: "Operativos", icon: "Fuel" },
  { href: "/financieros", label: "Financieros", icon: "DollarSign" },
  { href: "/productividad", label: "Productividad", icon: "TrendingUp" },
  { href: "/inventario", label: "Inventario", icon: "Package" },
  { href: "/clientes", label: "Clientes", icon: "Users" },
  { href: "/cumplimiento", label: "Cumplimiento", icon: "ShieldCheck" },
  { href: "/ambientales", label: "Ambientales", icon: "Leaf" },
  { type: "separator", label: "Análisis" },
  { href: "/estados", label: "Por Estado", icon: "Map" },
  { href: "/estaciones", label: "Por Estación", icon: "MapPin" },
  { href: "/tendencias", label: "Tendencias", icon: "LineChart" },
  { type: "separator", label: "Productividad RH", minLevel: 0 },
  { href: "/rh", label: "RH General", icon: "UserCheck", minLevel: 1 },
  { href: "/rh/empleados", label: "Empleados", icon: "Users", minLevel: 2 },
  { href: "/rh/seguimiento-horario", label: "Seguimiento Horario", icon: "Clock", minLevel: 1 },
  { href: "/rh/planificador", label: "Planificador Diario", icon: "CalendarClock", minLevel: 0 },
  { href: "/rh/leaderboard", label: "Ranking", icon: "Trophy", minLevel: 0 },
  { href: "/rh/comisiones", label: "Comisiones", icon: "Coins", minLevel: 0 },
  { href: "/rh/gamificacion", label: "Gamificación", icon: "Gamepad2", minLevel: 0 },
  { href: "/rh/asistencia", label: "Asistencia", icon: "CalendarDays", minLevel: 2 },
  { href: "/rh/evaluaciones", label: "Evaluaciones", icon: "ClipboardCheck", minLevel: 2 },
  { href: "/rh/analisis-categorias", label: "Por Categoría", icon: "PieChart", minLevel: 2 },
  { href: "/rh/comparativo-estaciones", label: "Comparativo", icon: "BarChart3", minLevel: 3 },
  { href: "/rh/analisis-turnos", label: "Por Turno", icon: "Clock4", minLevel: 2 },
  { type: "separator", label: "Administración", minLevel: 4 },
  { href: "/admin/usuarios", label: "Usuarios", icon: "UserCog", minLevel: 5 },
  { href: "/admin/catalogo", label: "Catálogo", icon: "Package", minLevel: 4 },
  { href: "/admin/cuotas", label: "Cuotas", icon: "Target", minLevel: 4 },
  { href: "/admin/comisiones", label: "Reglas Comisión", icon: "Calculator", minLevel: 4 },
  { href: "/admin/roles", label: "Roles", icon: "Shield", minLevel: 4 },
  { href: "/admin/turnos", label: "Turnos", icon: "Clock", minLevel: 4 },
  { href: "/admin/logros", label: "Logros", icon: "Award", minLevel: 4 },
  { href: "/admin/configuracion", label: "Configuración", icon: "Settings", minLevel: 5 },
];

// HR Performance classifications
export const PERFORMANCE_CLASSIFICATIONS = {
  PREMIUM: { label: "Premium", color: "#eab308", bgClass: "bg-yellow-500", textClass: "text-yellow-700", minPct: 120 },
  PRODUCTIVE: { label: "Productivo", color: "#22c55e", bgClass: "bg-green-500", textClass: "text-green-700", minPct: 90 },
  TRANSITION: { label: "Transición", color: "#f59e0b", bgClass: "bg-amber-500", textClass: "text-amber-700", minPct: 80 },
  NON_PRODUCTIVE: { label: "No Productivo", color: "#ef4444", bgClass: "bg-red-500", textClass: "text-red-700", minPct: 0 },
} as const;

export function getClassification(pct: number) {
  if (pct >= 120) return PERFORMANCE_CLASSIFICATIONS.PREMIUM;
  if (pct >= 90) return PERFORMANCE_CLASSIFICATIONS.PRODUCTIVE;
  if (pct >= 80) return PERFORMANCE_CLASSIFICATIONS.TRANSITION;
  return PERFORMANCE_CLASSIFICATIONS.NON_PRODUCTIVE;
}

export function getTrafficLightColor(pct: number): "green" | "yellow" | "red" {
  if (pct >= 90) return "green";
  if (pct >= 80) return "yellow";
  return "red";
}

export const KPI_CATEGORIES: {
  key: KpiCategory;
  label: string;
  color: string;
}[] = [
  { key: "operational", label: "Operativos", color: "#3b82f6" },
  { key: "financial", label: "Financieros", color: "#22c55e" },
  { key: "productivity", label: "Productividad", color: "#f97316" },
  { key: "inventory", label: "Inventario", color: "#8b5cf6" },
  { key: "customer", label: "Clientes", color: "#ec4899" },
  { key: "compliance", label: "Cumplimiento", color: "#eab308" },
  { key: "environmental", label: "Ambientales", color: "#14b8a6" },
];

export const STATIONS_SEED_DATA: StationSeedData[] = [
  // === BAJA CALIFORNIA - MEXICALI ===
  { state: "Baja California", stateCode: "BC", city: "Mexicali", name: "Rendichicas Lázaro 1", address: "Boulevard Lázaro Cárdenas No. 1498", neighborhood: "Fracc. Villafontana", postalCode: "21180" },
  { state: "Baja California", stateCode: "BC", city: "Mexicali", name: "Rendichicas Cetys", address: "Calz Cetys No. 2599", neighborhood: "Rivera", postalCode: "21259" },
  { state: "Baja California", stateCode: "BC", city: "Mexicali", name: "Rendichicas Isabel", address: "Lázaro Cárdenas No. 599", neighborhood: "Los Viñedos", postalCode: "21190" },
  { state: "Baja California", stateCode: "BC", city: "Mexicali", name: "Rendichicas Lázaro 3", address: "Boulevard Lázaro Cárdenas No. 3144", neighborhood: "Ampliación Villa Verde", postalCode: "21395" },
  { state: "Baja California", stateCode: "BC", city: "Mexicali", name: "Rendichicas Terán", address: "Calz Héctor Terán Terán No. 976", neighborhood: "Camino Viejo", postalCode: "21320" },
  // === BAJA CALIFORNIA - TIJUANA ===
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Calle 7", address: "Constitución No. 1400", neighborhood: "Centro", postalCode: "22000" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Flor", address: "Av Hermenegildo Galeana No. 22703", neighborhood: "Mariano Matamoroso Centro", postalCode: "22625" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas La Mesa", address: "Blvd. Díaz Ordaz No. 625", neighborhood: "La Mesa", postalCode: "22450" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas 20 de Nov", address: "Av. 20 de Noviembre No. 12292", neighborhood: "20 de Noviembre", postalCode: "22100" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas 5 y 10", address: "Gustavo Díaz Ordaz No. 14211", neighborhood: "Contreras Oeste", postalCode: "22460" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas 6193", address: "Av. Águila Real 1 No. 9263", neighborhood: "Lomas de Matamoros 1ra Sección", postalCode: "22500" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas 8070", address: "24 de Diciembre No. 7598", neighborhood: "Mariano Matamoros Norte", postalCode: "22206" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Benítez", address: "Blvd Federico Benítez No. 14808", neighborhood: "Las Flores", postalCode: "22600" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Blvd 2000", address: "Sonora No. 9351", neighborhood: "Ejido Francisco Villa", postalCode: "22235" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Cuarteles", address: "Blvd. Cuauhtémoc Sur No. 9601", neighborhood: "Fracc. Gutiérrez Ovalle", postalCode: "22636" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Cucapah", address: "Cucapah No. 20360", neighborhood: "Buenos Aires Sur", postalCode: "22207" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas El Tigre", address: "Ruta Matamoros No. 7851", neighborhood: "Mariano Matamoros", postalCode: "22234" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Flor 2", address: "Ruta Hidalgo No. 9590", neighborhood: "Mariano Matamoros Sur", postalCode: "22597" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Flores", address: "Nueva Aurora No. 6980", neighborhood: "Nueva Aurora", postalCode: "22604" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Fun", address: "Blvd Fundadores No. 6468", neighborhood: "El Rubí", postalCode: "22626" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Gato Bronco", address: "Gato Bronco No. 3849", neighborhood: "Campestre Murua", postalCode: "22455" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas La V", address: "Libramiento Sur No. 3500", neighborhood: "El Cortez", postalCode: "22000" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Libram", address: "Libramiento Rosas Magallón No. 7280", neighborhood: "Obrera", postalCode: "22180" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Los Pinos", address: "Blvd. Díaz Ordaz No. 17160", neighborhood: "Los Venados Oeste", postalCode: "22690" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Maclovio", address: "Carret. Tijuana-Mexicali Km 29.5", neighborhood: "Rancho Florido Viejo", postalCode: "22254" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Murua", address: "Av. Murua Martínez No. 20005", neighborhood: "Campestre Murua", postalCode: "22590" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Otay", address: "Blvd. Tercera Oeste No. 17646", neighborhood: "Garita de Otay", postalCode: "22430" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Refugio 1", address: "Blvd. El Refugio No. 24131", neighborhood: "Florido 1 Sección", postalCode: "22684" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Refugio 2", address: "Blvd. El Refugio No. 24261", neighborhood: "Florido 1", postalCode: "22244" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas San Agustín", address: "Andador Vecinal No. 9715", neighborhood: "La Gloria Poblado", postalCode: "22645" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Santa Fe", address: "Blvd. El Rosario No. 11000", neighborhood: "San Antonio de Los Buenos", postalCode: "22563" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Soler", address: "Autopista a Playas de Tijuana No. 4431", neighborhood: "Soler", postalCode: "22105" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Tecno", address: "Calzada Tecnológico No. 13277", neighborhood: "Tomas Aquino", postalCode: "22414" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Transpenin", address: "Carr. Libre Tijuana-Ensenada No. 3109", neighborhood: "Playas de Rosarito", postalCode: "22625" },
  { state: "Baja California", stateCode: "BC", city: "Tijuana", name: "Rendichicas Villa", address: "Miguel A Cárdenas No. 12495", neighborhood: "San Luis", postalCode: "22170" },
  // === CHIHUAHUA - CHIHUAHUA ===
  { state: "Chihuahua", stateCode: "CHIH", city: "Chihuahua", name: "Rendichicas A.Lat", address: "Juan Escutia No. 2518", neighborhood: "Miramar", postalCode: "31130" },
  { state: "Chihuahua", stateCode: "CHIH", city: "Chihuahua", name: "Rendichicas Arcad", address: "Heroico Colegio Militar Esq. Agustín Melgar S/N", neighborhood: "Arcadias", postalCode: "31300" },
  { state: "Chihuahua", stateCode: "CHIH", city: "Chihuahua", name: "Rendichicas C.Real", address: "Paseos del Pastizal No. 9416", neighborhood: "Camino Real 2da Etapa", postalCode: "31109" },
  { state: "Chihuahua", stateCode: "CHIH", city: "Chihuahua", name: "Rendichicas Campesina", address: "Av Silvestre Terrazas No. 8835", neighborhood: "Campesina", postalCode: "31410" },
  { state: "Chihuahua", stateCode: "CHIH", city: "Chihuahua", name: "Rendichicas Indust", address: "Avenida Industrias No. 3700", neighborhood: "Nombre de Dios", postalCode: "31105" },
  { state: "Chihuahua", stateCode: "CHIH", city: "Chihuahua", name: "Rendichicas La 46", address: "Calle 46 y Priv de Urquidi y Ocho S/N", neighborhood: "Dale", postalCode: "31203" },
  { state: "Chihuahua", stateCode: "CHIH", city: "Chihuahua", name: "Rendichicas Mares", address: "Blvd Fuentes Mares No. 8401", neighborhood: "Mármol", postalCode: "31063" },
  { state: "Chihuahua", stateCode: "CHIH", city: "Chihuahua", name: "Rendichicas Pablo", address: "Blvd Juan Pablo II No. 9910", neighborhood: "Aeropuerto", postalCode: "31384" },
  { state: "Chihuahua", stateCode: "CHIH", city: "Chihuahua", name: "Rendichicas Pistol", address: "Av Los Arcos No. 601", neighborhood: "José Meneses", postalCode: "31137" },
  { state: "Chihuahua", stateCode: "CHIH", city: "Chihuahua", name: "Rendichicas Nueva", address: "Av. Nueva España No. 1100", neighborhood: "Mármol", postalCode: "31105" },
  // === CHIHUAHUA - MEOQUI ===
  { state: "Chihuahua", stateCode: "CHIH", city: "Meoqui", name: "Rendichicas Meoqui", address: "Aldama No. 89", neighborhood: "Centro", postalCode: "33131" },
  // === NAYARIT - TEPIC ===
  { state: "Nayarit", stateCode: "NAY", city: "Tepic", name: "Rendichicas P Sánchez", address: "Av. Prisciliano Sánchez Nte 47", neighborhood: "Tepic Centro", postalCode: "63000" },
  // === SINALOA - CULIACÁN ===
  { state: "Sinaloa", stateCode: "SIN", city: "Culiacán", name: "Rendichicas Benjamín H", address: "Blvd. Benjamin Hill Sur No. 6105", neighborhood: "Infonavit Barrancos", postalCode: "80189" },
  { state: "Sinaloa", stateCode: "SIN", city: "Culiacán", name: "Rendichicas Bravo", address: "Av. Nicolas Bravo No. 166 Sur", neighborhood: "Almada", postalCode: "80200" },
  { state: "Sinaloa", stateCode: "SIN", city: "Culiacán", name: "Rendichicas Lola Beltrán", address: "Blvd. Lola Beltrán No. 3387 Pte", neighborhood: "Ejido Humaya", postalCode: "80058" },
  { state: "Sinaloa", stateCode: "SIN", city: "Culiacán", name: "Rendichicas Lomas", address: "Av. Manuel J. Clouthier No. 3010", neighborhood: "Lomas del Boulevard", postalCode: "80110" },
  { state: "Sinaloa", stateCode: "SIN", city: "Culiacán", name: "Rendichicas Revolución", address: "Av. Revolución No. 1214", neighborhood: "Guadalupe Victoria", postalCode: "80240" },
  // === SONORA - CIUDAD OBREGÓN ===
  { state: "Sonora", stateCode: "SON", city: "Ciudad Obregón", name: "Rendichicas Michoacán", address: "Michoacán Sur No. 5202", neighborhood: "Luis Echeverría", postalCode: "85190" },
  { state: "Sonora", stateCode: "SON", city: "Ciudad Obregón", name: "Rendichicas Náinari", address: "Av. Nainari No. 915 Pte", neighborhood: "Morelos", postalCode: "85110" },
  { state: "Sonora", stateCode: "SON", city: "Ciudad Obregón", name: "Rendichicas Coahuila", address: "Coahuila No. 1034 Sur", neighborhood: "Campestre", postalCode: "85160" },
  { state: "Sonora", stateCode: "SON", city: "Ciudad Obregón", name: "Rendichicas La 200", address: "Blvd Rodolfo Elias Calles No. 1000 Pte.", neighborhood: "Hidalgo", postalCode: "85140" },
  { state: "Sonora", stateCode: "SON", city: "Ciudad Obregón", name: "Rendichicas Misiones", address: "Jalisco No. 6604", neighborhood: "Cajeme", postalCode: "85098" },
  { state: "Sonora", stateCode: "SON", city: "Ciudad Obregón", name: "Rendichicas Tetabiate", address: "Miguel Alemán No. 675", neighborhood: "Centro", postalCode: "85000" },
  // === SONORA - HERMOSILLO ===
  { state: "Sonora", stateCode: "SON", city: "Hermosillo", name: "Rendichicas Aero", address: "Blvd. García Morales No. 471", neighborhood: "El Llano", postalCode: "83210" },
  { state: "Sonora", stateCode: "SON", city: "Hermosillo", name: "Rendichicas Aeropuerto 2", address: "Blvd G Morales No. 448 A", neighborhood: "El Llano", postalCode: "83210" },
  { state: "Sonora", stateCode: "SON", city: "Hermosillo", name: "Rendichicas Nayarit 2", address: "Nayarit No. 113", neighborhood: "San Benito", postalCode: "83190" },
  { state: "Sonora", stateCode: "SON", city: "Hermosillo", name: "Rendichicas Nayarit", address: "Av. Nayarit No. 325", neighborhood: "Olivares", postalCode: "83180" },
  { state: "Sonora", stateCode: "SON", city: "Hermosillo", name: "Rendichicas Perinorte 1", address: "Periférico Norte No. 1", neighborhood: "Jesús García", postalCode: "83140" },
  { state: "Sonora", stateCode: "SON", city: "Hermosillo", name: "Rendichicas Perinorte", address: "Periférico Norte No. 214", neighborhood: "Balderrama", postalCode: "83180" },
  { state: "Sonora", stateCode: "SON", city: "Hermosillo", name: "Rendichicas Reforma", address: "Reforma y Aguascalientes No. 79", neighborhood: "San Benito", postalCode: "83190" },
  { state: "Sonora", stateCode: "SON", city: "Hermosillo", name: "Rendichicas Salazar", address: "Blvd. Ignacio Salazar No. 756", neighborhood: "Fracc. Misión San Jerónimo", postalCode: "83127" },
  // === SONORA - NAVOJOA ===
  { state: "Sonora", stateCode: "SON", city: "Navojoa", name: "Rendichicas Villas", address: "Blvd Rodolfo Elias Calles No. 2550", neighborhood: "Del Lago", postalCode: "85800" },
];
