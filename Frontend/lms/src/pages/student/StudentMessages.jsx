import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Send, ArrowLeft, BookOpen, User,
} from 'lucide-react';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';

const StudentMessages = () => {
  const { user } = useAuth();
  const toast = useToast();
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected conversation
  const [selected, setSelected] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // New message
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/messages/my-messages');
      setConversations(res.data.conversations || []);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (conv) => {
    setSelected(conv);
    setChatLoading(true);
    try {
      const res = await api.get(`/messages/course/${conv.course.id}`);
      setChatMessages(res.data.messages || []);
    } catch {
      toast.error('Failed to load chat');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selected) return;

    setSending(true);
    try {
      // Find the instructor of this course
      const courseRes = await api.get(`/courses/${selected.course.id}`);
      const instructorId = courseRes.data.course.instructor?.id;

      if (!instructorId) {
        toast.error('Instructor not found');
        return;
      }

      const res = await api.post('/messages', {
        receiver_id: instructorId,
        course_id: selected.course.id,
        content: newMessage.trim(),
      });

      setChatMessages((prev) => [...prev, res.data.data]);
      setNewMessage('');
      toast.success('Message sent');
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

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent
                      rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Messages</h1>
        <p className="text-gray-500 text-sm mt-1">
          Chat with your instructors about courses
        </p>
      </div>

      {/* No conversations */}
      {conversations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center
                          justify-center mx-auto mb-4">
            <MessageSquare size={28} className="text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-2">No messages yet</h3>
          <p className="text-gray-500 text-sm mb-4">
            Visit a course you're enrolled in to start a conversation
          </p>
          <Link
            to="/student/enrollments"
            className="inline-block bg-blue-600 text-white px-5 py-2.5
                       rounded-xl text-sm font-semibold hover:bg-blue-700"
          >
            Go to My Enrollments
          </Link>
        </div>
      ) : !selected ? (
        // ── INBOX VIEW ─────────────────────────────────
        <div className="space-y-3">
          {conversations.map((conv) => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            return (
              <button
                key={conv.course.id}
                onClick={() => openConversation(conv)}
                className="w-full bg-white border border-gray-200 rounded-xl
                           p-4 hover:border-blue-300 hover:shadow-sm
                           transition-all text-left flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center
                                justify-center flex-shrink-0">
                  <BookOpen size={20} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {conv.course.title}
                    </h3>
                    {conv.unread > 0 && (
                      <span className="bg-red-500 text-white text-xs font-semibold
                                       px-2 py-0.5 rounded-full flex-shrink-0">
                        {conv.unread} new
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {lastMsg?.content || 'No messages'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {lastMsg && formatTime(lastMsg.created_at)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        // ── CHAT VIEW ──────────────────────────────────
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden
                        flex flex-col" style={{ height: '70vh' }}>

          {/* Chat Header */}
          <div className="px-5 py-4 border-b border-gray-200 flex items-center
                          gap-3 bg-gray-50">
            <button
              onClick={() => { setSelected(null); fetchConversations(); }}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center
                            justify-center flex-shrink-0">
              <BookOpen size={18} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {selected.course.title}
              </h3>
              <p className="text-xs text-gray-500">Conversation with instructor</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50">
            {chatLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent
                                rounded-full animate-spin" />
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  No messages yet. Say hello!
                </p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                      {!isMine && (
                        <p className="text-xs text-gray-500 mb-1 ml-1">
                          {msg.sender?.name}
                        </p>
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
            className="border-t border-gray-200 p-3 flex items-center gap-2
                       bg-white"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                         disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2.5
                         rounded-xl transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};

export default StudentMessages;