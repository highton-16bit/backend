import { apiClient } from './api'
import type { AuthRequest } from '../types'
import { STORAGE_KEYS } from '../config/env'

export const authService = {
  login: async (username: string): Promise<void> => {
    const request: AuthRequest = { username }
    await apiClient.post('/auth', request)
    localStorage.setItem(STORAGE_KEYS.USER, username)
  },

  logout: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER)
  },

  getCurrentUser: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.USER)
  },

  isLoggedIn: (): boolean => {
    return !!localStorage.getItem(STORAGE_KEYS.USER)
  },
}
