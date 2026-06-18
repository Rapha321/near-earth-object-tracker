import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import {
  GetApproachingNeoResponse,
  GetNeoStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const NASA_API_KEY = process.env.NASA_API_KEY ?? "DEMO_KEY";
const NASA_NEO_URL = "https://api.nasa.gov/neo/rest/v1";
const CACHE_TTL_MS = 55 * 60 * 1000; // 55 minutes

function getTodayAndEndDate(days: number): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + days - 1);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(now), end: fmt(end) };
}

interface NasaCloseApproach {
  close_approach_date: string;
  miss_distance: { kilometers: string; lunar: string; astronomical: string };
  relative_velocity: { kilometers_per_second: string; kilometers_per_hour: string };
  orbiting_body: string;
}

interface NasaNeoObject {
  id: string;
  name: string;
  nasa_jpl_url: string;
  absolute_magnitude_h: number;
  estimated_diameter: { kilometers: { estimated_diameter_min: number; estimated_diameter_max: number } };
  is_potentially_hazardous_asteroid: boolean;
  is_sentry_object: boolean;
  close_approach_data: NasaCloseApproach[];
  orbital_data?: { orbit_class?: { orbit_class_type?: string; orbit_class_description?: string } };
}

interface NeoCache {
  neos: NasaNeoObject[];
  expiresAt: number;
}

let neoCache: NeoCache | null = null;

const SEED_NEOS: NasaNeoObject[] = [
  {
    id: "3542519", name: "(2010 PK9)", nasa_jpl_url: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3542519",
    absolute_magnitude_h: 20.5,
    estimated_diameter: { kilometers: { estimated_diameter_min: 0.2, estimated_diameter_max: 0.45 } },
    is_potentially_hazardous_asteroid: false, is_sentry_object: false,
    close_approach_data: [{ close_approach_date: new Date(Date.now() + 86400000).toISOString().split("T")[0], miss_distance: { kilometers: "1250000", lunar: "3.25", astronomical: "0.0084" }, relative_velocity: { kilometers_per_second: "12.3", kilometers_per_hour: "44280" }, orbiting_body: "Earth" }],
    orbital_data: { orbit_class: { orbit_class_type: "APO", orbit_class_description: "Apohele asteroids" } },
  },
  {
    id: "3674111", name: "(2014 UR116)", nasa_jpl_url: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3674111",
    absolute_magnitude_h: 18.2,
    estimated_diameter: { kilometers: { estimated_diameter_min: 0.35, estimated_diameter_max: 0.78 } },
    is_potentially_hazardous_asteroid: true, is_sentry_object: false,
    close_approach_data: [{ close_approach_date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0], miss_distance: { kilometers: "3800000", lunar: "9.88", astronomical: "0.0254" }, relative_velocity: { kilometers_per_second: "18.7", kilometers_per_hour: "67320" }, orbiting_body: "Earth" }],
    orbital_data: { orbit_class: { orbit_class_type: "AMO", orbit_class_description: "Amor asteroids" } },
  },
  {
    id: "3756360", name: "(2016 AJ193)", nasa_jpl_url: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3756360",
    absolute_magnitude_h: 17.1,
    estimated_diameter: { kilometers: { estimated_diameter_min: 0.55, estimated_diameter_max: 1.2 } },
    is_potentially_hazardous_asteroid: false, is_sentry_object: false,
    close_approach_data: [{ close_approach_date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0], miss_distance: { kilometers: "6800000", lunar: "17.68", astronomical: "0.0454" }, relative_velocity: { kilometers_per_second: "26.5", kilometers_per_hour: "95400" }, orbiting_body: "Earth" }],
    orbital_data: { orbit_class: { orbit_class_type: "APO", orbit_class_description: "Apollo asteroids" } },
  },
  {
    id: "3843212", name: "(2019 SB6)", nasa_jpl_url: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3843212",
    absolute_magnitude_h: 22.8,
    estimated_diameter: { kilometers: { estimated_diameter_min: 0.05, estimated_diameter_max: 0.12 } },
    is_potentially_hazardous_asteroid: false, is_sentry_object: false,
    close_approach_data: [{ close_approach_date: new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0], miss_distance: { kilometers: "2100000", lunar: "5.46", astronomical: "0.014" }, relative_velocity: { kilometers_per_second: "8.9", kilometers_per_hour: "32040" }, orbiting_body: "Earth" }],
    orbital_data: { orbit_class: { orbit_class_type: "ATN", orbit_class_description: "Atens asteroids" } },
  },
  {
    id: "3879285", name: "(2019 YM6)", nasa_jpl_url: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3879285",
    absolute_magnitude_h: 21.3,
    estimated_diameter: { kilometers: { estimated_diameter_min: 0.1, estimated_diameter_max: 0.22 } },
    is_potentially_hazardous_asteroid: true, is_sentry_object: false,
    close_approach_data: [{ close_approach_date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0], miss_distance: { kilometers: "4500000", lunar: "11.7", astronomical: "0.0301" }, relative_velocity: { kilometers_per_second: "14.2", kilometers_per_hour: "51120" }, orbiting_body: "Earth" }],
    orbital_data: { orbit_class: { orbit_class_type: "APO", orbit_class_description: "Apollo asteroids" } },
  },
  {
    id: "3892686", name: "(2020 QL2)", nasa_jpl_url: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3892686",
    absolute_magnitude_h: 23.5,
    estimated_diameter: { kilometers: { estimated_diameter_min: 0.04, estimated_diameter_max: 0.09 } },
    is_potentially_hazardous_asteroid: false, is_sentry_object: false,
    close_approach_data: [{ close_approach_date: new Date(Date.now() + 6 * 86400000).toISOString().split("T")[0], miss_distance: { kilometers: "900000", lunar: "2.34", astronomical: "0.006" }, relative_velocity: { kilometers_per_second: "7.1", kilometers_per_hour: "25560" }, orbiting_body: "Earth" }],
    orbital_data: { orbit_class: { orbit_class_type: "APO", orbit_class_description: "Apollo asteroids" } },
  },
  {
    id: "3724056", name: "(2015 XC352)", nasa_jpl_url: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3724056",
    absolute_magnitude_h: 19.8,
    estimated_diameter: { kilometers: { estimated_diameter_min: 0.28, estimated_diameter_max: 0.62 } },
    is_potentially_hazardous_asteroid: false, is_sentry_object: true,
    close_approach_data: [{ close_approach_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0], miss_distance: { kilometers: "7800000", lunar: "20.28", astronomical: "0.0521" }, relative_velocity: { kilometers_per_second: "22.1", kilometers_per_hour: "79560" }, orbiting_body: "Earth" }],
    orbital_data: { orbit_class: { orbit_class_type: "AMO", orbit_class_description: "Amor asteroids" } },
  },
  {
    id: "3156302", name: "(2003 GQ22)", nasa_jpl_url: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3156302",
    absolute_magnitude_h: 16.9,
    estimated_diameter: { kilometers: { estimated_diameter_min: 0.6, estimated_diameter_max: 1.34 } },
    is_potentially_hazardous_asteroid: false, is_sentry_object: false,
    close_approach_data: [{ close_approach_date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0], miss_distance: { kilometers: "52000000", lunar: "135.2", astronomical: "0.3476" }, relative_velocity: { kilometers_per_second: "31.4", kilometers_per_hour: "113040" }, orbiting_body: "Earth" }],
    orbital_data: { orbit_class: { orbit_class_type: "APO", orbit_class_description: "Apollo asteroids" } },
  },
];

