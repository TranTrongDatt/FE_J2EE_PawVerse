import api from './axios';

const bookingService = {
  // User endpoints
  createBooking: (data) => api.post('/api/user/bookings', data),
  getMyBookings: () => api.get('/api/user/bookings'),
  cancelBooking: (bookingId) => api.put(`/api/user/bookings/${bookingId}/cancel`),

  // Staff endpoints
  getAllBookings: (params) => api.get('/api/staff/bookings', { params }),
  getBookingById: (bookingId) => api.get(`/api/staff/bookings/${bookingId}`),
  updateBookingStatus: (bookingId, status) => api.put(`/api/staff/bookings/${bookingId}/status`, { status }),
  getBookingStats: () => api.get('/api/staff/bookings/stats'),
};

export default bookingService;
