import axios from "axios";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { enphaseBaseUrl } from "../enphaseConstants";
import {
  ProductionDataResponse,
  ConsumptionDataResponse,
} from "./enphaseEnergyTypes";

const requestProductionData = async (
  accessToken: string,
  solarSystemId: number,
  apiKey: string,
  dayToFetchDate?: Date,
  startAt?: number,
  endAt?: number
) => {
  let url =
    enphaseBaseUrl + "/systems/" + solarSystemId + "/rgm_stats?key=" + apiKey;
  if (startAt) url = url + "&start_at=" + startAt;
  else if (dayToFetchDate)
    url = url + "&start_at=" + dayToFetchDate.getTime() / 1000;
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
  dayToFetchDate?: Date,
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
  else if (dayToFetchDate) {
    const locale = {
      code: "en-US",
      options: {
        timeZone: "Europe/Berlin",
      },
    };
    // we use the french locale to get the date in the format yyyy-MM-dd and consider the enphase target system timezone
    const dateString = format(dayToFetchDate, "yyyy-MM-dd", { locale: fr });
    url = url + "&start_date=" + dateString;
  }

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
