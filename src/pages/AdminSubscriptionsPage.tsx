import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { getAdminSubscriptions, updateSubscriptionStatus } from "@/services/admin";
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
import { CreditCard, CheckCircle, XCircle } from "lucide-react";

interface Subscription {
    id: string;
    user?: {
        name?: string;
        email?: string;
    };
    plan_type: string;
    amount: number;
    status: 'active' | 'inactive';
    created_at: string;
}

const AdminSubscriptionsPage = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        const { data } = await getAdminSubscriptions();
        setSubscriptions(data || []);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const toggleStatus = async (id: string, current: string) => {
        const newStatus = current === 'active' ? 'inactive' : 'active';
        await updateSubscriptionStatus(id, newStatus);
        toast({ title: "Atualizado", description: `Assinatura ${newStatus}.` });
        load();
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-100">Assinaturas</h1>
                        <p className="mt-1 text-sm text-zinc-400">Gerencie os planos dos usuários</p>
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                                <TableHead className="text-zinc-400">Usuário</TableHead>
                                <TableHead className="text-zinc-400">Plano</TableHead>
                                <TableHead className="text-zinc-400">Valor</TableHead>
                                <TableHead className="text-zinc-400">Status</TableHead>
                                <TableHead className="text-zinc-400">Início</TableHead>
                                <TableHead className="text-zinc-400 text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                                </TableRow>
                            ) : subscriptions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma assinatura encontrada.</TableCell>
                                </TableRow>
                            ) : (
                                subscriptions.map((sub) => (
                                    <TableRow key={sub.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                        <TableCell className="font-medium text-zinc-200">
                                            {sub.user?.name || sub.user?.email || "Unknown"}
                                        </TableCell>
                                        <TableCell className="capitalize text-zinc-400">{sub.plan_type}</TableCell>
                                        <TableCell className="text-zinc-200">R$ {sub.amount?.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={sub.status === 'active' ? 'default' : 'secondary'} className={sub.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
                                                {sub.status === 'active' ? 'Ativa' : 'Inativa'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-zinc-400 text-sm">
                                            {new Date(sub.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleStatus(sub.id, sub.status)}
                                                className={sub.status === 'active' ? 'text-destructive hover:text-destructive' : 'text-green-500 hover:text-green-500'}
                                            >
                                                {sub.status === 'active' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                            </Button>
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

export default AdminSubscriptionsPage;
