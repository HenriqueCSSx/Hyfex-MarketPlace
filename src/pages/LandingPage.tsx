import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getFeaturedProducts, getProducts, getCategories } from "@/services/products";
import { Product } from "@/types/product";
import {
  Gamepad2, Zap, ShieldCheck, Search, Trophy, TrendingUp,
  ChevronRight, Star, Monitor, Smartphone, Globe
} from "lucide-react";



const LandingPage = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [featRes, newRes, catRes] = await Promise.all([
      getFeaturedProducts(8),
      getProducts({ limit: 8, sortBy: "newest" }),
      getCategories(),
    ]);

    setFeaturedProducts(featRes.data || []);
    setNewProducts(newRes.data || []);
    // Only show categories that have a cover image
    const catsWithImage = (catRes.data || []).filter((c: any) => c.image_url);
    setCategories(catsWithImage.slice(0, 12));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Immersive Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#050505]" />
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />

          {/* Animated Ambient Glows */}
          <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] animate-pulse delay-1000" />

          {/* Floating Decorative Elements */}
          <div className="absolute top-1/4 right-[15%] animate-float hidden lg:block opacity-40">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-orange-600 rotate-12 blur-xl" />
          </div>
          <div className="absolute bottom-1/4 left-[10%] animate-float-slow hidden lg:block opacity-30">
            <div className="h-32 w-32 rounded-full bg-primary/30 blur-2xl" />
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10 py-20 lg:py-0">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left space-y-8 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md animate-fade-in-up">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  Marketplace Gamer Profissional
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-display font-black leading-[1.1] tracking-tighter text-white animate-fade-in-up">
                DOMINE O SEU <br />
                <span className="text-gradient">JOGO FAVORITO</span>
              </h1>

              <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-xl animate-fade-in-up-delay-1 mx-auto lg:mx-0">
                A plataforma definitiva para comercialização de ativos digitais.
                Segurança institucional com entrega instantânea para os maiores títulos do mundo.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up-delay-2">
                <Button size="lg" className="h-14 px-8 text-sm font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 hover:glow-orange transition-all btn-premium rounded-xl" asChild>
                  <Link to="/marketplace">Explorar Ecossistema</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-sm font-bold uppercase tracking-widest border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all rounded-xl" asChild>
                  <Link to="/auth?mode=register">Criar Conta Vendedor</Link>
                </Button>
              </div>

              <div className="pt-8 flex flex-wrap items-center justify-center lg:justify-start gap-8 animate-fade-in-up-delay-3">
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-black text-white">50K+</span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Vendas Concluídas</span>
                </div>
                <div className="h-10 w-[1px] bg-white/10" />
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-black text-white">4.9/5</span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Avaliação Média</span>
                </div>
                <div className="h-10 w-[1px] bg-white/10" />
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-black text-white">24/7</span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Suporte Ativo</span>
                </div>
              </div>
            </div>

            {/* Visual Feature - Floating Cards or Image */}
            <div className="flex-1 relative hidden lg:block animate-fade-in-up-delay-2">
              <div className="relative z-10 w-[500px] h-[400px] glass-card rounded-[2rem] border-white/10 overflow-hidden premium-shadow group">
                <img
                  src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop"
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                  alt="Gaming High Fidelity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex items-center gap-4 mb-2">
                    <Badge className="bg-primary text-white border-none uppercase text-[10px] font-black">Featured</Badge>
                    <span className="text-white font-display font-bold">Hyfex Exclusive</span>
                  </div>
                  <p className="text-zinc-400 text-sm font-medium">Os ativos mais raros do mercado estão aqui.</p>
                </div>
              </div>

              {/* Decorative Side Elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[80px]" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/30 rounded-full blur-[80px]" />
            </div>
          </div>
        </div>
      </section>

      {/* Game Categories Section */}
      <section className="py-24 container mx-auto px-4 lg:px-8">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-black font-display text-white tracking-tighter uppercase">
              PRINCIPAIS <span className="text-gradient">UNIVERSOS</span>
            </h2>
            <p className="text-zinc-500 text-sm font-medium">Os jogos mais populares da nossa comunidade.</p>
          </div>
          <Link to="/marketplace" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-primary transition-colors flex items-center gap-2 group">
            Explorar todos <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.length === 0 && !loading && (
            <p className="col-span-full text-center text-zinc-500 text-sm">Nenhuma categoria com capa encontrada.</p>
          )}
          {categories.map(cat => (
            <Link
              key={cat.slug}
              to={`/marketplace?category=${cat.slug}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl glass-card border-white/5 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 premium-shadow"
            >
              <img
                src={cat.image_url}
                alt={cat.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-end p-5">
                <span className="font-display font-black text-sm text-white tracking-tight uppercase leading-none group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-primary transition-all duration-500 group-hover:w-full" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="mb-12">
            <h2 className="text-3xl font-black font-display text-white tracking-tighter uppercase flex items-center gap-3">
              <Star className="h-8 w-8 text-primary fill-primary glow-orange-sm" />
              DESTAQUES <span className="text-gradient">DA SEMANA</span>
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {featuredProducts.length > 0 ? (
                featuredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center rounded-[2rem] border border-dashed border-white/10 glass-card">
                  <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Nenhum destaque disponível no momento.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-24 container mx-auto px-4 lg:px-8 border-t border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black font-display text-white tracking-tighter uppercase flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              RECÉM <span className="text-gradient">ADICIONADOS</span>
            </h2>
          </div>
          <Link to="/marketplace" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-primary transition-colors flex items-center gap-2 group">
            Ver novidades <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {newProducts.length > 0 ? (
              newProducts.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center rounded-[2rem] border border-dashed border-white/10">
                <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Nenhuma novidade encontrada.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Trust Footer */}
      <footer className="relative bg-[#050505] border-t border-white/5 pt-24 pb-12 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="container mx-auto px-4 lg:px-8 grid md:grid-cols-12 gap-12 relative z-10">
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate("/")}>
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center transition-all group-hover:glow-orange">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <span className="font-display text-2xl font-black tracking-tighter text-white">
                HY<span className="text-primary">FEX</span>
              </span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium max-w-sm">
              A elite do comércio gamer. Contas de alto nível, skins raras e serviços profissionais com segurança garantida Hyfex.
            </p>
            <div className="flex gap-4">
              {/* Social placeholders */}
              <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-primary hover:border-primary/30 transition-all cursor-pointer">
                <span className="text-[10px] font-black tracking-widest">TW</span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-primary hover:border-primary/30 transition-all cursor-pointer">
                <span className="text-[10px] font-black tracking-widest">IG</span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-primary hover:border-primary/30 transition-all cursor-pointer">
                <span className="text-[10px] font-black tracking-widest">DC</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">Plataforma</h4>
            <ul className="space-y-3 text-sm font-bold">
              <li><Link to="/marketplace" className="text-zinc-600 hover:text-primary transition-colors">Mercado Global</Link></li>
              <li><Link to="/marketplace" className="text-zinc-600 hover:text-primary transition-colors">Vender Agora</Link></li>
              <li><Link to="/marketplace" className="text-zinc-600 hover:text-primary transition-colors">Categorias</Link></li>
              <li><Link to="/marketplace" className="text-zinc-600 hover:text-primary transition-colors">Rankings</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">Suporte</h4>
            <ul className="space-y-3 text-sm font-bold">
              <li><Link to="/support" className="text-zinc-600 hover:text-primary transition-colors">Central de Ajuda</Link></li>
              <li><Link to="/support" className="text-zinc-600 hover:text-primary transition-colors">Abrir Ticket</Link></li>
              <li><Link to="/terms" className="text-zinc-600 hover:text-primary transition-colors">Termos de Uso</Link></li>
              <li><Link to="/terms" className="text-zinc-600 hover:text-primary transition-colors">Privacidade</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">Garantia Hyfex</h4>
            <div className="glass-card rounded-2xl border-white/5 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Pagamentos Seguros</p>
              </div>
              <p className="text-[11px] font-medium text-zinc-500 leading-relaxed">
                Utilizamos tecnologia de ponta para garantir que suas transações sejam 100% protegidas. Seu dinheiro só é liberado após a confirmação do produto.
              </p>
              <div className="flex gap-3 pt-2">
                <div className="h-8 w-12 bg-white/5 border border-white/10 rounded flex items-center justify-center text-[8px] font-black text-zinc-400">PIX</div>
                <div className="h-8 w-12 bg-white/5 border border-white/10 rounded flex items-center justify-center text-[8px] font-black text-zinc-400">VISA</div>
                <div className="h-8 w-12 bg-white/5 border border-white/10 rounded flex items-center justify-center text-[8px] font-black text-zinc-400">MASTERCARD</div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
            &copy; 2026 Hyfex Elite Ecosystem. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest hover:text-zinc-600 cursor-pointer transition-colors">Status: Online</span>
            <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest hover:text-zinc-600 cursor-pointer transition-colors">Versão: v2.4.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
