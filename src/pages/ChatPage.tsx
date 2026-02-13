import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Navigate, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle, Send, Search, ArrowLeft, User, Star,
  Package, Clock, CheckCheck, Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getConversations, getMessages, sendMessage, markAsRead, createConversation, ChatConversation, ChatMessage } from "@/services/chat";
import { supabase } from "@/lib/supabase";

const ChatPage = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<string | null>(searchParams.get("id") || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Handle incoming navigation from Product Detail
  useEffect(() => {
    const initChat = async () => {
      if (location.state?.recipientId) {
        const { recipientId, productId } = location.state;
        // Check if we already have this conversation loaded to avoid flicker? 
        // Ideally createConversation handles find-or-create efficiently.
        const { data, error } = await createConversation(recipientId, productId);
        if (data) {
          setSelectedChat(data.id);
          // Update URL without reload
          setSearchParams({ id: data.id });
          // Clear state so we don't re-run on refresh if not intended? 
          // Actually location.state persists on refresh in some browsers, but let's leave it.
        }
      }
    };

    if (isAuthenticated && location.state?.recipientId) {
      initChat();
    }
  }, [location.state, isAuthenticated]);

  useEffect(() => {
    loadConversations();

    // Subscribe to new conversations or updates
    const channel = supabase
      .channel('public:conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
      markAsRead(selectedChat);
      setMobileShowChat(true);

      // Subscribe to new messages for this conversation
      const channel = supabase
        .channel(`chat:${selectedChat}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedChat}`
        }, (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => [...prev, {
            id: newMsg.id,
            senderId: newMsg.sender_id === user?.id ? "me" : "other",
            text: newMsg.content,
            timestamp: new Date(newMsg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            read: false,
            createdAt: newMsg.created_at
          }]);
          scrollToBottom();
          if (newMsg.sender_id !== user?.id) {
            markAsRead(selectedChat);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChat]);

  const loadConversations = async () => {
    const { data } = await getConversations();
    if (data) {
      setConversations(data);
    }
    setLoading(false);
  };

  const loadMessages = async (id: string) => {
    const { data } = await getMessages(id);
    if (data) {
      setMessages(data);
      scrollToBottom();
    }
  };

  const filtered = conversations.filter(
    (c) =>
      c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.productTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConversation = conversations.find((c) => c.id === selectedChat);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const msgContent = newMessage.trim();
    setNewMessage("");

    // Send to backend
    const { error } = await sendMessage(selectedChat, msgContent);

    if (error) {
      // Handle error (maybe toast)
      console.error("Error sending message:", error);
    } else {
      // Refresh conversations to update last message
      loadConversations();
    }
  };

  if (!isAuthenticated) return <Navigate to="/auth" />;

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground">Mensagens</h1>
          {totalUnread > 0 && (
            <Badge className="bg-primary text-primary-foreground">{totalUnread}</Badge>
          )}
        </div>

        <div className="glass-card flex h-[calc(100vh-180px)] overflow-hidden rounded-xl border border-border">
          {/* Conversation List */}
          <div
            className={`w-full flex-shrink-0 border-r border-border md:w-80 lg:w-96 ${mobileShowChat ? "hidden md:flex" : "flex"
              } flex-col`}
          >
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Carregando...</div>
              ) : filtered.length > 0 ? (
                filtered.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedChat(conv.id)}
                    className={`flex w-full items-start gap-3 border-b border-border p-4 text-left transition-colors hover:bg-secondary/50 ${selectedChat === conv.id ? "bg-secondary" : ""
                      }`}
                  >
                    {conv.productImage ? (
                      <img
                        src={conv.productImage}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">
                          {conv.participantName}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground whitespace-nowrap">
                          {conv.lastMessageTime}
                        </span>
                      </div>
                      {conv.productTitle && (
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <Package className="h-3 w-3" />
                          <span className="truncate">{conv.productTitle}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="truncate text-xs text-muted-foreground">{conv.lastMessage}</p>
                        {conv.unread > 0 && (
                          <Badge className="ml-2 h-5 min-w-[20px] bg-primary px-1.5 text-[10px] text-primary-foreground">
                            {conv.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageCircle className="mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div
            className={`flex flex-1 flex-col ${!mobileShowChat ? "hidden md:flex" : "flex"
              }`}
          >
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden"
                  >
                    <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                  </button>
                  {activeConversation.productImage ? (
                    <img
                      src={activeConversation.productImage}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {activeConversation.participantName}
                      </h3>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {activeConversation.participantRole}
                      </Badge>
                    </div>
                    {activeConversation.productTitle && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Package className="h-3 w-3" />
                        <span className="truncate">{activeConversation.productTitle}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 px-4 py-3">
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isMe = msg.senderId === "me";
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-secondary text-foreground rounded-bl-md"
                              }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                            <div
                              className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                                }`}
                            >
                              <Clock className="h-3 w-3" />
                              <span>{msg.timestamp}</span>
                              {isMe && <CheckCheck className={`h-3 w-3 ${msg.read ? "text-primary-foreground" : "text-primary-foreground/40"}`} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t border-border p-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => toast({ title: "Em breve", description: "Envio de imagens estará disponível na próxima atualização." })}
                    >
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim()} className="shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <MessageCircle className="mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="font-display text-lg text-muted-foreground">Selecione uma conversa</p>
                <p className="text-sm text-muted-foreground/60">
                  Escolha uma conversa ao lado para começar
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
