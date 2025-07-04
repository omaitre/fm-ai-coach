import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CloudUpload, X, FileImage } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  accept?: string;
  maxSize?: number; // in MB
}

export default function FileUpload({ 
  onFileSelect, 
  selectedFile, 
  accept = ".html,text/html", 
  maxSize = 10 
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    setError(null);
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return false;
    }
    
    // Check file type - only HTML files allowed
    if (file.type === "text/html" || file.name.toLowerCase().endsWith(".html")) {
      return true;
    } else {
      setError("Please select a valid HTML file");
      return false;
    }
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeFile = () => {
    onFileSelect(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <Card
          className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
            isDragOver 
              ? "border-primary/50 bg-primary/5" 
              : "border-border hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <CloudUpload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground mb-2">
            Drag and drop your FM HTML export here
          </p>
          <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
          <Button type="button" className="bg-primary text-primary-foreground">
            Choose File
          </Button>
          <input
            id="file-input"
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </Card>
      ) : (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileImage className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removeFile}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
