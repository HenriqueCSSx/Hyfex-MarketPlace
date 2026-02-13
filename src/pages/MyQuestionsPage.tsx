import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { getMyQuestions, Question } from "@/services/questions";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, MessageCircle, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const MyQuestionsPage = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/auth");
            return;
        }

        getMyQuestions().then(({ data }) => {
            if (data) setQuestions(data);
            setLoading(false);
        });
    }, [isAuthenticated, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary">
                                <ArrowLeft className="h-4 w-4" />Voltar
                            </button>
                            <h1 className="font-display text-2xl font-bold text-foreground">Minhas Perguntas</h1>
                            <p className="text-muted-foreground">Histórico de dúvidas enviadas aos vendedores.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {questions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
                                <MessageCircle className="mb-4 h-12 w-12 text-muted-foreground/30" />
                                <h3 className="text-lg font-medium text-foreground">Nenhuma pergunta feita</h3>
                                <p className="text-muted-foreground">Você ainda não enviou dúvidas em nenhum produto.</p>
                                <Button className="mt-4" onClick={() => navigate("/marketplace")}>
                                    Explorar Marketplace
                                </Button>
                            </div>
                        ) : (
                            questions.map((q) => (
                                <div key={q.id} className="glass-card rounded-xl p-5 transition-all hover:border-primary/50">
                                    <div className="mb-3 flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {q.product?.image_url && (
                                                <img
                                                    src={q.product.image_url}
                                                    alt={q.product.title}
                                                    className="h-10 w-10 rounded-md object-cover"
                                                />
                                            )}
                                            <div>
                                                <Link to={`/product/${q.product_id}`} className="font-medium text-foreground hover:underline flex items-center gap-1">
                                                    {q.product?.title || "Produto indisponível"}
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                                <p className="text-xs text-muted-foreground">
                                                    Enviada {formatDistanceToNow(new Date(q.created_at), { addSuffix: true, locale: ptBR })}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            {q.answer ? (
                                                <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500">
                                                    Respondida
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-500">
                                                    Aguardando
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pl-[52px]">
                                        <p className="text-sm text-foreground/80 mb-3 bg-secondary/30 p-3 rounded-lg">
                                            "{q.question}"
                                        </p>

                                        {q.answer && (
                                            <div className="pl-4 border-l-2 border-primary space-y-1">
                                                <span className="text-xs font-semibold text-primary">Resposta do Vendedor:</span>
                                                <p className="text-sm text-foreground">{q.answer}</p>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {q.answered_at && formatDistanceToNow(new Date(q.answered_at), { addSuffix: true, locale: ptBR })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyQuestionsPage;
