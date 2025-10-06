import { useState, useEffect } from "react";

const NotificationDebugger = () => {
  const [permissionStatus, setPermissionStatus] = useState("unknown");
  const [supportStatus, setSupported] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);

  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo((prev) => [...prev, `${timestamp}: ${message}`]);
  };

  useEffect(() => {
    const checkNotificationSupport = () => {
      addDebugLog("🔍 Checking notification support...");

      // Check if notifications are supported
      if (!("Notification" in window)) {
        setSupported(false);
        addDebugLog("❌ Browser does not support notifications");
        return;
      }

      setSupported(true);
      addDebugLog("✅ Browser supports notifications");

      // Check current permission
      const permission = Notification.permission;
      setPermissionStatus(permission);
      addDebugLog(`📋 Current permission: ${permission}`);

      // Check if we're on HTTPS (required for service workers)
      const isSecure =
        location.protocol === "https:" || location.hostname === "localhost";
      addDebugLog(`🔒 Secure context: ${isSecure ? "Yes" : "No"}`);

      // Check if service worker is supported
      if ("serviceWorker" in navigator) {
        addDebugLog("✅ Service Worker supported");

        // Check if service worker is controlling
        if (navigator.serviceWorker.controller) {
          addDebugLog("✅ Service Worker is controlling this page");
        } else {
          addDebugLog("⚠️ Service Worker is not controlling this page");
        }
      } else {
        addDebugLog("❌ Service Worker not supported");
      }

      // Check macOS specific information
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      if (isMac) {
        addDebugLog(
          "🍎 macOS detected - check System Preferences > Notifications & Focus"
        );
      }
    };

    checkNotificationSupport();
  }, []);

  const requestPermission = async () => {
    addDebugLog("🙋 Requesting notification permission...");

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === "granted") {
        addDebugLog("✅ Notification permission granted!");
      } else if (permission === "denied") {
        addDebugLog("❌ Notification permission denied");
        addDebugLog(
          "💡 To fix: Click the lock icon in address bar → Allow notifications"
        );
      } else {
        addDebugLog("⏸️ Notification permission dismissed");
      }
    } catch (error) {
      addDebugLog(`❌ Error requesting permission: ${error.message}`);
    }
  };

  const testBasicNotification = () => {
    addDebugLog("🧪 Testing basic notification...");

    if (Notification.permission !== "granted") {
      addDebugLog("❌ Cannot test - permission not granted");
      return;
    }

    try {
      const notification = new Notification("Test Notification", {
        body: "This is a test from your React app",
        icon: "/vite.svg",
        tag: "test-notification",
      });

      notification.onclick = () => {
        addDebugLog("👆 Notification clicked!");
        notification.close();
      };

      notification.onshow = () => {
        addDebugLog("✅ Basic notification displayed!");
      };

      notification.onerror = (error) => {
        addDebugLog(`❌ Notification error: ${error}`);
      };
    } catch (error) {
      addDebugLog(`❌ Error creating notification: ${error.message}`);
    }
  };

  const testServiceWorkerNotification = async () => {
    addDebugLog("🧪 Testing service worker notification...");

    if (!("serviceWorker" in navigator)) {
      addDebugLog("❌ Service Worker not supported");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      if (Notification.permission !== "granted") {
        addDebugLog("❌ Cannot test - permission not granted");
        return;
      }

      await registration.showNotification("Service Worker Test", {
        body: "This notification came from the service worker",
        icon: "/vite.svg",
        badge: "/react.svg",
        tag: "sw-test",
        requireInteraction: false,
      });

      addDebugLog("✅ Service worker notification sent!");
    } catch (error) {
      addDebugLog(`❌ Service worker notification error: ${error.message}`);
    }
  };

  const checkMacOSSettings = () => {
    addDebugLog("🍎 macOS Notification Troubleshooting:");
    addDebugLog("1. Open System Preferences > Notifications & Focus");
    addDebugLog("2. Find your browser (Chrome/Safari/Firefox) in the list");
    addDebugLog("3. Make sure 'Allow Notifications' is checked");
    addDebugLog(
      "4. Check that notification style is set to 'Alerts' or 'Banners'"
    );
    addDebugLog("5. Make sure 'Show in Notification Center' is enabled");
    addDebugLog("6. Try quitting and reopening your browser");
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-bold mb-4 text-white">
        🔔 Notification Debugger
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-sm">
          <p className="text-gray-300">
            Support:{" "}
            <span className={supportStatus ? "text-green-400" : "text-red-400"}>
              {supportStatus ? "Yes" : "No"}
            </span>
          </p>
          <p className="text-gray-300">
            Permission:{" "}
            <span
              className={
                permissionStatus === "granted"
                  ? "text-green-400"
                  : permissionStatus === "denied"
                  ? "text-red-400"
                  : "text-yellow-400"
              }
            >
              {permissionStatus}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={requestPermission}
          className="btn btn-sm btn-primary"
          disabled={permissionStatus === "granted"}
        >
          Request Permission
        </button>
        <button
          onClick={testBasicNotification}
          className="btn btn-sm btn-secondary"
          disabled={permissionStatus !== "granted"}
        >
          Test Basic Notification
        </button>
        <button
          onClick={testServiceWorkerNotification}
          className="btn btn-sm btn-accent"
          disabled={permissionStatus !== "granted"}
        >
          Test Service Worker
        </button>
        <button onClick={checkMacOSSettings} className="btn btn-sm btn-outline">
          macOS Help
        </button>
        <button
          onClick={() => setDebugInfo([])}
          className="btn btn-sm btn-outline"
        >
          Clear Logs
        </button>
      </div>

      <div className="bg-gray-900 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
        {debugInfo.length === 0 ? (
          <p className="text-gray-500">No debug information yet...</p>
        ) : (
          debugInfo.map((log, index) => (
            <p key={index} className="text-gray-300 mb-1">
              {log}
            </p>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDebugger;
