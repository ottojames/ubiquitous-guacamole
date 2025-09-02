# Ubiquitous Guacamole

Development setup:

1. Copy `.env.example` to `.env` and provide your Supabase credentials:

   ```bash
   VITE_SUPABASE_URL=<your project url>
   VITE_SUPABASE_ANON_KEY=<public anon key>
   ```

2. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

Vite runs at http://localhost:5173.

## Address provider

Set `ADDRESS_PROVIDER` in `.env` to choose an address lookup service. The default `mock` provider returns static data and needs no API key.

## Council ingest

A helper script reads a Word document of councils and uploads the data to Supabase. Place your source file at `data/councils.docx` then run:

```bash
npm run ingest:councils
```

This will create `councils.json` and upsert rows into the `councils` table.

## OCR support

The server includes placeholder wiring for OCR/extraction using packages such as `mammoth`, `pdf-parse` and `tesseract.js`. PDF, Word and common image files can be processed with these tools.
