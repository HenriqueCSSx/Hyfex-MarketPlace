import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Gamepad2, ShoppingBag, Store, Package, Loader2 } from "lucide-react";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get("mode") === "register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(["cliente"]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const toggleRole = (role: UserRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        const result = await register(
          name,
          email,
          password,
          selectedRoles.length > 0 ? selectedRoles : ["cliente"]
        );
        if (result.error) {
          setError(result.error);
          return;
        }
        setSuccessMessage(
          "Conta criada com sucesso! Verifique seu email para confirmar o cadastro. Caso não encontre na caixa de entrada, verifique sua pasta de SPAM."
        );
      } else {
        const result = await login(email, password, rememberMe);
        if (result.error) {
          setError(result.error);
          return;
        }
        navigate("/marketplace");
      }
    } catch {
      setError("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { role: "cliente" as UserRole, icon: ShoppingBag, label: "Cliente", desc: "Comprar produtos" },
    { role: "vendedor" as UserRole, icon: Store, label: "Vendedor", desc: "Vender no marketplace" },
    { role: "fornecedor" as UserRole, icon: Package, label: "Fornecedor", desc: "Vender em atacado" },
  ];

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      {/* Left Pane - Immersive Visual */}
      <div className="relative hidden w-1/2 flex-col justify-between p-12 lg:flex overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a0a]">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent" />
          {/* Animated Glows */}
          <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-primary/20 blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-primary/10 blur-[120px] animate-pulse delay-700" />
        </div>

        <Link to="/" className="relative z-10 flex items-center gap-2 group">
          <div className="rounded-xl bg-primary p-2 group-hover:glow-orange transition-all duration-300">
            <Gamepad2 className="h-6 w-6 text-white" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tighter text-white">
            HY<span className="text-primary">FEX</span>
          </span>
        </Link>

        <div className="relative z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="font-display text-4xl font-bold leading-tight tracking-tight text-white animate-fade-in-up">
              A maior plataforma de <span className="text-primary">comercialização gamer</span> da américa latina.
            </p>
            <footer className="text-sm text-zinc-400 animate-fade-in-up-delay-1">
              Junte-se a milhares de jogadores e fornecedores em um ecossistema seguro e profissional.
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2 relative bg-[#050505]">
        <div className="absolute inset-0 bg-grid opacity-10 lg:hidden" />

        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-8 lg:hidden flex flex-col items-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Gamepad2 className="h-8 w-8 text-primary" />
              <span className="font-display text-2xl font-bold">
                HY<span className="text-primary">FEX</span>
              </span>
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">
              {isRegister ? "Comece sua jornada" : "Bem-vindo de volta"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isRegister
                ? "Crie sua conta profissional em poucos minutos."
                : "Acesse sua conta para gerenciar seus negócios."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Messages */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 animate-in fade-in zoom-in duration-300">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400 animate-in fade-in zoom-in duration-300">
                {successMessage}
              </div>
            )}

            <div className="space-y-4">
              {isRegister && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Nome Completo</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como quer ser chamado?"
                    className="h-12 bg-white/[0.03] border-white/10 focus:border-primary/50 transition-all rounded-xl"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="h-12 bg-white/[0.03] border-white/10 focus:border-primary/50 transition-all rounded-xl"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Senha</label>
                  {!isRegister && (
                    <button type="button" className="text-[10px] uppercase font-bold text-primary hover:text-primary/80 transition-colors">
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 bg-white/[0.03] border-white/10 focus:border-primary/50 transition-all rounded-xl"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
            </div>

            {!isRegister && (
              <label className="flex items-center gap-3 cursor-pointer group ml-1">
                <div className="relative flex items-center justify-center">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                    disabled={isLoading}
                    className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                  />
                </div>
                <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">Mantenha-me conectado</span>
              </label>
            )}

            {isRegister && (
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                  Selecione seus perfis
                </label>
                <div className="grid gap-3">
                  {roleOptions.map((opt) => (
                    <label
                      key={opt.role}
                      className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-300 ${selectedRoles.includes(opt.role)
                        ? "border-primary/50 bg-primary/5 shadow-[0_0_20px_rgba(255,103,0,0.05)]"
                        : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                        }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${selectedRoles.includes(opt.role) ? "bg-primary text-white" : "bg-white/5 text-zinc-500"
                        }`}>
                        <opt.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{opt.label}</div>
                        <div className="text-[10px] uppercase tracking-wide text-zinc-500">{opt.desc}</div>
                      </div>
                      <Checkbox
                        checked={selectedRoles.includes(opt.role)}
                        onCheckedChange={() => toggleRole(opt.role)}
                        disabled={isLoading}
                        className="border-white/20 data-[state=checked]:bg-primary transition-all"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 font-display tracking-widest text-sm uppercase bg-primary hover:bg-primary/90 hover:glow-orange transition-all shadow-lg rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                isRegister ? "Criar Conta Profissional" : "Acessar Plataforma"
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-zinc-500">
                {isRegister ? "Já possui uma conta?" : "Ainda não tem conta?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-primary hover:text-primary/80 transition-colors"
                  disabled={isLoading}
                >
                  {isRegister ? "Fazer Login" : "Cadastre-se Agora"}
                </button>
              </p>
            </div>
          </form>

          <div className="mt-12 text-center text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
            Protegido por criptografia militar de 256 bits
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
