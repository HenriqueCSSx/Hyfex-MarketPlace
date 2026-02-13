import { supabase } from "@/lib/supabase";

export interface PaymentPreference {
    id: string;
    init_point: string;
    sandbox_init_point: string;
}

/**
 * Creates a payment preference in Mercado Pago via an Edge Function.
 * This is the secure way to handle payments as the Access Token remains hidden.
 */
export async function createPaymentPreference(orderData: {
    items: Array<{
        title: string;
        description: string;
        quantity: number;
        unit_price: number;
    }>;
    external_reference: string;
    payer_email?: string;
}) {
    try {
        console.log("Chamando Edge Function oficial:", orderData);
        const { data, error } = await supabase.functions.invoke('create-mercadopago-preference', {
            body: orderData
        });

        if (error) {
            console.error("Erro na Edge Function:", error);
            if (error instanceof Error && (error as any).context) {
                try {
                    const response = (error as any).context as Response;
                    const details = await response.json();
                    return { data: null, error: details.details || details.error || error.message };
                } catch (e) { }
            }
            return { data: null, error: error.message || "Erro desconhecido na função" };
        }

        return { data: data as PaymentPreference, error: null };
    } catch (error: any) {
        console.error("Erro final no serviço:", error);
        return { data: null, error: error.message || "Falha ao processar pagamento" };
    }
}

/**
 * Logic to verify payment status (usually handled by Webhooks, but client can poll as fallback)
 */
export async function getPaymentStatus(paymentId: string) {
    const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('payment_id', paymentId)
        .single();

    return { data, error };
}
