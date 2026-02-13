import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const BannedModal: React.FC = () => {
    const { user, logout } = useAuth();
    const isBanned = user?.status === 'banned';

    if (!isBanned) return null;

    return (
        <Dialog open={true}>
            <DialogContent
                className="sm:max-w-[500px] border-red-500/20 bg-zinc-950 p-0 overflow-hidden rounded-[2rem] z-[9999]"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <div className="relative p-8">
                    {/* Background effects */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none" />
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldAlert className="w-32 h-32 text-red-500" />
                    </div>

                    <DialogHeader className="relative space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                <ShieldAlert className="h-6 w-6 text-red-500" />
                            </div>
                            <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-500">
                                Acesso Bloqueado
                            </div>
                        </div>

                        <DialogTitle className="text-3xl font-black text-white tracking-tighter uppercase font-display leading-none">
                            Sua conta foi <span className="text-red-500">Banida</span>
                        </DialogTitle>

                        <DialogDescription className="text-zinc-400 text-sm font-medium leading-relaxed">
                            Lamentamos informar que sua conta foi permanentemente suspensa por violação dos nossos Termos de Serviço ou diretrizes da comunidade.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative mt-8 space-y-6">
                        <div className="glass-card rounded-2xl border-white/5 bg-white/[0.02] p-6">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">O que isso significa?</h4>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-sm text-zinc-300">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                    Você não pode mais anunciar ou comprar produtos.
                                </li>
                                <li className="flex items-start gap-3 text-sm text-zinc-300">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                    Suas mensagens e negociações foram pausadas.
                                </li>
                                <li className="flex items-start gap-3 text-sm text-zinc-300">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                    Saldo e pendências serão analisados pela moderação.
                                </li>
                            </ul>
                        </div>

                        <div className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                                Se você acredita que isso foi um erro, entre em contato com nossa equipe de suporte através dos canais oficiais externos.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="mt-8 flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = "mailto:suporte@hyfex.com"}
                            className="h-12 border-white/10 bg-white/5 text-zinc-400 font-bold uppercase tracking-widest text-[10px] rounded-xl flex-1 hover:bg-white/10"
                        >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Contatar Suporte
                        </Button>
                        <Button
                            onClick={logout}
                            className="h-12 bg-red-500 text-white hover:bg-red-600 font-bold uppercase tracking-widest text-[10px] rounded-xl px-8 transition-all shadow-xl flex-1 flex items-center justify-center gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            Sair da Conta
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};
