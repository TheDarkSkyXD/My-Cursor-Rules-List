import { initializeCronJobs } from '../lib/services/cron-service.ts';

// Start all cron jobs
initializeCronJobs();

// Keep the process alive
setInterval(() => {}, 1 << 30); 