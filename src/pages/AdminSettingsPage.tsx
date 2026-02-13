import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getPlatformSettings, updatePlatformSettings } from "@/services/admin";
import { toast } from "@/hooks/use-toast";
import { Save, AlertCircle } from "lucide-react";

interface PlatformSettings {
    maintenance_mode: boolean;
    require_ad_approval: boolean;
    platform_fee: number;
    subscription_price: number;
    min_withdrawal: number;
}

const AdminSettingsPage = () => {
    const [settings, setSettings] = useState<PlatformSettings>({
        maintenance_mode: false,
        require_ad_approval: false,
        platform_fee: 5,
        subscription_price: 29.90,
        min_withdrawal: 50
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPlatformSettings().then(res => {
            if (res.data) setSettings(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        try {
            await updatePlatformSettings(settings);
            toast({ title: "Salvo", description: "Configurações atualizadas com sucesso." });
        } catch (e) {
            toast({ title: "Erro", description: "Falha ao salvar configurações.", variant: "destructive" });
        }
    }

    if (loading) return (
        <AdminLayout>
            <div className="flex h-[80vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="max-w-3xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-100">Configurações da Plataforma</h1>
                    <p className="mt-1 text-sm text-zinc-400">Gerencie taxas, limites e regras gerais</p>
                </div>

                <div className="space-y-6">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
                        <h2 className="mb-4 text-lg font-semibold text-zinc-100 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            Controle de Acesso
                        </h2>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-base font-medium text-zinc-200">Modo Manutenção</label>
                                    <p className="text-sm text-zinc-500">Bloqueia o acesso público à plataforma</p>
                                </div>
                                <Switch
                                    checked={settings.maintenance_mode}
                                    onCheckedChange={(c) => setSettings({ ...settings, maintenance_mode: c })}
                                />
                            </div>
                            <div className="h-px bg-zinc-800" />
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-base font-medium text-zinc-200">Aprovação Obrigatória</label>
                                    <p className="text-sm text-zinc-500">Novos anúncios precisam de aprovação manual</p>
                                </div>
                                <Switch
                                    checked={settings.require_ad_approval}
                                    onCheckedChange={(c) => setSettings({ ...settings, require_ad_approval: c })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
                        <h2 className="mb-4 text-lg font-semibold text-zinc-100 flex items-center gap-2">
                            <DollarSignIcon className="h-4 w-4 text-green-500" />
                            Financeiro
                        </h2>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-400">Taxa da Plataforma (%)</label>
                                <Input
                                    type="number"
                                    value={settings.platform_fee}
                                    onChange={(e) => setSettings({ ...settings, platform_fee: parseFloat(e.target.value) })}
                                    className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-green-500/50"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-400">Preço da Assinatura (R$)</label>
                                <Input
                                    type="number"
                                    value={settings.subscription_price}
                                    onChange={(e) => setSettings({ ...settings, subscription_price: parseFloat(e.target.value) })}
                                    className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-green-500/50"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-400">Saque Mínimo (R$)</label>
                                <Input
                                    type="number"
                                    value={settings.min_withdrawal}
                                    onChange={(e) => setSettings({ ...settings, min_withdrawal: parseFloat(e.target.value) })}
                                    className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-green-500/50"
                                />
                            </div>
                        </div>
                    </div>

                    <Button onClick={handleSave} size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                    </Button>
                </div>
            </div>
        </AdminLayout>
    );
};

function DollarSignIcon(props: React.ComponentProps<"svg">) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" x2="12" y1="2" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    )
}

export default AdminSettingsPage;
