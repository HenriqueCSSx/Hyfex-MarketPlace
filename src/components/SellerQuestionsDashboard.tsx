import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getSellerIncomingQuestions, answerQuestion, Question } from "@/services/questions";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, ExternalLink, Send, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function SellerQuestionsDashboard() {
    const { toast } = useToast();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [answeringId, setAnsweringId] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const { data } = await getSellerIncomingQuestions();
        if (data) setQuestions(data);
        setLoading(false);
    };

    const handleAnswer = async (questionId: string) => {
        if (!answerText.trim()) return;
        setSubmitting(true);
        const { error } = await answerQuestion(questionId, answerText);
        setSubmitting(false);

        if (error) {
            toast({ title: "Erro", description: "Falha ao enviar resposta.", variant: "destructive" });
        } else {
            toast({ title: "Respondido!", description: "Sua resposta foi enviada." });
            setAnsweringId(null);
            setAnswerText("");
            loadData();
        }
    };

    if (loading) {
        return <div className="p-8 text-center"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" /></div>;
    }

    const unanswered = questions.filter(q => !q.answer);
    const answered = questions.filter(q => q.answer);

    return (
        <div className="space-y-8">
            {/* Unanswered Section */}
            <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-yellow-500" />
                    Perguntas Pendentes ({unanswered.length})
                </h3>

                <div className="grid gap-4">
                    {unanswered.length === 0 ? (
                        <p className="text-muted-foreground text-sm italic">Tudo limpo! Nenhuma pergunta pendente.</p>
                    ) : (
                        unanswered.map(q => (
                            <div key={q.id} className="glass-card p-5 rounded-xl border-l-4 border-l-yellow-500/50">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-sm">{q.user?.name || "Usuário"}</span>
                                            <span className="text-xs text-muted-foreground">em</span>
                                            <Link to={`/product/${q.product_id}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                                                {q.product?.title}
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(q.created_at), { addSuffix: true, locale: ptBR })}
                                        </p>
                                    </div>
                                </div>

                                <p className="mb-4 text-foreground font-medium p-3 bg-secondary/20 rounded-lg">"{q.question}"</p>

                                {answeringId === q.id ? (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Textarea
                                            placeholder="Escreva sua resposta..."
                                            value={answerText}
                                            onChange={(e) => setAnswerText(e.target.value)}
                                            className="min-h-[80px]"
                                            autoFocus
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="ghost" size="sm" onClick={() => setAnsweringId(null)}>Cancelar</Button>
                                            <Button size="sm" onClick={() => handleAnswer(q.id)} disabled={submitting}>
                                                {submitting ? "Enviando..." : <><Send className="mr-1 h-3 w-3" /> Responder</>}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={() => { setAnsweringId(q.id); setAnswerText(""); }}>
                                        Responder
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Answered History (Collapsible or just list) */}
            {answered.length > 0 && (
                <div className="pt-8 border-t border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-5 w-5" />
                        Histórico de Respostas
                    </h3>
                    <div className="space-y-4 opacity-80 hover:opacity-100 transition-opacity">
                        {answered.slice(0, 5).map(q => (
                            <div key={q.id} className="glass-card p-4 rounded-lg border-l-4 border-l-green-500/30">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium">{q.product?.title}</span>
                                    <span className="text-xs text-muted-foreground">Respondido {q.answered_at && formatDistanceToNow(new Date(q.answered_at), { addSuffix: true, locale: ptBR })}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">P: {q.question}</p>
                                <p className="text-sm text-foreground pl-3 border-l-2 border-primary/20">R: {q.answer}</p>
                            </div>
                        ))}
                        {answered.length > 5 && (
                            <p className="text-xs text-center text-muted-foreground">Exibindo as 5 últimas respondidas.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
