/** @vitest-environment node */
import request from 'supertest'
import { describe, it, expect, vi } from 'vitest'
import { app } from '../index'

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: async () => ({ data: {}, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/file' } }),
      }),
    },
  }),
}))

describe('upload api', () => {
  it('accepts a file upload', async () => {
    const res = await request(app)
      .post('/api/upload')
      .field('applicantEmail', 'test@example.com')
      .attach('file', Buffer.from('hello world'), 'test.txt')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})
