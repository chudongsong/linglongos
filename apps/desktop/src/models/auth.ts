import { createModel } from '@rematch/core';

interface AuthState {
  user: { id: string; name: string; email: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const auth = createModel()({
  state: {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  } as AuthState,
  
  reducers: {
    loginStart: (state) => ({
      ...state,
      isLoading: true,
      error: null,
    }),
    loginSuccess: (state, payload) => ({
      ...state,
      isLoading: false,
      isAuthenticated: true,
      user: payload.user,
      token: payload.token,
    }),
    loginFailure: (state, payload) => ({
      ...state,
      isLoading: false,
      error: payload,
    }),
    logout: () => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    }),
  },
  
  effects: (dispatch) => ({
    async login(userData: { email: string; password: string }) {
      dispatch.auth.loginStart();
      try {
        // 实际项目中替换为API调用
        const response = await new Promise((resolve) => 
          setTimeout(() => resolve({ 
            user: { id: '1', name: 'User', email: userData.email }, 
            token: 'dummy-token' 
          }), 1000)
        );
        dispatch.auth.loginSuccess(response);
        return true;
      } catch (err) {
        dispatch.auth.loginFailure(err instanceof Error ? err.message : 'Login failed');
        return false;
      }
    },
  }),
});

export default auth;