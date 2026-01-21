import { useState } from "react";
import { Check, ArrowRight, HelpCircle, Zap, Shield, Clock } from "lucide-react";
import * as UI from "@/styles/ui";

const NAV_LINKS = [
  { href: "/#notices", label: "Find notices" },
  { href: "/#for-councils", label: "For councils" },
  { href: "/pricing", label: "Pricing" },
] as const;

type BillingCycle = "monthly" | "annual";

const pricingPlans = {
  individual: {
    name: "Pay as you go",
    description: "Perfect for solicitors, businesses, and individuals publishing occasional notices",
    priceMonthly: 49.99,
    priceAnnual: null,
    features: [
      "£49.99 per notice",
      "Instant publication & timestamped proof",
      "Full audit trail with cryptographic hash",
      "PDF certificate for legal compliance",
      "Public comments & engagement tracking",
      "Geospatial search & discovery",
      "Email support within 24 hours",
      "No subscription required",
    ],
    cta: "Publish a notice",
    ctaHref: "/publish",
    popular: false,
  },
  councilSmall: {
    name: "Parish & Town",
    description: "For small parish and town councils publishing occasional notices",
    priceMonthly: 49,
    priceAnnual: 490,
    includedNotices: 10,
    overageRate: 25,
    features: [
      "10 notices included per month",
      "Overage at £25 per notice",
      "Receiving departments get free portals",
      "Role-based permissions",
      "Email support (24h response)",
      "FOI-ready export packs",
      "Basic templates & guidance",
    ],
    cta: "Get started",
    ctaHref: "#contact",
    popular: false,
  },
  councilMedium: {
    name: "District Council",
    description: "For district and borough councils with moderate publishing needs",
    priceMonthly: 199,
    priceAnnual: 1990,
    includedNotices: 50,
    overageRate: 15,
    features: [
      "50 notices included per month",
      "Overage at £15 per notice",
      "Receiving departments get free portals",
      "Bulk import & API access",
      "Single sign-on (SSO)",
      "Role-based permissions",
      "Priority email & phone support",
      "FOI-ready export packs",
      "Custom templates",
      "Training sessions",
    ],
    cta: "Request demo",
    ctaHref: "#contact",
    popular: true,
  },
  councilLarge: {
    name: "Unitary & County",
    description: "For large unitary, county councils, and combined authorities",
    priceMonthly: 499,
    priceAnnual: 4990,
    includedNotices: null, // Unlimited
    overageRate: null,
    features: [
      "Unlimited notice publications",
      "Receiving departments get free portals",
      "Bulk import & API access",
      "Single sign-on (SSO)",
      "Advanced role-based permissions",
      "Custom branding & domain",
      "Priority email & phone support",
      "Dedicated account manager",
      "FOI-ready export packs",
      "Retention & redaction tools",
      "SLA guarantee (99.9% uptime)",
      "Onboarding & training",
    ],
    cta: "Contact sales",
    ctaHref: "#contact",
    popular: false,
  },
  enterprise: {
    name: "Enterprise",
    description: "For large firms with dedicated licensing departments",
    priceMonthly: 1200,
    priceAnnual: 11520,
    includedNotices: 50,
    overageRate: 35,
    avgPerNotice: 24,
    features: [
      "50 notices included per month",
      "Overage at £35 per notice",
      "Average £24 per notice (52% savings)",
      "Everything in Business, plus:",
      "White-label branding options",
      "Advanced API & webhooks",
      "Custom integrations",
      "Dedicated account manager",
      "24/7 priority support",
      "Custom SLA agreements",
    ],
    cta: "Contact sales",
    ctaHref: "#contact",
    popular: false,
  },
};

