import { useEffect, useRef, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { Link } from 'react-router-dom';

export default function ApiDocs() {
  const [activeTab, setActiveTab] = useState<'swagger' | 'quickstart' | 'examples'>('swagger');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/" className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">API Documentation</h1>
              <p className="text-gray-600 mt-1">RESTful API for the Public Notice Portal</p>
            </div>
            <div className="flex gap-3">
              <a
                href="https://github.com/publicnoticeportal/api-docs"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
              <button
                onClick={() => window.open('/openapi.json', '_blank')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download OpenAPI Spec
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('swagger')}
              className={`py-4 border-b-2 font-semibold transition-colors ${
                activeTab === 'swagger'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              API Reference
            </button>
            <button
              onClick={() => setActiveTab('quickstart')}
              className={`py-4 border-b-2 font-semibold transition-colors ${
                activeTab === 'quickstart'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Quick Start
            </button>
            <button
              onClick={() => setActiveTab('examples')}
              className={`py-4 border-b-2 font-semibold transition-colors ${
                activeTab === 'examples'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Code Examples
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'swagger' && (
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <SwaggerUI url="/openapi.json" />
          </div>
        )}

        {activeTab === 'quickstart' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Start Guide</h2>

              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Authentication</h3>
                <p className="text-gray-700 mb-4">
                  Most endpoints require authentication using a Supabase JWT token. Include the token in the Authorization header:
                </p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto">
                  <code>Authorization: Bearer YOUR_JWT_TOKEN</code>
                </pre>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Base URL</h3>
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-xl mb-4">
                  <p className="font-mono text-sm text-gray-900">
                    <strong>Development:</strong> http://localhost:5174/api
                  </p>
                  <p className="font-mono text-sm text-gray-900 mt-2">
                    <strong>Production:</strong> https://api.publicnoticeportal.uk
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Common Use Cases</h3>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-2">1. Search for notices near a postcode</h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
                      <code>{`GET /api/notices/search?postcode=W1D+4HT&radius_km=5

Response:
{
  "items": [
    {
      "id": "uuid",
      "noticeType": "licensing-premises-new",
      "premisesName": "The Groucho Club",
      "premisesAddress": "45 Dean Street, London",
      "latitude": 51.5135,
      "longitude": -0.1321
    }
  ],
  "postcode": "W1D 4HT",
  "radiusKm": 5
}`}</code>
                    </pre>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-2">2. Submit a representation (no auth required)</h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
                      <code>{`POST /api/representations
Content-Type: application/json

{
  "noticeId": "notice-uuid",
  "submitterName": "John Smith",
  "submitterEmail": "john@example.com",
  "type": "objection",
  "content": "I object to this application because..."
}

Response:
{
  "success": true,
  "representation": { ... },
  "message": "Your representation has been submitted successfully"
}`}</code>
                    </pre>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-2">3. Get notice details</h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
                      <code>{`GET /api/notices/{noticeId}

Response:
{
  "id": "uuid",
  "noticeType": "licensing-premises-new",
  "premisesName": "The Groucho Club",
  "applicantName": "Groucho Club Ltd",
  "description": "Full notice text...",
  "councils": {
    "name": "Westminster City Council",
    "contact_details": { ... }
  }
}`}</code>
                    </pre>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Rate Limits</h3>
                <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded-xl">
                  <p className="text-gray-900">
                    <strong>Public endpoints:</strong> 100 requests per minute per IP
                  </p>
                  <p className="text-gray-900 mt-2">
                    <strong>Authenticated endpoints:</strong> 1000 requests per minute per user
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Error Handling</h3>
                <p className="text-gray-700 mb-4">All errors follow a consistent format:</p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto">
                  <code>{`{
  "error": "Descriptive error message"
}`}</code>
                </pre>
                <p className="text-gray-700 mt-4">Common status codes:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li><strong>400:</strong> Bad Request - Invalid parameters</li>
                  <li><strong>401:</strong> Unauthorized - Missing or invalid authentication</li>
                  <li><strong>403:</strong> Forbidden - Insufficient permissions</li>
                  <li><strong>404:</strong> Not Found - Resource doesn't exist</li>
                  <li><strong>500:</strong> Internal Server Error - Server-side issue</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Code Examples</h2>

              <div className="space-y-8">
                {/* JavaScript/TypeScript */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-sm font-bold">JS</div>
                    JavaScript / TypeScript
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Search for notices with Fetch API</h4>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
                        <code>{`// Search for notices near a location
const searchNotices = async (postcode: string, radiusKm: number = 5) => {
  const params = new URLSearchParams({
    postcode,
    radius_km: radiusKm.toString(),
    status: 'published',
    limit: '50'
  });

  const response = await fetch(\`/api/notices/search?\${params}\`);

  if (!response.ok) {
    throw new Error('Search failed');
  }

  const data = await response.json();
  return data.items;
};

// Usage
const notices = await searchNotices('W1D 4HT', 5);
console.log(\`Found \${notices.length} notices\`);`}</code>
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Submit a representation</h4>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
                        <code>{`const submitRepresentation = async (noticeId: string, data: {
  name: string;
  email: string;
  type: 'support' | 'objection' | 'comment';
  content: string;
}) => {
  const response = await fetch('/api/representations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      noticeId,
      submitterName: data.name,
      submitterEmail: data.email,
      type: data.type,
      content: data.content,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
};

// Usage
const result = await submitRepresentation('notice-123', {
  name: 'Jane Doe',
  email: 'jane@example.com',
  type: 'objection',
  content: 'I object because...'
});
console.log(result.message);`}</code>
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Authenticated request with Supabase</h4>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
                        <code>{`import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const createDraft = async (postcode: string) => {
  // Get current session token
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/notices/draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${session.access_token}\`
    },
    body: JSON.stringify({ postcode })
  });

  return await response.json();
};`}</code>
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Python */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold text-white">Py</div>
                    Python
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Search and filter notices</h4>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
                        <code>{`import requests

def search_notices(postcode: str, radius_km: int = 5, council_id: str = None):
    """Search for public notices near a postcode."""
    params = {
        'postcode': postcode,
        'radius_km': radius_km,
        'status': 'published'
    }

    if council_id:
        params['councilId'] = council_id

    response = requests.get(
        'http://localhost:5174/api/notices/search',
        params=params
    )

    response.raise_for_status()
    data = response.json()

    return data['items']

# Usage
notices = search_notices('SW1A 1AA', radius_km=10)
print(f"Found {len(notices)} notices")

for notice in notices:
    print(f"- {notice['premisesName']}: {notice['noticeType']}")`}</code>
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Submit representation with error handling</h4>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
                        <code>{`import requests
from typing import Literal

def submit_representation(
    notice_id: str,
    name: str,
    email: str,
    rep_type: Literal['support', 'objection', 'comment'],
    content: str
):
    """Submit a public representation on a notice."""
    payload = {
        'noticeId': notice_id,
        'submitterName': name,
        'submitterEmail': email,
        'type': rep_type,
        'content': content
    }

    try:
        response = requests.post(
            'http://localhost:5174/api/representations',
            json=payload
        )
        response.raise_for_status()

        result = response.json()
        print(f"Success: {result['message']}")
        return result['representation']

    except requests.exceptions.HTTPError as e:
        error_msg = e.response.json().get('error', 'Unknown error')
        print(f"Error: {error_msg}")
        raise

# Usage
submit_representation(
    notice_id='abc-123',
    name='John Smith',
    email='john@example.com',
    rep_type='objection',
    content='I object to this application...'
)`}</code>
                      </pre>
                    </div>
                  </div>
                </div>

                {/* cURL */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">$</div>
                    cURL
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Search notices</h4>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
                        <code>{`curl "http://localhost:5174/api/notices/search?postcode=W1D%204HT&radius_km=5&status=published"`}</code>
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Get notice details</h4>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
                        <code>{`curl "http://localhost:5174/api/notices/{notice-id}"`}</code>
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Submit representation</h4>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
                        <code>{`curl -X POST "http://localhost:5174/api/representations" \\
  -H "Content-Type: application/json" \\
  -d '{
    "noticeId": "notice-uuid",
    "submitterName": "Jane Doe",
    "submitterEmail": "jane@example.com",
    "type": "objection",
    "content": "I object because..."
  }'`}</code>
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Authenticated request</h4>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
                        <code>{`curl -X POST "http://localhost:5174/api/notices/draft" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "postcode": "W1D 4HT",
    "councilId": "council-uuid"
  }'`}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SDK Notice */}
            <div className="bg-blue-50 border-l-4 border-blue-600 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Official SDKs Coming Soon</h3>
              <p className="text-gray-700">
                We're working on official client libraries for popular programming languages.
                For now, you can use these examples as a starting point or generate your own client
                using the OpenAPI specification.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
