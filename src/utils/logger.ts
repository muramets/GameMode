const nativeLog = console.log;
const nativeWarn = console.warn;
const nativeError = console.error;

const STORAGE_KEY = "debugLogs";

function getDebugState(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
        return false;
    }
}

let debugLogs = getDebugState();

// Check for dev environment roughly (vite specific)
if (import.meta.env.DEV) {
    // We don't force it to true here to respect the toggle, 
    // but if you want to default to true in dev if not set:
    if (localStorage.getItem(STORAGE_KEY) === null) {
        debugLogs = true;
        localStorage.setItem(STORAGE_KEY, "true");
        debug("Debug logs automatically enabled in dev environment");
    }
}

export function toggleDebugLogs(): void {
    debugLogs = !debugLogs;
    info(`Debug logs ${debugLogs ? "enabled" : "disabled"}`);
    localStorage.setItem(STORAGE_KEY, String(debugLogs));
}

// Expose toggle globally for easy access in console
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).toggleDebugLogs = toggleDebugLogs;

function info(...args: unknown[]): void {
    nativeLog(
        "%cINFO",
        "background:#4CAF50;color: #111;padding:0 5px;border-radius:10px",
        ...args
    );
}

function warn(...args: unknown[]): void {
    nativeWarn(
        "%cWRN",
        "background:#FFC107;color: #111;padding:0 5px;border-radius:10px",
        ...args
    );
}

function error(...args: unknown[]): void {
    nativeError(
        "%cERR",
        "background:#F44336;color: #111;padding:0 5px;border-radius:10px",
        ...args
    );
}

function debug(...args: unknown[]): void {
    if (!debugLogs) return;
    nativeLog(
        "%cDEBG",
        "background:#2196F3;color: #111;padding:0 5px;border-radius:10px",
        ...args
    );
}

console.log = info;
console.warn = warn;
console.error = error;
console.debug = debug;

export { };
