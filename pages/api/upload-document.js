/**
 * Universal Document Upload API for Jorge's Dashboard
 * Handles PDF, DOC, DOCX, JPG, PNG uploads
 * Supports: Supplier Vetting, Market Entry, Intelligence documents
 */

import formidable from 'formidable';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ensure upload directory exists
  const uploadDir = './public/uploads/jorge-documents';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    uploadDir: uploadDir,
    keepExtensions: true,
    maxFileSize: 25 * 1024 * 1024, // 25MB limit for PDFs
    filter: ({ name, originalFilename, mimetype }) => {
      // Allow PDF, DOC, DOCX, JPG, PNG
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
      ];
      return allowedTypes.includes(mimetype);
    }
  });

  try {
    const [fields, files] = await form.parse(req);

    if (!files.file || !files.file[0]) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = files.file[0];
    const field = fields.field[0];
    const entityId = fields.supplier_id?.[0] || fields.client_id?.[0] || 'temp';
    const stage = fields.stage?.[0] || '1';
    const consultationType = fields.consultation_type?.[0] || 'general';
    const documentType = fields.type?.[0] || 'document';

    // Create secure filename
    const timestamp = Date.now();
    const sanitizedField = field.replace(/[^a-zA-Z0-9_]/g, '_');
    const fileName = `jorge_${entityId}_${sanitizedField}_${timestamp}${path.extname(file.originalFilename)}`;
    const filePath = `/uploads/jorge-documents/${fileName}`;

    // Move file to final location
    fs.renameSync(file.filepath, `./public${filePath}`);

    // Store file reference in database
    try {
      const { data, error } = await supabase
        .from('jorge_documents')
        .insert({
          entity_id: entityId,
          document_type: field,
          file_path: filePath,
          original_name: file.originalFilename,
          file_size: file.size,
          mime_type: file.mimetype,
          stage: stage,
          consultation_type: consultationType,
          category: documentType,
          uploaded_by: 'jorge',
          uploaded_at: new Date().toISOString()
        });

      if (error && error.code !== '42P01') { // Ignore if table doesn't exist
        console.warn('Database insert failed (table may not exist):', error);
      }
    } catch (dbError) {
      console.warn('Database operation failed:', dbError);
      // Continue without database - file still uploaded
    }

    res.json({
      success: true,
      file_path: filePath,
      original_name: file.originalFilename,
      file_size: file.size,
      mime_type: file.mimetype,
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 25MB.'
      });
    }

    if (error.code === 'LIMIT_FILE_TYPE') {
      return res.status(400).json({
        error: 'Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files.'
      });
    }

    res.status(500).json({
      error: 'Upload failed',
      details: error.message
    });
  }
}