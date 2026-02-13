import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { MercadoPagoConfig, Payment } from "npm:mercadopago";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const body = await req.json();
        console.log("MP Webhook received:", body);

        // We only care about payments
        if (body.type === "payment") {
            const paymentId = body.data.id;
            const accessToken = Deno.env.get("MP_ACCESS_TOKEN");

            const client = new MercadoPagoConfig({ accessToken: accessToken! });
            const payment = new Payment(client);

            const paymentData = await payment.get({ id: paymentId });
            const orderId = paymentData.external_reference;

            if (orderId && paymentData.status === "approved") {
                // Update order status in database
                const { error } = await supabase
                    .from("orders")
                    .update({
                        status: "completed",
                        payment_id: paymentId.toString()
                    })
                    .eq("id", orderId);

                if (error) throw error;
                console.log(`Order ${orderId} marked as completed.`);
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Webhook error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
