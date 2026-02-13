import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

export const StatsCard = ({
    title,
    value,
    description,
    icon: Icon,
    trend,
    className,
}: StatsCardProps) => {
    return (
        <Card className={cn("border-zinc-800 bg-zinc-950 p-6", className)}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-400">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-zinc-100">{value}</p>
                    {description && (
                        <p className="mt-1 text-xs text-zinc-500">{description}</p>
                    )}
                    {trend && (
                        <div className="mt-2 flex items-center gap-1">
                            <span
                                className={cn(
                                    "text-xs font-medium",
                                    trend.isPositive ? "text-green-500" : "text-red-500"
                                )}
                            >
                                {trend.isPositive ? "+" : ""}
                                {trend.value}%
                            </span>
                            <span className="text-xs text-zinc-500">vs mês anterior</span>
                        </div>
                    )}
                </div>
                <div className="rounded-lg bg-orange-500/10 p-3">
                    <Icon className="h-6 w-6 text-orange-500" />
                </div>
            </div>
        </Card>
    );
};