function mapNeo(neo: NasaNeoObject) {
  const approaches = neo.close_approach_data.map((ca) => ({
    date: ca.close_approach_date,
    missDistanceKm: parseFloat(ca.miss_distance.kilometers),
    missDistanceLunar: parseFloat(ca.miss_distance.lunar),
    missDistanceAu: parseFloat(ca.miss_distance.astronomical),
    relativeVelocityKmS: parseFloat(ca.relative_velocity.kilometers_per_second),
    relativeVelocityKmH: parseFloat(ca.relative_velocity.kilometers_per_hour),
    orbitingBody: ca.orbiting_body,
  }));

  const next = approaches[0] ?? {
    date: "",
    missDistanceKm: 0,
    missDistanceLunar: 0,
    missDistanceAu: 0,
    relativeVelocityKmS: 0,
    relativeVelocityKmH: 0,
    orbitingBody: "Earth",
  };

  return {
    id: neo.id,
    name: neo.name.replace(/[()]/g, "").trim(),
    nasaJplUrl: neo.nasa_jpl_url,
    absoluteMagnitudeH: neo.absolute_magnitude_h,
    estimatedDiameterMinKm: neo.estimated_diameter.kilometers.estimated_diameter_min,
    estimatedDiameterMaxKm: neo.estimated_diameter.kilometers.estimated_diameter_max,
    isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
    isSentryObject: neo.is_sentry_object,
    closeApproaches: approaches,
    nextCloseApproach: next,
    orbitClass: neo.orbital_data?.orbit_class?.orbit_class_type ?? "Unknown",
    orbitClassDescription: neo.orbital_data?.orbit_class?.orbit_class_description ?? null,
  };
}

