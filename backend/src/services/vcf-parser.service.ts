import VCardParser from 'vcard-parser';
import type { IContact } from '@kinect/shared';

export interface ParsedContact {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  isValid: boolean;
  errors: string[];
}

export interface VcfParseResult {
  contacts: ParsedContact[];
  totalParsed: number;
  validContacts: number;
  invalidContacts: number;
  errors: string[];
}

export class VcfParserService {
  /**
   * Parse VCF file content and extract contact information
   */
  static parseVcf(vcfContent: string): VcfParseResult {
    const result: VcfParseResult = {
      contacts: [],
      totalParsed: 0,
      validContacts: 0,
      invalidContacts: 0,
      errors: [],
    };

    try {
      // Split VCF content into individual vCards
      const vCards = this.splitIntoIndividualVCards(vcfContent);
      result.totalParsed = vCards.length;

      console.log(`Found ${vCards.length} individual vCards`);

      // Process each vCard individually
      vCards.forEach((vCardText, index) => {
        try {
          const contact = this.parseIndividualVCard(vCardText);

          if (contact.isValid) {
            result.validContacts++;
          } else {
            result.invalidContacts++;
          }

          result.contacts.push(contact);
        } catch (error) {
          result.errors.push(`Failed to parse contact at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.invalidContacts++;

          // Add a placeholder invalid contact
          result.contacts.push({
            firstName: '',
            lastName: '',
            isValid: false,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
          });
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('VCF parsing error:', error);
      result.errors.push(`Failed to parse VCF file: ${errorMessage}`);
    }

    return result;
  }

  /**
   * Split VCF content into individual vCard strings
   */
  private static splitIntoIndividualVCards(vcfContent: string): string[] {
    const vCards: string[] = [];
    const lines = vcfContent.split(/\r?\n/);
    let currentVCard: string[] = [];
    let inVCard = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine === 'BEGIN:VCARD') {
        inVCard = true;
        currentVCard = [trimmedLine];
      } else if (trimmedLine === 'END:VCARD') {
        if (inVCard) {
          currentVCard.push(trimmedLine);
          vCards.push(currentVCard.join('\n'));
          currentVCard = [];
          inVCard = false;
        }
      } else if (inVCard) {
        currentVCard.push(line); // Keep original line with whitespace for continuation lines
      }
    }

    return vCards.filter(vCard => vCard.length > 0);
  }

  /**
   * Parse a single vCard string
   */
  private static parseIndividualVCard(vCardText: string): ParsedContact {
    const contact: ParsedContact = {
      firstName: '',
      lastName: '',
      email: undefined,
      phoneNumber: undefined,
      isValid: false,
      errors: [],
    };

    try {
      // Parse single vCard
      const parsed = VCardParser.parse(vCardText) as any;

      // Extract name (N property: Family;Given;Additional;Prefix;Suffix)
      if (parsed.n && parsed.n[0]) {
        const nValue = parsed.n[0].value;
        if (Array.isArray(nValue)) {
          contact.lastName = nValue[0]?.trim() || '';
          contact.firstName = nValue[1]?.trim() || '';
        } else if (typeof nValue === 'string') {
          const parts = nValue.split(';');
          contact.lastName = parts[0]?.trim() || '';
          contact.firstName = parts[1]?.trim() || '';
        }
      }

      // Fallback to FN (formatted name) ONLY if N field is completely missing
      // If N field has firstName but no lastName, keep firstName as-is and use it for lastName too
      if (!contact.firstName && !contact.lastName && parsed.fn && parsed.fn[0]) {
        // No name from N field at all, split FN as best we can
        const fullName = typeof parsed.fn[0].value === 'string'
          ? parsed.fn[0].value
          : String(parsed.fn[0].value || '');
        const nameParts = fullName.trim().split(/\s+/);

        contact.firstName = nameParts[0] || '';
        contact.lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';
      } else if (contact.firstName && !contact.lastName) {
        // Have firstName from N field but no lastName
        // If firstName contains multiple words, split it to avoid duplication
        const firstNameParts = contact.firstName.trim().split(/\s+/);
        if (firstNameParts.length > 1) {
          // Multi-word firstName like "Gg Guy" -> split into "Gg" and "Guy"
          contact.firstName = firstNameParts[0];
          contact.lastName = firstNameParts.slice(1).join(' ');
        } else {
          // Single word firstName, duplicate it for lastName
          contact.lastName = contact.firstName;
        }
      } else if (contact.lastName && !contact.firstName) {
        // Have lastName from N field but no firstName (unusual but handle it)
        // If lastName contains multiple words, split it
        const lastNameParts = contact.lastName.trim().split(/\s+/);
        if (lastNameParts.length > 1) {
          contact.firstName = lastNameParts[0];
          contact.lastName = lastNameParts.slice(1).join(' ');
        } else {
          contact.firstName = contact.lastName;
        }
      }

      // Extract email (use first email if multiple)
      if (parsed.email && parsed.email[0]) {
        const emailValue = parsed.email[0].value;
        contact.email = typeof emailValue === 'string'
          ? emailValue.trim().toLowerCase()
          : String(emailValue || '').trim().toLowerCase();
      }

      // Extract phone number (use first phone if multiple)
      if (parsed.tel && parsed.tel[0]) {
        const telValue = parsed.tel[0].value;
        contact.phoneNumber = this.cleanPhoneNumber(
          typeof telValue === 'string' ? telValue : String(telValue || '')
        );
      }

      // Validate contact
      if (!contact.firstName && !contact.lastName) {
        contact.errors.push('Missing required fields: firstName and lastName');
      }

      if (contact.firstName && contact.firstName.length > 100) {
        contact.errors.push('First name is too long (max 100 characters)');
      }

      if (contact.lastName && contact.lastName.length > 100) {
        contact.errors.push('Last name is too long (max 100 characters)');
      }

      if (contact.email && !this.isValidEmail(contact.email)) {
        contact.errors.push('Invalid email format');
        contact.email = undefined; // Remove invalid email
      }

      contact.isValid = contact.errors.length === 0 && !!contact.firstName && !!contact.lastName;

    } catch (error) {
      contact.errors.push(`Failed to extract contact data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return contact;
  }

  /**
   * Clean and format phone number
   */
  private static cleanPhoneNumber(phone?: string): string | undefined {
    if (!phone) return undefined;

    // Remove common formatting characters but keep the number readable
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

    // Only return if we have a reasonable phone number
    return cleaned.length >= 7 ? phone.trim() : undefined;
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Convert parsed contacts to IContact format for database insertion
   */
  static toContactFormat(parsedContacts: ParsedContact[], userId: string): Partial<IContact>[] {
    return parsedContacts
      .filter(contact => contact.isValid)
      .map(contact => ({
        userId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phoneNumber: contact.phoneNumber,
        lastContactDate: new Date(), // Set to now for newly imported contacts
      }));
  }

  /**
   * Detect potential duplicates based on email or phone number
   */
  static findDuplicates(
    newContacts: ParsedContact[],
    existingContacts: IContact[]
  ): { contact: ParsedContact; duplicateOf: IContact }[] {
    const duplicates: { contact: ParsedContact; duplicateOf: IContact }[] = [];

    newContacts.forEach(newContact => {
      const duplicate = existingContacts.find(existing => {
        // Match by email if both have email
        if (newContact.email && existing.email) {
          return newContact.email.toLowerCase() === existing.email.toLowerCase();
        }

        // Match by phone if both have phone
        if (newContact.phoneNumber && existing.phoneNumber) {
          const cleanNew = this.cleanPhoneNumber(newContact.phoneNumber);
          const cleanExisting = this.cleanPhoneNumber(existing.phoneNumber);
          return cleanNew === cleanExisting;
        }

        // Match by exact name match
        if (newContact.firstName && newContact.lastName && existing.firstName && existing.lastName) {
          return (
            newContact.firstName.toLowerCase() === existing.firstName.toLowerCase() &&
            newContact.lastName.toLowerCase() === existing.lastName.toLowerCase()
          );
        }

        return false;
      });

      if (duplicate) {
        duplicates.push({ contact: newContact, duplicateOf: duplicate });
      }
    });

    return duplicates;
  }
}
