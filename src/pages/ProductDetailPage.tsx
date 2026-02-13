import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { getProductById, getProductReviews, createReview } from "@/services/products";
import { ProductQuestions } from "@/components/ProductQuestions";
import { Product, Review } from "@/types/product";
import {
  Star,
  ShieldCheck,
  Package,
  Eye,
  ShoppingCart,
  ArrowLeft,
  Minus,
  Plus,
  Truck,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Edit,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [isFavorite, setIsFavorite] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    Promise.all([
      getProductById(id),
      getProductReviews(id)
    ]).then(([pRes, rRes]) => {
      if (pRes.error || !pRes.data) {
        setError("Produto não encontrado");
      } else {
        setProduct(pRes.data);
        setReviews(rRes.data || []);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setError("Erro ao carregar produto");
      setLoading(false);
    });
  }, [id]);

  const handleReviewSubmit = async () => {
    if (!product || !user) return;
    if (!reviewText.trim()) return;

    setSubmittingReview(true);
    try {
      // Note: In a real app we would check if user bought items, etc.
      // For MVP, allow review if auth.
      const { data, error } = await createReview({
        product_id: product.id,
        seller_id: product.seller_id,
        rating: reviewRating,
        comment: reviewText,
        order_id: "none", // Skip order check for MVP or implement dummy
      });

      if (error) {
        toast({ title: "Erro", description: "Não foi possível enviar a avaliação.", variant: "destructive" });
      } else {
        toast({ title: "Sucesso", description: "Avaliação enviada!" });
        setReviewText("");
        // Refresh reviews
        const { data: newReviews } = await getProductReviews(product.id);
        if (newReviews) setReviews(newReviews);
      }
    } catch (e) {
      toast({ title: "Erro", description: "Erro inesperado.", variant: "destructive" });
    } finally {
      setSubmittingReview(false);
    }
  };

  const navigateImage = (dir: number) => {
    // For now we only have 1 image per product in DB structure, unless we parse multiple urls
    // MVP: Single image
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4">
          <p className="font-display text-xl text-muted-foreground">{error || "Produto não encontrado"}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/marketplace")}>
            <ArrowLeft className="mr-2 h-4 w-4" />Voltar
          </Button>
        </div>
      </div>
    );
  }

  const isSupplier = product.type === "fornecedor";
  const minQty = product.min_quantity || 1;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "New";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 lg:px-12">
        {/* Breadcrumb & Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <Link to="/marketplace" className="transition-colors hover:text-white">Marketplace</Link>
            <span className="text-zinc-700">/</span>
            <span className="text-primary truncate max-w-[200px]">{product.title}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>

        <div className="grid gap-12 lg:grid-cols-12">
          {/* Left Column: Media & Highlights */}
          <div className="lg:col-span-7 space-y-8">
            <div className="group relative aspect-[16/10] lg:aspect-square overflow-hidden rounded-[2rem] glass-card border-white/10 premium-shadow">
              <img
                src={product.image_url}
                alt={product.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Badges Overlay */}
              <div className="absolute left-6 top-6 flex flex-col gap-2">
                {isSupplier ? (
                  <Badge className="bg-primary text-white border-none py-1.5 px-4 font-black uppercase tracking-wider text-[10px] glow-orange-sm">
                    <Package className="mr-1.5 h-3.5 w-3.5" /> Atacado
                  </Badge>
                ) : (
                  <Badge className="bg-white/10 backdrop-blur-md text-white border-white/10 py-1.5 px-4 font-black uppercase tracking-wider text-[10px]">Varejo</Badge>
                )}
                <Badge className="bg-zinc-900/80 backdrop-blur-md text-zinc-400 border-white/5 py-1.5 px-4 font-black uppercase tracking-wider text-[10px]">
                  Verificado pela Hyfex
                </Badge>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Description Card */}
            <div className="glass-card rounded-[2rem] border-white/10 p-8 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Descrição do Produto</h3>
              <div className="h-[1px] w-full bg-white/5" />
              <p className="text-zinc-400 text-base leading-relaxed whitespace-pre-line font-medium">{product.description}</p>
            </div>
          </div>

          {/* Right Column: Actions & Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card rounded-[2rem] border-white/10 p-8 space-y-8 sticky top-24">
              {/* Title & Stats */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase text-[9px] font-black tracking-widest px-2 py-0.5">
                    {product.category?.name || "Geral"}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    <Eye className="h-3.5 w-3.5 text-primary" /> {product.views} visualizações
                  </div>
                </div>

                <h1 className="text-3xl md:text-5xl font-black font-display text-white tracking-tighter leading-none">
                  {product.title}
                </h1>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="text-sm font-black text-white">{avgRating}</span>
                    <span className="text-xs font-bold text-zinc-500">({reviews.length} avaliações)</span>
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    {product.sales} vendidos
                  </div>
                </div>
              </div>

              <div className="h-[1px] w-full bg-white/5" />

              {/* Price & Purchase */}
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-2">Preço de Mercado</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white tracking-tighter">
                      R$ {product.price.toFixed(2).replace(".", ",")}
                    </span>
                    {isSupplier && <span className="text-sm font-bold text-zinc-600 uppercase tracking-widest">/ unidade</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Quantidade</span>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10"
                      onClick={() => setQuantity(Math.max(minQty, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-black text-white w-6 text-center">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    size="lg"
                    className="h-14 w-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl active:scale-95 glow-orange"
                    onClick={() => navigate("/checkout", { state: { product, quantity } })}
                  >
                    <ShoppingCart className="mr-3 h-5 w-5" />
                    Adquirir Agora
                    <span className="ml-2 opacity-50 font-medium">| R$ {(product.price * quantity).toFixed(2).replace(".", ",")}</span>
                  </Button>

                  <div className="flex gap-3">
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 h-12 border-white/10 bg-white/5 text-zinc-300 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10"
                      onClick={() => {
                        if (!user) {
                          toast({ title: "Login necessário", description: "Faça login para enviar mensagens.", variant: "destructive" });
                          navigate("/auth");
                          return;
                        }
                        navigate("/chat", { state: { recipientId: product.seller_id, recipientName: product.seller?.name, productId: product.id } });
                      }}
                    >
                      <MessageSquare className="mr-2 h-4 w-4 text-primary" />
                      Chat Messenger
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      className={`h-12 w-12 rounded-xl border-white/10 bg-white/5 ${isFavorite ? "text-primary" : "text-zinc-500"}`}
                      onClick={() => {
                        setIsFavorite(!isFavorite);
                        toast({ title: isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos" });
                      }}
                    >
                      <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="h-[1px] w-full bg-white/5" />

              {/* Seller Info Container */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Representante Hyfex</span>
                  <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] font-black uppercase tracking-widest">Online Agora</Badge>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5 transition-all group" onClick={() => navigate(`/seller/${product.seller_id}`)}>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 transition-all group-hover:glow-orange-sm">
                    {product.seller?.avatar_url ? (
                      <img src={product.seller.avatar_url} className="h-full w-full rounded-xl object-cover" />
                    ) : (
                      <span className="text-xl font-black text-primary">{product.seller?.name?.[0] || "?"}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white tracking-tight">{product.seller?.name || "Vendedor Elite"}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-xs font-black text-primary">{product.seller?.reputation?.toFixed(1) || "5.0"}</span>
                      </div>
                      <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                        {product.stock} em estoque
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="ml-auto h-4 w-4 text-zinc-700 group-hover:text-primary transition-colors" />
                </div>

                {/* Security Disclaimer */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5">
                  <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-tight">
                    Pagamento Protegido. O saldo só é liberado após sua confirmação.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Questions Section */}
        {product && (
          <section className="mt-12 border-t border-border pt-10">
            <ProductQuestions productId={product.id} sellerId={product.seller_id} />
          </section>
        )}

        {/* Reviews Section */}
        <section className="mt-12 border-t border-border pt-10">
          <h2 className="mb-6 font-display text-xl font-bold text-foreground">
            Avaliações <span className="text-primary">({reviews.length})</span>
          </h2>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Write review */}
              {user && (
                <div className="glass-card rounded-[2rem] border-white/10 p-8 mb-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6">Deixe sua avaliação</h3>
                  <div className="flex items-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setReviewRating(s)}
                        className="transition-transform active:scale-90"
                      >
                        <Star className={`h-6 w-6 transition-all ${s <= reviewRating ? "fill-primary text-primary glow-orange-sm" : "text-zinc-700 hover:text-primary/50"}`} />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Como foi sua experiência com este produto e vendedor?"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="mb-6 resize-none bg-white/5 border-white/10 rounded-2xl h-32 focus-visible:ring-primary/50"
                  />
                  <Button size="lg" className="h-12 px-8 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-xl" onClick={handleReviewSubmit} disabled={submittingReview}>
                    {submittingReview ? "Processando..." : "Publicar Avaliação"}
                  </Button>
                </div>
              )}

              {reviews.length > 0 ? (
                <div className="grid gap-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="glass-card rounded-2xl border-white/10 p-6 hover:bg-white/[0.04] transition-colors">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center font-black text-zinc-400">
                            {review.reviewer?.name?.[0] || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white tracking-tight">{review.reviewer?.name || "Usuário"}</p>
                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-primary text-primary" : "text-zinc-800"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-zinc-400 font-medium">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center rounded-[2rem] border border-dashed border-white/10">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Este produto ainda não possui avaliações</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetailPage;
