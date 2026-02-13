import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PartyPopper, Rocket, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";

interface SellerApprovedModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
}

export const SellerApprovedModal: React.FC<SellerApprovedModalProps> = ({ isOpen, onClose, userName }) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] border-emerald-500/20 bg-zinc-950 p-0 overflow-hidden rounded-[2rem]">
                <div className="relative p-8">
                    {/* Background effects */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

                    <DialogHeader className="relative space-y-4 text-center items-center">
                        <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-2 animate-bounce-slow">
                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                        </div>

                        <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                            Conta Verificada
                        </Badge>

                        <DialogTitle className="text-3xl font-black text-white tracking-tighter uppercase font-display leading-none">
                            Tudo Pronto, <span className="text-emerald-400">{userName}</span>!
                        </DialogTitle>

                        <DialogDescription className="text-zinc-400 text-sm font-medium leading-relaxed max-w-sm mx-auto">
                            Sua conta foi ativada com sucesso. Você já pode acessar todos os recursos de vendedor.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative mt-8 space-y-4">
                        <div className="glass-card rounded-2xl border-amber-500/20 bg-amber-500/5 p-6 animate-pulse-slow">
                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-amber-500 uppercase tracking-tight">Informação Importante</h4>
                                    <p className="text-sm text-zinc-300 mt-2 leading-relaxed">
                                        A plataforma estará liberada para compras de clientes na <strong className="text-white">SEGUNDA-FEIRA</strong>.
                                    </p>
                                    <div className="mt-4 p-3 bg-black/20 rounded-xl border border-white/5">
                                        <p className="text-xs text-zinc-400">
                                            Aproveite este período exclusivo para cadastrar seus serviços, configurar sua loja e deixar tudo pronto para o lançamento!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-8">
                        <Button
                            onClick={onClose}
                            className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                        >
                            Entendi, vamos começar!
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};
