import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { useNotifications } from '../../context/NotificationContext';
import { formatDateTime } from '../../utils/formatters';
import { Bell, Check, ShoppingCart, Calendar, Gift, Settings, Trash2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Notifications = () => {
  const { notifications: contextNotifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (contextNotifications) {
      setNotifications(contextNotifications);
    }
  }, [contextNotifications]);

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'all') return true;
    return notification.notification_type === filter;
  });

  const handleMarkAllRead = async () => {
    if (contextNotifications && contextNotifications.length > 0) {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    }
  };

  const handleDelete = async (notificationId) => {
    if (contextNotifications && contextNotifications.length > 0) {
      await deleteNotification(notificationId);
      toast.success('Notification deleted');
    }
  };

  const handleMarkRead = async (notificationId) => {
    if (contextNotifications && contextNotifications.length > 0) {
      await markAsRead(notificationId);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order': return ShoppingCart;
      case 'appointment': return Calendar;
      case 'offer': return Gift;
      case 'system': return Settings;
      default: return Bell;
    }
  };

  const getNotificationColors = (type) => {
    switch (type) {
      case 'order': return { gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'appointment': return { gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
      case 'offer': return { gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
      case 'system': return { gradient: 'from-slate-500 to-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
      default: return { gradient: 'from-slate-700 to-slate-800', bg: 'bg-slate-50', border: 'border-slate-200' };
    }
  };

  const filters = [
    { value: 'all', label: 'All', icon: Bell, color: 'slate' },
    { value: 'unread', label: 'Unread', icon: CheckCircle, color: 'blue' },
  ];

  if (loading) return <Layout><Loading /></Layout>;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Layout>
      <div className="page-shell">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Bell className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Notifications</h2>
          </div>
          {notifications.length > 0 && unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllRead} className="!rounded-xl">
              <Check className="w-4 h-4 inline mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Statistics */}
        {notifications.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="card card-muted">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total</p>
                  <p className="text-2xl font-black text-slate-900">{notifications.length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg">
                  <Bell className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="card card-muted">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Unread</p>
                  <p className="text-2xl font-black text-blue-600">{unreadCount}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="card card-muted">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Read</p>
                  <p className="text-2xl font-black text-emerald-600">{notifications.length - unreadCount}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Check className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-6">
          {filters.map((f) => {
            const Icon = f.icon;
            const isActive = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 ${isActive
                  ? 'bg-slate-800 text-white shadow-lg shadow-slate-500/30'
                  : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                {f.label}
              </button>
            );
          })}
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Bell}
              title="No notifications"
              message="You're all caught up!"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.notification_type);
              const colors = getNotificationColors(notification.notification_type);
              return (
                <div
                  key={notification.notification_id}
                  className={`card hover:shadow-xl transition-all duration-300 ${!notification.is_read ? `border-l-4 border-l-${colors.gradient.split('-')[1]}-500 ${colors.bg}` : ''
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-slate-900">{notification.title}</h3>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-slate-700 mb-2 leading-relaxed">{notification.message}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(notification.created_at)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!notification.is_read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkRead(notification.notification_id)}
                        >
                          <Check className="w-4 h-4 inline mr-1" />
                          Mark Read
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(notification.notification_id)}
                      >
                        <Trash2 className="w-4 h-4 inline mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Notifications;
