import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserCheck, UserX, UserMinus, Shield, MoreHorizontal, Mail, Calendar } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getAdminUsers, updateUserStatus } from "@/services/admin";
import { toast } from "@/hooks/use-toast";

interface User {
    id: string;
    name: string;
    email: string;
    roles: string[];
    status: string;
    created_at: string;
}

const AdminUsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("all");

    const loadUsers = async () => {
        setLoading(true);
        try {
            const { data } = await getAdminUsers({ search, role: filterRole });
            setUsers(data || []);
        } catch (err) {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao carregar usuários", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(loadUsers, 500);
        return () => clearTimeout(timeout);
    }, [search, filterRole]);

    const handleStatusChange = async (userId: string, status: "active" | "suspended" | "banned") => {
        try {
            const { error } = await updateUserStatus(userId, status);
            if (error) throw error;
            toast({ title: "Status atualizado", description: `Usuário ${status}.` });
            loadUsers();
        } catch (err) {
            toast({ title: "Erro", description: "Falha ao atualizar status", variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-foreground">Gerenciar Usuários</h1>
                        <p className="text-sm text-muted-foreground">Administre contas, permissões e status</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">Exportar CSV</Button>
                        <Button>Adicionar Usuário</Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou email..."
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                    >
                        <option value="all">Todas as Funções</option>
                        <option value="cliente">Clientes</option>
                        <option value="vendedor">Vendedores</option>
                        <option value="fornecedor">Fornecedores</option>
                        <option value="admin">Administradores</option>
                    </select>
                </div>

                {/* Users Table */}
                <div className="rounded-lg border border-border bg-card">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">Nenhum usuário encontrado.</div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b"> {/* Header styling fix */}
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Usuário</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Função</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Cadastro</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {users.map((u) => (
                                        <tr key={u.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                                                        {u.name?.[0] || u.email?.[0] || "?"}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-foreground">{u.name || "Sem nome"}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Mail className="h-3 w-3" /> {u.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex flex-wrap gap-1">
                                                    {u.roles?.map((role: string) => (
                                                        <Badge key={role} variant="outline" className="capitalize">{role}</Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Badge variant={u.status === 'active' ? 'default' : u.status === 'banned' ? 'destructive' : 'secondary'}>
                                                    {u.status === 'active' ? 'Ativo' : u.status === 'banned' ? 'Banido' : 'Suspenso'}
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle text-muted-foreground">
                                                <div className="flex items-center gap-1 text-xs">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(u.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(u.email)}>
                                                            Copiar Email
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleStatusChange(u.id, "active")}>
                                                            <UserCheck className="mr-2 h-4 w-4 text-success" /> Ativar Conta
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(u.id, "suspended")}>
                                                            <UserMinus className="mr-2 h-4 w-4 text-warning" /> Suspender
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(u.id, "banned")} className="text-destructive focus:text-destructive">
                                                            <UserX className="mr-2 h-4 w-4" /> Banir Usuário
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

export default AdminUsersPage;
