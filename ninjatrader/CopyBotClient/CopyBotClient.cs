using System;
using System.IO;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

class CopyBotClient
{
    static string signalFile;
    static ClientWebSocket ws;
    static CancellationTokenSource cts = new CancellationTokenSource();

    static async Task Main(string[] args)
    {
        Console.WriteLine("=== CopyBot Real-Time Client ===");
        
        string apiKey = args.Length > 0 ? args[0] : "";
        string wsUrl = args.Length > 1 ? args[1] : "ws://localhost:4000/ws";
        
        if (string.IsNullOrEmpty(apiKey))
        {
            Console.Write("Enter subscriber API key: ");
            apiKey = Console.ReadLine();
        }
        
        signalFile = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            "NinjaTrader 8", "incoming_signals.txt"
        );
        
        Console.WriteLine($"Signal file: {signalFile}");
        Console.WriteLine($"Connecting to: {wsUrl}?key={apiKey.Substring(0, 10)}...");
        
        while (!cts.Token.IsCancellationRequested)
        {
            try
            {
                await ConnectAndListen(wsUrl, apiKey);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Connection error: {ex.Message}");
                Console.WriteLine("Reconnecting in 3 seconds...");
                await Task.Delay(3000);
            }
        }
    }

    static async Task ConnectAndListen(string wsUrl, string apiKey)
    {
        ws = new ClientWebSocket();
        var uri = new Uri($"{wsUrl}?key={apiKey}");
        
        await ws.ConnectAsync(uri, cts.Token);
        Console.WriteLine("Connected! Waiting for signals...");
        
        var buffer = new byte[4096];
        
        while (ws.State == WebSocketState.Open)
        {
            var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), cts.Token);
            
            if (result.MessageType == WebSocketMessageType.Close)
            {
                Console.WriteLine("Server closed connection");
                break;
            }
            
            string message = Encoding.UTF8.GetString(buffer, 0, result.Count);
            Console.WriteLine($"[{DateTime.Now:HH:mm:ss.fff}] Received: {message}");
            
            ProcessMessage(message);
        }
    }

    static void ProcessMessage(string json)
    {
        try
        {
            // Simple JSON parsing without external libs
            if (json.Contains("\"type\":\"signal\"") || json.Contains("\"type\":\"signals\""))
            {
                // Extract trade data and write to file
                var trades = ExtractTrades(json);
                foreach (var trade in trades)
                {
                    WriteSignalToFile(trade);
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Parse error: {ex.Message}");
        }
    }

    static string[] ExtractTrades(string json)
    {
        // Simple extraction - find trade objects
        var trades = new System.Collections.Generic.List<string>();
        
        int idx = 0;
        while ((idx = json.IndexOf("\"trade\":", idx)) != -1)
        {
            int start = json.IndexOf('{', idx);
            if (start == -1) break;
            
            int depth = 1;
            int end = start + 1;
            while (depth > 0 && end < json.Length)
            {
                if (json[end] == '{') depth++;
                else if (json[end] == '}') depth--;
                end++;
            }
            
            trades.Add(json.Substring(start, end - start));
            idx = end;
        }
        
        return trades.ToArray();
    }

    static void WriteSignalToFile(string tradeJson)
    {
        try
        {
            string symbol = ExtractValue(tradeJson, "symbol");
            string side = ExtractValue(tradeJson, "side");
            string orderType = ExtractValue(tradeJson, "orderType") ?? "MARKET";
            string entryPrice = ExtractValue(tradeJson, "entryPrice") ?? "";
            string stopLoss = ExtractValue(tradeJson, "stopLoss") ?? "";
            string quantity = ExtractValue(tradeJson, "quantity") ?? "1";
            
            // Extract take profit from takeProfits array
            string takeProfit = "";
            int tpIdx = tradeJson.IndexOf("\"takeProfits\"");
            if (tpIdx != -1)
            {
                int priceIdx = tradeJson.IndexOf("\"price\":", tpIdx);
                if (priceIdx != -1)
                {
                    takeProfit = ExtractValue(tradeJson.Substring(priceIdx), "price") ?? "";
                }
            }
            
            string line = $"{symbol},{side},{orderType},{entryPrice},{stopLoss},{takeProfit},{quantity},0,{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}";
            
            File.AppendAllText(signalFile, line + Environment.NewLine);
            Console.WriteLine($"[SIGNAL] {symbol} {side} {orderType} SL:{stopLoss} TP:{takeProfit} Qty:{quantity}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Write error: {ex.Message}");
        }
    }

    static string ExtractValue(string json, string key)
    {
        string search = $"\"{key}\":";
        int idx = json.IndexOf(search);
        if (idx == -1) return null;
        
        int start = idx + search.Length;
        while (start < json.Length && (json[start] == ' ' || json[start] == '"')) start++;
        
        int end = start;
        bool inQuotes = json[start - 1] == '"';
        
        if (inQuotes)
        {
            end = json.IndexOf('"', start);
            if (end == -1) return null;
            return json.Substring(start, end - start);
        }
        else
        {
            while (end < json.Length && json[end] != ',' && json[end] != '}' && json[end] != ']')
                end++;
            string val = json.Substring(start, end - start).Trim();
            return val == "null" ? null : val;
        }
    }
}
