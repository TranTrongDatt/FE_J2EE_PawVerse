import api from './axios';

export const chatbotService = {
  sendMessage: async (message) => {
    try {
      const response = await api.post('/api/public/chatbot/send-message', {
        message: message,
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          data: {
            message: response.data.data.response,
          },
        };
      } else {
        throw new Error(response.data?.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chatbot API error:', error);

      // Handle rate limit (429)
      if (error.response?.status === 429) {
        return {
          success: false,
          rateLimited: true,
          data: {
            message: error.response.data?.message || 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng đợi một chút.',
          },
        };
      }

      return {
        success: false,
        data: {
          message: 'Xin lỗi, đã có lỗi xảy ra khi kết nối với chatbot. Vui lòng thử lại sau.',
        },
      };
    }
  },
};
