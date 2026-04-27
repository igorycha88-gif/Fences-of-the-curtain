export async function register() {
  console.log('[Instrumentation] register() called, NEXT_RUNTIME:', process.env.NEXT_RUNTIME);
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('@/services/cron');
    startScheduler();
  }
}
