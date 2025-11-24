import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Briefcase, Shield, TrendingUp, FileText } from 'lucide-react';

interface SegmentInfo {
  id: string;
  title: string;
  description: string;
  persona: string;
  duration: string;
  icon: React.ReactNode;
  gradient: string;
  videoPath?: string;
  youtubeId?: string;
}

const segmentData: Record<string, SegmentInfo> = {
  public: {
    id: 'public',
    title: 'General Public Journey',
    description: 'In this demonstration, I\'ll walk you through how a local resident discovers a new premises license application in their area and submits a representation. You\'ll see how Civic Notices makes it simple for residents to find relevant notices and have their voice heard in the consultation process.',
    persona: 'Local Resident Perspective',
    duration: '~2 minutes',
    icon: <Users className="w-6 h-6" />,
    gradient: 'from-blue-500 to-cyan-500',
    youtubeId: 'oRUbdWePvZw',
  },
  legal: {
    id: 'legal',
    title: 'Legal Firm Journey',
    description: 'This walkthrough demonstrates how solicitors use Civic Notices to publish statutory notices on behalf of their clients. I\'ll show you the streamlined submission process, automated validation, and how the platform delivers 82% cost savings compared to traditional newspaper publication.',
    persona: 'Solicitor Perspective',
    duration: '~1 minute',
    icon: <Briefcase className="w-6 h-6" />,
    gradient: 'from-purple-500 to-pink-500',
    youtubeId: 'Qp8RbhxTPUw',
  },
  officer: {
    id: 'officer',
    title: 'Council Officer Journey',
    description: 'In this demonstration, I\'ll show you how licensing officers manage incoming applications, review representations from residents, and collaborate with their team. You\'ll see how Civic Notices streamlines the entire consultation workflow and maintains a complete audit trail.',
    persona: 'Licensing Officer Perspective',
    duration: '~2 minutes',
    icon: <Shield className="w-6 h-6" />,
    gradient: 'from-emerald-500 to-teal-500',
    youtubeId: 'wn5wAwa2kvs',
  },
  manager: {
    id: 'manager',
    title: 'Council Manager Journey',
    description: 'This walkthrough demonstrates the strategic management view of Civic Notices. I\'ll show you how senior officers gain real-time insights into departmental performance, track statutory compliance, and demonstrate value for money to elected members and oversight bodies.',
    persona: 'Senior Management Perspective',
    duration: '~2 minutes',
    icon: <TrendingUp className="w-6 h-6" />,
    gradient: 'from-orange-500 to-red-500',
    youtubeId: 'AhOjCpTQTtQ',
  },
};

export default function ShowcaseSegment() {
  const { segmentId } = useParams<{ segmentId: string }>();
  const segment = segmentId ? segmentData[segmentId] : null;

  if (!segment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Segment Not Found</h1>
          <Link
            to="/showcase"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Showcase
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/showcase"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="font-medium">Back to Showcase</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Segment Header */}
        <div className="mb-8 text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${segment.gradient} text-white mb-4`}>
            {segment.icon}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3">
            {segment.title}
          </h1>
          <p className="text-lg text-slate-600 mb-2">{segment.persona}</p>
          <p className="text-sm text-slate-500">{segment.duration}</p>
        </div>

        {/* Other Segments */}
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Explore Other Journeys</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.values(segmentData)
              .filter(s => s.id !== segment.id)
              .map(s => (
                <Link
                  key={s.id}
                  to={`/showcase/${s.id}`}
                  className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r ${s.gradient} text-white mb-3 group-hover:scale-110 transition-transform duration-200`}>
                    {s.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-sm text-slate-500">{s.persona}</p>
                </Link>
              ))}
          </div>
        </div>

        {/* Video Container */}
        <div className="mb-8">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-slate-900">
            {segment.youtubeId ? (
              <iframe
                className="w-full aspect-video"
                src={`https://www.youtube.com/embed/${segment.youtubeId}`}
                title={segment.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : segment.videoPath ? (
              <video
                controls
                className="w-full aspect-video"
                poster="/civic-notices-logo.png"
              >
                <source src={segment.videoPath} type="video/quicktime" />
                <source src={segment.videoPath.replace('.mov', '.mp4')} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full aspect-video flex items-center justify-center bg-slate-800">
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r ${segment.gradient} text-white mb-4`}>
                    {segment.icon}
                  </div>
                  <p className="text-slate-400 text-lg">Video coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description Card */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">About This Journey</h2>
          <p className="text-slate-600 leading-relaxed text-lg">
            {segment.description}
          </p>
        </div>

        {/* Sample Notice CTA */}
        <div className="mt-8">
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
    </div>
  );
}
