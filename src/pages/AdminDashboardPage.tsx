import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import {
    Users,
    ShoppingBag,
    DollarSign,
    AlertTriangle,
    TrendingUp,
    Activity,
    ShieldAlert,
    Search,
    Tag,
    Clock,
    Rocket
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardMetrics } from "@/services/admin";

interface SuspiciousActivity {
    id: string;
    description: string;
    created_at: string;
}

interface DashboardMetrics {
    totalUsers: number;
    totalClients: number;
    totalSellers: number;
    totalSuppliers: number;
    totalActiveAds: number;
    totalPendingAds: number;
    totalSales: number;
    totalSalesAmount: number;
    monthlyRevenue: number;
    suspiciousActivities: SuspiciousActivity[];
}

const AdminDashboardPage = () => {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getDashboardMetrics();
                setMetrics(data);
            } catch (err) {
                console.error("Failed to load admin metrics", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex h-[80vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            </div>
        );
    }

    // Fallback if data failed
    const data = metrics || {
        totalUsers: 0,
        totalClients: 0,
        totalSellers: 0,
        totalSuppliers: 0,
        totalActiveAds: 0,
        totalPendingAds: 0,
        totalSales: 0,
        totalSalesAmount: 0,
        monthlyRevenue: 0,
        suspiciousActivities: []
    };

    const statCards = [
        { label: "Usuários Totais", value: data.totalUsers, icon: Users, color: "text-blue-500", sub: `+${data.totalUsers} novos` },
        { label: "Anúncios Ativos", value: data.totalActiveAds, icon: ShoppingBag, color: "text-emerald-500", sub: `${data.totalActiveAds} publicados` },
        { label: "Pendentes de Revisão", value: data.totalPendingAds, icon: Clock, color: "text-amber-500", sub: `${data.totalPendingAds} aguardando`, link: "/admin/products?status=pending" },
        { label: "Receita Mensal", value: `R$ ${data.monthlyRevenue.toFixed(2)}`, icon: DollarSign, color: "text-purple-500", sub: "Plataforma" },
    ];

    return (
        <div className="min-h-screen bg-background pb-12">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-foreground">Painel Administrativo</h1>
                        <p className="text-sm text-muted-foreground">Visão geral da plataforma e métricas de desempenho</p>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                            <Search className="mr-2 h-4 w-4" /> Relatórios
                        </Button>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                            <Activity className="mr-2 h-4 w-4" /> Logs do Sistema
                        </Button>
                    </div>
                </div>

                {data.totalPendingAds > 0 && (
                    <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-lg shadow-amber-500/5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-amber-500/20 p-2 text-amber-500">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground">Existem {data.totalPendingAds} anúncios aguardando sua revisão</p>
                                <p className="text-xs text-muted-foreground">Novos produtos não são exibidos no marketplace até serem moderados.</p>
                            </div>
                        </div>
                        <Button size="sm" className="bg-amber-500 text-black hover:bg-amber-600 font-bold" asChild>
                            <Link to="/admin/products?status=pending">Revisar Agora</Link>
                        </Button>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((stat, i) => (
                        <Link
                            key={i}
                            to={stat.link || "#"}
                            className={`glass-card rounded-xl p-5 transition-all hover:scale-[1.01] ${stat.link ? "cursor-pointer hover:border-primary/50" : ""}`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                                    <p className="mt-2 font-display text-2xl font-bold text-foreground">{stat.value}</p>
                                </div>
                                <div className={`rounded-lg bg-background/50 p-2.5 ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-1 text-xs">
                                <TrendingUp className="h-3 w-3 text-success" />
                                <span className="font-medium text-success">{stat.sub}</span>
                                <span className="text-muted-foreground">desde o início</span>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="glass-card rounded-xl p-6 lg:col-span-2">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="font-display text-lg font-bold text-foreground">Resumo da Plataforma</h2>
                                <p className="text-xs text-muted-foreground">Dados em tempo real</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="rounded-xl border border-border p-4 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Clientes</p>
                                <p className="text-2xl font-display font-bold text-blue-400">{data.totalClients}</p>
                            </div>
                            <div className="rounded-xl border border-border p-4 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Vendedores</p>
                                <p className="text-2xl font-display font-bold text-emerald-400">{data.totalSellers}</p>
                            </div>
                            <div className="rounded-xl border border-border p-4 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Fornecedores</p>
                                <p className="text-2xl font-display font-bold text-purple-400">{data.totalSuppliers}</p>
                            </div>
                            <div className="rounded-xl border border-border p-4 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Vendas Concluídas</p>
                                <p className="text-2xl font-display font-bold text-primary">{data.totalSales}</p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-xl border border-border p-4">
                            <p className="text-xs text-muted-foreground mb-1">Receita Total de Vendas</p>
                            <p className="text-3xl font-display font-bold text-foreground">
                                R$ {data.totalSalesAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    {/* Quick Actions & Alerts */}
                    <div className="space-y-6">
                        <div className="glass-card rounded-xl p-6">
                            <h2 className="mb-4 font-display text-base font-bold text-foreground">
                                <ShieldAlert className="mr-2 inline h-4 w-4 text-destructive" />
                                Atividades Suspeitas
                            </h2>
                            <div className="space-y-4">
                                {data.suspiciousActivities.length > 0 ? (
                                    data.suspiciousActivities.map((alert) => (
                                        <div key={alert.id} className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{alert.description || "Atividade não identificada"}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(alert.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">Nenhuma atividade suspeita detectada.</p>
                                )}
                            </div>
                            <Button variant="outline" className="mt-4 w-full text-xs" asChild>
                                <Link to="/admin/settings">Ver Configurações de Segurança</Link>
                            </Button>
                        </div>

                        <div className="glass-card rounded-xl p-6">
                            <h2 className="mb-4 font-display text-base font-bold text-foreground">Atalhos</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" className="h-auto flex-col gap-2 p-3 text-xs" asChild>
                                    <Link to="/admin/verifications">
                                        <ShieldAlert className="h-4 w-4 mb-1" /> Verificações
                                    </Link>
                                </Button>
                                <Button variant="outline" className="h-auto flex-col gap-2 p-3 text-xs" asChild>
                                    <Link to="/admin/disputes">
                                        <AlertTriangle className="h-4 w-4 mb-1" /> Disputas
                                    </Link>
                                </Button>
                                <Button variant="outline" className="h-auto flex-col gap-2 p-3 text-xs" asChild>
                                    <Link to="/admin/users">
                                        <Users className="h-4 w-4 mb-1" /> Usuários
                                    </Link>
                                </Button>
                                <Button variant="outline" className="h-auto flex-col gap-2 p-3 text-xs" asChild>
                                    <Link to="/admin/products">
                                        <ShoppingBag className="h-4 w-4 mb-1" /> Produtos
                                    </Link>
                                </Button>
                                <Button variant="outline" className="h-auto flex-col gap-2 p-3 text-xs" asChild>
                                    <Link to="/admin/categories">
                                        <Tag className="h-4 w-4 mb-1" /> Categorias
                                    </Link>
                                </Button>
                                <Button variant="outline" className="h-auto flex-col gap-2 p-3 text-xs" asChild>
                                    <Link to="/admin/activations">
                                        <Rocket className="h-4 w-4 mb-1" /> Ativações
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
