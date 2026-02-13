import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AdminGuardProps {
    children: ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!user || !user.isAdmin) {
        return <Navigate to="/marketplace" replace />;
    }

    return <>{children}</>;
};

export default AdminGuard;
