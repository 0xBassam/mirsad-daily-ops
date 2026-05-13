import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import {
  ClipboardList, CheckSquare, Package, ShoppingCart, Thermometer,
  Wrench, MessageSquare, BarChart2, ArrowRightLeft, Truck,
  Shield, Zap, Globe, ChevronDown, ChevronUp, Star, Check, ArrowRight,
  Building2, Users, FileText,
} from 'lucide-react';

// ─── Nav ─────────────────────────────────────────────────────────────────────

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Mirsad <span className="text-indigo-400 font-light text-sm">مرصاد</span></span>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
              Go to Dashboard →
            </button>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-2">Sign In</Link>
              <Link to="/signup" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
                Start Free Trial
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center bg-slate-950 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6">
          <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"/><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400"/></span>
          Now in public beta — free 14-day trial
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08] mb-6">
          Operations management<br />
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">built for hospitality</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-400 leading-relaxed mb-10">
          Mirsad gives hospitality and facility teams a single platform to manage daily operations, inventory, quality checks, and client requests — across every site, every shift.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/signup" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-base transition-all hover:scale-[1.02] shadow-lg shadow-indigo-500/25">
            Start Free Trial <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#features" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl text-base border border-white/10 transition-colors">
            See How It Works
          </a>
        </div>

        {/* Social proof */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          {['No credit card required', '14-day free trial', 'Cancel anytime', 'Arabic & English'].map(t => (
            <span key={t} className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-indigo-500" />{t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { value: '14', label: 'Operational Modules' },
    { value: '27+', label: 'Floor locations per org' },
    { value: '100%', label: 'Multi-tenant isolated' },
    { value: 'RTL', label: 'Arabic & English' },
  ];
  return (
    <div className="bg-slate-900 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map(s => (
          <div key={s.label}>
            <p className="text-3xl font-extrabold text-indigo-400 mb-1">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const features = [
  { icon: ClipboardList,   title: 'Daily Allocation Plans',    desc: 'Structured daily planning for every floor, shift, and service station. Approval workflows built in.' },
  { icon: CheckSquare,     title: 'Floor Check Forms',         desc: 'Real-time shortage reporting with instant digital sign-off. Reduces waste and response time.' },
  { icon: Package,         title: 'Inventory Management',      desc: 'Food and materials tracked separately. Live balance, movement ledger, and consumption analytics.' },
  { icon: ShoppingCart,    title: 'Purchase Orders',           desc: 'Full PO lifecycle — creation, approval, receiving, and variance reporting in one flow.' },
  { icon: Truck,           title: 'Receiving & Delivery',      desc: 'Delivery confirmation with partial receiving support. Auto-updates inventory on confirm.' },
  { icon: ArrowRightLeft,  title: 'Warehouse Transfers',       desc: 'Move stock from warehouse to floor. Instant stock movement record created on confirmation.' },
  { icon: Thermometer,     title: 'Food Safety & FIFO',        desc: 'Fridge checks, expiry tracking, spoilage recording, and FIFO/FEFO batch management.' },
  { icon: Wrench,          title: 'Maintenance Requests',      desc: 'Log, assign, and close maintenance tickets with priority levels and technician tracking.' },
  { icon: MessageSquare,   title: 'Client Request Lifecycle',  desc: 'Operation and coffee break requests submitted, assigned, delivered, and confirmed — all tracked.' },
  { icon: BarChart2,       title: 'Reports & Exports',         desc: 'PDF and Excel exports for all major modules. Organization-branded headers and footers.' },
  { icon: Shield,          title: 'Role-Based Access',         desc: '9 roles: Admin, Supervisor, Assistant, Project Manager, Warehouse, Kitchen, Client, and more.' },
  { icon: Building2,       title: 'Multi-Site Support',        desc: 'One organization, multiple projects and buildings. Each with its own floors and teams.' },
];

function Features() {
  return (
    <section id="features" className="bg-slate-950 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider mb-3">Platform Modules</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything your operations team needs</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">From daily floor checks to end-of-month inventory reports — Mirsad covers the full operational lifecycle of hospitality and facility management.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                  <Icon className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Workflow section ─────────────────────────────────────────────────────────

function Workflow() {
  const steps = [
    { n: '01', title: 'Create your organization', desc: 'Sign up, pick a plan, and set up your first site in under 3 minutes. Invite your team by role.' },
    { n: '02', title: 'Configure your operations', desc: 'Add buildings, floors, items, and categories. Each org is fully isolated — your data is yours.' },
    { n: '03', title: 'Run daily operations', desc: 'Teams submit floor checks, purchase orders, maintenance tickets, and client requests from any device.' },
    { n: '04', title: 'Track, approve, export', desc: 'Managers review, approve, and export branded PDF and Excel reports. Full audit trail throughout.' },
  ];
  return (
    <section className="bg-slate-900 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider mb-3">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Operational in minutes, not months</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(s => (
            <div key={s.n} className="relative">
              <div className="text-5xl font-black text-slate-800 mb-3">{s.n}</div>
              <h3 className="text-white font-semibold mb-2">{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const plans = [
  {
    name: 'Trial',
    price: 'Free',
    period: '14 days',
    description: 'Full platform access to evaluate fit for your team.',
    cta: 'Start Free Trial',
    ctaTo: '/signup',
    highlight: false,
    features: ['5 users', '1 project/site', '500 MB storage', 'All core modules', 'Email support'],
  },
  {
    name: 'Starter',
    price: '$99',
    period: '/month',
    description: 'For small teams running a single location.',
    cta: 'Get Started',
    ctaTo: '/signup',
    highlight: false,
    features: ['20 users', '3 projects/sites', '2 GB storage', 'All core modules', 'PO & Inventory', 'FIFO/FEFO', 'Spoilage recording'],
  },
  {
    name: 'Professional',
    price: '$299',
    period: '/month',
    description: 'Multi-site teams with advanced workflows.',
    cta: 'Start Trial',
    ctaTo: '/signup',
    highlight: true,
    badge: 'Most Popular',
    features: ['100 users', '10 projects/sites', '10 GB storage', 'Everything in Starter', 'Warehouse transfers', 'Receiving workflow', 'Advanced reports & exports'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Large-scale hospitality and facility groups.',
    cta: 'Contact Us',
    ctaTo: '/signup',
    highlight: false,
    features: ['Unlimited users', 'Unlimited sites', '100 GB storage', 'Everything in Professional', 'Maintenance requests', 'Client request lifecycle', 'White-label & custom domain', 'Dedicated support'],
  },
];

function Pricing() {
  return (
    <section id="pricing" className="bg-slate-950 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Start with a 14-day free trial. No credit card required. Upgrade, downgrade, or cancel at any time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map(plan => (
            <div key={plan.name} className={`relative rounded-2xl p-6 flex flex-col border transition-all ${plan.highlight ? 'bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-500/25 scale-[1.02]' : 'bg-slate-900 border-slate-800'}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-indigo-700 text-xs font-bold rounded-full">
                  {plan.badge}
                </div>
              )}
              <div className="mb-5">
                <p className={`text-sm font-semibold mb-2 ${plan.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>{plan.name}</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-white'}`}>{plan.price}</span>
                  {plan.period && <span className={`text-sm pb-1 ${plan.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>{plan.period}</span>}
                </div>
                <p className={`text-sm ${plan.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>{plan.description}</p>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-white' : 'text-indigo-400'}`} />
                    <span className={plan.highlight ? 'text-white' : 'text-slate-300'}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link to={plan.ctaTo}
                className={`w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                  plan.highlight
                    ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                    : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                }`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Demo section ─────────────────────────────────────────────────────────────

function DemoSection() {
  const roles = [
    { role: 'Admin', email: 'admin@demo.mirsad.app', desc: 'Full platform access — settings, users, all modules' },
    { role: 'Project Manager', email: 'manager@demo.mirsad.app', desc: 'Reports, approvals, POs, and inventory oversight' },
    { role: 'Supervisor', email: 'supervisor@demo.mirsad.app', desc: 'Floor checks, daily plans, maintenance, requests' },
    { role: 'Client', email: 'client@demo.mirsad.app', desc: 'Submit and track operation & coffee break requests' },
  ];

  return (
    <section className="bg-slate-900 py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider mb-3">Live Demo</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Explore the platform now</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            The demo organization is pre-loaded with realistic cafeteria operations data — floors, inventory, purchase orders, and more.
          </p>
        </div>

        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-slate-400">Demo Organization — Enterprise plan — All features enabled</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {roles.map(r => (
              <div key={r.role} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">{r.role}</span>
                  <span className="text-xs text-slate-500">pw: demo1234</span>
                </div>
                <p className="text-sm text-white font-mono mb-1">{r.email}</p>
                <p className="text-xs text-slate-500">{r.desc}</p>
              </div>
            ))}
          </div>

          <Link to="/login" className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors">
            Explore Demo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const faqs = [
  { q: 'Is Mirsad only for food service?', a: 'Primarily yes — it was built for hospitality and facility management. But the core modules (inventory, maintenance, requests, floor checks) apply broadly to any team managing physical operations across multiple floors or buildings.' },
  { q: 'Can multiple organizations use the same platform?', a: 'Yes. Mirsad is fully multi-tenant. Each organization is completely isolated — no data is shared between tenants, not even by super admins browsing analytics.' },
  { q: 'Does it support Arabic?', a: 'Yes, Mirsad ships with full Arabic (RTL) and English support. Users can switch language at any time from the sidebar. All forms, labels, and navigation support both directions.' },
  { q: 'What happens after my trial ends?', a: 'Your data is preserved. You can upgrade to a paid plan to continue. We will notify you before your trial expires so you have time to decide.' },
  { q: 'Can I run it on mobile?', a: 'Yes. Mirsad is mobile-responsive and designed for use on phones and tablets. Supervisors and assistants frequently use it on the floor from their phones.' },
  { q: 'How is tenant isolation enforced?', a: 'Every database document carries an organization ID. Every query is scoped to the current user\'s organization — enforced at the server layer, not the client. A user from Org A cannot access any data from Org B even if they know the document IDs.' },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="bg-slate-950 py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Common questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left text-white font-medium hover:bg-slate-800/50 transition-colors"
              >
                <span>{f.q}</span>
                {open === i ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />}
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-slate-400 text-sm leading-relaxed border-t border-slate-800 pt-3">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="bg-indigo-600 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          Ready to launch your operations platform?
        </h2>
        <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">
          Start your free 14-day trial. No credit card required. Full platform access from day one.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
            Start Free Trial <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-500/30 border border-indigo-400/30 text-white font-semibold rounded-xl hover:bg-indigo-500/40 transition-colors">
            Sign In to Existing Account
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <span className="text-white font-bold">Mirsad · مرصاد</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Daily operations management platform for hospitality and facility teams. Multi-tenant, multi-site, Arabic & English.
            </p>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-3">Platform</p>
            <div className="space-y-2 text-sm text-slate-400">
              <a href="#features" className="block hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="block hover:text-white transition-colors">Pricing</a>
              <Link to="/signup" className="block hover:text-white transition-colors">Start Trial</Link>
              <Link to="/login" className="block hover:text-white transition-colors">Sign In</Link>
            </div>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-3">Account</p>
            <div className="space-y-2 text-sm text-slate-400">
              <Link to="/signup" className="block hover:text-white transition-colors">Create Organization</Link>
              <Link to="/login" className="block hover:text-white transition-colors">Login</Link>
              <Link to="/settings/subscription" className="block hover:text-white transition-colors">Subscription</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span>© {new Date().getFullYear()} Mirsad Operations Platform. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> Arabic & English</span>
            <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> Multi-tenant secure</span>
            <span className="flex items-center gap-1.5"><Zap className="h-3 w-3" /> Real-time</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <Hero />
      <StatsBar />
      <Features />
      <Workflow />
      <Pricing />
      <DemoSection />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
