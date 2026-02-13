import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import {
  Gamepad2, LogOut, ChevronDown, LayoutDashboard, Store, Package,
  ShoppingBag, User, MessageCircle, Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { user, logout, switchRole, isAuthenticated } = useAuth();
  const { unreadMessages } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const roleLabels = {
    cliente: "Cliente",
    vendedor: "Vendedor",
    fornecedor: "Fornecedor",
  };

  const roleIcons = {
    cliente: ShoppingBag,
    vendedor: Store,
    fornecedor: Package,
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-background/60 backdrop-blur-2xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <Link to={isAuthenticated ? "/marketplace" : "/"} className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center transition-all duration-300 group-hover:glow-orange">
            <Gamepad2 className="h-6 w-6 text-white" />
          </div>
          <span className="font-display text-xl font-black tracking-tighter text-white">
            HY<span className="text-primary">FEX</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            to="/marketplace"
            className={`text-xs font-bold uppercase tracking-widest transition-all hover:text-primary ${location.pathname === "/marketplace" ? "text-primary" : "text-zinc-400"
              }`}
          >
            Marketplace
          </Link>

          {isAuthenticated && (user?.activeRole === "vendedor" || user?.activeRole === "fornecedor") && (
            <>
              <Link
                to="/dashboard"
                className={`text-xs font-bold uppercase tracking-widest transition-all hover:text-primary ${location.pathname === "/dashboard" ? "text-primary" : "text-zinc-400"
                  }`}
              >
                Dashboard
              </Link>
              <Link to="/create-ad">
                <Button size="sm" className="h-9 bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-[0.1em] text-[10px] px-4 rounded-lg transition-all active:scale-95">
                  Anunciar
                </Button>
              </Link>
            </>
          )}

          {isAuthenticated && user?.isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-all hover:text-primary ${location.pathname.startsWith("/admin") ? "text-primary" : "text-zinc-400"
                }`}
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Messages indicator */}
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 relative" asChild>
                <Link to="/chat">
                  <MessageCircle className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-primary" />
                  )}
                </Link>
              </Button>

              {/* Notifications Popover */}
              <NotificationsPopover />

              <div className="h-6 w-[1px] bg-white/10 mx-1" />

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 p-1 rounded-xl hover:bg-white/5 transition-all group">
                    <div className="relative h-9 w-9">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="h-full w-full rounded-lg object-cover border border-white/10 group-hover:border-primary/50 transition-colors" />
                      ) : (
                        <div className="h-full w-full rounded-lg bg-zinc-800 flex items-center justify-center border border-white/10">
                          <User className="h-5 w-5 text-zinc-500" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background border border-white/10 flex items-center justify-center">
                        {(() => {
                          const Icon = roleIcons[user.activeRole];
                          return <Icon className="h-[10px] w-[10px] text-primary" />;
                        })()}
                      </div>
                    </div>
                    <div className="hidden lg:flex flex-col items-start pr-2">
                      <span className="text-[11px] font-bold text-white tracking-tight">{user.name}</span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{roleLabels[user.activeRole]}</span>
                    </div>
                    <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-zinc-600 transition-transform group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 glass-card rounded-2xl border-white/10 p-1.5 shadow-2xl animate-in fade-in zoom-in duration-300">
                  <div className="px-2 py-2 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 ml-1">Central do Usuário</p>
                  </div>

                  <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer">
                    <Link to="/dashboard" className="flex items-center">
                      <LayoutDashboard className="mr-3 h-4 w-4 text-primary" />
                      <span className="text-sm font-bold text-zinc-300">Dashboard</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer">
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-3 h-4 w-4 text-primary" />
                      <span className="text-sm font-bold text-zinc-300">Meu Perfil</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer">
                    <Link to="/chat" className="flex items-center">
                      <MessageCircle className="mr-3 h-4 w-4 text-primary" />
                      <span className="text-sm font-bold text-zinc-300">Mensagens</span>
                    </Link>
                  </DropdownMenuItem>

                  {user.roles.length > 1 && (
                    <>
                      <DropdownMenuSeparator className="bg-white/5 my-1.5" />
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-600">Trocar Perfil</div>
                      {user.roles.map((role) => (
                        <DropdownMenuItem
                          key={role}
                          onClick={() => switchRole(role)}
                          className={`rounded-xl py-2 pr-2 mb-0.5 cursor-pointer ${role === user.activeRole ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-zinc-500"
                            }`}
                        >
                          {(() => {
                            const Icon = roleIcons[role];
                            return <Icon className="mr-3 h-4 w-4" />;
                          })()}
                          <span className="text-sm font-bold">{roleLabels[role]}</span>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}

                  <DropdownMenuSeparator className="bg-white/5 my-1.5" />
                  <DropdownMenuItem onClick={logout} className="rounded-xl py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="text-sm font-bold">Sair com Segurança</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white rounded-xl">
                <Link to="/auth">Login</Link>
              </Button>
              <Button size="sm" asChild className="h-9 bg-primary text-white hover:bg-primary/90 hover:glow-orange font-bold uppercase tracking-widest text-[10px] px-5 rounded-xl transition-all shadow-lg active:scale-95">
                <Link to="/auth?mode=register">Começar Agora</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
