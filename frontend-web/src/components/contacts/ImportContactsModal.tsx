import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { IImportContactPreview } from '@kinect/shared';
import api from '../../services/api';
import { LoadingButton } from '../common/LoadingButton';
import { FormError } from '../common/FormError';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Upload, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportContactsModal: React.FC<ImportContactsModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [contacts, setContacts] = useState<IImportContactPreview[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [parseResult, setParseResult] = useState<{
    totalParsed: number;
    validContacts: number;
    invalidContacts: number;
    duplicatesFound: number;
    errors: string[];
  } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const handleError = useErrorHandler();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const vcfFile = acceptedFiles[0];
      setFile(vcfFile);
      setApiError(null);
      setIsParsing(true);

      try {
        const result = await api.parseVcfFile(vcfFile);
        setContacts(result.contacts);
        setParseResult(result);

        // Auto-select all valid contacts that are not duplicates
        const validIndices = new Set(
          result.contacts
            .map((contact, index) => (contact.isValid && !contact.isDuplicate ? index : -1))
            .filter((index) => index !== -1)
        );
        setSelectedContacts(validIndices);

        if (result.validContacts === 0) {
          setApiError('No valid contacts found in VCF file');
        } else {
          toast.success(`Parsed ${result.validContacts} valid contact${result.validContacts !== 1 ? 's' : ''}`);
        }
      } catch (error) {
        handleError(error, 'Failed to parse VCF file');
        setApiError('Failed to parse VCF file. Please ensure it is a valid VCF file.');
      } finally {
        setIsParsing(false);
      }
    },
    [handleError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/vcard': ['.vcf', '.vcard'],
    },
    multiple: false,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const toggleContact = (index: number) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedContacts(newSelected);
  };

  const selectAll = () => {
    const validIndices = new Set(
      contacts
        .map((contact, index) => (contact.isValid && !contact.isDuplicate ? index : -1))
        .filter((index) => index !== -1)
    );
    setSelectedContacts(validIndices);
  };

  const deselectAll = () => {
    setSelectedContacts(new Set());
  };

  const handleImport = async () => {
    if (selectedContacts.size === 0) {
      toast.error('Please select at least one contact to import');
      return;
    }

    setIsImporting(true);
    setApiError(null);

    try {
      const contactsToImport = Array.from(selectedContacts).map((index) => {
        const contact = contacts[index];
        return {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phoneNumber: contact.phoneNumber,
        };
      });

      const result = await api.importContacts(contactsToImport);

      toast.success(
        `Successfully imported ${result.imported} contact${result.imported !== 1 ? 's' : ''}`
      );

      if (result.skipped > 0) {
        toast.error(`${result.skipped} contact${result.skipped !== 1 ? 's' : ''} could not be imported`);
      }

      onImportComplete();
      handleClose();
    } catch (error) {
      handleError(error, 'Failed to import contacts');
      setApiError('Failed to import contacts. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setContacts([]);
    setSelectedContacts(new Set());
    setParseResult(null);
    setApiError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Import Contacts</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isParsing || isImporting}
          >
            <X size={24} />
          </button>
        </div>

        {apiError && <FormError error={apiError} className="mb-4" />}

        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload size={48} className="mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-lg text-blue-600">Drop the VCF file here...</p>
            ) : (
              <>
                <p className="text-lg text-gray-700 mb-2">
                  Drag and drop a VCF file here, or click to select
                </p>
                <p className="text-sm text-gray-500">Maximum file size: 5MB</p>
              </>
            )}
          </div>
        ) : isParsing ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Parsing VCF file...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File info and stats */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FileText size={20} className="text-gray-600" />
                  <span className="font-medium">{file.name}</span>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setContacts([]);
                    setSelectedContacts(new Set());
                    setParseResult(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Choose different file
                </button>
              </div>

              {parseResult && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Total Parsed</div>
                    <div className="text-xl font-semibold">{parseResult.totalParsed}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Valid</div>
                    <div className="text-xl font-semibold text-green-600">
                      {parseResult.validContacts}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Duplicates</div>
                    <div className="text-xl font-semibold text-yellow-600">
                      {parseResult.duplicatesFound}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Invalid</div>
                    <div className="text-xl font-semibold text-red-600">
                      {parseResult.invalidContacts}
                    </div>
                  </div>
                </div>
              )}

              {parseResult && parseResult.errors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-red-600 mb-1">Errors:</p>
                  <ul className="text-sm text-red-600 list-disc list-inside">
                    {parseResult.errors.slice(0, 3).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {parseResult.errors.length > 3 && (
                      <li>... and {parseResult.errors.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Contact list */}
            {contacts.length > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    Select contacts to import ({selectedContacts.size} selected)
                  </h3>
                  <div className="space-x-2">
                    <button
                      onClick={selectAll}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Select All Valid
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={deselectAll}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                          Import
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Phone
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contacts.map((contact, index) => (
                        <tr
                          key={index}
                          className={`${
                            contact.isDuplicate
                              ? 'bg-yellow-50'
                              : !contact.isValid
                                ? 'bg-red-50'
                                : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedContacts.has(index)}
                              onChange={() => toggleContact(index)}
                              disabled={!contact.isValid || contact.isDuplicate}
                              className="h-4 w-4 text-blue-600 rounded disabled:opacity-50"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {!contact.lastName || contact.firstName === contact.lastName
                              ? contact.firstName
                              : `${contact.firstName} ${contact.lastName}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {contact.email || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {contact.phoneNumber || '-'}
                          </td>
                          <td className="px-4 py-3">
                            {contact.isDuplicate ? (
                              <div className="flex items-center text-yellow-600">
                                <AlertCircle size={16} className="mr-1" />
                                <span className="text-xs">Duplicate</span>
                              </div>
                            ) : contact.isValid ? (
                              <div className="flex items-center text-green-600">
                                <CheckCircle size={16} className="mr-1" />
                                <span className="text-xs">Valid</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-red-600">
                                <X size={16} className="mr-1" />
                                <span className="text-xs">Invalid</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Action buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isImporting}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <LoadingButton
                onClick={handleImport}
                loading={isImporting}
                loadingText="Importing..."
                disabled={selectedContacts.size === 0}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                Import {selectedContacts.size > 0 ? `(${selectedContacts.size})` : ''}
              </LoadingButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
