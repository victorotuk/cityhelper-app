/**
 * GPS-based trip detection for mileage tracking.
 * Uses speed threshold: >15 mph = driving, <10 mph = stopped.
 * Distance from Haversine between track points.
 */
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { APP_CONFIG } from './config';

const SPEED_THRESHOLD_MPH = APP_CONFIG.mileage?.speedThresholdMph ?? 15;
const STOPPED_THRESHOLD_MPH = 10;
const MIN_TRIP_DURATION_MS = (APP_CONFIG.mileage?.minTripDurationMinutes ?? 2) * 60 * 1000;
const STOPPED_DURATION_MS = 90 * 1000; // 1.5 min stopped = trip end

const MPS_TO_MPH = 2.23694;

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function requestLocationPermission() {
  if (Capacitor.getPlatform() === 'web') {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(() => resolve(true), () => resolve(false), { enableHighAccuracy: true });
    });
  }
  try {
    const perm = await Geolocation.checkPermissions();
    if (perm.location === 'granted') return true;
    const req = await Geolocation.requestPermissions();
    return req.location === 'granted';
  } catch {
    return false;
  }
}

export function createMileageTracker({ onTripEnd, onError }) {
  let watchId = null;
  let tripPoints = [];
  let tripStartTime = null;
  let lastMovingTime = null;
  let state = 'idle'; // idle | moving | trip

  async function startWatching() {
    return Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (p, err) => {
        if (err) onError?.(err);
        else if (p) handlePosition(p);
      }
    );
  }

  function finishTrip() {
    if (tripPoints.length < 2 || !tripStartTime) return;
    const duration = Date.now() - tripStartTime;
    if (duration < MIN_TRIP_DURATION_MS) return;

    let distanceKm = 0;
    for (let i = 1; i < tripPoints.length; i++) {
      const a = tripPoints[i - 1];
      const b = tripPoints[i];
      distanceKm += haversineKm(a.lat, a.lon, b.lat, b.lon);
    }
    if (distanceKm < 0.1) return;

    onTripEnd?.({
      distance_km: Math.round(distanceKm * 100) / 100,
      start_time: new Date(tripStartTime).toISOString(),
      end_time: new Date().toISOString(),
      start_lat: tripPoints[0]?.lat,
      start_lng: tripPoints[0]?.lon,
      end_lat: tripPoints[tripPoints.length - 1]?.lat,
      end_lng: tripPoints[tripPoints.length - 1]?.lon,
    });
    tripPoints = [];
    tripStartTime = null;
    lastMovingTime = null;
    state = 'idle';
  }

  function handlePosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    let speedMph = position.coords.speed != null ? position.coords.speed * MPS_TO_MPH : null;
    const now = Date.now();

    if (speedMph == null && tripPoints.length >= 1) {
      const last = tripPoints[tripPoints.length - 1];
      const dtSec = (now - last.t) / 1000;
      if (dtSec >= 3) {
        const distKm = haversineKm(last.lat, last.lon, lat, lon);
        speedMph = (distKm / 1.60934) / (dtSec / 3600);
      }
    }

    if (speedMph != null && speedMph >= SPEED_THRESHOLD_MPH) {
      lastMovingTime = now;
      if (state === 'idle') {
        state = 'trip';
        tripStartTime = tripPoints.length > 0 ? tripPoints[0].t : now;
        tripPoints = tripPoints.length > 0 ? [...tripPoints, { lat, lon, t: now }] : [{ lat, lon, t: now }];
      } else if (state === 'trip') {
        tripPoints.push({ lat, lon, t: now });
      }
    } else if (state === 'trip') {
      tripPoints.push({ lat, lon, t: now });
      if (speedMph != null && speedMph < STOPPED_THRESHOLD_MPH) {
        if (!lastMovingTime) lastMovingTime = now;
        if (now - lastMovingTime >= STOPPED_DURATION_MS) {
          finishTrip();
        }
      }
    } else if (state === 'idle') {
      tripPoints = tripPoints.length >= 5 ? tripPoints.slice(-4) : tripPoints;
      tripPoints.push({ lat, lon, t: now });
    }
  }

  return {
    async start() {
      if (watchId != null) return;
      state = 'idle';
      tripPoints = [];
      tripStartTime = null;
      lastMovingTime = null;
      watchId = await startWatching();
    },
    async stop() {
      if (watchId != null) {
        if (state === 'trip') finishTrip();
        await Geolocation.clearWatch({ id: watchId });
        watchId = null;
      }
    },
    getState: () => state,
  };
}
