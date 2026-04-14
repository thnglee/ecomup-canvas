import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Topology, GeometryCollection } from "topojson-specification";
import { feature } from "topojson-client";
import countries110 from "world-atlas/countries-110m.json";
import usStates from "us-atlas/states-10m.json";

// ---------- World countries ----------

export interface CountryFeature extends Feature<Geometry> {
  id: string;
  properties: { name: string };
}

const countriesTopo = countries110 as unknown as Topology;
const countriesGeo = feature(
  countriesTopo,
  countriesTopo.objects.countries as GeometryCollection
) as unknown as FeatureCollection<Geometry, { name: string }>;

export const WORLD_COUNTRIES: CountryFeature[] =
  countriesGeo.features.map((f) => ({
    ...f,
    id: String(f.id).padStart(3, "0"),
  })) as CountryFeature[];

// ---------- US states ----------

export interface StateFeature extends Feature<Geometry> {
  id: string;
  properties: { name: string };
}

const usTopo = usStates as unknown as Topology;
const usGeo = feature(
  usTopo,
  usTopo.objects.states as GeometryCollection
) as unknown as FeatureCollection<Geometry, { name: string }>;

export const US_STATES: StateFeature[] = usGeo.features.map((f) => ({
  ...f,
  id: String(f.id),
})) as StateFeature[];

// US state FIPS → IANA timezone
// Covers the predominant zone; slivers (IN, KY, TN, FL, ND, SD, NE, KS, ID, OR, MI) simplified
export const US_STATE_TZ: Record<string, string> = {
  "01": "America/Chicago",        // Alabama
  "02": "America/Anchorage",      // Alaska
  "04": "America/Phoenix",        // Arizona
  "05": "America/Chicago",        // Arkansas
  "06": "America/Los_Angeles",    // California
  "08": "America/Denver",         // Colorado
  "09": "America/New_York",       // Connecticut
  "10": "America/New_York",       // Delaware
  "11": "America/New_York",       // DC
  "12": "America/New_York",       // Florida
  "13": "America/New_York",       // Georgia
  "15": "Pacific/Honolulu",       // Hawaii
  "16": "America/Denver",         // Idaho
  "17": "America/Chicago",        // Illinois
  "18": "America/New_York",       // Indiana
  "19": "America/Chicago",        // Iowa
  "20": "America/Chicago",        // Kansas
  "21": "America/New_York",       // Kentucky
  "22": "America/Chicago",        // Louisiana
  "23": "America/New_York",       // Maine
  "24": "America/New_York",       // Maryland
  "25": "America/New_York",       // Massachusetts
  "26": "America/New_York",       // Michigan
  "27": "America/Chicago",        // Minnesota
  "28": "America/Chicago",        // Mississippi
  "29": "America/Chicago",        // Missouri
  "30": "America/Denver",         // Montana
  "31": "America/Chicago",        // Nebraska
  "32": "America/Los_Angeles",    // Nevada
  "33": "America/New_York",       // New Hampshire
  "34": "America/New_York",       // New Jersey
  "35": "America/Denver",         // New Mexico
  "36": "America/New_York",       // New York
  "37": "America/New_York",       // North Carolina
  "38": "America/Chicago",        // North Dakota
  "39": "America/New_York",       // Ohio
  "40": "America/Chicago",        // Oklahoma
  "41": "America/Los_Angeles",    // Oregon
  "42": "America/New_York",       // Pennsylvania
  "44": "America/New_York",       // Rhode Island
  "45": "America/New_York",       // South Carolina
  "46": "America/Chicago",        // South Dakota
  "47": "America/New_York",       // Tennessee
  "48": "America/Chicago",        // Texas
  "49": "America/Denver",         // Utah
  "50": "America/New_York",       // Vermont
  "51": "America/New_York",       // Virginia
  "53": "America/Los_Angeles",    // Washington
  "54": "America/New_York",       // West Virginia
  "55": "America/Chicago",        // Wisconsin
  "56": "America/Denver",         // Wyoming
};

// ---------- Lazy subdivision loaders (CA, AU) ----------

type NamedFeatureCollection = FeatureCollection<Geometry, { name: string }>;

let canadaCache: NamedFeatureCollection | null = null;
let australiaCache: NamedFeatureCollection | null = null;

const CA_URL =
  "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/canada.geojson";
const AU_URL =
  "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/australia.geojson";

export async function loadCanadaProvinces(): Promise<NamedFeatureCollection> {
  if (canadaCache) return canadaCache;
  const res = await fetch(CA_URL);
  canadaCache = (await res.json()) as NamedFeatureCollection;
  return canadaCache;
}

export async function loadAustraliaStates(): Promise<NamedFeatureCollection> {
  if (australiaCache) return australiaCache;
  const res = await fetch(AU_URL);
  australiaCache = (await res.json()) as NamedFeatureCollection;
  return australiaCache;
}

// Province name (as in click_that_hood) → IANA timezone
export const CA_PROVINCE_TZ: Record<string, string> = {
  "Newfoundland and Labrador": "America/St_Johns",
  "Nova Scotia": "America/Halifax",
  "New Brunswick": "America/Halifax",
  "Prince Edward Island": "America/Halifax",
  "Quebec": "America/Toronto",
  "Québec": "America/Toronto",
  "Ontario": "America/Toronto",
  "Manitoba": "America/Winnipeg",
  "Saskatchewan": "America/Regina",
  "Alberta": "America/Edmonton",
  "British Columbia": "America/Vancouver",
  "Yukon": "America/Whitehorse",
  "Northwest Territories": "America/Yellowknife",
  "Nunavut": "America/Iqaluit",
};

export const AU_STATE_TZ: Record<string, string> = {
  "Western Australia": "Australia/Perth",
  "Northern Territory": "Australia/Darwin",
  "South Australia": "Australia/Adelaide",
  "Queensland": "Australia/Brisbane",
  "New South Wales": "Australia/Sydney",
  "Australian Capital Territory": "Australia/Sydney",
  "Victoria": "Australia/Melbourne",
  "Tasmania": "Australia/Hobart",
  "Jervis Bay Territory": "Australia/Sydney",
};

// ---------- Country ISO → scoring key in timelineScoring ----------

export const ISO_TO_COUNTRY: Record<string, string> = {
  "704": "Vietnam",
  "826": "UK",
  "840": "US",
  "036": "Australia",
  "124": "Canada",
  "554": "NZ",
  "276": "Germany",
};
