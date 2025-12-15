# CopyBot NinjaTrader Signal Executor

Automatically executes trade signals from CopyBot in NinjaTrader 8.

## Installation

1. Open NinjaTrader 8
2. Go to **Tools → Edit NinjaScript → Strategy**
3. Right-click in the left panel → **New → Strategy**
4. Name it `CopyBotSignalExecutor`
5. Replace all the code with the contents of `CopyBotSignalExecutor.cs`
6. Press **F5** to compile (or click the compile button)

## Configuration

1. Open a chart for the instrument you want to trade (e.g., ES, NQ)
2. Right-click on the chart → **Strategies**
3. Find `CopyBotSignalExecutor` and add it
4. Configure the settings:

| Setting | Description |
|---------|-------------|
| **API URL** | Your CopyBot backend URL (e.g., `https://your-api.com` or `http://localhost:4000` for testing) |
| **API Key** | Your subscriber API key (get this from the host who added you) |
| **Poll Interval** | How often to check for signals (default: 5 seconds) |
| **Default Quantity** | Contracts to trade if signal doesn't specify |
| **Enable Trading** | Set to `True` to actually place trades. Keep `False` for testing. |

5. Click **OK** to start the strategy

## How It Works

1. The strategy polls your CopyBot API every few seconds
2. When a new signal arrives, it:
   - Acknowledges receipt
   - Places the order (market or limit)
   - Sets stop loss and take profit
   - Reports execution status back to the API

## Testing

1. Start with **Enable Trading = False**
2. Watch the NinjaTrader Output window for signal logs
3. Once you see signals coming through correctly, enable trading

## Supported Order Types

- **MARKET** - Immediate execution at market price
- **LIMIT** - Limit order at specified entry price

## Signal Format Expected

```json
{
  "symbol": "ES",
  "side": "BUY",
  "orderType": "MARKET",
  "entryPrice": null,
  "stopLoss": 5950.00,
  "quantity": 1,
  "takeProfits": [{ "price": 6000.00 }]
}
```

## Troubleshooting

**"API Key not configured"**
- Make sure you entered your subscriber API key in the strategy settings

**"Symbol mismatch"**
- The signal is for a different instrument than your chart
- Open a chart for the correct symbol

**No signals appearing**
- Check that the API URL is correct
- Verify your API key is valid
- Make sure the host has sent signals

## Important Notes

- Run on a chart matching the symbols you'll receive signals for
- Start with paper trading / simulation mode
- The strategy must be running for signals to execute
- One strategy instance per symbol you want to trade
