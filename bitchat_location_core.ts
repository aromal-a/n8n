// Bitchat-style location sharing core (cleaned + runnable TypeScript)
// ---------------------------------------------------------------
// Focus: geohash-based location buckets, delivery-style arrival logic,
// permission handling, neighbor expansion, and update loop.

import geohash from "ngeohash";

// ------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------

type LatLng = {
  lat: number;
  lon: number;
};

type PermissionStatus = "granted" | "denied" | "prompt";

type DeliveryState = {
  arrivalTimeSeconds: number;
  assured: boolean;
};

type GeoContext = {
  geohash: string;
  neighbors: string[];
  precision: number;
};

// ------------------------------------------------------------------
// PERMISSION + SERVER
// ------------------------------------------------------------------

function requestLocationPermission(): PermissionStatus {
  // mockable browser/mobile permission layer
  return "granted";
}

function serverReconnection(): void {
  // placeholder for websocket / realtime reconnect
  console.log("[server] reconnection + refresh status");
}

// ------------------------------------------------------------------
// GEOHASH LOGIC
// ------------------------------------------------------------------

function toGeohash(location: LatLng, precision = 6): GeoContext {
  const hash = geohash.encode(location.lat, location.lon, precision);
  const neighbors = geohash.neighbors(hash);

  return {
    geohash: hash,
    neighbors,
    precision,
  };
}

function reducePrecision(hash: string, reduceBy = 1): string {
  return hash.slice(0, Math.max(1, hash.length - reduceBy));
}

// ------------------------------------------------------------------
// MAP / CORNER EXPANSION
// ------------------------------------------------------------------

function expandCorners(hash: string, depth = 1): string[] {
  let expanded = new Set<string>([hash]);
  let current = [hash];

  for (let i = 0; i < depth; i++) {
    const next: string[] = [];
    current.forEach((h) => {
      geohash.neighbors(h).forEach((n) => {
        if (!expanded.has(n)) {
          expanded.add(n);
          next.push(n);
        }
      });
    });
    current = next;
  }

  return Array.from(expanded);
}

// ------------------------------------------------------------------
// DELIVERY / ARRIVAL LOGIC
// ------------------------------------------------------------------

function computeDeliveryState(arrivalSeconds: number): DeliveryState {
  if (arrivalSeconds < 240) {
    return {
      arrivalTimeSeconds: arrivalSeconds,
      assured: true,
    };
  }

  return {
    arrivalTimeSeconds: arrivalSeconds,
    assured: false,
  };
}

// ------------------------------------------------------------------
// FILTERING + RATE CONTROL
// ------------------------------------------------------------------

function rateFiltering(areaHashes: string[], rate: number): string[] {
  // simple thinning filter
  return areaHashes.filter((_, index) => index % rate === 0);
}

// ------------------------------------------------------------------
// SAFETY / ELIGIBILITY CHECKS
// ------------------------------------------------------------------

function checkEligibility(options: {
  hasHelmet: boolean;
  isMotorEligible: boolean;
}): boolean {
  return options.hasHelmet && options.isMotorEligible;
}

// ------------------------------------------------------------------
// MAIN FLOW
// ------------------------------------------------------------------

export function runBitchatLocationCore(input: {
  location: LatLng;
  postalCode?: number;
  arrivalSeconds: number;
  rateFilter: number;
}) {
  // Permission
  const permission = requestLocationPermission();
  if (permission !== "granted") {
    throw new Error("Location permission not granted");
  }

  // Server sync
  serverReconnection();

  // Geohash context
  const geo = toGeohash(input.location, 7);

  // Reduce noise for fast delivery filtering
  const reduced = reducePrecision(geo.geohash, 1);

  // Expand corners (diagonal + sides)
  const expandedArea = expandCorners(reduced, 2);

  // Apply rate filtering
  const filteredArea = rateFiltering(expandedArea, input.rateFilter);

  // Delivery state
  const delivery = computeDeliveryState(input.arrivalSeconds);

  // Eligibility
  const eligible = checkEligibility({
    hasHelmet: true,
    isMotorEligible: true,
  });

  return {
    geo,
    reducedGeohash: reduced,
    activeArea: filteredArea,
    delivery,
    eligible,
    postalCode: input.postalCode ?? null,
  };
}

// ------------------------------------------------------------------
// EXAMPLE RUN (can be removed in production)
// ------------------------------------------------------------------

const result = runBitchatLocationCore({
  location: { lat: 31.1471, lon: 75.3412 }, // Punjab example
  postalCode: 144001,
  arrivalSeconds: 180,
  rateFilter: 2,
});

console.log("[Bitchat.maps] result", result);
