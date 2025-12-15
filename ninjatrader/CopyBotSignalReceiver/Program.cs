using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Collections.Generic;

namespace CopyBotSignalReceiver
{
    class Program
    {
        static string apiUrl = "http://localhost:4000";
        static string apiKey = "";
        static int localPort = 8585;
        static HttpListener listener;
        static JavaScriptSerializer json = new JavaScriptSerializer();
        
        // File to write signals for NinjaTrader to read
        static string signalFile = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            "NinjaTrader 8", "incoming_signals.txt"
        );

        static void Main(string[] args)
        {
            Console.WriteLine("=== CopyBot Signal Receiver ===");
            
            // Get API key from args or prompt
            if (args.Length > 0)
            {
                apiKey = args[0];
            }
            else
            {
                Console.Write("Enter your subscriber API key: ");
                apiKey = Console.ReadLine();
            }

            if (args.Length > 1)
            {
                apiUrl = args[1];
            }

            Console.WriteLine($"API URL: {apiUrl}");
            Console.WriteLine($"Signal file: {signalFile}");
            Console.WriteLine($"Local webhook port: {localPort}");
            Console.WriteLine();

            // Start local HTTP server for webhooks
            StartWebhookServer();

            // Also poll as backup (every 2 seconds)
            var pollTimer = new Timer(PollForSignals, null, 0, 2000);

            Console.WriteLine("Listening for signals... Press Enter to exit.");
            Console.ReadLine();

            listener?.Stop();
        }

        static void StartWebhookServer()
        {
            try
            {
                listener = new HttpListener();
                listener.Prefixes.Add($"http://localhost:{localPort}/");
                listener.Start();

                ThreadPool.QueueUserWorkItem(o =>
                {
                    while (listener.IsListening)
                    {
                        try
                        {
                            var context = listener.GetContext();
                            ProcessWebhook(context);
                        }
                        catch { }
                    }
                });

                Console.WriteLine($"Webhook server started on port {localPort}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Could not start webhook server: {ex.Message}");
                Console.WriteLine("Will use polling only.");
            }
        }

        static void ProcessWebhook(HttpListenerContext context)
        {
            try
            {
                using (var reader = new StreamReader(context.Request.InputStream))
                {
                    string body = reader.ReadToEnd();
                    Console.WriteLine($"[WEBHOOK] Received: {body}");

                    var data = json.Deserialize<Dictionary<string, object>>(body);
                    if (data != null && data.ContainsKey("trade"))
                    {
                        var trade = data["trade"] as Dictionary<string, object>;
                        if (trade != null)
                        {
                            WriteSignalToFile(trade);
                        }
                    }
                }

                // Respond OK
                context.Response.StatusCode = 200;
                var responseBytes = Encoding.UTF8.GetBytes("OK");
                context.Response.OutputStream.Write(responseBytes, 0, responseBytes.Length);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Webhook error: {ex.Message}");
                context.Response.StatusCode = 500;
            }
            finally
            {
                context.Response.Close();
            }
        }

        static void PollForSignals(object state)
        {
            try
            {
                using (var client = new WebClient())
                {
                    client.Headers.Add("Authorization", $"Bearer {apiKey}");
                    string response = client.DownloadString($"{apiUrl}/signals/next?limit=5");
                    
                    var signals = json.Deserialize<List<Dictionary<string, object>>>(response);
                    
                    if (signals != null && signals.Count > 0)
                    {
                        foreach (var signal in signals)
                        {
                            var trade = signal["trade"] as Dictionary<string, object>;
                            int deliveryId = Convert.ToInt32(signal["delivery_id"]);
                            
                            if (trade != null)
                            {
                                Console.WriteLine($"[POLL] Signal received: {trade["symbol"]} {trade["side"]}");
                                WriteSignalToFile(trade, deliveryId);
                                AcknowledgeDelivery(deliveryId);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                // Silent fail for polling
                if (!ex.Message.Contains("404"))
                {
                    Console.WriteLine($"Poll error: {ex.Message}");
                }
            }
        }

        static void WriteSignalToFile(Dictionary<string, object> trade, int deliveryId = 0)
        {
            try
            {
                string symbol = trade.ContainsKey("symbol") ? trade["symbol"].ToString() : "";
                string side = trade.ContainsKey("side") ? trade["side"].ToString() : "";
                string orderType = trade.ContainsKey("orderType") ? trade["orderType"].ToString() : "MARKET";
                string entryPrice = trade.ContainsKey("entryPrice") && trade["entryPrice"] != null 
                    ? trade["entryPrice"].ToString() : "";
                string stopLoss = trade.ContainsKey("stopLoss") && trade["stopLoss"] != null 
                    ? trade["stopLoss"].ToString() : "";
                string quantity = trade.ContainsKey("quantity") && trade["quantity"] != null 
                    ? trade["quantity"].ToString() : "1";

                string takeProfit = "";
                if (trade.ContainsKey("takeProfits"))
                {
                    var tps = trade["takeProfits"] as System.Collections.ArrayList;
                    if (tps != null && tps.Count > 0)
                    {
                        var tp = tps[0] as Dictionary<string, object>;
                        if (tp != null && tp.ContainsKey("price"))
                        {
                            takeProfit = tp["price"].ToString();
                        }
                    }
                }

                // Write signal in simple format: SYMBOL,SIDE,ORDERTYPE,ENTRY,SL,TP,QTY,DELIVERYID,TIMESTAMP
                string signalLine = $"{symbol},{side},{orderType},{entryPrice},{stopLoss},{takeProfit},{quantity},{deliveryId},{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}";
                
                File.AppendAllText(signalFile, signalLine + Environment.NewLine);
                Console.WriteLine($"[SIGNAL] Written to file: {signalLine}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error writing signal: {ex.Message}");
            }
        }

        static void AcknowledgeDelivery(int deliveryId)
        {
            try
            {
                using (var client = new WebClient())
                {
                    client.Headers.Add("Authorization", $"Bearer {apiKey}");
                    client.Headers.Add("Content-Type", "application/json");
                    client.UploadString($"{apiUrl}/deliveries/{deliveryId}/ack", "POST", "{}");
                }
            }
            catch { }
        }
    }
}
