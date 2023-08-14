export type EnphaseRequestKind = "production" | "consumption";

// enphase production data endpoint
export type ProductionDataResponse = {
  system_id: number;
  total_devices: number;
  intervals: ProductionInterval[];
  meta: ProductionDataMeta;
  meter_intervals: ProductionDataMeterInterval[];
};

export type ProductionInterval = {
  end_at: number;
  devices_reporting: number;
  wh_del: number;
};

type ProductionDataMeta = {
  status: string;
  last_report_at: number;
  last_energy_at: number;
  operational_at: number;
};

type ProductionDataMeterInterval = {
  meter_serial_number: string;
  envoy_serial_number: string;
  intervals: ProductionStatsSpecificMeterInterval;
};

type ProductionStatsSpecificMeterInterval = {
  channel: number;
  wh_del: number;
  curr_w: number;
  end_at: number;
};

// enphase consumption data endpoint
export type ConsumptionDataResponse = {
  system_id: number;
  granularity: string;
  total_devices: number;
  start_date: string;
  end_date: string;
  items: string;
  intervals: ConsumptionInterval[];
  meta: ConsumptionMeta;
};

export type ConsumptionInterval = {
  end_at: number;
  devices_reporting: number;
  enwh: number;
};

type ConsumptionMeta = {
  status: string;
  last_report_at: number;
  last_energy_at: number;
  operational_at: number;
};

// constructed types

export type EnergyData = {
  intervals: EnergyInterval[];
};

export type EnergyInterval = {
  end_at: number;
  production: number;
  consumption: number;
};
