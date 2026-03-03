import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

let storeRef = null;
let isRefreshing = false;
let refreshSubscribers = [];

export function setApiStore(store) {
  storeRef = store;
}

function subscribeToTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

api.interceptors.request.use((config) => {
  try {
    // Try Redux store first, fall back to localStorage
    const token = storeRef?.getState?.()?.auth?.token || localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    
    // Only super_admin can optionally send X-School-ID header (when managing a specific school)
    // Regular users have schoolId embedded in JWT already
    if (storeRef && storeRef.getState) {
      const state = storeRef.getState();
      const role = state?.auth?.user?.role;
      const schoolId = state?.auth?.user?.school_id || state?.auth?.schoolId;
      
      // Only add X-School-ID header for super_admin if they're viewing a specific school
      if (role === 'super_admin' && schoolId) {
        config.headers['X-School-ID'] = schoolId;
      }
    }
  } catch (e) {
    // localStorage may be unavailable (private browsing)
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config;
    
    // Handle 401 errors - attempt token refresh
    if (err.response?.status === 401 && orig && !orig._retry) {
      orig._retry = true;
      
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refresh = storeRef?.getState?.()?.auth?.refreshToken || localStorage.getItem('refreshToken');
          if (refresh) {
            const { data } = await axios.post('/api/auth/refresh', { refreshToken: refresh });
            isRefreshing = false;
            
            // Update Redux store with new tokens
            if (storeRef && storeRef.dispatch) {
              storeRef.dispatch({
                type: 'auth/setAuth',
                payload: {
                  accessToken: data.accessToken,
                  refreshToken: data.refreshToken,
                  user: data.user,
                },
              });
            }
            
            // Update localStorage
            localStorage.setItem('token', data.accessToken);
            if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
            if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
            
            // Notify all waiting requests of new token
            onTokenRefreshed(data.accessToken);
            
            // Retry original request with new token
            orig.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(orig);
          }
        } catch (refreshErr) {
          isRefreshing = false;
          // Refresh failed - clear auth and redirect to login
          try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            if (storeRef && storeRef.dispatch) {
              storeRef.dispatch({ type: 'auth/logout' });
            }
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          } catch (e) {}
          return Promise.reject(refreshErr);
        }
      } else {
        // Token refresh in progress - wait for it
        return new Promise((resolve) => {
          subscribeToTokenRefresh((token) => {
            orig.headers.Authorization = `Bearer ${token}`;
            resolve(api(orig));
          });
        });
      }
    }
    
    return Promise.reject(err);
  }
);

export default api;
