import React from 'react'

interface Props {
  onGetStarted: () => void
}

export default function Landing({ onGetStarted }: Props) {
  return (
    <div className="min-h-screen">

      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <svg className="w-5 h-5 text-[#0b0f19]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-extrabold tracking-tight">RACKET LADDER</span>
        </div>
        <button
          onClick={onGetStarted}
          className="glass-button-primary text-sm px-5 py-2"
        >
          Get Started Free
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 mb-6">
          Free Racket Sports Tracker
        </span>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
          The Easiest Way to Track<br />Your Racket Sports League
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Create leagues, record singles &amp; doubles match results, and watch your leaderboard update in real time.
          Perfect for <strong className="text-gray-300">badminton</strong>, <strong className="text-gray-300">squash</strong>,{' '}
          <strong className="text-gray-300">tennis</strong>, <strong className="text-gray-300">pickleball</strong>, and all racket sports.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onGetStarted}
            className="glass-button-primary text-base px-8 py-3"
          >
            Start Tracking for Free
          </button>
          <button
            onClick={onGetStarted}
            className="glass-button-secondary text-base px-8 py-3"
          >
            View Leaderboard
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-4">No credit card required · Free forever</p>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-extrabold text-center mb-3">Everything Your League Needs</h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          A complete racket sports score tracker — from casual club nights to competitive ladders.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              ),
              color: 'text-teal-400',
              title: 'Create Leagues Instantly',
              desc: 'Set up a badminton, squash, tennis or pickleball league in seconds. Share your League ID with players and start tracking immediately — no setup hassle.'
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ),
              color: 'text-indigo-400',
              title: 'Singles & Doubles Matches',
              desc: 'Record singles and doubles match results with scores. Our smart Elo-style ranking system automatically updates standings after every match.'
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              ),
              color: 'text-purple-400',
              title: 'Global Leaderboard',
              desc: 'See how your players rank across all leagues worldwide. A global racket sports leaderboard that gives players a bigger competitive stage to play on.'
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              ),
              color: 'text-emerald-400',
              title: 'Live Standings',
              desc: 'Win rates, win/loss records, and rankings update instantly. Your players always know exactly where they stand on the ladder.'
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              ),
              color: 'text-rose-400',
              title: 'Multi-Player Leagues',
              desc: 'Add unlimited players to your league. Perfect for club ladders, office tournaments, or weekend round-robins with friends.'
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ),
              color: 'text-yellow-400',
              title: 'Secure Accounts',
              desc: 'Sign up once and manage all your leagues from one account. Your data is safe — only you can record matches and manage your league.'
            }
          ].map((f, i) => (
            <div key={i} className="glass-panel p-6 hover:scale-[1.01] transition-transform duration-300">
              <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${f.color}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {f.icon}
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-extrabold text-center mb-3">Get Your League Running in 3 Steps</h2>
        <p className="text-gray-400 text-center mb-12">No complicated setup. No spreadsheets. Just play.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Create a League', desc: 'Sign up, name your league, and get a shareable League ID for your club or group.' },
            { step: '02', title: 'Add Players & Record Matches', desc: 'Add players by name and log singles or doubles results with optional scores after each game.' },
            { step: '03', title: 'Watch the Ladder Update', desc: 'Standings, win rates, and rankings update live. Check the global leaderboard to see how you compare worldwide.' }
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
                <span className="text-sm font-black text-slate-950">{s.step}</span>
              </div>
              <h3 className="font-bold text-lg mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sports tags */}
      <section className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Works great for</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['Badminton', 'Squash', 'Tennis', 'Pickleball', 'Padel', 'Table Tennis', 'Racquetball'].map(sport => (
            <span key={sport} className="text-sm bg-white/5 border border-white/10 text-gray-300 px-4 py-1.5 rounded-full">
              {sport}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="glass-panel p-12">
          <h2 className="text-3xl font-extrabold mb-4">Ready to Start Your Ladder?</h2>
          <p className="text-gray-400 mb-8">Join players tracking their racket sports matches on Racket Ladder. Free, fast, and built for your club.</p>
          <button
            onClick={onGetStarted}
            className="glass-button-primary text-base px-10 py-3"
          >
            Create Your League Now — It's Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-gray-600">
        <p>© {new Date().getFullYear()} Racket Ladder · Free racket sports league tracker &amp; leaderboard</p>
        <p className="mt-1">Badminton · Squash · Tennis · Pickleball · Padel · Table Tennis</p>
      </footer>

    </div>
  )
}
