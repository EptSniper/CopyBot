#region Using declarations
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.Web.Script.Serialization;
using System.Collections.Generic;
using NinjaTrader.Cbi;
using NinjaTrader.Gui;
using NinjaTrader.Gui.Chart;
using NinjaTrader.Gui.SuperDom;
using NinjaTrader.Data;
using NinjaTrader.NinjaScript;
using NinjaTrader.Core.FloatingPoint;
#endregion

namespace NinjaTrader.NinjaScript.Strategies
{
    public class CopyBotSignalExecutor : Strategy
    {
        #region Variables
        private HttpClient httpClient;
        private JavaScriptSerializer jsonSerializer;
        private DateTime lastPollTime = DateTime.MinValue;
        private bool isProcessingSignal = false;
        #endregion

        #region Properties
        [NinjaScriptProperty]
        [Display(Name = "API URL", Description = "CopyBot API base URL", Order = 1, GroupName = "CopyBot Settings")]
        public string ApiUrl { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "API Key", Description = "Your subscriber API key", Order = 2, GroupName = "CopyBot Settings")]
        public string ApiKey { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "Poll Interval (seconds)", Description = "How often to check for new signals", Order = 3, GroupName = "CopyBot Settings")]
        public int PollIntervalSeconds { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "Default Quantity", Description = "Default contracts if signal doesn't specify", Order = 4, GroupName = "Trading Settings")]
        public int DefaultQuantity { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "Enable Trading", Description = "Actually place trades (false = simulation only)", Order = 5, GroupName = "Trading Settings")]
        public bool EnableTrading { get; set; }
        #endregion

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Description = "CopyBot Signal Executor - Automatically executes trade signals from CopyBot";
                Name = "CopyBotSignalExecutor";
                Calculate = Calculate.OnEachTick;
                EntriesPerDirection = 1;
                EntryHandling = EntryHandling.AllEntries;
                IsExitOnSessionCloseStrategy = true;
                ExitOnSessionCloseSeconds = 30;
                IsFillLimitOnTouch = false;
                MaximumBarsLookBack = MaximumBarsLookBack.TwoHundredFiftySix;
                OrderFillResolution = OrderFillResolution.Standard;
                Slippage = 0;
                StartBehavior = StartBehavior.WaitUntilFlat;
                TimeInForce = TimeInForce.Gtc;
                TraceOrders = false;
                RealtimeErrorHandling = RealtimeErrorHandling.StopCancelClose;
                StopTargetHandling = StopTargetHandling.PerEntryExecution;
                BarsRequiredToTrade = 0;

                // Default settings
                ApiUrl = "https://copybot-api.onrender.com";
                ApiKey = "";
                PollIntervalSeconds = 1;
                DefaultQuantity = 1;
                EnableTrading = false;
            }
            else if (State == State.DataLoaded)
            {
                httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("Authorization", "Bearer " + ApiKey);
                httpClient.Timeout = TimeSpan.FromSeconds(10);
                jsonSerializer = new JavaScriptSerializer();
            }
            else if (State == State.Terminated)
            {
                if (httpClient != null)
                {
                    httpClient.Dispose();
                    httpClient = null;
                }
            }
        }

        protected override void OnBarUpdate()
        {
            if (State != State.Realtime) return;
            if (string.IsNullOrEmpty(ApiKey))
            {
                Print("CopyBot: API Key not configured!");
                return;
            }

            // Check if it's time to poll
            if ((DateTime.Now - lastPollTime).TotalSeconds >= PollIntervalSeconds)
            {
                lastPollTime = DateTime.Now;
                PollForSignals();
            }
        }

        private async void PollForSignals()
        {
            if (isProcessingSignal) return;
            isProcessingSignal = true;

            try
            {
                string url = ApiUrl + "/signals/next?limit=1";
                HttpResponseMessage response = await httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    Print("CopyBot: API error " + response.StatusCode);
                    return;
                }

                string json = await response.Content.ReadAsStringAsync();
                
                // Parse JSON array
                var signals = jsonSerializer.Deserialize<List<Dictionary<string, object>>>(json);

                if (signals == null || signals.Count == 0)
                {
                    return;
                }

                foreach (var signalWrapper in signals)
                {
                    int deliveryId = Convert.ToInt32(signalWrapper["delivery_id"]);
                    var trade = signalWrapper["trade"] as Dictionary<string, object>;
                    
                    if (trade != null)
                    {
                        await ProcessSignal(deliveryId, trade);
                    }
                }
            }
            catch (Exception ex)
            {
                Print("CopyBot: Error polling signals - " + ex.Message);
            }
            finally
            {
                isProcessingSignal = false;
            }
        }

        private async Task ProcessSignal(int deliveryId, Dictionary<string, object> trade)
        {
            try
            {
                string symbol = GetStringValue(trade, "symbol", "");
                string side = GetStringValue(trade, "side", "");
                string orderType = GetStringValue(trade, "orderType", "MARKET");
                double? entryPrice = GetDoubleValue(trade, "entryPrice");
                double? stopLoss = GetDoubleValue(trade, "stopLoss");
                int quantity = GetIntValue(trade, "quantity", DefaultQuantity);

                // Get take profit (first level)
                double? takeProfit = null;
                if (trade.ContainsKey("takeProfits"))
                {
                    var takeProfits = trade["takeProfits"] as System.Collections.ArrayList;
                    if (takeProfits != null && takeProfits.Count > 0)
                    {
                        var tp = takeProfits[0] as Dictionary<string, object>;
                        if (tp != null)
                        {
                            takeProfit = GetDoubleValue(tp, "price");
                        }
                    }
                }

                Print("CopyBot: Received signal - " + symbol + " " + side + " " + orderType + " Qty:" + quantity + " SL:" + stopLoss + " TP:" + takeProfit);

                // Acknowledge receipt
                await AcknowledgeDelivery(deliveryId);

                if (!EnableTrading)
                {
                    Print("CopyBot: Trading disabled - signal logged but not executed");
                    return;
                }

                // Validate symbol matches current chart
                if (!Instrument.FullName.ToUpper().Contains(symbol.ToUpper()))
                {
                    Print("CopyBot: Symbol mismatch - signal is for " + symbol + ", chart is " + Instrument.FullName);
                    await ReportExecution(deliveryId, "failed", "Symbol mismatch: expected " + symbol);
                    return;
                }

                // Execute the trade
                bool success = ExecuteTrade(side, orderType, entryPrice, stopLoss, takeProfit, quantity);

                if (success)
                {
                    await ReportExecution(deliveryId, "executed", null);
                }
                else
                {
                    await ReportExecution(deliveryId, "failed", "Order submission failed");
                }
            }
            catch (Exception ex)
            {
                Print("CopyBot: Error processing signal - " + ex.Message);
                await ReportExecution(deliveryId, "failed", ex.Message);
            }
        }

        private bool ExecuteTrade(string side, string orderType, double? entryPrice, double? stopLoss, double? takeProfit, int quantity)
        {
            try
            {
                // Set stop loss and take profit if provided
                if (stopLoss.HasValue)
                {
                    SetStopLoss(CalculationMode.Price, stopLoss.Value);
                }

                if (takeProfit.HasValue)
                {
                    SetProfitTarget(CalculationMode.Price, takeProfit.Value);
                }

                // Enter position
                if (side.ToUpper() == "BUY")
                {
                    if (orderType.ToUpper() == "LIMIT" && entryPrice.HasValue)
                    {
                        EnterLongLimit(quantity, entryPrice.Value, "CopyBot_Long");
                    }
                    else
                    {
                        EnterLong(quantity, "CopyBot_Long");
                    }
                    Print("CopyBot: Entered LONG " + quantity + " contracts");
                }
                else if (side.ToUpper() == "SELL")
                {
                    if (orderType.ToUpper() == "LIMIT" && entryPrice.HasValue)
                    {
                        EnterShortLimit(quantity, entryPrice.Value, "CopyBot_Short");
                    }
                    else
                    {
                        EnterShort(quantity, "CopyBot_Short");
                    }
                    Print("CopyBot: Entered SHORT " + quantity + " contracts");
                }
                else
                {
                    Print("CopyBot: Unknown side '" + side + "'");
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                Print("CopyBot: Trade execution error - " + ex.Message);
                return false;
            }
        }

        private async Task AcknowledgeDelivery(int deliveryId)
        {
            try
            {
                string url = ApiUrl + "/deliveries/" + deliveryId + "/ack";
                var content = new StringContent("{}", Encoding.UTF8, "application/json");
                await httpClient.PostAsync(url, content);
            }
            catch (Exception ex)
            {
                Print("CopyBot: Error acknowledging delivery - " + ex.Message);
            }
        }

        private async Task ReportExecution(int deliveryId, string status, string error)
        {
            try
            {
                string url = ApiUrl + "/deliveries/" + deliveryId + "/exec";
                var payload = new Dictionary<string, string> { { "status", status } };
                if (!string.IsNullOrEmpty(error))
                {
                    payload["error"] = error;
                }
                string jsonPayload = jsonSerializer.Serialize(payload);
                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
                await httpClient.PostAsync(url, content);
                Print("CopyBot: Reported execution status '" + status + "' for delivery " + deliveryId);
            }
            catch (Exception ex)
            {
                Print("CopyBot: Error reporting execution - " + ex.Message);
            }
        }

        #region Helper Methods
        private string GetStringValue(Dictionary<string, object> dict, string key, string defaultValue)
        {
            if (dict.ContainsKey(key) && dict[key] != null)
            {
                return dict[key].ToString();
            }
            return defaultValue;
        }

        private int GetIntValue(Dictionary<string, object> dict, string key, int defaultValue)
        {
            if (dict.ContainsKey(key) && dict[key] != null)
            {
                return Convert.ToInt32(dict[key]);
            }
            return defaultValue;
        }

        private double? GetDoubleValue(Dictionary<string, object> dict, string key)
        {
            if (dict.ContainsKey(key) && dict[key] != null)
            {
                return Convert.ToDouble(dict[key]);
            }
            return null;
        }
        #endregion
    }
}
