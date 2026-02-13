import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, ChevronDown, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getProducts, getFeaturedProducts, getCategories } from "@/services/products";
import { Product, Category } from "@/types/product";

const MarketplacePage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [popular, setPopular] = useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<Product[]>([]);
  const [steamProducts, setSteamProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);

  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Parallel fetch for homepage sections
        const [catsRes, featRes, popRes, subsRes, steamRes] = await Promise.all([
          getCategories(),
          getFeaturedProducts(8),
          getProducts({ sortBy: "popular", limit: 12 }),
          getProducts({ category: "assinaturas", limit: 10 }),
          getProducts({ category: "steam", limit: 10 })
        ]);

        setCategories(catsRes.data || []);
        setFeatured(featRes.data || []);
        setPopular(popRes.data || []);
        setSubscriptions(subsRes.data || []);
        setSteamProducts(steamRes.data || []);
      } catch (err) {
        console.error("Error loading marketplace data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Search effect
  useEffect(() => {
    const doSearch = async () => {
      if (!search && selectedCategory === "Todos") {
        setSearchResults(null);
        return;
      }

      const filters: any = {};
      if (search) filters.search = search;
      if (selectedCategory !== "Todos") {
        // Find category slug from name if needed, or pass name if slug matches
        const cat = categories.find(c => c.name === selectedCategory);
        if (cat) filters.category = cat.slug;
      }

      const { data } = await getProducts(filters);
      setSearchResults(data || []);
    };

    // Debounce search
    const timeout = setTimeout(doSearch, 500);
    return () => clearTimeout(timeout);
  }, [search, selectedCategory, categories]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 lg:px-8">
        {/* Market Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black font-display text-white tracking-tighter">
              EXPLORE O <span className="text-gradient">MERCADO</span>
            </h1>
            <p className="text-zinc-500 text-sm font-medium">Os melhores ativos digitais, verificados e seguros.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex h-12 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-all hover:bg-white/10 hover:border-white/20 active:scale-95 group min-w-[180px]">
                    <span className="flex items-center gap-2">
                      <ChevronDown className="h-4 w-4 text-primary group-hover:rotate-180 transition-transform duration-300" />
                      {selectedCategory}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-1 glass-card border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200" align="start">
                  <div className="grid gap-1 max-h-[300px] overflow-y-auto scrollbar-hide">
                    <button
                      onClick={() => setSelectedCategory("Todos")}
                      className={`rounded-xl px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest transition-all ${selectedCategory === "Todos"
                        ? "bg-primary text-white glow-orange-sm"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                        }`}
                    >
                      Todos
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`rounded-xl px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest transition-all ${selectedCategory === cat.name
                          ? "bg-primary text-white glow-orange-sm"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                          }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Buscar ativos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 pl-12 bg-white/5 border-white/10 rounded-xl text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all"
                />
              </div>
            </div>

            <Button size="lg" className="h-12 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-[10px] px-8 rounded-xl transition-all shadow-xl active:scale-95" asChild>
              <Link to="/create-ad">
                <Plus className="mr-2 h-4 w-4" />
                Vender agora
              </Link>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && !searchResults && (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {/* Search Results */}
        {!loading && searchResults !== null ? (
          <>
            <h2 className="font-display mb-4 text-lg font-bold text-foreground">
              Resultados ({searchResults.length})
            </h2>
            {searchResults.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-medium text-muted-foreground">Nenhum produto encontrado</p>
                <p className="text-sm text-muted-foreground/60">Tente buscar por outros termos ou categorias.</p>
              </div>
            )}
          </>
        ) : (
          !loading && (
            <>
              {/* Categorias Populares / Navegação */}
              {categories.length > 0 && (
                <MarketplaceSection title="Categorias" linkText="">
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.name)}
                        className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/5 shadow-sm"
                      >
                        {cat.image_url ? (
                          <img
                            src={cat.image_url}
                            alt={cat.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-accent/20">
                            <span className="text-sm font-bold text-muted-foreground">{cat.name[0]}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <span className="font-display font-bold text-xs sm:text-sm text-left text-white line-clamp-1 group-hover:text-primary transition-colors">
                            {cat.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </MarketplaceSection>
              )}

              {/* Em destaque */}
              {featured.length > 0 && (
                <MarketplaceSection title="Em Destaque">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {featured.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </MarketplaceSection>
              )}

              {/* Assinaturas */}
              {subscriptions.length > 0 && (
                <MarketplaceSection title="Assinaturas e Premium" linkText="VER MAIS" linkTo="/marketplace?category=assinaturas">
                  <ScrollableRow products={subscriptions} />
                </MarketplaceSection>
              )}

              {/* Steam */}
              {steamProducts.length > 0 && (
                <MarketplaceSection title="Jogos Steam" linkText="VER MAIS" linkTo="/marketplace?category=steam">
                  <ScrollableRow products={steamProducts} />
                </MarketplaceSection>
              )}

              {/* Mais populares */}
              {popular.length > 0 && (
                <MarketplaceSection title="Mais Populares">
                  <ScrollableRow products={popular} />
                </MarketplaceSection>
              )}

              {/* Empty State warning if nothing loaded */}
              {featured.length === 0 && popular.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <h3 className="text-lg font-semibold text-foreground">O Marketplace está vazio</h3>
                  <p className="text-sm text-muted-foreground">Seja o primeiro a anunciar um produto!</p>
                  <Link to="/create-ad" className="mt-4 inline-block rounded bg-primary px-4 py-2 text-primary-foreground font-medium">Criar Anúncio</Link>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
};

// Section wrapper
const MarketplaceSection = ({
  title,
  linkText,
  linkTo,
  children,
}: {
  title: string;
  linkText?: string;
  linkTo?: string;
  children: React.ReactNode;
}) => (
  <section className="mb-8">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-base font-bold text-foreground md:text-lg">{title}</h2>
      {linkText && linkTo && (
        <Link to={linkTo} className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline">
          {linkText}
        </Link>
      )}
    </div>
    {children}
  </section>
);

// Horizontal scrollable product row
const ScrollableRow = ({ products }: { products: Product[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
    }
  };

  return (
    <div className="group/scroll relative">
      <button
        onClick={() => scroll("left")}
        className="absolute -left-3 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-opacity group-hover/scroll:flex hover:bg-accent"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
      >
        {products.map((product) => (
          <div key={product.id} className="w-[200px] shrink-0 md:w-[220px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <button
        onClick={() => scroll("right")}
        className="absolute -right-3 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-opacity group-hover/scroll:flex hover:bg-accent"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default MarketplacePage;
