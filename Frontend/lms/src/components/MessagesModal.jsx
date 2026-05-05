import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, User } from 'lucide-react';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import { useToast } from './Toast';

const MessagesModal = ({ isOpen, onClose, course }) => {
  const { user } = useAuth();
  const toast = useToast();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [studentId, setStudentId] = useState(null);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Fetch messages when opened
  useEffect(() => {
    if (isOpen && course?.id) {
      fetchMessages();
    }
  }, [isOpen, course?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/messages/course/${course.id}`);
      const msgs = res.data.messages || [];
      setMessages(msgs);

      // Find the student id (the other party in conversation)
      const studentMsg = msgs.find((m) => m.sender_id !== user?.id);
      if (studentMsg) {
        setStudentId(studentMsg.sender_id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (!studentId) {
      toast.error('No student has messaged yet — wait for a student to start');
      return;
    }

    setSending(true);
    try {
      const res = await api.post('/messages', {
        receiver_id: studentId,
        course_id: course.id,
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, res.data.data]);
      setNewMessage('');
      toast.success('Reply sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (d) => new Date(d).toLocaleString('en-IN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden
                   flex flex-col"
        style={{ height: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center
                            justify-center">
              <MessageSquare size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">
                Course Messages
              </h2>
              <p className="text-blue-200 text-xs truncate max-w-md">
                {course?.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/10
                       rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent
                              rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center
                              justify-center mx-auto mb-3">
                <MessageSquare size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                No messages yet
              </p>
              <p className="text-xs text-gray-400">
                Students will appear here when they message you
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                    {!isMine && (
                      <div className="flex items-center gap-1.5 mb-1 ml-1">
                        <div className="w-5 h-5 bg-green-100 rounded-full
                                        flex items-center justify-center">
                          <User size={10} className="text-green-700" />
                        </div>
                        <p className="text-xs text-gray-600 font-medium">
                          {msg.sender?.name}
                        </p>
                      </div>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm
                      ${isMine
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
                      }`}>
                      {msg.content}
                    </div>
                    <p className={`text-xs text-gray-400 mt-1
                      ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="border-t border-gray-200 p-3 flex items-center gap-2 bg-white"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              studentId
                ? 'Type your reply...'
                : 'Wait for student to message first...'
            }
            disabled={sending || !studentId}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl
                       text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                       disabled:opacity-50 disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim() || !studentId}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2.5
                       rounded-xl transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessagesModal;