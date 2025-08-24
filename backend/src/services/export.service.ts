import fs from 'fs/promises';
import path from 'path';
import { Contact } from '../models/Contact.model';
import { ContactList } from '../models/ContactList.model';
import { User } from '../models/User.model';
import selfHostedConfig from '../config/selfhosted.config';

export interface ExportOptions {
  format: 'json' | 'csv' | 'vcard' | 'full';
  includePersonalNotes?: boolean;
  includeCommunicationHistory?: boolean;
  includePreferences?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface ExportResult {
  success: boolean;
  filePath: string;
  fileName: string;
  fileSize: number;
  contactCount: number;
  listCount: number;
  format: string;
  exportedAt: Date;
}

/**
 * Export service for data portability in self-hosted Kinect
 * Enables users to export their data in standard formats
 */
export class ExportService {
  private exportDir: string;

  constructor() {
    this.exportDir = selfHostedConfig.importExport.exportPath;
    this.ensureExportDirectory();
  }

  private async ensureExportDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.exportDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create export directory:', error);
    }
  }

  /**
   * Export user data in specified format
   */
  public async exportUserData(
    userId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const contacts = await Contact.find({ userId });
    const lists = await ContactList.find({ userId });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let fileName: string;
    let filePath: string;
    let fileSize: number;

    switch (options.format) {
      case 'json':
        ({ fileName, filePath, fileSize } = await this.exportAsJSON(
          user, contacts, lists, options, timestamp
        ));
        break;
      
      case 'csv':
        ({ fileName, filePath, fileSize } = await this.exportAsCSV(
          contacts, options, timestamp
        ));
        break;
      
      case 'vcard':
        ({ fileName, filePath, fileSize } = await this.exportAsVCard(
          contacts, options, timestamp
        ));
        break;
      
      case 'full':
        ({ fileName, filePath, fileSize } = await this.exportFull(
          user, contacts, lists, options, timestamp
        ));
        break;
      
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    return {
      success: true,
      filePath,
      fileName,
      fileSize,
      contactCount: contacts.length,
      listCount: lists.length,
      format: options.format,
      exportedAt: new Date(),
    };
  }

  /**
   * Export as JSON format
   */
  private async exportAsJSON(
    user: any,
    contacts: any[],
    lists: any[],
    options: ExportOptions,
    timestamp: string
  ): Promise<{ fileName: string; filePath: string; fileSize: number }> {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: 'kinect-selfhosted',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: options.includePreferences ? user.preferences : undefined,
      },
      contacts: contacts.map(contact => ({
        id: contact._id,
        name: contact.name,
        phones: contact.phones || [],
        emails: contact.emails || [],
        birthday: contact.birthday,
        category: contact.category,
        lastContactDate: contact.lastContactDate,
        notes: options.includePersonalNotes ? contact.notes : undefined,
        lists: contact.lists || [],
        communicationLog: options.includeCommunicationHistory 
          ? contact.communicationLog || []
          : undefined,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      })),
      lists: lists.map(list => ({
        id: list._id,
        name: list.name,
        description: list.description,
        contacts: list.contacts || [],
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      })),
      statistics: {
        totalContacts: contacts.length,
        totalLists: lists.length,
        contactsByCategory: this.getContactsByCategory(contacts),
        recentActivity: this.getRecentActivity(contacts),
      },
    };

    const fileName = `kinect-export-${timestamp}.json`;
    const filePath = path.join(this.exportDir, fileName);
    
    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    
    const stats = await fs.stat(filePath);
    return { fileName, filePath, fileSize: stats.size };
  }

  /**
   * Export as CSV format (contacts only)
   */
  private async exportAsCSV(
    contacts: any[],
    options: ExportOptions,
    timestamp: string
  ): Promise<{ fileName: string; filePath: string; fileSize: number }> {
    const headers = [
      'Name',
      'Primary Phone',
      'Secondary Phone',
      'Primary Email',
      'Secondary Email',
      'Birthday',
      'Category',
      'Last Contact Date',
      'Days Since Contact',
      'Notes',
      'Lists',
      'Created At',
    ];

    const rows = contacts.map(contact => {
      const phones = contact.phones || [];
      const emails = contact.emails || [];
      const daysSinceContact = contact.lastContactDate 
        ? Math.floor((Date.now() - contact.lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
        : '';

      return [
        this.escapeCsvField(contact.name || ''),
        this.escapeCsvField(phones[0]?.number || ''),
        this.escapeCsvField(phones[1]?.number || ''),
        this.escapeCsvField(emails[0] || ''),
        this.escapeCsvField(emails[1] || ''),
        contact.birthday ? contact.birthday.toISOString().split('T')[0] : '',
        this.escapeCsvField(contact.category || ''),
        contact.lastContactDate ? contact.lastContactDate.toISOString().split('T')[0] : '',
        daysSinceContact,
        options.includePersonalNotes ? this.escapeCsvField(contact.notes || '') : '',
        this.escapeCsvField((contact.lists || []).join('; ')),
        contact.createdAt ? contact.createdAt.toISOString().split('T')[0] : '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const fileName = `kinect-contacts-${timestamp}.csv`;
    const filePath = path.join(this.exportDir, fileName);
    
    await fs.writeFile(filePath, csvContent, 'utf-8');
    
    const stats = await fs.stat(filePath);
    return { fileName, filePath, fileSize: stats.size };
  }

  /**
   * Export as vCard format
   */
  private async exportAsVCard(
    contacts: any[],
    options: ExportOptions,
    timestamp: string
  ): Promise<{ fileName: string; filePath: string; fileSize: number }> {
    const vCards = contacts.map(contact => {
      const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
      
      // Name
      if (contact.name) {
        lines.push(`FN:${contact.name}`);
        const nameParts = contact.name.split(' ');
        if (nameParts.length > 1) {
          lines.push(`N:${nameParts[nameParts.length - 1]};${nameParts.slice(0, -1).join(' ')};;;`);
        } else {
          lines.push(`N:${contact.name};;;;`);
        }
      }

      // Phones
      (contact.phones || []).forEach((phone: any) => {
        const type = phone.type === 'work' ? 'WORK' : phone.type === 'home' ? 'HOME' : 'CELL';
        lines.push(`TEL;TYPE=${type}:${phone.number}`);
      });

      // Emails
      (contact.emails || []).forEach((email: string) => {
        lines.push(`EMAIL:${email}`);
      });

      // Birthday
      if (contact.birthday) {
        const date = new Date(contact.birthday);
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        lines.push(`BDAY:${dateStr}`);
      }

      // Notes
      if (options.includePersonalNotes && contact.notes) {
        lines.push(`NOTE:${contact.notes.replace(/\n/g, '\\n')}`);
      }

      // Categories
      if (contact.category) {
        lines.push(`CATEGORIES:${contact.category}`);
      }

      lines.push('END:VCARD');
      return lines.join('\r\n');
    });

    const vCardContent = vCards.join('\r\n') + '\r\n';

    const fileName = `kinect-contacts-${timestamp}.vcf`;
    const filePath = path.join(this.exportDir, fileName);
    
    await fs.writeFile(filePath, vCardContent, 'utf-8');
    
    const stats = await fs.stat(filePath);
    return { fileName, filePath, fileSize: stats.size };
  }

  /**
   * Export full archive with all data
   */
  private async exportFull(
    user: any,
    contacts: any[],
    lists: any[],
    options: ExportOptions,
    timestamp: string
  ): Promise<{ fileName: string; filePath: string; fileSize: number }> {
    // Create JSON export
    const { filePath: jsonPath } = await this.exportAsJSON(
      user, contacts, lists, options, timestamp
    );

    // Create CSV export
    await this.exportAsCSV(contacts, options, timestamp);

    // Create vCard export
    await this.exportAsVCard(contacts, options, timestamp);

    // Create README
    const readmePath = path.join(this.exportDir, `README-${timestamp}.txt`);
    const readmeContent = `
Kinect Data Export
==================

Export Date: ${new Date().toISOString()}
User: ${user.name} (${user.email})
Total Contacts: ${contacts.length}
Total Lists: ${lists.length}

Files Included:
- kinect-export-${timestamp}.json (Complete data in JSON format)
- kinect-contacts-${timestamp}.csv (Contacts in CSV format)
- kinect-contacts-${timestamp}.vcf (Contacts in vCard format)

Import Instructions:
1. JSON format can be imported back into Kinect
2. CSV format works with Excel, Google Sheets, and most contact apps
3. vCard format works with most address book applications

Privacy Note:
${options.includePersonalNotes ? '✓' : '✗'} Personal notes included
${options.includeCommunicationHistory ? '✓' : '✗'} Communication history included
${options.includePreferences ? '✓' : '✗'} User preferences included

For help importing this data, see: https://github.com/kinect/self-hosted/wiki/data-import
`;

    await fs.writeFile(readmePath, readmeContent.trim(), 'utf-8');

    // For full export, return the JSON file path as the main export
    const stats = await fs.stat(jsonPath);
    return { 
      fileName: `kinect-export-${timestamp}.json`, 
      filePath: jsonPath, 
      fileSize: stats.size 
    };
  }

  /**
   * Get export file info
   */
  public async getExportFile(fileName: string): Promise<{
    filePath: string;
    exists: boolean;
    size: number;
    mimeType: string;
  }> {
    const filePath = path.join(this.exportDir, fileName);
    
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(fileName).toLowerCase();
      
      let mimeType = 'application/octet-stream';
      switch (ext) {
        case '.json':
          mimeType = 'application/json';
          break;
        case '.csv':
          mimeType = 'text/csv';
          break;
        case '.vcf':
          mimeType = 'text/vcard';
          break;
        case '.txt':
          mimeType = 'text/plain';
          break;
      }

      return {
        filePath,
        exists: true,
        size: stats.size,
        mimeType,
      };
    } catch (error) {
      return {
        filePath,
        exists: false,
        size: 0,
        mimeType: 'application/octet-stream',
      };
    }
  }

  /**
   * Clean up old export files
   */
  public async cleanupOldExports(maxAgeHours = 24): Promise<number> {
    try {
      const files = await fs.readdir(this.exportDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old exports:', error);
      return 0;
    }
  }

  /**
   * Helper methods
   */
  private escapeCsvField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private getContactsByCategory(contacts: any[]): Record<string, number> {
    const categories: Record<string, number> = {};
    contacts.forEach(contact => {
      const category = contact.category || 'Uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }

  private getRecentActivity(contacts: any[]): any[] {
    return contacts
      .filter(contact => contact.lastContactDate)
      .sort((a, b) => b.lastContactDate.getTime() - a.lastContactDate.getTime())
      .slice(0, 10)
      .map(contact => ({
        name: contact.name,
        lastContactDate: contact.lastContactDate,
        daysAgo: Math.floor((Date.now() - contact.lastContactDate.getTime()) / (1000 * 60 * 60 * 24)),
      }));
  }
}

export default new ExportService();