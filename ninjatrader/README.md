# CopyBot NinjaTrader Integration

## Quick Start (Easiest Method)

### Option 1: All-in-One NinjaTrader Indicator (Recommended)

1. Copy `CopyBotIndicator.cs` to your NinjaTrader indicators folder:
   ```
   Documents\NinjaTrader 8\bin\Custom\Indicators\
   ```

2. In NinjaTrader, go to **Tools → Edit NinjaScript → Indicators**

3. Right-click and select **Compile**

4. Add the indicator to any chart:
   - Right-click chart → **Indicators** → **CopyBot**
   - Enter your API key (starts with `sub_`)
   - Click OK

5. Done! The indicator connects directly to CopyBot and executes trades automatically.

---

### Option 2: Windows Setup Script

1. Open PowerShell as Administrator

2. Navigate to this folder:
   ```powershell
   cd path\to\ninjatrader
   ```

3. Run the setup script:
   ```powershell
   .\CopyBotSetup.ps1
   ```

4. Enter your API key when prompted

5. The script will:
   - Configure CopyBot with your API key
   - Create a startup shortcut (runs automatically on Windows boot)
   - Start receiving signals

---

### Option 3: Manual Setup

1. Install Node.js from https://nodejs.org/

2. Run the client:
   ```powershell
   node copybot-client.js YOUR_API_KEY wss://copybot-api.onrender.com/ws
   ```

3. Import these files into NinjaTrader:
   - `CopyBotFileReader.cs` - Reads signals from file
   - `CopyBotSignalExecutor.cs` - Executes trades

---

## Getting Your API Key

1. Go to https://copybot-dashboard.onrender.com/subscriber/login
2. Enter your API key to access the portal
3. Or get a new key via:
   - Whop activation link from your signal provider
   - Invite link from your signal provider
   - Direct from your signal provider

---

## Files

| File | Description |
|------|-------------|
| `CopyBotIndicator.cs` | All-in-one NinjaTrader indicator (recommended) |
| `CopyBotSetup.ps1` | Windows setup script |
| `copybot-client.js` | Node.js WebSocket client |
| `CopyBotFileReader.cs` | NinjaTrader file reader indicator |
| `CopyBotSignalExecutor.cs` | NinjaTrader trade executor |

---

## Troubleshooting

**"API key required"**
- Make sure you entered your subscriber API key (starts with `sub_`)

**"Connection failed"**
- Check your internet connection
- Verify the server URL is correct: `wss://copybot-api.onrender.com/ws`

**"Instrument not found"**
- Make sure the symbol exists in NinjaTrader
- Check that you have market data for that instrument

**Signals not executing**
- Verify "Auto Execute" is enabled
- Check that you have a valid trading account connected
- Look at NinjaTrader's output window for error messages

---

## Support

Contact your signal provider for API key issues.
