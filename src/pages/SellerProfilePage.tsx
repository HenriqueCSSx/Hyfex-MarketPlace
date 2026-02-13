import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShieldCheck, MapPin, Calendar, Star, Package, MessageSquare, ThumbsUp } from "lucide-react";
import { getSellerProducts, getSellerProfile, getSellerReviews } from "@/services/products";
import { Product } from "@/types/product";
import { useToast } from "@/hooks/use-toast";

interface SellerProfile {
    id: string;
    name: string;
    avatar_url?: string;
    reputation: number;
    created_at: string;
    bio?: string;
    location?: string;
}

export default function SellerProfilePage() {
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();
    const [seller, setSeller] = useState<SellerProfile | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [profileRes, productsRes, reviewsRes] = await Promise.all([
                getSellerProfile(id!),
                getSellerProducts(id!),
                getSellerReviews(id!)
            ]);

            if (profileRes.error) throw profileRes.error;
            setSeller(profileRes.data);
            setProducts(productsRes.data || []);
            setReviews(reviewsRes.data || []);
        } catch (error) {
            console.error(error);
            toast({ title: "Erro", description: "Vendedor não encontrado.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!seller) return <div className="min-h-screen flex items-center justify-center">Vendedor não encontrado.</div>;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Header / Cover */}
            <div className="h-48 bg-gradient-to-r from-primary/20 via-background to-background relative">
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
            </div>

            <div className="container mx-auto px-4 -mt-20 relative z-10">
                <div className="flex flex-col md:flex-row items-end md:items-center gap-6 mb-8">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                        <AvatarImage src={seller.avatar_url} />
                        <AvatarFallback className="text-4xl">{seller.name[0]}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 pb-4">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold">{seller.name}</h1>
                            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 gap-1">
                                <ShieldCheck className="h-3 w-3" /> Verificado
                            </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium text-foreground">{seller.reputation?.toFixed(1) || 5.0}</span> Reputação
                            </div>
                            <div className="flex items-center gap-1">
                                <Package className="h-4 w-4" />
                                <span className="font-medium text-foreground">{products.length}</span> Anúncios ativos
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Membro desde {new Date(seller.created_at).getFullYear()}
                            </div>
                        </div>
                    </div>

                    <div className="pb-4 flex gap-3">
                        <Button asChild>
                            <Link to={`/chat?recipientId=${seller.id}`}>
                                <MessageSquare className="mr-2 h-4 w-4" /> Enviar Mensagem
                            </Link>
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="products" className="space-y-8">
                    <TabsList>
                        <TabsTrigger value="products">Anúncios</TabsTrigger>
                        <TabsTrigger value="reviews">Avaliações</TabsTrigger>
                        <TabsTrigger value="about">Sobre</TabsTrigger>
                    </TabsList>

                    <TabsContent value="products">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                            {products.length > 0 ? (
                                products.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                                    Este vendedor não possui anúncios ativos no momento.
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="reviews">
                        <div className="glass-card p-6">
                            <h3 className="font-semibold text-lg mb-6">O que dizem os compradores</h3>

                            <div className="space-y-6">
                                {reviews.length > 0 ? (
                                    reviews.map((review: any) => (
                                        <div key={review.id} className="border-b border-border pb-6 last:border-0 last:pb-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={review.reviewer?.avatar_url} />
                                                        <AvatarFallback>{review.reviewer?.name?.[0] || "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-sm text-foreground">{review.reviewer?.name || "Usuário"}</p>
                                                        <div className="flex items-center gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted"}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
                                            {review.product && (
                                                <div className="mt-2 flex items-center gap-2 text-xs text-primary bg-primary/5 p-2 rounded w-fit">
                                                    <Package className="h-3 w-3" />
                                                    <span>Comprou: {review.product.title}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <ThumbsUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>Nenhuma avaliação recebida ainda.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="about">
                        <div className="glass-card p-6 max-w-2xl">
                            <h3 className="font-semibold text-lg mb-4">Sobre o Vendedor</h3>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {seller.bio || "Este vendedor ainda não adicionou uma biografia."}
                            </p>

                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium mb-1">Localização</h4>
                                    <p className="text-muted-foreground flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> {seller.location || "Não informada"}
                                    </p>
                                </div>
                                {/* Add more stats here if available */}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
