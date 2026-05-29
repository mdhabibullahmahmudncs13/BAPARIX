import React, { forwardRef, useState, useRef, useCallback } from 'react';

export interface FileUploadProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  locale: 'bn' | 'en';
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
  onFileSelect?: (files: File[]) => void;
  multiple?: boolean;
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ 
    label, 
    error, 
    helperText, 
    locale, 
    maxSize = 5 * 1024 * 1024, // 5MB default
    acceptedFileTypes = ['image/*', 'application/pdf'],
    onFileSelect,
    multiple = false,
    className = '', 
    id,
    ...props 
  }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadError, setUploadError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const inputId = id || `fileupload-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    const fontClass = locale === 'bn' ? 'font-bengali' : 'font-english';
    
    const translations = {
      bn: {
        dragDrop: 'ফাইল টেনে এনে ছাড়ুন বা ক্লিক করুন',
        browse: 'ব্রাউজ করুন',
        selected: 'নির্বাচিত',
        remove: 'সরান',
        fileTooLarge: 'ফাইল খুব বড়',
        invalidType: 'অবৈধ ফাইল টাইপ',
      },
      en: {
        dragDrop: 'Drag and drop files here or click to browse',
        browse: 'Browse',
        selected: 'Selected',
        remove: 'Remove',
        fileTooLarge: 'File too large',
        invalidType: 'Invalid file type',
      },
    };
    
    const t = translations[locale];
    
    const handleFiles = useCallback((files: FileList | null) => {
      if (!files || files.length === 0) return;
      
      // Validate file function
      const validateFile = (file: File): string | null => {
        // Check file size
        if (file.size > maxSize) {
          return `${t.fileTooLarge}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
        }
        
        // Check file type
        const isValidType = acceptedFileTypes.some(type => {
          if (type.endsWith('/*')) {
            const category = type.split('/')[0];
            return file.type.startsWith(category);
          }
          return file.type === type;
        });
        
        if (!isValidType) {
          return `${t.invalidType}: ${file.name}`;
        }
        
        return null;
      };
      
      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      let errorMessage = '';
      
      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          errorMessage = validationError;
          break;
        }
        validFiles.push(file);
      }
      
      if (errorMessage) {
        setUploadError(errorMessage);
        return;
      }
      
      setUploadError('');
      
      if (multiple) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
        onFileSelect?.([...selectedFiles, ...validFiles]);
      } else {
        setSelectedFiles(validFiles);
        onFileSelect?.(validFiles);
      }
    }, [multiple, selectedFiles, onFileSelect, maxSize, acceptedFileTypes, t]);
    
    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };
    
    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };
    
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      const files = e.dataTransfer.files;
      handleFiles(files);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    };
    
    const handleClick = () => {
      fileInputRef.current?.click();
    };
    
    const handleRemoveFile = (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      onFileSelect?.(newFiles);
    };
    
    const displayError = error || uploadError;
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-medium text-gray-700 mb-1 ${fontClass}`}
          >
            {label}
            {props.required && <span className="text-error-500 ml-1" aria-label="required">*</span>}
          </label>
        )}
        
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-md p-6
            transition-colors duration-200 cursor-pointer
            ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}
            ${displayError ? 'border-error-500' : ''}
            ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
          role="button"
          tabIndex={0}
          aria-label={t.dragDrop}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            multiple={multiple}
            accept={acceptedFileTypes.join(',')}
            onChange={handleInputChange}
            className="hidden"
            aria-invalid={displayError ? 'true' : 'false'}
            aria-describedby={
              displayError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          
          <div className="flex flex-col items-center justify-center text-center">
            <svg
              className="w-12 h-12 text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className={`text-sm text-gray-600 ${fontClass}`}>
              {t.dragDrop}
            </p>
            <button
              type="button"
              className={`mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium ${fontClass}`}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              {t.browse}
            </button>
          </div>
        </div>
        
        {selectedFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className={`text-sm text-gray-700 truncate ${fontClass}`}>
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    ({(file.size / 1024).toFixed(1)}KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className={`ml-2 text-sm text-error-600 hover:text-error-700 flex-shrink-0 ${fontClass}`}
                  aria-label={`${t.remove} ${file.name}`}
                >
                  {t.remove}
                </button>
              </div>
            ))}
          </div>
        )}
        
        {displayError && (
          <p
            id={`${inputId}-error`}
            className={`mt-1 text-sm text-error-500 ${fontClass}`}
            role="alert"
          >
            {displayError}
          </p>
        )}
        {helperText && !displayError && (
          <p
            id={`${inputId}-helper`}
            className={`mt-1 text-sm text-gray-500 ${fontClass}`}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';
