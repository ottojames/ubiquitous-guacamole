import { useState } from "react";
import { Check, ArrowRight, HelpCircle, Zap, Shield } from "lucide-react";
import * as UI from "@/styles/ui";
import SiteHeader from "@/components/SiteHeader";

const pricingPlans = {
  public: {
    name: "One-Off Publishing",
    description: "Publish a single notice without creating an account. Perfect for solicitors, businesses, and members of the public.",
    price: 50,
    features: [
      "No account or subscription required",
      "Instant publication & timestamped proof",
      "Full audit trail with cryptographic hash",
      "PDF certificate for legal compliance",
      "Public comments & engagement tracking",
      "Geospatial search & discovery",
      "Email support within 24 hours",
    ],
    cta: "Publish Now - £50",
    ctaHref: "/publish",
    popular: false,
  },
  firms: {
    name: "Professional Portal",
    description: "For law firms and professional practices managing multiple notices. Includes team collaboration, workflow management, and client billing tools.",
    priceMonthly: 49,
    pricePerNotice: 50,
    features: [
      "£49/month subscription + £50 per notice",
      "Unlimited team members",
      "Kanban workflow management",
      "Client matter tracking & billing integration",
      "Deadline reminders & calendar sync",
      "Custom notice templates",
      "Priority email support",
      "14-day free trial",
    ],
    cta: "Start Free Trial",
    ctaHref: "/sign-up?plan=firm",
    popular: true,
  },
  councils: {
    name: "Council Portal",
    description: "Free receiving portal for councils to view notices, manage representations, and track engagement in their jurisdiction.",
    priceMonthly: 0,
    pricePerNotice: 19.99,
    features: [
      "FREE receiving portal - no subscription fee",
      "£19.99 per notice when publishing",
      "View all notices in your jurisdiction",
      "Manage public representations & objections",
      "Department-level access controls",
      "Customisable notice templates",
      "IDOX export compatibility",
      "Dedicated council support",
    ],
    cta: "Get Free Portal Access",
    ctaHref: "/sign-up?plan=council",
    popular: false,
  },
};

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
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className={`${UI.pageWrap} min-h-screen`}>
      {/* Header sentinel for SiteHeader compact mode */}
      <div id="header-sentinel" className="h-2" aria-hidden="true" />
      <SiteHeader />

      {/* Resident escape hatch - subtle link for users just browsing notices */}
      <div className="relative z-10 py-3 text-center">
        <a
          href="/notices"
          className="inline-flex items-center gap-1.5 text-sm text-white/80 transition hover:text-white"
        >
          Just looking for notices? Search here
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden pb-12 pt-16 md:pb-16 md:pt-24">
        {/* Dark gradient overlay for text readability - stronger at bottom where gradient gets light */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/30" aria-hidden="true" />
        <div className="absolute -right-16 -top-16 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-300/10 blur-3xl" />

        <div className={`${UI.container} relative z-10`}>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] md:text-6xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.12)] md:text-xl">
              Three ways to publish: <strong className="text-white">£50/notice</strong> for one-off publishing,{" "}
              <strong className="text-white">£49/month</strong> for professional firms, or{" "}
              <strong className="text-white">free portal</strong> for councils.
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
      <section className="py-20 md:py-28">
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
                From £50 per notice. Councils £19.99. • Instant publication • Full audit trail
              </h3>
              <p className="text-slate-700">
                Digital-first, compliant with upcoming regulations, and built for the modern public sector
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className={UI.container}>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Choose your plan
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Whether you're publishing once or managing hundreds of notices
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {/* Public Card */}
            <div className={`${UI.card} relative flex flex-col p-8`}>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">{pricingPlans.public.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{pricingPlans.public.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">£{pricingPlans.public.price}</span>
                <span className="ml-2 text-slate-600">/notice</span>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {pricingPlans.public.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                    <Check className="h-5 w-5 flex-shrink-0 text-blue-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={pricingPlans.public.ctaHref}
                className={`${UI.btnPrimary} w-full justify-center`}
              >
                {pricingPlans.public.cta}
              </a>
            </div>

            {/* Firms Card - Highlighted */}
            <div className={`${UI.card} relative flex flex-col p-8 ring-2 ring-blue-600 shadow-xl`}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold text-white">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">{pricingPlans.firms.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{pricingPlans.firms.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">£{pricingPlans.firms.priceMonthly}</span>
                <span className="ml-2 text-slate-600">/month</span>
                <div className="mt-1 text-sm text-slate-500">+ £{pricingPlans.firms.pricePerNotice} per notice</div>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {pricingPlans.firms.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                    <Check className="h-5 w-5 flex-shrink-0 text-blue-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={pricingPlans.firms.ctaHref}
                className={`${UI.btnPrimary} w-full justify-center`}
              >
                {pricingPlans.firms.cta}
              </a>
            </div>

            {/* Councils Card */}
            <div className={`${UI.card} relative flex flex-col p-8 ring-2 ring-emerald-500`}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-emerald-600 px-4 py-1 text-sm font-semibold text-white">
                  £0 Portal Access
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">{pricingPlans.councils.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{pricingPlans.councils.description}</p>
              </div>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 mb-2">
                  <span className="text-4xl font-extrabold text-emerald-600">FREE</span>
                  <span className="text-slate-700 font-medium">portal access</span>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  Only pay <strong className="text-slate-900">£{pricingPlans.councils.pricePerNotice}</strong> when <em className="font-medium text-emerald-700">you</em> publish a notice
                </div>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {pricingPlans.councils.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                    <Check className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={pricingPlans.councils.ctaHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-white px-6 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-50 w-full"
              >
                {pricingPlans.councils.cta}
              </a>
            </div>
          </div>
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
                {
                  q: "Why do councils get a discount?",
                  a: "Councils process thousands of notices each year and provide a vital public service. Our discounted £19.99 rate recognises their volume and helps redirect taxpayer money from expensive newspaper advertising to modern digital infrastructure.",
                },
                {
                  q: "What's included in the £49/month subscription?",
                  a: "The Professional Portal subscription includes unlimited team members, Kanban workflow management for tracking notice stages, client matter tracking with billing integration, deadline reminders with calendar sync, custom notice templates, and priority email support. Notices are charged separately at £50 each.",
                },
                {
                  q: "Can I publish without a subscription?",
                  a: "Absolutely! Our One-Off Publishing option lets anyone publish a notice for £50 with no account or subscription required. You get instant publication, full audit trail, and a PDF certificate. The subscription is only needed if you want team collaboration, workflow management, and other professional features.",
                },
                {
                  q: "What's in the free council portal?",
                  a: "The Council Portal gives local authorities free access to view all notices published in their jurisdiction, manage public representations and objections, and track community engagement. Councils can also set up department-level access controls, create customised notice templates, and export data in IDOX-compatible format. The portal is completely free — councils only pay £19.99 per notice when they choose to publish their own notices.",
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
                Publish legally compliant notices in seconds — no newspapers, no waiting
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
                <a
                  href="/publish"
                  className={`${UI.btnPrimaryInverse} gap-2 px-8 py-4`}
                >
                  Publish a Notice - £50
                  <ArrowRight className="h-5 w-5" />
                </a>
                <a
                  href="/sign-up?plan=firm"
                  className={`${UI.btnSecondaryInverse} gap-2 px-8 py-4`}
                >
                  Register as a Firm
                </a>
                <a
                  href="/sign-up?plan=council"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-400/50 bg-emerald-500/20 px-8 py-4 font-semibold text-white backdrop-blur transition-all duration-200 hover:bg-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 focus:ring-offset-blue-600"
                >
                  Get Free Portal Access
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
