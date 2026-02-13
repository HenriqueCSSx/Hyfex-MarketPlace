import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { getAllDisputes, resolveDispute } from "@/services/disputes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, DollarSign, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";

interface Dispute {
    id: string;
    order?: { total_amount: number };
    product?: { title: string };
    buyer?: { name: string };
    seller?: { name: string };
    status: string;
    reason: string;
    created_at: string;
}

const AdminDisputesPage = () => {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [adminMessage, setAdminMessage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllDisputes().then(res => {
            setDisputes(res.data || []);
            setLoading(false);
        });
    }, []);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            open: "bg-red-500/10 text-red-500 border-red-500/20",
            in_review: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
            resolved_refund: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            resolved_release: "bg-green-500/10 text-green-500 border-green-500/20",
        };
        const labels: Record<string, string> = {
            open: "Aberta",
            in_review: "Em Análise",
            resolved_refund: "Resolvida - Reembolso",
            resolved_release: "Resolvida - Liberado",
        };
        return (
            <Badge variant="outline" className={variants[status] || ""}>
                {labels[status] || status}
            </Badge>
        );
    };

    const handleResolve = async (resolution: "refund" | "release") => {
        if (!selectedDispute) return;
        try {
            await resolveDispute(selectedDispute.id, resolution, adminMessage);
            toast({ title: "Sucesso", description: "Disputa resolvida." });
            setShowDetailsModal(false);
            const { data } = await getAllDisputes();
            setDisputes(data || []);
        } catch (e) {
            toast({ title: "Erro", description: "Erro ao resolver disputa.", variant: "destructive" });
        }
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-100">Gestão de Disputas</h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        Resolva disputas entre compradores e vendedores
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                    <Card className="border-zinc-800 bg-zinc-950 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-400">Disputas Abertas</p>
                                <p className="mt-1 text-2xl font-bold text-zinc-100">
                                    {disputes.filter((d) => d.status === "open").length}
                                </p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                    </Card>
                    <Card className="border-zinc-800 bg-zinc-950 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-400">Em Análise</p>
                                <p className="mt-1 text-2xl font-bold text-zinc-100">
                                    {disputes.filter((d) => d.status === "in_review").length}
                                </p>
                            </div>
                            <RefreshCw className="h-8 w-8 text-yellow-500" />
                        </div>
                    </Card>
                    <Card className="border-zinc-800 bg-zinc-950 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-400">Resolvidas</p>
                                <p className="mt-1 text-2xl font-bold text-zinc-100">
                                    {disputes.filter((d) => d.status?.startsWith("resolved")).length}
                                </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-500" />
                        </div>
                    </Card>
                    <Card className="border-zinc-800 bg-zinc-950 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-400">Valor em Disputa</p>
                                <p className="mt-1 text-2xl font-bold text-zinc-100">
                                    R$ {disputes.reduce((acc, d) => acc + (d.order?.total_amount || 0), 0).toFixed(2)}
                                </p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-orange-500" />
                        </div>
                    </Card>
                </div>

                <Card className="border-zinc-800 bg-zinc-950">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                                <TableHead className="text-zinc-400">ID</TableHead>
                                <TableHead className="text-zinc-400">Produto</TableHead>
                                <TableHead className="text-zinc-400">Comprador</TableHead>
                                <TableHead className="text-zinc-400">Vendedor</TableHead>
                                <TableHead className="text-zinc-400">Status</TableHead>
                                <TableHead className="text-zinc-400">Data</TableHead>
                                <TableHead className="text-zinc-400">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                                </TableRow>
                            ) : disputes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma disputa encontrada.</TableCell>
                                </TableRow>
                            ) : (
                                disputes.map((dispute) => (
                                    <TableRow key={dispute.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                        <TableCell className="font-mono text-zinc-400">#{dispute.id.substring(0, 8)}</TableCell>
                                        <TableCell className="text-zinc-100">{dispute.product?.title || "Produto Removido"}</TableCell>
                                        <TableCell className="text-zinc-400">{dispute.buyer?.name || "Unknown"}</TableCell>
                                        <TableCell className="text-zinc-400">{dispute.seller?.name || "Unknown"}</TableCell>
                                        <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                                        <TableCell className="text-zinc-400">
                                            {new Date(dispute.created_at).toLocaleDateString("pt-BR")}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                                                onClick={() => {
                                                    setSelectedDispute(dispute);
                                                    setShowDetailsModal(true);
                                                }}
                                            >
                                                Analisar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>

                <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                    <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-[700px]">
                        <DialogHeader>
                            <DialogTitle>Detalhes da Disputa</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                Analise o caso e tome uma decisão
                            </DialogDescription>
                        </DialogHeader>
                        {selectedDispute && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                                    <div>
                                        <p className="text-sm text-zinc-500">Produto</p>
                                        <p className="font-medium">{selectedDispute.product?.title}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-500">Valor</p>
                                        <p className="font-medium">R$ {selectedDispute.order?.total_amount || "0.00"}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-zinc-500">Motivo</p>
                                        <p className="font-medium">{selectedDispute.reason}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-2 text-sm font-medium text-zinc-400">Mensagem Administrativa</p>
                                    <Textarea
                                        placeholder="Digite uma mensagem para as partes..."
                                        value={adminMessage}
                                        onChange={(e) => setAdminMessage(e.target.value)}
                                        className="border-zinc-800 bg-zinc-900 text-zinc-100"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        )}
                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowDetailsModal(false)}
                                className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleResolve("refund")}
                                className="border-blue-500/20 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                            >
                                Reembolsar Comprador
                            </Button>
                            <Button
                                onClick={() => handleResolve("release")}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Liberar para Vendedor
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
};

export default AdminDisputesPage;
