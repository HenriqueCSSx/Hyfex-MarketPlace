import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Search, Tag, AlertCircle, Clock, CheckCircle, Send, User, ChevronRight, Shield } from "lucide-react";
import { createTicket, getMyTickets, getTicketMessages, sendTicketMessage, SupportTicket } from "@/services/support";

const categoryOptions = [
    { value: "account", label: "Conta e Login" },
    { value: "technical", label: "Problema Técnico" },
    { value: "billing", label: "Pagamentos e Cobrança" },
    { value: "abuse", label: "Denúncia / Abuso" },
    { value: "general", label: "Dúvidas Gerais" },
    { value: "suggestion", label: "Sugestão" },
];

const priorityOptions = [
    { value: "low", label: "Baixa", color: "bg-blue-500/10 text-blue-500" },
    { value: "medium", label: "Média", color: "bg-yellow-500/10 text-yellow-500" },
    { value: "high", label: "Alta", color: "bg-orange-500/10 text-orange-500" },
    { value: "urgent", label: "Urgente", color: "bg-red-500/10 text-red-500" },
];

const statusMap: any = {
    open: { label: "Aberto", color: "bg-green-500/10 text-green-500", icon: AlertCircle },
    in_progress: { label: "Em Andamento", color: "bg-blue-500/10 text-blue-500", icon: Clock },
    resolved: { label: "Resolvido", color: "bg-gray-500/10 text-gray-500", icon: CheckCircle },
    closed: { label: "Fechado", color: "bg-zinc-800 text-zinc-500", icon: CheckCircle },
};

export default function SupportPage() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Form
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("general");
    const [priority, setPriority] = useState("medium");

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        setLoading(true);
        const { data } = await getMyTickets();
        if (data) setTickets(data);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!subject || !description) {
            toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
            return;
        }

        try {
            const { error } = await createTicket({ subject, description, category, priority });
            if (error) throw error;
            toast({ title: "Sucesso", description: "Ticket criado com sucesso." });
            setIsCreateOpen(false);
            setSubject("");
            setDescription("");
            loadTickets();
        } catch (e) {
            toast({ title: "Erro", description: "Falha ao criar ticket.", variant: "destructive" });
        }
    };

    const openTicket = async (ticket: SupportTicket) => {
        setSelectedTicket(ticket);
        setLoadingMessages(true);
        const { data } = await getTicketMessages(ticket.id);
        if (data) setMessages(data);
        setLoadingMessages(false);
    };

    const handleSendMessage = async () => {
        if (!selectedTicket || !newMessage.trim()) return;

        // Optimistic update
        const tempMsg = {
            id: "temp-" + Date.now(),
            message: newMessage,
            sender_id: user?.id,
            created_at: new Date().toISOString(),
            is_staff: false,
            sender: { name: user?.name }
        };
        setMessages([...messages, tempMsg]);
        setNewMessage("");

        try {
            const { data, error } = await sendTicketMessage(selectedTicket.id, tempMsg.message);
            if (error) throw error;
            // Replace temp with real
            const { data: refreshed } = await getTicketMessages(selectedTicket.id);
            if (refreshed) setMessages(refreshed);
        } catch (e) {
            toast({ title: "Erro", description: "Falha ao enviar mensagem.", variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">Central de Ajuda</h1>
                        <p className="mt-1 text-muted-foreground">Gerencie seus tickets de suporte e tire dúvidas.</p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-primary hover:bg-primary/90">
                                <Plus className="h-4 w-4" /> Novo Ticket
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Abrir Novo Chamado</DialogTitle>
                                <DialogDescription>
                                    Descreva seu problema detalhadamente para que possamos ajudar.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Assunto</label>
                                    <Input
                                        placeholder="Resumo do problema"
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Categoria</label>
                                        <Select value={category} onValueChange={setCategory}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categoryOptions.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Prioridade</label>
                                        <Select value={priority} onValueChange={setPriority}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {priorityOptions.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${opt.color.split(' ')[0].replace('/10', '')}`} />
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Descrição</label>
                                    <Textarea
                                        placeholder="Detalhes do ocorrido..."
                                        rows={5}
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                                <Button onClick={handleCreate}>Enviar Ticket</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Lista de Tickets */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Buscar tickets..." className="pl-9" />
                        </div>

                        <ScrollArea className="h-[600px] pr-4">
                            {loading ? (
                                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                            ) : tickets.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                                    Nenhum ticket encontrado.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tickets.map(ticket => (
                                        <div
                                            key={ticket.id}
                                            onClick={() => openTicket(ticket)}
                                            className={`cursor-pointer rounded-lg border p-4 transition-all hover:bg-secondary/50 ${selectedTicket?.id === ticket.id ? "bg-secondary border-primary/50" : "bg-card border-border"}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className={statusMap[ticket.status]?.color}>
                                                    {statusMap[ticket.status]?.label}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(ticket.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-sm line-clamp-1">{ticket.subject}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{ticket.description}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Detalhes do Ticket */}
                    <div className="lg:col-span-2">
                        {selectedTicket ? (
                            <Card className="h-[650px] flex flex-col border-border bg-card/50 backdrop-blur">
                                <div className="border-b p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
                                            <p className="text-sm text-muted-foreground">Ticket #{selectedTicket.id.slice(0, 8)} • {categoryOptions.find(c => c.value === selectedTicket.category)?.label}</p>
                                        </div>
                                        <Badge className={`${priorityOptions.find(p => p.value === selectedTicket.priority)?.color}`}>
                                            {priorityOptions.find(p => p.value === selectedTicket.priority)?.label}
                                        </Badge>
                                    </div>
                                    <div className="bg-secondary/30 p-4 rounded-md text-sm text-foreground/80">
                                        {selectedTicket.description}
                                    </div>
                                </div>

                                <ScrollArea className="flex-1 p-6">
                                    {loadingMessages ? (
                                        <div className="text-center py-4 text-muted-foreground">Carregando mensagens...</div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">Nenhuma mensagem adicional.</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {messages.map(msg => (
                                                <div key={msg.id} className={`flex items-start gap-3 ${msg.sender_id === user?.id ? "flex-row-reverse" : ""}`}>
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.is_staff ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                                                        {msg.is_staff ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                                    </div>
                                                    <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-zinc-100"}`}>
                                                        <p>{msg.message}</p>
                                                        <span className="text-[10px] opacity-70 mt-1 block w-full text-right">
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>

                                <div className="p-4 border-t bg-background/50">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Digite sua resposta..."
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                            disabled={selectedTicket.status === 'closed'}
                                        />
                                        <Button size="icon" onClick={handleSendMessage} disabled={!newMessage.trim() || selectedTicket.status === 'closed'}>
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <div className="h-[600px] flex items-center justify-center rounded-xl border border-dashed text-muted-foreground bg-card/30">
                                <div className="text-center">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>Selecione um ticket para ver os detalhes</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
