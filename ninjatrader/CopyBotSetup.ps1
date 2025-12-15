# CopyBot Signal Receiver Setup Script
# Run this script to install and configure CopyBot

$ErrorActionPreference = "Stop"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  CopyBot Signal Receiver Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
$nodeVersion = $null
try {
    $nodeVersion = node --version 2>$null
} catch {}

if (-not $nodeVersion) {
    Write-Host "Node.js is not installed. Installing..." -ForegroundColor Yellow
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    Start-Process "https://nodejs.org/"
    exit 1
}

Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# Get API key from user
Write-Host ""
$apiKey = Read-Host "Enter your CopyBot API Key (sub_xxx)"

if (-not $apiKey -or -not $apiKey.StartsWith("sub_")) {
    Write-Host "Invalid API key. It should start with 'sub_'" -ForegroundColor Red
    exit 1
}

# Create config file
$configDir = "$env:USERPROFILE\.copybot"
$configFile = "$configDir\config.json"

if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir | Out-Null
}

$config = @{
    apiKey = $apiKey
    serverUrl = "wss://copybot-api.onrender.com/ws"
    signalFile = "$env:USERPROFILE\Documents\NinjaTrader 8\incoming_signals.txt"
} | ConvertTo-Json

$config | Out-File -FilePath $configFile -Encoding UTF8

Write-Host ""
Write-Host "Configuration saved!" -ForegroundColor Green
Write-Host "Config file: $configFile" -ForegroundColor Gray

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptDir
npm install ws 2>$null
Pop-Location

# Create startup shortcut
$startupFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$shortcutPath = "$startupFolder\CopyBot.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = "node"
$Shortcut.Arguments = "`"$scriptDir\copybot-client-auto.js`""
$Shortcut.WorkingDirectory = $scriptDir
$Shortcut.WindowStyle = 7 # Minimized
$Shortcut.Save()

Write-Host "Startup shortcut created - CopyBot will run automatically on Windows startup" -ForegroundColor Green

# Create the auto-config client
$autoClient = @"
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Load config
const configPath = path.join(os.homedir(), '.copybot', 'config.json');
let config;
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
    console.log('Config not found. Run CopyBotSetup.ps1 first.');
    process.exit(1);
}

const API_KEY = config.apiKey;
const WS_URL = config.serverUrl;
const SIGNAL_FILE = config.signalFile;

console.log('=== CopyBot Signal Receiver ===');
console.log('Signal file:', SIGNAL_FILE);
console.log('Connecting to:', WS_URL);

const signalDir = path.dirname(SIGNAL_FILE);
if (!fs.existsSync(signalDir)) {
    fs.mkdirSync(signalDir, { recursive: true });
}

function connect() {
    const ws = new WebSocket(WS_URL + '?key=' + API_KEY);
    
    ws.on('open', () => console.log('[' + new Date().toISOString() + '] Connected!'));
    
    ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'signal' && msg.trade) writeSignal(msg.trade);
        else if (msg.type === 'signals') msg.signals.forEach(s => writeSignal(s.trade));
    });
    
    ws.on('close', () => {
        console.log('Disconnected. Reconnecting...');
        setTimeout(connect, 2000);
    });
    
    ws.on('error', (err) => console.log('Error:', err.message));
}

function writeSignal(trade) {
    const line = [
        trade.symbol, trade.side, trade.orderType || 'MARKET',
        trade.entryPrice || '', trade.stopLoss || '',
        (trade.takeProfits && trade.takeProfits[0]) ? trade.takeProfits[0].price : '',
        trade.quantity || 1, 0, new Date().toISOString()
    ].join(',') + '\n';
    
    fs.appendFileSync(SIGNAL_FILE, line);
    console.log('SIGNAL:', trade.symbol, trade.side);
}

connect();
"@

$autoClient | Out-File -FilePath "$scriptDir\copybot-client-auto.js" -Encoding UTF8

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start receiving signals now, run:" -ForegroundColor Yellow
Write-Host "  node copybot-client-auto.js" -ForegroundColor White
Write-Host ""
Write-Host "CopyBot will also start automatically when Windows starts." -ForegroundColor Gray
Write-Host ""

# Ask to start now
$startNow = Read-Host "Start CopyBot now? (Y/n)"
if ($startNow -ne "n" -and $startNow -ne "N") {
    Write-Host "Starting CopyBot..." -ForegroundColor Green
    Start-Process -FilePath "node" -ArgumentList "`"$scriptDir\copybot-client-auto.js`"" -WindowStyle Normal
}
