import { useEffect, useState } from "react";

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

// ── Module-level guard — survives Strict Mode double mount ──────────────────
let sdkInitialized = false;

export function useNotifications() {
  const [notifState, setNotifState] = useState("default");
  const [isOneSignalReady, setIsOneSignalReady] = useState(false);

  useEffect(() => {
    if (!ONESIGNAL_APP_ID) {
      console.warn("VITE_ONESIGNAL_APP_ID not set — notifications disabled.");
      return;
    }

    // If SDK already loaded (Strict Mode second mount), just sync state
    if (sdkInitialized) {
      setIsOneSignalReady(true);
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push((OneSignal) => {
        // FIX 3: permission is a plain property, not a promise
        const permission = OneSignal.Notifications.permission;
        setNotifState(permission ? "granted" : "default");
      });
      return;
    }

    sdkInitialized = true;

    // Only inject script once
    if (!document.querySelector('script[src*="OneSignalSDK.page.js"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      document.head.appendChild(script);
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          promptOptions: {
            slidedown: {
              prompts: [
                {
                  type: "push",
                  // FIX 2: was false — must be true OR we use native prompt directly
                  // keeping false since we call requestPermission manually, 
                  // but switching to native browser prompt instead of slidedown
                  autoPrompt: false,
                  text: {
                    actionMessage: "Get daily reminders to log your expenses 💸",
                    acceptButton: "Allow",
                    cancelButton: "Maybe Later",
                  },
                },
              ],
            },
          },
          notifyButton: { enable: false },
          welcomeNotification: {
            title: "Splurge Notifications On! 🎉",
            message: "You'll get daily reminders to log your expenses.",
          },
        });

        setIsOneSignalReady(true);

        // FIX 3: no await — it's a plain boolean property
        const permission = OneSignal.Notifications.permission;
        setNotifState(permission ? "granted" : "default");

        OneSignal.Notifications.addEventListener("permissionChange", (granted) => {
          setNotifState(granted ? "granted" : "denied");
        });

      } catch (err) {
        // "SDK already initialized" won't crash the app now
        console.warn("OneSignal init warning:", err.message);
        setIsOneSignalReady(true);
      }
    });

    // FIX 4: don't remove script on cleanup — OneSignal needs it alive
    // No cleanup return here intentionally
  }, []);

  const requestPermission = async () => {
    if (!isOneSignalReady) return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        // FIX 2: use native browser prompt — more reliable than slidedown
        // slidedown requires autoPrompt:true to work correctly
        await OneSignal.Notifications.requestPermission();
      } catch (err) {
        console.warn("Permission request failed:", err.message);
      }
    });
  };

  const isSupported = "Notification" in window && "serviceWorker" in navigator;

  return {
    notifState,
    isSupported,
    isOneSignalReady,
    requestPermission,
  };
}