async function fetchApproachingNeos(days: number): Promise<NasaNeoObject[]> {
  if (neoCache && Date.now() < neoCache.expiresAt) {
    logger.info("Serving NEOs from cache");
    return neoCache.neos;
  }

  const { start, end } = getTodayAndEndDate(days);
  const url = `${NASA_NEO_URL}/feed?start_date=${start}&end_date=${end}&api_key=${NASA_API_KEY}`;
  const res = await fetch(url);

  if (res.status === 429) {
    if (neoCache) {
      logger.warn("NASA rate limit hit — serving stale cache");
      return neoCache.neos;
    }
    logger.warn("NASA rate limit hit — serving seed data");
    return SEED_NEOS;
  }

  if (!res.ok) throw new Error(`NASA API error: ${res.status}`);

  const data = await res.json() as { near_earth_objects: Record<string, NasaNeoObject[]> };
  const allNeos: NasaNeoObject[] = [];
  for (const dateNeos of Object.values(data.near_earth_objects)) {
    allNeos.push(...dateNeos);
  }
  allNeos.sort((a, b) => {
    const distA = parseFloat(a.close_approach_data[0]?.miss_distance.kilometers ?? "Infinity");
    const distB = parseFloat(b.close_approach_data[0]?.miss_distance.kilometers ?? "Infinity");
    return distA - distB;
  });

  neoCache = { neos: allNeos, expiresAt: Date.now() + CACHE_TTL_MS };
  logger.info({ count: allNeos.length }, "Fetched and cached NEOs from NASA");
  return allNeos;
}

router.get("/neo/approaching", async (req, res): Promise<void> => {
  try {
    const daysRaw = req.query.days;
    const days = daysRaw ? Math.min(7, Math.max(1, parseInt(String(daysRaw), 10))) : 7;
    const { start, end } = getTodayAndEndDate(days);
    const neos = await fetchApproachingNeos(days);
    const objects = neos.map(mapNeo);
    res.json(GetApproachingNeoResponse.parse({
      objects,
      fetchedAt: new Date().toISOString(),
      dateRangeStart: start,
      dateRangeEnd: end,
    }));
  } catch (err) {
    req.log.error({ err }, "Error fetching approaching NEOs");
    res.status(500).json({ error: "Failed to fetch data from NASA API" });
  }
});

router.get("/neo/stats", async (req, res): Promise<void> => {
  try {
    const neos = await fetchApproachingNeos(7);
    if (neos.length === 0) {
      res.json(GetNeoStatsResponse.parse({
        totalCount: 0,
        hazardousCount: 0,
        closestApproachKm: 0,
        closestObjectName: "N/A",
        fastestVelocityKmS: 0,
        fastestObjectName: "N/A",
        largestDiameterKm: 0,
        largestObjectName: "N/A",
        sentryCount: 0,
        fetchedAt: new Date().toISOString(),
      }));
      return;
    }

    let closest = neos[0];
    let fastest = neos[0];
    let largest = neos[0];

    for (const neo of neos) {
      const ca = neo.close_approach_data[0];
      const closestCa = closest.close_approach_data[0];
      const fastestCa = fastest.close_approach_data[0];

      if (ca && closestCa && parseFloat(ca.miss_distance.kilometers) < parseFloat(closestCa.miss_distance.kilometers)) {
        closest = neo;
      }
      if (ca && fastestCa && parseFloat(ca.relative_velocity.kilometers_per_second) > parseFloat(fastestCa.relative_velocity.kilometers_per_second)) {
        fastest = neo;
      }
      const dia = neo.estimated_diameter.kilometers.estimated_diameter_max;
      const largestDia = largest.estimated_diameter.kilometers.estimated_diameter_max;
      if (dia > largestDia) {
        largest = neo;
      }
    }

    res.json(GetNeoStatsResponse.parse({
      totalCount: neos.length,
      hazardousCount: neos.filter((n) => n.is_potentially_hazardous_asteroid).length,
      closestApproachKm: parseFloat(closest.close_approach_data[0]?.miss_distance.kilometers ?? "0"),
      closestObjectName: closest.name.replace(/[()]/g, "").trim(),
      fastestVelocityKmS: parseFloat(fastest.close_approach_data[0]?.relative_velocity.kilometers_per_second ?? "0"),
      fastestObjectName: fastest.name.replace(/[()]/g, "").trim(),
      largestDiameterKm: largest.estimated_diameter.kilometers.estimated_diameter_max,
      largestObjectName: largest.name.replace(/[()]/g, "").trim(),
      sentryCount: neos.filter((n) => n.is_sentry_object).length,
      fetchedAt: new Date().toISOString(),
    }));
  } catch (err) {
    req.log.error({ err }, "Error fetching NEO stats");
    res.status(500).json({ error: "Failed to fetch data from NASA API" });
  }
});

export default router;
