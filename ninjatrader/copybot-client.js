const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Config
const API_KEY = process.argv[2] || process.env.COPYBOT_API_KEY || '';
const WS_URL = process.argv[3] || process.env.COPYBOT_WS_URL || 'ws://localhost:4000/ws';

// Signal file path (NinjaTrader Documents folder)
const SIGNAL_FILE = path.join(os.homedir(), 'Documents', 'NinjaTrader 8', 'incoming_signals.txt');

if (!API_KEY) {
  console.log('Usage: node copybot-client.js <subscriber_api_key> [ws_url]');
  console.log('Example: node copybot-client.js sub_abc123 ws://localhost:4000/ws');
  process.exit(1);
}

console.log('=== CopyBot Real-Time Client ===');
console.log(`Signal file: ${SIGNAL_FILE}`);
console.log(`Connecting to: ${WS_URL}`);

// Ensure signal file directory exists
const signalDir = path.dirname(SIGNAL_FILE);
if (!fs.existsSync(signalDir)) {
  fs.mkdirSync(signalDir, { recursive: true });
}

function connect() {
  const ws = new WebSocket(`${WS_URL}?key=${API_KEY}`);

  ws.on('open', () => {
    console.log(`[${timestamp()}] Connected! Waiting for signals...`);
  });

  ws.on('message', (data) => {
    const msg = data.toString();
    console.log(`[${timestamp()}] Received: ${msg}`);
    
    try {
      const parsed = JSON.parse(msg);
      
      if (parsed.type === 'signal' && parsed.trade) {
        writeSignal(parsed.trade);
      } else if (parsed.type === 'signals' && parsed.signals) {
        parsed.signals.forEach(s => writeSignal(s.trade));
      }
    } catch (e) {
      console.log(`Parse error: ${e.message}`);
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`[${timestamp()}] Disconnected (${code}). Reconnecting in 2s...`);
    setTimeout(connect, 2000);
  });

  ws.on('error', (err) => {
    console.log(`[${timestamp()}] Error: ${err.message}`);
  });
}

function writeSignal(trade) {
  const symbol = trade.symbol || '';
  const side = trade.side || '';
  const orderType = trade.orderType || 'MARKET';
  const entryPrice = trade.entryPrice || '';
  const stopLoss = trade.stopLoss || '';
  const quantity = trade.quantity || 1;
  
  let takeProfit = '';
  if (trade.takeProfits && trade.takeProfits[0]) {
    takeProfit = trade.takeProfits[0].price || '';
  }
  
  const line = `${symbol},${side},${orderType},${entryPrice},${stopLoss},${takeProfit},${quantity},0,${new Date().toISOString()}\n`;
  
  fs.appendFileSync(SIGNAL_FILE, line);
  console.log(`[${timestamp()}] SIGNAL: ${symbol} ${side} ${orderType} SL:${stopLoss} TP:${takeProfit} Qty:${quantity}`);
}

function timestamp() {
  return new Date().toISOString().substr(11, 12);
}

connect();
