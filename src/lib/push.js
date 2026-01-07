// Push Notifications via OneSignal
// https://onesignal.com

import { supabase } from './supabase';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '';

let OneSignal = null;

export async function initPushNotifications() {
  if (!ONESIGNAL_APP_ID) {
    console.log('OneSignal not configured');
    return;
  }

  try {
    // Load OneSignal SDK
    if (!window.OneSignal) {
      await loadOneSignalScript();
    }

    OneSignal = window.OneSignal || [];

    OneSignal.push(function() {
      OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false, // We'll use our own UI
        },
      });
    });

    console.log('OneSignal initialized');
  } catch (err) {
    console.error('Failed to init OneSignal:', err);
  }
}

function loadOneSignalScript() {
  return new Promise((resolve, reject) => {
    if (document.getElementById('onesignal-sdk')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'onesignal-sdk';
    script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function requestPushPermission(userId) {
  if (!OneSignal) {
    console.log('OneSignal not ready');
    return false;
  }

  try {
    // Request permission
    const permission = await new Promise((resolve) => {
      OneSignal.push(function() {
        OneSignal.showNativePrompt();
        OneSignal.on('subscriptionChange', function(isSubscribed) {
          resolve(isSubscribed);
        });
      });
    });

    if (permission) {
      // Get player ID and save to database
      const playerId = await getPlayerId();
      if (playerId && userId) {
        await supabase.from('user_settings').upsert({
          user_id: userId,
          onesignal_player_id: playerId,
          push_enabled: true,
        }, { onConflict: 'user_id' });
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error('Push permission error:', err);
    return false;
  }
}

function getPlayerId() {
  return new Promise((resolve) => {
    OneSignal.push(function() {
      OneSignal.getUserId(function(userId) {
        resolve(userId);
      });
    });
  });
}

export async function disablePush(userId) {
  if (userId) {
    await supabase.from('user_settings').update({
      push_enabled: false,
    }).eq('user_id', userId);
  }

  if (OneSignal) {
    OneSignal.push(function() {
      OneSignal.setSubscription(false);
    });
  }
}

export async function isPushEnabled() {
  if (!OneSignal) return false;

  return new Promise((resolve) => {
    OneSignal.push(function() {
      OneSignal.isPushNotificationsEnabled(function(isEnabled) {
        resolve(isEnabled);
      });
    });
  });
}

