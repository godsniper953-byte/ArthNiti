import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Compass,
  ExternalLink,
  Globe,
  Info,
  Layers,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  GlobalTradeNetworkDataset,
  GlobalTradePartnerNode,
  TradeRegionFilter,
  TradeRouteDisplayMode,
} from '../../types/economy';
import {
  INDIA_FY24_TOTAL_EXPORTS_USD_BN,
  INDIA_FY24_TOTAL_IMPORTS_USD_BN,
  INDIA_FY24_TOTAL_TRADE_USD_BN,
  INDIA_FY24_TRADE_BALANCE_USD_BN,
  loadGlobalTradeNetworkData,
  matchesTradeRegionFilter,
} from '../../services/globalTradeNetworkService';

interface IndiaEconomicGlobeProps {
  theme: 'dark' | 'light';
  onOpenMerchandiseTradePage?: () => void;
}

export const INDIA_HUB_LAT = 20.59;
export const INDIA_HUB_LON = 78.96;

export const GLOBE_DEFAULT_CAMERA_POS = {
  x: 0,
  y: 0.15,
  z: 4.85,
} as const;

export interface GlobeCountryCentroid {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lon: number;
  partnerId?: string;
}

export const GLOBE_COUNTRY_CENTROIDS: Record<string, GlobeCountryCentroid> = {
  india: { id: 'india', name: 'India', shortName: 'India', lat: INDIA_HUB_LAT, lon: INDIA_HUB_LON },
  usa: { id: 'usa', name: 'United States', shortName: 'USA', lat: 38.9, lon: -77.04, partnerId: 'usa' },
  uk: { id: 'uk', name: 'United Kingdom', shortName: 'UK', lat: 51.51, lon: -0.13, partnerId: 'uk' },
  brazil: { id: 'brazil', name: 'Brazil', shortName: 'Brazil', lat: -15.79, lon: -47.88, partnerId: 'brazil' },
  japan: { id: 'japan', name: 'Japan', shortName: 'Japan', lat: 35.68, lon: 139.69, partnerId: 'japan' },
  australia: {
    id: 'australia',
    name: 'Australia',
    shortName: 'Australia',
    lat: -35.28,
    lon: 149.13,
    partnerId: 'australia',
  },
  canada: { id: 'canada', name: 'Canada', shortName: 'Canada', lat: 56.13, lon: -106.35 },
  russia: { id: 'russia', name: 'Russia', shortName: 'Russia', lat: 55.75, lon: 37.62, partnerId: 'russia' },
  'new-zealand': {
    id: 'new-zealand',
    name: 'New Zealand',
    shortName: 'New Zealand',
    lat: -41.29,
    lon: 174.78,
  },
  china: { id: 'china', name: 'China', shortName: 'China', lat: 39.9, lon: 116.4, partnerId: 'china' },
  uae: { id: 'uae', name: 'United Arab Emirates', shortName: 'UAE', lat: 24.45, lon: 54.38, partnerId: 'uae' },
  'saudi-arabia': {
    id: 'saudi-arabia',
    name: 'Saudi Arabia',
    shortName: 'Saudi Arabia',
    lat: 24.71,
    lon: 46.68,
    partnerId: 'saudi-arabia',
  },
  singapore: {
    id: 'singapore',
    name: 'Singapore',
    shortName: 'Singapore',
    lat: 1.35,
    lon: 103.82,
    partnerId: 'singapore',
  },
  indonesia: {
    id: 'indonesia',
    name: 'Indonesia',
    shortName: 'Indonesia',
    lat: -6.21,
    lon: 106.85,
    partnerId: 'indonesia',
  },
  'south-korea': {
    id: 'south-korea',
    name: 'South Korea',
    shortName: 'South Korea',
    lat: 37.57,
    lon: 126.98,
    partnerId: 'south-korea',
  },
  switzerland: {
    id: 'switzerland',
    name: 'Switzerland',
    shortName: 'Switzerland',
    lat: 46.95,
    lon: 7.45,
    partnerId: 'switzerland',
  },
  'south-africa': {
    id: 'south-africa',
    name: 'South Africa',
    shortName: 'South Africa',
    lat: -25.75,
    lon: 28.19,
    partnerId: 'south-africa',
  },
  mexico: { id: 'mexico', name: 'Mexico', shortName: 'Mexico', lat: 19.43, lon: -99.13, partnerId: 'mexico' },
  'dateline-east': {
    id: 'dateline-east',
    name: 'Fiji (Date Line East +179.9°E)',
    shortName: 'Fiji (+179.9°E)',
    lat: -17.71,
    lon: 179.9,
  },
  'dateline-west': {
    id: 'dateline-west',
    name: 'Samoa (Date Line West -179.9°W)',
    shortName: 'Samoa (-179.9°W)',
    lat: -13.76,
    lon: -179.9,
  },
  'high-arctic': {
    id: 'high-arctic',
    name: 'Svalbard (High-Latitude North 78.22°N)',
    shortName: 'Svalbard (78.2°N)',
    lat: 78.22,
    lon: 15.63,
  },
  'high-antarctic': {
    id: 'high-antarctic',
    name: 'Ross Shelf (High-Latitude South -77.85°S)',
    shortName: 'Ross (-77.9°S)',
    lat: -77.85,
    lon: 166.67,
  },
};

export const QUICK_FOCUS_COUNTRY_KEYS: string[] = [
  'india',
  'usa',
  'uk',
  'brazil',
  'japan',
  'australia',
  'canada',
  'russia',
  'new-zealand',
];

const REGION_FILTERS: TradeRegionFilter[] = [
  'All',
  'BRICS',
  'European Union',
  'ASEAN',
  'North America',
  'Middle East',
  'Asia-Pacific',
  'Africa',
  'Latin America',
];

const DISPLAY_MODES: { id: TradeRouteDisplayMode; label: string }[] = [
  { id: 'all', label: 'All Trade Routes' },
  { id: 'exports', label: 'Export Connections' },
  { id: 'imports', label: 'Import Connections' },
  { id: 'balance', label: 'Trade Balance' },
];

/**
 * Normalize any longitude in degrees into [-180, 180].
 */
export function normalizeLongitudeDeg(lon: number): number {
  const wrapped = ((((lon + 180) % 360) + 360) % 360) - 180;
  return wrapped === -180 && lon > 0 ? 180 : wrapped;
}

/**
 * Convert geographic (lat, lon) in degrees to 3D sphere Cartesian coordinates.
 * Matches Three.js SphereGeometry UV mapping where lon = -180 is at u = 0 and lon = +180 is at u = 1:
 *   x = -r * sin(phi) * cos(theta) = +r * cos(lat) * cos(lon)
 *   y =  r * cos(phi)              = +r * sin(lat)
 *   z =  r * sin(phi) * sin(theta) = -r * cos(lat) * sin(lon)
 */
