import { Router, Request, Response } from 'express';
import multer from 'multer';
import { getServiceSupabaseClient } from '../lib/supabase.js';
import { createHash } from 'node:crypto';
import slugify from 'slugify';

const router = Router();

// Configure multer for file uploads
const upload = (multer as any)({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file as per PRD
    files: 5 // Max 5 files as per PRD
  },
  fileFilter(req: any, file: any, cb: any) {
    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

/**
 * Upload attachments for a representation
 * POST /api/representation-uploads
 *
 * Body: multipart/form-data with:
 * - representationId: The representation ID
 * - files: Array of files to upload
 */
router.post('/', upload.array('files', 5), async (req: Request, res: Response) => {
  try {
    const { representationId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!representationId) {
      return res.status(400).json({ error: 'representationId is required' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const supabase = getServiceSupabaseClient();

    // Verify representation exists
    const { data: representation, error: repError } = await supabase
      .from('representations')
      .select('id, supporting_documents')
      .eq('id', representationId)
      .single();

    if (repError || !representation) {
      return res.status(404).json({ error: 'Representation not found' });
    }

    const uploadedFiles = [];
    const errors = [];

    // Upload each file to Supabase Storage
    for (const file of files) {
      try {
        // Generate unique filename
        const hash = createHash('sha256')
          .update(file.buffer)
          .digest('hex')
          .substring(0, 8);
        const safeName = slugify(file.originalname.replace(/\.[^.]+$/, ''), {
          lower: true,
          strict: true
        });
        const ext = file.originalname.split('.').pop();
        const fileName = `representations/${representationId}/${hash}-${safeName}.${ext}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('notices')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          errors.push({
            file: file.originalname,
            error: uploadError.message
          });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('notices')
          .getPublicUrl(fileName);

        uploadedFiles.push({
          name: file.originalname,
          url: publicUrl,
          size: file.size,
          mimeType: file.mimetype,
          uploadedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        errors.push({
          file: file.originalname,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(500).json({
        error: 'Failed to upload any files',
        details: errors
      });
    }

    // Update representation with new attachments
    const existingDocs = representation.supporting_documents || [];
    const updatedDocs = [...existingDocs, ...uploadedFiles];

    const { error: updateError } = await supabase
      .from('representations')
      .update({
        supporting_documents: updatedDocs,
        updated_at: new Date().toISOString()
      })
      .eq('id', representationId);

    if (updateError) {
      console.error('Error updating representation:', updateError);
      return res.status(500).json({
        error: 'Files uploaded but failed to update representation',
        uploadedFiles
      });
    }

    return res.status(200).json({
      success: true,
      uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`
    });

  } catch (error) {
    console.error('Error in representation upload:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get attachments for a representation
 * GET /api/representation-uploads/:representationId
 */
router.get('/:representationId', async (req: Request, res: Response) => {
  try {
    const { representationId } = req.params;

    const supabase = getServiceSupabaseClient();

    const { data: representation, error } = await supabase
      .from('representations')
      .select('id, supporting_documents')
      .eq('id', representationId)
      .single();

    if (error || !representation) {
      return res.status(404).json({ error: 'Representation not found' });
    }

    return res.json({
      representationId,
      attachments: representation.supporting_documents || []
    });

  } catch (error) {
    console.error('Error fetching attachments:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete an attachment from a representation
 * DELETE /api/representation-uploads/:representationId/:fileName
 */
router.delete('/:representationId/:fileName', async (req: Request, res: Response) => {
  try {
    const { representationId, fileName } = req.params;

    const supabase = getServiceSupabaseClient();

    // Get current representation
    const { data: representation, error: fetchError } = await supabase
      .from('representations')
      .select('id, supporting_documents')
      .eq('id', representationId)
      .single();

    if (fetchError || !representation) {
      return res.status(404).json({ error: 'Representation not found' });
    }

    // Remove file from list
    const updatedDocs = (representation.supporting_documents || [])
      .filter((doc: any) => doc.name !== fileName);

    // Update representation
    const { error: updateError } = await supabase
      .from('representations')
      .update({
        supporting_documents: updatedDocs,
        updated_at: new Date().toISOString()
      })
      .eq('id', representationId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update representation' });
    }

    // Try to delete from storage (best effort)
    const filePath = `representations/${representationId}/${fileName}`;
    await supabase.storage
      .from('notices')
      .remove([filePath]);

    return res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting attachment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;