import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Navigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { createProduct, getCategories } from "@/services/products";
import { uploadImage } from "@/services/storage";
import { Category } from "@/types/product";
import { useRef } from "react";
import { ImageCropper } from "@/components/ImageCropper";
import {
  ImagePlus,
  X,
  Package,
  Store,
  ArrowLeft,
  Plus,
  Info,
  Gamepad2,
  LayoutGrid,
  Rocket
} from "lucide-react";

const MAX_TITLE = 100;
const MAX_DESC = 2000;
const MAX_IMAGES = 6;

const CreateAdPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState(""); // Stores UUID
  const [stock, setStock] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [isSupplierAd, setIsSupplierAd] = useState(false);
  const [minQuantity, setMinQuantity] = useState("");
  const [bulkPrices, setBulkPrices] = useState<{ qty: string; price: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isActivated, setIsActivated] = useState(true); // Default true to prevent flicker
  const [checkingActivation, setCheckingActivation] = useState(true);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category Grouping Logic
  const [mainCategory, setMainCategory] = useState<"jogos" | "outros" | null>(null);

  const OUTROS_NAMES = [
    "Assinaturas e Premium",
    "Cursos e Treinamentos",
    "Discord",
    "Emails",
    "Gift Cards",
    "Redes Sociais",
    "Serviços Digitais",
    "Softwares e Licenças"
  ];

  const categoriesOthers = categories.filter(c => OUTROS_NAMES.includes(c.name));
  const categoriesGames = categories.filter(c => !OUTROS_NAMES.includes(c.name));

  const handleMainCategorySelect = (type: "jogos" | "outros") => {
    setMainCategory(type);
    setCategoryId(""); // reset specific selection
  };

  useEffect(() => {
    const load = async () => {
      setLoadingCategories(true);
      const [catRes] = await Promise.all([
        getCategories(),
      ]);
      if (catRes.data) setCategories(catRes.data);
      setLoadingCategories(false);

      if (user?.id) {
        setCheckingActivation(true);
        setIsActivated(user.status === 'active');
        setCheckingActivation(false);
      }
    };
    load();
  }, [user?.id]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth" />;

  const canCreateSupplierAd = user?.roles.includes("fornecedor");
  const canCreate = user?.roles.includes("vendedor") || user?.roles.includes("fornecedor");

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <Store className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="font-display text-lg text-muted-foreground">
            Apenas vendedores e fornecedores podem criar anúncios.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/marketplace")}>
            <ArrowLeft className="mr-2 h-4 w-4" />Voltar ao Marketplace
          </Button>
        </div>
      </div>
    );
  }

  if (checkingActivation) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!isActivated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-8 p-1 rounded-[2rem] bg-gradient-to-r from-primary/50 via-primary/20 to-primary/50 animate-glow-slow max-w-2xl">
            <div className="glass-card rounded-[1.9rem] bg-zinc-950 border-transparent p-10 flex flex-col items-center gap-6">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/20">
                <Rocket className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase font-display leading-none">Conta Aguardando Ativação</h2>
                <p className="text-sm text-zinc-400 font-medium max-w-sm mx-auto leading-relaxed">
                  Para começar a criar anúncios e vender na Hyfex, sua conta precisa ser liberada pela administração.
                </p>
              </div>

              <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 text-green-500 shrink-0 mt-0.5">
                    <Plus className="h-3 w-3" />
                  </div>
                  <p className="text-xs text-zinc-300 font-medium">Anúncios ilimitados após a liberação.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 text-green-500 shrink-0 mt-0.5">
                    <Plus className="h-3 w-3" />
                  </div>
                  <p className="text-xs text-zinc-300 font-medium">Taxa zero sobre suas vendas.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
                <Button variant="outline" className="h-14 flex-1 border-white/10 bg-white/5 text-zinc-400 font-bold uppercase tracking-widest text-[10px] rounded-xl" onClick={() => navigate("/dashboard")}>
                  Voltar ao Dashboard
                </Button>
                <Button
                  className="h-14 flex-1 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl transition-all active:scale-95"
                  asChild
                >
                  <a href={`https://wa.me/5571996683226?text=${encodeURIComponent("Olá! Gostaria de liberar minha conta de vendedor na Hyfex para começar a anunciar.")}`} target="_blank" rel="noopener noreferrer">
                    Liberar Minha Conta
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const addImage = () => {
    const trimmed = imageUrl.trim();
    if (!trimmed) return;
    if (images.length >= MAX_IMAGES) {
      toast({ title: "Limite atingido", description: `Máximo de ${MAX_IMAGES} imagens.`, variant: "destructive" });
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      toast({ title: "URL inválida", description: "Insira uma URL de imagem válida.", variant: "destructive" });
      return;
    }
    setImages([...images, trimmed]);
    setImageUrl("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= MAX_IMAGES) {
      toast({ title: "Limite atingido", description: `Máximo de ${MAX_IMAGES} imagens.`, variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setTempImage(null);
    setUploading(true);

    const file = new File([croppedBlob], "product.jpg", { type: "image/jpeg" });
    const { publicUrl, error } = await uploadImage(file);
    setUploading(false);

    if (error) {
      toast({
        title: "Erro no upload",
        description: error,
        variant: "destructive"
      });
    } else if (publicUrl) {
      setImages([...images, publicUrl]);
      toast({ title: "Sucesso", description: "Imagem enviada com sucesso!" });
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addBulkPrice = () => {
    setBulkPrices([...bulkPrices, { qty: "", price: "" }]);
  };

  const updateBulkPrice = (index: number, field: "qty" | "price", value: string) => {
    const updated = [...bulkPrices];
    updated[index][field] = value;
    setBulkPrices(updated);
  };

  const removeBulkPrice = (index: number) => {
    setBulkPrices(bulkPrices.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    if (!title.trim() || title.trim().length < 5) {
      toast({ title: "Título obrigatório", description: "Mínimo de 5 caracteres.", variant: "destructive" });
      return false;
    }
    if (!description.trim() || description.trim().length < 20) {
      toast({ title: "Descrição obrigatória", description: "Mínimo de 20 caracteres.", variant: "destructive" });
      return false;
    }
    const priceNum = parseFloat(price.replace(",", "."));
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({ title: "Preço inválido", description: "Insira um valor maior que zero.", variant: "destructive" });
      return false;
    }
    if (!categoryId) {
      toast({ title: "Categoria obrigatória", description: "Selecione uma categoria.", variant: "destructive" });
      return false;
    }
    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 1) {
      toast({ title: "Estoque inválido", description: "Insira quantidade em estoque.", variant: "destructive" });
      return false;
    }
    if (images.length === 0) {
      toast({ title: "Imagem obrigatória", description: "Adicione pelo menos uma imagem.", variant: "destructive" });
      return false;
    }
    if (isSupplierAd) {
      const minQty = parseInt(minQuantity);
      if (isNaN(minQty) || minQty < 1) {
        toast({ title: "Quantidade mínima", description: "Defina o pedido mínimo.", variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      const { error } = await createProduct({
        title,
        description,
        price: parseFloat(price.replace(",", ".")),
        image_url: images[0], // MVP: First image only
        category_id: categoryId,
        type: isSupplierAd ? "fornecedor" : "venda_final",
        stock: parseInt(stock),
        min_quantity: isSupplierAd ? parseInt(minQuantity) : 1
      });

      if (error) {
        console.error(error);
        toast({ title: "Erro", description: "Erro ao criar anúncio: " + error.message, variant: "destructive" });
      } else {
        toast({ title: "Anúncio criado!", description: "Seu anúncio foi publicado com sucesso." });
        navigate("/dashboard");
      }
    } catch (err) {
      toast({ title: "Erro", description: "Erro inesperado.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary">
              <ArrowLeft className="h-4 w-4" />Voltar
            </button>
            <h1 className="font-display text-2xl font-bold text-foreground">Criar Anúncio</h1>
            <p className="mt-1 text-sm text-muted-foreground">Preencha as informações do seu produto</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ad type toggle */}
            {canCreateSupplierAd && (
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isSupplierAd ? (
                      <Package className="h-5 w-5 text-primary" />
                    ) : (
                      <Store className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {isSupplierAd ? "Anúncio de Atacado (B2B)" : "Anúncio de Venda Final"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isSupplierAd
                          ? "Visível apenas para vendedores da plataforma"
                          : "Visível para todos os clientes"}
                      </p>
                    </div>
                  </div>
                  <Switch checked={isSupplierAd} onCheckedChange={setIsSupplierAd} />
                </div>
              </div>
            )}

            {/* Images */}
            <div className="glass-card rounded-xl p-5">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <ImagePlus className="h-4 w-4 text-primary" />
                Imagens ({images.length}/{MAX_IMAGES})
              </label>

              {images.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                      <img src={img} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </button>
                      {i === 0 && (
                        <Badge className="absolute bottom-1 left-1 h-4 px-1 text-[9px]">Capa</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Input
                  placeholder="Ou cole a URL da imagem"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1"
                  maxLength={500}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 border-dashed hover:border-primary group"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <ImagePlus className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Upload</span>
                    </div>
                  )}
                </Button>
                {imageUrl && (
                  <Button type="button" variant="secondary" size="sm" onClick={addImage}>
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />A primeira imagem será a capa do anúncio
              </p>
            </div>

            {/* Basic Info */}
            <div className="glass-card space-y-4 rounded-xl p-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Título ({title.length}/{MAX_TITLE})
                </label>
                <Input
                  placeholder="Ex: Headset Gamer RGB Pro 7.1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
                  maxLength={MAX_TITLE}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Descrição ({description.length}/{MAX_DESC})
                </label>
                <Textarea
                  placeholder="Descreva seu produto com detalhes: características, especificações, o que está incluído..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
                  maxLength={MAX_DESC}
                  rows={5}
                  className="resize-none"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-3 block text-sm font-medium text-muted-foreground">Categoria Principal</label>

                  {!mainCategory ? (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleMainCategorySelect("jogos")}
                        className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        <Gamepad2 className="mb-3 h-8 w-8 text-primary" />
                        <span className="font-semibold text-foreground">Jogos</span>
                        <span className="text-xs text-muted-foreground mt-1">League of Legends, Valorant, CS2...</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMainCategorySelect("outros")}
                        className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        <LayoutGrid className="mb-3 h-8 w-8 text-primary" />
                        <span className="font-semibold text-foreground">Outros</span>
                        <span className="text-xs text-muted-foreground mt-1">Assinaturas, Gift Cards, Discord...</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-secondary/20 p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-2">
                          {mainCategory === "jogos" ? <Gamepad2 className="h-5 w-5 text-primary" /> : <LayoutGrid className="h-5 w-5 text-primary" />}
                          <span className="font-medium text-foreground capitalize">{mainCategory}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => { setMainCategory(null); setCategoryId(""); }}
                          className="h-8 text-xs"
                        >
                          Alterar
                        </Button>
                      </div>

                      {mainCategory === "jogos" ? (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Selecione o Jogo</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {categoriesGames.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setCategoryId(cat.id)}
                                className={`p-3 rounded-lg border text-left transition-all flex flex-col items-center justify-center text-center gap-2
                                    ${categoryId === cat.id
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                                  }`}
                              >
                                {/* Ideally we would map icons here, e.g. based on cat.slug */}
                                <span className="text-xs font-medium leading-tight">{cat.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Selecione a Subcategoria</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {categoriesOthers.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setCategoryId(cat.id)}
                                className={`p-3 rounded-lg border text-left transition-all flex flex-col items-center justify-center text-center gap-2
                                    ${categoryId === cat.id
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                                  }`}
                              >
                                {/* Icons mapping could be added here if needed, keeping simple text for now */}
                                <span className="text-xs font-medium leading-tight">{cat.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div></div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Preço unitário (R$)
                  </label>
                  <Input
                    placeholder="0,00"
                    value={price}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9,.]/g, "");
                      setPrice(val);
                    }}
                    maxLength={12}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Estoque</label>
                  <Input
                    type="number"
                    placeholder="Quantidade disponível"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    min={1}
                    required
                  />
                </div>
                {isSupplierAd && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Pedido mínimo</label>
                    <Input
                      type="number"
                      placeholder="Quantidade mínima"
                      value={minQuantity}
                      onChange={(e) => setMinQuantity(e.target.value)}
                      min={1}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bulk pricing (supplier only) */}
            {isSupplierAd && (
              <div className="glass-card rounded-xl p-5">
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Preços por faixa (opcional)</label>
                  <Button type="button" variant="outline" size="sm" onClick={addBulkPrice}>
                    <Plus className="mr-1 h-3 w-3" />Faixa
                  </Button>
                </div>
                {bulkPrices.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Defina descontos por volume. Ex: a partir de 100un → R$20,00/un
                  </p>
                )}
                <div className="space-y-2">
                  {bulkPrices.map((bp, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="A partir de"
                        value={bp.qty}
                        onChange={(e) => updateBulkPrice(i, "qty", e.target.value)}
                        className="w-28"
                        min={1}
                      />
                      <span className="text-xs text-muted-foreground">un →</span>
                      <Input
                        placeholder="R$ preço/un"
                        value={bp.price}
                        onChange={(e) => updateBulkPrice(i, "price", e.target.value.replace(/[^0-9,.]/g, ""))}
                        className="w-28"
                        maxLength={12}
                      />
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeBulkPrice(i)}>
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="submit"
                size="lg"
                className="flex-1 font-display tracking-wider glow-orange"
                disabled={submitting}
              >
                {submitting ? "Publicando..." : "Publicar Anúncio"}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>

      {tempImage && (
        <ImageCropper
          image={tempImage}
          onCropComplete={handleCropComplete}
          onCancel={() => setTempImage(null)}
          aspect={4 / 3}
        />
      )}
    </div>
  );
};

export default CreateAdPage;
