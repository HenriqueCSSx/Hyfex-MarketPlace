import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, CreditCard, QrCode, Bitcoin } from "lucide-react";
import { getProductById } from "@/services/products";
import { createOrder } from "@/services/orders";
import { createPaymentPreference } from "@/services/payment";
import { Product } from "@/types/product";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

// Initialize Mercado Pago with public key from env
initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY);

export default function CheckoutPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();
    const state = location.state as { product?: Product, quantity?: number } | null;

    const productId = searchParams.get("productId") || state?.product?.id;
    const [product, setProduct] = useState<Product | null>(state?.product || null);
    const [quantity, setQuantity] = useState(state?.quantity || 1);
    const [loading, setLoading] = useState(!state?.product);
    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("pix");
    const [preferenceId, setPreferenceId] = useState<string | null>(null);

    useEffect(() => {
        if (!productId) {
            navigate("/marketplace");
            return;
        }
        if (!product) {
            loadProduct();
        } else {
            setLoading(false);
        }
    }, [productId]);

    const loadProduct = async () => {
        setLoading(true);
        const { data, error } = await getProductById(productId!);
        if (error || !data) {
            toast({ title: "Erro", description: "Produto não encontrado.", variant: "destructive" });
            navigate("/marketplace");
        } else {
            setProduct(data);
        }
        setLoading(false);
    };

    const handlePurchase = async () => {
        if (!isAuthenticated) {
            navigate("/auth?redirect=/checkout?productId=" + productId);
            return;
        }
        if (!product) return;

        setProcessing(true);
        try {
            const totalAmount = product.price * quantity;

            // 1. Create order in pending status
            const orderData = {
                product_id: product.id,
                seller_id: product.seller.id,
                quantity: quantity,
                unit_price: product.price,
                total_amount: totalAmount,
                status: "pending" // Wait for payment
            };

            const { data: order, error: orderError } = await createOrder(orderData);
            if (orderError) throw orderError;

            // 2. Create Mercado Pago Preference
            const { data: pref, error: prefError } = await createPaymentPreference({
                items: [{
                    title: product.title,
                    description: `Compra de ${quantity}x ${product.title} na Hyfex`,
                    quantity: quantity,
                    unit_price: product.price
                }],
                external_reference: order?.id, // Tie MP payment to our order ID
                payer_email: user?.email
            });

            if (prefError) throw new Error(prefError);

            if (pref?.id) {
                setPreferenceId(pref.id);
                toast({
                    title: "Pedido gerado!",
                    description: "Continue com o pagamento via Mercado Pago."
                });
            } else {
                throw new Error("Não foi possível gerar a preferência de pagamento.");
            }

        } catch (error: any) {
            console.error("Erro completo:", error);

            // Tenta pegar a mensagem mais específica possível
            const detailedError = error.message || "Erro desconhecido";

            toast({
                title: "Erro no checkout",
                description: `Detalhes: ${detailedError}`,
                variant: "destructive"
            });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!product) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Finalizar Compra</h1>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Payment Selection */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Método de Pagamento</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid gap-4">
                                    <div className={`flex items-center space-x-4 rounded-lg border p-4 cursor-pointer transition-colors ${paymentMethod === 'pix' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                        <RadioGroupItem value="pix" id="pix" />
                                        <Label htmlFor="pix" className="flex-1 flex items-center gap-3 cursor-pointer">
                                            <QrCode className="h-6 w-6 text-green-500" />
                                            <div>
                                                <div className="font-semibold">Pix (Mercado Pago)</div>
                                                <div className="text-sm text-muted-foreground">Aprovação imediata e segura.</div>
                                            </div>
                                        </Label>
                                    </div>

                                    <div className={`flex items-center space-x-4 rounded-lg border p-4 cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                        <RadioGroupItem value="card" id="card" />
                                        <Label htmlFor="card" className="flex-1 flex items-center gap-3 cursor-pointer">
                                            <CreditCard className="h-6 w-6 text-blue-500" />
                                            <div>
                                                <div className="font-semibold">Cartão de Crédito / Outros</div>
                                                <div className="text-sm text-muted-foreground">Pague com cartão em até 12x via Mercado Pago.</div>
                                            </div>
                                        </Label>
                                    </div>
                                </RadioGroup>

                                {preferenceId && (
                                    <div className="mt-6 text-center py-4 border-t border-dashed animate-in fade-in slide-in-from-top-4">
                                        <div className="flex items-center justify-center gap-2 text-primary font-bold mb-2">
                                            <ShieldCheck className="h-5 w-5" />
                                            <span>Pagamento Pronto!</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Clique no botão azul à direita para finalizar.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumo do Pedido</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="h-16 w-16 bg-zinc-800 rounded-md overflow-hidden shrink-0">
                                        {product.image_url && <img src={product.image_url} alt="" className="h-full w-full object-cover" />}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-sm line-clamp-2">{product.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">Vendedor: {product.seller?.name}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Preço unitário</span>
                                        <span>R$ {product.price.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Quantidade</span>
                                        <span>{quantity}x</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>R$ {(product.price * quantity).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Taxa de Serviço</span>
                                        <span>R$ 0,00</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span className="text-primary">R$ {(product.price * quantity).toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-3">
                                {!preferenceId ? (
                                    <Button
                                        className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-white"
                                        onClick={handlePurchase}
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando Pedido...</>
                                        ) : (
                                            "Ir para o Pagamento"
                                        )}
                                    </Button>
                                ) : (
                                    <div className="w-full min-h-[48px]">
                                        <Wallet
                                            initialization={{ preferenceId }}
                                            onReady={() => console.log("Wallet ready")}
                                            onError={(error) => {
                                                console.error("Wallet error:", error);
                                                toast({
                                                    title: "Erro no Mercado Pago",
                                                    description: "Ocorreu um erro ao carregar o botão de pagamento.",
                                                    variant: "destructive"
                                                });
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                    <ShieldCheck className="h-3 w-3" /> Pagamento Processado pelo Mercado Pago
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
