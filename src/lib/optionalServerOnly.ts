// Next.js resolves `server-only` during app/runtime builds, but standalone tsx scripts do not.
// Swallow the module-not-found case so audit/report scripts can reuse the same server code.
void import('server-only').catch(() => undefined);

export {};
