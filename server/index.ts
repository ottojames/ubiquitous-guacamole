import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import uploadRouter from './routes/upload'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

// API routes
app.use('/api/upload', uploadRouter)

// health
app.get('/healthz', (_req, res) => res.json({ ok: true }))

const PORT = Number(process.env.PORT || 5174)
app.listen(PORT, () => {
  console.log(`API listening on ${PORT}`)
})
