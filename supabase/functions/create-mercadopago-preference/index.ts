import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MercadoPagoConfig, Preference } from "npm:mercadopago";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { items, external_reference, payer_email } = await req.json();

        // The access token should be set in Supabase Secrets
        // Use: supabase secrets set MP_ACCESS_TOKEN=your_token
        const accessToken = Deno.env.get("MP_ACCESS_TOKEN");

        if (!accessToken) {
            throw new Error("Mercado Pago Access Token not configured");
        }

        const client = new MercadoPagoConfig({ accessToken });
        const preference = new Preference(client);

        const origin = req.headers.get("origin") || "http://localhost:5173";
        const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

        console.log(`Origin: ${cleanOrigin}`);

        const preferenceData = {
            body: {
                items: items.map((item: any) => ({
                    title: String(item.title),
                    description: String(item.description || ""),
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                    currency_id: "BRL"
                })),
                external_reference: String(external_reference),
                back_urls: {
                    success: `${cleanOrigin}/profile?status=success`,
                    failure: `${cleanOrigin}/checkout?status=failure`,
                    pending: `${cleanOrigin}/profile?status=pending`,
                },
                payment_methods: {
                    excluded_payment_types: [
                        { id: "ticket" }
                    ],
                    installments: 1,
                    default_payment_method_id: "pix"
                },
                payer: {
                    email: payer_email || "comprador@gamerhub.com.br",
                    first_name: "Comprador",
                    last_name: "Gamer"
                }
            }
        };

        const result = await preference.create(preferenceData);

        return new Response(JSON.stringify({ id: result.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        const mpErrorData = error.response?.data || error.message;
        console.error("ERRO DETALHADO DO MERCADO PAGO:", JSON.stringify(mpErrorData));

        return new Response(JSON.stringify({
            error: "Erro no Mercado Pago",
            details: typeof mpErrorData === 'string' ? mpErrorData : (mpErrorData.message || "Dados inválidos"),
            raw: mpErrorData
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
