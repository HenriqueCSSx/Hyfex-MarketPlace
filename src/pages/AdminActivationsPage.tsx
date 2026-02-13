import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
    getActivationRequests,
    getActivationMessages,
    sendActivationMessage,
    activateUserAccount,
    ActivationRequest,
    ActivationMessage,
} from "@/services/activation";
import { supabase } from "@/lib/supabase";
import {
    Users,
    MessageSquare,
    CheckCircle2,
    Clock,
    Send,
    Image as ImageIcon,
    ArrowLeft,
    ShieldCheck,
    X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminActivationsPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [requests, setRequests] = useState<ActivationRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Chat state
    const [selectedUser, setSelectedUser] = useState<ActivationRequest | null>(null);
    const [messages, setMessages] = useState<ActivationMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadRequests();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadRequests = async () => {
        setLoading(true);
        const { data } = await getActivationRequests();
        setRequests(data || []);
        setLoading(false);
    };

    const openChat = async (req: ActivationRequest) => {
        setSelectedUser(req);
        setLoadingMessages(true);
        const { data } = await getActivationMessages(req.id);
        setMessages(data || []);
        setLoadingMessages(false);
    };

    // Realtime subscription for messages
    useEffect(() => {
        if (!selectedUser) return;

        const channel = supabase
            .channel(`activation_chat:${selectedUser.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "activation_chats",
                    filter: `user_id=eq.${selectedUser.id}`,
                },
                (payload) => {
                    // Fetch profile for the new message sender to display name/avatar
                    const newMessage = payload.new as { sender_id: string };
                    // We need to fetch the sender's info manually or optimistically update if it's us
                    if (newMessage.sender_id === user?.id) {
                        // Already updated optimistically or by reload, but to be safe:
                        // We typically wait for the insert response, so we might get a duplicate if we just push.
                        // But for incoming messages from the OTHER user, we need this.
                    } else {
                        // Incoming message from seller
                        getActivationMessages(selectedUser.id).then(({ data }) => {
                            if (data) setMessages(data);
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedUser, user]);

    // Simple optimistic update and refresh on send
    const handleSend = async () => {
        if (!selectedUser || (!newMessage.trim() && !imageFile)) return;

        // Optimistic update
        // (Skipping complex optimistic UI for now to ensure reliability first)

        setSending(true);
        const { error } = await sendActivationMessage(
            selectedUser.id,
            newMessage.trim() || undefined,
            imageFile || undefined
        );
        setSending(false);

        if (error) {
            console.error("Send error:", error);
            toast({ title: "Erro", description: "Não foi possível enviar a mensagem. Verifique a conexão.", variant: "destructive" });
        } else {
            setNewMessage("");
            setImageFile(null);
            setImagePreview(null);
            // Always refresh to get the server state
            const { data } = await getActivationMessages(selectedUser.id);
            setMessages(data || []);
        }
    };

    const handleActivate = async () => {
        if (!selectedUser) return;
        const confirmed = window.confirm(`Tem certeza que deseja ATIVAR a conta de ${selectedUser.name}?`);
        if (!confirmed) return;

        const { error } = await activateUserAccount(selectedUser.id);
        if (error) {
            toast({ title: "Erro", description: "Não foi possível ativar a conta.", variant: "destructive" });
        } else {
            toast({ title: "Conta Ativada!", description: `${selectedUser.name} agora pode vender sem restrições.` });
            // Send a confirmation message
            await sendActivationMessage(selectedUser.id, "✅ Conta ativada com sucesso!\n\n⚠️ INFORMAÇÃO IMPORTANTE:\nA plataforma estará liberada para compras de clientes na SEGUNDA-FEIRA.\n\nEste período está reservado para que vendedores e fornecedores possam cadastrar seus serviços e configurar suas contas com calma.\n\nBoas vendas!");
            setSelectedUser(null);
            loadRequests();
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

    // Chat view
    if (selectedUser) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col container mx-auto px-4 py-4 max-w-4xl">
                    {/* Chat Header */}
                    <div className="glass-card rounded-2xl border-white/10 p-4 mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedUser(null)}
                                className="text-zinc-400"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-sm">
                                {selectedUser.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">{selectedUser.name}</p>
                                <p className="text-[10px] text-zinc-500">{selectedUser.email}</p>
                            </div>
                            <Badge variant={selectedUser.status === "active" ? "default" : "secondary"} className="text-[10px]">
                                {selectedUser.status === "active" ? "Ativo" : "Pendente"}
                            </Badge>
                        </div>
                        {selectedUser.status !== "active" && (
                            <Button
                                onClick={handleActivate}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs gap-2 rounded-xl"
                            >
                                <CheckCircle2 className="h-4 w-4" /> Ativar Conta
                            </Button>
                        )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 glass-card rounded-2xl border-white/10 p-6 mb-4 overflow-y-auto max-h-[55vh] space-y-4">
                        {loadingMessages ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-center">
                                <MessageSquare className="h-8 w-8 text-zinc-700 mb-3" />
                                <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Nenhuma mensagem ainda</p>
                                <p className="text-xs text-zinc-700 mt-1">Envie uma mensagem para iniciar a conversa.</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isAdmin = msg.sender_id === user?.id;
                                return (
                                    <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[75%] rounded-2xl p-4 ${isAdmin
                                            ? "bg-primary/20 border border-primary/30 rounded-br-md"
                                            : "bg-white/5 border border-white/10 rounded-bl-md"
                                            }`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isAdmin ? "text-primary" : "text-zinc-400"}`}>
                                                    {isAdmin ? "Você (Admin)" : msg.sender?.name || "Vendedor"}
                                                </span>
                                            </div>
                                            {msg.image_url && (
                                                <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                                                    <img
                                                        src={msg.image_url}
                                                        alt="Comprovante"
                                                        className="max-w-full max-h-64 rounded-xl border border-white/10 hover:opacity-80 transition-opacity cursor-pointer"
                                                    />
                                                </a>
                                            )}
                                            {msg.message && (
                                                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{msg.message}</p>
                                            )}
                                            <span className="text-[10px] text-zinc-600 mt-2 block">
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
                    <div className="glass-card rounded-2xl border-white/10 p-4">
                        {imagePreview && (
                            <div className="mb-3 relative inline-block">
                                <img src={imagePreview} alt="Preview" className="h-20 rounded-xl border border-white/10" />
                                <button
                                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        )}
                        <div className="flex items-end gap-3">
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
                                className="text-zinc-400 hover:text-primary shrink-0"
                            >
                                <ImageIcon className="h-5 w-5" />
                            </Button>
                            <Textarea
                                placeholder="Escreva uma mensagem..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 min-h-[50px] max-h-[120px] resize-none bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary/50"
                                rows={1}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={sending || (!newMessage.trim() && !imageFile)}
                                className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shrink-0"
                            >
                                {sending ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // List view
    return (
        <div className="min-h-screen bg-background pb-12">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-3">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        Ativações de Conta
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gerencie solicitações de ativação e converse com vendedores.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="glass-card rounded-2xl border-white/10 p-12 text-center">
                        <Users className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
                        <p className="text-sm font-bold text-zinc-500">Nenhuma solicitação de ativação pendente.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {requests.map((req) => (
                            <button
                                key={req.id}
                                onClick={() => openChat(req)}
                                className="glass-card rounded-2xl border-white/10 p-6 hover:bg-white/[0.03] transition-all text-left w-full group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary">
                                            {req.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm group-hover:text-primary transition-colors">
                                                {req.name}
                                            </p>
                                            <p className="text-xs text-zinc-500">{req.email}</p>
                                            {req.last_message && (
                                                <p className="text-xs text-zinc-600 mt-1 truncate max-w-md">
                                                    {req.last_message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            variant={req.status === "active" ? "default" : "secondary"}
                                            className={`text-[10px] ${req.status === "active"
                                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                                }`}
                                        >
                                            {req.status === "active" ? (
                                                <><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</>
                                            ) : (
                                                <><Clock className="h-3 w-3 mr-1" /> Pendente</>
                                            )}
                                        </Badge>
                                        {req.last_message_at && (
                                            <span className="text-[10px] text-zinc-600">
                                                {formatDistanceToNow(new Date(req.last_message_at), { addSuffix: true, locale: ptBR })}
                                            </span>
                                        )}
                                        <MessageSquare className="h-4 w-4 text-zinc-600 group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminActivationsPage;
