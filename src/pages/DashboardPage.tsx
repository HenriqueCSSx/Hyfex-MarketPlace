import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Eye, ShoppingCart, TrendingUp, Star, Package, History, DollarSign, CreditCard, Banknote, Trash2, Edit, Plus, ShieldCheck, ChevronRight, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getSellerProducts, deleteProduct } from "@/services/products";
import { getMySales } from "@/services/orders";
import { getBalance, getMyWithdrawals, requestWithdrawal, getFinancialDetails, saveFinancialDetails, FinancialDetails, Withdrawal } from "@/services/finance";
import { Product } from "@/types/product";
import { useToast } from "@/hooks/use-toast";
import { SellerQuestionsDashboard } from "@/components/SellerQuestionsDashboard";
import { SellerDisputesDashboard } from "@/components/SellerDisputesDashboard";
import { SellerWelcomeNotice } from "@/components/SellerWelcomeNotice";
import { SellerActivationBanner } from "@/components/SellerActivationBanner";
import { SellerApprovedModal } from "@/components/SellerApprovedModal";
import { supabase } from "@/lib/supabase";

const DashboardPage = () => {
  const { user, isAuthenticated, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Finance State
  const [balance, setBalance] = useState({ total: 0, available: 0, pending: 0 });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [financialDetails, setFinancialDetails] = useState<FinancialDetails | null>(null);

  // Finance Forms
  const [pixKey, setPixKey] = useState("");
  const [cpf, setCpf] = useState("");
  const [fullName, setFullName] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isRequestingWithdrawal, setIsRequestingWithdrawal] = useState(false);

  // Activation & Modals State
  const [isActivated, setIsActivated] = useState(true); // Default to true to avoid flicker
  const [showWelcome, setShowWelcome] = useState(false);
  const [activationRequested, setActivationRequested] = useState(false);
  const [showActivatedModal, setShowActivatedModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user) return;
    setIsLoadingData(true);

    try {
      const [prodRes, salesRes] = await Promise.all([
        getSellerProducts(user.id),
        getMySales()
      ]);

      setProducts(prodRes.data || []);
      setSales(salesRes.data || []);

      const activated = user.status === 'active';
      setIsActivated(activated);
      setActivationRequested(!!user.activationRequested);

      // Show welcome if not activated and not seen yet
      const welcomeSeen = localStorage.getItem(`welcome_seen_${user.id}`);
      if (!activated && !welcomeSeen) {
        setShowWelcome(true);
        localStorage.setItem(`welcome_seen_${user.id}`, "true");
      }

      // If activated, check if we need to show the approved modal
      if (activated) {
        const approvedSeen = localStorage.getItem(`activation_approved_seen_${user.id}`);
        if (!approvedSeen) {
          setShowActivatedModal(true);
        }
      }

      await loadFinanceData();

    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadFinanceData = async () => {
    if (!user) return;
    try {
      const [balRes, widthRes, finRes] = await Promise.all([
        getBalance(user.id),
        getMyWithdrawals(),
        getFinancialDetails(user.id)
      ]) as any;

      if (balRes.data) setBalance(balRes.data);
      if (widthRes.data) setWithdrawals(widthRes.data);
      if (finRes.data) {
        setFinancialDetails(finRes.data);
        setPixKey(finRes.data.pix_key);
        setCpf(finRes.data.cpf);
        setFullName(finRes.data.full_name || "");
      }
    } catch (error) {
      console.error("Error loading finance data", error);
    }
  }

  // Real-time listener for profile activation status
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile_updates:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          const newProfile = payload.new as any;

          // Check if status changed to active
          if (newProfile.status === "active" && !isActivated) {
            setIsActivated(true);
            setActivationRequested(false);

            // Refresh global user context
            await refreshProfile();

            // Show modal immediately on realtime activation
            setShowActivatedModal(true);

            toast({
              title: "🎉 Conta Ativada com Sucesso!",
              description: "Todos os recursos foram liberados. Boas vendas!",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isActivated, refreshProfile, toast]);

  const handleSaveFinancials = async () => {
    if (!pixKey || !cpf || !fullName) {
      toast({ title: "Erro", description: "Preencha todos os campos, incluindo o nome completo.", variant: "destructive" });
      return;
    }
    setIsSavingDetails(true);
    const { error } = await saveFinancialDetails({
      user_id: user!.id,
      pix_key: pixKey,
      cpf,
      full_name: fullName,
      pix_key_type: "cpf"
    });
    setIsSavingDetails(false);

    if (error) {
      toast({ title: "Erro", description: "Falha ao salvar dados.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Dados financeiros atualizados." });
      loadFinanceData();
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Erro", description: "Valor inválido.", variant: "destructive" });
      return;
    }
    if (amount > balance.available) {
      toast({ title: "Erro", description: "Saldo insuficiente.", variant: "destructive" });
      return;
    }

    setIsRequestingWithdrawal(true);
    const { error } = await requestWithdrawal(amount);
    setIsRequestingWithdrawal(false);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível solicitar o saque. Verifique se seus dados financeiros estão salvos.", variant: "destructive" });
    } else {
      toast({ title: "Solicitação Enviada", description: "Sua solicitação de saque foi enviada para análise." });
      setWithdrawAmount("");
      loadFinanceData();
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita.")) return;

    const { error } = await deleteProduct(productId);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível excluir o anúncio.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Anúncio excluído." });
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const handleCloseActivatedModal = () => {
    if (user) {
      localStorage.setItem(`activation_approved_seen_${user.id}`, "true");
    }
    setShowActivatedModal(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth" />;

  const isSupplier = user?.activeRole === "fornecedor";

  // Calculate stats
  const totalViews = products.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalSalesCount = sales.length;
  const conversionRate = totalViews > 0 ? ((totalSalesCount / totalViews) * 100).toFixed(1) : "0.0";
  const recentSales = sales.slice(0, 5);

  const stats = [
    { label: "Visualizações", value: totalViews.toLocaleString(), icon: Eye, change: "Total" },
    { label: "Vendas", value: totalSalesCount.toString(), icon: ShoppingCart, change: "Total" },
    { label: "Conversão", value: `${conversionRate}%`, icon: TrendingUp, change: "Média" },
    { label: "Reputação", value: user?.reputation?.toFixed(1) || "5.0", icon: Star, change: "Atual" },
  ];

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />

      {/* Modals */}
      <SellerApprovedModal
        isOpen={showActivatedModal}
        onClose={handleCloseActivatedModal}
        userName={user?.name || "Vendedor"}
      />

      <div className="container mx-auto px-4 py-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black font-display text-white tracking-tighter uppercase">
              DASHBOARD <span className="text-gradient">{isSupplier ? "FORNECEDOR" : "VENDEDOR"}</span>
            </h1>
            <p className="text-zinc-500 text-sm font-medium">Controle seus ativos, vendas e finanças em um só lugar.</p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
            <div className={`h-2 w-2 rounded-full ${isActivated ? "bg-green-500 animate-pulse" : "bg-yellow-500 animate-pulse"}`} />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              {isActivated ? "Conta Ativa" : "Aguardando Ativação"}
            </span>
          </div>
        </div>

        {!isActivated && (
          <SellerActivationBanner
            activationRequested={activationRequested}
            onActivationRequested={() => setActivationRequested(true)}
            onActivationSuccess={async () => {
              setIsActivated(true);
              setActivationRequested(false);
              await refreshProfile();
              setShowActivatedModal(true);
              toast({
                title: "🎉 Conta Ativada com Sucesso!",
                description: "Todos os recursos foram liberados. Boas vendas!",
              });
            }}
          />
        )}

        <Tabs defaultValue="overview" className="space-y-10">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-14">
            <TabsTrigger value="overview" className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] transition-all">Visão Geral</TabsTrigger>
            <TabsTrigger value="questions" className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] transition-all">Perguntas</TabsTrigger>
            <TabsTrigger value="disputes" className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] transition-all">Disputas</TabsTrigger>
            <TabsTrigger value="finance" className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] transition-all">Financeiro</TabsTrigger>
          </TabsList>

          {/* DISPUTES TAB */}
          <TabsContent value="disputes">
            <div className="glass-card rounded-[2rem] border-white/10 p-8">
              <SellerDisputesDashboard />
            </div>
          </TabsContent>

          {/* QUESTIONS TAB */}
          <TabsContent value="questions">
            <div className="glass-card rounded-[2rem] border-white/10 p-8">
              <SellerQuestionsDashboard />
            </div>
          </TabsContent>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-8">
            {/* Stats */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="glass-card rounded-2xl border-white/10 p-6 group hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{stat.label}</span>
                    <stat.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="font-display text-4xl font-black text-white tracking-tighter mb-1">{stat.value}</div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
              {/* Ads Management */}
              <div className="lg:col-span-8">
                <div className="glass-card rounded-[2rem] border-white/10 p-8 h-full">
                  <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Seus Anúncios</h2>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{products.length} ativos no mercado</p>
                      </div>
                    </div>
                    <Button className="h-12 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-[10px] px-8 rounded-xl transition-all shadow-xl active:scale-95" asChild>
                      <Link to="/create-ad">
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Anúncio
                      </Link>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {isLoadingData ? (
                      <div className="py-20 text-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
                        <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Sincronizando ativos...</p>
                      </div>
                    ) : products.length > 0 ? (
                      products.map((ad) => (
                        <div key={ad.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                          <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-xl overflow-hidden border border-white/10">
                              <img src={ad.image_url} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-primary transition-colors">{ad.title}</h3>
                              <div className="mt-1 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1.5 text-zinc-500">
                                  <Eye className="h-3 w-3" /> {ad.views || 0}
                                </span>
                                <span className="flex items-center gap-1.5 text-zinc-500">
                                  <ShoppingCart className="h-3 w-3" /> {ad.sales || 0}
                                </span>
                                <span className="text-primary">R$ {ad.price?.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge className={`bg-transparent border ${ad.status === "approved" ? "border-green-500/50 text-green-500" : ad.status === "pending" ? "border-yellow-500/50 text-yellow-500" : "border-red-500/50 text-red-500"} text-[8px] font-black uppercase tracking-widest px-3 py-1`}>
                              {ad.status === "approved" ? "Ativo" : ad.status === "pending" ? "Análise" : "Inativo"}
                            </Badge>

                            <div className="h-8 w-[1px] bg-white/5" />

                            <div className="flex items-center">
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:text-white" onClick={() => navigate(`/edit-ad/${ad.id}`)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:text-red-500" onClick={() => handleDeleteProduct(ad.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:text-primary" asChild>
                                <Link to={`/product/${ad.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center rounded-[2rem] border border-dashed border-white/5">
                        <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-4">Você ainda não tem anúncios ativos</p>
                        <Button variant="outline" className="border-white/10 bg-white/5 text-zinc-400 font-bold uppercase tracking-widest text-[10px]" asChild>
                          <Link to="/create-ad">Criar meu primeiro anúncio</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar: Recent Sales */}
              <div className="lg:col-span-4 space-y-8">
                <div className="glass-card rounded-[2rem] border-white/10 p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-orange-600/10 flex items-center justify-center border border-orange-600/20">
                      <History className="h-5 w-5 text-orange-600" />
                    </div>
                    <h2 className="text-lg font-black text-white tracking-tight">Vendas Recentes</h2>
                  </div>

                  <div className="space-y-5">
                    {isLoadingData ? (
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center">Carregando histórico...</p>
                    ) : recentSales.length > 0 ? (
                      recentSales.map((sale: any, i) => (
                        <div key={i} className="group relative">
                          <div className="flex items-center justify-between pb-4 border-b border-white/5">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-white tracking-tight truncate group-hover:text-primary transition-colors">{sale.product?.title || "Produto"}</p>
                              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">{new Date(sale.created_at).toLocaleDateString()}</p>
                            </div>
                            <span className="text-sm font-black text-primary ml-4">R$ {sale.total_amount?.toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center">
                        <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Nenhuma venda registrada</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* FINANCE TAB */}
          <TabsContent value="finance" className="space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Balances */}
              <div className="glass-card rounded-[2rem] border-white/10 p-8 bg-gradient-to-br from-green-500/10 via-transparent to-transparent">
                <div className="mb-6 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30">
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Saldo Disponível</span>
                </div>
                <div className="text-4xl font-black text-white tracking-tighter mb-2">R$ {balance.available.toFixed(2)}</div>
                <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Liberado para saque</p>
              </div>

              <div className="glass-card rounded-[2rem] border-white/10 p-8 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent">
                <div className="mb-6 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                    <History className="h-4 w-4 text-yellow-500" />
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">A Liberar</span>
                </div>
                <div className="text-4xl font-black text-white tracking-tighter mb-2">R$ {balance.pending.toFixed(2)}</div>
                <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Aguardando processamento</p>
              </div>

              <div className="glass-card rounded-[2rem] border-white/10 p-8 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
                <div className="mb-6 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Saldo Total</span>
                </div>
                <div className="text-4xl font-black text-white tracking-tighter mb-2">R$ {balance.total.toFixed(2)}</div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Patrimônio acumulado</p>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Withdrawal Request */}
              <div className="glass-card rounded-[2rem] border-white/10 p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-black text-white tracking-tight">Solicitar Saque</h2>
                </div>

                {!financialDetails ? (
                  <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-widest leading-relaxed">
                      AÇÃO NECESSÁRIA: Você precisa cadastrar seus dados bancários ao lado antes de realizar qualquer resgate.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Valor do Saque (R$)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                        <Input
                          type="number"
                          placeholder="0,00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="h-14 pl-12 bg-white/5 border-white/10 rounded-xl text-xl font-black tracking-tight"
                        />
                      </div>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Máximo disponível: R$ {balance.available.toFixed(2)}</p>
                    </div>
                    <Button
                      className="h-14 w-full bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-xl glow-white-sm"
                      onClick={handleWithdraw}
                      disabled={isRequestingWithdrawal || parseFloat(withdrawAmount) > balance.available || parseFloat(withdrawAmount) <= 0}
                    >
                      {isRequestingWithdrawal ? "Processando..." : "Confirmar Solicitação de Saque"}
                    </Button>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-center leading-relaxed">
                      Os saques são processados em até 24h úteis para a chave Pix cadastrada.
                    </p>
                  </div>
                )}
              </div>

              {/* Financial Details */}
              <div className="glass-card rounded-[2rem] border-white/10 p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-black text-white tracking-tight">Dados Bancários</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Chave Pix</Label>
                    <Input
                      placeholder="Email, CPF ou Telefone"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="h-12 bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Nome Completo do Titular</Label>
                    <Input
                      placeholder="Nome completo igual ao banco"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-12 bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">CPF do Titular</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      className="h-12 bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>
                  <Button className="h-12 w-full border-white/10 bg-white/5 text-zinc-300 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10" variant="outline" onClick={handleSaveFinancials} disabled={isSavingDetails}>
                    {isSavingDetails ? "Salvando..." : "Atualizar Dados Financeiros"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Withdrawal History */}
            <div className="glass-card rounded-[2rem] border-white/10 p-8">
              <h2 className="text-xl font-black text-white tracking-tight mb-8">Histórico de Movimentações</h2>
              {withdrawals.length > 0 ? (
                <div className="space-y-4">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${w.status === 'paid' ? 'bg-green-500/10 border-green-500/20 text-green-500' : w.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                          <Banknote className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white tracking-tight">Solicitação de Saque</p>
                          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{new Date(w.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-base font-black text-white tracking-tight">R$ {w.amount.toFixed(2)}</p>
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Via Pix</p>
                        </div>
                        <Badge className={`bg-transparent border ${w.status === 'paid' ? 'border-green-500/50 text-green-500' : w.status === 'rejected' ? 'border-red-500/50 text-red-500' : 'border-primary/50 text-primary'} text-[8px] font-black uppercase tracking-widest px-3 py-1`}>
                          {w.status === 'paid' ? 'Efetivado' : w.status === 'rejected' ? 'Rejeitado' : 'Em Análise'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center rounded-[2rem] border border-dashed border-white/5">
                  <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Nenhuma movimentação financeira registrada</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <SellerWelcomeNotice
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        userName={user?.name || ""}
      />
    </div>
  );
};

export default DashboardPage;
