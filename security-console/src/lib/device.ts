const DEVICE_ID_KEY = "aegiszero.deviceFingerprint";

/** A stable per-browser identifier, persisted locally, used as the device fingerprint. */
export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getDeviceName(): string {
  if (typeof window === "undefined") return "Unknown device";
  const ua = window.navigator.userAgent;
  if (ua.includes("Edg/")) return "Edge on " + platformLabel();
  if (ua.includes("Chrome/")) return "Chrome on " + platformLabel();
  if (ua.includes("Firefox/")) return "Firefox on " + platformLabel();
  if (ua.includes("Safari/")) return "Safari on " + platformLabel();
  return "Browser on " + platformLabel();
}

function platformLabel(): string {
  const platform = window.navigator.platform || "";
  if (platform.includes("Win")) return "Windows";
  if (platform.includes("Mac")) return "macOS";
  if (platform.includes("Linux")) return "Linux";
  return platform || "Unknown OS";
}
