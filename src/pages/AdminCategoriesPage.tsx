import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCategories } from "@/services/products";
import { createCategory, updateCategory, deleteCategory } from "@/services/admin";
import { uploadImage } from "@/services/storage";
import { toast } from "@/hooks/use-toast";
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Tag, ImagePlus, ArrowLeft } from "lucide-react";

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    image_url?: string;
    description?: string;
    created_at?: string;
}

export default function AdminCategoriesPage() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: "", slug: "", icon: "", image_url: "" });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data } = await getCategories();
            setCategories(data || []);
        } catch (err) {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao carregar categorias", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                slug: category.slug,
                icon: category.icon || "",
                image_url: category.image_url || ""
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: "", slug: "", icon: "", image_url: "" });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.slug) {
            toast({ title: "Erro", description: "Nome e Slug são obrigatórios.", variant: "destructive" });
            return;
        }

        try {
            if (editingCategory) {
                const { error } = await updateCategory(editingCategory.id, formData);
                if (error) throw error;
                toast({ title: "Sucesso", description: "Categoria atualizada." });
            } else {
                const { error } = await createCategory(formData);
                if (error) throw error;
                toast({ title: "Sucesso", description: "Categoria criada." });
            }
            setIsDialogOpen(false);
            loadData();
        } catch (err) {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao salvar categoria.", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
        try {
            const { error } = await deleteCategory(id);
            if (error) throw error;
            toast({ title: "Sucesso", description: "Categoria excluída." });
            loadData();
        } catch (err) {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao excluir categoria.", variant: "destructive" });
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase())
    );

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (fileInputRef.current) fileInputRef.current.value = "";

        setUploading(true);
        const { publicUrl, error } = await uploadImage(file);
        setUploading(false);

        if (error) {
            toast({
                title: "Erro no upload",
                description: error,
                variant: "destructive"
            });
        } else if (publicUrl) {
            setFormData({ ...formData, image_url: publicUrl });
            toast({ title: "Sucesso", description: "Capa enviada com sucesso!" });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="font-display text-2xl font-bold text-foreground">Gerenciar Categorias</h1>
                            <p className="text-sm text-muted-foreground">Adicione e edite categorias de produtos</p>
                        </div>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" /> Nova Categoria
                    </Button>
                </div>

                <div className="mb-6 max-w-sm relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar categorias..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="rounded-lg border border-border bg-card">
                    {loading ? (
                        <div className="p-8 text-center">Carregando...</div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">Nenhuma categoria encontrada.</div>
                    ) : (
                        <div className="w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Nome</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Slug</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Ícone (Classe)</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCategories.map((cat) => (
                                        <tr key={cat.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Tag className="h-4 w-4 text-primary" />
                                                    {cat.name}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-muted-foreground">{cat.slug}</td>
                                            <td className="p-4 align-middle text-muted-foreground">{cat.icon || "-"}</td>
                                            <td className="p-4 align-middle text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleOpenDialog(cat)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(cat.id)} className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="name" className="text-sm font-medium">Nome</label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => {
                                    // Auto-generate slug from name if creating new
                                    const name = e.target.value;
                                    setFormData(prev => ({
                                        ...prev,
                                        name,
                                        slug: !editingCategory ? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : prev.slug
                                    }));
                                }}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="slug" className="text-sm font-medium">Slug (URL)</label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="icon" className="text-sm font-medium">Ícone (Nome da classe ou componente)</label>
                            <Input
                                id="icon"
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                placeholder="ex: Gamepad2"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Capa da Categoria</label>
                            <p className="text-xs text-muted-foreground">Use a imagem na proporção original. Recomendado: <strong>1080px</strong> de largura mínima.</p>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                            <div className="flex gap-2">
                                <Input
                                    id="image_url"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="Ou cole a URL..."
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="shrink-0"
                                >
                                    {uploading ? "..." : <ImagePlus className="h-4 w-4" />}
                                </Button>
                            </div>
                            {formData.image_url && (
                                <div className="mt-2 w-full max-w-[200px] overflow-hidden rounded-lg border border-border bg-muted">
                                    <img src={formData.image_url} alt="Preview" className="h-full w-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
