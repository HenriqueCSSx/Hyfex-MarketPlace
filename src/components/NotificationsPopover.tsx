import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Trash2, XCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationsPopoverProps {
    className?: string;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ className }) => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <Check className="h-4 w-4 text-green-500" />;
            case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className={`relative ${className}`}>
                    <Bell className="h-5 w-5 text-zinc-400 hover:text-white transition-colors" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] flex items-center justify-center p-0 border-2 border-background animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden" align="end">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
                    <h4 className="font-bold text-white text-sm uppercase tracking-wider">Notificações</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="h-6 text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest px-2"
                        >
                            Marcar lidas
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full p-8 text-zinc-500 text-xs uppercase tracking-widest">
                            Carregando...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500 space-y-3">
                            <Bell className="h-8 w-8 opacity-20" />
                            <p className="text-xs uppercase tracking-widest">Nenhuma notificação</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 transition-colors hover:bg-white/[0.02] relative group ${!notification.read ? 'bg-primary/5' : ''}`}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1 shrink-0">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-zinc-400'}`}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-[10px] text-zinc-600 uppercase tracking-wider whitespace-nowrap ml-2">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                                                {notification.message}
                                            </p>
                                            {notification.link && (
                                                <a
                                                    href={notification.link}
                                                    className="text-[10px] text-primary hover:underline uppercase tracking-wide inline-block mt-2 font-bold"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Ver Detalhes →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    {!notification.read && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};