export function latLonToVec3(
  lat: number,
  lon: number,
  radius: number,
  target = new THREE.Vector3()
): THREE.Vector3 {
  const clampedLat = THREE.MathUtils.clamp(lat, -90, 90);
  const normLon = normalizeLongitudeDeg(lon);
  const phi = (90 - clampedLat) * (Math.PI / 180);
  const theta = (normLon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return target.set(x, y, z);
}

/**
 * Exact inverse mapping: convert a 3D point on the globe sphere back to geographic (lat, lon) in degrees.
 */
export function vec3ToLatLon(vec: THREE.Vector3): { lat: number; lon: number } {
  const r = vec.length();
  if (r < 1e-9) {
    return { lat: 0, lon: 0 };
  }
  const sinLat = THREE.MathUtils.clamp(vec.y / r, -1, 1);
  const lat = Math.asin(sinLat) * (180 / Math.PI);
  const lon = Math.atan2(-vec.z, vec.x) * (180 / Math.PI);
  return { lat, lon: normalizeLongitudeDeg(lon) };
}

/**
 * Compute great-circle angular distance in degrees between two (lat, lon) coordinates.
 */
export function greatCircleDistanceDeg(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const v1 = latLonToVec3(lat1, lon1, 1).normalize();
  const v2 = latLonToVec3(lat2, lon2, 1).normalize();
  const dot = THREE.MathUtils.clamp(v1.dot(v2), -1, 1);
  return Math.acos(dot) * (180 / Math.PI);
}

/**
 * Compute globe Euler rotation (rotX, rotY) with order 'XYZ' that rotates a given (lat, lon)
 * so its outward surface normal points directly at the camera position (default (0, 0.15, 4.85)).
 *
 * Mathematical derivation:
 * 1. Local point: x = -r*cos(lat)*cos(theta), y = r*sin(lat), z = r*cos(lat)*sin(theta).
 * 2. Under R_y(rotY):
 *      x_1 = -r*cos(lat)*cos(theta + rotY)
 *      z_1 = +r*cos(lat)*sin(theta + rotY)
 *    Setting theta + rotY = PI / 2 => rotY = PI / 2 - theta guarantees x_1 = 0 and z_1 = +r*cos(lat) > 0.
 * 3. Under R_x(rotX) applied after R_y(rotY) (Three.js 'XYZ' matrix order M = R_x(rotX) * R_y(rotY)):
 *      y_2 = r*sin(lat_rad - rotX)
 *      z_2 = r*cos(lat_rad - rotX)
 *    Aligning (0, y_2, z_2) with camera direction (0, sin(alpha_cam), cos(alpha_cam)) where
 *    alpha_cam = atan2(cameraPos.y, cameraPos.z) yields:
 *      rotX = lat_rad - alpha_cam.
 */
export function computeTargetRotationForLatLon(
  lat: number,
  lon: number,
  cameraPos: { x: number; y: number; z: number } = GLOBE_DEFAULT_CAMERA_POS
): { rotX: number; rotY: number } {
  const clampedLat = THREE.MathUtils.clamp(lat, -89.5, 89.5);
  const normLon = normalizeLongitudeDeg(lon);
  const theta = (normLon + 180) * (Math.PI / 180);
  const rotY = Math.PI / 2 - theta;

  const latRad = clampedLat * (Math.PI / 180);
  const cameraElevationRad = Math.atan2(cameraPos.y, cameraPos.z);
  const maxTiltRad = Math.PI / 2 - 0.02;
  const rotX = THREE.MathUtils.clamp(latRad - cameraElevationRad, -maxTiltRad, maxTiltRad);

  return { rotX, rotY };
}

/**
 * Normalize angle difference so rotation always takes the shortest spherical path (|diff| <= PI).
 */
export function shortestAngleTarget(currentAngle: number, desiredAngle: number): number {
  const twoPi = Math.PI * 2;
  const diff = ((((desiredAngle - currentAngle) % twoPi) + twoPi + Math.PI) % twoPi) - Math.PI;
  return currentAngle + diff;
}

/**
 * Compute the shortest-path target globe rotation from the globe's current instantaneous rotation
 * to face a target country at (targetLat, targetLon).
 */
export function computeGlobeTransitionTarget(
  currentGlobeRot: { rotX: number; rotY: number },
  targetLat: number,
  targetLon: number,
  cameraPos: { x: number; y: number; z: number } = GLOBE_DEFAULT_CAMERA_POS
): { rotX: number; rotY: number } {
  const desired = computeTargetRotationForLatLon(targetLat, targetLon, cameraPos);
  return {
    rotX: desired.rotX,
    rotY: shortestAngleTarget(currentGlobeRot.rotY, desired.rotY),
  };
}

/**
 * Compute the world-space outward surface normal of a geographic coordinate (lat, lon)
 * when the globe has rotation (rotX, rotY) in Three.js 'XYZ' Euler order.
 */
export function getCountryWorldNormal(
  lat: number,
  lon: number,
  rotX: number,
  rotY: number
): THREE.Vector3 {
  const localNormal = latLonToVec3(lat, lon, 1).normalize();
  const euler = new THREE.Euler(rotX, rotY, 0, 'XYZ');
  return localNormal.applyEuler(euler).normalize();
}

/**
 * Diagnostic helper: compute the angle (in degrees) and dot product between a country's
 * rotated world-space outward surface normal and the camera direction vector.
 * When properly aligned, angleDeg is ~0° and dotProduct is ~1.0 (strictly > 0 on the visible front hemisphere).
 */
export function computeCountryAngleToCameraDeg(
  lat: number,
  lon: number,
  rotX: number,
  rotY: number,
  cameraPos: { x: number; y: number; z: number } = GLOBE_DEFAULT_CAMERA_POS
): {
  angleDeg: number;
  dotProduct: number;
  isFrontHemisphere: boolean;
  worldNormal: THREE.Vector3;
  cameraDirection: THREE.Vector3;
} {
  const worldNormal = getCountryWorldNormal(lat, lon, rotX, rotY);
  const cameraDirection = new THREE.Vector3(cameraPos.x, cameraPos.y, cameraPos.z).normalize();
  const dotProduct = THREE.MathUtils.clamp(worldNormal.dot(cameraDirection), -1, 1);
  const angleDeg = Math.acos(dotProduct) * (180 / Math.PI);
  return {
    angleDeg,
    dotProduct,
    isFrontHemisphere: dotProduct > 0 && worldNormal.z > 0,
    worldNormal,
    cameraDirection,
  };
}

// Create a spherical great-circle elevated CubicBezierCurve3 between two surface points
// so long routes (e.g. India -> USA or India -> Brazil) arc high above the Earth and never clip inside
function createSphericalTradeArc(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  globeRadius: number
): THREE.CubicBezierCurve3 {
  const vStart = latLonToVec3(startLat, startLon, globeRadius * 1.008);
  const vEnd = latLonToVec3(endLat, endLon, globeRadius * 1.008);

  const uStart = vStart.clone().normalize();
  const uEnd = vEnd.clone().normalize();

  const dot = THREE.MathUtils.clamp(uStart.dot(uEnd), -0.999, 0.999);
  const omega = Math.acos(dot); // angular distance in radians (0 to PI)

  // Spherical linear interpolation helper along great circle
  const slerpVec = (t: number): THREE.Vector3 => {
    if (omega < 0.001) return uStart.clone();
    const sinOmega = Math.sin(omega);
    const s0 = Math.sin((1 - t) * omega) / sinOmega;
    const s1 = Math.sin(t * omega) / sinOmega;
    return uStart
      .clone()
      .multiplyScalar(s0)
      .add(uEnd.clone().multiplyScalar(s1))
      .normalize();
  };

  // Altitude scales smoothly with angular distance so antipodal arcs clear the sphere comfortably
  const peakFactor = 1.06 + (omega / Math.PI) * 0.42;
  const ctrl1 = slerpVec(0.32).multiplyScalar(globeRadius * peakFactor);
  const ctrl2 = slerpVec(0.68).multiplyScalar(globeRadius * peakFactor);

  return new THREE.CubicBezierCurve3(vStart, ctrl1, ctrl2, vEnd);
}

// Detailed continental [lat, lon] polygons for our zero-dependency procedural 2048x1024 World Map texture
const WORLD_LANDMASS_POLYGONS: {
  name: string;
  isIndia?: boolean;
  coords: [number, number][];
}[] = [
  // 1. INDIA (Highlighted in Emerald & Gold)
  {
    name: 'India',
    isIndia: true,
    coords: [
      [8.08, 77.55],
      [10.3, 79.8],
      [13.08, 80.27],
      [15.9, 80.9],
      [17.7, 83.3],
      [20.3, 86.7],
      [21.9, 88.1],
      [22.5, 88.9],
      [25.2, 89.8],
      [26.2, 90.0],
      [27.9, 96.1],
      [26.1, 95.1],
      [24.2, 94.1],
      [23.1, 91.5],
      [25.1, 88.8],
      [26.7, 88.2],
      [27.5, 84.0],
      [28.9, 80.1],
      [31.1, 79.0],
      [33.0, 79.4],
      [35.1, 77.8],
      [35.5, 74.6],
      [34.1, 73.9],
      [31.5, 74.5],
      [29.9, 73.2],
      [27.8, 70.1],
      [24.3, 68.7],
      [22.8, 69.1],
      [20.9, 70.4],
      [21.6, 72.2],
      [20.4, 72.8],
      [18.9, 72.8],
      [15.4, 73.8],
      [12.8, 74.8],
      [9.9, 76.2],
      [8.08, 77.55],
    ],
  },
  // 2. North America
  {
    name: 'North America',
    coords: [
      [70, -162],
      [71, -135],
      [69, -115],
      [66, -90],
      [60, -78],
      [62, -65],
      [52, -55],
      [45, -61],
      [41, -70],
      [35, -75],
      [25, -80],
      [29, -85],
      [29, -95],
      [22, -97],
      [19, -96],
      [21, -87],
      [15, -83],
      [9, -79],
      [8, -83],
      [14, -92],
      [17, -101],
      [23, -106],
      [31, -114],
      [23, -110],
      [32, -117],
      [38, -123],
      [48, -124],
      [58, -136],
      [61, -149],
      [55, -162],
      [64, -166],
      [70, -162],
    ],
  },
  // 3. Greenland
  {
    name: 'Greenland',
    coords: [
      [60, -44],
      [66, -36],
      [72, -22],
      [81, -18],
      [82, -45],
      [76, -68],
      [68, -53],
      [60, -44],
    ],
  },
  // 4. South America
  {
    name: 'South America',
    coords: [
      [11, -75],
      [10, -62],
      [6, -52],
      [0, -49],
      [-5, -35],
      [-13, -38],
      [-23, -42],
      [-34, -53],
      [-42, -64],
      [-54, -68],
      [-53, -74],
      [-41, -74],
      [-28, -71],
      [-18, -71],
      [-12, -77],
      [-5, -81],
      [2, -79],
      [8, -77],
      [11, -75],
    ],
  },
  // 5. Africa
  {
    name: 'Africa',
    coords: [
      [36, -6],
      [37, 10],
      [32, 15],
      [31, 32],
      [22, 37],
      [12, 44],
      [12, 51],
      [2, 45],
      [-10, 40],
      [-25, 33],
      [-34, 25],
      [-34, 18],
      [-22, 14],
      [-12, 13],
      [-4, 11],
      [4, 9],
      [6, 2],
      [5, -8],
      [11, -16],
      [15, -17],
      [23, -16],
      [31, -10],
      [36, -6],
    ],
  },
  // 6. Madagascar
  {
    name: 'Madagascar',
    coords: [
      [-12, 49],
      [-18, 49.5],
      [-25, 47],
      [-25, 44],
      [-16, 44.5],
      [-12, 49],
    ],
  },
  // 7. Europe (Continental)
  {
    name: 'Europe',
    coords: [
      [36, -9],
      [43, -9],
      [44, -1],
      [48, -4],
      [51, 2],
      [54, 8],
      [58, 8],
      [62, 5],
      [70, 20],
      [70, 30],
      [65, 40],
      [60, 30],
      [55, 21],
      [54, 14],
      [46, 14],
      [40, 18],
      [38, 15],
      [43, 12],
      [44, 8],
      [42, 3],
      [36, -5],
      [36, -9],
    ],
  },
  // 8. United Kingdom & Ireland
  {
    name: 'UK & Ireland',
    coords: [
      [50, -5],
      [51, 1.5],
      [55, -1.5],
      [58.5, -3],
      [57, -6],
      [54, -5],
      [52, -10],
      [50, -5],
    ],
  },
  // 9. Eurasia & East/Southeast Asia (Outside India)
  {
    name: 'Eurasia',
    coords: [
      [41, 28],
      [36, 36],
      [30, 33],
      [28, 35],
      [13, 44],
      [16, 53],
      [22, 59],
      [26, 56],
      [30, 49],
      [25, 62],
      [25, 67],
      [35, 74],
      [36, 78],
      [28, 84],
      [27, 96],
      [21, 93],
      [16, 97],
      [7, 99],
      [1.3, 104],
      [7, 102],
      [11, 109],
      [17, 107],
      [21, 108],
      [23, 117],
      [31, 122],
      [39, 121],
      [39, 126],
      [35, 129],
      [42, 131],
      [52, 141],
      [60, 150],
      [66, 178],
      [71, 160],
      [73, 120],
      [73, 80],
      [68, 45],
      [60, 30],
      [46, 31],
      [42, 41],
      [41, 28],
    ],
  },
  // 10. Japan Archipelago
  {
    name: 'Japan',
    coords: [
      [31, 130],
      [34, 135],
      [36, 140.5],
      [41, 141],
      [44, 145],
      [43, 140],
      [37, 137],
      [34, 131],
      [31, 130],
    ],
  },
  // 11. Maritime ASEAN (Indonesia — Sumatra, Java, Borneo, Sulawesi, Philippines)
  {
    name: 'Sumatra & Java',
    coords: [
      [5.5, 95.3],
      [1, 102],
      [-5.8, 105.8],
      [-7.8, 114],
      [-8.5, 115],
      [-7.5, 106],
      [-3, 100],
      [5.5, 95.3],
    ],
  },
  {
    name: 'Borneo',
    coords: [
      [7, 117],
      [1, 118],
      [-3.5, 116],
      [-3, 110],
      [2, 109],
      [7, 117],
    ],
  },
  {
    name: 'Philippines',
    coords: [
      [18.5, 121],
      [14, 124],
      [7, 126],
      [6, 122],
      [13, 120],
      [18.5, 121],
    ],
  },
  // 12. Sri Lanka
  {
    name: 'Sri Lanka',
    coords: [
      [9.8, 80.0],
      [8.5, 81.8],
      [6.0, 81.2],
      [6.0, 79.9],
      [8.2, 79.8],
      [9.8, 80.0],
    ],
  },
  // 13. Australia
  {
    name: 'Australia',
    coords: [
      [-12, 131],
      [-12, 142],
      [-19, 147],
      [-28, 153],
      [-38, 149],
      [-38, 141],
      [-34, 135],
      [-32, 126],
      [-34, 115],
      [-22, 114],
      [-15, 124],
      [-12, 131],
    ],
  },
  // 14. New Zealand
  {
    name: 'New Zealand',
    coords: [
      [-35, 173],
      [-39, 178],
      [-46, 168],
      [-45, 166],
      [-38, 174],
      [-35, 173],
    ],
  },
];

// Generate procedural 2048x1024 World Map Albedo + Roughness textures
function createProceduralWorldMapTextures(
  maxAnisotropy: number,
  partners: GlobalTradePartnerNode[]
): {
  albedoTexture: THREE.CanvasTexture;
  roughnessTexture: THREE.CanvasTexture;
} {
  const width = 2048;
  const height = 1024;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = width;
  albedoCanvas.height = height;
  const ctx = albedoCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d');

  const lonToX = (lon: number) => ((lon + 180) / 360) * width;
  const latToY = (lat: number) => ((90 - lat) / 180) * height;

  if (ctx && rCtx) {
    // 1. Deep Navy Ocean Bathymetry Gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
    oceanGrad.addColorStop(0, '#040a17');
    oceanGrad.addColorStop(0.22, '#071429');
    oceanGrad.addColorStop(0.5, '#091b36');
    oceanGrad.addColorStop(0.78, '#071429');
    oceanGrad.addColorStop(1, '#040a17');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, width, height);

    // Roughness base for oceans (smooth specular sheen: ~75/255)
    rCtx.fillStyle = 'rgb(75, 75, 75)';
    rCtx.fillRect(0, 0, width, height);

    // 2. Subtle Global Latitude / Longitude Graticule Grid (every 15 degrees)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += 15) {
      const x = lonToX(lon);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let lat = -75; lat <= 75; lat += 15) {
      const y = latToY(lat);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Highlight Equator and Tropic of Cancer (passing directly through India at 23.5°N)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.16)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, latToY(0));
    ctx.lineTo(width, latToY(0));
    ctx.stroke();

    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
    ctx.beginPath();
    ctx.moveTo(0, latToY(23.43));
    ctx.lineTo(width, latToY(23.43));
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw Continental Polygons
    WORLD_LANDMASS_POLYGONS.forEach((poly) => {
      if (poly.coords.length < 3) return;

      ctx.beginPath();
      rCtx.beginPath();

      poly.coords.forEach(([lat, lon], idx) => {
        const x = lonToX(lon);
        const y = latToY(lat);
        if (idx === 0) {
          ctx.moveTo(x, y);
          rCtx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
          rCtx.lineTo(x, y);
        }
      });

      ctx.closePath();
      rCtx.closePath();

      if (poly.isIndia) {
        // Glowing Emerald & Gold highlight for India
        const indX = lonToX(78.96);
        const indY = latToY(22.0);
        const indiaGrad = ctx.createRadialGradient(indX, indY, 6, indX, indY, 95);
        indiaGrad.addColorStop(0, 'rgba(245, 158, 11, 0.92)');
        indiaGrad.addColorStop(0.45, 'rgba(16, 185, 129, 0.88)');
        indiaGrad.addColorStop(1, 'rgba(5, 150, 105, 0.72)');

        ctx.save();
        ctx.shadowColor = 'rgba(16, 185, 129, 0.85)';
        ctx.shadowBlur = 18;
        ctx.fillStyle = indiaGrad;
        ctx.fill();
        ctx.lineWidth = 3.2;
        ctx.strokeStyle = '#fbbf24';
        ctx.stroke();
        ctx.restore();

        // India roughness (lustrous metallic-emerald finish)
        rCtx.fillStyle = 'rgb(65, 65, 65)';
        rCtx.fill();
      } else {
        // Refined dark slate-teal continents with crisp coastal borders
        ctx.fillStyle = '#0e223b';
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#1e4e79';
        ctx.stroke();

        // Matte continent roughness (~195/255)
        rCtx.fillStyle = 'rgb(195, 195, 195)';
        rCtx.fill();
      }
    });

    // 4. Subtle Continental Interior Grid Dots & Partner City Glows
    partners.forEach((p) => {
      const x = lonToX(p.lon);
      const y = latToY(p.lat);
      const glow = ctx.createRadialGradient(x, y, 1, x, y, 14);
      if (p.entityType === 'regional_aggregate') {
        glow.addColorStop(0, 'rgba(167, 139, 250, 0.95)');
        glow.addColorStop(1, 'rgba(167, 139, 250, 0)');
      } else if (p.isBricsMember) {
        glow.addColorStop(0, 'rgba(245, 158, 11, 0.95)');
        glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      } else {
        glow.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
        glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      }
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const albedoTexture = new THREE.CanvasTexture(albedoCanvas);
  albedoTexture.colorSpace = THREE.SRGBColorSpace;
  albedoTexture.anisotropy = maxAnisotropy;
  albedoTexture.wrapS = THREE.RepeatWrapping;
  albedoTexture.wrapT = THREE.ClampToEdgeWrapping;
  albedoTexture.needsUpdate = true;

  const roughnessTexture = new THREE.CanvasTexture(roughCanvas);
  roughnessTexture.colorSpace = THREE.NoColorSpace;
  roughnessTexture.anisotropy = maxAnisotropy;
  roughnessTexture.wrapS = THREE.RepeatWrapping;
  roughnessTexture.wrapT = THREE.ClampToEdgeWrapping;
  roughnessTexture.needsUpdate = true;

  return { albedoTexture, roughnessTexture };
}

// Determine route & marker color hex for a given partner and active display mode
function getRouteHexColor(
  partner: GlobalTradePartnerNode,
  mode: TradeRouteDisplayMode
): number {
  if (partner.dataStatus === 'illustrative_corridor') {
    return 0x64748b; // Slate-blue for illustrative geographic corridors
  }
  if (mode === 'exports') {
    return 0x10b981; // Emerald for Indian export connections
  }
  if (mode === 'imports') {
    return 0xf59e0b; // Amber-Gold for Indian import connections
  }
  if (mode === 'balance') {
    const bal = partner.tradeBalanceUsdBn ?? 0;
    return bal >= 0 ? 0x10b981 : 0xf43f5e; // Emerald for bilateral surplus, Rose for deficit
  }
  // 'all' mode: color by economic grouping
  if (partner.entityType === 'regional_aggregate') return 0xa78bfa; // Violet for EU-27 & ASEAN-10 blocs
  if (partner.isBricsMember) return 0xf59e0b; // Gold for BRICS members
  if (partner.primaryRegion === 'ASEAN') return 0x06b6d4; // Cyan for ASEAN members
  if (partner.primaryRegion === 'Middle East') return 0xfbbf24; // Warm Amber for Middle East energy partners
  return 0x10b981; // Emerald for North America, Europe, Asia-Pacific
}

export const IndiaEconomicGlobe: React.FC<IndiaEconomicGlobeProps> = ({
  theme,
  onOpenMerchandiseTradePage,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Dataset state
  const [dataset, setDataset] = useState<GlobalTradeNetworkDataset | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Interactive Filters & Selection State
  const [regionFilter, setRegionFilter] = useState<TradeRegionFilter>('All');
  const [displayMode, setDisplayMode] = useState<TradeRouteDisplayMode>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>('usa');
  const [focusedCountryKey, setFocusedCountryKey] = useState<string>('india');
  const [hoveredPartnerId, setHoveredPartnerId] = useState<string | null>(null);
  const [hoverScreenPos, setHoverScreenPos] = useState<{ x: number; y: number } | null>(null);

  // Camera & Animation Controls State
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [zoomDistance, setZoomDistance] = useState<number>(GLOBE_DEFAULT_CAMERA_POS.z);
  const [useStaticFallback, setUseStaticFallback] = useState<boolean>(false);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState<boolean>(true);

  // Refs synced with React state for zero-teardown 3D animation loop
  const partnersRef = useRef<GlobalTradePartnerNode[]>([]);
  const visibleIdsRef = useRef<Set<string>>(new Set());
  const selectedIdRef = useRef<string | null>(selectedPartnerId);
  const hoveredIdRef = useRef<string | null>(hoveredPartnerId);
  const displayModeRef = useRef<TradeRouteDisplayMode>(displayMode);
  const isRotatingRef = useRef<boolean>(isRotating);
  const zoomDistanceRef = useRef<number>(zoomDistance);
  const cancelDragRef = useRef<() => void>(() => {});

  // Imperative camera rotation target ref and instantaneous globe orientation ref
  const INITIAL_INDIA_ROT = useMemo(
    () => computeTargetRotationForLatLon(INDIA_HUB_LAT, INDIA_HUB_LON, GLOBE_DEFAULT_CAMERA_POS),
    []
  );
  const cameraTargetRotRef = useRef<{ rotX: number; rotY: number }>({
    rotX: INITIAL_INDIA_ROT.rotX,
    rotY: INITIAL_INDIA_ROT.rotY,
  });
  const currentGlobeRotRef = useRef<{ rotX: number; rotY: number }>({
    rotX: INITIAL_INDIA_ROT.rotX,
    rotY: INITIAL_INDIA_ROT.rotY,
  });

  // Load verified bilateral trade data from globalTradeNetworkService
  const fetchTradeNetwork = useCallback(async (simulateError = false) => {
    setIsLoading(true);
    setErrorMsg(null);
    const res = await loadGlobalTradeNetworkData({ simulateError });
    setDataset(res);
    partnersRef.current = res.partners;
    if (res.status === 'error') {
      setErrorMsg(res.errorMessage || 'Failed to load bilateral trade network.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTradeNetwork(false);
  }, [fetchTradeNetwork]);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setIsRotating(false);
      isRotatingRef.current = false;
    }
  }, []);

  const allPartners = useMemo(() => dataset?.partners || [], [dataset]);

  // Filtered partners based on active region filter and search query
  const filteredPartners = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allPartners.filter((partner) => {
      const regionMatch = matchesTradeRegionFilter(partner, regionFilter);
      if (!regionMatch) return false;
      if (!q) return true;
      return (
        partner.name.toLowerCase().includes(q) ||
        partner.shortName.toLowerCase().includes(q) ||
        partner.isoCode.toLowerCase().includes(q) ||
        partner.primaryRegion.toLowerCase().includes(q) ||
        partner.keyExportsFromIndia.toLowerCase().includes(q) ||
        partner.keyImportsToIndia.toLowerCase().includes(q) ||
        (partner.isBricsMember && 'brics'.includes(q)) ||
        (partner.isAseanMember && 'asean'.includes(q)) ||
        (partner.isEuAggregate && 'eu european union'.includes(q))
      );
    });
  }, [allPartners, regionFilter, searchQuery]);

  // Keep visibleIdsRef synced for the WebGL loop
  useEffect(() => {
    visibleIdsRef.current = new Set(filteredPartners.map((p) => p.id));
  }, [filteredPartners]);

  useEffect(() => {
    selectedIdRef.current = selectedPartnerId;
  }, [selectedPartnerId]);

  useEffect(() => {
    hoveredIdRef.current = hoveredPartnerId;
  }, [hoveredPartnerId]);

  useEffect(() => {
    displayModeRef.current = displayMode;
  }, [displayMode]);

  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  useEffect(() => {
    zoomDistanceRef.current = zoomDistance;
  }, [zoomDistance]);

  const selectedPartner = useMemo(
    () =>
      allPartners.find((p) => p.id === selectedPartnerId) ||
      filteredPartners[0] ||
      allPartners[0] ||
      null,
    [allPartners, filteredPartners, selectedPartnerId]
  );

  const hoveredPartner = useMemo(
    () => (hoveredPartnerId ? allPartners.find((p) => p.id === hoveredPartnerId) || null : null),
    [allPartners, hoveredPartnerId]
  );

  // Smoothly rotate the globe directly to any geographic (lat, lon) so that coordinate faces the camera
  const focusGlobeOnCoordinates = useCallback((targetLat: number, targetLon: number) => {
    cancelDragRef.current();
    setIsRotating(false);
    isRotatingRef.current = false;

    const nextTarget = computeGlobeTransitionTarget(
      currentGlobeRotRef.current,
      targetLat,
      targetLon,
      {
        x: GLOBE_DEFAULT_CAMERA_POS.x,
        y: GLOBE_DEFAULT_CAMERA_POS.y,
        z: zoomDistanceRef.current,
      }
    );
    cameraTargetRotRef.current = nextTarget;
  }, []);

  // Smoothly focus camera directly on a selected partner's true geographic coordinates
  const handleSelectPartner = useCallback(
    (partner: GlobalTradePartnerNode) => {
      setSelectedPartnerId(partner.id);
      setFocusedCountryKey(partner.id);
      focusGlobeOnCoordinates(partner.lat, partner.lon);
    },
    [focusGlobeOnCoordinates]
  );

  // Reset camera to India-centered overview (20.59°N, 78.96°E) and hold focus on India
  const handleResetToIndia = useCallback(() => {
    cancelDragRef.current();
    setSelectedPartnerId(null);
    setFocusedCountryKey('india');
    setHoveredPartnerId(null);
    setHoverScreenPos(null);
    setIsRotating(false);
    isRotatingRef.current = false;
    setZoomDistance(GLOBE_DEFAULT_CAMERA_POS.z);
    zoomDistanceRef.current = GLOBE_DEFAULT_CAMERA_POS.z;

    cameraTargetRotRef.current = computeGlobeTransitionTarget(
      currentGlobeRotRef.current,
      INDIA_HUB_LAT,
      INDIA_HUB_LON,
      GLOBE_DEFAULT_CAMERA_POS
    );
  }, []);

  // Focus any country by key from GLOBE_COUNTRY_CENTROIDS or partner list
  const handleFocusCountryByKey = useCallback(
    (countryKey: string) => {
      if (countryKey === 'india') {
        handleResetToIndia();
        return;
      }
      const centroid = GLOBE_COUNTRY_CENTROIDS[countryKey];
      const matchingPartner = partnersRef.current.find(
        (p) => p.id === countryKey || (centroid?.partnerId && p.id === centroid.partnerId)
      );
      if (matchingPartner) {
        handleSelectPartner(matchingPartner);
        return;
      }
      if (centroid) {
        setFocusedCountryKey(countryKey);
        focusGlobeOnCoordinates(centroid.lat, centroid.lon);
      }
    },
    [focusGlobeOnCoordinates, handleResetToIndia, handleSelectPartner]
  );

  // When region filter changes, if current selected partner is not in filtered list, focus first matching partner
  const handleSelectRegionFilter = (nextFilter: TradeRegionFilter) => {
    setRegionFilter(nextFilter);
    if (nextFilter === 'All') {
      handleResetToIndia();
      return;
    }
    const matching = allPartners.filter((p) => matchesTradeRegionFilter(p, nextFilter));
    if (matching.length > 0) {
      handleSelectPartner(matching[0]);
    }
  };

  // Build and manage the Three.js 3D Global Trade Network scene
  useEffect(() => {
    if (useStaticFallback) return;
    const container = mountRef.current;
    if (!container) return;

    // 1. Probe WebGL & software renderer
    let isSoftwareGl = false;
    try {
      const probeCanvas = document.createElement('canvas');
      const gl = (probeCanvas.getContext('webgl2') ||
        probeCanvas.getContext('webgl')) as WebGLRenderingContext | null;
      if (!gl) {
        setWebglSupported(false);
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      setWebglSupported(false);
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 760;
    const height = container.clientHeight || 560;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 120);
    camera.position.set(
      GLOBE_DEFAULT_CAMERA_POS.x,
      GLOBE_DEFAULT_CAMERA_POS.y,
      zoomDistanceRef.current
    );
    camera.lookAt(0, 0, 0);

    // 2. Studio Lighting Rig (Warm key light + Cool hemisphere fill + Emerald/Cyan rim lights)
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x050b16, 1.05);
    scene.add(hemiLight);

    const sunKeyLight = new THREE.DirectionalLight(0xfef3c7, 2.1);
    sunKeyLight.position.set(5, 4, 5);
    scene.add(sunKeyLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 1.35);
    rimLight.position.set(-5, -2, -4);
    scene.add(rimLight);

    const topRimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    topRimLight.position.set(0, 6, -4);
    scene.add(topRimLight);

    // 3. Subtle Deep Space Starfield
    const starCount = 240;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 14 + (i % 9) * 1.8;
      const theta = i * 2.3999632;
      const phi = Math.acos(1 - ((i + 0.5) / starCount) * 2);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 4;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.06,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 4. Root Globe Group (Explicit 'XYZ' Euler order so R_y spins longitude first, R_x pitches latitude toward camera)
    const globeGroup = new THREE.Group();
    globeGroup.rotation.order = 'XYZ';
    scene.add(globeGroup);

    const GLOBE_RADIUS = 1.66;
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const { albedoTexture, roughnessTexture } = createProceduralWorldMapTextures(
      maxAnisotropy,
      allPartners
    );

    // Part A: Textured 3D World Sphere
    const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: albedoTexture,
      roughnessMap: roughnessTexture,
      roughness: 0.85,
      metalness: 0.25,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // Part B: Subtle Atmospheric Rim Halo
    const atmoGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.045, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    globeGroup.add(atmoMesh);

    // Part C: Raised 3D Luminous India Border Contour Ribbon
    const indiaOutlineCoords = WORLD_LANDMASS_POLYGONS[0].coords;
    const indiaCurvePts = indiaOutlineCoords.map(([lat, lon]) =>
      latLonToVec3(lat, lon, GLOBE_RADIUS * 1.007)
    );
    const indiaCurve = new THREE.CatmullRomCurve3(indiaCurvePts, true);
    const indiaTubeGeo = new THREE.TubeGeometry(indiaCurve, 96, 0.0085, 6, true);
    const indiaTubeMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.8,
    });
    const indiaTubeMesh = new THREE.Mesh(indiaTubeGeo, indiaTubeMat);
    globeGroup.add(indiaTubeMesh);

    // Part D: Central India Trade Gateway Hub Beacon (20.59°N, 78.96°E)
    const indiaHubPos = latLonToVec3(INDIA_HUB_LAT, INDIA_HUB_LON, GLOBE_RADIUS * 1.012);
    const indiaHubGroup = new THREE.Group();
    indiaHubGroup.position.copy(indiaHubPos);
    indiaHubGroup.lookAt(indiaHubPos.clone().multiplyScalar(2));

    const indiaRingGeo = new THREE.RingGeometry(0.035, 0.058, 24);
    const indiaRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });
    const indiaRingMesh = new THREE.Mesh(indiaRingGeo, indiaRingMat);
    indiaHubGroup.add(indiaRingMesh);

    const indiaCoreGeo = new THREE.SphereGeometry(0.028, 16, 16);
    const indiaCoreMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.1,
      roughness: 0.15,
      metalness: 0.9,
    });
    const indiaCoreMesh = new THREE.Mesh(indiaCoreGeo, indiaCoreMat);
    indiaHubGroup.add(indiaCoreMesh);

    // Part E: Partner Beacons, Curved 3D Trade Arcs, and Travelling Particles
    interface RouteVisualObject {
      partner: GlobalTradePartnerNode;
      arcMesh: THREE.Mesh;
      arcMaterial: THREE.MeshStandardMaterial;
      markerGroup: THREE.Group;
      markerCoreMaterial: THREE.MeshStandardMaterial;
      markerRingMaterial: THREE.MeshBasicMaterial;
      hitMesh: THREE.Mesh;
      curve: THREE.CubicBezierCurve3;
      particles: THREE.Mesh[];
      particleMaterials: THREE.MeshBasicMaterial[];
      phaseOffset: number;
    }

    const routeObjects: RouteVisualObject[] = [];
    const hitMeshes: THREE.Mesh[] = [];

    const sharedMarkerCoreGeo = new THREE.SphereGeometry(0.024, 12, 12);
    const sharedMarkerRingGeo = new THREE.RingGeometry(0.032, 0.048, 20);
    const sharedHitGeo = new THREE.SphereGeometry(0.085, 10, 10);
    const sharedParticleGeo = new THREE.SphereGeometry(0.015, 8, 8);

    // Interactive hit-proxy sphere for the India Hub beacon itself
    const indiaHitMat = new THREE.MeshBasicMaterial({ visible: false });
    const indiaHitMesh = new THREE.Mesh(sharedHitGeo, indiaHitMat);
    indiaHitMesh.userData.countryKey = 'india';
    indiaHitMesh.userData.lat = INDIA_HUB_LAT;
    indiaHitMesh.userData.lon = INDIA_HUB_LON;
    indiaHubGroup.add(indiaHitMesh);
    hitMeshes.push(indiaHitMesh);
    globeGroup.add(indiaHubGroup);

    allPartners.forEach((partner, idx) => {
      const hexColor = getRouteHexColor(partner, displayModeRef.current);

      // 1. Destination Marker on Globe Surface
      const markerPos = latLonToVec3(partner.lat, partner.lon, GLOBE_RADIUS * 1.01);
      const markerGroup = new THREE.Group();
      markerGroup.position.copy(markerPos);
      markerGroup.lookAt(markerPos.clone().multiplyScalar(2));

      const markerRingMat = new THREE.MeshBasicMaterial({
        color: hexColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const markerRing = new THREE.Mesh(sharedMarkerRingGeo, markerRingMat);
      markerGroup.add(markerRing);

      const markerCoreMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        emissive: hexColor,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metalness: 0.8,
      });
      const markerCore = new THREE.Mesh(sharedMarkerCoreGeo, markerCoreMat);
      markerGroup.add(markerCore);

      // Invisible enlarged hit-proxy sphere for reliable mouse/touch picking
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(sharedHitGeo, hitMat);
      hitMesh.userData.partnerId = partner.id;
      hitMesh.userData.lat = partner.lat;
      hitMesh.userData.lon = partner.lon;
      markerGroup.add(hitMesh);
      hitMeshes.push(hitMesh);

      globeGroup.add(markerGroup);

      // 2. Curved 3D Spherical Trade Arc from India to Partner
      const curve = createSphericalTradeArc(
        INDIA_HUB_LAT,
        INDIA_HUB_LON,
        partner.lat,
        partner.lon,
        GLOBE_RADIUS
      );

      // Tube radius scaled slightly by verified trade volume (or thin uniform radius for illustrative links)
      const tradeVol = partner.totalTradeUsdBn ?? 0;
      const tubeRadius =
        partner.dataStatus === 'verified_official'
          ? THREE.MathUtils.clamp(0.0045 + (tradeVol / 140) * 0.0065, 0.0045, 0.011)
          : 0.0038;

      const arcGeo = new THREE.TubeGeometry(curve, 44, tubeRadius, 6, false);
      const arcMat = new THREE.MeshStandardMaterial({
        color: hexColor,
        emissive: hexColor,
        emissiveIntensity: 0.65,
        roughness: 0.25,
        metalness: 0.75,
        transparent: true,
        opacity: 0.82,
      });
      const arcMesh = new THREE.Mesh(arcGeo, arcMat);
      globeGroup.add(arcMesh);

      // 3. Animated Glowing Particles Travelling Along the Arc
      const particles: THREE.Mesh[] = [];
      const particleMaterials: THREE.MeshBasicMaterial[] = [];
      const numParticles = partner.dataStatus === 'verified_official' ? 2 : 1;

      for (let pIdx = 0; pIdx < numParticles; pIdx++) {
        const pMat = new THREE.MeshBasicMaterial({
          color: pIdx === 0 ? 0x6ee7b7 : 0xfde68a,
          transparent: true,
          opacity: 0.95,
        });
        const pMesh = new THREE.Mesh(sharedParticleGeo, pMat);
        globeGroup.add(pMesh);
        particles.push(pMesh);
        particleMaterials.push(pMat);
      }

      routeObjects.push({
        partner,
        arcMesh,
        arcMaterial: arcMat,
        markerGroup,
        markerCoreMaterial: markerCoreMat,
        markerRingMaterial: markerRingMat,
        hitMesh,
        curve,
        particles,
        particleMaterials,
        phaseOffset: (idx * 0.17) % 1,
      });
    });

    // Orient globe initially toward current target
    globeGroup.rotation.x = cameraTargetRotRef.current.rotX;
    globeGroup.rotation.y = cameraTargetRotRef.current.rotY;
    currentGlobeRotRef.current.rotX = globeGroup.rotation.x;
    currentGlobeRotRef.current.rotY = globeGroup.rotation.y;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // IntersectionObserver to pause rendering when scrolled offscreen
    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // Raycasting & Pointer Drag / Click Interaction
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let isDragging = false;
    let dragDistance = 0;
    let prevX = 0;
    let prevY = 0;
    let lastRaycastTime = 0;

    cancelDragRef.current = () => {
      isDragging = false;
      dragDistance = 0;
    };

    const updatePointerNdc = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      return rect;
    };

    // Helper: pick only front-hemisphere marker hits that are not occluded behind the solid Earth sphere
    const findFrontHemisphereMarkerHit = () => {
      const earthHits = raycaster.intersectObject(earthMesh, false);
      const maxAllowedDist = earthHits.length > 0 ? earthHits[0].distance + 0.08 : Infinity;
      const intersects = raycaster.intersectObjects(hitMeshes, false);

      return {
        earthHit: earthHits[0] || null,
        markerHit:
          intersects.find((item) => {
            if (item.distance > maxAllowedDist) return false;
            const hitLat = item.object.userData.lat;
            const hitLon = item.object.userData.lon;
            if (typeof hitLat === 'number' && typeof hitLon === 'number') {
              const diag = computeCountryAngleToCameraDeg(
                hitLat,
                hitLon,
                globeGroup.rotation.x,
                globeGroup.rotation.y,
                {
                  x: camera.position.x,
                  y: camera.position.y,
                  z: camera.position.z,
                }
              );
              if (!diag.isFrontHemisphere || diag.dotProduct < 0.05) {
                return false;
              }
            }
            if (item.object.userData.countryKey === 'india') {
              return true;
            }
            const pid = item.object.userData.partnerId;
            return Boolean(pid && visibleIdsRef.current.has(pid));
          }) || null,
      };
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragDistance = 0;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        dragDistance += Math.abs(dx) + Math.abs(dy);
        prevX = e.clientX;
        prevY = e.clientY;

        if (dragDistance >= 4 && isRotatingRef.current) {
          isRotatingRef.current = false;
          setIsRotating(false);
        }

        const maxTilt = Math.PI / 2 - 0.04;
        cameraTargetRotRef.current.rotY += dx * 0.0065;
        cameraTargetRotRef.current.rotX = THREE.MathUtils.clamp(
          cameraTargetRotRef.current.rotX + dy * 0.005,
          -maxTilt,
          maxTilt
        );
        return;
      }

      // Throttled hover raycast on front-hemisphere partner markers
      const now = performance.now();
      if (now - lastRaycastTime < 45) return;
      lastRaycastTime = now;

      const rect = updatePointerNdc(e.clientX, e.clientY);
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        if (hoveredIdRef.current !== null) {
          setHoveredPartnerId(null);
          setHoverScreenPos(null);
        }
        return;
      }

      raycaster.setFromCamera(pointerNdc, camera);
      const { markerHit } = findFrontHemisphereMarkerHit();

      if (markerHit && markerHit.object.userData.partnerId) {
        const pid = markerHit.object.userData.partnerId as string;
        setHoveredPartnerId(pid);
        setHoverScreenPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        renderer.domElement.style.cursor = 'pointer';
      } else {
        if (hoveredIdRef.current !== null) {
          setHoveredPartnerId(null);
          setHoverScreenPos(null);
        }
        renderer.domElement.style.cursor = isDragging ? 'grabbing' : 'grab';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;

      // If pointer barely moved, treat as a click and check front-hemisphere marker or country surface hit
      if (dragDistance < 6) {
        updatePointerNdc(e.clientX, e.clientY);
        raycaster.setFromCamera(pointerNdc, camera);
        const { earthHit, markerHit } = findFrontHemisphereMarkerHit();

        if (markerHit) {
          if (markerHit.object.userData.countryKey === 'india') {
            handleResetToIndia();
            return;
          }
          const pid = markerHit.object.userData.partnerId as string;
          const found = partnersRef.current.find((p) => p.id === pid);
          if (found) {
            handleSelectPartner(found);
            return;
          }
        }

        // If clicked directly on the 3D globe surface, convert 3D hit point to local (lat, lon)
        if (earthHit) {
          const localPoint = globeGroup.worldToLocal(earthHit.point.clone());
          const { lat: clickedLat, lon: clickedLon } = vec3ToLatLon(localPoint);

          // 1. Check if click is within 12° of India Hub
          if (greatCircleDistanceDeg(clickedLat, clickedLon, INDIA_HUB_LAT, INDIA_HUB_LON) <= 12) {
            handleResetToIndia();
            return;
          }

          // 2. Check if click is within 14° of any visible trade partner
          let closestPartner: GlobalTradePartnerNode | null = null;
          let minPartnerDist = 14;
          partnersRef.current.forEach((p) => {
            if (!visibleIdsRef.current.has(p.id)) return;
            const d = greatCircleDistanceDeg(clickedLat, clickedLon, p.lat, p.lon);
            if (d < minPartnerDist) {
              minPartnerDist = d;
              closestPartner = p;
            }
          });

          if (closestPartner) {
            handleSelectPartner(closestPartner);
            return;
          }

          // 3. Check if click is within 16° of any canonical country centroid (e.g. Canada, New Zealand)
          let closestCentroid: GlobeCountryCentroid | null = null;
          let minCentroidDist = 16;
          Object.values(GLOBE_COUNTRY_CENTROIDS).forEach((c) => {
            const d = greatCircleDistanceDeg(clickedLat, clickedLon, c.lat, c.lon);
            if (d < minCentroidDist) {
              minCentroidDist = d;
              closestCentroid = c;
            }
          });

          if (closestCentroid) {
            handleFocusCountryByKey((closestCentroid as GlobeCountryCentroid).id);
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoomDistance((prev) => THREE.MathUtils.clamp(prev + e.deltaY * 0.0025, 3.1, 6.6));
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 760;
      const h = container.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => handleResize()) : null;
    resizeObserver?.observe(container);

    // Paced render loop with software WebGL fence sync guard
    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();
    const tempPoint = new THREE.Vector3();

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 8);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 8);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      if (isVisible) {
        if (isRotatingRef.current && !isDragging) {
          cameraTargetRotRef.current.rotY += delta * 0.14;
        }

        globeGroup.rotation.y = THREE.MathUtils.damp(
          globeGroup.rotation.y,
          cameraTargetRotRef.current.rotY,
          5.5,
          delta
        );
        globeGroup.rotation.x = THREE.MathUtils.damp(
          globeGroup.rotation.x,
          cameraTargetRotRef.current.rotX,
          5.5,
          delta
        );

        currentGlobeRotRef.current.rotX = globeGroup.rotation.x;
        currentGlobeRotRef.current.rotY = globeGroup.rotation.y;

        camera.position.z = THREE.MathUtils.damp(
          camera.position.z,
          zoomDistanceRef.current,
          6,
          delta
        );
        camera.lookAt(0, 0, 0);

        // Update route colors, visibility, selection dimming, and travelling particles
        const activeId = selectedIdRef.current;
        const hoverId = hoveredIdRef.current;
        const mode = displayModeRef.current;
        const visibleSet = visibleIdsRef.current;

        routeObjects.forEach((ro) => {
          const isVis = visibleSet.has(ro.partner.id);
          ro.arcMesh.visible = isVis;
          ro.markerGroup.visible = isVis;

          if (!isVis) {
            ro.particles.forEach((p) => {
              p.visible = false;
            });
            return;
          }

          const hexColor = getRouteHexColor(ro.partner, mode);
          ro.arcMaterial.color.setHex(hexColor);
          ro.arcMaterial.emissive.setHex(hexColor);
          ro.markerCoreMaterial.emissive.setHex(hexColor);
          ro.markerRingMaterial.color.setHex(hexColor);

          const isHighlighted = ro.partner.id === activeId || ro.partner.id === hoverId;
          const hasSelection = activeId !== null;

          // Dim unrelated routes when a partner is actively selected
          const targetOpacity = isHighlighted ? 0.98 : hasSelection ? 0.24 : 0.78;
          ro.arcMaterial.opacity = THREE.MathUtils.damp(
            ro.arcMaterial.opacity,
            targetOpacity,
            8,
            delta
          );
          ro.arcMaterial.emissiveIntensity = isHighlighted ? 1.25 : 0.55;

          // Subtle marker scale emphasis
          const targetScale = isHighlighted ? 1.55 : 1.0;
          const nextScale = THREE.MathUtils.damp(ro.markerGroup.scale.x, targetScale, 8, delta);
          ro.markerGroup.scale.setScalar(nextScale);

          // Animate particles along the curved 3D path
          ro.particles.forEach((pMesh, pIdx) => {
            pMesh.visible = isHighlighted || !hasSelection;
            if (!pMesh.visible) return;

            const speed = isHighlighted ? 0.34 : 0.22;
            const rawT = (elapsed * speed + ro.phaseOffset + pIdx * 0.5) % 1;
            // In 'imports' mode flow from partner -> India (1 - rawT); in 'exports' flow India -> partner (rawT)
            const t =
              mode === 'imports'
                ? 1 - rawT
                : mode === 'exports'
                ? rawT
                : pIdx === 0
                ? rawT
                : 1 - rawT;

            ro.curve.getPointAt(t, tempPoint);
            pMesh.position.copy(tempPoint);
          });
        });

        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      observer.disconnect();
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
      albedoTexture.dispose();
      roughnessTexture.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      indiaTubeGeo.dispose();
      indiaTubeMat.dispose();
      indiaRingGeo.dispose();
      indiaRingMat.dispose();
      indiaCoreGeo.dispose();
      indiaCoreMat.dispose();
      indiaHitMat.dispose();
      sharedMarkerCoreGeo.dispose();
      sharedMarkerRingGeo.dispose();
      sharedHitGeo.dispose();
      sharedParticleGeo.dispose();
      starGeo.dispose();
      starMat.dispose();
      renderer.dispose();
    };
  }, [allPartners, handleFocusCountryByKey, handleResetToIndia, handleSelectPartner, useStaticFallback]);

  const showFallback = !webglSupported || useStaticFallback;

  // Count partners per region filter for clean tab labels
  const regionCounts = useMemo(() => {
    const map: Record<TradeRegionFilter, number> = {
      All: allPartners.length,
      BRICS: 0,
      'European Union': 0,
      ASEAN: 0,
      'North America': 0,
      'Middle East': 0,
      'Asia-Pacific': 0,
      Africa: 0,
      'Latin America': 0,
    };
    allPartners.forEach((p) => {
      REGION_FILTERS.forEach((rf) => {
        if (rf !== 'All' && matchesTradeRegionFilter(p, rf)) {
          map[rf] += 1;
        }
      });
    });
    return map;
  }, [allPartners]);

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-6 lg:p-7 space-y-5 ${
        theme === 'dark'
          ? 'bg-[#070E1E] border-slate-800/90 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* 1. Section Header & Verified Merchandise Trade Summary Cards */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-slate-800/70 pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-emerald-400">
            <Globe className="w-3.5 h-3.5" />
            <span>OFFICIAL BILATERAL MERCHANDISE NETWORK · DEPARTMENT OF COMMERCE (TRADESTAT)</span>
          </div>
          <h2
            className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-slate-950'
            }`}
          >
            India&apos;s Global Trade Network
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Explore India&apos;s economic connections across the world — connecting India (highlighted in emerald &amp; gold) with 25 sovereign partners and regional blocs.
          </p>
        </div>

        {/* Compact Verified Official Merchandise Trade Summary Cards (FY 2023-24 Matching Denominator) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
          <div
            className={`px-3.5 py-2.5 rounded-xl border ${
              theme === 'dark'
                ? 'bg-[#0B1528] border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="text-[11px] text-slate-400">
              India Merchandise Exports (FY 2023–24)
            </div>
            <div className="font-mono-tabular text-base sm:text-lg font-semibold text-emerald-400 mt-0.5">
              ${INDIA_FY24_TOTAL_EXPORTS_USD_BN.toFixed(2)}B
            </div>
            <div className="text-[10px] text-slate-400 font-mono-tabular">
               Goods only · TRADESTAT Final
            </div>
          </div>

          <div
            className={`px-3.5 py-2.5 rounded-xl border ${
              theme === 'dark'
                ? 'bg-[#0B1528] border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="text-[11px] text-slate-400">
              India Merchandise Imports (FY 2023–24)
            </div>
            <div className="font-mono-tabular text-base sm:text-lg font-semibold text-amber-400 mt-0.5">
              ${INDIA_FY24_TOTAL_IMPORTS_USD_BN.toFixed(2)}B
            </div>
            <div className="text-[10px] text-slate-400 font-mono-tabular">
              Total Trade: ${INDIA_FY24_TOTAL_TRADE_USD_BN.toFixed(2)}B
            </div>
          </div>

          <div
            className={`px-3.5 py-2.5 rounded-xl border ${
              theme === 'dark'
                ? 'bg-[#0B1528] border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="text-[11px] text-slate-400">
              Merchandise Trade Balance (FY 2023–24)
            </div>
            <div className="font-mono-tabular text-base sm:text-lg font-semibold text-rose-400 mt-0.5">
              -${Math.abs(INDIA_FY24_TRADE_BALANCE_USD_BN).toFixed(2)}B
            </div>
            <div className="text-[10px] text-slate-400 font-mono-tabular">
              Formula: Exports − Imports
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Filter & Display Mode Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Region Group Filters */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Filter trade partners by region or economic bloc"
          >
            {REGION_FILTERS.map((rf) => {
              const active = regionFilter === rf;
              return (
                <button
                  key={rf}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleSelectRegionFilter(rf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : theme === 'dark'
                      ? 'bg-[#0B1528] text-slate-300 hover:text-white border border-slate-800'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{rf === 'All' ? 'All Partners' : rf}</span>
                  <span className="ml-1.5 font-mono-tabular opacity-75">
                    ({regionCounts[rf]})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Route Display Modes */}
          <div
            className={`flex items-center gap-1 p-1 rounded-lg border overflow-x-auto shrink-0 ${
              theme === 'dark'
                ? 'bg-[#0B1528] border-slate-800'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            {DISPLAY_MODES.map((m) => {
              const active = displayMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setDisplayMode(m.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Country Focus Bar (Direct 1-Click Orientation to Benchmark Countries) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" aria-label="Quick country focus controls">
          <span className="text-[11px] font-mono-tabular text-slate-400 shrink-0 mr-1">
            Focus Country:
          </span>
          {QUICK_FOCUS_COUNTRY_KEYS.map((cKey) => {
            const cInfo = GLOBE_COUNTRY_CENTROIDS[cKey];
            if (!cInfo) return null;
            const isFocused = focusedCountryKey === cKey;
            return (
              <button
                key={cKey}
                type="button"
                aria-label={`Focus globe on ${cInfo.name}`}
                onClick={() => handleFocusCountryByKey(cKey)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isFocused
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    : theme === 'dark'
                    ? 'bg-[#0B1528] text-slate-300 hover:text-white border border-slate-800/90'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cInfo.shortName}
              </button>
            );
          })}
        </div>

        {/* Error Banner if dataset failed to load */}
        {errorMsg && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchTradeNetwork(false)}
              className="px-3 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-200 hover:bg-amber-500/30 font-medium flex items-center gap-1.5 self-start sm:self-auto cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Official Dataset</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Main 12-Column Interactive 3D Globe + Partner Intelligence Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left/Center 8 Columns: Interactive 3D Earth Canvas */}
        <div className="lg:col-span-8 flex flex-col">
          <div
            data-dark-viewport="true"
            className="arth-dark-viewport relative w-full h-[460px] sm:h-[560px] lg:h-[620px] rounded-xl border border-slate-800/90 bg-[#040915] overflow-hidden select-none flex flex-col justify-between"
          >
            {/* Top Bar Inside Globe Viewport: Telemetry & Camera Controls */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-4 pt-3.5 pointer-events-none">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-mono-tabular bg-[#081226]/90 border border-slate-800 px-3 py-1.5 rounded-lg pointer-events-auto">
                <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <button
                  type="button"
                  onClick={handleResetToIndia}
                  className="font-semibold text-emerald-400 hover:underline cursor-pointer"
                  title="Focus globe on India (20.59°N, 78.96°E)"
                >
                  India Hub: 20.59°N, 78.96°E
                </button>
                <span aria-hidden="true">·</span>
                <span>
                  Showing {filteredPartners.length} of {allPartners.length} Connections
                </span>
              </div>

              {/* Interactive Globe Camera Controls */}
              <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={handleResetToIndia}
                  title="Reset view to India-centered overview"
                  className="px-2.5 py-1.5 text-xs font-medium text-emerald-300 hover:text-white bg-[#081226]/95 border border-emerald-500/40 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Reset to India</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setZoomDistance((prev) => THREE.MathUtils.clamp(prev - 0.45, 3.1, 6.6))
                  }
                  disabled={showFallback}
                  title="Zoom in on globe"
                  aria-label="Zoom in"
                  className="p-1.5 text-xs text-slate-300 hover:text-white bg-[#081226]/95 border border-slate-700/80 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setZoomDistance((prev) => THREE.MathUtils.clamp(prev + 0.45, 3.1, 6.6))
                  }
                  disabled={showFallback}
                  title="Zoom out from globe"
                  aria-label="Zoom out"
                  className="p-1.5 text-xs text-slate-300 hover:text-white bg-[#081226]/95 border border-slate-700/80 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsRotating((prev) => !prev)}
                  disabled={showFallback}
                  title={isRotating ? 'Pause globe rotation' : 'Resume globe rotation'}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#081226]/95 border border-slate-700/80 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isRotating ? (
                    <Pause className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{isRotating ? 'Pause' : 'Rotate'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUseStaticFallback((prev) => !prev)}
                  title="Switch between 3D WebGL Earth and 2D Global Trade Map"
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#081226]/95 border border-slate-700/80 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{showFallback ? '3D Earth' : '2D Map'}</span>
                </button>
              </div>
            </div>

            {/* Hover Tooltip Overlay on 3D Globe */}
            {hoveredPartner && hoverScreenPos && !showFallback && (
              <div
                style={{
                  left: Math.min(Math.max(hoverScreenPos.x + 14, 16), 460),
                  top: Math.min(Math.max(hoverScreenPos.y - 12, 56), 440),
                }}
                className="absolute z-20 pointer-events-none bg-[#081226]/95 border border-emerald-500/50 rounded-lg p-2.5 shadow-xl text-xs max-w-[250px]"
              >
                <div className="flex items-center justify-between gap-2 font-semibold text-white">
                  <span>{hoveredPartner.name}</span>
                  <span className="font-mono-tabular text-[10px] text-emerald-400">
                    {hoveredPartner.isoCode}
                  </span>
                </div>
                {hoveredPartner.dataStatus === 'verified_official' ? (
                  <div className="mt-1 space-y-0.5 font-mono-tabular text-[11px] text-slate-300">
                    <div>
                      Total Trade:{' '}
                      <strong className="text-white">
                        ${hoveredPartner.totalTradeUsdBn?.toFixed(2)}B
                      </strong>{' '}
                      ({hoveredPartner.shareOfIndiaTradePct?.toFixed(2)}%)
                    </div>
                    <div>
                      Exp: <span className="text-emerald-400">${hoveredPartner.exportsUsdBn?.toFixed(2)}B</span> · Imp:{' '}
                      <span className="text-amber-400">${hoveredPartner.importsUsdBn?.toFixed(2)}B</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] text-slate-400">
                    Illustrative Geographic Corridor (Click for details)
                  </div>
                )}
              </div>
            )}

            {/* Central 3D WebGL Canvas OR Resilient 2D World Map SVG Fallback */}
            {showFallback ? (
              <div className="relative flex-1 flex items-center justify-center p-4">
                <svg
                  viewBox="0 0 720 360"
                  className="w-full h-full max-h-[440px]"
                  role="img"
                  aria-label="2D Global Map of India's International Trade Connections"
                >
                  <rect width="720" height="360" fill="#050d1d" rx="12" />
                  {/* Simplified 2D World Polygons */}
                  {WORLD_LANDMASS_POLYGONS.map((poly) => {
                    const pts = poly.coords
                      .map(([lat, lon]) => `${((lon + 180) / 360) * 720},${((90 - lat) / 180) * 360}`)
                      .join(' ');
                    return (
                      <polygon
                        key={poly.name}
                        points={pts}
                        fill={poly.isIndia ? '#10b981' : '#0f243c'}
                        fillOpacity={poly.isIndia ? 0.85 : 0.9}
                        stroke={poly.isIndia ? '#fbbf24' : '#1e4976'}
                        strokeWidth={poly.isIndia ? '1.8' : '0.9'}
                      />
                    );
                  })}
                  {/* Curved 2D SVG Arcs from India to Filtered Partners */}
                  {filteredPartners.map((p) => {
                    const indX = ((INDIA_HUB_LON + 180) / 360) * 720;
                    const indY = ((90 - INDIA_HUB_LAT) / 180) * 360;
                    const px = ((p.lon + 180) / 360) * 720;
                    const py = ((90 - p.lat) / 180) * 360;
                    const midX = (indX + px) / 2;
                    const midY = Math.min(indY, py) - 28;
                    const isSel = selectedPartner?.id === p.id;
                    const strokeColor =
                      p.dataStatus === 'illustrative_corridor'
                        ? '#64748b'
                        : p.entityType === 'regional_aggregate'
                        ? '#a78bfa'
                        : p.isBricsMember
                        ? '#f59e0b'
                        : '#10b981';
                    return (
                      <g
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() => handleSelectPartner(p)}
                      >
                        <path
                          d={`M ${indX} ${indY} Q ${midX} ${midY} ${px} ${py}`}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={isSel ? '2.4' : '1.2'}
                          strokeOpacity={isSel ? '0.95' : '0.55'}
                        />
                        <circle
                          cx={px}
                          cy={py}
                          r={isSel ? 5.5 : 3.5}
                          fill={strokeColor}
                          stroke="#040915"
                          strokeWidth="1"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div
                ref={mountRef}
                className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
                aria-label="Interactive 3D Earth showing India's Global Trade Network"
              />
            )}

            {/* Bottom Legend & Active Selection Bar Inside Globe Frame */}
            <div className="relative z-10 px-4 pb-3.5 pointer-events-none flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 bg-[#081226]/95 border border-slate-800 px-3 py-2 rounded-lg pointer-events-auto">
                <span className="font-semibold text-slate-200">Route Legend:</span>
                {displayMode === 'balance' ? (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 inline-block" />
                      <span>India Trade Surplus (Exports &gt; Imports)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-rose-400 inline-block" />
                      <span>India Trade Deficit (Imports &gt; Exports)</span>
                    </span>
                  </>
                ) : displayMode === 'exports' ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 inline-block" />
                    <span>Indian Merchandise Export Corridors (Outward Flow)</span>
                  </span>
                ) : displayMode === 'imports' ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block" />
                    <span>Indian Merchandise Import Corridors (Inward Flow)</span>
                  </span>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 inline-block" />
                      <span>Major Bilateral</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block" />
                      <span>BRICS &amp; West Asia</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-cyan-400 inline-block" />
                      <span>ASEAN</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-violet-400 inline-block" />
                      <span>Regional Bloc (EU / ASEAN)</span>
                    </span>
                  </>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 inline-block" />
                  <span>Illustrative Link</span>
                </span>
              </div>

              <div className="text-[11px] text-slate-400 bg-[#081226]/95 border border-slate-800 px-3 py-1.5 rounded-lg font-mono-tabular">
                Drag to rotate · Scroll to zoom · Click marker or partner row
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Selected Partner Intelligence Card + Searchable Partner Directory */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          {/* Mobile Collapsible Drawer Toggle */}
          <div className="flex lg:hidden items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Partner Details &amp; Search Directory ({filteredPartners.length})
            </span>
            <button
              type="button"
              onClick={() => setMobileSheetOpen((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg bg-[#0B1528] border border-slate-700 text-xs text-emerald-400 flex items-center gap-1.5 cursor-pointer"
            >
              <span>{mobileSheetOpen ? 'Collapse Panel' : 'Expand Panel'}</span>
              {mobileSheetOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {mobileSheetOpen && (
            <>
              {/* A. Selected Partner Intelligence Card */}
              {selectedPartner ? (
                <div
                  className={`rounded-xl border p-4 space-y-3.5 ${
                    theme === 'dark'
                      ? 'bg-[#0B1528] border-slate-800 text-slate-100'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono-tabular text-emerald-400">
                        <span>[{selectedPartner.flagCode}]</span>
                        <span>·</span>
                        <span>
                          {selectedPartner.entityType === 'regional_aggregate'
                            ? 'REGIONAL TRADE BLOC AGGREGATE'
                            : 'BILATERAL COUNTRY PARTNER'}
                        </span>
                        {selectedPartner.isBricsMember && (
                          <>
                            <span>·</span>
                            <span className="text-amber-400">BRICS MEMBER</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-lg font-display font-semibold tracking-tight mt-0.5">
                        India ↔ {selectedPartner.name}
                      </h3>
                      <div className="text-[11px] text-slate-400 font-mono-tabular mt-0.5">
                        Coords: {selectedPartner.lat.toFixed(2)}°N, {selectedPartner.lon.toFixed(2)}°E · Period:{' '}
                        {selectedPartner.reportingPeriod}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetToIndia}
                      title="Clear selection and reset to India overview"
                      className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Verified Bilateral Metrics OR Illustrative Corridor Disclosure */}
                  {selectedPartner.dataStatus === 'verified_official' &&
                  selectedPartner.totalTradeUsdBn !== null &&
                  selectedPartner.exportsUsdBn !== null &&
                  selectedPartner.importsUsdBn !== null &&
                  selectedPartner.tradeBalanceUsdBn !== null ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2.5 font-mono-tabular">
                        <div
                          className={`p-2.5 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-[#060C1A] border-slate-800/90'
                              : 'bg-white border-[#CBD5E1]'
                          }`}
                        >
                          <div className="text-[10px] text-slate-400">
                            Total Merchandise Trade
                          </div>
                          <div
                            className={`text-base font-semibold mt-0.5 ${
                              theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                            }`}
                          >
                            ${selectedPartner.totalTradeUsdBn.toFixed(2)}B
                          </div>
                          <div className="text-[10px] text-cyan-400">
                            {selectedPartner.shareOfIndiaTradePct?.toFixed(2)}% of India Total (${INDIA_FY24_TOTAL_TRADE_USD_BN}B)
                          </div>
                        </div>

                        <div
                          className={`p-2.5 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-[#060C1A] border-slate-800/90'
                              : 'bg-white border-[#CBD5E1]'
                          }`}
                        >
                          <div className="text-[10px] text-slate-400">
                            Bilateral Trade Balance
                          </div>
                          <div
                            className={`text-base font-semibold mt-0.5 ${
                              selectedPartner.tradeBalanceUsdBn >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {selectedPartner.tradeBalanceUsdBn >= 0 ? '+$' : '-$'}
                            {Math.abs(selectedPartner.tradeBalanceUsdBn).toFixed(2)}B
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {selectedPartner.tradeBalanceUsdBn >= 0
                              ? 'India Trade Surplus'
                              : 'India Trade Deficit'}
                          </div>
                        </div>

                        <div
                          className={`p-2.5 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-[#060C1A] border-slate-800/90'
                              : 'bg-white border-[#CBD5E1]'
                          }`}
                        >
                          <div className="text-[10px] text-slate-400">
                            Indian Exports to {selectedPartner.shortName}
                          </div>
                          <div className="text-sm font-semibold text-emerald-400 mt-0.5">
                            ${selectedPartner.exportsUsdBn.toFixed(2)}B
                          </div>
                        </div>

                        <div
                          className={`p-2.5 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-[#060C1A] border-slate-800/90'
                              : 'bg-white border-[#CBD5E1]'
                          }`}
                        >
                          <div className="text-[10px] text-slate-400">
                            Indian Imports from {selectedPartner.shortName}
                          </div>
                          <div className="text-sm font-semibold text-amber-400 mt-0.5">
                            ${selectedPartner.importsUsdBn.toFixed(2)}B
                          </div>
                        </div>
                      </div>

                      {/* Proportional Export vs Import Split Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono-tabular text-slate-400">
                          <span>
                            Exports Share:{' '}
                            {(
                              (selectedPartner.exportsUsdBn / selectedPartner.totalTradeUsdBn) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                          <span>
                            Imports Share:{' '}
                            {(
                              (selectedPartner.importsUsdBn / selectedPartner.totalTradeUsdBn) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                          <div
                            style={{
                              width: `${
                                (selectedPartner.exportsUsdBn / selectedPartner.totalTradeUsdBn) *
                                100
                              }%`,
                            }}
                            className="bg-emerald-500 h-full"
                          />
                          <div
                            style={{
                              width: `${
                                (selectedPartner.importsUsdBn / selectedPartner.totalTradeUsdBn) *
                                100
                              }%`,
                            }}
                            className="bg-amber-500 h-full"
                          />
                        </div>
                      </div>

                      {selectedPartner.entityType === 'regional_aggregate' && (
                        <div className="p-2 rounded-lg bg-violet-950/30 border border-violet-500/40 text-[11px] text-violet-200">
                          <strong>Regional Aggregate Guardrail:</strong> This represents the collective{' '}
                          {selectedPartner.shortName} total and is never added to individual member-country figures.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-slate-300 space-y-1.5">
                      <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>Illustrative Geographic Corridor</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        This connection visualizes the geographic trade corridor between India and{' '}
                        {selectedPartner.name}. Numeric values are not mixed into the FY 2023–24 top-22 verified bilateral table.
                      </p>
                    </div>
                  )}

                  {/* Commodity Basket & Relationship Summary */}
                  <div className="space-y-1.5 text-xs border-t border-slate-800/80 pt-2.5">
                    <div>
                      <span className="text-slate-400">Key Exports from India: </span>
                      <span className="text-slate-200">{selectedPartner.keyExportsFromIndia}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Key Imports to India: </span>
                      <span className="text-slate-200">{selectedPartner.keyImportsToIndia}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                      {selectedPartner.relationshipNote}
                    </p>
                  </div>

                  {/* Source & Verification Footer inside Partner Card */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono-tabular">
                      Source: MoCI · TRADESTAT
                    </span>
                    <a
                      href={selectedPartner.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Verify on TRADESTAT</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : null}

              {/* B. Searchable Partner Directory List */}
              <div
                className={`rounded-xl border p-3.5 flex-1 flex flex-col min-h-[250px] max-h-[340px] ${
                  theme === 'dark'
                    ? 'bg-[#0B1528] border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {/* Search Input */}
                <div className="relative mb-2.5">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search country, bloc, or commodity..."
                    aria-label="Search trade partners"
                    className={`w-full pl-8 pr-7 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-emerald-500 ${
                      theme === 'dark'
                        ? 'bg-[#060C1A] border-slate-700 text-slate-100 placeholder:text-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search query"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Partner Rows */}
                {isLoading ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-mono-tabular">
                    Loading official TRADESTAT partner network...
                  </div>
                ) : filteredPartners.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-xs text-slate-400 space-y-2">
                    <p>No trade partners match &ldquo;{searchQuery}&rdquo; in {regionFilter}.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setRegionFilter('All');
                      }}
                      className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 pr-1">
                    {filteredPartners.map((partner) => {
                      const isSel = selectedPartner?.id === partner.id;
                      return (
                        <button
                          key={partner.id}
                          type="button"
                          onClick={() => handleSelectPartner(partner)}
                          className={`w-full py-2 px-2.5 text-left transition-colors flex items-center justify-between gap-2 rounded-md cursor-pointer ${
                            isSel
                              ? theme === 'dark'
                                ? 'bg-emerald-500/15 text-white'
                                : 'bg-emerald-50 text-[#0F172A] border border-emerald-200'
                              : theme === 'dark'
                              ? 'hover:bg-slate-800/50 text-slate-300'
                              : 'hover:bg-slate-100 text-[#172033]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-medium truncate">
                              <span className="font-mono-tabular text-[10px] text-slate-400">
                                [{partner.flagCode}]
                              </span>
                              <span className="truncate">{partner.shortName}</span>
                              {partner.entityType === 'regional_aggregate' && (
                                <span className="text-[10px] text-violet-400 font-mono-tabular shrink-0">
                                  · Bloc
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {partner.primaryRegion}
                              {partner.isBricsMember ? ' · BRICS' : ''}
                            </div>
                          </div>

                          <div className="text-right font-mono-tabular shrink-0">
                            {partner.dataStatus === 'verified_official' &&
                            partner.totalTradeUsdBn !== null &&
                            partner.tradeBalanceUsdBn !== null ? (
                              <>
                                <div className="text-xs font-semibold text-slate-100">
                                  ${partner.totalTradeUsdBn.toFixed(2)}B
                                </div>
                                <div
                                  className={`text-[10px] ${
                                    partner.tradeBalanceUsdBn >= 0
                                      ? 'text-emerald-400'
                                      : 'text-rose-400'
                                  }`}
                                >
                                  {partner.tradeBalanceUsdBn >= 0 ? '+' : '-'}$
                                  {Math.abs(partner.tradeBalanceUsdBn).toFixed(2)}B
                                </div>
                              </>
                            ) : (
                              <div className="text-[10px] text-slate-400">
                                Corridor Link
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. Concise Data-Source, Reference-Period & Methodology Footer */}
      <div
        className={`pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
          theme === 'dark' ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span>
            <strong className="text-slate-200">Official Source:</strong> Ministry of Commerce &amp; Industry — Department of Commerce TRADESTAT Export Import Data Bank
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">
            Reference Period: FY 2023–24 Final Annual Bilateral Merchandise Series (USD Billion)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <a
            href="https://tradestat.commerce.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline font-medium flex items-center gap-1"
          >
            <span>Open TRADESTAT Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {onOpenMerchandiseTradePage && (
            <button
              type="button"
              onClick={onOpenMerchandiseTradePage}
              className="text-cyan-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Monthly Merchandise Trade Series (Sep 2026)</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
