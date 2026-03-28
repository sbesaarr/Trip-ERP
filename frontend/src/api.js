import axios from 'axios';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzb_yy8Hx4uVN0zIab3JZ4fJ9FzLl5rxVQUXWEpgG6nhDzZyB6Mnv9ENJwYaMRIdDzuSw/exec';

const api = {
  // Polyfill for axios compatibility
  defaults: { headers: { common: {} } },
  
  // Internal helper to map axios calls to GAS actions
  _call: (action, id, data, params) => {
     return axios.post(GAS_URL, { action, id, data, params, token: localStorage.getItem('token') }, {
       headers: { 'Content-Type': 'text/plain;charset=utf-8' }
     }).then(res => {
        // If GAS returns an error object, throw it so .catch() handles it
        if (res.data && res.data.status === 'error') {
           throw new Error(res.data.message || 'Error from Backend');
        }
        return { data: res.data };
     });
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
    else if (url.startsWith('/settings/ships')) action = 'getShips';
    else if (url.startsWith('/settings/sales')) action = 'getSales';
    else if (url.startsWith('/settings/services')) action = 'getProducts';
    else if (url.startsWith('/settings/categories')) action = 'getCategories';
    else if (url.startsWith('/settings/ship_types')) action = 'getShipTypes';
    
    return api._call(action, null, null, params);
  },
  
  post: (url, data) => {
    let action = '';
    let payload = data;
    
    if (url.includes('/refund')) {
      action = 'addRefund';
      if (url.startsWith('/bookings/')) {
        const parts = url.split('/');
        payload = { ...data, booking_id: parts[2] };
      }
    } 
    else if (url.startsWith('/guests')) action = 'addGuest';
    else if (url.startsWith('/bookings')) action = 'addBooking';
    else if (url.startsWith('/payments')) action = 'addPayment';
    else if (url.startsWith('/login')) action = 'login';
    else if (url.startsWith('/users')) action = 'addUser';
    // Settings Map
    else if (url === '/settings/ships') action = 'addShip';
    else if (url === '/settings/sales') action = 'addSales';
    else if (url === '/settings/services') action = 'addProduct';
    else if (url === '/settings/categories') action = 'addCategory';
    else if (url === '/settings/ship_types') action = 'addShipType';
    
    return api._call(action, null, payload);
  },

  put: (url, data) => {
    const parts = url.split('/');
    let action = '';
    let id = parts[parts.length - 1];

    if (url.startsWith('/bookings')) action = 'updateBooking';
    else if (url.startsWith('/guests')) action = 'updateGuest';
    else if (url.startsWith('/profile/password')) action = 'updatePassword';
    else if (url.startsWith('/profile/avatar')) action = 'updateAvatar';
    else if (url.includes('/reset')) {
        action = 'resetPassword';
        id = parts[parts.length - 2];
    }
    
    return api._call(action, id, data);
  },

  patch: (url, data) => {
    const parts = url.split('/');
    let id = parts[parts.length - 2]; 
    return api._call('updateBooking', id, data);
  },
  
  delete: (url) => {
    const parts = url.split('/');
    let action = '';
    let id = parts[parts.length - 1];
    
    if (url.startsWith('/bookings')) action = 'deleteBooking';
    else if (url.startsWith('/guests')) action = 'deleteGuest';
    else if (url.startsWith('/users')) action = 'deleteUser';
    else if (url.includes('/settings/ships')) action = 'deleteShip';
    else if (url.includes('/settings/sales')) action = 'deleteSales';
    else if (url.includes('/settings/services')) action = 'deleteProduct';
    else if (url.includes('/settings/categories')) action = 'deleteCategory';
    else if (url.includes('/settings/ship_types')) action = 'deleteShipType';

    return api._call(action, id);
  }
};

export default api;
