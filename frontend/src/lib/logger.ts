export const isProduction = (() => {
  try {
    // Vite sets import.meta.env.MODE; fallback to process.env
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mode = (import.meta as any)?.env?.MODE ?? process.env.NODE_ENV;
    return mode === 'production';
  } catch {
    return false;
  }
})();

type LogContext = Record<string, unknown> | string | undefined;

function formatMessage(level: string, msg: unknown, ctx?: LogContext) {
  const timestamp = new Date().toISOString();
  const base = { level, timestamp, message: msg } as Record<string, unknown>;
  if (ctx) base.context = ctx;
  return base;
}

export function debug(msg: unknown, ctx?: LogContext) {
  if (isProduction) return;
  // eslint-disable-next-line no-console
  console.debug(JSON.stringify(formatMessage('debug', msg, ctx)));
}

export function info(msg: unknown, ctx?: LogContext) {
  if (isProduction) return;
  // eslint-disable-next-line no-console
  console.info(JSON.stringify(formatMessage('info', msg, ctx)));
}

export function warn(msg: unknown, ctx?: LogContext) {
  // In production, still emit warnings to console.warn to help with monitoring if desired
  // eslint-disable-next-line no-console
  console.warn(JSON.stringify(formatMessage('warn', msg, ctx)));
}

export function error(msg: unknown, ctx?: LogContext) {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify(formatMessage('error', msg, ctx)));
}

export function getLogger(name?: string) {
  return {
    debug: (m: unknown, ctx?: LogContext) => debug({ logger: name ?? 'app', payload: m }, ctx),
    info: (m: unknown, ctx?: LogContext) => info({ logger: name ?? 'app', payload: m }, ctx),
    warn: (m: unknown, ctx?: LogContext) => warn({ logger: name ?? 'app', payload: m }, ctx),
    error: (m: unknown, ctx?: LogContext) => error({ logger: name ?? 'app', payload: m }, ctx),
  };
}

// Export a default logger for convenience
export default getLogger('meims');
