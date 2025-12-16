/**
 * Signal backup and redundancy system
 * Provides signal persistence and recovery capabilities
 */
const { query } = require('../db');

/**
 * Backup a signal before delivery
 */
async function backupSignal(hostId, signalId, payload) {
  try {
    await query(
      `INSERT INTO signal_backups (host_id, signal_id, payload, status, created_at)
       VALUES ($1, $2, $3, 'pending', NOW())
       ON CONFLICT (signal_id) DO UPDATE SET payload = $3, updated_at = NOW()`,
      [hostId, signalId, payload]
    );
    return { success: true };
  } catch (err) {
    console.error('[SignalBackup] Backup failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Mark signal as delivered
 */
async function markDelivered(signalId, deliveryCount) {
  try {
    await query(
      `UPDATE signal_backups SET status = 'delivered', delivery_count = $2, updated_at = NOW() WHERE signal_id = $1`,
      [signalId, deliveryCount]
    );
  } catch (err) {
    console.error('[SignalBackup] Mark delivered failed:', err.message);
  }
}

/**
 * Get pending signals for recovery (signals that weren't fully delivered)
 */
async function getPendingSignals(hostId, maxAge = 3600000) {
  try {
    const cutoff = new Date(Date.now() - maxAge);
    const result = await query(
      `SELECT sb.*, s.payload as original_payload
       FROM signal_backups sb
       LEFT JOIN signals s ON s.id = sb.signal_id
       WHERE sb.host_id = $1 AND sb.status = 'pending' AND sb.created_at > $2
       ORDER BY sb.created_at DESC`,
      [hostId, cutoff]
    );
    return result.rows;
  } catch (err) {
    console.error('[SignalBackup] Get pending failed:', err.message);
    return [];
  }
}


/**
 * Get failed deliveries for a signal
 */
async function getFailedDeliveries(signalId) {
  try {
    const result = await query(
      `SELECT d.*, s.name as subscriber_name
       FROM deliveries d
       JOIN subscribers s ON s.id = d.subscriber_id
       WHERE d.signal_id = $1 AND d.status = 'failed'`,
      [signalId]
    );
    return result.rows;
  } catch (err) {
    return [];
  }
}

/**
 * Retry failed deliveries for a signal
 */
async function retryFailedDeliveries(signalId) {
  try {
    const result = await query(
      `UPDATE deliveries SET status = 'pending', retry_count = COALESCE(retry_count, 0) + 1, updated_at = NOW()
       WHERE signal_id = $1 AND status = 'failed'
       RETURNING *`,
      [signalId]
    );
    return { success: true, count: result.rowCount };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Get signal delivery stats
 */
async function getDeliveryStats(hostId, days = 7) {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_signals,
        COUNT(*) FILTER (WHERE sb.status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE sb.status = 'pending') as pending,
        COUNT(*) FILTER (WHERE sb.status = 'failed') as failed,
        AVG(sb.delivery_count) as avg_deliveries
      FROM signal_backups sb
      WHERE sb.host_id = $1 AND sb.created_at > NOW() - INTERVAL '1 day' * $2
    `, [hostId, days]);
    return result.rows[0];
  } catch (err) {
    return null;
  }
}

/**
 * Clean up old backups (keep last 30 days)
 */
async function cleanupOldBackups() {
  try {
    const result = await query(
      `DELETE FROM signal_backups WHERE created_at < NOW() - INTERVAL '30 days'`
    );
    console.log(`[SignalBackup] Cleaned up ${result.rowCount} old backups`);
    return result.rowCount;
  } catch (err) {
    console.error('[SignalBackup] Cleanup failed:', err.message);
    return 0;
  }
}

module.exports = {
  backupSignal,
  markDelivered,
  getPendingSignals,
  getFailedDeliveries,
  retryFailedDeliveries,
  getDeliveryStats,
  cleanupOldBackups
};
