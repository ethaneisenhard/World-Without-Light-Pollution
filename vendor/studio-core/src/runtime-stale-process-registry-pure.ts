/**
 * Registry of log detectors for "already running" stale Dev processes.
 * Add a row — do not special-case harness/project ids in hosts.
 */

export type StaleProcessHint = {
  /** Detector registry id (e.g. next-already-running). */
  detectorId: string;
  pid: number;
  /** Absolute project root when the tool reports it. */
  dir?: string;
  /** Alternate Local URL when reported. */
  localUrl?: string;
};

export type StaleProcessDetector = {
  id: string;
  /** Scan joined spawn logs; return zero or more hints. */
  detect: (logBlob: string) => StaleProcessHint[];
};

/** Next.js / Turbopack "Another next dev server is already running". */
export function detectNextAlreadyRunning(logBlob: string): StaleProcessHint[] {
  if (!/another next dev server is already running/i.test(logBlob)) {
    return [];
  }
  const pidMatch = logBlob.match(/\bPID:\s*(\d+)\b/i);
  const pid = pidMatch ? Number(pidMatch[1]) : NaN;
  if (!Number.isInteger(pid) || pid <= 0) return [];

  const dirMatch = logBlob.match(/\bDir:\s*([^\n\r]+)/i);
  const dir = dirMatch?.[1]?.trim() || undefined;

  let localUrl: string | undefined;
  const localMatch = logBlob.match(/\bLocal:\s*(https?:\/\/[^\s]+)/i);
  if (localMatch?.[1]) {
    try {
      const u = new URL(localMatch[1].replace(/[.,;)]+$/, ""));
      if (u.hostname === "127.0.0.1" || u.hostname === "::1") {
        u.hostname = "localhost";
      }
      localUrl = u.origin;
    } catch {
      /* ignore */
    }
  }

  return [
    {
      detectorId: "next-already-running",
      pid,
      dir,
      localUrl,
    },
  ];
}

/**
 * Generic "PID: 12345" near already-running / in-use copy.
 * Conservative — only when the blob also looks like a port/process conflict.
 */
export function detectGenericConflictPid(logBlob: string): StaleProcessHint[] {
  if (
    !/already running|address already in use|eaddrinuse|port.*in use/i.test(
      logBlob,
    )
  ) {
    return [];
  }
  // Avoid double-counting Next (has its own detector).
  if (/another next dev server is already running/i.test(logBlob)) {
    return [];
  }
  const pidMatch = logBlob.match(/\bPID:\s*(\d+)\b/i);
  const pid = pidMatch ? Number(pidMatch[1]) : NaN;
  if (!Number.isInteger(pid) || pid <= 0) return [];
  return [{ detectorId: "generic-conflict-pid", pid }];
}

const detectors: StaleProcessDetector[] = [
  { id: "next-already-running", detect: detectNextAlreadyRunning },
  { id: "generic-conflict-pid", detect: detectGenericConflictPid },
];

export function listStaleProcessDetectors(): readonly StaleProcessDetector[] {
  return detectors;
}

export function getStaleProcessDetector(
  id: string,
): StaleProcessDetector | undefined {
  return detectors.find((d) => d.id === id);
}

/** Tests / plugins — replace or append by id. */
export function registerStaleProcessDetector(
  detector: StaleProcessDetector,
): void {
  const idx = detectors.findIndex((d) => d.id === detector.id);
  if (idx >= 0) detectors[idx] = detector;
  else detectors.push(detector);
}
