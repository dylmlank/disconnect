import cron from 'node-cron';
import { expireOldBeacons } from '../models/beacon';

export function startBeaconExpiryJob() {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const deleted = await expireOldBeacons();
      if (deleted > 0) {
        console.log(`Expired ${deleted} beacons`);
      }
    } catch (err) {
      console.error('Beacon expiry job failed:', err);
    }
  });

  console.log('Beacon expiry job scheduled');
}
