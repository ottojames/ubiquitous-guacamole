import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import uploadRouter from './routes/upload'
import addressRouter from './routes/address'

export const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api/upload', uploadRouter)
app.use('/api/address', addressRouter)

const PORT = Number(process.env.PORT || 5175)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`API listening on ${PORT}`))
}

export default app
