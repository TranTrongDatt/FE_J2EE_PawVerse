import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, AlertCircle } from 'lucide-react';
import { chatbotService } from '../../api/chatbotService';
import toast from 'react-hot-toast';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Xin chào! Tôi là trợ lý AI của PawVerse. Tôi có thể giúp gì cho bạn về sản phẩm và dịch vụ của chúng tôi?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const messagesEndRef = useRef(null);
  const cooldownRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cooldown timer cleanup
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // Start a cooldown (anti-spam on frontend side)
  const startCooldown = useCallback((seconds) => {
    setCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Format bot message with rich formatting (ported from old project)
  const formatBotMessage = (content) => {
    if (!content) return '';

    // 1. Sanitize HTML
    let sanitized = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // 2. Markdown **Field:** patterns
    sanitized = sanitized
      .replace(/\*\*Tên sản phẩm:\*\*/gi, '<span class="chat-field">🏷️ Tên sản phẩm:</span>')
      .replace(/\*\*Giá bán:\*\*/gi, '<span class="chat-field">💰 Giá bán:</span>')
      .replace(/\*\*Mô tả:\*\*/gi, '<span class="chat-field">ℹ️ Mô tả:</span>')
      .replace(/\*\*Xuất xứ:\*\*/gi, '<span class="chat-field">🌍 Xuất xứ:</span>')
      .replace(/\*\*Thương hiệu:\*\*/gi, '<span class="chat-field">©️ Thương hiệu:</span>')
      .replace(/\*\*Trạng thái:\*\*/gi, '<span class="chat-field">✅ Trạng thái:</span>')
      .replace(/\*\*Danh mục:\*\*/gi, '<span class="chat-field">📁 Danh mục:</span>')
      .replace(/\*\*Công dụng:\*\*/gi, '<span class="chat-field">🔧 Công dụng:</span>')
      .replace(/\*\*Dạng sản phẩm:\*\*/gi, '<span class="chat-field">📦 Dạng sản phẩm:</span>')
      .replace(/\*\*Tần suất sử dụng:\*\*/gi, '<span class="chat-field">📅 Tần suất sử dụng:</span>')
      .replace(/\*\*Năng lượng:\*\*/gi, '<span class="chat-field">⚡ Năng lượng:</span>')
      .replace(/\*\*Chất liệu:\*\*/gi, '<span class="chat-field">🧱 Chất liệu:</span>')
      // Generic **XXX:**
      .replace(/\*\*([^:]+):\*\*/g, '<span class="chat-field">⭐ $1:</span>');

    // 3. Bullet list - Field: patterns
    sanitized = sanitized
      .replace(/- Tên sản phẩm:/gi, '<span class="chat-field">🏷️ Tên sản phẩm:</span>')
      .replace(/- Giá bán:/gi, '<span class="chat-field">💰 Giá bán:</span>')
      .replace(/- Danh mục:/gi, '<span class="chat-field">📁 Danh mục:</span>')
      .replace(/- Loại thú cưng:/gi, '<span class="chat-field">🐾 Loại thú cưng:</span>')
      .replace(/- Giống loài:/gi, '<span class="chat-field">🧬 Giống loài:</span>')
      .replace(/- Trọng lượng cơ thể:/gi, '<span class="chat-field">⚖️ Trọng lượng cơ thể:</span>')
      .replace(/- Độ tuổi:/gi, '<span class="chat-field">🎂 Độ tuổi:</span>')
      .replace(/- Xuất xứ:/gi, '<span class="chat-field">🌍 Xuất xứ:</span>')
      .replace(/- Công dụng:/gi, '<span class="chat-field">🔧 Công dụng:</span>')
      .replace(/- Năng lượng:/gi, '<span class="chat-field">⚡ Năng lượng:</span>')
      .replace(/- Chất liệu:/gi, '<span class="chat-field">🧱 Chất liệu:</span>');

    // 4. Protect number ranges (1-3, 10-15)
    sanitized = sanitized.replace(/(\d+)\s*[-–]\s*(\d+)/g, '$1__HYPHEN__$2');

    // 5. Generic bullet points
    sanitized = sanitized.replace(/^- ([^:]+):/gim, '<span class="chat-field">• $1:</span>');

    // 6. Standalone field patterns (no bullet/markdown prefix)
    const fieldPatterns = [
      { name: 'Tên sản phẩm', icon: '🏷️' },
      { name: 'Giá bán', icon: '💰' },
      { name: 'Loại thú cưng', icon: '🐾' },
      { name: 'Trọng lượng cơ thể', icon: '⚖️' },
      { name: 'Độ tuổi', icon: '🎂' },
      { name: 'Xuất xứ', icon: '🌍' },
      { name: 'Công dụng', icon: '🔧' },
      { name: 'Năng lượng', icon: '⚡' },
      { name: 'Chất liệu', icon: '🧱' },
      { name: 'Giống loài', icon: '🧬' },
      { name: 'Danh mục', icon: '📁' },
      { name: 'Tần suất sử dụng', icon: '📅' },
      { name: 'Dạng sản phẩm', icon: '📦' },
    ];

    fieldPatterns.forEach((field) => {
      const pattern = new RegExp(`^${field.name}:\\s`, 'gim');
      sanitized = sanitized.replace(
        pattern,
        `<span class="chat-field">${field.icon} ${field.name}:</span> `
      );
    });

    // 7. Restore number ranges
    sanitized = sanitized.replace(/__HYPHEN__/g, '-');

    // 8. Convert \n to <br>
    sanitized = sanitized.replace(/\n/g, '<br>');

    return sanitized;
  };

  // Handle send message
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || cooldown > 0) return;

    if (trimmed.length > 500) {
      toast.error('Tin nhắn không được vượt quá 500 ký tự');
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatbotService.sendMessage(trimmed);

      if (response.rateLimited) {
        // Rate limited — show warning and start cooldown
        const botMessage = {
          id: Date.now() + 1,
          text: response.data.message,
          sender: 'bot',
          isError: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        startCooldown(10);
        return;
      }

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.message || 'Xin lỗi, tôi không hiểu câu hỏi của bạn.',
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      // Small frontend cooldown between messages (2s)
      startCooldown(2);
    } catch (error) {
      console.error('Chatbot error:', error);

      const errorMessage = {
        id: Date.now() + 1,
        text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        sender: 'bot',
        isError: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      toast.error('Không thể kết nối với chatbot');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format timestamp
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-all duration-300 hover:scale-110 group"
          aria-label="Open chat"
        >
          <MessageCircle size={28} />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">PawVerse AI</h3>
                <p className="text-xs text-white/80">Trợ lý thú cưng</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
              aria-label="Close chat"
            >
              <X size={22} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] ${
                    message.sender === 'user'
                      ? 'bg-primary-600 text-white'
                      : message.isError
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-white text-gray-800 border border-gray-200'
                  } rounded-2xl px-4 py-2.5 shadow-sm`}
                >
                  {message.sender === 'bot' ? (
                    <div className="flex gap-2">
                      {message.isError && <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />}
                      <div
                        className="text-sm break-words chatbot-content leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatBotMessage(message.text) }}
                      />
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                  )}
                  <p
                    className={`text-[10px] mt-1 ${
                      message.sender === 'user' ? 'text-white/60' : 'text-gray-400'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin text-primary-600" size={16} />
                    <span className="text-sm text-gray-500">Đang trả lời...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={cooldown > 0 ? `Vui lòng đợi ${cooldown}s...` : 'Nhập câu hỏi của bạn...'}
                className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent max-h-24 disabled:bg-gray-50 disabled:text-gray-400"
                rows={1}
                maxLength={500}
                disabled={isLoading || cooldown > 0}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || cooldown > 0}
                className="bg-primary-600 text-white p-2.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>

            {/* Character count + cooldown */}
            <div className="flex items-center justify-between mt-1.5 px-1">
              <span className="text-[10px] text-gray-400">{input.length}/500</span>
              {cooldown > 0 && (
                <span className="text-[10px] text-amber-500 font-medium">
                  Đợi {cooldown}s
                </span>
              )}
            </div>

            {/* Quick suggestions */}
            {messages.length <= 2 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  'Sản phẩm nào tốt cho chó con?',
                  'Cách chăm sóc mèo con?',
                  'Thức ăn cho thú cưng',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-xs bg-primary-50 hover:bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full transition-colors border border-primary-200"
                    disabled={isLoading || cooldown > 0}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
