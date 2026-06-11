/** Minimal GeoJSON types for the historical basemap. */

export interface CountryProperties {
  NAME: string | null;
  ABBREVN?: string | null;
  /** Sovereign power this territory answers to (e.g. colonies). */
  SUBJECTO?: string | null;
  PARTOF?: string | null;
}

export interface CountryFeature {
  type: 'Feature';
  properties: CountryProperties;
  geometry:
    | { type: 'Polygon'; coordinates: number[][][] }
    | { type: 'MultiPolygon'; coordinates: number[][][][] };
}

export interface CountryCollection {
  type: 'FeatureCollection';
  features: CountryFeature[];
}

/** Outer rings of a feature, as lon/lat coordinate lists. */
export function outerRings(feature: CountryFeature): number[][][] {
  if (feature.geometry.type === 'Polygon') {
    return [feature.geometry.coordinates[0]];
  }
  return feature.geometry.coordinates.map((poly) => poly[0]);
}
