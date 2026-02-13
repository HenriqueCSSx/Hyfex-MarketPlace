import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Package,
    AlertTriangle,
    CreditCard,
    ShieldCheck,
    Settings,
    Sliders,
    LogOut,
    Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminLayoutProps {
    children: ReactNode;
}

const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Usuários", href: "/admin/users", icon: Users },
    { name: "Anúncios", href: "/admin/products", icon: Package },
    { name: "Disputas", href: "/admin/disputes", icon: AlertTriangle },
    { name: "Assinaturas", href: "/admin/subscriptions", icon: CreditCard },
    { name: "Verificações", href: "/admin/verifications", icon: ShieldCheck },
    { name: "Financeiro", href: "/admin/finance", icon: CreditCard },
    { name: "Algoritmo", href: "/admin/algorithm", icon: Sliders },
    { name: "Configurações", href: "/admin/settings", icon: Settings },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    const location = useLocation();

    return (
        <div className="flex h-screen bg-black">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-800 bg-zinc-950">
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
                        <Gamepad2 className="h-6 w-6 text-orange-500" />
                        <span className="font-display text-lg font-bold">
                            HY<span className="text-orange-500">FEX</span>
                        </span>
                        <span className="ml-auto rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-500">
                            ADMIN
                        </span>
                    </div>

                    {/* Navigation */}
                    <ScrollArea className="flex-1 px-3 py-4">
                        <nav className="space-y-1">
                            {navigation.map((item) => {
                                const isActive = location.pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-orange-500/10 text-orange-500"
                                                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="border-t border-zinc-800 p-4">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                            asChild
                        >
                            <Link to="/">
                                <LogOut className="h-5 w-5" />
                                Sair do Admin
                            </Link>
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="container mx-auto p-8">{children}</div>
            </main>
        </div>
    );
};
