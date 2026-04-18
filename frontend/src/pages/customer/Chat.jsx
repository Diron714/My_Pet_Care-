import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { MessageSquare, Send, Stethoscope, Shield, Clock, MessageCircle, Check, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';

const Chat = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [creatingSupportRoom, setCreatingSupportRoom] = useState(false);
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    loadRooms();
  }, []);

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

  const loadRooms = async (roomIdToSelect) => {
    try {
      setLoading(true);
      const response = await api.get('/chat/rooms');
      const roomList = response.data.data || [];
      setRooms(roomList);

      if (roomList.length === 0) {
        setSelectedRoom(null);
        return;
      }

      if (roomIdToSelect != null) {
        const id = Number(roomIdToSelect);
        const target = roomList.find((r) => r.room_id === id);
        setSelectedRoom(target || roomList[0]);
        return;
      }

      if (selectedRoom) {
        const stillExists = roomList.find((r) => r.room_id === selectedRoom.room_id);
        setSelectedRoom(stillExists || roomList[0]);
      } else {
        setSelectedRoom(roomList[0]);
      }
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSupportChatRoom = async () => {
    try {
      setCreatingSupportRoom(true);
      const response = await api.post('/chat/rooms', {
        room_type: 'customer_staff',
      });
      const roomId = response.data?.data?.room_id;
      await loadRooms(roomId);
    } catch (error) {
      console.error('Error creating support chat room:', error);
      toast.error(error.response?.data?.message || 'Failed to start support chat');
    } finally {
      setCreatingSupportRoom(false);
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
      const fn = room.doctor?.user?.first_name;
      const ln = room.doctor?.user?.last_name;
      if (fn || ln) return `Past chat · Dr. ${fn || ''} ${ln || ''}`.trim();
      return 'Past doctor chat';
    }
    if (room.room_type === 'customer_staff') {
      return 'Admin support';
    }
    return 'Chat';
  };

  const getRoomIcon = (room) => {
    if (room.room_type === 'customer_doctor') {
      return Stethoscope;
    }
    if (room.room_type === 'customer_staff') {
      return Shield;
    }
    return MessageSquare;
  };

  const getRoomStyles = (room) => {
    if (room.room_type === 'customer_doctor') {
      return {
        gradient: 'from-slate-500 to-slate-600',
        bg: 'bg-slate-50',
        border: 'border-slate-200',
      };
    }
    if (room.room_type === 'customer_staff') {
      return {
        gradient: 'from-blue-500 to-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
      };
    }
    return {
      gradient: 'from-slate-500 to-slate-600',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
    };
  };

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="page-shell h-[calc(100vh-200px)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-2xl bg-violet-50 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-violet-600" />
          </div>
          <h2 className="text-xl font-black text-slate-800">Support Chat</h2>
        </div>

        <div className="flex h-full rounded-3xl border border-slate-100 bg-white/80 backdrop-blur overflow-hidden shadow-sm">
          <div className="w-80 border-r border-slate-100 bg-slate-50/50 overflow-y-auto shrink-0">
            <div className="p-6 border-b border-slate-100 space-y-3">
              <div>
                <h3 className="font-bold text-xl text-slate-800 mb-1">Conversations</h3>
                <p className="text-xs text-slate-500">Chat with an administrator</p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={createSupportChatRoom}
                loading={creatingSupportRoom}
                className="w-full !bg-slate-800 hover:!bg-slate-900"
              >
                <MessageCircle className="w-4 h-4 inline mr-1" />
                New support chat
              </Button>
            </div>
            <div className="space-y-1 p-3">
              {rooms.map((room) => {
                const RoomIcon = getRoomIcon(room);
                const roomStyles = getRoomStyles(room);
                return (
                  <button
                    key={room.room_id}
                    onClick={() => setSelectedRoom(room)}
                    className={`w-full text-left p-4 rounded-xl transition-colors flex items-start gap-3 ${selectedRoom?.room_id === room.room_id
                      ? 'bg-slate-100 text-slate-800 font-semibold'
                      : 'hover:bg-slate-100 text-slate-700'
                      }`}
                  >
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${roomStyles.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <RoomIcon className="w-6 h-6 text-white" />
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

          <div className="flex-1 flex flex-col">
            {selectedRoom ? (
              <>
                <div className="p-6 border-b border-slate-100 bg-white/70 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const RoomIcon = getRoomIcon(selectedRoom);
                      const roomStyles = getRoomStyles(selectedRoom);
                      return (
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${roomStyles.gradient} flex items-center justify-center shadow-lg`}>
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
                      message="Say hello to the admin team"
                    />
                  ) : (
                    messages.map((message) => {
                      const isSentByCurrentUser = message.sender_id === user?.userId;
                      return (
                        <div
                          key={message.message_id}
                          className={`flex ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-md p-4 rounded-2xl shadow-sm ${isSentByCurrentUser
                              ? 'bg-slate-800 text-white rounded-br-none'
                              : 'bg-white text-slate-900 rounded-bl-none border border-slate-100'
                              }`}
                          >
                            <p className="text-sm">{message.message_text}</p>
                            <div
                              className={`text-xs mt-1 flex items-center justify-between gap-2 flex-wrap ${isSentByCurrentUser
                                ? 'text-slate-300'
                                : 'text-slate-500'
                                }`}
                            >
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                {formatDateTime(message.created_at)}
                              </span>
                              {isSentByCurrentUser && (
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
    </Layout>
  );
};

export default Chat;
