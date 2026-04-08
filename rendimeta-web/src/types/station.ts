export interface StateRecord {
  id: string;
  name: string;
  code: string;
  cityCount?: number;
  stationCount?: number;
}

export interface CityRecord {
  id: string;
  name: string;
  stateId: string;
  state?: StateRecord;
  stationCount?: number;
}

export interface StationRecord {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  postalCode: string;
  cityId: string;
  city?: CityRecord & { state?: StateRecord };
  latitude: number | null;
  longitude: number | null;
  pumpCount: number;
  tankCount: number;
  tankCapacityLiters: number;
  hasConvenienceStore: boolean;
  isActive: boolean;
}

export interface StationSeedData {
  state: string;
  stateCode: string;
  city: string;
  name: string;
  address: string;
  neighborhood: string;
  postalCode: string;
}
