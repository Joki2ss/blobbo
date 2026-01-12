// Minimal SemVer utilities (MAJOR.MINOR.PATCH) for update gating.
// Returns 1 if a>b, -1 if a<b, 0 if equal.

function toInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

function parseSemver(version) {
  const s = String(version || '').trim();
  const parts = s.split('.');
  return {
    major: toInt(parts[0]),
    minor: toInt(parts[1]),
    patch: toInt(parts[2]),
  };
}

export function compareSemver(a, b) {
  const va = parseSemver(a);
  const vb = parseSemver(b);

  if (va.major !== vb.major) return va.major > vb.major ? 1 : -1;
  if (va.minor !== vb.minor) return va.minor > vb.minor ? 1 : -1;
  if (va.patch !== vb.patch) return va.patch > vb.patch ? 1 : -1;
  return 0;
}

export function isSemverLessThan(a, b) {
  return compareSemver(a, b) < 0;
}
