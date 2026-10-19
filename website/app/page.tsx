'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [copied, setCopied] = useState(false)
  const [installMethod, setInstallMethod] = useState<'curl' | 'git'>('curl')

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme')
    if (current === 'light' || current === 'dark') {
      setTheme(current)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem('pull-theme', next)
    } catch {}
  }

  const curlCmd = 'curl -fsSL https://raw.githubusercontent.com/carbonthecoder/PULL/main/website/public/install.sh | bash'
  const gitCmd = 'git clone https://github.com/carbonthecoder/PULL.git && cd PULL && npm i && npm link'

  const activeCmd = installMethod === 'curl' ? curlCmd : gitCmd

  const copyCmd = () => {
    navigator.clipboard.writeText(activeCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container">
      <div className="top-bar">
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className={`theme-icon ${theme === 'light' ? 'rotate-sun' : 'rotate-moon'}`}>
            {theme === 'dark' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </span>
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      <div className="badge">
        <span className="badge-dot"></span>
        <span>v1.0.0 released</span>
      </div>

      <h1 className="logo">PULL</h1>

      <p className="tagline">
        Extract complete source code and assets from any Vercel deployment.
        <br />
        Paste a token and deployment URL. Live terminal progress and file tree tree.
      </p>

      <div className="screenshot">
        <div className="mockup-frame">
          <div className="mockup-header">
            <span className="mockup-dot" style={{ background: '#ef4444' }}></span>
            <span className="mockup-dot" style={{ background: '#eab308' }}></span>
            <span className="mockup-dot" style={{ background: '#22c55e' }}></span>
            <span style={{ fontSize: '11px', color: '#666', marginLeft: '8px', fontFamily: 'monospace' }}>pull ~ vercel</span>
          </div>
          <div className="mockup-body">
            <div style={{ color: '#22c55e', marginBottom: '8px' }}>$ pull</div>
            <div style={{ background: '#111', padding: '12px', borderRadius: '8px', border: '1px solid #222', marginBottom: '10px' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>╭─ vercel token ────────────────────────────╮</div>
              <div style={{ color: '#fff' }}>│ › vercel_pat_********************         │</div>
              <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>╰───────────────────────────────────────────╯</div>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px', marginTop: '8px' }}>╭─ deployment id or url ────────────────────╮</div>
              <div style={{ color: '#38bdf8' }}>│ › dpl_9xKqP2LmN4vT8                     │</div>
              <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>╰───────────────────────────────────────────╯</div>
            </div>
            <div style={{ color: '#aaa', fontSize: '12px' }}>
              Progress: [████████████████████████░░░░] 78% · 245 files caught
            </div>
            <div style={{ marginTop: '10px', color: '#666', fontSize: '12px' }}>
              Tab switch fields · Enter extract · Esc cancel · ^c quit
            </div>
          </div>
        </div>
      </div>

      <div className="tabs-section">
        <div className="tab-pill">
          <code>Tab</code> Switch input
        </div>
        <div className="tab-pill">
          <code>Enter</code> Extract source
        </div>
        <div className="tab-pill">
          <code>--web</code> Local web inspector
        </div>
      </div>

      <div className="install-box" onClick={copyCmd} title="Click to copy command">
        <div className="install-header">
          <div className="install-tabs">
            <span className="install-label">Install</span>
            <button
              type="button"
              className={`install-tab-btn ${installMethod === 'curl' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setInstallMethod('curl')
              }}
            >
              curl
            </button>
            <span className="install-tab-divider">/</span>
            <button
              type="button"
              className={`install-tab-btn ${installMethod === 'git' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setInstallMethod('git')
              }}
            >
              git + npm
            </button>
          </div>
          <span className={`copy-hint ${copied ? 'copied' : ''}`}>
            {copied ? '✓ Copied' : 'Click to copy'}
          </span>
        </div>
        <div className="install-cmd">
          <span className="prompt">$</span>
          {activeCmd}
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-title">
            <span>Recursive Tree Extraction</span>
          </div>
          <div className="feature-desc">
            Reconstructs full source code directories, components, configs, and assets directly to disk.
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-title">
            <span>Automatic Team Scope</span>
          </div>
          <div className="feature-desc">
            Resolves deployments across personal accounts and enterprise Vercel team workspaces automatically.
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-title">
            <span>Real-time Live Counters</span>
          </div>
          <div className="feature-desc">
            Displays caught, skipped, and total files with live byte transfer stats and progress bars.
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-title">
            <span>Obsidian Web Explorer</span>
          </div>
          <div className="feature-desc">
            Run pull --web to browse file trees and download complete ZIP archives via localhost:3000.
          </div>
        </div>
      </div>

      <div className="links">
        <a
          href="https://github.com/carbonthecoder/PULL"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <a
          href="https://github.com/carbonthecoder/PULL/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
        >
          MIT License
        </a>
      </div>

      <div className="footer">
        <span>PULL</span>
        <span>·</span>
        <a
          href="https://github.com/carbonthecoder"
          target="_blank"
          rel="noopener noreferrer"
        >
          carbonthecoder
        </a>
      </div>
    </div>
  )
}
