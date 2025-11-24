import { Link } from 'react-router-dom';
import { Users, Briefcase, Shield, TrendingUp, FileText } from 'lucide-react';

interface SegmentCard {
  id: string;
  title: string;
  description: string;
  persona: string;
  icon: React.ReactNode;
  gradient: string;
}

const segments: SegmentCard[] = [
  {
    id: 'public',
    title: 'General Public Journey',
    description: 'Discover how residents find and engage with local notices in their community.',
    persona: 'Rachael, Local Resident',
    icon: <Users className="w-6 h-6" />,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'legal',
    title: 'Legal Firm Journey',
    description: 'See how solicitors publish notices efficiently with 82% cost savings.',
    persona: 'James Wilson, Solicitor',
    icon: <Briefcase className="w-6 h-6" />,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'officer',
    title: 'Council Officer Journey',
    description: 'Explore how licensing officers manage submissions and representations.',
    persona: 'Emma Martinez, Senior Licensing Officer',
    icon: <Shield className="w-6 h-6" />,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'manager',
    title: 'Council Manager Journey',
    description: 'Learn how senior management gains strategic oversight and demonstrates value.',
    persona: 'David Chen, Head of Regulatory Services',
    icon: <TrendingUp className="w-6 h-6" />,
    gradient: 'from-orange-500 to-red-500',
  },
];

export default function ShowcaseLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-white to-transparent opacity-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 tracking-tight mb-6">
              Civic Notices
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 mt-2">
                Platform Showcase
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Transforming how statutory public notices are published, discovered, and engaged with across the UK.
              Watch our journey through four distinct user experiences.
            </p>
          </div>
        </div>
      </div>

      {/* Segment Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {segments.map((segment, index) => (
            <Link
              key={segment.id}
              to={`/showcase/${segment.id}`}
              className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards',
                opacity: 0,
              }}
            >
              {/* Gradient Border Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${segment.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                   style={{ padding: '2px' }}>
                <div className="absolute inset-[2px] bg-white rounded-2xl" />
              </div>

              {/* Card Content */}
              <div className="relative p-8">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${segment.gradient} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {segment.icon}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-semibold text-slate-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 transition-all duration-300">
                  {segment.title}
                </h3>

                {/* Persona */}
                <p className="text-sm font-medium text-slate-500 mb-3">
                  {segment.persona}
                </p>

                {/* Description */}
                <p className="text-slate-600 leading-relaxed mb-6">
                  {segment.description}
                </p>

                {/* CTA */}
                <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                  Watch Demo
                  <svg
                    className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              {/* Hover Shine Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
            </Link>
          ))}
        </div>

        {/* Sample Notice CTA */}
        <div className="max-w-6xl mx-auto mt-12">
          <Link
            to="/sample-notice"
            className="group relative block bg-[#2d3748] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            <div className="relative px-8 py-6">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="flex-shrink-0 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-600/50 text-white">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-semibold text-white mb-1">
                      View Sample Notice
                    </h3>
                    <p className="text-slate-300 text-base">
                      See our structured template format for Sampleton Borough Council
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center px-6 py-3 rounded-xl text-white font-medium group-hover:bg-white/10 transition-all duration-200">
                    View Template
                    <svg
                      className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Keyframe Animation */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
