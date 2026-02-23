// =====================================================
// SAFETY ENVELOPE CONTAINER (Paste-ready, Working)
// File: safetyEnvelope.ts
// =====================================================

import geohash from "ngeohash";

// -----------------------------
// TYPES
// -----------------------------

export type LatLng = {
  lat: number;
  lon: number;
};

export type AltitudeBand = [number, number]; // meters

export type EnvelopeState = "clear" | "occupied" | "restricted";

export type SafetyEnvelope = {
  geohash: string;
  altitudeBand: AltitudeBand;
  state: EnvelopeState;
  lastUpdated: number;
};

export type EnvelopeInput = {
  lat: number;
  lon: number;
  altitudeMeters: number;
  presenceDetected: boolean;
  restrictedZone?: boolean;
};

// -----------------------------
// GEOHASH HELPERS
// -----------------------------

function encodeLocation(
  lat: number,
  lon: number,
  precision: number = 7 // ~150m blocks
): string {
  return geohash.encode(lat, lon, precision);
}

function expandNeighbors(hash: string): string[] {
  return [hash, ...Object.values(geohash.neighbors(hash))];
}

// -----------------------------
// SAFETY ENVELOPE CONTAINER
// -----------------------------

export class SafetyEnvelopeContainer {
  private envelopes: Map<string, SafetyEnvelope> = new Map();

  constructor(
    private bandSizeMeters: number = 20,
    private geohashPrecision: number = 7
  ) {}

  // -----------------------------
  // INTERNAL HELPERS
  // -----------------------------

  private computeAltitudeBand(altitude: number): AltitudeBand {
    const base =
      Math.floor(altitude / this.bandSizeMeters) * this.bandSizeMeters;
    return [base, base + this.bandSizeMeters];
  }

  private envelopeKey(geohash: string, band: AltitudeBand): string {
    return `${geohash}:${band[0]}-${band[1]}`;
  }

  // -----------------------------
  // CORE UPDATE (location → blocks)
  // -----------------------------

  update(input: EnvelopeInput): SafetyEnvelope[] {
    const hash = encodeLocation(
      input.lat,
      input.lon,
      this.geohashPrecision
    );

    // block + neighbor blocks (route continuity)
    const hashes = expandNeighbors(hash);
    const band = this.computeAltitudeBand(input.altitudeMeters);

    let state: EnvelopeState = "clear";
    if (input.restrictedZone) state = "restricted";
    else if (input.presenceDetected) state = "occupied";

    const now = Date.now();

    return hashes.map((h) => {
      const envelope: SafetyEnvelope = {
        geohash: h,
        altitudeBand: band,
        state,
        lastUpdated: now,
      };

      this.envelopes.set(this.envelopeKey(h, band), envelope);
      return envelope;
    });
  }

  // -----------------------------
  // QUERY
  // -----------------------------

  getEnvelope(
    lat: number,
    lon: number,
    altitudeMeters: number
  ): SafetyEnvelope | null {
    const hash = encodeLocation(
      lat,
      lon,
      this.geohashPrecision
    );
    const band = this.computeAltitudeBand(altitudeMeters);
    return this.envelopes.get(this.envelopeKey(hash, band)) ?? null;
  }

  getAllActive(): SafetyEnvelope[] {
    return Array.from(this.envelopes.values());
  }

  // -----------------------------
  // CLEANUP (TTL)
  // -----------------------------

  purge(staleAfterMs: number): void {
    const now = Date.now();
    for (const [key, env] of this.envelopes.entries()) {
      if (now - env.lastUpdated > staleAfterMs) {
        this.envelopes.delete(key);
      }
    }
  }

  // -----------------------------
  // LOGGING
  // -----------------------------

  log(envelope: SafetyEnvelope): void {
    console.log(
      `[safety] ${envelope.state} | geohash=${envelope.geohash} | alt=${envelope.altitudeBand[0]}–${envelope.altitudeBand[1]}m`
    );
  }
}

// =====================================================
// EXAMPLE USAGE (REMOVE IN PROD)
// =====================================================

const safety = new SafetyEnvelopeContainer(20, 7);

const envelopes = safety.update({
  lat: 30.7333,
  lon: 76.7794,
  altitudeMeters: 42,
  presenceDetected: false,
});

envelopes.forEach((e) => safety.log(e));

const arrival = safety.getEnvelope(30.7333, 76.7794, 42);
console.log("arrival envelope:", arrival);
