import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CivicNotices API',
      version: '1.0.0',
      description: 'RESTful API for managing public notices, representations, and workflow management for UK licensing applications.',
      contact: {
        name: 'CivicNotices Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:5174',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from Supabase authentication'
        }
      },
      schemas: {
        Notice: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            notice_type: {
              type: 'string',
              enum: ['premises', 'variation', 'review', 'gvol', 'tro', 'planning', 'gambling', 'probate', 'other']
            },
            title: { type: 'string' },
            content: { type: 'string' },
            applicant_name: { type: 'string' },
            premises_address: { type: 'string' },
            council_id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['draft', 'pending', 'published', 'expired', 'rejected'] },
            created_at: { type: 'string', format: 'date-time' },
            consultation_end_date: { type: 'string', format: 'date-time' }
          }
        },
        Representation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            notice_id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['objection', 'support', 'comment'] },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            address: { type: 'string' },
            text: { type: 'string' },
            is_read: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        ComplianceResult: {
          type: 'object',
          properties: {
            compliant: { type: 'boolean' },
            issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  severity: { type: 'string', enum: ['error', 'warning', 'info'] },
                  message: { type: 'string' },
                  suggestion: { type: 'string' }
                }
              }
            },
            score: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        DraftResult: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            draftText: { type: 'string' },
            noticeType: { type: 'string' },
            generatedAt: { type: 'string', format: 'date-time' },
            suggestions: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        AnalysisResult: {
          type: 'object',
          properties: {
            stance: { type: 'string', enum: ['support', 'objection', 'comment'] },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            themes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  confidence: { type: 'number' }
                }
              }
            },
            licensingObjectives: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  objective: { type: 'string' },
                  relevantText: { type: 'string' }
                }
              }
            },
            summary: { type: 'string' },
            wordCount: { type: 'integer' },
            sentenceCount: { type: 'integer' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    tags: [
      { name: 'Notices', description: 'Public notice management' },
      { name: 'Representations', description: 'Public comments and objections' },
      { name: 'Workflow', description: 'Notice workflow management' },
      { name: 'Drafts', description: 'Draft notice management' },
      { name: 'Certificates', description: 'Publication certificates' },
      { name: 'AI', description: 'AI-powered compliance, drafting, and analysis' },
      { name: 'Firm', description: 'Law firm management' },
      { name: 'Council', description: 'Council portal endpoints' },
      { name: 'Upload', description: 'File upload and OCR' },
      { name: 'Address', description: 'UK address lookup' },
      { name: 'Payments', description: 'Stripe payment processing' },
      { name: 'Health', description: 'API health checks' }
    ]
  },
  apis: ['./server/routes/*.ts', './server/routes/**/*.ts']
};

const swaggerSpec = swaggerJsdoc(options);

