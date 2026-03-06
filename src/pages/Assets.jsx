import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Plus, Package } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { requestLocationPermission, createMileageTracker } from '../lib/mileageTracking';
import TripAssignModal from './assets/TripAssignModal';
import MileagePreferenceCard from './assets/MileagePreferenceCard';
import TripList from './assets/TripList';
import AssetList from './assets/AssetList';
import AssetForm from './assets/AssetForm';

const isNative = Capacitor.getPlatform() !== 'web';

const emptyForm = {
  name: '',
  description: '',
  category: 'other',
  value_estimate: '',
  location: '',
  notes: '',
  photo: null,
  current_mileage: '',
  last_mileage_update: '',
};

export default function Assets() {
  const { user } = useAuthStore();
  const [assets, setAssets] = useState([]);
  const [trips, setTrips] = useState([]);
  const [mileagePreference, setMileagePreference] = useState('gps_maps');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [pendingTrip, setPendingTrip] = useState(null);
  const [assignVehicle, setAssignVehicle] = useState('');
  const [form, setForm] = useState(emptyForm);
  const trackerRef = useRef(null);

  const vehicles = assets.filter((a) => a.category === 'vehicle');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('assets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('mileage_trips').select('*, assets(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('user_settings').select('mileage_preference').eq('user_id', user.id).single(),
    ])
      .then(([assetsRes, tripsRes, settingsRes]) => {
        setAssets(assetsRes.data || []);
        setTrips(tripsRes.data || []);
        setMileagePreference(settingsRes?.data?.mileage_preference || 'gps_maps');
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!isNative || !user || !vehicles.length) return;
    const useGps = mileagePreference === 'gps_maps' || mileagePreference === 'obd';
    if (!useGps) return;

    const tracker = createMileageTracker({
      onTripEnd: (trip) => setPendingTrip(trip),
      onError: (e) => console.warn('[Mileage]', e),
    });
    trackerRef.current = tracker;

    let mounted = true;
    requestLocationPermission().then((ok) => {
      if (!mounted || !ok) return;
      tracker.start().then(() => setTrackingActive(true));
    });
    return () => {
      mounted = false;
      tracker.stop().then(() => setTrackingActive(false));
      trackerRef.current = null;
    };
  }, [user, vehicles.length, mileagePreference]);

  const saveMileagePreference = async (pref) => {
    setMileagePreference(pref);
    await supabase.from('user_settings').upsert(
      { user_id: user.id, mileage_preference: pref, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    let photoUrl = null;
    if (form.photo && form.photo.size < 2 * 1024 * 1024) {
      photoUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(form.photo);
      });
    }
    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      description: (form.description || '').trim() || null,
      category: form.category,
      value_estimate: (form.value_estimate || '').trim() || null,
      location: (form.location || '').trim() || null,
      notes: (form.notes || '').trim() || null,
      photo_url: photoUrl,
    };
    if (form.category === 'vehicle' && form.current_mileage) {
      payload.current_mileage = parseInt(form.current_mileage, 10) || null;
      payload.last_mileage_update = form.last_mileage_update || new Date().toISOString().slice(0, 10);
    }
    const { error } = await supabase.from('assets').insert(payload);
    if (error) {
      alert('Error: ' + error.message);
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    const { data } = await supabase.from('assets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setAssets(data || []);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this asset?')) return;
    await supabase.from('assets').delete().eq('id', id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAssignTrip = async (e) => {
    e.preventDefault();
    if (!pendingTrip) return;
    const assetId = assignVehicle || null;
    const { error } = await supabase.from('mileage_trips').insert({
      user_id: user.id,
      asset_id: assetId,
      distance_km: pendingTrip.distance_km,
      source: mileagePreference === 'obd' ? 'obd' : 'gps_maps',
      start_time: pendingTrip.start_time,
      end_time: pendingTrip.end_time,
      start_lat: pendingTrip.start_lat,
      start_lng: pendingTrip.start_lng,
      end_lat: pendingTrip.end_lat,
      end_lng: pendingTrip.end_lng,
    });
    if (error) {
      alert('Error: ' + error.message);
      return;
    }
    if (assetId) {
      const asset = assets.find((a) => a.id === assetId);
      if (asset && asset.current_mileage != null) {
        await supabase
          .from('assets')
          .update({
            current_mileage: (asset.current_mileage || 0) + Math.round(pendingTrip.distance_km),
            last_mileage_update: new Date().toISOString().slice(0, 10),
          })
          .eq('id', assetId);
      }
    }
    setPendingTrip(null);
    setAssignVehicle('');
    const { data } = await supabase.from('mileage_trips').select('*, assets(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
    setTrips(data || []);
    const { data: assetsData } = await supabase.from('assets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setAssets(assetsData || []);
  };

  return (
    <div className="settings-page">
      <TripAssignModal
        pendingTrip={pendingTrip}
        assignVehicle={assignVehicle}
        setAssignVehicle={setAssignVehicle}
        vehicles={vehicles}
        onAssign={handleAssignTrip}
        onDismiss={() => { setPendingTrip(null); setAssignVehicle(''); }}
      />

      <PageHeader backTo="/settings" title="Asset Inventory" icon={<Package size={24} />} />

      <main className="settings-main">
        <div className="settings-container">
          <p className="section-desc">Track your assets with photos and notes.</p>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              {isNative && vehicles.length > 0 && (
                <>
                  <MileagePreferenceCard
                    mileagePreference={mileagePreference}
                    saveMileagePreference={saveMileagePreference}
                    trackingActive={trackingActive}
                  />
                  <div className="setting-card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--space-sm)', fontSize: '1rem' }}>Trip log</h3>
                    <TripList trips={trips} />
                  </div>
                </>
              )}

              {!showForm && <AssetList assets={assets} onDelete={handleDelete} />}

              {showForm ? (
                <AssetForm
                  form={form}
                  setForm={setForm}
                  onSave={handleSave}
                  onCancel={() => setShowForm(false)}
                />
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
                  <Plus size={18} /> Add Asset
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
