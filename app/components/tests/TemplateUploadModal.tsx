'use client';

import React, { useState, useRef, useEffect } from 'react';
import { branchTemplateService, TemplateInfo } from '@/services/branchTemplateService';
import { BranchTest } from '@/services/testService';

interface TemplateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchTest: BranchTest;
  onSuccess: () => void;
}

const ALLOWED_TYPES = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc'
};

const TemplateUploadModal: React.FC<TemplateUploadModalProps> = ({
  isOpen,
  onClose,
  branchTest,
  onSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingTemplate, setExistingTemplate] = useState<TemplateInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing template info when modal opens
  useEffect(() => {
    if (isOpen && branchTest) {
      fetchTemplateInfo();
    } else {
      setSelectedFile(null);
      setError(null);
      // Don't clear existingTemplate when modal closes - keep it for next time
    }
  }, [isOpen, branchTest]);

  const fetchTemplateInfo = async () => {
    setIsLoading(true);
    try {
      const response = await branchTemplateService.getTemplateInfo(branchTest.id);
      
      if (response.success && response.has_template && response.template) {
        setExistingTemplate(response.template);
      } else {
        setExistingTemplate(null);
      }
    } catch (error) {
      console.error('Error fetching template info:', error);
      setError('Failed to fetch template information');
    } finally {
      setIsLoading(false);
    }
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!Object.keys(ALLOWED_TYPES).includes(file.type)) {
      setError(`Only Microsoft Word documents (.doc, .docx) are allowed for reporting templates. Selected file type: ${file.type}`);
      return false;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File ${file.name} is too large. Maximum size is 10MB.`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0]; // Only take the first file
    setError(null);
    
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await branchTemplateService.uploadTemplate(branchTest.id, selectedFile);
      
      if (response.success) {
        setSelectedFile(null);
        fetchTemplateInfo(); // Refresh template info
        onSuccess();
      } else {
        setError(response.message || 'Failed to upload template');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload template. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingTemplate) return;
    
    setIsDeleting(true);
    setError(null);

    try {
      const response = await branchTemplateService.deleteTemplate(branchTest.id);
      
      if (response.success) {
        setExistingTemplate(null);
        onSuccess();
      } else {
        setError(response.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete template. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (!existingTemplate) return;
    
    try {
      const blob = await branchTemplateService.downloadTemplate(branchTest.id);
      
      // Create a blob URL and download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = existingTemplate.file_name; // Use the original filename
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download template. Please try again.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'docx') {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Reporting Template
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isUploading || isDeleting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-300">Loading template information...</span>
            </div>
          ) : (
            <>
              {/* Test Information */}
              <div className="border-b border-gray-200 dark:border-gray-600 pb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{branchTest.test_name} - {branchTest.modality_name}</h3>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {branchTest.modality_name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Price: ₹{branchTest.price}</span>
                </div>
              </div>

              {/* Existing Template Display */}
              {existingTemplate ? (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(existingTemplate.file_type)}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Current Template
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {existingTemplate.file_name} ({formatFileSize(existingTemplate.file_size)})
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          DOCX files cannot be previewed in the browser. Download to view the template.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleDownload}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md transition-colors"
                        title="Download template"
                      >
                        <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        Download
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm rounded-md transition-colors"
                        title="Delete template"
                      >
                        {isDeleting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-md p-3">
                      <p className="text-red-600 dark:text-red-200 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver
                        ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
                        : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                        Drag and drop a file here, or click to select
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Supported formats: DOC, DOCX (Max 10MB)
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        disabled={isUploading}
                      >
                        Select File
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".doc,.docx"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Selected File Preview */}
                  {selectedFile && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getFileIcon('docx')}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {selectedFile.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!existingTemplate && selectedFile && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md transition-colors flex items-center"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  'Upload Template'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateUploadModal; 