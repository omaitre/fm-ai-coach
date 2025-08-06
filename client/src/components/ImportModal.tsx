import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportResult {
  success: boolean;
  playersImported: number;
  playersUpdated: number;
  errors: string[];
  warnings: string[];
}

export function ImportModal({ open, onClose, onSuccess }: ImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const htmlFile = files.find(file => file.name.toLowerCase().endsWith('.html'));
    
    if (htmlFile) {
      setSelectedFile(htmlFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('htmlFile', selectedFile);

      const response = await fetch('/api/import/html', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (data.success) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } else {
        setResult({
          success: false,
          playersImported: 0,
          playersUpdated: 0,
          errors: [data.error || 'Upload failed'],
          warnings: []
        });
      }
    } catch (error) {
      setResult({
        success: false,
        playersImported: 0,
        playersUpdated: 0,
        errors: ['Network error: Failed to upload file'],
        warnings: []
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, onSuccess]);

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setResult(null);
    setIsUploading(false);
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Upload className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Import FM Squad Data</h2>
          </div>

          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  Export your squad from Football Manager (Squad View → Actions → Export as HTML) and upload the file here.
                  The tool will automatically parse player attributes and store them for tactical analysis.
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors relative
                ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
                ${selectedFile ? 'border-green-400 bg-green-50' : ''}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="font-medium text-green-700">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      Drop your FM HTML file here
                    </p>
                    <p className="text-gray-500">or click to browse</p>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept=".html"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importing squad data...</span>
                  <span>Please wait</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse w-full"></div>
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-4">
                {result.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <div className="text-green-800">
                        <div className="font-medium mb-2">Import Successful!</div>
                        <div className="text-sm space-y-1">
                          <div>• {result.playersImported} new players imported</div>
                          <div>• {result.playersUpdated} existing players updated</div>
                          <div>Total: {result.playersImported + result.playersUpdated} players processed</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                      <div className="text-red-800">
                        <div className="font-medium mb-2">Import Failed</div>
                        <div className="text-sm space-y-1">
                          {result.errors.map((error, index) => (
                            <div key={index}>• {error}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {result.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div className="text-yellow-800">
                        <div className="font-medium mb-2">Warnings</div>
                        <div className="text-sm space-y-1">
                          {result.warnings.map((warning, index) => (
                            <div key={index}>• {warning}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                {result?.success ? 'Close' : 'Cancel'}
              </Button>
              
              {!result?.success && (
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? 'Importing...' : 'Import Squad'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}