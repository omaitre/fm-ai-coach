import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Upload, FileText, Users, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/ui/file-upload";

interface HtmlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportResult {
  totalPlayers: number;
  successfulImports: number;
  failedImports: number;
  errors: string[];
  players: Array<{
    id: number;
    name: string;
    age?: number;
  }>;
}

export default function HtmlImportModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: HtmlImportModalProps) {
  const { toast } = useToast();
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("html", file);
      
      const response = await fetch("/api/import-html", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Import failed");
      }
      
      return response.json();
    },
    onSuccess: (data: ImportResult) => {
      setImportResult(data);
      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.successfulImports} of ${data.totalPlayers} players`,
      });
      
      if (data.failedImports === 0) {
        // Auto-close after successful import
        setTimeout(() => {
          onSuccess();
          resetForm();
        }, 3000);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setHtmlFile(null);
    setImportResult(null);
  };

  const handleImport = () => {
    if (!htmlFile) {
      toast({
        title: "No File Selected",
        description: "Please select an HTML file to import",
        variant: "destructive",
      });
      return;
    }

    importMutation.mutate(htmlFile);
  };

  const handleClose = () => {
    if (importResult && importResult.successfulImports > 0) {
      onSuccess();
    }
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Import Squad from FM HTML Export
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {!importResult ? (
            <>
              {/* Instructions */}
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">How to Export from Football Manager</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Go to your Squad screen in Football Manager</li>
                        <li>Right-click on the squad list and select "Export View"</li>
                        <li>Choose "Web Page (HTML)" as the export format</li>
                        <li>Save the file and upload it here</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* File Upload */}
              <div>
                <FileUpload
                  onFileSelect={setHtmlFile}
                  selectedFile={htmlFile}
                  accept=".html,text/html"
                />
              </div>

              {/* Import Button */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={!htmlFile || importMutation.isPending}
                  className="bg-primary text-primary-foreground"
                >
                  {importMutation.isPending ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Squad
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Import Results */}
              <div className="space-y-4">
                {/* Summary */}
                <Card className="border-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Import Complete</h3>
                          <p className="text-sm text-muted-foreground">
                            {importResult.successfulImports} of {importResult.totalPlayers} players imported
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="default" className="mb-1">
                          {importResult.successfulImports} Success
                        </Badge>
                        {importResult.failedImports > 0 && (
                          <Badge variant="destructive">
                            {importResult.failedImports} Failed
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-foreground">{importResult.totalPlayers}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-500">{importResult.successfulImports}</p>
                        <p className="text-xs text-muted-foreground">Imported</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-500">{importResult.failedImports}</p>
                        <p className="text-xs text-muted-foreground">Failed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Imported Players */}
                {importResult.players.length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Imported Players
                      </h4>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {importResult.players.map((player) => (
                          <div key={player.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm font-medium">{player.name}</span>
                            <span className="text-xs text-muted-foreground">Age {player.age}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Errors */}
                {importResult.errors.length > 0 && (
                  <Card className="border-destructive">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        Import Errors
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <p key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                            {error}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end">
                <Button onClick={handleClose} className="bg-primary text-primary-foreground">
                  {importResult.successfulImports > 0 ? "View Imported Players" : "Close"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}