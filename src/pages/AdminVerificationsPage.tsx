import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { getAdminVerifications, resolveVerification } from "@/services/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { FileText, CheckCircle, XCircle } from "lucide-react";

interface VerificationRequest {
    id: string;
    document_type: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    user?: {
        name?: string;
        email?: string;
    };
}

const AdminVerificationsPage = () => {
    const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        const { data } = await getAdminVerifications();
        setVerifications(data || []);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleResolve = async (id: string, status: "approved" | "rejected") => {
        try {
            await resolveVerification(id, status, "Revisado por Admin");
            toast({ title: "Atualizado", description: `Verificação ${status === 'approved' ? 'aprovada' : 'rejeitada'}.` });
            load();
        } catch (e) {
            toast({ title: "Erro", description: "Falha ao resolver.", variant: "destructive" });
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-100">Verificações de Identidade</h1>
                        <p className="mt-1 text-sm text-zinc-400">Analise documentos para selo de Vendedor Verificado</p>
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                                <TableHead className="text-zinc-400">Usuário</TableHead>
                                <TableHead className="text-zinc-400">Tipo Documento</TableHead>
                                <TableHead className="text-zinc-400">Arquivo</TableHead>
                                <TableHead className="text-zinc-400">Status</TableHead>
                                <TableHead className="text-zinc-400">Solicitado</TableHead>
                                <TableHead className="text-zinc-400 text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                                </TableRow>
                            ) : verifications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma solicitação pendente.</TableCell>
                                </TableRow>
                            ) : (
                                verifications.map((ver) => (
                                    <TableRow key={ver.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                        <TableCell className="font-medium text-zinc-200">
                                            {ver.user?.name || ver.user?.email || "Unknown"}
                                        </TableCell>
                                        <TableCell className="capitalize text-zinc-400">{ver.document_type || "CPF/RG"}</TableCell>
                                        <TableCell className="text-zinc-200">
                                            <Button variant="link" size="sm" className="h-auto p-0 text-blue-400">
                                                <FileText className="mr-1 h-3 w-3" /> Ver Documento
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={ver.status === 'approved' ? 'default' : ver.status === 'rejected' ? 'destructive' : 'secondary'}>
                                                {ver.status === 'approved' ? 'Aprovado' : ver.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-zinc-400 text-sm">
                                            {new Date(ver.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right flex justify-end gap-1">
                                            {ver.status === 'pending' && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleResolve(ver.id, "approved")}
                                                        className="text-green-500 hover:text-green-500 hover:bg-green-500/10"
                                                        title="Aprovar"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleResolve(ver.id, "rejected")}
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        title="Rejeitar"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminVerificationsPage;
