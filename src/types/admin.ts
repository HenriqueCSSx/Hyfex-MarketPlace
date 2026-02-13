import { UserRole } from "@/contexts/AuthContext";

// Admin User Types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  activeRole: UserRole;
  reputation: number;
  avatarUrl?: string;
  createdAt: string;
  status: "active" | "suspended" | "banned";
  subscriptionStatus: "active" | "pending" | "inactive" | "free";
  subscriptionExpiresAt?: string;
  totalSales: number;
  totalPurchases: number;
  lastLoginAt: string;
}

// Dispute Types
export interface Dispute {
  id: string;
  transactionId: string;
  productId: string;
  productTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  reason: string;
  status: "open" | "in_review" | "resolved_refund" | "resolved_release";
  createdAt: string;
  resolvedAt?: string;
  adminNotes?: string;
  messages: DisputeMessage[];
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderName: string;
  senderType: "buyer" | "seller" | "admin";
  message: string;
  createdAt: string;
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "active" | "pending" | "inactive" | "free";
  plan: "monthly" | "free";
  amount: number;
  startDate: string;
  expiresAt: string;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  paymentMethod?: string;
  autoRenew: boolean;
}

// Verification Types
export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  documents: string[];
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

// Report Types
export interface ProductReport {
  id: string;
  productId: string;
  productTitle: string;
  reportedBy: string;
  reporterName: string;
  reason: string;
  description: string;
  status: "pending" | "reviewed" | "action_taken" | "dismissed";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  actionTaken?: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  productId: string;
  productTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  status: "pending" | "completed" | "refunded" | "disputed";
  createdAt: string;
  completedAt?: string;
}

// Algorithm Settings
export interface AlgorithmSettings {
  newSellerBoost: boolean;
  newSellerBoostDays: number;
  newSellerBoostMultiplier: number;
  reputationWeight: number;
  randomnessWeight: number;
  antiMonopolyThreshold: number;
  antiMonopolyPenalty: number;
}

// Platform Settings
export interface PlatformSettings {
  subscriptionPrice: number;
  platformFee: number;
  minWithdrawal: number;
  maxProductsPerSeller: number;
  requireAdApproval: boolean;
  maintenanceMode: boolean;
}

// Dashboard Metrics
export interface DashboardMetrics {
  totalUsers: number;
  totalClients: number;
  totalSellers: number;
  totalSuppliers: number;
  totalActiveAds: number;
  totalSales: number;
  monthlyRevenue: number;
  suspiciousActivities: SuspiciousActivity[];
  userGrowth: GrowthData[];
  salesGrowth: GrowthData[];
}

export interface SuspiciousActivity {
  id: string;
  type: "multiple_accounts" | "fraud_attempt" | "suspicious_transaction" | "spam";
  userId: string;
  userName: string;
  description: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
  status: "pending" | "reviewed" | "resolved";
}

export interface GrowthData {
  date: string;
  value: number;
}

// Product with Admin Data
export interface AdminProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  sellerId: string;
  sellerName: string;
  type: "venda_final" | "fornecedor";
  stock: number;
  views: number;
  sales: number;
  createdAt: string;
  status: "pending" | "approved" | "rejected" | "removed";
  featured: boolean;
  reports: number;
}
