// =====================================================
// SAFETY ENVELOPE CONTAINER (Localized, Drop-in)
// File: safetyEnvelope.ts
// =====================================================

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
  geohash: string;
  altitudeMeters: number;
  presenceDetected: boolean;
  restrictedZone?: boolean;
};

// -----------------------------
// LOCAL CONTAINER
// -----------------------------

export class SafetyEnvelopeContainer {
  private envelopes: Map<string, SafetyEnvelope> = new Map();

  constructor(
    private bandSizeMeters: number = 20 // vertical slicing
  ) {}

  // -----------------------------
  // INTERNAL HELPERS
  // -----------------------------

  private computeAltitudeBand(altitude: number): AltitudeBand {
    const base = Math.floor(altitude / this.bandSizeMeters) * this.bandSizeMeters;
    return [base, base + this.bandSizeMeters];
  }

  private envelopeKey(geohash: string, band: AltitudeBand): string {
    return `${geohash}:${band[0]}-${band[1]}`;
  }

  // -----------------------------
  // CORE LOGIC
  // -----------------------------

  update(input: EnvelopeInput): SafetyEnvelope {
    const band = this.computeAltitudeBand(input.altitudeMeters);
    const key = this.envelopeKey(input.geohash, band);

    let state: EnvelopeState = "clear";

    if (input.restrictedZone) {
      state = "restricted";
    } else if (input.presenceDetected) {
      state = "occupied";
    }

    const envelope: SafetyEnvelope = {
      geohash: input.geohash,
      altitudeBand: band,
      state,
      lastUpdated: Date.now(),
    };

    this.envelopes.set(key, envelope);

    return envelope;
  }

  // -----------------------------
  // QUERY
  // -----------------------------

  getEnvelope(geohash: string, altitudeMeters: number): SafetyEnvelope | null {
    const band = this.computeAltitudeBand(altitudeMeters);
    const key = this.envelopeKey(geohash, band);
    return this.envelopes.get(key) ?? null;
  }

  getAllActive(): SafetyEnvelope[] {
    return Array.from(this.envelopes.values());
  }

  // -----------------------------
  // CLEANUP (TTL based)
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
  // LOGGING (Optional)
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

const safety = new SafetyEnvelopeContainer(20);

const env = safety.update({
  geohash: "ttn7g9k",
  altitudeMeters: 42,
  presenceDetected: false,
});

safety.log(env);
