import Navbar from "@/components/Navbar";

const TermsPage = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <h1 className="text-3xl font-display font-bold mb-8">Termos de Uso e Política de Privacidade</h1>

                <div className="space-y-8 text-muted-foreground">
                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">1. Aceitação dos Termos</h2>
                        <p>
                            Ao acessar e usar a plataforma Hyfex ("Serviço"), você concorda em cumprir estes Termos de Uso.
                            Se você não concordar com algum destes termos, não deverá utilizar nosso serviço.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">2. Descrição do Serviço</h2>
                        <p>
                            A Hyfex é um marketplace que conecta vendedores e compradores de ativos digitais, como contas de jogos,
                            itens virtuais, moedas de jogos, e serviços relacionados. Nós atuamos como intermediários
                            para garantir a segurança da transação.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">3. Cadastro e Conta</h2>
                        <p>
                            Para utilizar certas funcionalidades, você deve se cadastrar. Você concorda em fornecer informações
                            verdadeiras, exatas, atuais e completas. Você é responsável por manter a confidencialidade de sua senha.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">4. Regras de Conduta</h2>
                        <p>
                            É proibido usar o serviço para:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li>Violar leis ou regulamentos locais, estaduais ou federais.</li>
                            <li>Vender produtos ilegais, roubados ou obtidos de forma fraudulenta.</li>
                            <li>Assediar, abusar ou prejudicar outra pessoa.</li>
                            <li>Tentar burlar o sistema de pagamento ou taxas da plataforma.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">5. Taxas e Pagamentos</h2>
                        <p>
                            Vendedores podem estar sujeitos a taxas de assinatura ou comissões conforme descrito na plataforma.
                            Compradores pagam o preço listado pelo produto. A Hyfex retém o pagamento até a conclusão segura da transação.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">6. Disputas e Reembolsos</h2>
                        <p>
                            Em caso de problemas com uma compra, o comprador pode abrir uma disputa. A Hyfex mediará a situação
                            e poderá, a seu critério, reembolsar o comprador se ficar comprovado que o produto não foi entregue
                            ou não condiz com a descrição.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">7. Limitação de Responsabilidade</h2>
                        <p>
                            A Hyfex não se responsabiliza por perdas indiretas, incidentais ou consequentes resultantes do uso
                            ou da incapacidade de usar o serviço.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">8. Alterações nos Termos</h2>
                        <p>
                            Podemos modificar estes termos a qualquer momento. O uso contínuo do serviço após as alterações
                            constitui aceitação dos novos termos.
                        </p>
                    </section>

                    <div className="pt-8 border-t border-border mt-12">
                        <p className="text-sm">Última atualização: 12 de Fevereiro de 2026</p>
                        <p className="text-sm mt-2">Dúvidas? Entre em contato com nosso <a href="/support" className="text-primary hover:underline">Suporte</a>.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsPage;
