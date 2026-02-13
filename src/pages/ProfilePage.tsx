import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Navigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User, Star, Package, History, Settings, Shield, Bell, Eye,
  ShoppingCart, TrendingUp, Mail, Phone, MapPin, Calendar, Edit2, Save,
  LayoutDashboard, ShoppingBag, MessageCircle, HelpCircle, AlertTriangle, ImagePlus, X
} from "lucide-react";
import { useState, useEffect } from "react";
import { getMyPurchases, getMySales } from "@/services/orders";
import { getMyDisputes, openDispute } from "@/services/disputes";
import { getSellerProducts, getSellerReviews } from "@/services/products";
import { uploadImage } from "@/services/storage";
import { toast } from "@/hooks/use-toast";
import { useRef } from "react";
import { ImageCropper } from "@/components/ImageCropper";



const statusColors: Record<string, string> = {
  entregue: "bg-green-500/10 text-green-400 border-green-500/30",
  enviado: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  processando: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  ativo: "bg-green-500/10 text-green-400 border-green-500/30",
  inativo: "bg-muted text-muted-foreground border-border",
  completed: "bg-green-500/10 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
  disputed: "bg-red-500/10 text-red-400 border-red-500/30",
  refunded: "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

const ProfilePage = () => {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Existing Seller State
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatarUrl: user?.avatarUrl || "",
    bio: user?.bio || "",
    location: user?.location || "",
    phone: user?.phone || "",
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    saleAlerts: true,
    reviewAlerts: true,
    promotionalEmails: false,
    twoFactor: false,
    publicProfile: true,
    showReputation: true,
  });

  // Seller State
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [sellerSales, setSellerSales] = useState<any[]>([]);
  const [sellerReviews, setSellerReviews] = useState<any[]>([]);
  const [loadingSeller, setLoadingSeller] = useState(false);

  // Client State
  const [purchases, setPurchases] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  // Dispute Modal State
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        avatarUrl: user.avatarUrl || "",
        bio: user.bio || "",
        location: user.location || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (user?.activeRole === 'cliente' && activeTab === 'purchases') {
      loadPurchasesAndDisputes();
    }
  }, [user?.activeRole, activeTab]);

  useEffect(() => {
    if (user?.id && (user?.activeRole === 'vendedor' || user?.activeRole === 'fornecedor')) {
      loadSellerData();
    }
  }, [user?.id, user?.activeRole]);

  const loadSellerData = async () => {
    if (!user) return;
    setLoadingSeller(true);
    const [prodRes, salesRes, reviewsRes] = await Promise.all([
      getSellerProducts(user.id),
      getMySales(),
      getSellerReviews(user.id),
    ]);
    setSellerProducts(prodRes.data || []);
    setSellerSales(salesRes.data || []);
    setSellerReviews(reviewsRes.data || []);
    setLoadingSeller(false);
  };

  const loadPurchasesAndDisputes = async () => {
    setLoadingPurchases(true);
    const [purchasesRes, disputesRes] = await Promise.all([
      getMyPurchases(),
      getMyDisputes()
    ]);
    setPurchases(purchasesRes.data || []);
    setDisputes(disputesRes.data || []);
    setLoadingPurchases(false);
  };

  const handleOpenDisputeModal = (order: any) => {
    setSelectedOrder(order);
    setDisputeReason("");
    setDisputeDesc("");
    setDisputeModalOpen(true);
  };

  const handleSubmitDispute = async () => {
    if (!disputeReason || !disputeDesc) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    setSubmittingDispute(true);
    const { error } = await openDispute({
      order_id: selectedOrder.id,
      seller_id: selectedOrder.seller_id,
      reason: disputeReason,
      description: disputeDesc
    });

    if (error) {
      toast({ title: "Erro", description: "Falha ao abrir disputa.", variant: "destructive" });
    } else {
      toast({ title: "Disputa Aberta", description: "O vendedor e a administração foram notificados." });
      setDisputeModalOpen(false);
      loadPurchasesAndDisputes();
    }
    setSubmittingDispute(false);
  };

  const handleUpdateBasicProfile = async () => {
    const { error } = await updateProfile({
      name: profileData.name,
      avatarUrl: profileData.avatarUrl,
      bio: profileData.bio,
      location: profileData.location,
      phone: profileData.phone
    });

    if (error) {
      toast({ title: "Erro", description: "Falha ao atualizar perfil: " + error, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Perfil atualizado com sucesso." });
      setIsEditing(false);
    }
  };

  const getDisputeForOrder = (orderId: string) => {
    return disputes.find(d => d.order_id === orderId);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Load file as data URL to show in cropper
    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setTempImage(null);
    setUploadingAvatar(true);

    const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
    const { publicUrl, error } = await uploadImage(file, "avatars");
    setUploadingAvatar(false);

    if (error) {
      toast({
        title: "Erro no upload",
        description: error,
        variant: "destructive"
      });
    } else if (publicUrl) {
      setProfileData({ ...profileData, avatarUrl: publicUrl });
      toast({ title: "Sucesso", description: "Avatar enviado com sucesso!" });
    }
  };

  if (!isAuthenticated) return <Navigate to="/auth" />;

  const isClient = user?.activeRole === 'cliente';

  // --- CLIENT VIEW ---
  if (isClient) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0 space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="group relative h-12 w-12 shrink-0">
                <div className="h-full w-full rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-primary" />
                  )}
                </div>
              </div>
              <div>
                <p className="font-semibold text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">Cliente</p>
              </div>
            </div>

            <nav className="space-y-1">
              <Button
                variant={activeTab === 'overview' ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab('overview')}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" /> Resumo
              </Button>
              <Button
                variant={activeTab === 'purchases' ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab('purchases')}
              >
                <ShoppingBag className="mr-2 h-4 w-4" /> Minhas Compras
              </Button>
              <Button
                variant={activeTab === 'my-questions' ? "secondary" : "ghost"} // Changed key to differentiate
                className="w-full justify-start"
                asChild
              >
                <Link to="/my-questions">
                  <HelpCircle className="mr-2 h-4 w-4" /> Minhas Perguntas
                </Link>
              </Button>
              <Button
                variant={activeTab === 'settings' ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab('settings')}
              >
                <Settings className="mr-2 h-4 w-4" /> Configurações
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                asChild
              >
                <Link to="/support">
                  <HelpCircle className="mr-2 h-4 w-4" /> Central de Ajuda
                </Link>
              </Button>
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-h-[500px]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">Resumo da Conta</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">Última Compra</h3>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      {purchases.length > 0 ? "R$ " + purchases[0].total_amount?.toFixed(2) : "-"}
                    </p>
                  </div>
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">Total de Pedidos</h3>
                    <p className="mt-2 text-2xl font-bold text-foreground">{purchases.length}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'purchases' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">Minhas Compras</h2>
                {loadingPurchases ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando compras...</div>
                ) : purchases.length > 0 ? (
                  <div className="space-y-4">
                    {purchases.map(order => {
                      const dispute = getDisputeForOrder(order.id);
                      const isDisputed = !!dispute || order.status === 'disputed';
                      // Allow dispute if not already disputed/refunded/cancelled and status is completed or pending?
                      // Usually you dispute if something went wrong.
                      const canDispute = !isDisputed && order.status !== 'cancelled' && order.status !== 'refunded';

                      return (
                        <div key={order.id} className="glass-card rounded-xl p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                          <div className="flex gap-4">
                            <div className="h-16 w-16 rounded-md bg-zinc-800 overflow-hidden shrink-0">
                              {order.product?.image_url && (
                                <img src={order.product.image_url} alt="" className="h-full w-full object-cover" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">{order.product?.title || "Produto indisponível"}</h3>
                              <p className="text-sm text-muted-foreground">Vendedor: {order.seller?.name}</p>
                              <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                              {isDisputed && (
                                <Badge variant="outline" className="mt-1 border-red-500/50 text-red-500 bg-red-500/10">
                                  Disputa em andamento
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <p className="font-bold text-foreground">R$ {order.total_amount.toFixed(2)}</p>
                            <Badge variant="outline" className={`${statusColors[order.status] || ''}`}>
                              {order.status === 'completed' ? 'Entregue' : order.status}
                            </Badge>

                            {canDispute && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleOpenDisputeModal(order)}
                              >
                                <AlertTriangle className="mr-1 h-3 w-3" /> Problema?
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
                    Você ainda não fez nenhuma compra.
                    <div className="mt-4">
                      <Button asChild>
                        <Link to="/marketplace">Ir para Marketplace</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-xl space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Configurações</h2>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    size="sm"
                    onClick={() => isEditing ? handleUpdateBasicProfile() : setIsEditing(true)}
                  >
                    {isEditing ? <><Save className="mr-2 h-4 w-4" /> Salvar</> : <><Edit2 className="mr-2 h-4 w-4" /> Editar</>}
                  </Button>
                </div>

                <div className="glass-card rounded-xl p-6 space-y-6">
                  {/* Avatar Upload */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Foto de Perfil</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                        {profileData.avatarUrl ? (
                          <img src={profileData.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-10 w-10 text-primary" />
                        )}
                      </div>
                      {isEditing && (
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Cole a URL da sua foto"
                              value={profileData.avatarUrl}
                              onChange={(e) => setProfileData({ ...profileData, avatarUrl: e.target.value })}
                            />
                            {profileData.avatarUrl && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setProfileData({ ...profileData, avatarUrl: "" })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">Cole um link direto para sua imagem (ex: do Imgur, Discord, etc.)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      <Input
                        value={profileData.name}
                        disabled={!isEditing}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user?.email} disabled />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="pt-2">
                      <Button variant="outline" className="w-full" onClick={() => setIsEditing(false)}>Cancelar</Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Dispute Modal */}
        <Dialog open={disputeModalOpen} onOpenChange={setDisputeModalOpen}>
          <DialogContent className="border-border bg-card text-foreground">
            <DialogHeader>
              <DialogTitle>Abrir Disputa</DialogTitle>
              <DialogDescription>
                Descreva o problema com seu pedido. O vendedor e a administração serão notificados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Input value={selectedOrder?.product?.title || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Input
                  placeholder="Ex: Produto não entregue, Defeito, etc."
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição Detalhada</Label>
                <Textarea
                  placeholder="Explique o que aconteceu..."
                  rows={4}
                  value={disputeDesc}
                  onChange={e => setDisputeDesc(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDisputeModalOpen(false)}>Cancelar</Button>
              <Button
                variant="destructive"
                onClick={handleSubmitDispute}
                disabled={submittingDispute}
              >
                {submittingDispute ? "Enviando..." : "Abrir Disputa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    );
  }

  // --- SELLER / SUPPLIER VIEW (Original) ---
  const avgRating = sellerReviews.length > 0
    ? sellerReviews.reduce((s, r) => s + r.rating, 0) / sellerReviews.length
    : user?.reputation || 5.0;
  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: sellerReviews.filter((r: any) => r.rating === star).length,
    pct: sellerReviews.length > 0
      ? (sellerReviews.filter((r: any) => r.rating === star).length / sellerReviews.length) * 100
      : 0,
  }));

  const totalViews = sellerProducts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalSalesCount = sellerSales.length;
  const conversionRate = totalViews > 0 ? ((totalSalesCount / totalViews) * 100).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="glass-card mb-8 rounded-xl p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="h-20 w-20 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-bold text-foreground">{user?.name}</h1>
                <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary">
                  {user?.activeRole === "fornecedor" ? "Fornecedor" : "Vendedor"}
                </Badge>
                <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-400">
                  <Shield className="mr-1 h-3 w-3" /> Verificado
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {user?.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {user.location}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Membro</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3 text-primary" /> {avgRating.toFixed(1)} ({sellerReviews.length} avaliações)</span>
              </div>
            </div>
            <div className="flex gap-3 text-center">
              {[
                { label: "Vendas", value: totalSalesCount.toString(), icon: ShoppingCart },
                { label: "Views", value: totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews.toString(), icon: Eye },
                { label: "Conversão", value: `${conversionRate}%`, icon: TrendingUp },
              ].map((s) => (
                <div key={s.label} className="glass-card rounded-lg px-4 py-3">
                  <s.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
                  <div className="font-display text-lg font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ads" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-secondary">
            <TabsTrigger value="ads" className="gap-2 text-xs sm:text-sm">
              <Package className="h-4 w-4" /> Anúncios
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 text-xs sm:text-sm">
              <History className="h-4 w-4" /> Histórico
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2 text-xs sm:text-sm">
              <Star className="h-4 w-4" /> Avaliações
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 text-xs sm:text-sm">
              <Settings className="h-4 w-4" /> Configurações
            </TabsTrigger>
          </TabsList>

          {/* Anúncios Tab */}
          <TabsContent value="ads">
            <div className="glass-card rounded-xl p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Anúncios Publicados</h2>
              <div className="space-y-3">
                {sellerProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum anúncio publicado ainda.</p>
                ) : sellerProducts.map((ad) => (
                  <div key={ad.id} className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:border-primary/30">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-foreground">{ad.title}</h3>
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{ad.views || 0} views</span>
                        <span>{ad.sales || 0} vendas</span>
                        <span>R$ {parseFloat(ad.price || 0).toFixed(2).replace(".", ",")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColors[ad.status] || statusColors['ativo']}>{ad.status}</Badge>
                      <Link to={`/edit-ad/${ad.id}`}>
                        <Button variant="ghost" size="sm"><Edit2 className="h-4 w-4" /></Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Histórico Tab */}
          <TabsContent value="history">
            <div className="glass-card rounded-xl p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Histórico de Vendas</h2>
              <div className="space-y-3">
                {sellerSales.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma venda registrada ainda.</p>
                ) : sellerSales.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.product?.title || 'Produto'}</p>
                      <p className="text-xs text-muted-foreground">Comprador: {tx.buyer?.name || 'Anônimo'} • {new Date(tx.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={statusColors[tx.status] || ''}>{tx.status}</Badge>
                      <span className="font-display text-sm font-semibold text-primary">
                        R$ {parseFloat(tx.total_amount || 0).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Avaliações Tab */}
          <TabsContent value="reviews">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="glass-card rounded-xl p-6">
                <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Resumo</h2>
                <div className="mb-4 text-center">
                  <div className="font-display text-4xl font-bold text-primary">{avgRating.toFixed(1)}</div>
                  <div className="mt-1 flex justify-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{sellerReviews.length} avaliações</p>
                </div>
                <div className="space-y-2">
                  {ratingDist.map((r) => (
                    <div key={r.star} className="flex items-center gap-2 text-sm">
                      <span className="w-4 text-right text-muted-foreground">{r.star}</span>
                      <Star className="h-3 w-3 text-primary" />
                      <Progress value={r.pct} className="h-2 flex-1" />
                      <span className="w-6 text-right text-xs text-muted-foreground">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 lg:col-span-2">
                {sellerReviews.length === 0 ? (
                  <div className="glass-card rounded-xl p-8 text-center text-sm text-muted-foreground">Nenhuma avaliação recebida ainda.</div>
                ) : sellerReviews.map((review: any) => (
                  <div key={review.id} className="glass-card rounded-xl p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{review.reviewer?.name || 'Anônimo'}</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{review.product?.title || ''}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="mt-2 text-sm text-foreground/80">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Configurações Tab */}
          <TabsContent value="settings">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Profile Info */}
              <div className="glass-card rounded-xl p-6">
                <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                  <h2 className="font-display text-lg font-semibold text-foreground">Dados Pessoais</h2>
                  <div className="flex gap-2">
                    {isEditing && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        Cancelar
                      </Button>
                    )}
                    <Button variant={isEditing ? "default" : "outline"} size="sm" onClick={() => isEditing ? handleUpdateBasicProfile() : setIsEditing(true)}>
                      {isEditing ? <><Save className="mr-1 h-4 w-4" /> Salvar</> : <><Edit2 className="mr-1 h-4 w-4" /> Editar</>}
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Avatar Upload for Seller */}
                  <div className="space-y-3 pb-4 border-b border-border/50">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Foto de Perfil</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                        {profileData.avatarUrl ? (
                          <img src={profileData.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-8 w-8 text-primary" />
                        )}
                      </div>
                      {isEditing && (
                        <div className="flex-1 space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={avatarInputRef}
                            onChange={handleAvatarUpload}
                            disabled={uploadingAvatar}
                          />
                          <div className="flex gap-2">
                            <Input
                              placeholder="Ou cole a URL da sua foto"
                              value={profileData.avatarUrl}
                              onChange={(e) => setProfileData({ ...profileData, avatarUrl: e.target.value })}
                              className="h-9 flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="shrink-0 border-dashed"
                              onClick={() => avatarInputRef.current?.click()}
                              disabled={uploadingAvatar}
                            >
                              {uploadingAvatar ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              ) : (
                                "Upload"
                              )}
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Upload direto ou link (Imgur, Discord, etc.)</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "Nome", key: "name" as const, icon: User },
                      { label: "Email", key: "email" as const, icon: Mail },
                      { label: "Telefone", key: "phone" as const, icon: Phone },
                      { label: "Localização", key: "location" as const, icon: MapPin },
                    ].map((field) => (
                      <div key={field.key} className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <field.icon className="h-3 w-3" /> {field.label}
                        </Label>
                        <Input
                          value={profileData[field.key]}
                          disabled={!isEditing}
                          onChange={(e) => setProfileData({ ...profileData, [field.key]: e.target.value })}
                          className="disabled:opacity-70"
                        />
                      </div>
                    ))}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Bio</Label>
                      <Input
                        value={profileData.bio}
                        disabled={!isEditing}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        className="disabled:opacity-70"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-6">
                <div className="glass-card rounded-xl p-6">
                  <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
                    <Bell className="mr-2 inline h-4 w-4 text-primary" /> Notificações
                  </h2>
                  <div className="space-y-4">
                    {[
                      { key: "emailNotifications" as const, label: "Notificações por email" },
                      { key: "saleAlerts" as const, label: "Alertas de venda" },
                      { key: "reviewAlerts" as const, label: "Novas avaliações" },
                      { key: "promotionalEmails" as const, label: "Emails promocionais" },
                    ].map((opt) => (
                      <div key={opt.key} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{opt.label}</span>
                        <Switch
                          checked={settings[opt.key]}
                          onCheckedChange={(v) => setSettings({ ...settings, [opt.key]: v })}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
                    <Shield className="mr-2 inline h-4 w-4 text-primary" /> Segurança e Privacidade
                  </h2>
                  <div className="space-y-4">
                    {[
                      { key: "twoFactor" as const, label: "Autenticação em duas etapas" },
                      { key: "publicProfile" as const, label: "Perfil público" },
                      { key: "showReputation" as const, label: "Exibir reputação" },
                    ].map((opt) => (
                      <div key={opt.key} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{opt.label}</span>
                        <Switch
                          checked={settings[opt.key]}
                          onCheckedChange={(v) => setSettings({ ...settings, [opt.key]: v })}
                        />
                      </div>
                    ))}
                    <div className="border-t border-border pt-4">
                      <Button variant="outline" size="sm" className="w-full">Alterar Senha</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {tempImage && (
        <ImageCropper
          image={tempImage}
          onCropComplete={handleCropComplete}
          onCancel={() => setTempImage(null)}
          aspect={1}
        />
      )}
    </div>
  );
};

export default ProfilePage;
