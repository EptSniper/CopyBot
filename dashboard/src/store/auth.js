import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      host: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const data = await api.post('/auth/login', { email, password })
        set({
          user: data.user,
          host: data.host,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        })
        return data
      },

      register: async (email, password, name) => {
        const data = await api.post('/auth/register', { email, password, name })
        set({
          user: data.user,
          host: data.host,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        })
        return data
      },

      logout: async () => {
        const { refreshToken } = get()
        try {
          await api.post('/auth/logout', { refreshToken })
        } catch (e) {
          // ignore
        }
        set({
          user: null,
          host: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) throw new Error('No refresh token')
        const data = await api.post('/auth/refresh', { refreshToken })
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
        return data.accessToken
      },

      updateHost: (host) => set({ host }),
    }),
    {
      name: 'copybot-auth',
      partialize: (state) => ({
        user: state.user,
        host: state.host,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
