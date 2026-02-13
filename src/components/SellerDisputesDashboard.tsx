import { useState, useEffect } from "react";
import { getMyDisputes } from "@/services/disputes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, MessageSquare, Clock, CheckCircle, XCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function SellerDisputesDashboard() {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDispute, setSelectedDispute] = useState<any>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => {
        loadDisputes();
    }, []);

    const loadDisputes = async () => {
        setLoading(true);
        const { data } = await getMyDisputes();
        // Filter for seller disputes (although getMyDisputes returns both, usually seller only sees theirs)
        setDisputes(data || []);
        setLoading(false);
    };

    const statusMap: any = {
        open: { label: "Aberta", color: "text-red-500 bg-red-500/10 border-red-500/20", icon: AlertTriangle },
        in_review: { label: "Em Análise", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20", icon: Clock },
        resolved_refund: { label: "Reembolsado", color: "text-purple-500 bg-purple-500/10 border-purple-500/20", icon: XCircle }, // Lost dispute
        resolved_release: { label: "Ganho (Liberado)", color: "text-green-500 bg-green-500/10 border-green-500/20", icon: CheckCircle }, // Won dispute
        cancelled: { label: "Cancelada", color: "text-muted-foreground bg-secondary", icon: XCircle },
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold font-display">Disputas e Reclamações</h2>
                    <p className="text-sm text-muted-foreground">Gerencie problemas reportados pelos compradores.</p>
                </div>
            </div>

            {loading ? (
                <div className="py-8 text-center text-muted-foreground">Carregando...</div>
            ) : disputes.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <h3 className="text-lg font-medium">Tudo certo!</h3>
                    <p className="text-muted-foreground">Você não tem disputas ativas ou recentes.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {disputes.map((dispute) => {
                        const styling = statusMap[dispute.status] || statusMap.open;
                        const StatusIcon = styling.icon;
                        return (
                            <div key={dispute.id} className="glass-card rounded-xl p-5 border border-border">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={`gap-1 ${styling.color}`}>
                                                <StatusIcon className="h-3 w-3" /> {styling.label}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(dispute.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-foreground">{dispute.product?.title || "Produto Removido"}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Comprador: <span className="text-foreground">{dispute.opener?.name}</span> • Pedido #{dispute.order_id.substring(0, 8)}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-muted-foreground">Valor em Disputa</p>
                                            <p className="text-lg font-bold text-foreground">R$ {dispute.order?.total_amount?.toFixed(2)}</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedDispute(dispute);
                                                setDetailsOpen(true);
                                            }}
                                        >
                                            Detalhes
                                        </Button>
                                    </div>
                                </div>

                                {dispute.status === 'open' && (
                                    <div className="mt-4 p-3 bg-red-500/5 rounded-lg border border-red-500/10 text-sm">
                                        <span className="font-semibold text-red-500">Motivo: {dispute.reason}</span>
                                        <p className="text-foreground/80 mt-1">{dispute.description}</p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalhes da Disputa</DialogTitle>
                    </DialogHeader>
                    {selectedDispute && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 border rounded-lg">
                                    <p className="text-xs text-muted-foreground">Motivo</p>
                                    <p className="font-medium">{selectedDispute.reason}</p>
                                </div>
                                <div className="p-3 border rounded-lg">
                                    <p className="text-xs text-muted-foreground">Status</p>
                                    <p className="font-medium capitalize">{selectedDispute.status}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium">Descrição do Comprador</p>
                                <div className="p-3 bg-secondary/20 rounded-lg text-sm">
                                    {selectedDispute.description}
                                </div>
                            </div>

                            {selectedDispute.resolution_details && (
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Resolução da Administração</p>
                                    <div className="p-3 bg-primary/10 rounded-lg text-sm border border-primary/20">
                                        {selectedDispute.resolution_details}
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 text-xs text-muted-foreground text-center">
                                Para resolver esta disputa, envie mensagens via chat ou aguarde a mediação do suporte.
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setDetailsOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
