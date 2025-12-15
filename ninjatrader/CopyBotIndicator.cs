#region Using declarations
using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.IO;
using NinjaTrader.Cbi;
using NinjaTrader.Gui;
using NinjaTrader.Gui.Chart;
using NinjaTrader.Data;
using NinjaTrader.NinjaScript;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
#endregion

namespace NinjaTrader.NinjaScript.Indicators
{
    /// <summary>
    /// CopyBot Signal Receiver - Connects to CopyBot cloud and auto-executes trades
    /// Just add to chart, enter your API key, and you're done!
    /// </summary>
    public class CopyBotIndicator : Indicator
    {
        private ClientWebSocket webSocket;
        private CancellationTokenSource cts;
        private bool isConnected = false;
        private string statusMessage = "Not connected";
        private int signalsReceived = 0;
        private int tradesExecuted = 0;

        #region Properties
        [NinjaScriptProperty]
        [Display(Name = "API Key", Description = "Your CopyBot subscriber API key (sub_xxx)", Order = 1, GroupName = "CopyBot Settings")]
        public string ApiKey { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "Server URL", Description = "CopyBot WebSocket server", Order = 2, GroupName = "CopyBot Settings")]
        public string ServerUrl { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "Auto Execute", Description = "Automatically execute received signals", Order = 3, GroupName = "CopyBot Settings")]
        public bool AutoExecute { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "Default Quantity", Description = "Default position size if not specified in signal", Order = 4, GroupName = "CopyBot Settings")]
        public int DefaultQuantity { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "Account", Description = "Trading account to use", Order = 5, GroupName = "CopyBot Settings")]
        public string TradingAccount { get; set; }
        #endregion

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Description = "CopyBot Signal Receiver - Auto-copy trades from your signal provider";
                Name = "CopyBot";
                Calculate = Calculate.OnBarClose;
                IsOverlay = true;
                DisplayInDataBox = false;
                
                // Default settings
                ApiKey = "";
                ServerUrl = "wss://copybot-api.onrender.com/ws";
                AutoExecute = true;
                DefaultQuantity = 1;
                TradingAccount = "";
            }
            else if (State == State.Configure)
            {
                // Nothing to configure
            }
            else if (State == State.DataLoaded)
            {
                if (string.IsNullOrEmpty(ApiKey))
                {
                    Print("CopyBot: Please enter your API key in the indicator settings");
                    statusMessage = "API key required";
                    return;
                }
                
                // Start WebSocket connection
                StartConnection();
            }
            else if (State == State.Terminated)
            {
                StopConnection();
            }
        }

        protected override void OnBarUpdate()
        {
            // Display status on chart
        }

        protected override void OnRender(ChartControl chartControl, ChartScale chartScale)
        {
            base.OnRender(chartControl, chartScale);
            
            // Draw status panel
            using (var brush = new System.Windows.Media.SolidColorBrush(isConnected ? 
                System.Windows.Media.Colors.Green : System.Windows.Media.Colors.Red))
            {
                var text = $"CopyBot: {statusMessage}\nSignals: {signalsReceived} | Trades: {tradesExecuted}";
                
                Draw.TextFixed(this, "CopyBotStatus", text, TextPosition.TopRight,
                    isConnected ? Brushes.LimeGreen : Brushes.Red,
                    new Gui.Tools.SimpleFont("Arial", 10), Brushes.Transparent, Brushes.Transparent, 0);
            }
        }

        private async void StartConnection()
        {
            cts = new CancellationTokenSource();
            
            while (!cts.Token.IsCancellationRequested)
            {
                try
                {
                    webSocket = new ClientWebSocket();
                    var uri = new Uri($"{ServerUrl}?key={ApiKey}");
                    
                    Print($"CopyBot: Connecting to {ServerUrl}...");
                    statusMessage = "Connecting...";
                    
                    await webSocket.ConnectAsync(uri, cts.Token);
                    
                    isConnected = true;
                    statusMessage = "Connected";
                    Print("CopyBot: Connected! Waiting for signals...");
                    
                    await ReceiveLoop();
                }
                catch (Exception ex)
                {
                    isConnected = false;
                    statusMessage = $"Error: {ex.Message}";
                    Print($"CopyBot: Connection error - {ex.Message}");
                }
                
                if (!cts.Token.IsCancellationRequested)
                {
                    Print("CopyBot: Reconnecting in 3 seconds...");
                    statusMessage = "Reconnecting...";
                    await Task.Delay(3000, cts.Token);
                }
            }
        }

        private async Task ReceiveLoop()
        {
            var buffer = new byte[4096];
            
            while (webSocket.State == WebSocketState.Open && !cts.Token.IsCancellationRequested)
            {
                try
                {
                    var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), cts.Token);
                    
                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        Print("CopyBot: Server closed connection");
                        break;
                    }
                    
                    var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    ProcessMessage(message);
                }
                catch (Exception ex)
                {
                    Print($"CopyBot: Receive error - {ex.Message}");
                    break;
                }
            }
            
            isConnected = false;
        }

        private void ProcessMessage(string message)
        {
            try
            {
                var json = JObject.Parse(message);
                var type = json["type"]?.ToString();
                
                if (type == "signal")
                {
                    var trade = json["trade"];
                    if (trade != null)
                    {
                        signalsReceived++;
                        ProcessSignal(trade);
                    }
                }
                else if (type == "signals")
                {
                    var signals = json["signals"] as JArray;
                    if (signals != null)
                    {
                        foreach (var sig in signals)
                        {
                            signalsReceived++;
                            ProcessSignal(sig["trade"]);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Print($"CopyBot: Parse error - {ex.Message}");
            }
        }

        private void ProcessSignal(JToken trade)
        {
            var symbol = trade["symbol"]?.ToString();
            var side = trade["side"]?.ToString()?.ToUpper();
            var quantity = trade["quantity"]?.Value<int>() ?? DefaultQuantity;
            var stopLoss = trade["stopLoss"]?.Value<double>() ?? 0;
            var takeProfit = trade["takeProfits"]?[0]?["price"]?.Value<double>() ?? 0;
            var entryPrice = trade["entryPrice"]?.Value<double>() ?? 0;
            
            Print($"CopyBot: SIGNAL - {symbol} {side} Qty:{quantity} SL:{stopLoss} TP:{takeProfit}");
            statusMessage = $"Signal: {symbol} {side}";
            
            if (AutoExecute)
            {
                ExecuteTrade(symbol, side, quantity, stopLoss, takeProfit, entryPrice);
            }
        }

        private void ExecuteTrade(string symbol, string side, int quantity, double stopLoss, double takeProfit, double entryPrice)
        {
            try
            {
                // Find the account
                Account account = null;
                foreach (var acc in Account.All)
                {
                    if (string.IsNullOrEmpty(TradingAccount) || acc.Name == TradingAccount)
                    {
                        account = acc;
                        break;
                    }
                }
                
                if (account == null)
                {
                    Print("CopyBot: No trading account found");
                    return;
                }
                
                // Find the instrument
                var instrument = Instrument.GetInstrument(symbol);
                if (instrument == null)
                {
                    Print($"CopyBot: Instrument {symbol} not found");
                    return;
                }
                
                // Create order
                var orderAction = side == "BUY" ? OrderAction.Buy : OrderAction.Sell;
                
                // Submit market order
                var order = account.CreateOrder(
                    instrument,
                    orderAction,
                    OrderType.Market,
                    OrderEntry.Manual,
                    TimeInForce.Day,
                    quantity,
                    0, // limit price
                    0, // stop price
                    "", // oco
                    "CopyBot", // name
                    Core.Globals.MaxDate, // gtd
                    null // custom
                );
                
                account.Submit(new[] { order });
                tradesExecuted++;
                
                Print($"CopyBot: Order submitted - {symbol} {side} x{quantity}");
                statusMessage = $"Executed: {symbol} {side}";
                
                // TODO: Add stop loss and take profit orders
            }
            catch (Exception ex)
            {
                Print($"CopyBot: Execution error - {ex.Message}");
                statusMessage = $"Error: {ex.Message}";
            }
        }

        private void StopConnection()
        {
            try
            {
                cts?.Cancel();
                
                if (webSocket != null && webSocket.State == WebSocketState.Open)
                {
                    webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Indicator removed", CancellationToken.None).Wait(1000);
                }
                
                webSocket?.Dispose();
            }
            catch { }
            
            isConnected = false;
            Print("CopyBot: Disconnected");
        }
    }
}
