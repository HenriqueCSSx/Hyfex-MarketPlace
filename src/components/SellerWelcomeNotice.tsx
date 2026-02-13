
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PartyPopper, Rocket, ShieldCheck, MessageCircle, Check, Star } from "lucide-react";

interface SellerWelcomeNoticeProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
}

export const SellerWelcomeNotice: React.FC<SellerWelcomeNoticeProps> = ({ isOpen, onClose, userName }) => {
    const whatsappNumber = "+5571996683226";
    const message = encodeURIComponent(`Olá! Gostaria de liberar minha conta de vendedor na Hyfex.`);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace("+", "")}?text=${message}`;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] border-white/10 bg-zinc-950 p-0 overflow-hidden rounded-[2rem]">
                <div className="relative p-8">
                    {/* Background effects */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Rocket className="w-32 h-32 text-primary" />
                    </div>

                    <DialogHeader className="relative space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <PartyPopper className="h-6 w-6 text-primary" />
                            </div>
                            <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest px-3">
                                Boas-vindas
                            </Badge>
                        </div>

                        <DialogTitle className="text-3xl font-black text-white tracking-tighter uppercase font-display leading-none">
                            Bem-vindo à <span className="text-gradient">Hyfex</span>, {userName}!
                        </DialogTitle>

                        <DialogDescription className="text-zinc-400 text-sm font-medium leading-relaxed">
                            Sua jornada como vendedor ou fornecedor começa agora. Estamos felizes em ter você como parceiro da nossa comunidade.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative mt-8 space-y-6">
                        <div className="glass-card rounded-2xl border-white/5 bg-white/[0.02] p-6 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="h-8 w-8 shrink-0 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                    <Star className="h-4 w-4 text-green-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">Zero Taxa de Venda</h4>
                                    <p className="text-xs text-zinc-500 mt-1">Diferente de outros marketplaces, a Hyfex não retém nenhuma porcentagem das suas vendas. 100% do lucro é seu.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="h-8 w-8 shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">Vendas Ilimitadas</h4>
                                    <p className="text-xs text-zinc-500 mt-1">Ao ativar sua conta, você pode cadastrar quantos produtos desejar e vender sem limites de transação.</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center p-6 rounded-2xl bg-primary/5 border border-primary/10">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Taxa de Manutenção</p>
                            <div className="text-3xl font-black text-white tracking-tighter">
                                R$ 19,90 <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">/ mensal</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-2 font-medium">Investimento único para acesso total a todos os recursos da plataforma.</p>
                        </div>
                    </div>

                    <DialogFooter className="mt-8 flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="h-12 border-white/10 bg-white/5 text-zinc-400 font-bold uppercase tracking-widest text-[10px] rounded-xl flex-1 hover:bg-white/10 order-2 sm:order-1"
                        >
                            Depois
                        </Button>
                        <Button
                            className="h-12 bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-widest text-[10px] rounded-xl px-8 transition-all shadow-xl flex-1 flex items-center justify-center gap-2 order-1 sm:order-2"
                            asChild
                        >
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                Liberar Minha Conta
                            </a>
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};
