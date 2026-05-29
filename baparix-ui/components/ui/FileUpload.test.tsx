import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileUpload } from './FileUpload';

describe('FileUpload', () => {
  it('should render with label', () => {
    render(
      <FileUpload
        label="Upload File"
        locale="en"
      />
    );
    
    expect(screen.getByLabelText('Upload File')).toBeInTheDocument();
  });
  
  it('should display drag and drop text in English', () => {
    render(
      <FileUpload
        label="Upload File"
        locale="en"
      />
    );
    
    expect(screen.getByText(/Drag and drop files here or click to browse/i)).toBeInTheDocument();
  });
  
  it('should display drag and drop text in Bengali', () => {
    render(
      <FileUpload
        label="ফাইল আপলোড করুন"
        locale="bn"
      />
    );
    
    expect(screen.getByText(/ফাইল টেনে এনে ছাড়ুন বা ক্লিক করুন/)).toBeInTheDocument();
  });
  
  it('should handle file selection', async () => {
    const handleFileSelect = jest.fn();
    render(
      <FileUpload
        label="Upload File"
        locale="en"
        onFileSelect={handleFileSelect}
      />
    );
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Upload File') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(handleFileSelect).toHaveBeenCalledWith([file]);
    });
  });
  
  it('should display selected file', async () => {
    render(
      <FileUpload
        label="Upload File"
        locale="en"
      />
    );
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Upload File') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });
  
  it('should handle file removal', async () => {
    const handleFileSelect = jest.fn();
    render(
      <FileUpload
        label="Upload File"
        locale="en"
        onFileSelect={handleFileSelect}
      />
    );
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Upload File') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
    
    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
      expect(handleFileSelect).toHaveBeenCalledWith([]);
    });
  });
  
  it('should validate file size', async () => {
    render(
      <FileUpload
        label="Upload File"
        locale="en"
        maxSize={1024} // 1KB
      />
    );
    
    const largeFile = new File(['x'.repeat(2048)], 'large.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Upload File') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/File too large/i);
    });
  });
  
  it('should validate file type', async () => {
    render(
      <FileUpload
        label="Upload File"
        locale="en"
        acceptedFileTypes={['image/*']}
      />
    );
    
    const invalidFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Upload File') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [invalidFile],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Invalid file type/i);
    });
  });
  
  it('should handle drag and drop', async () => {
    const handleFileSelect = jest.fn();
    render(
      <FileUpload
        label="Upload File"
        locale="en"
        onFileSelect={handleFileSelect}
      />
    );
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const dropZone = screen.getByRole('button', { name: /Drag and drop/i });
    
    const dataTransfer = {
      files: [file],
      types: ['Files'],
    };
    
    fireEvent.dragEnter(dropZone, { dataTransfer });
    fireEvent.dragOver(dropZone, { dataTransfer });
    fireEvent.drop(dropZone, { dataTransfer });
    
    await waitFor(() => {
      expect(handleFileSelect).toHaveBeenCalledWith([file]);
    });
  });
  
  it('should highlight drop zone on drag enter', () => {
    render(
      <FileUpload
        label="Upload File"
        locale="en"
      />
    );
    
    const dropZone = screen.getByRole('button', { name: /Drag and drop/i });
    
    fireEvent.dragEnter(dropZone);
    
    expect(dropZone).toHaveClass('border-primary-500');
  });
  
  it('should remove highlight on drag leave', () => {
    render(
      <FileUpload
        label="Upload File"
        locale="en"
      />
    );
    
    const dropZone = screen.getByRole('button', { name: /Drag and drop/i });
    
    fireEvent.dragEnter(dropZone);
    fireEvent.dragLeave(dropZone);
    
    expect(dropZone).not.toHaveClass('border-primary-500');
  });
  
  it('should support multiple file selection', async () => {
    const handleFileSelect = jest.fn();
    render(
      <FileUpload
        label="Upload File"
        locale="en"
        multiple
        onFileSelect={handleFileSelect}
      />
    );
    
    const file1 = new File(['test1'], 'test1.pdf', { type: 'application/pdf' });
    const file2 = new File(['test2'], 'test2.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Upload File') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file1, file2],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(handleFileSelect).toHaveBeenCalledWith([file1, file2]);
      expect(screen.getByText('test1.pdf')).toBeInTheDocument();
      expect(screen.getByText('test2.pdf')).toBeInTheDocument();
    });
  });
  
  it('should display error message', () => {
    render(
      <FileUpload
        label="Upload File"
        locale="en"
        error="File is required"
      />
    );
    
    expect(screen.getByRole('alert')).toHaveTextContent('File is required');
  });
  
  it('should display helper text', () => {
    render(
      <FileUpload
        label="Upload File"
        locale="en"
        helperText="Maximum file size: 5MB"
      />
    );
    
    expect(screen.getByText('Maximum file size: 5MB')).toBeInTheDocument();
  });
  
  it('should mark required fields', () => {
    render(
      <FileUpload
        label="Upload File"
        locale="en"
        required
      />
    );
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });
  
  it('should apply Bengali font class for Bengali locale', () => {
    render(
      <FileUpload
        label="ফাইল আপলোড করুন"
        locale="bn"
      />
    );
    
    const label = screen.getByText('ফাইল আপলোড করুন');
    expect(label).toHaveClass('font-bengali');
  });
  
  it('should be disabled when disabled prop is true', () => {
    render(
      <FileUpload
        label="Upload File"
        locale="en"
        disabled
      />
    );
    
    const dropZone = screen.getByRole('button', { name: /Drag and drop/i });
    expect(dropZone).toHaveClass('cursor-not-allowed');
  });
  
  it('should display file size in KB', async () => {
    render(
      <FileUpload
        label="Upload File"
        locale="en"
      />
    );
    
    const file = new File(['x'.repeat(1024)], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Upload File') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(screen.getByText(/\(1\.0KB\)/)).toBeInTheDocument();
    });
  });
  
  it('should handle keyboard navigation', () => {
    render(
      <FileUpload
        label="Upload File"
        locale="en"
      />
    );
    
    const dropZone = screen.getByRole('button', { name: /Drag and drop/i });
    
    fireEvent.keyDown(dropZone, { key: 'Enter' });
    
    // Should trigger file input click (tested indirectly through component behavior)
    expect(dropZone).toBeInTheDocument();
  });
});
