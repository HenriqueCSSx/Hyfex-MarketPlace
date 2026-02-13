import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { getAlgorithmSettings, updateAlgorithmSettings } from "@/services/admin";
import { toast } from "@/hooks/use-toast";
import { Bot, Zap, TrendingUp, ShieldCheck, Save } from "lucide-react";

interface AlgorithmSettings {
    new_seller_boost: boolean;
    new_seller_boost_days: number;
    new_seller_boost_multiplier: number;
    reputation_weight: number;
    randomness_weight: number;
    anti_monopoly_threshold: number;
    anti_monopoly_penalty: number;
}

const AdminAlgorithmPage = () => {
    const [settings, setSettings] = useState<AlgorithmSettings>({
        new_seller_boost: true,
        new_seller_boost_days: 7,
        new_seller_boost_multiplier: 1.5,
        reputation_weight: 0.6,
        randomness_weight: 0.1,
        anti_monopoly_threshold: 10,
        anti_monopoly_penalty: 0.3
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAlgorithmSettings().then(res => {
            if (res.data) setSettings(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        try {
            await updateAlgorithmSettings(settings);
            toast({ title: "Salvo", description: "Algoritmo ajustado.", className: "bg-green-500 text-white" });
        } catch (e) {
            toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
        }
    };

    if (loading) return (
        <AdminLayout>
            <div className="flex h-[80vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="max-w-4xl space-y-8 pb-12">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
                            <Bot className="h-8 w-8 text-purple-500" />
                            Ajuste do Algoritmo
                        </h1>
                        <p className="mt-1 text-sm text-zinc-400">Controle como os produtos são ranqueados e exibidos</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            <h2 className="text-lg font-semibold text-zinc-100">Impulso Inicial</h2>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <label className="text-zinc-300">Boost para Novos Vendedores</label>
                            <Switch
                                checked={settings.new_seller_boost}
                                onCheckedChange={(c) => setSettings({ ...settings, new_seller_boost: c })}
                            />
                        </div>

                        {settings.new_seller_boost && (
                            <div className="space-y-4 pt-2 border-t border-zinc-800/50">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm text-zinc-400">Duração (dias)</label>
                                        <span className="text-sm font-mono text-zinc-200">{settings.new_seller_boost_days}d</span>
                                    </div>
                                    <Slider
                                        value={[settings.new_seller_boost_days]}
                                        max={30}
                                        step={1}
                                        onValueChange={([v]) => setSettings({ ...settings, new_seller_boost_days: v })}
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm text-zinc-400">Multiplicador de Visibilidade</label>
                                        <span className="text-sm font-mono text-zinc-200">{settings.new_seller_boost_multiplier}x</span>
                                    </div>
                                    <Slider
                                        value={[settings.new_seller_boost_multiplier]}
                                        min={1}
                                        max={5}
                                        step={0.1}
                                        onValueChange={([v]) => setSettings({ ...settings, new_seller_boost_multiplier: v })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            <h2 className="text-lg font-semibold text-zinc-100">Pesos do Ranqueamento</h2>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-zinc-300">Reputação do Vendedor</label>
                                <span className="text-sm font-mono text-blue-400">{(settings.reputation_weight * 100).toFixed(0)}%</span>
                            </div>
                            <Slider
                                value={[settings.reputation_weight]}
                                max={1}
                                step={0.05}
                                onValueChange={([v]) => setSettings({ ...settings, reputation_weight: v })}
                                className="[&_.bg-primary]:bg-blue-500"
                            />
                            <p className="mt-1 text-xs text-zinc-500">Quanto a reputação impacta na posição</p>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-zinc-300">Fator Aleatório (Descoberta)</label>
                                <span className="text-sm font-mono text-purple-400">{(settings.randomness_weight * 100).toFixed(0)}%</span>
                            </div>
                            <Slider
                                value={[settings.randomness_weight]}
                                max={0.5}
                                step={0.01}
                                onValueChange={([v]) => setSettings({ ...settings, randomness_weight: v })}
                                className="[&_.bg-primary]:bg-purple-500"
                            />
                            <p className="mt-1 text-xs text-zinc-500">Chance de produtos aleatórios aparecerem</p>
                        </div>
                    </div>

                    <div className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="h-5 w-5 text-red-500" />
                            <h2 className="text-lg font-semibold text-zinc-100">Anti-Monopólio</h2>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-400">Limite de Dominação (%)</label>
                                <Input
                                    type="number"
                                    value={settings.anti_monopoly_threshold}
                                    onChange={(e) => setSettings({ ...settings, anti_monopoly_threshold: parseFloat(e.target.value) })}
                                    className="bg-zinc-900 border-zinc-800 text-zinc-100"
                                />
                                <p className="mt-1 text-xs text-zinc-500">Máximo de anúncios do mesmo vendedor na primeira página</p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-400">Penalidade de Visibilidade</label>
                                <Input
                                    type="number"
                                    value={settings.anti_monopoly_penalty}
                                    onChange={(e) => setSettings({ ...settings, anti_monopoly_penalty: parseFloat(e.target.value) })}
                                    className="bg-zinc-900 border-zinc-800 text-zinc-100"
                                    step="0.1"
                                />
                                <p className="mt-1 text-xs text-zinc-500">Redução de score se exceder o limite</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200">
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Configurações
                    </Button>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminAlgorithmPage;
