#region Using declarations
using System;
using System.IO;
using System.ComponentModel.DataAnnotations;
using NinjaTrader.Cbi;
using NinjaTrader.Data;
using NinjaTrader.NinjaScript;
#endregion

namespace NinjaTrader.NinjaScript.Strategies
{
    public class CopyBotFileReader : Strategy
    {
        private string signalFilePath;
        private long lastFilePosition = 0;
        private DateTime lastCheckTime = DateTime.MinValue;
        private FileSystemWatcher fileWatcher;

        #region Properties
        [NinjaScriptProperty]
        [Display(Name = "Default Quantity", Order = 1, GroupName = "Trading Settings")]
        public int DefaultQuantity { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "Enable Trading", Order = 2, GroupName = "Trading Settings")]
        public bool EnableTrading { get; set; }
        #endregion

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Description = "CopyBot File Reader - Reads signals from file for instant execution";
                Name = "CopyBotFileReader";
                Calculate = Calculate.OnEachTick;
                EntriesPerDirection = 1;
                EntryHandling = EntryHandling.AllEntries;
                IsExitOnSessionCloseStrategy = true;
                ExitOnSessionCloseSeconds = 30;
                IsFillLimitOnTouch = false;
                MaximumBarsLookBack = MaximumBarsLookBack.TwoHundredFiftySix;
                OrderFillResolution = OrderFillResolution.Standard;
                StartBehavior = StartBehavior.WaitUntilFlat;
                TimeInForce = TimeInForce.Gtc;
                RealtimeErrorHandling = RealtimeErrorHandling.StopCancelClose;
                StopTargetHandling = StopTargetHandling.PerEntryExecution;
                BarsRequiredToTrade = 0;

                DefaultQuantity = 1;
                EnableTrading = false;
            }
            else if (State == State.DataLoaded)
            {
                signalFilePath = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                    "NinjaTrader 8", "incoming_signals.txt"
                );
                
                // Create file if doesn't exist
                if (!File.Exists(signalFilePath))
                {
                    File.WriteAllText(signalFilePath, "");
                }
                
                // Get current file size to skip old signals
                lastFilePosition = new FileInfo(signalFilePath).Length;
                
                Print("CopyBot: Watching for signals in " + signalFilePath);
            }
        }

        protected override void OnBarUpdate()
        {
            if (State != State.Realtime) return;
            
            // Check file every 100ms
            if ((DateTime.Now - lastCheckTime).TotalMilliseconds < 100) return;
            lastCheckTime = DateTime.Now;
            
            CheckForNewSignals();
        }

        private void CheckForNewSignals()
        {
            try
            {
                if (!File.Exists(signalFilePath)) return;
                
                FileInfo fi = new FileInfo(signalFilePath);
                if (fi.Length <= lastFilePosition) return;
                
                // Read new content
                using (FileStream fs = new FileStream(signalFilePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                {
                    fs.Seek(lastFilePosition, SeekOrigin.Begin);
                    using (StreamReader reader = new StreamReader(fs))
                    {
                        string line;
                        while ((line = reader.ReadLine()) != null)
                        {
                            if (!string.IsNullOrWhiteSpace(line))
                            {
                                ProcessSignalLine(line);
                            }
                        }
                    }
                }
                
                lastFilePosition = fi.Length;
            }
            catch (Exception ex)
            {
                Print("CopyBot: Error reading signals - " + ex.Message);
            }
        }

        private void ProcessSignalLine(string line)
        {
            try
            {
                // Format: SYMBOL,SIDE,ORDERTYPE,ENTRY,SL,TP,QTY,DELIVERYID,TIMESTAMP
                string[] parts = line.Split(',');
                if (parts.Length < 7) return;
                
                string symbol = parts[0].Trim();
                string side = parts[1].Trim().ToUpper();
                string orderType = parts[2].Trim().ToUpper();
                double? entryPrice = string.IsNullOrEmpty(parts[3]) ? (double?)null : double.Parse(parts[3]);
                double? stopLoss = string.IsNullOrEmpty(parts[4]) ? (double?)null : double.Parse(parts[4]);
                double? takeProfit = string.IsNullOrEmpty(parts[5]) ? (double?)null : double.Parse(parts[5]);
                int quantity = string.IsNullOrEmpty(parts[6]) ? DefaultQuantity : int.Parse(parts[6]);
                
                Print("CopyBot: Signal - " + symbol + " " + side + " " + orderType + " Qty:" + quantity);
                
                // Check symbol match
                if (!Instrument.FullName.ToUpper().Contains(symbol.ToUpper()))
                {
                    Print("CopyBot: Symbol mismatch - ignoring");
                    return;
                }
                
                if (!EnableTrading)
                {
                    Print("CopyBot: Trading disabled - signal logged only");
                    return;
                }
                
                // Set stops
                if (stopLoss.HasValue)
                    SetStopLoss(CalculationMode.Price, stopLoss.Value);
                if (takeProfit.HasValue)
                    SetProfitTarget(CalculationMode.Price, takeProfit.Value);
                
                // Execute
                if (side == "BUY")
                {
                    if (orderType == "LIMIT" && entryPrice.HasValue)
                        EnterLongLimit(quantity, entryPrice.Value, "CopyBot_Long");
                    else
                        EnterLong(quantity, "CopyBot_Long");
                    Print("CopyBot: Entered LONG " + quantity);
                }
                else if (side == "SELL")
                {
                    if (orderType == "LIMIT" && entryPrice.HasValue)
                        EnterShortLimit(quantity, entryPrice.Value, "CopyBot_Short");
                    else
                        EnterShort(quantity, "CopyBot_Short");
                    Print("CopyBot: Entered SHORT " + quantity);
                }
            }
            catch (Exception ex)
            {
                Print("CopyBot: Error processing signal - " + ex.Message);
            }
        }
    }
}
