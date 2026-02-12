import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Need to ensure Tabs component exists
import { cn } from '@/lib/utils';
import { analyzeDocument, ExtractedData } from '@/lib/gemini';
import useDataStore from '@/store/useDataStore';
import useAuthStore from '@/store/useAuthStore';
import SignaturePad from './SignaturePad';

interface DocumentUploadProps {
  documentType: string;
  documentLabel: string;
  onUploadComplete: (data: ExtractedData) => void;
  enableSigning?: boolean; // New prop
  templatePreviewUrl?: string; // New prop for preview
}

const DocumentUpload = ({ documentType: _documentType, documentLabel, onUploadComplete, enableSigning = false, templatePreviewUrl }: DocumentUploadProps) => {
  const { addToVault } = useDataStore();
  const { user } = useAuthStore();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Signing State
  const [activeTab, setActiveTab] = useState<'upload' | 'sign'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (activeTab === 'upload' && e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
    }
  };

  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsAnalyzing(true);
    setError(null);
    setProgress(10);

    // Simulate upload progress
    const interval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 90) {
                clearInterval(interval);
                return 90;
            }
            return prev + 10;
        });
    }, 200);

    try {
        const data = await analyzeDocument(uploadedFile);
        
        clearInterval(interval);
        setProgress(100);
        
        // Basic validation logic
        if (data.confidence < 0.7) {
             setError("No pudimos validar el documento con suficiente confianza. Por favor intenta con una imagen más clara.");
             setResult(null);
        } else {
             setResult(data);
             
             // Add to Global Store / Vault
             if (user) {
                addToVault({
                    id: `doc-${Date.now()}`,
                    clientId: user.uid,
                    name: data.name,
                    type: data.documentType,
                    status: 'validated',
                    isVaultEligible: true,
                    validUntil: data.validUntil || undefined,
                    url: URL.createObjectURL(uploadedFile) // temporary
                });
             }

             onUploadComplete(data);
        }
    } catch (err) {
        setError("Ocurrió un error al analizar el documento.");
        console.error(err);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSignatureSave = async (signatureDataUrl: string) => {
      // simulate converting signature to a document
      setIsAnalyzing(true);
      setProgress(50);
      
      // Create a mock file from signature (in real app, generate PDF)
      const res = await fetch(signatureDataUrl);
      const blob = await res.blob();
      const signedFile = new File([blob], `${documentLabel}_firmado.png`, { type: 'image/png' });
      
      processFile(signedFile);
  };

  const resetUpload = () => {
      setFile(null);
      setResult(null);
      setError(null);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className={cn(
        "p-6 border-dashed border-2 transition-all duration-300 relative overflow-hidden",
        isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300",
        result ? "bg-green-50 border-green-200 border-solid" : "bg-white"
    )}>
        {enableSigning ? (
            <Tabs defaultValue="upload" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="upload">Subir Archivo</TabsTrigger>
                    <TabsTrigger value="sign">Firmar Digitalmente</TabsTrigger>
                </TabsList>

                <TabsContent value="upload">
                    {renderUploadContent()}
                </TabsContent>

                <TabsContent value="sign">
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                            <div className="flex justify-center mb-2">
                                <FileText className="h-10 w-10 text-slate-400" />
                            </div>
                            <h4 className="font-semibold text-slate-700">Vista Previa del Documento</h4>
                            <p className="text-xs text-slate-500 mb-4">Revisa el contenido antes de firmar.</p>
                            
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(templatePreviewUrl || '#', '_blank')}>
                                <Eye className="h-4 w-4" /> Ver Plantilla Completa
                            </Button>
                        </div>

                        <div className="text-sm font-medium text-slate-700 mb-2">Tu Firma:</div>
                        <SignaturePad 
                            onSave={handleSignatureSave}
                            onCancel={() => setActiveTab('upload')}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        ) : (
            renderUploadContent()
        )}
    </Card>
  );

  function renderUploadContent() {
      return (
        <>
            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png,.svg" // Added .svg
                onChange={handleFileSelect}
            />

            {!file ? (
                <div 
                    className="flex flex-col items-center justify-center h-40 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="p-3 bg-blue-100 rounded-full mb-3 text-blue-600">
                        <Upload className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-slate-700">Subir {documentLabel}</h3>
                    <p className="text-xs text-slate-500 mt-1">Arrastra o haz clic para seleccionar (PDF, JPG, PNG, SVG)</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-slate-100 rounded text-slate-600">
                                <FileText className="h-5 w-5" />
                             </div>
                             <div className="text-sm">
                                 <p className="font-medium text-slate-700 truncate max-w-[200px]">{file.name}</p>
                                 <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                             </div>
                        </div>
                        {!result && !isAnalyzing && (
                            <Button variant="ghost" size="icon" onClick={resetUpload} className="text-slate-400 hover:text-red-500">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {isAnalyzing && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-blue-600 font-medium">
                                <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Analizando con Gemini AI...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-1" />
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex gap-2 items-start">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <p>{error}</p>
                             <Button variant="link" size="sm" onClick={resetUpload} className="h-auto p-0 text-red-700 underline">Reintentar</Button>
                        </div>
                    )}

                    {result && (
                        <div className="bg-green-100/50 border border-green-200 p-3 rounded-lg text-sm animate-fade-in">
                            <div className="flex gap-2 items-center text-green-700 font-semibold mb-1">
                                <CheckCircle className="h-4 w-4" />
                                Documento Validado
                            </div>
                            <div className="text-xs text-green-800 space-y-1 ml-6">
                                <p>Tipo Detectado: <span className="font-medium">{result.documentType}</span></p>
                                <p>Nombre: <span className="font-medium">{result.name}</span></p>
                                {result.validUntil && <p>Vence: <span className="font-medium">{new Date(result.validUntil).toLocaleDateString()}</span></p>}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
      );
  }
};

export default DocumentUpload;
