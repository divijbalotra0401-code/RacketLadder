import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
})

// Attach auth token to every request if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('racket_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const register = (username: string, password: string) =>
  api.post('/auth/register', { username, password }).then(r => r.data)

export const login = (username: string, password: string) =>
  api.post('/auth/login', { username, password }).then(r => r.data)

export const getMe = () =>
  api.get('/auth/me').then(r => r.data)

// Leagues
export const createLeague = (name: string) => api.post('/leagues', { name }).then(r => r.data)

// Players
export const addPlayer = (name: string, leagueId: number) => api.post('/players', { name, leagueId }).then(r => r.data)

// Matches
export const recordMatch = (payload: any) => api.post('/matches', payload).then(r => r.data)

// Read (public, no auth needed)
export const getLeaderboard = (leagueId: number) => api.get(`/leagues/${leagueId}/leaderboard`).then(r => r.data)
export const getMatches = (leagueId: number) => api.get(`/leagues/${leagueId}/matches`).then(r => r.data)
export const getGlobalLeaderboard = () => api.get('/leaderboard/global').then(r => r.data)