const comparisonData = [
  {
    category: "Publishing",
    features: [
      { name: "Number of notices", individual: "Pay per notice", professional: "5/month", business: "15/month", councilSmall: "10/month", councilMedium: "50/month", councilLarge: "Unlimited", enterprise: "50/month" },
      { name: "Instant publication", individual: true, professional: true, business: true, councilSmall: true, councilMedium: true, councilLarge: true, enterprise: true },
      { name: "Bulk import", individual: false, professional: true, business: true, councilSmall: false, councilMedium: true, councilLarge: true, enterprise: true },
      { name: "API access", individual: false, professional: false, business: true, councilSmall: false, councilMedium: true, councilLarge: true, enterprise: true },
      { name: "White-label", individual: false, professional: false, business: false, councilSmall: false, councilMedium: false, councilLarge: false, enterprise: true },
    ],
  },
  {
    category: "Compliance & Legal",
    features: [
      { name: "Cryptographic proof", individual: true, professional: true, business: true, councilSmall: true, councilMedium: true, councilLarge: true, enterprise: true },
      { name: "Audit trail", individual: true, professional: true, business: true, councilSmall: true, councilMedium: true, councilLarge: true, enterprise: true },
      { name: "PDF certificates", individual: true, professional: true, business: true, councilSmall: true, councilMedium: true, councilLarge: true, enterprise: true },
      { name: "FOI-ready exports", individual: false, professional: false, business: false, councilSmall: true, councilMedium: true, councilLarge: true, enterprise: false },
      { name: "Custom retention policies", individual: false, professional: false, business: false, councilSmall: false, councilMedium: false, councilLarge: true, enterprise: false },
    ],
  },
  {
    category: "Support & Service",
    features: [
      { name: "Email support", individual: "24h response", professional: "12h response", business: "4h response", councilSmall: "24h response", councilMedium: "4h response", councilLarge: "4h response", enterprise: "1h response" },
      { name: "Phone support", individual: false, professional: false, business: true, councilSmall: false, councilMedium: true, councilLarge: true, enterprise: true },
      { name: "Dedicated account manager", individual: false, professional: false, business: false, councilSmall: false, councilMedium: false, councilLarge: true, enterprise: true },
      { name: "SLA guarantee", individual: false, professional: false, business: false, councilSmall: false, councilMedium: false, councilLarge: "99.9%", enterprise: "99.99%" },
    ],
  },
];

