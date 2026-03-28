import axios from 'axios';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzb_yy8Hx4uVN0zIab3JZ4fJ9FzLl5rxVQUXWEpgG6nhDzZyB6Mnv9ENJwYaMRIdDzuSw/exec';

const api = {
  // Add a fake defaults object to prevent crashes in AuthContext
  defaults: {
    headers: {
      common: {}
    }
  },
  
  get: (url, params) => {
    let action = '';
    if (url.startsWith('/bookings')) action = 'getBookings';
    else if (url.startsWith('/guests')) action = 'getGuests';
    else if (url.startsWith('/products')) action = 'getProducts';
    else if (url.startsWith('/refunds')) action = 'getRefunds';
    else if (url.startsWith('/users')) action = 'getUsers';
    else if (url.startsWith('/profile')) action = 'getProfile';
    else if (url.startsWith('/dashboard')) action = 'getDashboardFull';
    
    return axios.post(GAS_URL, { action, params }, {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    }).then(res => ({ data: res.data }));
  },
  
  post: (url, data) => {
    let action = '';
    let payload = data;
    
    if (url.includes('/refund')) {
      action = 'addRefund';
      if (url.startsWith('/bookings/')) {
        const bookingId = url.split('/')[2];
        payload = { ...data, booking_id: bookingId };
      }
    } else if (url.startsWith('/bookings')) {
      action = 'addBooking';
    } else if (url.startsWith('/payments')) {
      action = 'addPayment';
    } else if (url.startsWith('/login')) {
      action = 'login';
    }
    
    return axios.post(GAS_URL, { action, data: payload }, {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    }).then(res => ({ data: res.data }));
  },

  patch: (url, data) => {
    // Similar to put, but for specific status updates
    const parts = url.split('/');
    let id = parts[parts.length - 2]; 
    let action = 'updateBooking'; // Default for bookings patch
    
    return axios.post(GAS_URL, { action, id, data }, {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    }).then(res => ({ data: res.data }));
  },
  
  put: (url, data) => {
    const parts = url.split('/');
    let action = '';
    let id = parts[parts.length - 1];

    if (url.startsWith('/bookings')) {
       action = 'updateBooking';
    } else if (url.startsWith('/profile/password')) {
       action = 'updatePassword';
    } else if (url.startsWith('/profile/avatar')) {
       action = 'updateAvatar';
    } else if (url.startsWith('/guests')) {
       action = 'updateGuest'; // If guest update is implemented
    }
    
    return axios.post(GAS_URL, { action, id, data }, {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    }).then(res => ({ data: res.data }));
  },

  delete: (url) => {
    const parts = url.split('/');
    let action = '';
    let id = parts[parts.length - 1];
    
    if (url.startsWith('/bookings')) action = 'deleteBooking';

    return axios.post(GAS_URL, { action, id }, {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    }).then(res => ({ data: res.data }));
  }
};

export default api;

