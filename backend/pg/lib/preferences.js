/**
 * Subscriber preference enforcement
 * Filters signals based on subscriber's trading preferences
 */

/**
 * Check if a signal should be delivered to a subscriber based on their preferences
 * @param {object} subscriber - Subscriber with preferences
 * @param {object} trade - Trade signal payload
 * @returns {{allowed: boolean, reason?: string}}
 */
function shouldDeliverSignal(subscriber, trade) {
  const prefs = subscriber.preferences || {};
  
  // Check daily trade limit
  if (prefs.max_trades_per_day > 0) {
    const today = new Date().toISOString().split('T')[0];
    const lastTradeDate = subscriber.last_trade_date?.toISOString?.()?.split('T')[0] || 
                          (typeof subscriber.last_trade_date === 'string' ? subscriber.last_trade_date.split('T')[0] : null);
    
    const dailyCount = lastTradeDate === today ? (subscriber.daily_trade_count || 0) : 0;
    
    if (dailyCount >= prefs.max_trades_per_day) {
      return { allowed: false, reason: 'daily_limit_reached' };
    }
  }

  // Check auto-execute setting
  if (prefs.auto_execute === false) {
    return { allowed: false, reason: 'auto_execute_disabled' };
  }

  // Check trading sessions
  if (prefs.sessions && prefs.sessions.length > 0 && prefs.sessions.length < 3) {
    const currentSession = getCurrentSession(prefs.timezone || 'America/New_York');
    if (!prefs.sessions.includes(currentSession)) {
      return { allowed: false, reason: `outside_session_${currentSession}` };
    }
  }

  // Check trading hours
  if (prefs.trading_hours?.enabled) {
    const tz = prefs.timezone || 'America/New_York';
    if (!isWithinTradingHours(prefs.trading_hours.start, prefs.trading_hours.end, tz)) {
      return { allowed: false, reason: 'outside_trading_hours' };
    }
  }

  // Check symbol whitelist
  const symbol = trade.symbol?.toUpperCase();
  if (prefs.symbols_whitelist?.length > 0) {
    if (!prefs.symbols_whitelist.includes(symbol)) {
      return { allowed: false, reason: 'symbol_not_whitelisted' };
    }
  }

  // Check symbol blacklist
  if (prefs.symbols_blacklist?.length > 0) {
    if (prefs.symbols_blacklist.includes(symbol)) {
      return { allowed: false, reason: 'symbol_blacklisted' };
    }
  }

  return { allowed: true };
}

/**
 * Get current trading session based on timezone
 */
function getCurrentSession(timezone) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false
  });
  const hour = parseInt(formatter.format(now));

  // Session times in ET (approximate)
  // Asia: 7PM - 4AM ET (19-04)
  // London: 3AM - 12PM ET (03-12)
  // NY: 8AM - 5PM ET (08-17)
  
  if (hour >= 19 || hour < 4) return 'asia';
  if (hour >= 3 && hour < 12) return 'london';
  if (hour >= 8 && hour < 17) return 'ny';
  
  // Overlap periods - return the more active session
  if (hour >= 4 && hour < 8) return 'london';
  if (hour >= 12 && hour < 17) return 'ny';
  if (hour >= 17 && hour < 19) return 'ny';
  
  return 'ny'; // default
}

/**
 * Check if current time is within trading hours
 */
function isWithinTradingHours(start, end, timezone) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const currentTime = formatter.format(now).replace(':', '');
  const startTime = start.replace(':', '');
  const endTime = end.replace(':', '');
  
  // Handle overnight ranges (e.g., 22:00 - 06:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }
  
  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Apply position size limit from preferences
 */
function applyPositionSizeLimit(trade, prefs) {
  if (prefs.risk?.max_position_size > 0 && trade.quantity) {
    const maxSize = prefs.risk.max_position_size;
    if (trade.quantity > maxSize) {
      return { ...trade, quantity: maxSize, original_quantity: trade.quantity };
    }
  }
  return trade;
}

module.exports = {
  shouldDeliverSignal,
  getCurrentSession,
  isWithinTradingHours,
  applyPositionSizeLimit
};
