import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Mail, Phone, Building2, User } from "lucide-react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Mock client data interface (since we might not have a full 'users' collection synced in store yet)
interface ClientUser {
    id: string;
    displayName: string;
    email: string;
    role: string;
    companyId: string;
    phone?: string;
    altContactName?: string;
    altContactEmail?: string;
    altContactPhone?: string;
}

const ClientList = () => {
    // We can use the store if we add 'users' to it, but for now we fetch directly or mock
    // const { users } = useDataStore(); 
    const [clients, setClients] = useState<ClientUser[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingClient, setEditingClient] = useState<ClientUser | null>(null);
    const [editOpen, setEditOpen] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        try {
            // In a real app, use a store subscription or better query
            // For now, fetch 'users' where role is client or client-admin
            const querySnapshot = await getDocs(collection(db, "users"));
            const users: ClientUser[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as any;
                if (data.role === 'client' || data.role === 'client-admin') {
                    users.push({ id: doc.id, ...data } as ClientUser);
                }
            });
            setClients(users);
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClient) return;

        try {
            await updateDoc(doc(db, "users", editingClient.id), {
                phone: editingClient.phone,
                altContactName: editingClient.altContactName,
                altContactEmail: editingClient.altContactEmail,
                altContactPhone: editingClient.altContactPhone
            });
            
            // Update local state
            setClients(prev => prev.map(c => c.id === editingClient.id ? editingClient : c));
            setEditOpen(false);
            setEditingClient(null);
        } catch (error) {
            console.error("Error updating client:", error);
        }
    };

    const filteredClients = clients.filter(c => 
        (c.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.companyId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar por nombre, email o empresa..." 
                        className="pl-8 bg-slate-50 border-slate-200" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
                </Button>
            </div>

            <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Cliente / Empresa</TableHead>
                                <TableHead>Contacto Principal</TableHead>
                                <TableHead>Contacto Alternativo</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                                        Cargando clientes...
                                    </TableCell>
                                </TableRow>
                            ) : filteredClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                                        No se encontraron clientes.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClients.map((client) => (
                                    <TableRow key={client.id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-slate-200">
                                                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                                                        {client.displayName?.charAt(0) || 'C'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium text-slate-800">{client.displayName || 'Sin Nombre'}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Building2 className="h-3 w-3" /> {client.companyId}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm space-y-1">
                                                <div className="flex items-center gap-1.5 text-slate-700">
                                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                    {client.email}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-700">
                                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                    {client.phone || <span className="text-slate-300 italic">Sin teléfono</span>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {client.altContactName ? (
                                                 <div className="text-sm space-y-1">
                                                    <div className="font-medium text-slate-700 flex items-center gap-1">
                                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                                        {client.altContactName}
                                                    </div>
                                                    <div className="text-xs text-slate-500 ml-5">
                                                        {client.altContactEmail}
                                                    </div>
                                                 </div>
                                            ) : (
                                                <span className="text-xs text-slate-300 italic">No configurado</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => {
                                                setEditingClient(client);
                                                setEditOpen(true);
                                            }}>
                                                Editar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Client Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-lg bg-white">
                    <DialogHeader>
                        <DialogTitle>Editar Información de Contacto</DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Actualiza los datos de contacto para {editingClient?.displayName}.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {editingClient && (
                        <form onSubmit={handleSaveClient} className="space-y-4 py-2">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Teléfono Principal (Whatsapp)</Label>
                                    <Input 
                                        value={editingClient.phone || ''}
                                        onChange={e => setEditingClient({...editingClient, phone: e.target.value})}
                                        placeholder="+56 9..."
                                    />
                                </div>
                             </div>
                             
                             <Separator className="my-2" />
                             
                             <h4 className="text-sm font-semibold text-slate-700">Contacto Alternativo (Escalamiento)</h4>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>Nombre Completo</Label>
                                    <Input 
                                        value={editingClient.altContactName || ''}
                                        onChange={e => setEditingClient({...editingClient, altContactName: e.target.value})}
                                        placeholder="Ej: Juan Pérez (Gerente)"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input 
                                        value={editingClient.altContactEmail || ''}
                                        onChange={e => setEditingClient({...editingClient, altContactEmail: e.target.value})}
                                        placeholder="contacto@empresa.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Teléfono</Label>
                                    <Input 
                                        value={editingClient.altContactPhone || ''}
                                        onChange={e => setEditingClient({...editingClient, altContactPhone: e.target.value})}
                                        placeholder="+56 9..."
                                    />
                                </div>
                             </div>

                             <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                                <Button type="submit">Guardar Cambios</Button>
                             </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClientList;
