import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-950">
      {/* Header */}
      <header className="border-b border-surface-800/50 backdrop-blur-md bg-surface-950/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-xl shadow-lg shadow-primary-500/20">
              🤖
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-surface-300 bg-clip-text text-transparent">
              CopyBot
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/subscriber/login" className="text-surface-400 hover:text-white transition-colors hidden sm:block">
              Subscriber Login
            </Link>
            <Link to="/login" className="text-surface-400 hover:text-white transition-colors">
              Host Login
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Stock chart background pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute inset-0 w-full h-full opacity-[0.07]" preserveAspectRatio="none" viewBox="0 0 1200 600">
            {/* Main uptrend line */}
            <path 
              d="M0 500 L50 480 L100 490 L150 450 L200 460 L250 400 L300 420 L350 350 L400 370 L450 300 L500 320 L550 250 L600 270 L650 200 L700 230 L750 180 L800 200 L850 150 L900 170 L950 120 L1000 140 L1050 100 L1100 120 L1150 80 L1200 100" 
              fill="none" 
              stroke="url(#chartGradient)" 
              strokeWidth="3"
              className="animate-pulse"
            />
            {/* Secondary line */}
            <path 
              d="M0 520 L60 510 L120 530 L180 490 L240 510 L300 460 L360 480 L420 420 L480 440 L540 380 L600 400 L660 340 L720 360 L780 300 L840 320 L900 270 L960 290 L1020 240 L1080 260 L1140 220 L1200 240" 
              fill="none" 
              stroke="url(#chartGradient2)" 
              strokeWidth="2"
              opacity="0.6"
            />
            {/* Candlestick-like vertical bars */}
            {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100].map((x, i) => (
              <g key={i}>
                <line x1={x} y1={450 - i * 30} x2={x} y2={480 - i * 30} stroke="#6366f1" strokeWidth="4" opacity="0.15" />
                <line x1={x} y1={440 - i * 30} x2={x} y2={490 - i * 30} stroke="#6366f1" strokeWidth="1" opacity="0.1" />
              </g>
            ))}
            {/* Grid lines */}
            {[100, 200, 300, 400, 500].map((y) => (
              <line key={y} x1="0" y1={y} x2="1200" y2={y} stroke="#6366f1" strokeWidth="0.5" opacity="0.1" strokeDasharray="5,5" />
            ))}
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="chartGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-800/50 border border-surface-700/50 text-sm text-surface-300 mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Real-time signal delivery
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Copy Trade Signals to{' '}
            <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-primary-400 bg-clip-text text-transparent">
              NinjaTrader
            </span>{' '}
            Instantly
          </h1>
          
          <p className="text-xl text-surface-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Automate your trading by syncing signals from Discord to NinjaTrader in real-time. 
            Perfect for signal providers and their subscribers.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
            <a href="#features">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-surface-900/50 to-surface-950" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-surface-400 max-w-2xl mx-auto">
              Three simple steps to automate your trading workflow
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon="📡"
              step="1"
              title="Send Signals"
              description="Use the /trade command in Discord to broadcast signals to all your subscribers instantly."
            />
            <FeatureCard
              icon="⚡"
              step="2"
              title="Real-Time Delivery"
              description="Signals are delivered via WebSocket in milliseconds. No polling, no delays."
            />
            <FeatureCard
              icon="🎯"
              step="3"
              title="Auto Execute"
              description="NinjaTrader receives the signal and executes the trade automatically with your settings."
            />
          </div>
        </div>
      </section>

      {/* For Hosts */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-sm text-primary-400 mb-6">
                For Signal Providers
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Everything you need to run a signal service
              </h2>
              <ul className="space-y-4">
                {[
                  'Discord bot with /trade command',
                  'Dashboard to manage subscribers',
                  'Trade analytics and performance tracking',
                  'Whop integration for payments',
                  'Invite links for easy onboarding',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-400 text-sm">✓</span>
                    </span>
                    <span className="text-surface-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="inline-block mt-8">
                <Button>Create Host Account</Button>
              </Link>
            </div>
            
            <div className="bg-surface-800/50 backdrop-blur-sm rounded-2xl p-6 border border-surface-700/50">
              <div className="bg-surface-900 rounded-xl p-5 font-mono text-sm">
                <p className="text-surface-500"># Discord command</p>
                <p className="text-emerald-400 mt-2">/trade symbol:ES side:BUY entry:5000 sl:4990 tp:5020</p>
                <div className="h-px bg-surface-700 my-4" />
                <p className="text-surface-500"># Delivered to all subscribers instantly</p>
                <p className="text-primary-400 mt-2">→ 15 subscribers notified</p>
                <p className="text-primary-400">→ 12 trades executed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Subscribers */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-surface-900/50 to-surface-950" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 bg-surface-800/50 backdrop-blur-sm rounded-2xl p-6 border border-surface-700/50">
              <h4 className="text-surface-400 text-sm mb-4 font-medium">Subscriber Settings</h4>
              <div className="space-y-3">
                {[
                  { label: 'Max trades/day', value: '10' },
                  { label: 'Sessions', value: 'NY, London' },
                  { label: 'Max daily loss', value: '$500' },
                  { label: 'Position size', value: '2 contracts' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-surface-900/50 rounded-lg border border-surface-700/30">
                    <span className="text-surface-400">{item.label}</span>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm text-purple-400 mb-6">
                For Subscribers
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Full control over your trading
              </h2>
              <ul className="space-y-4">
                {[
                  'Customize trading sessions (NY, London, Asia)',
                  'Set daily trade limits',
                  'Risk management (max loss, position size)',
                  'Symbol whitelist/blacklist',
                  'Trade history and analytics',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-400 text-sm">✓</span>
                    </span>
                    <span className="text-surface-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/subscriber/login" className="inline-block mt-8">
                <Button variant="secondary">Subscriber Portal</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Automate Your Trading?
          </h2>
          <p className="text-surface-400 mb-10 text-lg">
            Join signal providers who trust CopyBot to deliver their trades to subscribers in real-time.
          </p>
          <Link to="/register">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-800/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-sm">
              🤖
            </div>
            <span className="text-white font-semibold">CopyBot</span>
          </div>
          <div className="flex gap-6 text-surface-400 text-sm">
            <Link to="/login" className="hover:text-white transition-colors">Host Login</Link>
            <Link to="/subscriber/login" className="hover:text-white transition-colors">Subscriber Login</Link>
            <Link to="/admin/login" className="hover:text-white transition-colors">Admin</Link>
          </div>
          <p className="text-surface-500 text-sm">© 2024 CopyBot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, step, title, description }) {
  return (
    <div className="group relative bg-surface-800/30 backdrop-blur-sm rounded-2xl p-6 border border-surface-700/50 hover:border-primary-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center text-2xl">
          {icon}
        </div>
        <span className="text-xs font-medium text-surface-500 bg-surface-800 px-2 py-1 rounded-full">
          Step {step}
        </span>
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-surface-400 leading-relaxed">{description}</p>
    </div>
  )
}
