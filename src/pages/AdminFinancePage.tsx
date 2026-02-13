
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getPendingWithdrawals, getAllWithdrawals, approveWithdrawal, rejectWithdrawal, Withdrawal } from "@/services/finance";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AdminFinancePage() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"pending" | "all">("pending");

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        setLoading(true);
        let res;
        if (filter === "pending") {
            res = await getPendingWithdrawals();
        } else {
            res = await getAllWithdrawals();
        }
        setWithdrawals(res.data || []);
        setLoading(false);
    };

    const handleApprove = async (id: string, amount: number, user: string) => {
        if (!confirm(`Confirmar que você REALIZOU o pagamento de R$ ${amount.toFixed(2)} para ${user}?`)) return;

        const { error } = await approveWithdrawal(id);
        if (error) {
            toast({ title: "Erro", description: "Falha ao aprovar saque.", variant: "destructive" });
        } else {
            toast({ title: "Saque Concluído", description: "Solicitação marcada como paga." });
            loadData();
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Motivo da rejeição:");
        if (!reason) return;

        const { error } = await rejectWithdrawal(id, reason);
        if (error) {
            toast({ title: "Erro", description: "Falha ao rejeitar saque.", variant: "destructive" });
        } else {
            toast({ title: "Saque Rejeitado", description: "Solicitação foi rejeitada." });
            loadData();
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex gap-4">
                    <Button
                        variant={filter === "pending" ? "default" : "outline"}
                        onClick={() => setFilter("pending")}
                    >
                        Pendentes
                    </Button>
                    <Button
                        variant={filter === "all" ? "default" : "outline"}
                        onClick={() => setFilter("all")}
                    >
                        Histórico Completo
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Solicitações de Saque</CardTitle>
                        <CardDescription>Gerencie os pagamentos aos vendedores.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : withdrawals.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">Nenhuma solicitação encontrada.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Usuário</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Dados Pix</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawals.map((w) => (
                                        <TableRow key={w.id}>
                                            <TableCell>{new Date(w.created_at).toLocaleDateString()} {new Date(w.created_at).toLocaleTimeString()}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{w.user?.name || "N/A"}</div>
                                                <div className="text-xs text-muted-foreground">{w.user?.email || "N/A"}</div>
                                            </TableCell>
                                            <TableCell className="font-bold text-green-600">R$ {w.amount.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{w.full_name || "Nome não cadastrado"}</span>
                                                    <span className="font-mono text-xs bg-muted p-1 rounded select-all w-fit">{w.pix_key}</span>
                                                    <span className="text-[10px] text-muted-foreground">CPF: {w.cpf || "N/A"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={w.status === 'paid' ? 'default' : w.status === 'rejected' ? 'destructive' : 'secondary'}>
                                                    {w.status === 'paid' ? 'Pago' : w.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {w.status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-500" onClick={() => handleReject(w.id)}>
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(w.id, w.amount, w.user?.name || "")}>
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                                {w.status === 'paid' && <span className="text-xs text-muted-foreground">Pago em {new Date(w.paid_at!).toLocaleDateString()}</span>}
                                                {w.status === 'rejected' && <span className="text-xs text-red-500">{w.admin_note}</span>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
