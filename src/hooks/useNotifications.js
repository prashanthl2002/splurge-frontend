import { useEffect, useState } from "react";
 
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;
 
export function useNotifications() {
  const [notifState, setNotifState] = useState("default"); // default | granted | denied | unsupported
  const [isOneSignalReady, setIsOneSignalReady] = useState(false);
 
  // ─── Step 1: Load OneSignal SDK and initialise ─────────────────────────────
  useEffect(() => {
    if (!ONESIGNAL_APP_ID) {
      console.warn("VITE_ONESIGNAL_APP_ID not set — notifications disabled.");
      return;
    }
 
    // Inject OneSignal SDK script dynamically
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    document.head.appendChild(script);
 
    script.onload = () => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal) => {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          // Shows the native browser permission prompt automatically
          // Set to false if you want to use your own custom prompt button
          promptOptions: {
            slidedown: {
              prompts: [
                {
                  type: "push",
                  autoPrompt: false, // We control when to show it (see requestPermission below)
                  text: {
                    actionMessage: "Get daily reminders to log your expenses 💸",
                    acceptButton: "Allow",
                    cancelButton: "Maybe Later",
                  },
                },
              ],
            },
          },
          // Disable the default bell icon — we have our own UI
          notifyButton: { enable: false },
          welcomeNotification: {
            title: "Splurge Notifications On! 🎉",
            message: "You'll get daily reminders to log your expenses.",
          },
        });
 
        setIsOneSignalReady(true);
 
        // Sync current permission state
        const permission = await OneSignal.Notifications.permission;
        setNotifState(permission ? "granted" : "default");
 
        // Listen for permission changes
        OneSignal.Notifications.addEventListener("permissionChange", (granted) => {
          setNotifState(granted ? "granted" : "denied");
        });
      });
    };
 
    return () => {
      // Cleanup script if component unmounts
      document.head.removeChild(script);
    };
  }, []);
 
  // ─── Step 2: Expose a function to request permission ──────────────────────
  // Call this when user clicks your "Enable Notifications" button
  const requestPermission = async () => {
    if (!isOneSignalReady || !window.OneSignalDeferred) return;
 
    window.OneSignalDeferred.push(async (OneSignal) => {
      // Shows OneSignal's slidedown prompt first, then browser native prompt
      await OneSignal.Slidedown.promptPush();
    });
  };
 
  // ─── Step 3: Check if browser supports push at all ────────────────────────
  const isSupported = "Notification" in window && "serviceWorker" in navigator;
 
  return {
    notifState,       // "default" | "granted" | "denied"
    isSupported,      // false on iOS Safari < 16.4, some older browsers
    isOneSignalReady,
    requestPermission,
  };
}