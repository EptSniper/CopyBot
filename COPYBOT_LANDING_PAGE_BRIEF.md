# CopyBot Landing Page Design Brief

## Project Overview
Create a stunning, modern landing page for **CopyBot** - an automated trading signal copy platform that allows traders to share their signals with subscribers who automatically execute trades in NinjaTrader.

---

## Brand Identity

### Product Name
**CopyBot** - Automated Trading Signal Platform

### Tagline Options
- "Copy Trades. Automatically."
- "Your Trades, Their Success"
- "Automate Your Trading Empire"
- "Signal. Copy. Profit."

### Brand Personality
- Professional yet approachable
- Tech-forward and innovative
- Trustworthy and reliable
- Premium but accessible

---

## Color Palette

### Primary Colors
```css
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6;  /* Main brand blue */
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;
```

### Accent Colors
```css
--purple-500: #8b5cf6;   /* Secondary accent */
--purple-600: #7c3aed;
--emerald-400: #34d399;  /* Success/profit */
--emerald-500: #10b981;
--red-400: #f87171;      /* Danger/loss */
--red-500: #ef4444;
--amber-400: #fbbf24;    /* Warning/pending */
```

### Surface Colors (Dark Theme)
```css
--surface-50: #f8fafc;
--surface-100: #f1f5f9;
--surface-200: #e2e8f0;
--surface-300: #cbd5e1;
--surface-400: #94a3b8;
--surface-500: #64748b;
--surface-600: #475569;
--surface-700: #334155;
--surface-800: #1e293b;
--surface-900: #0f172a;
--surface-950: #020617;  /* Darkest background */
```

### Gradients
```css
/* Hero gradient */
background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);

/* Primary button gradient */
background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);

/* Card glow effect */
box-shadow: 0 0 60px rgba(59, 130, 246, 0.15);

/* Text gradient */
background: linear-gradient(135deg, #3b82f6, #8b5cf6);
-webkit-background-clip: text;
color: transparent;
```

---

## Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```
Import: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap`

### Font Sizes
- Hero headline: 4rem - 5rem (64px - 80px), font-weight: 800
- Section headlines: 2.5rem - 3rem (40px - 48px), font-weight: 700
- Subheadlines: 1.25rem - 1.5rem (20px - 24px), font-weight: 500
- Body text: 1rem - 1.125rem (16px - 18px), font-weight: 400
- Small text: 0.875rem (14px)

---

## Design Elements

### Glassmorphism Cards
```css
.glass-card {
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.glass-card:hover {
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.1);
  transform: translateY(-4px);
  transition: all 0.3s ease;
}
```

### Buttons
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  padding: 14px 32px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(59, 130, 246, 0.5);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  border: 2px solid rgba(148, 163, 184, 0.3);
  color: white;
  padding: 14px 32px;
  border-radius: 12px;
}

.btn-secondary:hover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}
```

### Background Pattern
Add a subtle stock chart SVG pattern as background:
```css
body {
  background-color: #020617;
  background-image: url("data:image/svg+xml,..."); /* Stock chart pattern */
  background-repeat: repeat;
  background-size: 400px;
  opacity: 0.03; /* Very subtle */
}
```

---

## Animations

