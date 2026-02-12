import { useEffect, useState } from 'react';
import useDataStore, { OT, Document } from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Clock, AlertCircle, Eye, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';

interface OTDetailsModalProps {
  ot: OT | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OTDetailsModal = ({ ot, open, onOpenChange }: OTDetailsModalProps) => {
  const { documents, logs, subscribeToOTLogs, updateDocumentStatus } = useDataStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'docs' | 'bitacora'>('docs');
  
  // Rejection Dialog State
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
      if (open && ot) {
          const unsubscribe = subscribeToOTLogs(ot.id);
          return () => unsubscribe();
      }
  }, [open, ot, subscribeToOTLogs]);

  if (!ot) return null;

  const handleApprove = async (doc: Document) => {
      if (confirm(`¿Aprobar documento: ${doc.name}?`)) {
          await updateDocumentStatus(doc.id, 'validated');
      }
  };

  const openRejectDialog = (doc: Document) => {
      setSelectedDocId(doc.id);
      setRejectionReason("");
      setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
      if (selectedDocId && rejectionReason.trim()) {
          await updateDocumentStatus(selectedDocId, 'rejected', rejectionReason);
          setRejectDialogOpen(false);
          setSelectedDocId(null);
      }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'uploaded': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Filter docs for this OT (or vault docs if eligible/linked)
  // Logic: Docs with otId == ot.id OR (clientId == ot.clientId AND isVaultEligible)
  // For simplicity in this view, let's show docs explicitly linked to this OT first.
  const relevantDocs = documents.filter(d => d.otId === ot.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 glass-card border-none text-slate-800 overflow-hidden bg-white">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-start shrink-0">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {ot.id}
                    </Badge>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        {ot.serviceType}
                    </span>
                </div>
                <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                    {ot.title}
                </DialogTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-400" />
                        Creado: {format(new Date(ot.createdAt), "d MMM, yyyy", { locale: es })}
                    </span>
                    <span className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        Vence: {format(new Date(ot.deadline), "d MMM, yyyy", { locale: es })}
                    </span>
                </div>
            </div>
            
            {/* Tabs Toggle */}
            <div className="bg-slate-100/80 p-1 rounded-lg flex text-sm font-medium">
                <button 
                    onClick={() => setActiveTab('docs')}
                    className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'docs' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Documentos
                </button>
                <button 
                    onClick={() => setActiveTab('bitacora')}
                    className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'bitacora' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Bitácora
                </button>
            </div>
        </div>

        <div className="flex-1 w-full overflow-hidden flex flex-col bg-slate-50/50 relative">
            {activeTab === 'docs' ? (
                <ScrollArea className="flex-1 h-full">
                    <div className="p-6 space-y-4">
                        {relevantDocs.length === 0 ? (
                             <div className="text-center py-10 text-slate-400">No hay documentos para esta solicitud.</div>
                        ) : (
                            relevantDocs.map((doc) => (
                                <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-3 rounded-lg border", getStatusColor(doc.status))}>
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800">{doc.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className={cn("border-0 px-2 py-0.5 text-[10px] uppercase font-bold", getStatusColor(doc.status))}>
                                                    {doc.status}
                                                </Badge>
                                                <span className="text-xs text-slate-400">
                                                    {doc.type}
                                                </span>
                                            </div>
                                            {doc.status === 'rejected' && (doc as any).rejectionReason && (
                                                <p className="text-xs text-red-500 mt-1 font-medium bg-red-50 p-1 rounded px-2 inline-block">
                                                    Motivo: {(doc as any).rejectionReason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {/* Download / View */}
                                        {doc.url && (
                                            <Button size="sm" variant="outline" className="gap-2 text-slate-600 h-8" onClick={() => window.open(doc.url, '_blank')}>
                                                <Eye className="h-3.5 w-3.5" /> Ver / Descargar
                                            </Button>
                                        )}
                                        
                                        {/* Replace Action (Client & Admin) */}
                                        <div className="relative">
                                            <input 
                                                type="file" 
                                                id={`replace-${doc.id}`} 
                                                className="hidden" 
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const { replaceDocument } = useDataStore.getState();
                                                        replaceDocument(doc.id, file);
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`replace-${doc.id}`}>
                                                <Button size="sm" variant="outline" className="gap-2 text-blue-600 h-8 border-blue-200 hover:bg-blue-50 cursor-pointer" asChild>
                                                    <span>Reemplazar</span>
                                                </Button>
                                            </label>
                                        </div>

                                        {/* Admin Actions */}
                                        {user?.role === 'spi-admin' && (
                                            <>
                                                <Separator orientation="vertical" className="h-6 mx-1" />
                                                <Button 
                                                    size="sm" variant="ghost" 
                                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => handleApprove(doc)}
                                                    title="Aprobar Documento"
                                                >
                                                    <CheckCircle className="h-5 w-5" />
                                                </Button>
                                                <Button 
                                                    size="sm" variant="ghost" 
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => openRejectDialog(doc)}
                                                    title="Rechazar Documento"
                                                >
                                                    <XCircle className="h-5 w-5" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            ) : (
                <ScrollArea className="flex-1 h-full">
                    <div className="p-6 space-y-6">
                        {/* Bitácora Feed */}
                        {logs && logs.length > 0 ? logs.map((log) => (
                            <div key={log.id} className={`flex gap-4 ${log.type === 'system' ? 'opacity-80' : ''}`}>
                               <Avatar className="h-8 w-8 mt-1 border border-slate-200">
                                   <AvatarFallback className={log.type === 'system' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}>
                                       {log.userName ? log.userName.substring(0,2).toUpperCase() : (log.type === 'system' ? 'SYS' : 'USR')}
                                   </AvatarFallback>
                               </Avatar>
                               <div className="flex-1">
                                   <div className="flex items-baseline justify-between">
                                       <span className="text-sm font-semibold text-slate-700">
                                            {log.userName || (log.userName === 'system' || log.userId === 'admin' ? 'Sistema / Admin' : log.userId)}
                                       </span>
                                       <span className="text-xs text-slate-400">{format(new Date(log.timestamp), "d MMM HH:mm", { locale: es })}</span>
                                   </div>
                                   <div className={cn(
                                       "mt-1 text-sm p-3 rounded-lg border",
                                       log.type === 'system' 
                                       ? "bg-slate-50 text-slate-600 italic border-slate-100" 
                                       : "bg-white border-slate-200 shadow-sm text-slate-800"
                                   )}>
                                       {log.action}
                                   </div>
                               </div>
                            </div>
                        )) : (
                            <p className="text-center text-slate-400 py-10">No hay actividad registrada aún.</p>
                        )}
                    </div>
                </ScrollArea>
            )}
        </div>
      </DialogContent>

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="max-w-md bg-white">
              <DialogHeader>
                  <DialogTitle>Rechazar Documento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="reason">Motivo del rechazo</Label>
                      <Textarea 
                          id="reason" 
                          placeholder="Ej: Documento borroso, firma no coincide..." 
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                      />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
                  <Button variant="destructive" onClick={confirmReject} disabled={!rejectionReason.trim()}>
                      Confirmar Rechazo
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default OTDetailsModal;
