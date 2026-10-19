#!/bin/bash
set -e

REPO="https://github.com/carbonthecoder/PULL.git"
INSTALL_DIR="$HOME/.pull"

echo ""
echo " ░███████   ░██     ░██ ░██       ░██      "
echo " ░██    ░██ ░██     ░██ ░██       ░██      "
echo " ░██    ░██ ░██     ░██ ░██       ░██      "
echo " ░███████   ░██     ░██ ░██       ░██      "
echo " ░██        ░██     ░██ ░██       ░██      "
echo " ░██        ░██     ░██ ░██       ░██      "
echo " ░██         ░███████   ░████████ ░████████"
echo ""

if ! command -v node &> /dev/null; then
  echo "  ✗ Node.js is required. https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "  ✗ Node.js 18+ required. You have $(node -v)"
  exit 1
fi

if [ -d "$INSTALL_DIR" ]; then
  echo "  → updating..."
  cd "$INSTALL_DIR" && git pull --quiet
else
  echo "  → cloning..."
  git clone --quiet --depth 1 "$REPO" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
npm install --silent 2>/dev/null
npx tsc 2>/dev/null

mkdir -p "$HOME/.local/bin"
cat > "$HOME/.local/bin/pull" << 'EOF'
#!/bin/bash
exec node "$HOME/.pull/dist/tui/cli.js" "$@"
EOF
chmod +x "$HOME/.local/bin/pull"

cat > "$HOME/.local/bin/catch" << 'EOF'
#!/bin/bash
exec node "$HOME/.pull/dist/tui/cli.js" "$@"
EOF
chmod +x "$HOME/.local/bin/catch"

SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ]; then
  if ! grep -q '$HOME/.local/bin' "$SHELL_RC" 2>/dev/null; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_RC"
    export PATH="$HOME/.local/bin:$PATH"
  fi
fi

echo ""
echo "  ✓ installed. type 'pull' to start."
echo ""