### Fade In Up (for sections)
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}
```

### Float Animation (for hero elements)
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

### Pulse Glow (for CTAs)
```css
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
  50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
}
```

### Scroll-triggered animations
Use Intersection Observer or a library like AOS (Animate On Scroll) for elements to animate as they enter viewport.

---

## Page Sections

### 1. Navigation Bar
- Fixed/sticky at top
- Glassmorphism background on scroll
- Logo on left
- Nav links: Features, How It Works, Pricing, FAQ
- CTA buttons: "Login" (ghost), "Get Started" (primary gradient)
- Mobile hamburger menu

### 2. Hero Section
- Large headline with gradient text
- Subheadline explaining the value prop
- Two CTAs: "Start Free Trial" and "Watch Demo"
- Animated mockup/illustration of the platform
- Floating elements (trading icons, chart snippets)
- Subtle particle or grid animation in background

**Copy:**
```
Headline: "Copy Trades. Automatically."
Subheadline: "Share your trading signals with subscribers who execute them instantly in NinjaTrader. Build your trading empire with zero manual work."
```

### 3. Trusted By / Social Proof
- Logos of trading platforms (NinjaTrader logo)
- Stats: "10,000+ Signals Delivered", "500+ Active Traders", "99.9% Uptime"
- Animated counter effect

### 4. Features Section
Grid of 6 feature cards with icons:

1. **Real-Time Signal Delivery**
   - Icon: ⚡ or lightning bolt
   - "Signals delivered instantly via WebSocket"

2. **NinjaTrader Integration**
   - Icon: 📊 or chart
   - "Seamless integration with NinjaTrader 8"

3. **Subscriber Management**
   - Icon: 👥 or users
   - "Manage unlimited subscribers with ease"

4. **Risk Controls**
   - Icon: 🛡️ or shield
   - "Position sizing, daily limits, session filters"

5. **Performance Analytics**
   - Icon: 📈 or trending up
   - "Track win rates, P&L, and more"

6. **Whop Integration**
   - Icon: 💳 or credit card
   - "Monetize with Whop subscription management"

### 5. How It Works
3-step process with connecting lines/arrows:

1. **Connect** - "Link your NinjaTrader account"
2. **Trade** - "Execute trades as you normally would"
3. **Profit** - "Subscribers copy your trades automatically"

Include animated diagram showing signal flow.

### 6. Dashboard Preview
- Large screenshot/mockup of the dashboard
- Glassmorphism frame around it
- Floating annotation callouts pointing to features
- "See it in action" CTA

### 7. Pricing Section
3 pricing tiers in cards:

**Starter** - Free
- 5 subscribers
- Basic analytics
- Email support

**Pro** - $49/mo
- 50 subscribers
- Advanced analytics
- Priority support
- Whop integration

**Enterprise** - $149/mo
- Unlimited subscribers
- White-label options
- Dedicated support
- Custom integrations

Highlight "Pro" as most popular with a badge and glow effect.

### 8. Testimonials
Carousel or grid of testimonial cards:
- Profile photo (placeholder)
- Quote
- Name, title
- Star rating

### 9. FAQ Section
Accordion-style FAQ:
- "How does signal delivery work?"
- "Is my trading data secure?"
- "Can I customize subscriber settings?"
- "What platforms are supported?"
- "How do I get paid?"

### 10. CTA Section
Full-width gradient background section:
- "Ready to Automate Your Trading?"
- Email input + "Get Started" button
- Or just large CTA button

### 11. Footer
- Logo
- Links: Product, Company, Resources, Legal
- Social icons
- Copyright
- "Built for traders, by traders"

---

## Responsive Breakpoints
```css
/* Mobile first */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

---

## Technical Recommendations

### Framework Options
- **Next.js** with Tailwind CSS (recommended)
- **React** with Tailwind CSS
- **Astro** for static site
- **Framer** for no-code

### Libraries to Consider
- **Framer Motion** - Smooth animations
- **AOS** - Scroll animations
- **Lottie** - Complex animations
- **React Icons** - Icon library

### Performance
- Lazy load images
- Use WebP format
- Optimize fonts (subset)
- Minimize JavaScript

---

## Assets Needed
1. Logo (SVG) - Robot/bot icon with trading chart
2. Hero illustration or 3D mockup
3. Feature icons (can use emoji or icon library)
4. Dashboard screenshots/mockups
5. Testimonial photos (can use placeholders)
6. Background patterns/textures

---

## Inspiration References
- Linear.app (clean, modern SaaS)
- Stripe.com (professional, trustworthy)
- Vercel.com (developer-focused, dark theme)
- Raycast.com (glassmorphism, animations)
- Loom.com (friendly, approachable)

---

## Key Design Principles
1. **Dark theme** - Professional trading aesthetic
2. **High contrast** - Easy readability
3. **Generous whitespace** - Clean, uncluttered
4. **Subtle animations** - Polished, not distracting
5. **Clear hierarchy** - Guide the eye to CTAs
6. **Mobile-first** - Responsive at all sizes
7. **Fast loading** - Optimize everything
8. **Accessible** - WCAG AA compliance

---

## Final Notes
The landing page should feel premium and trustworthy - traders are trusting this platform with their money. Use the dark theme to convey professionalism and the blue/purple gradients to add energy and modernity. Every animation should be purposeful and smooth. The goal is to convert visitors into sign-ups while clearly communicating the value proposition.
