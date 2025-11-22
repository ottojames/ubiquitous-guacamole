import { Link } from 'react-router-dom';
import {
  MapPin,
  Users,
  Briefcase,
  Building,
  BarChart3,
  ExternalLink,
  Mail
} from 'lucide-react';

interface DemoCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  persona: string;
  color: string;
}

function DemoCard({ title, description, icon, link, persona, color }: DemoCardProps) {
  return (
    <Link
      to={link}
      className={`group relative overflow-hidden rounded-xl bg-white p-8 shadow-lg transition-all hover:shadow-2xl hover:scale-105 border-2 border-transparent hover:border-${color}-500`}
    >
      {/* Icon */}
      <div className={`mb-6 inline-flex rounded-full bg-${color}-100 p-4 text-${color}-600`}>
        {icon}
      </div>

      {/* Title */}
      <h3 className="mb-3 text-2xl font-bold text-gray-900">{title}</h3>

      {/* Description */}
      <p className="mb-4 text-gray-600">{description}</p>

      {/* Persona */}
      <div className="mb-4 flex items-center text-sm text-gray-500">
        <Users className="mr-2 h-4 w-4" />
        <span>{persona}</span>
      </div>

      {/* CTA */}
      <div className="flex items-center font-semibold text-blue-600 group-hover:text-blue-700">
        <span>View Demo</span>
        <ExternalLink className="ml-2 h-4 w-4" />
      </div>
    </Link>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="text-center">
      {icon && <div className="mb-2 flex justify-center text-blue-600">{icon}</div>}
      <div className="mb-1 text-4xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-600">{label}</div>
    </div>
  );
}

export default function ShowcaseLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Civic Notices</h1>
              <p className="mt-1 text-sm text-gray-600">Live Demonstration System</p>
            </div>
            <Link
              to="/"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Exit Demo
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-16">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-5xl font-bold text-gray-900">
            Transforming Public Notices
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            Experience how councils, firms, and residents engage with statutory public notices
            in a modern, efficient, and transparent platform
          </p>
        </div>

        {/* 5-segment Demo Cards */}
        <div className="mb-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Segment 1: Resident Search */}
          <DemoCard
            title="Resident Search"
            description="Find notices near home, filter by type, and subscribe to weekly email alerts for your area"
            icon={<MapPin className="h-8 w-8" />}
            link="/notices?postcode=SW1A1AA"
            persona="Sarah Thompson, Westminster Resident"
            color="blue"
          />

          {/* Segment 2: Public Applicant */}
          <DemoCard
            title="Public Applicant"
            description="View notice details, submit representations, and track your submissions in real-time"
            icon={<Users className="h-8 w-8" />}
            link="/"
            persona="Michael Chen, Small Business Owner"
            color="green"
          />

          {/* Segment 3: Law Firm */}
          <DemoCard
            title="Legal Firm"
            description="Publish notices for clients, manage submissions, and track billing across all applications"
            icon={<Briefcase className="h-8 w-8" />}
            link="/f/wilson-partners"
            persona="James Wilson, Solicitor"
            color="purple"
          />

          {/* Segment 4: Council Officer */}
          <DemoCard
            title="Council Officer"
            description="Review submissions, manage representations, publish notices, and respond to applicants"
            icon={<Building className="h-8 w-8" />}
            link="/c/bristol-council/licensing"
            persona="Emma Martinez, Licensing Officer"
            color="orange"
          />

          {/* Segment 5: Council Manager */}
          <DemoCard
            title="Council Manager"
            description="Analytics dashboards, cost savings reports, compliance monitoring, and strategic insights"
            icon={<BarChart3 className="h-8 w-8" />}
            link="/c/westminster-city-of-council/licensing/analytics"
            persona="David Chen, Head of Regulatory Services"
            color="red"
          />
        </div>

        {/* Live Platform Statistics */}
        <div className="mb-16 overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h3 className="text-center text-2xl font-bold text-white">
              Live Platform Statistics
            </h3>
          </div>
          <div className="grid gap-8 p-8 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Active Councils"
              value="349"
              icon={<Building className="h-8 w-8" />}
            />
            <StatCard
              label="Published Notices"
              value="106"
              icon={<Mail className="h-8 w-8" />}
            />
            <StatCard
              label="Public Representations"
              value="80"
              icon={<Users className="h-8 w-8" />}
            />
            <StatCard
              label="Active Submissions"
              value="13"
              icon={<Briefcase className="h-8 w-8" />}
            />
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16 rounded-2xl bg-white p-8 shadow-lg">
          <h3 className="mb-6 text-center text-2xl font-bold text-gray-900">
            Platform Highlights
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-6">
              <h4 className="mb-2 font-semibold text-gray-900">Advanced Search</h4>
              <p className="text-sm text-gray-600">
                MapLibre GL clustering, radius filtering, 7 notice types, real-time geocoding
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6">
              <h4 className="mb-2 font-semibold text-gray-900">Multi-Tenant</h4>
              <p className="text-sm text-gray-600">
                355 departments across 349 councils, firm portals, role-based access control
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6">
              <h4 className="mb-2 font-semibold text-gray-900">Workflow Automation</h4>
              <p className="text-sm text-gray-600">
                Firm submissions, council reviews, change requests, automated approvals
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6">
              <h4 className="mb-2 font-semibold text-gray-900">Public Engagement</h4>
              <p className="text-sm text-gray-600">
                Representation submission, email alerts, consultation tracking, deadline management
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6">
              <h4 className="mb-2 font-semibold text-gray-900">50+ Notice Types</h4>
              <p className="text-sm text-gray-600">
                Licensing, Planning, Traffic Orders, GVOL, Gambling, Probate, Environmental
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6">
              <h4 className="mb-2 font-semibold text-gray-900">Analytics & Reporting</h4>
              <p className="text-sm text-gray-600">
                Real-time dashboards, cost savings, compliance metrics, departmental insights
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="rounded-lg bg-blue-600 p-8 text-center text-white">
          <h3 className="mb-2 text-2xl font-bold">Ready to Transform Your Notices?</h3>
          <p className="mb-6 text-blue-100">
            Join 349 councils already using the Public Notice Portal
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/contact"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              Get in Touch
            </Link>
            <Link
              to="/pricing"
              className="rounded-lg border-2 border-white px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
