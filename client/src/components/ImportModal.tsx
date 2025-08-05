import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import FM Squad Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <Alert>
            <FileText className="w-4 h-4" />
            <AlertDescription>
              Export your squad from Football Manager (Squad View → Actions → Export as HTML) and upload the file here.
              The tool will automatically parse player attributes and store them for tactical analysis.
            </AlertDescription>
          </Alert>

          {/* File Upload Area */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
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
                <input
                  type="file"
                  accept=".html"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing squad data...</span>
                <span>Please wait</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {result.success ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    <div className="font-medium mb-2">Import Successful!</div>
                    <div className="text-sm space-y-1">
                      <div>• {result.playersImported} new players imported</div>
                      <div>• {result.playersUpdated} existing players updated</div>
                      <div>Total: {result.playersImported + result.playersUpdated} players processed</div>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    <div className="font-medium mb-2">Import Failed</div>
                    <div className="text-sm space-y-1">
                      {result.errors.map((error, index) => (
                        <div key={index}>• {error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    <div className="font-medium mb-2">Warnings</div>
                    <div className="text-sm space-y-1">
                      {result.warnings.map((warning, index) => (
                        <div key={index}>• {warning}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
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
      </DialogContent>
    </Dialog>
  );
}