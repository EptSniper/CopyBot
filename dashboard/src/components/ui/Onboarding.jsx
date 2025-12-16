import { useState, useEffect } from 'react'
import { Button } from './Button'

const ONBOARDING_KEY = 'copybot_onboarding_complete'

const steps = [
  {
    title: 'Welcome to CopyBot! 🎉',
    description: 'Your automated trading signal platform. Let\'s get you set up in just a few steps.',
    icon: '🤖'
  },
  {
    title: 'Get Your API Key',
    description: 'Go to Settings to find your unique API key. You\'ll need this to connect NinjaTrader.',
    icon: '🔑'
  },
  {
    title: 'Connect NinjaTrader',
    description: 'Install the CopyBot indicator in NinjaTrader and paste your API key in the settings.',
    icon: '📊'
  },
  {
    title: 'Invite Subscribers',
    description: 'Create invite links to share with your subscribers. They\'ll get their own API keys.',
    icon: '👥'
  },
  {
    title: 'Send Signals',
    description: 'When you trade, signals are automatically sent to all your active subscribers!',
    icon: '📡'
  }
]

export function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY)
    if (!completed) {
      setVisible(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setVisible(false)
    onComplete?.()
  }

  if (!visible) return null

  const step = steps[currentStep]


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-900 border border-surface-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentStep
                  ? 'w-6 bg-primary-500'
                  : i < currentStep
                  ? 'bg-primary-500/50'
                  : 'bg-surface-600'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="text-6xl text-center mb-4">{step.icon}</div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-white text-center mb-3">{step.title}</h2>
        <p className="text-surface-400 text-center mb-8">{step.description}</p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleSkip} className="flex-1">
            Skip
          </Button>
          <Button onClick={handleNext} className="flex-1">
            {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
          </Button>
        </div>

        {/* Step counter */}
        <p className="text-center text-surface-500 text-sm mt-4">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>
    </div>
  )
}

// Subscriber onboarding steps
const subscriberSteps = [
  {
    title: 'Welcome, Subscriber! 👋',
    description: 'You\'re now connected to receive trading signals. Let\'s set things up.',
    icon: '🎯'
  },
  {
    title: 'Your API Key',
    description: 'Copy your API key from the dashboard. You\'ll need it for NinjaTrader.',
    icon: '🔑'
  },
  {
    title: 'Install CopyBot',
    description: 'Download and install the CopyBot indicator in NinjaTrader, then paste your API key.',
    icon: '💻'
  },
  {
    title: 'Configure Preferences',
    description: 'Set your trading sessions, risk limits, and symbol filters in Settings.',
    icon: '⚙️'
  },
  {
    title: 'Start Receiving Signals',
    description: 'That\'s it! Signals will now automatically execute based on your preferences.',
    icon: '📈'
  }
]

export function SubscriberOnboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem('copybot_sub_onboarding')
    if (!completed) {
      setVisible(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < subscriberSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    localStorage.setItem('copybot_sub_onboarding', 'true')
    setVisible(false)
    onComplete?.()
  }

  if (!visible) return null

  const step = subscriberSteps[currentStep]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-900 border border-surface-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-center gap-2 mb-6">
          {subscriberSteps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentStep ? 'w-6 bg-purple-500' : i < currentStep ? 'bg-purple-500/50' : 'bg-surface-600'
              }`}
            />
          ))}
        </div>
        <div className="text-6xl text-center mb-4">{step.icon}</div>
        <h2 className="text-2xl font-bold text-white text-center mb-3">{step.title}</h2>
        <p className="text-surface-400 text-center mb-8">{step.description}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleComplete} className="flex-1">Skip</Button>
          <Button onClick={handleNext} className="flex-1">
            {currentStep < subscriberSteps.length - 1 ? 'Next' : 'Get Started'}
          </Button>
        </div>
        <p className="text-center text-surface-500 text-sm mt-4">
          Step {currentStep + 1} of {subscriberSteps.length}
        </p>
      </div>
    </div>
  )
}
