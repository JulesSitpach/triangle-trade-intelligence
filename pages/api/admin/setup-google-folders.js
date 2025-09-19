/**
 * ADMIN API: Google Drive Folder Setup
 * POST /api/admin/setup-google-folders - Creates Triangle Intelligence folder structure
 * Organizes documents for all dashboard types and actions
 */

import googleDriveFolders from '../../../lib/services/google-drive-folders';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🗂️ Starting Google Drive folder structure setup...');

    // Check if Google Service Account is configured
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
      return res.status(500).json({
        error: 'Google Service Account not configured',
        message: 'Please add GOOGLE_SERVICE_ACCOUNT_KEY_FILE to environment variables',
        status: 'configuration_error'
      });
    }

    // Create the complete folder structure
    const folderStructure = await googleDriveFolders.setupMainFolderStructure();

    // TODO: Store folder mapping in database for future reference
    // This would typically save to a google_drive_folders table

    const response = {
      success: true,
      message: 'Google Drive folder structure created successfully',
      folder_structure: {
        main_folder_id: folderStructure.main_folder_id,
        departments_created: Object.keys(folderStructure.departments).length,
        total_subfolders: Object.values(folderStructure.departments).reduce((sum, dept) =>
          sum + Object.keys(dept.subfolders).length, 0
        ),
        departments: Object.keys(folderStructure.departments)
      },
      created_at: new Date().toISOString(),
      next_steps: [
        'Folder IDs should be stored in database for dashboard integration',
        'Update popup action handlers to use specific folder IDs',
        'Configure document templates for each dashboard type',
        'Set up automated document generation workflows'
      ]
    };

    console.log('✅ Google Drive setup completed successfully');
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Google Drive setup failed:', error);

    // Return helpful error information
    res.status(500).json({
      success: false,
      error: 'Failed to set up Google Drive folders',
      message: error.message,
      troubleshooting: {
        common_issues: [
          'Google Service Account key file not found or invalid',
          'Insufficient Google Drive API permissions',
          'Google Cloud Project not properly configured',
          'Drive API not enabled in Google Cloud Console'
        ],
        required_env_vars: [
          'GOOGLE_SERVICE_ACCOUNT_KEY_FILE - Path to service account JSON file'
        ]
      }
    });
  }
}