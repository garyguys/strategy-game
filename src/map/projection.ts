/** World map size in world-space pixels (Mercator square). */
export const MAP_SIZE = 4096;

const MAX_LAT = 84;

/** Project lon/lat (degrees) to world-space x/y using Web Mercator. */
export function project(lon: number, lat: number): [number, number] {
  const x = ((lon + 180) / 360) * MAP_SIZE;
  const clamped = Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
  const rad = (clamped * Math.PI) / 180;
  const y =
    MAP_SIZE / 2 -
    (MAP_SIZE / (2 * Math.PI)) * Math.log(Math.tan(Math.PI / 4 + rad / 2));
  return [x, y];
}
