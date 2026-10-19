"use client";

import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"curl" | "git" | "web">("curl");
  const [copied, setCopied] = useState(false);

  const commands = {
    curl: "curl -fsSL https://raw.githubusercontent.com/carbonthecoder/PULL/main/website/public/install.sh | bash",
    git: "git clone https://github.com/carbonthecoder/PULL.git && cd PULL && npm install && npm link",
    web: "npx pull --web",
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 20px" }}>
      {/* Top Navigation */}
      <header style={{
        width: "100%",
        maxWidth: "960px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "64px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            fontSize: "18px",
            fontWeight: 800,
            letterSpacing: "3px",
            color: "#ffffff",
            background: "#111111",
            border: "1px solid #222222",
            padding: "6px 14px",
            borderRadius: "6px",
            fontFamily: "var(--font-mono)"
          }}>
            PULL
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", border: "1px solid #222", padding: "4px 8px", borderRadius: "4px" }}>
            v2.0.0
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <a
            href="https://github.com/carbonthecoder/PULL"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              border: "1px solid #222222",
              padding: "7px 14px",
              borderRadius: "6px",
              background: "#111111",
              transition: "all 0.15s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ width: "100%", maxWidth: "800px", textAlign: "center", marginBottom: "56px" }}>
        <h1 style={{
          fontSize: " clamp(36px, 6vw, 64px)",
          fontWeight: 800,
          letterSpacing: "-1.5px",
          lineHeight: 1.1,
          marginBottom: "20px",
          color: "#ffffff"
        }}>
          PULL
        </h1>
        <p style={{
          fontSize: "clamp(16px, 2.5vw, 20px)",
          color: "var(--text-muted)",
          maxWidth: "620px",
          margin: "0 auto 36px",
          lineHeight: 1.5
        }}>
          Extract complete source code and assets from any Vercel deployment.
        </p>

        {/* Install Box */}
        <div style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          overflow: "hidden",
          textAlign: "left",
          maxWidth: "680px",
          margin: "0 auto"
        }}>
          {/* Tabs */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            background: "#0a0a0a"
          }}>
            <button
              onClick={() => setActiveTab("curl")}
              style={{
                background: activeTab === "curl" ? "var(--card-bg)" : "transparent",
                color: activeTab === "curl" ? "#ffffff" : "var(--text-muted)",
                border: "none",
                borderBottom: activeTab === "curl" ? "2px solid #ffffff" : "2px solid transparent",
                padding: "10px 18px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-mono)"
              }}
            >
              curl (quick install)
            </button>
            <button
              onClick={() => setActiveTab("git")}
              style={{
                background: activeTab === "git" ? "var(--card-bg)" : "transparent",
                color: activeTab === "git" ? "#ffffff" : "var(--text-muted)",
                border: "none",
                borderBottom: activeTab === "git" ? "2px solid #ffffff" : "2px solid transparent",
                padding: "10px 18px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-mono)"
              }}
            >
              git + npm
            </button>
            <button
              onClick={() => setActiveTab("web")}
              style={{
                background: activeTab === "web" ? "var(--card-bg)" : "transparent",
                color: activeTab === "web" ? "#ffffff" : "var(--text-muted)",
                border: "none",
                borderBottom: activeTab === "web" ? "2px solid #ffffff" : "2px solid transparent",
                padding: "10px 18px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-mono)"
              }}
            >
              web ui
            </button>
          </div>

          {/* Command display and copy */}
          <div style={{
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px"
          }}>
            <code style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: "#ffffff",
              overflowX: "auto",
              whiteSpace: "nowrap"
            }}>
              {commands[activeTab]}
            </code>
            <button
              onClick={() => handleCopy(commands[activeTab])}
              style={{
                background: copied ? "#ffffff" : "#1a1a1a",
                color: copied ? "#000000" : "#ededed",
                border: "1px solid #333333",
                borderRadius: "6px",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease"
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section style={{
        width: "100%",
        maxWidth: "960px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "16px",
        marginBottom: "64px"
      }}>
        {/* Feature 1 */}
        <div style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.5px" }}>
            Instant Source Tree Extraction
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
            Traverse recursive directory trees directly via Vercel&apos;s internal file-tree endpoint, acquiring source files and build artifacts in one pass.
          </p>
        </div>

        {/* Feature 2 */}
        <div style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.5px" }}>
            Team Auto-Resolution
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
            Iterates personal accounts and organization team scopes automatically to resolve protected deployments without manual scope configuration.
          </p>
        </div>

        {/* Feature 3 */}
        <div style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.5px" }}>
            Progress Counters
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
            Live counters track downloaded, cached, and skipped files with accurate byte totals, progress bars, and terminal resize awareness.
          </p>
        </div>

        {/* Feature 4 */}
        <div style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.5px" }}>
            Local Web Inspector
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
            Built-in obsidian dashboard on localhost:3000 featuring interactive tree exploration, file previews, and one-click ZIP generation.
          </p>
        </div>
      </section>

      {/* Terminal Preview Card */}
      <section style={{
        width: "100%",
        maxWidth: "960px",
        background: "#080808",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        overflow: "hidden",
        marginBottom: "64px"
      }}>
        <div style={{
          padding: "12px 18px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#0f0f0f"
        }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#333" }} />
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#333" }} />
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#333" }} />
          <span style={{ marginLeft: "10px", fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            terminal — pull
          </span>
        </div>
        <pre style={{
          padding: "24px",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          lineHeight: 1.5,
          color: "#cccccc",
          overflowX: "auto"
        }}>
{` ░███████   ░██     ░██ ░██       ░██      
 ░██    ░██ ░██     ░██ ░██       ░██      
 ░██    ░██ ░██     ░██ ░██       ░██      
 ░███████   ░██     ░██ ░██       ░██      
 ░██        ░██     ░██ ░██       ░██      
 ░██        ░██     ░██ ░██       ░██      
 ░██         ░███████   ░████████ ░████████

  project     my-project
  output      pull/dpl_82v9X7qmPq7e
  
  pulled      270 files
  skipped      48 files
  size        5.79 MB
  
  ✓ extraction complete`}
        </pre>
      </section>

      {/* Footer */}
      <footer style={{
        width: "100%",
        maxWidth: "960px",
        borderTop: "1px solid var(--border)",
        paddingTop: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "12px",
        color: "var(--text-muted)"
      }}>
        <div>PULL — Open Source Vercel Deployment Inspector</div>
        <a
          href="https://github.com/carbonthecoder/PULL"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#ffffff", textDecoration: "none" }}
        >
          GitHub Repository ↗
        </a>
      </footer>
    </main>
  );
}