const oldWayData = [
  {
    icon: "📰",
    title: "Local newspapers",
    oldCost: "£240-£400",
    oldTime: "5-10 working days",
    problems: ["No audit trail", "Limited reach", "No public engagement", "Hard to verify"],
  },
  {
    icon: "📋",
    title: "Council fees",
    oldCost: "£100-£315",
    oldTime: "Immediate",
    problems: ["Admin burden", "Paper-based", "No transparency", "Manual tracking"],
  },
  {
    icon: "⏱️",
    title: "Total process",
    oldCost: "£340-£715",
    oldTime: "Up to 2 weeks",
    problems: ["Slow", "Expensive", "Opaque", "Non-digital"],
  },
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [showComparison, setShowComparison] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className={`${UI.pageWrap} min-h-screen`}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-lg" style={{ height: 'var(--headerH)' }}>
        <div className={`${UI.container} h-full`}>
          <div className="flex h-full items-center justify-between">
            {/* Left: logo + desktop nav */}
            <div className="flex items-center gap-6">
              <a href="/" className="text-xl font-extrabold tracking-tight text-slate-900" style={{ letterSpacing: '-0.5px' }}>
                CivicNotices
              </a>
              <nav className="hidden items-center gap-6 md:flex">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-slate-900"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
            {/* Right: ghost + primary */}
            <div className="flex items-center gap-3">
              <a href="/login" className={`${UI.btnSecondary} h-9 py-0 text-sm`}>
                Sign in
              </a>
              <a href="/publish" className={`${UI.btnPrimary} h-11 py-0 text-sm`}>
                Get started
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pb-12 pt-16 md:pb-16 md:pt-24">
        <div className="absolute -right-16 -top-16 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-300/10 blur-3xl" />

        <div className={`${UI.container} relative z-10`}>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] md:text-6xl">
              Transparent pricing.
              <br />
              No hidden fees.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.12)] md:text-xl">
              From £49.99 per notice. Save up to <strong className="text-white">85%</strong> compared to traditional newspaper publication.
            </p>
          </div>

          {/* Savings Banner */}
          <div className="mx-auto mt-10 max-w-4xl">
            <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-8 shadow-lg text-center">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-200/20 blur-3xl" />
              <div className="relative">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-900">
                  <Zap className="h-4 w-4" />
                  Breaking news
                </div>
                <h2 className="mb-4 text-2xl font-bold text-slate-900 md:text-3xl">
                  The government is modernising public notice requirements
                </h2>
                <p className="mx-auto max-w-2xl text-base text-slate-700">
                  Chancellor Rachel Reeves announced plans to remove the requirement for businesses to advertise licensing applications in local newspapers — calling the current system <strong>"outdated"</strong>. CivicNotices provides a modern, digital-first alternative that's faster, cheaper, and more transparent.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-6">
                  <div>
                    <div className="text-3xl font-bold text-blue-700">£46.29m</div>
                    <div className="text-sm text-slate-600">spent by councils on newspaper notices (2022)</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-700">85%</div>
                    <div className="text-sm text-slate-600">savings with CivicNotices</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-700">Instant</div>
                    <div className="text-sm text-slate-600">publication vs 5-10 days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Old Way vs New Way */}
      <section className="py-16 md:py-24">
        <div className={UI.container}>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Why CivicNotices is the better way
            </h2>
            <p className="mt-4 text-lg text-slate-600">Traditional newspaper notices are slow, expensive, and lack transparency</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {oldWayData.map((item, index) => (
              <div key={index} className={`${UI.card} p-6`}>
                <div className="mb-4 text-4xl">{item.icon}</div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">{item.title}</h3>
                <div className="mb-4 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-slate-500">Old cost:</span>
                    <span className="ml-2 text-lg font-bold text-slate-900 line-through">{item.oldCost}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-500">Old time:</span>
                    <span className="ml-2 text-base font-semibold text-slate-700 line-through">{item.oldTime}</span>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {item.problems.map((problem, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                      {problem}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-blue-50 p-8 text-center">
            <div className="mx-auto max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-900">
                <Shield className="h-4 w-4" />
                With CivicNotices
              </div>
              <h3 className="mb-3 text-2xl font-bold text-slate-900">
                From £49.99 per notice • Instant publication • Full audit trail
              </h3>
              <p className="text-slate-700">
                Digital-first, compliant with upcoming regulations, and trusted by 40+ UK councils
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Billing Toggle */}
      <section className="py-8">
        <div className={UI.container}>
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-full bg-white p-1.5 shadow-md ring-1 ring-slate-200">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                  billingCycle === "monthly"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                  billingCycle === "annual"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Annual
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Individual/Direct Publishing */}
      <section className="pb-8">
        <div className={UI.container}>
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              For Individuals & One-Off Publishing
            </h2>
            <p className="mt-4 text-lg text-slate-600">Simple pay-as-you-go pricing with no commitment</p>
          </div>

          <div className="mx-auto max-w-lg">
            <div className={`${UI.card} relative overflow-hidden p-8`}>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{pricingPlans.individual.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{pricingPlans.individual.description}</p>
              </div>

              <div className="mt-6">
                <span className="text-5xl font-extrabold tracking-tight text-slate-900">
                  £{pricingPlans.individual.priceMonthly}
                </span>
                <span className="ml-2 text-lg text-slate-600">/notice</span>
              </div>

              <a
                href={pricingPlans.individual.ctaHref}
                className="mt-8 block w-full rounded-xl bg-slate-100 py-3 text-center text-base font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                {pricingPlans.individual.cta}
              </a>

              <ul className="mt-8 space-y-3">
                {pricingPlans.individual.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Law Firms */}
      <section className="pb-16 md:pb-24">
        <div className={UI.container}>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              For Law Firms & Professional Services
            </h2>
            <p className="mt-4 text-lg text-slate-600">Volume-based pricing with professional tools and support</p>
          </div>

          <div className="mx-auto max-w-lg">
            {['enterprise'].map((key) => {
              const plan = pricingPlans[key as keyof typeof pricingPlans];
              const price =
                plan.priceAnnual && billingCycle === "annual"
                  ? plan.priceAnnual
                  : plan.priceMonthly;

              return (
                <div
                  key={key}
                  className={`${UI.card} relative overflow-hidden p-8 ${
                    plan.popular ? "ring-2 ring-blue-600 shadow-2xl" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute right-6 top-6">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                        <Zap className="h-3 w-3" />
                        Most popular
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                  </div>

                  <div className="mt-6">
                    <span className="text-5xl font-extrabold tracking-tight text-slate-900">
                      £{price}
                    </span>
                    <span className="ml-2 text-lg text-slate-600">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                    {billingCycle === "annual" && plan.priceAnnual && (
                      <div className="mt-2 text-sm text-emerald-600 font-medium">
                        Save £{plan.priceMonthly! * 12 - plan.priceAnnual} per year
                      </div>
                    )}
                  </div>

                  <a
                    href={plan.ctaHref}
                    className={`mt-8 block w-full rounded-xl py-3 text-center text-base font-semibold transition ${
                      plan.popular
                        ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700"
                        : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                    }`}
                  >
                    {plan.cta}
                  </a>

                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Council - Premium Section */}
      <section className="pb-16 md:pb-24">
        <div className={UI.container}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-12 md:p-16">
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">
              <div className="mb-12 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur">
                  <Shield className="h-4 w-4" />
                  Government Solution
                </div>
                <h2 className="text-3xl font-bold text-white md:text-4xl">
                  For Local Councils & Authorities
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
                  Scalable pricing for councils of all sizes. For departments that publish notices (Planning, Traffic, Environmental Health). Departments that only receive notices (Licensing) get free access.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {['councilSmall', 'councilMedium', 'councilLarge'].map((key) => {
                  const plan = pricingPlans[key as keyof typeof pricingPlans];
                  const price =
                    plan.priceAnnual && billingCycle === "annual"
                      ? plan.priceAnnual
                      : plan.priceMonthly;

                  return (
                    <div
                      key={key}
                      className={`rounded-2xl border-2 bg-white/10 p-6 backdrop-blur-xl ${
                        plan.popular
                          ? "border-emerald-300 shadow-2xl"
                          : "border-white/20"
                      }`}
                    >
                      {plan.popular && (
                        <div className="mb-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-emerald-900">
                            <Zap className="h-3 w-3" />
                            Most popular
                          </span>
                        </div>
                      )}

                      <div>
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                        <p className="mt-2 text-sm text-blue-100">{plan.description}</p>
                      </div>

                      <div className="mt-6">
                        <span className="text-4xl font-extrabold tracking-tight text-white">
                          £{price}
                        </span>
                        <span className="ml-2 text-base text-blue-100">
                          /{billingCycle === "monthly" ? "month" : "year"}
                        </span>
                        {billingCycle === "annual" && plan.priceAnnual && (
                          <div className="mt-2 text-sm font-medium text-emerald-300">
                            Save £{plan.priceMonthly! * 12 - plan.priceAnnual} per year
                          </div>
                        )}
                      </div>

                      <a
                        href={plan.ctaHref}
                        className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                          plan.popular
                            ? "bg-emerald-400 text-emerald-900 shadow-lg hover:bg-emerald-300"
                            : "bg-white/20 text-white hover:bg-white/30"
                        }`}
                      >
                        {plan.cta}
                      </a>

                      <ul className="mt-6 space-y-2.5">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                            <span className="text-xs text-white">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-4 backdrop-blur">
                  <p className="text-sm font-semibold text-emerald-200">
                    💡 Important: Pricing is per publishing department
                  </p>
                  <p className="mt-2 text-xs text-emerald-100">
                    Each department that publishes notices (Planning, Traffic, Environmental Health) requires its own subscription. Departments that only receive notices (Licensing) get free portal access at no cost.
                  </p>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/5 p-4 text-center backdrop-blur">
                  <p className="text-sm text-blue-100">
                    Trusted by 40+ UK local authorities • 99.9% uptime SLA • FOI-ready exports
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="pb-16 md:pb-24">
        <div className={UI.container}>
          {/* Comparison Table Toggle */}
          <div className="text-center">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              {showComparison ? "Hide" : "View"} detailed comparison
              <ArrowRight className={`h-4 w-4 transition ${showComparison ? "rotate-90" : ""}`} />
            </button>
          </div>

          {/* Comparison Table */}
          {showComparison && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                        Features
                      </th>
                      <th className="px-3 py-4 text-center text-xs font-semibold text-slate-900">
                        Pay as you go
                      </th>
                      <th className="px-3 py-4 text-center text-xs font-semibold text-slate-900">
                        Professional
                      </th>
                      <th className="px-3 py-4 text-center text-xs font-semibold text-slate-900">
                        Business
                      </th>
                      <th className="px-3 py-4 text-center text-xs font-semibold text-slate-900">
                        Enterprise
                      </th>
                      <th className="px-3 py-4 text-center text-xs font-semibold text-blue-700 bg-blue-50">
                        Parish & Town
                      </th>
                      <th className="px-3 py-4 text-center text-xs font-semibold text-blue-700 bg-blue-50">
                        District
                      </th>
                      <th className="px-3 py-4 text-center text-xs font-semibold text-blue-700 bg-blue-50">
                        Unitary & County
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((category, catIndex) => (
                      <>
                        <tr key={`cat-${catIndex}`} className="border-b border-slate-200 bg-slate-50/50">
                          <td colSpan={8} className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {category.category}
                          </td>
                        </tr>
                        {category.features.map((feature, featIndex) => {
                          const renderCell = (value: any) => {
                            if (typeof value === "boolean") {
                              return value ? (
                                <Check className="inline h-4 w-4 text-blue-600" />
                              ) : (
                                <span className="text-slate-400">—</span>
                              );
                            }
                            return <span className="text-slate-700 text-xs">{value}</span>;
                          };

                          return (
                            <tr key={`feat-${catIndex}-${featIndex}`} className="border-b border-slate-100">
                              <td className="px-6 py-4 text-sm text-slate-700">{feature.name}</td>
                              <td className="px-3 py-4 text-center text-xs">{renderCell(feature.individual)}</td>
                              <td className="px-3 py-4 text-center text-xs">{renderCell(feature.professional)}</td>
                              <td className="px-3 py-4 text-center text-xs">{renderCell(feature.business)}</td>
                              <td className="px-3 py-4 text-center text-xs">{renderCell(feature.enterprise)}</td>
                              <td className="px-3 py-4 text-center text-xs bg-blue-50/50">{renderCell(feature.councilSmall)}</td>
                              <td className="px-3 py-4 text-center text-xs bg-blue-50/50">{renderCell(feature.councilMedium)}</td>
                              <td className="px-3 py-4 text-center text-xs bg-blue-50/50">{renderCell(feature.councilLarge)}</td>
                            </tr>
                          );
                        })}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24">
        <div className={UI.container}>
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-slate-900">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Is CivicNotices legally compliant?",
                  a: "Yes. While the government is modernising regulations, CivicNotices provides cryptographic proof, timestamping, and audit trails that meet and exceed current legal requirements for statutory notices.",
                },
                {
                  q: "How does pay-as-you-go work?",
                  a: "No subscription needed. Simply visit our platform, create your notice, and pay £49.99 per publication. You'll receive instant publication and a legal compliance certificate immediately.",
                },
                {
                  q: "Can I switch plans later?",
                  a: "Absolutely. Council and Enterprise customers can upgrade, downgrade, or pause their subscription at any time. No long-term contracts required.",
                },
                {
                  q: "What's included in the audit trail?",
                  a: "Every notice gets a cryptographic hash, timestamp, view analytics, comment tracking, and a downloadable PDF certificate. Perfect for FOI requests and legal proceedings.",
                },
                {
                  q: "Do you offer discounts for charities or small councils?",
                  a: "Yes! We offer special pricing for registered charities and parish councils. Contact our team for a custom quote.",
                },
                {
                  q: "How quickly are notices published?",
                  a: "Instantly. Unlike newspaper notices that take 5-10 working days, your notice goes live immediately and is searchable within seconds.",
                },
              ].map((faq, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-md"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                    className="flex w-full items-center justify-between p-6 text-left"
                  >
                    <span className="font-semibold text-slate-900">{faq.q}</span>
                    <HelpCircle
                      className={`h-5 w-5 text-slate-400 transition ${
                        activeFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {activeFaq === index && (
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
                      <p className="text-sm text-slate-700">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24">
        <div className={UI.container}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-center shadow-2xl md:p-16">
            <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                Ready to modernise your statutory notices?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100">
                Join 40+ UK councils already saving time and money with CivicNotices
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href="/publish"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50"
                >
                  Publish your first notice
                  <ArrowRight className="h-5 w-5" />
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  <Clock className="h-5 w-5" />
                  Request a demo
                </a>
              </div>
              <p className="mt-6 text-sm text-blue-200">
                No credit card required • Free trial available for councils
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12">
        <div className={`${UI.container} text-center`}>
          <div className="mb-6 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
            <a href="/about" className="hover:text-slate-900">
              About
            </a>
            <a href="/docs" className="hover:text-slate-900">
              Docs
            </a>
            <a href="/privacy" className="hover:text-slate-900">
              Privacy
            </a>
            <a href="/terms" className="hover:text-slate-900">
              Terms
            </a>
            <a href="/contact" className="hover:text-slate-900">
              Contact
            </a>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} CivicNotices. Modernising statutory notices for the digital age.
          </p>
        </div>
      </footer>
    </div>
  );
}
