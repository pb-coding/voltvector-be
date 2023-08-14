import axios from "axios";

import { enphaseBaseUrl } from "../enphaseConstants";
import {
  ProductionDataResponse,
  ConsumptionDataResponse,
} from "./enphaseEnergyTypes";
import { access } from "fs";

const requestProductionData = async (
  accessToken: string,
  solarSystemId: number,
  apiKey: string,
  startAt?: number,
  endAt?: number
) => {
  let url =
    enphaseBaseUrl + "/systems/" + solarSystemId + "/rgm_stats?key=" + apiKey;
  if (startAt) url = url + "&start_at=" + startAt;
  if (endAt) url = url + "&end_at=" + endAt;

  const headers = {
    Authorization: "Bearer " + accessToken,
  };

  const response = await axios.get(url, { headers: headers });
  return response.data as ProductionDataResponse;
};

const requestConsumptionData = async (
  accessToken: string,
  solarSystemId: number,
  apiKey: string,
  granularity?: string,
  start_date?: string
) => {
  let url =
    enphaseBaseUrl +
    "/systems/" +
    solarSystemId +
    "/telemetry/consumption_meter?key=" +
    apiKey;
  if (granularity) url = url + "&granularity=" + granularity;
  if (start_date) url = url + "&start_date=" + start_date;

  const headers = {
    Authorization: "Bearer " + accessToken,
  };

  const response = await axios.get(url, { headers: headers });
  return response.data as ConsumptionDataResponse;
};

const enphaseEnergyClient = {
  requestProductionData,
  requestConsumptionData,
};

export default enphaseEnergyClient;