// Manual path definitions for endpoints without JSDoc annotations
const manualPaths = {
  '/api/health': {
    get: {
      tags: ['Health'],
      summary: 'Health check',
      description: 'Check if the API server is running',
      responses: {
        '200': {
          description: 'Server is healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ok: { type: 'boolean', example: true }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/notices/search': {
    get: {
      tags: ['Notices'],
      summary: 'Search notices',
      description: 'Search and filter public notices with optional geospatial queries',
      parameters: [
        { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search query' },
        { name: 'type', in: 'query', schema: { type: 'string', enum: ['premises', 'variation', 'review', 'gvol', 'tro', 'planning', 'gambling', 'probate', 'other'] }, description: 'Notice type' },
        { name: 'council_id', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filter by council' },
        { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Notice status' },
        { name: 'lat', in: 'query', schema: { type: 'number' }, description: 'Latitude for geospatial search' },
        { name: 'lng', in: 'query', schema: { type: 'number' }, description: 'Longitude for geospatial search' },
        { name: 'radius', in: 'query', schema: { type: 'number' }, description: 'Radius in km for geospatial search' },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Items per page' }
      ],
      responses: {
        '200': {
          description: 'Search results',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notices: { type: 'array', items: { $ref: '#/components/schemas/Notice' } },
                  pagination: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      page: { type: 'integer' },
                      limit: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/notices/{id}': {
    get: {
      tags: ['Notices'],
      summary: 'Get notice by ID',
      description: 'Get detailed information about a specific notice',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Notice ID' }
      ],
      responses: {
        '200': {
          description: 'Notice details',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Notice' }
            }
          }
        },
        '404': {
          description: 'Notice not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/notices/submit': {
    post: {
      tags: ['Notices'],
      summary: 'Submit notice',
      description: 'Submit a notice for publication (pay-per-notice)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['notice_type', 'applicant_name', 'premises_address', 'content', 'council_id'],
              properties: {
                notice_type: { type: 'string', enum: ['premises', 'variation', 'review', 'gvol', 'tro', 'planning', 'gambling', 'probate', 'other'] },
                applicant_name: { type: 'string' },
                premises_address: { type: 'string' },
                content: { type: 'string' },
                council_id: { type: 'string', format: 'uuid' },
                payment_intent_id: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Notice submitted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ok: { type: 'boolean' },
                  notice: { $ref: '#/components/schemas/Notice' },
                  certificate_number: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/notices/{noticeId}/representations': {
    get: {
      tags: ['Representations'],
      summary: 'List representations',
      description: 'Get all representations for a specific notice',
      parameters: [
        { name: 'noticeId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Notice ID' }
      ],
      responses: {
        '200': {
          description: 'List of representations',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  representations: { type: 'array', items: { $ref: '#/components/schemas/Representation' } }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Representations'],
      summary: 'Submit representation',
      description: 'Submit a public representation (objection, support, or comment) on a notice',
      parameters: [
        { name: 'noticeId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Notice ID' }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'name', 'email', 'text'],
              properties: {
                type: { type: 'string', enum: ['objection', 'support', 'comment'] },
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                address: { type: 'string' },
                text: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Representation submitted',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ok: { type: 'boolean' },
                  representation: { $ref: '#/components/schemas/Representation' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/compliance/check': {
    post: {
      tags: ['AI'],
      summary: 'Check notice compliance',
      description: 'AI-powered compliance checking for notice content',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['noticeType', 'content'],
              properties: {
                noticeType: { type: 'string', enum: ['premises', 'variation', 'review', 'gvol', 'tro', 'planning', 'gambling', 'probate', 'other'] },
                content: { type: 'string' },
                applicantName: { type: 'string' },
                premisesAddress: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Compliance check result',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ComplianceResult' }
            }
          }
        }
      }
    }
  },
  '/api/drafting/generate': {
    post: {
      tags: ['AI'],
      summary: 'Generate notice draft',
      description: 'AI-powered notice text generation from template data',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['noticeType', 'applicantName', 'premisesAddress'],
              properties: {
                noticeType: { type: 'string', enum: ['premises', 'variation', 'review', 'gvol', 'tro', 'planning', 'gambling', 'probate', 'other'] },
                applicantName: { type: 'string' },
                premisesAddress: { type: 'string' },
                additionalDetails: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Generated draft',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DraftResult' }
            }
          }
        }
      }
    }
  },
  '/api/representation-analysis/analyze': {
    post: {
      tags: ['AI'],
      summary: 'Analyze representation',
      description: 'AI-powered analysis of representation text to identify stance, themes, and licensing objectives',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['text'],
              properties: {
                text: { type: 'string', description: 'Representation text to analyze' },
                stance: { type: 'string', enum: ['support', 'objection', 'comment'], description: 'Known stance (optional)' },
                representationId: { type: 'string', description: 'Optional representation ID' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Analysis result',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AnalysisResult' }
            }
          }
        }
      }
    }
  },
  '/api/representation-analysis/analyze-multiple': {
    post: {
      tags: ['AI'],
      summary: 'Batch analyze representations',
      description: 'Analyze multiple representations with aggregate statistics',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['representations'],
              properties: {
                representations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['id', 'text'],
                    properties: {
                      id: { type: 'string' },
                      text: { type: 'string' },
                      type: { type: 'string', enum: ['support', 'objection', 'comment'] }
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Batch analysis results',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  analyses: { type: 'array', items: { $ref: '#/components/schemas/AnalysisResult' } },
                  aggregate: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      supportCount: { type: 'integer' },
                      objectionCount: { type: 'integer' },
                      commentCount: { type: 'integer' },
                      topThemes: { type: 'array', items: { type: 'object' } },
                      objectivesCited: { type: 'array', items: { type: 'object' } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/upload': {
    post: {
      tags: ['Upload'],
      summary: 'Upload file',
      description: 'Upload a document with optional OCR processing',
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: { type: 'string', format: 'binary' },
                ocr: { type: 'boolean', description: 'Enable OCR processing' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Upload successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ok: { type: 'boolean' },
                  url: { type: 'string' },
                  extractedText: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/addresses': {
    get: {
      tags: ['Address'],
      summary: 'Search addresses',
      description: 'Search for UK addresses by postcode or query',
      parameters: [
        { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search query (postcode or partial address)' }
      ],
      responses: {
        '200': {
          description: 'Address search results',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  addresses: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        line1: { type: 'string' },
                        line2: { type: 'string' },
                        city: { type: 'string' },
                        postcode: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/councils': {
    get: {
      tags: ['Council'],
      summary: 'List councils',
      description: 'Get all UK councils',
      responses: {
        '200': {
          description: 'List of councils',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  councils: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        slug: { type: 'string' },
                        region: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/stats': {
    get: {
      tags: ['Health'],
      summary: 'Platform statistics',
      description: 'Get public platform statistics',
      responses: {
        '200': {
          description: 'Platform statistics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  totalNotices: { type: 'integer' },
                  totalCouncils: { type: 'integer' },
                  noticesThisMonth: { type: 'integer' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/stripe/create-checkout-session': {
    post: {
      tags: ['Payments'],
      summary: 'Create checkout session',
      description: 'Create a Stripe checkout session for notice payment',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['noticeId'],
              properties: {
                noticeId: { type: 'string', format: 'uuid' },
                returnUrl: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Checkout session created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string' },
                  url: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }
};

// Merge manual paths with swagger-jsdoc generated spec
(swaggerSpec as any).paths = { ...(swaggerSpec as any).paths, ...manualPaths };

export function setupSwagger(app: Express): void {
  // Serve the raw OpenAPI spec as JSON (must be before swagger-ui middleware)
  app.get('/api/openapi.json', (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CivicNotices API Documentation'
  }));
}

export { swaggerSpec };
