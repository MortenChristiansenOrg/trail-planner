/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as catalogData from "../catalogData.js";
import type * as catalogValidators from "../catalogValidators.js";
import type * as crons from "../crons.js";
import type * as destinations from "../destinations.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as ingest_importAirports from "../ingest/importAirports.js";
import type * as ingest_importDestinations from "../ingest/importDestinations.js";
import type * as ingest_importHikes from "../ingest/importHikes.js";
import type * as ingest_refreshTravelEstimates from "../ingest/refreshTravelEstimates.js";
import type * as internal_costModel from "../internal/costModel.js";
import type * as internal_geo from "../internal/geo.js";
import type * as internal_provenance from "../internal/provenance.js";
import type * as internal_readModels from "../internal/readModels.js";
import type * as internal_scoring from "../internal/scoring.js";
import type * as providers_amadeus from "../providers/amadeus.js";
import type * as providers_entur from "../providers/entur.js";
import type * as providers_exchangeRates from "../providers/exchangeRates.js";
import type * as providers_manualSources from "../providers/manualSources.js";
import type * as providers_openMeteo from "../providers/openMeteo.js";
import type * as providers_ourAirports from "../providers/ourAirports.js";
import type * as providers_overpass from "../providers/overpass.js";
import type * as shareLinks from "../shareLinks.js";
import type * as travelEstimates from "../travelEstimates.js";
import type * as trips from "../trips.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  catalogData: typeof catalogData;
  catalogValidators: typeof catalogValidators;
  crons: typeof crons;
  destinations: typeof destinations;
  files: typeof files;
  http: typeof http;
  "ingest/importAirports": typeof ingest_importAirports;
  "ingest/importDestinations": typeof ingest_importDestinations;
  "ingest/importHikes": typeof ingest_importHikes;
  "ingest/refreshTravelEstimates": typeof ingest_refreshTravelEstimates;
  "internal/costModel": typeof internal_costModel;
  "internal/geo": typeof internal_geo;
  "internal/provenance": typeof internal_provenance;
  "internal/readModels": typeof internal_readModels;
  "internal/scoring": typeof internal_scoring;
  "providers/amadeus": typeof providers_amadeus;
  "providers/entur": typeof providers_entur;
  "providers/exchangeRates": typeof providers_exchangeRates;
  "providers/manualSources": typeof providers_manualSources;
  "providers/openMeteo": typeof providers_openMeteo;
  "providers/ourAirports": typeof providers_ourAirports;
  "providers/overpass": typeof providers_overpass;
  shareLinks: typeof shareLinks;
  travelEstimates: typeof travelEstimates;
  trips: typeof trips;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
