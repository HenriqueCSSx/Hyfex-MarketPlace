import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createQuestion, getProductQuestions, answerQuestion } from "@/services/questions";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Reply, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Question {
    id: string;
    question: string;
    answer?: string;
    answered_at?: string;
    created_at: string;
    user?: { name: string };
}

export function ProductQuestions({ productId, sellerId }: { productId: string; sellerId: string }) {
    const { user, isAuthenticated } = useAuth();
    const { toast } = useToast();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [newQuestion, setNewQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Seller answer state
    const [answeringId, setAnsweringId] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState("");
    const [submittingAnswer, setSubmittingAnswer] = useState(false);

    useEffect(() => {
        loadQuestions();
    }, [productId]);

    const loadQuestions = async () => {
        setLoading(true);
        const { data } = await getProductQuestions(productId);
        if (data) setQuestions(data);
        setLoading(false);
    };

    const handleAsk = async () => {
        if (!newQuestion.trim()) return;
        setSubmitting(true);
        const { error } = await createQuestion(productId, newQuestion);
        setSubmitting(false);

        if (error) {
            toast({ title: "Erro", description: "Não foi possível enviar sua pergunta.", variant: "destructive" });
        } else {
            toast({ title: "Pergunta enviada!", description: "O vendedor será notificado." });
            setNewQuestion("");
            loadQuestions();
        }
    };

    const handleAnswer = async (questionId: string) => {
        if (!answerText.trim()) return;
        setSubmittingAnswer(true);
        const { error } = await answerQuestion(questionId, answerText);
        setSubmittingAnswer(false);

        if (error) {
            toast({ title: "Erro", description: "Não foi possível enviar a resposta.", variant: "destructive" });
        } else {
            toast({ title: "Resposta enviada!", description: "O comprador poderá ver sua resposta." });
            setAnsweringId(null);
            setAnswerText("");
            loadQuestions();
        }
    };

    const isSeller = user?.id === sellerId;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-display font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Perguntas e Respostas
                {questions.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">({questions.length})</span>
                )}
            </h3>

            {/* Ask Form — only for non-sellers (customers) */}
            {!isSeller && (
                <div className="glass-card rounded-2xl border-white/10 p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 mb-3">
                        Faça uma pergunta ao vendedor
                    </p>
                    <div className="flex gap-3 items-end">
                        <Textarea
                            placeholder={isAuthenticated ? "Escreva sua dúvida sobre o produto..." : "Faça login para perguntar"}
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            disabled={!isAuthenticated || submitting}
                            className="flex-1 min-h-[80px] resize-none bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary/50"
                        />
                        <Button
                            onClick={handleAsk}
                            disabled={!isAuthenticated || submitting || !newQuestion.trim()}
                            className="h-12 px-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl"
                        >
                            {submitting ? (
                                "Enviando..."
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Send className="h-4 w-4" /> Perguntar
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : questions.length === 0 ? (
                    <div className="py-10 text-center rounded-2xl border border-dashed border-white/10">
                        <MessageCircle className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">
                            Nenhuma pergunta ainda. Seja o primeiro!
                        </p>
                    </div>
                ) : (
                    questions.map((q) => (
                        <div key={q.id} className="glass-card rounded-2xl border-white/10 p-6 hover:bg-white/[0.02] transition-colors">
                            {/* Question */}
                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-white/5 flex items-center justify-center shrink-0 mt-0.5">
                                    <User className="h-4 w-4 text-zinc-400" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white">{q.user?.name || "Usuário"}</span>
                                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                            {formatDistanceToNow(new Date(q.created_at), { addSuffix: true, locale: ptBR })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-300">{q.question}</p>
                                </div>
                            </div>

                            {/* Answer */}
                            {q.answer && (
                                <div className="mt-4 ml-11 pl-4 border-l-2 border-primary/30 bg-primary/5 rounded-r-xl p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Reply className="h-3.5 w-3.5 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">
                                            Resposta do Vendedor
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-300">{q.answer}</p>
                                </div>
                            )}

                            {/* Answer Form for Seller */}
                            {isSeller && !q.answer && (
                                <div className="mt-4 ml-11">
                                    {answeringId === q.id ? (
                                        <div className="space-y-3">
                                            <Textarea
                                                placeholder="Escreva sua resposta..."
                                                value={answerText}
                                                onChange={(e) => setAnswerText(e.target.value)}
                                                className="min-h-[70px] resize-none bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary/50"
                                                autoFocus
                                            />
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAnswer(q.id)}
                                                    disabled={submittingAnswer || !answerText.trim()}
                                                    className="bg-primary hover:bg-primary/90 text-white font-bold rounded-lg text-xs"
                                                >
                                                    {submittingAnswer ? "Enviando..." : "Enviar Resposta"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => { setAnsweringId(null); setAnswerText(""); }}
                                                    className="text-zinc-400 text-xs"
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => { setAnsweringId(q.id); setAnswerText(""); }}
                                            className="border-primary/30 text-primary hover:bg-primary/10 rounded-lg text-xs gap-2"
                                        >
                                            <Reply className="h-3.5 w-3.5" /> Responder
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
