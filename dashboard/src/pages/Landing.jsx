import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <span className="text-xl font-bold text-white">CopyBot</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/subscriber/login" className="text-gray-400 hover:text-white">
              Subscriber Login
            </Link>
            <Link to="/login" className="text-gray-400 hover:text-white">
              Host Login
            </Link>
            <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Copy Trade Signals to <span className="text-blue-500">NinjaTrader</span> Instantly
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Automate your trading by syncing signals from Discord to NinjaTrader in real-time. 
            Perfect for signal providers and their subscribers.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register" className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700">
              Start Free Trial
            </Link>
            <a href="#features" className="border border-gray-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-gray-800">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-4">📡</div>
              <h3 className="text-xl font-semibold text-white mb-2">1. Send Signals</h3>
              <p className="text-gray-400">
                Use the /trade command in Discord to broadcast signals to all your subscribers instantly.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-2">2. Real-Time Delivery</h3>
              <p className="text-gray-400">
                Signals are delivered via WebSocket in milliseconds. No polling, no delays.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-2">3. Auto Execute</h3>
              <p className="text-gray-400">
                NinjaTrader receives the signal and executes the trade automatically with your settings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Hosts */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">For Signal Providers</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-300">Discord bot with /trade command</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-300">Dashboard to manage subscribers</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-300">Trade analytics and performance tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-300">Whop integration for payments</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-300">Invite links for easy onboarding</span>
                </li>
              </ul>
              <Link to="/register" className="inline-block mt-8 bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">
                Create Host Account
              </Link>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="bg-gray-900 rounded p-4 font-mono text-sm">
                <p className="text-gray-500"># Discord command</p>
                <p className="text-green-400">/trade symbol:ES side:BUY entry:5000 sl:4990 tp:5020</p>
                <p className="text-gray-500 mt-4"># Delivered to all subscribers instantly</p>
                <p className="text-blue-400">→ 15 subscribers notified</p>
                <p className="text-blue-400">→ 12 trades executed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Subscribers */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 bg-gray-800 rounded-lg p-6">
              <h4 className="text-gray-400 text-sm mb-4">Subscriber Settings</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-900 rounded">
                  <span className="text-gray-300">Max trades/day</span>
                  <span className="text-white">10</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900 rounded">
                  <span className="text-gray-300">Sessions</span>
                  <span className="text-white">NY, London</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900 rounded">
                  <span className="text-gray-300">Max daily loss</span>
                  <span className="text-white">$500</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900 rounded">
                  <span className="text-gray-300">Position size</span>
                  <span className="text-white">2 contracts</span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold text-white mb-6">For Subscribers</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-300">Customize trading sessions (NY, London, Asia)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-300">Set daily trade limits</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-300">Risk management (max loss, position size)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-300">Symbol whitelist/blacklist</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-300">Trade history and analytics</span>
                </li>
              </ul>
              <Link to="/subscriber/login" className="inline-block mt-8 bg-purple-600 text-white px-6 py-3 rounded hover:bg-purple-700">
                Subscriber Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Automate Your Trading?</h2>
          <p className="text-gray-400 mb-8">
            Join signal providers who trust CopyBot to deliver their trades to subscribers in real-time.
          </p>
          <Link to="/register" className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <span className="text-white font-semibold">CopyBot</span>
          </div>
          <div className="flex gap-6 text-gray-400 text-sm">
            <Link to="/login" className="hover:text-white">Host Login</Link>
            <Link to="/subscriber/login" className="hover:text-white">Subscriber Login</Link>
            <Link to="/admin/login" className="hover:text-white">Admin</Link>
          </div>
          <p className="text-gray-500 text-sm">© 2024 CopyBot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
