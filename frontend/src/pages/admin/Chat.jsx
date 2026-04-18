import React, { useState, useEffect, useRef } from 'react';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { MessageSquare, Send, Users, User, Stethoscope, Shield, Search, Filter, Crown, Check, CheckCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';

const Chat = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('all');
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    loadRooms();
  }, [filter]);

  useEffect(() => {
    if (!selectedRoom) return;

    loadMessages();

    const socket = getSocket();
    const roomId = selectedRoom.room_id;

    const onMessage = (payload) => {
      if (String(payload.room_id) !== String(roomId)) return;
      setMessages((prev) => {
        if (prev.some((m) => m.message_id === payload.message_id)) return prev;
        return [...prev, payload];
      });
    };

    if (socket) {
      socket.emit('chat:join', roomId);
      socket.on('chat:message', onMessage);
    }

    const interval = setInterval(loadMessages, socket ? 20000 : 3000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.emit('chat:leave', roomId);
        socket.off('chat:message', onMessage);
      }
    };
  }, [selectedRoom]);

  useEffect(() => {
    if (!messages.length) return;
    const container = messageListRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [messages]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chat/rooms');
      let allRooms = response.data.data || [];

      // Filter by room type if needed
      if (filter !== 'all') {
        allRooms = allRooms.filter(room => room.room_type === filter);
      }

      setRooms(allRooms);
      if (allRooms.length > 0 && !selectedRoom) {
        setSelectedRoom(allRooms[0]);
      }
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedRoom) return;

    try {
      const response = await api.get(`/chat/rooms/${selectedRoom.room_id}/messages`);
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);
    try {
      const { data } = await api.post(`/chat/rooms/${selectedRoom.room_id}/messages`, {
        messageText: text,
      });
      const sent = data?.data;
      if (sent?.message_id && sent?.created_at) {
        setMessages((prev) => [...prev, { ...sent, is_read: false, read_at: null }]);
      } else {
        loadMessages();
      }
    } catch (error) {
      setNewMessage(text);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getRoomName = (room) => {
    if (room.room_type === 'customer_doctor') {
      return `${room.customer?.user?.first_name} ${room.customer?.user?.last_name} ↔ Dr. ${room.doctor?.user?.first_name} ${room.doctor?.user?.last_name}`;
    } else if (room.room_type === 'customer_staff') {
      return `${room.customer?.user?.first_name} ${room.customer?.user?.last_name} ↔ Staff Support`;
    }
    return 'Chat Room';
  };

  const getRoomIcon = (room) => {
    if (room.room_type === 'customer_doctor') {
      return Stethoscope;
    } else if (room.room_type === 'customer_staff') {
      return Shield;
    }
    return MessageSquare;
  };

  const getRoomTypeColor = (roomType) => {
    switch (roomType) {
      case 'customer_doctor':
        return {
          gradient: 'from-emerald-500 to-emerald-600',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
        };
      case 'customer_staff':
        return {
          gradient: 'from-blue-500 to-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
        };
      default:
        return {
          gradient: 'from-slate-500 to-slate-600',
          bg: 'bg-slate-50',
          border: 'border-slate-200',
        };
    }
  };

  if (initialLoad && loading) return <Loading />;

  const customerStaffRoomsCount = rooms.filter(r => r.room_type === 'customer_staff').length;

  return (
    <div className="page-shell">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Conversations</p>
                <p className="text-2xl font-black text-slate-900">{rooms.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Support Chats</p>
                <p className="text-2xl font-black text-blue-600">{customerStaffRoomsCount}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Header Area */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pt-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">Support Center</h2>
            {loading && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium ml-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                Updating
              </div>
            )}
          </div>
        </div>

        <div
          className={`flex min-h-[500px] rounded-3xl border border-slate-100 bg-white/80 backdrop-blur overflow-hidden shadow-sm transition-opacity duration-200 ${
            loading ? 'opacity-60 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Chat Rooms Sidebar */}
          <div className="w-80 border-r border-slate-100 bg-slate-50/50 overflow-y-auto shrink-0">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-xl text-slate-800 mb-1">All Conversations</h3>
              <p className="text-xs text-slate-500">Select a chat to view messages</p>
            </div>
            <div className="space-y-1 p-3">
              {rooms.map((room) => {
                const RoomIcon = getRoomIcon(room);
                const roomColors = getRoomTypeColor(room.room_type);
                return (
                  <button
                    key={room.room_id}
                    onClick={() => setSelectedRoom(room)}
                    className={`w-full text-left p-4 rounded-xl transition-colors flex items-start gap-3 ${selectedRoom?.room_id === room.room_id
                        ? 'bg-slate-100 text-slate-800 font-semibold'
                        : 'hover:bg-slate-100 text-slate-700'
                      }`}
                  >
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${roomColors.gradient} flex items-center justify-center flex-shrink-0`}>
                      <RoomIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{getRoomName(room)}</p>
                      {room.appointment_id && (
                        <p className="text-xs text-slate-500 mt-1">Appointment #{room.appointment_id}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1 capitalize">{room.room_type.replace('_', ' ')}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col">
            {selectedRoom ? (
              <>
                <div className="p-6 border-b border-slate-100 bg-white/70 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const RoomIcon = getRoomIcon(selectedRoom);
                      const roomColors = getRoomTypeColor(selectedRoom.room_type);
                      return (
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${roomColors.gradient} flex items-center justify-center shadow-lg`}>
                          <RoomIcon className="w-6 h-6 text-white" />
                        </div>
                      );
                    })()}
                    <div>
                      <h2 className="font-bold text-xl text-slate-900">{getRoomName(selectedRoom)}</h2>
                      {selectedRoom.appointment_id && (
                        <p className="text-sm text-slate-500 mt-1">Appointment #{selectedRoom.appointment_id}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  ref={messageListRef}
                  className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/60"
                >
                  {messages.length === 0 ? (
                    <EmptyState
                      icon={MessageSquare}
                      title="No messages yet"
                      message="Start the conversation with the participants"
                    />
                  ) : (
                    messages.map((message) => {
                      const isAdminMessage = message.sender_id === user?.userId;
                      return (
                        <div
                          key={message.message_id}
                          className={`flex ${isAdminMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-md p-4 rounded-2xl shadow-sm ${isAdminMessage
                                ? 'bg-slate-800 text-white rounded-br-none'
                                : 'bg-white text-slate-900 rounded-bl-none border border-slate-100'
                              }`}
                          >
                            <p className="text-sm">{message.message_text}</p>
                            <div
                              className={`text-xs mt-1 flex items-center justify-between gap-2 flex-wrap ${isAdminMessage
                                  ? 'text-slate-300'
                                  : 'text-slate-500'
                                }`}
                            >
                              <span className="flex items-center gap-1">
                                {formatDateTime(message.created_at)}
                              </span>
                              {isAdminMessage && (
                                <span className="flex items-center gap-1">
                                  {message.is_read ? (
                                    <>
                                      <CheckCheck className="w-3.5 h-3.5 flex-shrink-0" />
                                      <span>Read</span>
                                      {message.read_at && (
                                        <span className="opacity-80">· {formatRelativeTime(message.read_at)}</span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3.5 h-3.5 flex-shrink-0" />
                                      <span>Sent</span>
                                    </>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-100 bg-white/70 backdrop-blur-sm">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="input-field flex-1 !rounded-xl !py-3.5"
                    />
                    <Button type="submit" disabled={sending || !newMessage.trim()} className="!rounded-xl !px-5 !py-3.5">
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-slate-50/60">
                <EmptyState
                  icon={MessageSquare}
                  title="Select a chat"
                  message="Choose a conversation from the sidebar to begin"
                />
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default Chat;
