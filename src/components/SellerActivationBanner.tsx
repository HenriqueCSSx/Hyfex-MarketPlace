import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
    requestActivation,
    sendActivationMessage,
    getActivationMessages,
    ActivationMessage,
} from "@/services/activation";
import {
    Rocket,
    Send,
    Image as ImageIcon,
    MessageSquare,
    X,
    CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";

interface Props {
    activationRequested: boolean;
    onActivationRequested: () => void;
    onActivationSuccess: () => void;
}

export function SellerActivationBanner({ activationRequested, onActivationRequested, onActivationSuccess }: Props) {
    const { user } = useAuth();
    const { toast } = useToast();

    // ... existing state ...
    const [showChat, setShowChat] = useState(false);
    const [requested, setRequested] = useState(activationRequested);
    const [messages, setMessages] = useState<ActivationMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setRequested(activationRequested);
    }, [activationRequested]);

    // Realtime subscription (updated logic)
    useEffect(() => {
        if (!user) return; // Listen even if chat is closed to catch activation

        const channel = supabase
            .channel(`seller_activation_chat:${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "activation_chats",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newMessage = payload.new as any;

                    // IF ACTIVATION MESSAGE RECEIVED: Unlock dashboard immediately
                    if (newMessage.message && newMessage.message.includes("Conta ativada com sucesso")) {
                        onActivationSuccess();
                    }

                    // If chat is open and message is from admin, reload chat
                    if (showChat && newMessage.sender_id !== user.id) {
                        loadMessages();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, showChat, onActivationSuccess]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadMessages = async () => {
        if (!user) return;
        setLoadingMessages(true);
        const { data } = await getActivationMessages(user.id);
        setMessages(data || []);
        setLoadingMessages(false);
    };

    const handleRequestActivation = async () => {
        const { error } = await requestActivation();
        if (error) {
            toast({ title: "Erro", description: "Não foi possível enviar a solicitação.", variant: "destructive" });
        } else {
            setRequested(true);
            onActivationRequested();
            toast({ title: "Solicitação Enviada!", description: "Nossa equipe vai analisar em breve." });
            setShowChat(true);
        }
    };

    const handleSend = async () => {
        if (!user || (!newMessage.trim() && !imageFile)) return;

        setSending(true);
        const { error } = await sendActivationMessage(
            user.id,
            newMessage.trim() || undefined,
            imageFile || undefined
        );
        setSending(false);

        if (error) {
            toast({ title: "Erro", description: "Não foi possível enviar a mensagem.", variant: "destructive" });
        } else {
            setNewMessage("");
            setImageFile(null);
            setImagePreview(null);
            loadMessages();
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="mb-10">
            <div className="p-1 rounded-[2rem] bg-gradient-to-r from-primary/50 via-primary/20 to-primary/50 animate-glow-slow">
                <div className="glass-card rounded-[1.9rem] bg-zinc-950/90 border-transparent p-6 md:p-8 overflow-hidden relative">
                    <div className="absolute -right-10 -top-10 opacity-5 bg-primary rounded-full h-40 w-40 blur-3xl pointer-events-none" />

                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="h-16 w-16 shrink-0 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/20">
                                <Rocket className="h-8 w-8" />
                            </div>
                            <div className="text-center md:text-left">
                                <h2 className="text-xl font-black text-white tracking-tight uppercase">
                                    {requested ? "Solicitação Enviada" : "Ative sua conta e venda ilimitadamente"}
                                </h2>
                                <p className="text-sm text-zinc-400 font-medium max-w-lg mt-1">
                                    {requested
                                        ? "Sua solicitação está sendo analisada. Use o chat abaixo para enviar comprovante ou tirar dúvidas."
                                        : "Sua conta está em modo de teste. Pague a taxa mensal de R$ 19,90 para liberar 100% dos recursos e vender sem taxas por transação."
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 relative z-10 shrink-0">
                            {requested ? (
                                <Button
                                    onClick={() => setShowChat(!showChat)}
                                    className="h-14 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-[10px] px-8 rounded-xl transition-all shadow-xl active:scale-95"
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    {showChat ? "Fechar Chat" : "Abrir Chat"}
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleRequestActivation}
                                    className="h-14 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-[10px] px-10 rounded-xl transition-all shadow-xl active:scale-95"
                                >
                                    Solicitar Ativação
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Chat Section */}
                    {showChat && (
                        <div className="mt-6 pt-6 border-t border-white/10 relative z-10">
                            {/* Messages */}
                            <div className="rounded-2xl bg-black/30 border border-white/5 p-4 max-h-[350px] overflow-y-auto space-y-3 mb-4">
                                {loadingMessages ? (
                                    <div className="flex items-center justify-center h-20">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageSquare className="h-6 w-6 text-zinc-700 mx-auto mb-2" />
                                        <p className="text-xs text-zinc-600">
                                            Envie uma mensagem ou o comprovante de pagamento.
                                        </p>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isMine = msg.sender_id === user?.id;
                                        return (
                                            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                                <div className={`max-w-[80%] rounded-2xl p-3 ${isMine
                                                    ? "bg-primary/15 border border-primary/20 rounded-br-md"
                                                    : "bg-white/5 border border-white/10 rounded-bl-md"
                                                    }`}>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isMine ? "text-primary/60" : "text-emerald-400/60"}`}>
                                                        {isMine ? "Você" : (
                                                            <span className="flex items-center gap-1">
                                                                <CheckCircle2 className="h-3 w-3" /> Admin
                                                            </span>
                                                        )}
                                                    </span>
                                                    {msg.image_url && (
                                                        <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block mt-1 mb-1">
                                                            <img
                                                                src={msg.image_url}
                                                                alt="Comprovante"
                                                                className="max-w-full max-h-48 rounded-lg border border-white/10 hover:opacity-80 transition-opacity"
                                                            />
                                                        </a>
                                                    )}
                                                    {msg.message && (
                                                        <p className="text-sm text-zinc-300 whitespace-pre-wrap mt-1">{msg.message}</p>
                                                    )}
                                                    <span className="text-[9px] text-zinc-700 mt-1 block">
                                                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Compose */}
                            {imagePreview && (
                                <div className="mb-3 relative inline-block">
                                    <img src={imagePreview} alt="Preview" className="h-16 rounded-lg border border-white/10" />
                                    <button
                                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-end gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageSelect}
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-zinc-500 hover:text-primary shrink-0 h-10"
                                    title="Anexar imagem (comprovante)"
                                >
                                    <ImageIcon className="h-5 w-5" />
                                </Button>
                                <Textarea
                                    placeholder="Mensagem ou comprovante..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="flex-1 min-h-[44px] max-h-[100px] resize-none bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary/50 text-sm"
                                    rows={1}
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={sending || (!newMessage.trim() && !imageFile)}
                                    className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shrink-0 h-10"
                                >
                                    {sending ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
