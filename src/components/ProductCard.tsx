import { Link } from "react-router-dom";
import { Product } from "@/types/product";
import { Star, Eye, ShieldCheck, Package, ShoppingBag, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const isSupplier = product.type === "fornecedor";

  return (
    <Link to={`/product/${product.id}`} className="group glass-card block overflow-hidden rounded-2xl transition-all duration-500 hover:glow-orange-sm hover:border-primary/40 hover:-translate-y-1 premium-shadow">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.image_url}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-40" />
        <div className="absolute left-3 top-3 flex gap-2">
          {isSupplier ? (
            <Badge variant="secondary" className="bg-primary hover:bg-primary text-white border-none shadow-lg shadow-primary/20 flex items-center gap-1.5 px-2.5 py-1">
              <Package className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Atacado</span>
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border-white/10 border shadow-xl flex items-center gap-1.5 px-2.5 py-1">
              <ShoppingBag className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Varejo</span>
            </Badge>
          )}
        </div>

        {/* Floating Action Hint */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="bg-primary text-white rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            Ver Detalhes
          </div>
        </div>
      </div>

      <div className="p-4 bg-gradient-to-b from-transparent to-white/[0.02]">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display text-sm font-bold leading-tight text-white group-hover:text-primary transition-colors line-clamp-2">
            {product.title}
          </h3>
        </div>
        <p className="mb-4 text-xs text-zinc-500 line-clamp-1 group-hover:text-zinc-400 transition-colors uppercase tracking-wider font-medium">
          {product.category?.name || "Geral"}
        </p>

        <div className="mb-4 flex items-end justify-between font-display">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">A partir de</span>
            <span className="text-xl font-black text-white group-hover:text-primary transition-colors flex items-baseline gap-1">
              <span className="text-[10px] font-bold opacity-60">R$</span>
              {product.price.toFixed(2).replace(".", ",")}
            </span>
          </div>
          {product.min_quantity > 1 && (
            <Badge variant="outline" className="text-[10px] border-white/5 text-zinc-500 h-5 px-1.5 font-bold uppercase">
              Min. {product.min_quantity}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div className="flex items-center gap-2 group/seller transition-all">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
              {product.seller?.avatar_url ? (
                <img src={product.seller.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-3 w-3 text-primary" />
              )}
            </div>
            <span className="text-[10px] font-bold text-zinc-400 group-hover/seller:text-zinc-200 transition-colors uppercase tracking-wider">
              {product.seller?.name || "Vendedor"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
              <Star className="h-3 w-3 fill-primary" />
              <span>{product.seller?.reputation?.toFixed(1) || "5.0"}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
