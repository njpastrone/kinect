#!/usr/bin/env python3
"""
Kinect Contact Import Script

Supports multiple contact formats:
- Google Contacts CSV
- iPhone vCard (.vcf)
- Android Contacts
- Outlook/Exchange CSV
- Generic CSV with field mapping

Usage: python import-contacts.py <file> [options]
"""

import argparse
import csv
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Union
try:
    import vobject  # For vCard parsing (install with: pip install vobject)
except ImportError:
    vobject = None


class ContactImporter:
    """Main contact importer class"""
    
    SUPPORTED_FORMATS = {'.csv', '.vcf', '.json'}
    
    def __init__(self, output_dir: str = './imports'):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
    def detect_format(self, file_path: Path) -> str:
        """Detect the format of the input file"""
        suffix = file_path.suffix.lower()
        
        if suffix == '.vcf':
            return 'vcard'
        elif suffix == '.json':
            return 'json'
        elif suffix == '.csv':
            # Try to detect CSV variant
            return self._detect_csv_format(file_path)
        else:
            raise ValueError(f"Unsupported file format: {suffix}")
    
    def _detect_csv_format(self, file_path: Path) -> str:
        """Detect specific CSV format (Google, Outlook, etc.)"""
        with open(file_path, 'r', encoding='utf-8') as f:
            first_line = f.readline().strip().lower()
            
        if 'given name' in first_line and 'family name' in first_line:
            return 'google_csv'
        elif 'first name' in first_line and 'last name' in first_line:
            return 'outlook_csv'
        elif 'display name' in first_line and 'phone' in first_line:
            return 'android_csv'
        else:
            return 'generic_csv'
    
    def import_file(self, file_path: Path, format_hint: Optional[str] = None) -> List[Dict]:
        """Import contacts from file"""
        if format_hint:
            format_type = format_hint
        else:
            format_type = self.detect_format(file_path)
        
        print(f"Detected format: {format_type}")
        
        if format_type == 'vcard':
            return self._import_vcard(file_path)
        elif format_type == 'json':
            return self._import_json(file_path)
        elif format_type in ['google_csv', 'outlook_csv', 'android_csv', 'generic_csv']:
            return self._import_csv(file_path, format_type)
        else:
            raise ValueError(f"Unknown format: {format_type}")
    
    def _import_vcard(self, file_path: Path) -> List[Dict]:
        """Import from vCard (.vcf) file"""
        if not vobject:
            raise ImportError("vobject library not installed. Install with: pip install vobject")
        
        contacts = []
        
        with open(file_path, 'r', encoding='utf-8') as f:
            vcards = vobject.readComponents(f.read())
        
        for vcard in vcards:
            contact = {
                'name': '',
                'phones': [],
                'emails': [],
                'birthday': None,
                'category': 'Friend',
                'lastContact': None,
                'notes': ''
            }
            
            # Name
            if hasattr(vcard, 'fn'):
                contact['name'] = vcard.fn.value
            elif hasattr(vcard, 'n'):
                n = vcard.n.value
                contact['name'] = f"{n.given} {n.family}".strip()
            
            # Phone numbers
            for tel in vcard.contents.get('tel', []):
                phone_type = 'mobile'
                if hasattr(tel, 'type_param'):
                    types = tel.type_param
                    if 'WORK' in types:
                        phone_type = 'work'
                    elif 'HOME' in types:
                        phone_type = 'home'
                
                contact['phones'].append({
                    'type': phone_type,
                    'number': self._normalize_phone(tel.value),
                    'primary': len(contact['phones']) == 0
                })
            
            # Email addresses
            for email in vcard.contents.get('email', []):
                contact['emails'].append(email.value)
            
            # Birthday
            if hasattr(vcard, 'bday'):
                contact['birthday'] = self._parse_date(vcard.bday.value)
            
            # Notes
            if hasattr(vcard, 'note'):
                contact['notes'] = vcard.note.value
            
            if contact['name']:
                contacts.append(contact)
        
        print(f"Imported {len(contacts)} contacts from vCard")
        return contacts
    
    def _import_csv(self, file_path: Path, csv_type: str) -> List[Dict]:
        """Import from CSV file"""
        contacts = []
        
        with open(file_path, 'r', encoding='utf-8') as f:
            # Try to detect delimiter
            sample = f.read(1024)
            f.seek(0)
            delimiter = ',' if sample.count(',') > sample.count(';') else ';'
            
            reader = csv.DictReader(f, delimiter=delimiter)
            
            for row in reader:
                if csv_type == 'google_csv':
                    contact = self._parse_google_csv_row(row)
                elif csv_type == 'outlook_csv':
                    contact = self._parse_outlook_csv_row(row)
                elif csv_type == 'android_csv':
                    contact = self._parse_android_csv_row(row)
                else:  # generic_csv
                    contact = self._parse_generic_csv_row(row)
                
                if contact and contact.get('name'):
                    contacts.append(contact)
        
        print(f"Imported {len(contacts)} contacts from {csv_type}")
        return contacts
    
    def _parse_google_csv_row(self, row: Dict) -> Dict:
        """Parse Google Contacts CSV row"""
        name = f"{row.get('Given Name', '')} {row.get('Family Name', '')}".strip()
        if not name:
            name = row.get('Name', '')
        
        phones = []
        for i in range(1, 6):  # Google exports up to 5 phone numbers
            phone_key = f'Phone {i} - Value' if i > 1 else 'Phone 1 - Value'
            phone_type_key = f'Phone {i} - Type' if i > 1 else 'Phone 1 - Type'
            
            phone = row.get(phone_key, '').strip()
            if phone:
                phones.append({
                    'type': self._normalize_phone_type(row.get(phone_type_key, 'Mobile')),
                    'number': self._normalize_phone(phone),
                    'primary': len(phones) == 0
                })
        
        emails = []
        for i in range(1, 4):  # Google exports up to 3 emails
            email_key = f'E-mail {i} - Value' if i > 1 else 'E-mail 1 - Value'
            email = row.get(email_key, '').strip()
            if email:
                emails.append(email)
        
        return {
            'name': name,
            'phones': phones,
            'emails': emails,
            'birthday': self._parse_date(row.get('Birthday', '')),
            'category': 'Friend',
            'lastContact': None,
            'notes': row.get('Notes', '')
        }
    
    def _parse_outlook_csv_row(self, row: Dict) -> Dict:
        """Parse Outlook/Exchange CSV row"""
        name = f"{row.get('First Name', '')} {row.get('Last Name', '')}".strip()
        if not name:
            name = row.get('Display Name', '')
        
        phones = []
        phone_fields = ['Mobile Phone', 'Home Phone', 'Business Phone']
        for field in phone_fields:
            phone = row.get(field, '').strip()
            if phone:
                phones.append({
                    'type': self._normalize_phone_type(field),
                    'number': self._normalize_phone(phone),
                    'primary': len(phones) == 0
                })
        
        return {
            'name': name,
            'phones': phones,
            'emails': [row.get('E-mail Address', '').strip()] if row.get('E-mail Address') else [],
            'birthday': self._parse_date(row.get('Birthday', '')),
            'category': 'Friend',
            'lastContact': None,
            'notes': row.get('Notes', '')
        }
    
    def _parse_android_csv_row(self, row: Dict) -> Dict:
        """Parse Android Contacts CSV row"""
        return {
            'name': row.get('Display Name', '').strip(),
            'phones': [{'type': 'mobile', 'number': self._normalize_phone(row.get('Phone', '')), 'primary': True}] if row.get('Phone') else [],
            'emails': [row.get('Email', '').strip()] if row.get('Email') else [],
            'birthday': None,
            'category': 'Friend',
            'lastContact': None,
            'notes': ''
        }
    
    def _parse_generic_csv_row(self, row: Dict) -> Dict:
        """Parse generic CSV row with field detection"""
        # Try to find name fields
        name = ''
        for field in ['Name', 'Full Name', 'Display Name', 'Contact Name']:
            if row.get(field):
                name = row[field].strip()
                break
        
        if not name:
            # Try first/last name combination
            first = row.get('First Name', row.get('Given Name', '')).strip()
            last = row.get('Last Name', row.get('Family Name', '')).strip()
            name = f"{first} {last}".strip()
        
        # Find phone field
        phone = ''
        for field in ['Phone', 'Mobile', 'Phone Number', 'Mobile Phone']:
            if row.get(field):
                phone = row[field].strip()
                break
        
        # Find email field
        email = ''
        for field in ['Email', 'E-mail', 'Email Address']:
            if row.get(field):
                email = row[field].strip()
                break
        
        return {
            'name': name,
            'phones': [{'type': 'mobile', 'number': self._normalize_phone(phone), 'primary': True}] if phone else [],
            'emails': [email] if email else [],
            'birthday': None,
            'category': 'Friend',
            'lastContact': None,
            'notes': row.get('Notes', row.get('Note', ''))
        }
    
    def _import_json(self, file_path: Path) -> List[Dict]:
        """Import from JSON file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if isinstance(data, dict) and 'contacts' in data:
            contacts = data['contacts']
        elif isinstance(data, list):
            contacts = data
        else:
            raise ValueError("Invalid JSON format")
        
        print(f"Imported {len(contacts)} contacts from JSON")
        return contacts
    
    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone number"""
        if not phone:
            return ''
        
        # Remove all non-digit characters except +
        normalized = re.sub(r'[^\d+]', '', phone)
        
        # Ensure it starts with country code
        if normalized and not normalized.startswith('+'):
            if normalized.startswith('1') and len(normalized) == 11:
                normalized = '+' + normalized
            elif len(normalized) == 10:
                normalized = '+1' + normalized
        
        return normalized
    
    def _normalize_phone_type(self, phone_type: str) -> str:
        """Normalize phone type"""
        phone_type = phone_type.lower()
        if 'mobile' in phone_type or 'cell' in phone_type:
            return 'mobile'
        elif 'work' in phone_type or 'business' in phone_type:
            return 'work'
        elif 'home' in phone_type:
            return 'home'
        else:
            return 'mobile'
    
    def _parse_date(self, date_str: str) -> Optional[str]:
        """Parse various date formats"""
        if not date_str:
            return None
        
        # Try various date formats
        date_formats = [
            '%Y-%m-%d',
            '%m/%d/%Y',
            '%d/%m/%Y',
            '%Y/%m/%d',
            '%B %d, %Y',
            '%d %B %Y',
            '%Y-%m-%d %H:%M:%S'
        ]
        
        for fmt in date_formats:
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        return None
    
    def export_kinect_json(self, contacts: List[Dict], output_path: Path):
        """Export contacts in Kinect-compatible JSON format"""
        kinect_data = {
            'version': '1.0',
            'imported_at': datetime.now().isoformat(),
            'contacts': contacts
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(kinect_data, f, indent=2, ensure_ascii=False)
        
        print(f"Exported {len(contacts)} contacts to {output_path}")


def main():
    parser = argparse.ArgumentParser(description='Import contacts for Kinect')
    parser.add_argument('file', help='Input file path')
    parser.add_argument('--format', choices=['vcard', 'google_csv', 'outlook_csv', 'android_csv', 'json'],
                       help='Force specific format detection')
    parser.add_argument('--output-dir', default='./imports', help='Output directory')
    parser.add_argument('--dry-run', action='store_true', help='Preview import without saving')
    
    args = parser.parse_args()
    
    input_file = Path(args.file)
    if not input_file.exists():
        print(f"Error: File {input_file} not found")
        sys.exit(1)
    
    try:
        importer = ContactImporter(args.output_dir)
        contacts = importer.import_file(input_file, args.format)
        
        if not contacts:
            print("No contacts found in file")
            sys.exit(1)
        
        if args.dry_run:
            print("\nDRY RUN - Preview of imported contacts:")
            for i, contact in enumerate(contacts[:5], 1):
                print(f"{i}. {contact['name']} - {len(contact['phones'])} phones, {len(contact['emails'])} emails")
            if len(contacts) > 5:
                print(f"... and {len(contacts) - 5} more contacts")
        else:
            output_file = Path(args.output_dir) / f"imported_contacts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            importer.export_kinect_json(contacts, output_file)
            
            print(f"\n✅ Import successful!")
            print(f"📁 File saved to: {output_file}")
            print(f"📊 Total contacts: {len(contacts)}")
            print(f"\nNext steps:")
            print(f"1. Go to http://localhost:3000/settings/import")
            print(f"2. Select the generated JSON file")
            print(f"3. Review and confirm the import")
    
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()