import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Search, CheckCircle, XCircle, AlertCircle, Eye, Star, Edit } from "lucide-react";
import { getAdminProducts, updateProductStatus, toggleProductFeatured } from "@/services/admin";
import { toast } from "@/hooks/use-toast";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

interface Product {
    id: string;
    title: string;
    image_url: string;
    price: number;
    status: string;
    featured: boolean;
    category?: { name: string };
    seller?: { name: string };
    created_at?: string;
}

const AdminProductsPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
    const [typeFilter, setTypeFilter] = useState("all");

    const loadProducts = async () => {
        setLoading(true);
        try {
            const { data } = await getAdminProducts({ search, status: statusFilter, type: typeFilter });
            setProducts(data || []);
        } catch (err) {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao carregar produtos", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(loadProducts, 500);
        return () => clearTimeout(t);
    }, [search, statusFilter, typeFilter]);

    const handleStatus = async (id: string, status: "approved" | "rejected" | "removed") => {
        try {
            await updateProductStatus(id, status);
            toast({ title: "Sucesso", description: `Produto ${status === 'approved' ? 'aprovado' : status}.` });
            loadProducts();
        } catch (err) {
            toast({ title: "Erro", description: "Falha ao atualizar status", variant: "destructive" });
        }
    };

    const handleToggleFeatured = async (id: string, current: boolean) => {
        try {
            await toggleProductFeatured(id, !current);
            toast({ title: "Sucesso", description: `Produto ${!current ? 'destacado' : 'removido dos destaques'}.` });
            loadProducts();
        } catch (err) {
            toast({ title: "Erro", description: "Falha ao atualizar destaque", variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="font-display text-2xl font-bold text-foreground">Gerenciar Produtos</h1>
                    <p className="text-sm text-muted-foreground">Aprovação, moderação e destaque de anúncios</p>
                </div>

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar produtos..."
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Todos os Status</option>
                        <option value="pending">Pendentes</option>
                        <option value="approved">Aprovados</option>
                        <option value="rejected">Rejeitados</option>
                    </select>
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="all">Todos os Tipos</option>
                        <option value="venda_final">Varejo</option>
                        <option value="fornecedor">Atacado</option>
                    </select>
                </div>

                <div className="rounded-lg border border-border bg-card">
                    {loading ? (
                        <div className="p-8 text-center">Carregando...</div>
                    ) : products.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">Nenhum produto encontrado.</div>
                    ) : (
                        <div className="w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Produto</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Vendedor</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Preço</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((p) => (
                                        <tr key={p.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 overflow-hidden rounded bg-secondary">
                                                        {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-foreground line-clamp-1">{p.title}</div>
                                                        <div className="text-xs text-muted-foreground">{p.category?.name || "Sem categoria"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="text-sm">{p.seller?.name || "Unknown"}</div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Badge variant={p.status === 'approved' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'}>
                                                    {p.status}
                                                </Badge>
                                                {p.featured && <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-500">Destaque</Badge>}
                                            </td>
                                            <td className="p-4 align-middle">
                                                R$ {p.price?.toFixed(2)}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => navigate(`/edit-ad/${p.id}`)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Editar Anúncio
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link to={`/product/${p.id}`} target="_blank">
                                                                <Eye className="mr-2 h-4 w-4" /> Ver Página
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleFeatured(p.id, p.featured)}>
                                                            <Star className="mr-2 h-4 w-4 text-yellow-500" /> {p.featured ? "Remover Destaque" : "Destacar"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleStatus(p.id, "approved")}>
                                                            <CheckCircle className="mr-2 h-4 w-4 text-success" /> Aprovar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatus(p.id, "rejected")}>
                                                            <XCircle className="mr-2 h-4 w-4 text-destructive" /> Rejeitar
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
        </div>
    );
};

export default AdminProductsPage;
