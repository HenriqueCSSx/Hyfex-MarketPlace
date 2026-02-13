import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import MarketplacePage from "./pages/MarketplacePage";
import DashboardPage from "./pages/DashboardPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CreateAdPage from "./pages/CreateAdPage";
import EditAdPage from "./pages/EditAdPage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";
import NotFound from "./pages/NotFound";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminDisputesPage from "./pages/AdminDisputesPage";
import AdminSubscriptionsPage from "./pages/AdminSubscriptionsPage";
import AdminVerificationsPage from "./pages/AdminVerificationsPage";
import AdminAlgorithmPage from "./pages/AdminAlgorithmPage";
import AdminFinancePage from "./pages/AdminFinancePage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import AdminGuard from "./components/AdminGuard";
import SupportPage from "./pages/SupportPage";
import CheckoutPage from "./pages/CheckoutPage";
import SellerProfilePage from "./pages/SellerProfilePage";
import MyQuestionsPage from "./pages/MyQuestionsPage";
import TermsPage from "./pages/TermsPage";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminActivationsPage from "./pages/AdminActivationsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/create-ad" element={<CreateAdPage />} />
              <Route path="/edit-ad/:id" element={<EditAdPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/seller/:id" element={<SellerProfilePage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/my-questions" element={<MyQuestionsPage />} />

              {/* Admin Routes - Protected */}
              <Route path="/admin" element={<AdminGuard><AdminDashboardPage /></AdminGuard>} />
              <Route path="/admin/users" element={<AdminGuard><AdminUsersPage /></AdminGuard>} />
              <Route path="/admin/products" element={<AdminGuard><AdminProductsPage /></AdminGuard>} />
              <Route path="/admin/categories" element={<AdminGuard><AdminCategoriesPage /></AdminGuard>} />
              <Route path="/admin/disputes" element={<AdminGuard><AdminDisputesPage /></AdminGuard>} />
              <Route path="/admin/finance" element={<AdminGuard><AdminFinancePage /></AdminGuard>} />
              <Route path="/admin/subscriptions" element={<AdminGuard><AdminSubscriptionsPage /></AdminGuard>} />
              <Route path="/admin/verifications" element={<AdminGuard><AdminVerificationsPage /></AdminGuard>} />
              <Route path="/admin/algorithm" element={<AdminGuard><AdminAlgorithmPage /></AdminGuard>} />
              <Route path="/admin/settings" element={<AdminGuard><AdminSettingsPage /></AdminGuard>} />
              <Route path="/admin/activations" element={<AdminGuard><AdminActivationsPage /></AdminGuard>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
