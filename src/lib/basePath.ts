function normalizeBasePath(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let trimmed = raw.trim();
  if (!trimmed || trimmed === '/') return '';
  if (!trimmed.startsWith('/')) trimmed = `/${trimmed}`;
  return trimmed.replace(/\/+$/, '');
}

export function getBasePath(): string {
  if (typeof window === 'undefined') return '';
  const win = window as Window & { __VAT129CHECK_BASE__?: unknown };
  const explicit = normalizeBasePath(win.__VAT129CHECK_BASE__);
  if (explicit) return explicit;
  if (
    window.location.pathname === '/vat129check' ||
    window.location.pathname.startsWith('/vat129check/')
  ) {
    return '/vat129check';
  }
  return '';
}

export function withBase(targetPath: string): string {
  const base = getBasePath();
  const normalized = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  if (!base) return normalized;
  if (normalized === '/') return `${base}/`;
  return `${base}${normalized}`;
}

export function stripBase(pathname: string): string {
  const base = getBasePath();
  if (!base) return pathname || '/';
  if (pathname === base || pathname === `${base}/`) return '/';
  if (pathname.startsWith(`${base}/`)) {
    return pathname.slice(base.length) || '/';
  }
  return pathname || '/';
}
