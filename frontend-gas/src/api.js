const api = {
  get: (url, params) => {
    let action = '';
    if (url.startsWith('/bookings')) action = 'getBookings';
    else if (url.startsWith('/guests')) action = 'getGuests';
    else if (url.startsWith('/products')) action = 'getProducts';
    else if (url.startsWith('/refunds')) action = 'getRefunds';
    else if (url.startsWith('/users')) action = 'getUsers';
    else if (url.startsWith('/profile')) action = 'getProfile';
    else if (url.startsWith('/dashboard')) action = 'getDashboardFull';
    
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(data => resolve({ data }))
        .withFailureHandler(err => reject(err))
        .doPost({ action, params });
    });
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
    
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(data => resolve({ data }))
        .withFailureHandler(err => reject(err))
        .doPost({ action, data: payload });
    });
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
    }
    
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(data => resolve({ data }))
        .withFailureHandler(err => reject(err))
        .doPost({ action, id, data });
    });
  }
};

export default api;
