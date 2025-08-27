import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import exportService, { ExportOptions } from '../../services/export.service';
import fs from 'fs/promises';

const router = express.Router();

/**
 * POST /api/export
 * Create a new data export
 */
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const options: ExportOptions = {
      format: req.body.format || 'json',
      includePersonalNotes: req.body.includePersonalNotes !== false,
      includeCommunicationHistory: req.body.includeCommunicationHistory !== false,
      includePreferences: req.body.includePreferences !== false,
      dateRange: req.body.dateRange ? {
        from: new Date(req.body.dateRange.from),
        to: new Date(req.body.dateRange.to),
      } : undefined,
    };

    // Validate format
    const allowedFormats = ['json', 'csv', 'vcard', 'full'];
    if (!allowedFormats.includes(options.format)) {
      return res.status(400).json({
        error: 'Invalid format',
        message: `Format must be one of: ${allowedFormats.join(', ')}`,
      });
    }

    const result = await exportService.exportUserData(userId, options);
    
    return res.json({
      success: true,
      export: {
        fileName: result.fileName,
        fileSize: result.fileSize,
        contactCount: result.contactCount,
        listCount: result.listCount,
        format: result.format,
        exportedAt: result.exportedAt,
        downloadUrl: `/api/export/download/${result.fileName}`,
      },
      message: 'Export created successfully',
    });
  } catch (error) {
    console.error('Export creation failed:', error);
    return res.status(500).json({
      error: 'Export failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/export/download/:fileName
 * Download an export file
 */
router.get('/download/:fileName', authenticate, async (req: AuthRequest, res) => {
  try {
    const { fileName } = req.params;
    
    // Security: Ensure filename is safe
    if (!/^kinect-(export|contacts)-[\w-]+\.(json|csv|vcf|txt)$/.test(fileName)) {
      return res.status(400).json({
        error: 'Invalid filename',
        message: 'Filename format is not allowed',
      });
    }

    const fileInfo = await exportService.getExportFile(fileName);
    
    if (!fileInfo.exists) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested export file does not exist or has expired',
      });
    }

    // Set appropriate headers for download
    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Length', fileInfo.size);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Stream the file
    const fileContent = await fs.readFile(fileInfo.filePath);
    return res.send(fileContent);
  } catch (error) {
    console.error('Export download failed:', error);
    return res.status(500).json({
      error: 'Download failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/export/formats
 * Get available export formats and their descriptions
 */
router.get('/formats', authenticate, async (_req: AuthRequest, res) => {
  res.json({
    formats: [
      {
        key: 'json',
        name: 'JSON',
        description: 'Complete data export in JSON format - can be imported back into Kinect',
        fileExtension: '.json',
        mimeType: 'application/json',
        features: [
          'All contact data',
          'Contact lists',
          'Communication history',
          'User preferences',
          'Import back to Kinect',
        ],
      },
      {
        key: 'csv',
        name: 'CSV (Spreadsheet)',
        description: 'Contact data in CSV format - compatible with Excel and Google Sheets',
        fileExtension: '.csv',
        mimeType: 'text/csv',
        features: [
          'Contact information',
          'Phone numbers and emails',
          'Categories and notes',
          'Excel/Google Sheets compatible',
        ],
      },
      {
        key: 'vcard',
        name: 'vCard',
        description: 'Standard contact format - compatible with most address book apps',
        fileExtension: '.vcf',
        mimeType: 'text/vcard',
        features: [
          'Standard contact format',
          'iPhone/Android compatible',
          'Outlook/Gmail compatible',
          'Cross-platform support',
        ],
      },
      {
        key: 'full',
        name: 'Complete Archive',
        description: 'All formats bundled together with documentation',
        fileExtension: '.zip',
        mimeType: 'application/zip',
        features: [
          'JSON export',
          'CSV export',
          'vCard export',
          'README documentation',
          'Import instructions',
        ],
      },
    ],
    options: {
      includePersonalNotes: {
        name: 'Include Personal Notes',
        description: 'Include private notes and comments for each contact',
        default: true,
      },
      includeCommunicationHistory: {
        name: 'Include Communication History',
        description: 'Include log of when you last contacted each person',
        default: true,
      },
      includePreferences: {
        name: 'Include User Preferences',
        description: 'Include your notification settings and app preferences',
        default: true,
      },
    },
  });
});

/**
 * DELETE /api/export/cleanup
 * Clean up old export files
 */
router.delete('/cleanup', authenticate, async (req: AuthRequest, res) => {
  try {
    const maxAgeHours = parseInt(req.query.maxAge as string) || 24;
    const deletedCount = await exportService.cleanupOldExports(maxAgeHours);
    
    res.json({
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} old export files`,
    });
  } catch (error) {
    console.error('Export cleanup failed:', error);
    res.status(500).json({
      error: 'Cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/export/preview
 * Preview what would be exported without creating files
 */
router.post('/preview', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    
    // Get user's contacts and lists for preview
    const { Contact } = await import('../../models/Contact.model');
    const { ContactList } = await import('../../models/ContactList.model');
    const { User } = await import('../../models/User.model');
    
    const [user, contacts, lists] = await Promise.all([
      User.findById(userId),
      Contact.find({ userId }),
      ContactList.find({ userId }),
    ]);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Calculate export statistics
    const options: ExportOptions = {
      format: req.body.format || 'json',
      includePersonalNotes: req.body.includePersonalNotes !== false,
      includeCommunicationHistory: req.body.includeCommunicationHistory !== false,
      includePreferences: req.body.includePreferences !== false,
    };

    const contactsWithNotes = contacts.filter((c: any) => c.notes && c.notes.trim());
    const contactsWithHistory = contacts.filter((c: any) => c.communicationLog && c.communicationLog.length > 0);
    const listCounts = contacts.reduce((acc: any, contact: any) => {
      if (contact.listId) {
        const list = lists.find((l: any) => l._id?.toString() === contact.listId);
        const listName = list?.name || 'Unknown List';
        acc[listName] = (acc[listName] || 0) + 1;
      } else {
        acc['No List'] = (acc['No List'] || 0) + 1;
      }
      return acc;
    }, {});

    return res.json({
      preview: {
        totalContacts: contacts.length,
        totalLists: lists.length,
        contactsWithNotes: contactsWithNotes.length,
        contactsWithHistory: contactsWithHistory.length,
        listCounts,
        estimatedFileSize: estimateFileSize(contacts, lists, options),
        dataIncluded: {
          personalNotes: options.includePersonalNotes ? contactsWithNotes.length : 0,
          communicationHistory: options.includeCommunicationHistory ? contactsWithHistory.length : 0,
          userPreferences: options.includePreferences,
        },
        sampleContacts: contacts.slice(0, 3).map((contact: any) => ({
          name: contact.name,
          phoneCount: (contact.phones || []).length,
          emailCount: (contact.emails || []).length,
          hasNotes: !!(contact.notes && contact.notes.trim()),
          hasHistory: !!(contact.communicationLog && contact.communicationLog.length > 0),
          listName: (() => {
            if (contact.listId) {
              const list = lists.find((l: any) => l._id?.toString() === contact.listId);
              return list?.name || 'Unknown List';
            }
            return 'No List';
          })(),
        })),
      },
    });
  } catch (error) {
    console.error('Export preview failed:', error);
    return res.status(500).json({
      error: 'Preview failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Helper method to estimate file size
function estimateFileSize(contacts: any[], lists: any[], options: ExportOptions): string {
  // Rough estimation based on data size
  let size = 0;
  
  // Base contact data
  size += contacts.length * 200; // ~200 bytes per contact
  
  // Lists
  size += lists.length * 100; // ~100 bytes per list
  
  // Notes
  if (options.includePersonalNotes) {
    contacts.forEach(contact => {
      if (contact.notes) {
        size += contact.notes.length;
      }
    });
  }
  
  // Communication history
  if (options.includeCommunicationHistory) {
    contacts.forEach(contact => {
      if (contact.communicationLog) {
        size += contact.communicationLog.length * 50; // ~50 bytes per log entry
      }
    });
  }
  
  // Format overhead
  if (options.format === 'json') {
    size *= 1.5; // JSON formatting overhead
  } else if (options.format === 'full') {
    size *= 3; // Multiple formats
  }
  
  // Convert to readable format
  if (size < 1024) {
    return `${size} bytes`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
}

export default router;