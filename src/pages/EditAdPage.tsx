import { useState, useEffect } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { getProductById, updateProduct, getCategories } from "@/services/products";
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
    LayoutGrid
} from "lucide-react";

const MAX_TITLE = 100;
const MAX_DESC = 2000;
const MAX_IMAGES = 6;

const EditAdPage = () => {
    const { id } = useParams();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [categoryId, setCategoryId] = useState(""); // Stores UUID
    const [stock, setStock] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [imageUrl, setImageUrl] = useState("");
    const [isSupplierAd, setIsSupplierAd] = useState(false);
    const [minQuantity, setMinQuantity] = useState("");

    // Keep track if product was originally supplier type to show warning/restriction if needed, 
    // though we allow toggling for now.

    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
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
        if (!authLoading && isAuthenticated) {
            loadData();
        }
    }, [id, authLoading, isAuthenticated]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [catRes, prodRes] = await Promise.all([
                getCategories(),
                getProductById(id!)
            ]);

            if (catRes.data) setCategories(catRes.data);

            if (prodRes.data) {
                const p = prodRes.data;
                if (p.seller_id !== user?.id && !user?.isAdmin) {
                    toast({ title: "Acesso negado", description: "Você não tem permissão para editar este anúncio.", variant: "destructive" });
                    navigate("/dashboard");
                    return;
                }

                setTitle(p.title);
                setDescription(p.description || "");
                setPrice(p.price.toString().replace(".", ","));
                setCategoryId(p.category_id || "");
                setStock(p.stock.toString());
                setIsSupplierAd(p.type === "fornecedor");
                setMinQuantity(p.min_quantity?.toString() || "");
                if (p.image_url) setImages([p.image_url]); // MVP: Single image

                // Determine main category content for UI
                const catName = p.category?.name;
                if (catName) {
                    setMainCategory(OUTROS_NAMES.includes(catName) ? "outros" : "jogos");
                }
            } else {
                toast({ title: "Erro", description: "Anúncio não encontrado.", variant: "destructive" });
                navigate("/dashboard");
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Erro", description: "Falha ao carregar dados.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

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
        if (isNaN(stockNum) || stockNum < 0) { // Allow 0 stock to pause? Or just invalid.
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
        if (!id) {
            toast({ title: "Erro", description: "ID do anúncio não encontrado.", variant: "destructive" });
            return;
        }
        if (!validate()) return;

        setSubmitting(true);

        try {
            const updates = {
                title,
                description,
                price: parseFloat(price.replace(",", ".")),
                image_url: images[0],
                category_id: categoryId,
                stock: parseInt(stock),
                min_quantity: isSupplierAd ? parseInt(minQuantity) : 1
            };

            const { error } = await updateProduct(id, updates);

            if (error) {
                console.error("Update error:", error);
                toast({
                    title: "Erro ao atualizar",
                    description: error.message || "Verifique se você tem permissão ou se os dados estão corretos.",
                    variant: "destructive"
                });
            } else {
                toast({ title: "Anúncio atualizado!", description: "As alterações foram salvas com sucesso." });
                navigate("/dashboard");
            }
        } catch (err: any) {
            console.error("Unexpected error:", err);
            toast({
                title: "Erro inesperado",
                description: err.message || "Tente novamente mais tarde.",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="mx-auto max-w-2xl">
                    {/* Header */}
                    <div className="mb-8">
                        <button onClick={() => navigate("/dashboard")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary">
                            <ArrowLeft className="h-4 w-4" />Voltar ao Dashboard
                        </button>
                        <h1 className="font-display text-2xl font-bold text-foreground">Editar Anúncio</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Atualize as informações do seu produto</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Type Display (Read only for edit to avoid complexity) */}
                        <div className="glass-card rounded-xl p-5 bg-secondary/10">
                            <div className="flex items-center gap-3">
                                {isSupplierAd ? <Package className="h-5 w-5 text-primary" /> : <Store className="h-5 w-5 text-primary" />}
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        {isSupplierAd ? "Anúncio de Atacado (B2B)" : "Anúncio de Venda Final"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Tipo de anúncio (não editável)</p>
                                </div>
                            </div>
                        </div>

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
                                    placeholder="Descreva seu produto com detalhes..."
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
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMainCategorySelect("outros")}
                                                className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all"
                                            >
                                                <LayoutGrid className="mb-3 h-8 w-8 text-primary" />
                                                <span className="font-semibold text-foreground">Outros</span>
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
                                                                <span className="text-xs font-medium leading-tight">{cat.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
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
                                        min={0}
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

                        {/* Submit */}
                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                size="lg"
                                className="flex-1 font-display tracking-wider glow-orange"
                                disabled={submitting}
                            >
                                {submitting ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                            <Button type="button" variant="outline" size="lg" onClick={() => navigate("/dashboard")}>
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

export default EditAdPage;
