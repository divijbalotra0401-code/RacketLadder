import React, { useState, useEffect } from 'react'
import { createLeague, addPlayer, recordMatch, getLeaderboard, getMatches, register, login, getMe, getGlobalLeaderboard } from './api'

const getPlayerColor = (id: number) => {
  const hue = (id * 137.5) % 360
  return `hsl(${hue}, 75%, 55%)`
}

export default function App() {
  const [league, setLeague] = useState<any>(null)
  const [leagueName, setLeagueName] = useState('')
  const [loadIdInput, setLoadIdInput] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [players, setPlayers] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [board, setBoard] = useState<any[]>([])
  const [globalBoard, setGlobalBoard] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'local' | 'global'>('local')
  const [globalLoading, setGlobalLoading] = useState(false)

  // Match recording state
  const [matchType, setMatchType] = useState<'SINGLES' | 'DOUBLES'>('SINGLES')
  const [matchForm, setMatchForm] = useState({
    playerAId: '',
    playerBId: '',
    playerCId: '',
    playerDId: '',
    winnerTeam: '',
    score: ''
  })

  // Auth state
  const [authUser, setAuthUser] = useState<{ userId: number; username: string } | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authForm, setAuthForm] = useState({ username: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('racket_token')
    if (token) {
      getMe()
        .then(user => setAuthUser({ userId: user.userId, username: user.username }))
        .catch(() => localStorage.removeItem('racket_token'))
    }
    loadGlobalBoard()
  }, [])

  const loadGlobalBoard = async () => {
    setGlobalLoading(true)
    try {
      const data = await getGlobalLeaderboard()
      setGlobalBoard(data)
    } catch (e) {
      console.error('Failed to load global leaderboard', e)
    } finally {
      setGlobalLoading(false)
    }
  }

  const handleCreateLeague = async () => {
    if (!leagueName.trim()) return
    if (!authUser) { setShowAuthModal(true); return }
    try {
      const l = await createLeague(leagueName)
      setLeague(l)
      setPlayers([])
      setMatches([])
      setBoard([])
      setLeagueName('')
    } catch (e) {
      const msg = (e as any)?.response?.data?.error || (e as any)?.message || 'Error creating league'
      alert(msg)
    }
  }

  const handleLoadLeague = async () => {
    const id = Number(loadIdInput)
    if (!id || isNaN(id)) return alert('Enter a valid League ID')
    try {
      const m = await getMatches(id)
      const b = await getLeaderboard(id)
      setLeague({ id, name: `League #${id}` })
      setMatches(m)
      setBoard(b)
      setPlayers(b.map((entry: any) => ({ id: entry.playerId, name: entry.name })))
      setLoadIdInput('')
    } catch {
      alert('League not found or failed to load data')
    }
  }

  const handleAddPlayer = async () => {
    if (!league) return alert('Create or load a league first')
    if (!authUser) { setShowAuthModal(true); return }
    if (!playerName.trim()) return
    try {
      const p = await addPlayer(playerName.trim(), league.id)
      setPlayers(prev => [...prev, p])
      setPlayerName('')
      await refreshData()
    } catch {
      alert('Error adding player')
    }
  }

  const refreshData = async () => {
    if (!league) return
    try {
      const b = await getLeaderboard(league.id)
      const m = await getMatches(league.id)
      setBoard(b)
      setMatches(m)
      setPlayers(b.map((entry: any) => ({ id: entry.playerId, name: entry.name })))
    } catch (e) {
      console.error('Error refreshing data', e)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)
    try {
      const { username, password } = authForm
      if (!username.trim() || !password.trim()) {
        setAuthError('Username and password are required')
        setAuthLoading(false)
        return
      }
      if (password.length < 6) {
        setAuthError(authMode === 'register' ? 'Password must be at least 6 characters' : 'Incorrect username or password')
        setAuthLoading(false)
        return
      }
      const res = authMode === 'login'
        ? await login(username.trim(), password)
        : await register(username.trim(), password)
      if (res?.token) {
        localStorage.setItem('racket_token', res.token)
        setAuthUser({ userId: res.userId, username: res.username })
        setShowAuthModal(false)
        setAuthForm({ username: '', password: '' })
      }
    } catch (err: any) {
      setAuthError(err?.response?.data?.error || 'Authentication failed. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('racket_token')
    setAuthUser(null)
    setLeague(null)
    setPlayers([])
    setMatches([])
    setBoard([])
  }

  const handleRecordMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!league) return
    if (!authUser) { setShowAuthModal(true); return }

    const { playerAId, playerBId, playerCId, playerDId, winnerTeam, score } = matchForm

    if (!playerAId || !winnerTeam) return alert('Please select players and the winner')

    let payload: any = {
      leagueId: league.id,
      competitionType: matchType,
      score: score.trim() || null
    }

    if (matchType === 'SINGLES') {
      if (!playerBId) return alert('Please select the opponent (Player B)')
      if (playerAId === playerBId) return alert('Players must be different')
      payload.playerAId = Number(playerAId)
      payload.playerBId = Number(playerBId)
      payload.winnerId = winnerTeam === '1' ? Number(playerAId) : Number(playerBId)
    } else {
      if (!playerBId || !playerCId || !playerDId) return alert('All 4 players must be selected for Doubles')
      const ids = [playerAId, playerBId, playerCId, playerDId]
      if (new Set(ids).size !== 4) return alert('All 4 players must be distinct')
      payload.playerAId = Number(playerAId)
      payload.playerBId = Number(playerBId)
      payload.playerCId = Number(playerCId)
      payload.playerDId = Number(playerDId)
      payload.winnerId = winnerTeam === '1' ? Number(playerAId) : Number(playerCId)
    }

    try {
      await recordMatch(payload)
      await refreshData()
      await loadGlobalBoard()
      setMatchForm({ playerAId: '', playerBId: '', playerCId: '', playerDId: '', winnerTeam: '', score: '' })
    } catch (err: any) {
      alert(err.response?.data || 'Failed to record match')
    }
  }

  return (
    <>
      <div className="min-h-screen pb-16 px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="max-w-7xl mx-auto pt-8 pb-6 flex flex-col md:flex-row justify-between items-center border-b border-white/5 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/10">
              <svg className="w-6 h-6 text-[#0b0f19]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-[#e2e8f0] to-gray-400 bg-clip-text text-transparent">RACKET LADDER</h1>
              <p className="text-xs text-gray-400">Singles &amp; Doubles Score Tracker</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            {/* Auth section */}
            {authUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white/5 border border-white/[0.08] rounded-xl px-3 py-1.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-teal-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-slate-950">
                    {authUser.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-gray-200">{authUser.username}</span>
                </div>
                <button className="glass-button-secondary text-xs px-3 py-1.5" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <button
                className="glass-button-primary text-sm px-4 py-2"
                onClick={() => { setShowAuthModal(true); setAuthMode('login') }}
              >
                Sign In
              </button>
            )}

            {/* League section */}
            {league ? (
              <div className="flex items-center gap-3 animate-fade-in">
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">Active League</span>
                  <strong className="text-teal-400 font-semibold">{league.name}</strong>
                  <span className="text-xs text-gray-400 ml-2 font-mono bg-white/5 px-2 py-0.5 rounded">ID: {league.id}</span>
                </div>
                <button className="glass-button-secondary text-xs px-3 py-1.5" onClick={() => setLeague(null)}>
                  Change
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  className="glass-input text-sm"
                  value={loadIdInput}
                  onChange={e => setLoadIdInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLoadLeague()}
                  placeholder="Enter League ID to load"
                />
                <button className="glass-button-secondary text-sm" onClick={handleLoadLeague}>Load</button>
              </div>
            )}
          </div>
        </header>

        {/* Main Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">

          {/* LEFT COLUMN */}
          <div className="space-y-6 lg:col-span-1">

            {/* Create League */}
            {!league && (
              <div className="glass-panel p-6">
                <h3 className="text-lg font-bold mb-4">Create League</h3>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">League Name</label>
                <input
                  className="glass-input"
                  value={leagueName}
                  onChange={e => setLeagueName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateLeague()}
                  placeholder="e.g. Squash Summer Series"
                />
                <button className="glass-button-primary w-full mt-4" onClick={handleCreateLeague}>
                  Create League
                </button>
              </div>
            )}

            {/* Add Player */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add Player
              </h3>
              <div className="flex gap-2">
                <input
                  className="glass-input"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="Player name"
                  onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
                />
                <button className="glass-button-primary px-4" onClick={handleAddPlayer}>Add</button>
              </div>

              {players.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Registered ({players.length})</span>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {players.map(p => (
                      <span key={p.id} className="text-xs bg-slate-900 border border-white/5 text-gray-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getPlayerColor(p.id) }} />
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Record Match */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Record Match
                </span>
                <div className="flex bg-slate-900/80 rounded-lg p-0.5 border border-white/5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => { setMatchType('SINGLES'); setMatchForm({ ...matchForm, winnerTeam: '' }) }}
                    className={`px-3 py-1 rounded-md transition-all ${matchType === 'SINGLES' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-gray-400'}`}
                  >
                    Singles
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMatchType('DOUBLES'); setMatchForm({ ...matchForm, winnerTeam: '' }) }}
                    className={`px-3 py-1 rounded-md transition-all ${matchType === 'DOUBLES' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-gray-400'}`}
                  >
                    Doubles
                  </button>
                </div>
              </h3>

              <form onSubmit={handleRecordMatch} className="space-y-4">
                {matchType === 'SINGLES' ? (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Player A (Side 1)</label>
                      <select value={matchForm.playerAId} onChange={e => setMatchForm({ ...matchForm, playerAId: e.target.value })} className="glass-input text-sm">
                        <option value="">Select player</option>
                        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Player B (Side 2)</label>
                      <select value={matchForm.playerBId} onChange={e => setMatchForm({ ...matchForm, playerBId: e.target.value })} className="glass-input text-sm">
                        <option value="">Select opponent</option>
                        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-3">
                      <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">Team A (Side 1)</span>
                      <div>
                        <label className="text-xs text-gray-400 block mb-0.5">Player 1</label>
                        <select value={matchForm.playerAId} onChange={e => setMatchForm({ ...matchForm, playerAId: e.target.value })} className="glass-input text-sm">
                          <option value="">Select player</option>
                          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-0.5">Player 2</label>
                        <select value={matchForm.playerBId} onChange={e => setMatchForm({ ...matchForm, playerBId: e.target.value })} className="glass-input text-sm">
                          <option value="">Select player</option>
                          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-3">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Team B (Side 2)</span>
                      <div>
                        <label className="text-xs text-gray-400 block mb-0.5">Player 1</label>
                        <select value={matchForm.playerCId} onChange={e => setMatchForm({ ...matchForm, playerCId: e.target.value })} className="glass-input text-sm">
                          <option value="">Select player</option>
                          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-0.5">Player 2</label>
                        <select value={matchForm.playerDId} onChange={e => setMatchForm({ ...matchForm, playerDId: e.target.value })} className="glass-input text-sm">
                          <option value="">Select player</option>
                          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Score (Optional)</label>
                  <input
                    className="glass-input"
                    value={matchForm.score}
                    onChange={e => setMatchForm({ ...matchForm, score: e.target.value })}
                    placeholder="e.g. 21-18, 15-21, 21-19"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Winner</label>
                  <select value={matchForm.winnerTeam} onChange={e => setMatchForm({ ...matchForm, winnerTeam: e.target.value })} className="glass-input text-sm">
                    <option value="">Select Winner</option>
                    {matchType === 'SINGLES' ? (
                      <>
                        {matchForm.playerAId && <option value="1">{players.find(p => p.id === Number(matchForm.playerAId))?.name || 'Player A'}</option>}
                        {matchForm.playerBId && <option value="2">{players.find(p => p.id === Number(matchForm.playerBId))?.name || 'Player B'}</option>}
                      </>
                    ) : (
                      <>
                        {matchForm.playerAId && matchForm.playerBId && <option value="1">Team A (Side 1)</option>}
                        {matchForm.playerCId && matchForm.playerDId && <option value="2">Team B (Side 2)</option>}
                      </>
                    )}
                  </select>
                </div>

                <button type="submit" className="glass-button-primary w-full mt-2">
                  Save Match Result
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6 lg:col-span-2">

            {/* Tab Switcher */}
            <div className="flex bg-slate-900/60 rounded-2xl p-1.5 border border-white/5 gap-1">
              <button
                onClick={() => setActiveTab('local')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'local'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-lg shadow-teal-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                Local Leaderboard
              </button>
              <button
                onClick={() => { setActiveTab('global'); loadGlobalBoard() }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'global'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
                Global Leaderboard
              </button>
            </div>

            {/* LOCAL LEADERBOARD */}
            {activeTab === 'local' && (
              <div className="glass-panel p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      {league ? league.name : 'League'} Standings
                    </h3>
                    <p className="text-xs text-gray-400">Wins and losses within this league</p>
                  </div>
                  <button className="glass-button-secondary text-xs px-3 py-1.5 flex items-center gap-1" onClick={refreshData}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 11H18" />
                    </svg>
                    Refresh
                  </button>
                </div>

                {board.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center gap-3">
                    <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm text-gray-400">No data yet.</p>
                    <p className="text-xs text-gray-500">Load a league and record matches to see standings.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-white/5 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900/60 font-semibold text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 text-center w-16">Rank</th>
                          <th className="px-4 py-3">Player</th>
                          <th className="px-4 py-3 text-center">Record</th>
                          <th className="px-4 py-3 text-center">Win Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {board.map((b, i) => {
                          const total = b.wins + b.losses
                          const rate = total > 0 ? Math.round((b.wins / total) * 100) : 0
                          const color = getPlayerColor(b.playerId)
                          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                          return (
                            <tr key={b.playerId} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3 text-center font-bold">
                                {medal ? <span className="text-base">{medal}</span> : <span className="text-gray-400">#{i + 1}</span>}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5 font-medium">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                  {b.name}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-gray-300">
                                <span className="text-emerald-400 font-semibold">{b.wins}W</span>
                                <span className="text-gray-500 mx-1">/</span>
                                <span className="text-rose-400 font-semibold">{b.losses}L</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                                  rate >= 60 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  rate >= 40 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {rate}%
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* GLOBAL LEADERBOARD */}
            {activeTab === 'global' && (
              <div className="glass-panel p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                      </svg>
                      Global Rankings
                    </h3>
                    <p className="text-xs text-gray-400">All players across all leagues, sorted by total wins</p>
                  </div>
                  <button className="glass-button-secondary text-xs px-3 py-1.5 flex items-center gap-1" onClick={loadGlobalBoard}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 11H18" />
                    </svg>
                    Refresh
                  </button>
                </div>

                {globalLoading ? (
                  <div className="text-center py-12 text-gray-400 text-sm">Loading global rankings…</div>
                ) : globalBoard.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center gap-3">
                    <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064" />
                    </svg>
                    <p className="text-sm text-gray-400">No global data yet.</p>
                    <p className="text-xs text-gray-500">Record some matches across leagues to see global rankings.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-white/5 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900/60 font-semibold text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 text-center w-16">Rank</th>
                          <th className="px-4 py-3">Player</th>
                          <th className="px-4 py-3">League</th>
                          <th className="px-4 py-3 text-center">Wins</th>
                          <th className="px-4 py-3 text-center">Win Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {globalBoard.map((b, i) => {
                          const total = b.wins + b.losses
                          const rate = total > 0 ? Math.round((b.wins / total) * 100) : 0
                          const color = getPlayerColor(b.playerId)
                          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                          return (
                            <tr key={`${b.playerId}-${b.leagueId}`} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3 text-center font-bold">
                                {medal ? <span className="text-base">{medal}</span> : <span className="text-gray-400">#{i + 1}</span>}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5 font-medium">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                  {b.name}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                                {b.leagueName}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-emerald-400 font-bold font-mono">{b.wins}</span>
                                <span className="text-gray-600 text-xs ml-1">/{b.losses}L</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                                  rate >= 60 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  rate >= 40 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {rate}%
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowAuthModal(false); setAuthError(''); setAuthForm({ username: '', password: '' }) } }}
        >
          <div className="glass-panel p-8 w-full max-w-sm relative animate-fade-in">
            <button
              onClick={() => { setShowAuthModal(false); setAuthError(''); setAuthForm({ username: '', password: '' }) }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <svg className="w-8 h-8 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-center mb-1">
              {authMode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-xs text-gray-400 text-center mb-6">
              {authMode === 'login' ? 'Sign in to manage your leagues' : 'Start tracking your matches today'}
            </p>

            <div className="flex bg-slate-900/80 rounded-xl p-1 border border-white/5 mb-6">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${authMode === 'login' ? 'bg-teal-500 text-slate-950' : 'text-gray-400 hover:text-white'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${authMode === 'register' ? 'bg-teal-500 text-slate-950' : 'text-gray-400 hover:text-white'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Username</label>
                <input
                  className="glass-input"
                  value={authForm.username}
                  onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                  placeholder="e.g. john_doe"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Password</label>
                <input
                  type="password"
                  className="glass-input"
                  value={authForm.password}
                  onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                  placeholder="••••••••"
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>

              {authError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5 text-rose-400 text-xs font-medium animate-fade-in">
                  {authError}
                </div>
              )}

              <button type="submit" className="glass-button-primary w-full mt-2" disabled={authLoading}>
                {authLoading ? 'Please wait…' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-500 mt-5">
              {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('') }}
                className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
              >
                {authMode === 'login' ? 'Register here' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
