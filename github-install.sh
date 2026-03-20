#!/bin/bash
set -e

# Farben
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓ $1${NC}"; }
warn() { echo -e "  ${YELLOW}! $1${NC}"; }
fail() { echo -e "  ${RED}✗ $1${NC}"; exit 1; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      🛡️  Datenschutz-Tool - Installation            ║${NC}"
echo -e "${BLUE}║      DSGVO Compliance Manager                       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

INSTALL_DIR="$HOME/Desktop/datenschutz-tool"
DEMO=false

# Argumente parsen
while [[ $# -gt 0 ]]; do
    case $1 in
        --dir) INSTALL_DIR="$2"; shift 2;;
        --demo) DEMO=true; shift;;
        *) shift;;
    esac
done

# ─── Voraussetzungen ─────────────────────────────────────
echo -e "${BOLD}Prüfe Voraussetzungen...${NC}"

# OS erkennen
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    if command -v apt-get &>/dev/null; then
        PKG_MGR="apt-get"
    elif command -v dnf &>/dev/null; then
        PKG_MGR="dnf"
    elif command -v yum &>/dev/null; then
        PKG_MGR="yum"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    PKG_MGR="brew"
fi

# Node.js
if ! command -v node &>/dev/null; then
    warn "Node.js nicht gefunden. Versuche Installation..."
    if [[ "$OS" == "linux" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo $PKG_MGR install -y nodejs
    elif [[ "$OS" == "macos" ]]; then
        brew install node@20
    else
        fail "Node.js manuell installieren: https://nodejs.org/"
    fi
fi

NODE_VER=$(node --version)
NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v//' | cut -d. -f1)
if [[ $NODE_MAJOR -lt 18 ]]; then
    fail "Node.js $NODE_VER ist zu alt. Mindestens v18 erforderlich."
fi
ok "Node.js $NODE_VER"

# Git
if ! command -v git &>/dev/null; then
    warn "Git nicht gefunden. Versuche Installation..."
    if [[ "$OS" == "linux" ]]; then
        sudo $PKG_MGR install -y git
    elif [[ "$OS" == "macos" ]]; then
        brew install git
    fi
fi
ok "Git $(git --version | cut -d' ' -f3)"

# ─── Repository ──────────────────────────────────────────
echo ""
echo -e "${BOLD}Installationsverzeichnis: $INSTALL_DIR${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ -d "$INSTALL_DIR/.git" ]]; then
    echo "  Repository existiert, aktualisiere..."
    cd "$INSTALL_DIR"
    git pull --ff-only || warn "Git pull fehlgeschlagen"
    ok "Repository aktualisiert"
elif [[ -f "$SCRIPT_DIR/package.json" ]]; then
    echo "  Kopiere Dateien..."
    mkdir -p "$INSTALL_DIR"
    cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR/" 2>/dev/null || true
    cp "$SCRIPT_DIR"/.env.example "$INSTALL_DIR/" 2>/dev/null || true
    cp "$SCRIPT_DIR"/.gitignore "$INSTALL_DIR/" 2>/dev/null || true
    ok "Dateien kopiert"
else
    fail "Keine Quelldateien gefunden."
fi

cd "$INSTALL_DIR"

# ─── Installation ────────────────────────────────────────
echo ""
if [[ "$DEMO" == "true" ]]; then
    node install.js --demo --yes
else
    node install.js
fi

# ─── Systemd Service (optional, nur Linux) ───────────────
if [[ "$OS" == "linux" ]] && command -v systemctl &>/dev/null; then
    echo ""
    read -p "  Systemd-Service einrichten? (j/n) [n]: " SETUP_SERVICE
    if [[ "$SETUP_SERVICE" =~ ^[jJyY] ]]; then
        SERVICE_FILE="/etc/systemd/system/datenschutz-tool.service"
        sudo tee "$SERVICE_FILE" > /dev/null << SVCEOF
[Unit]
Description=Datenschutz-Tool DSGVO Compliance
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$(which npx) next start -p 3000
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SVCEOF
        sudo systemctl daemon-reload
        sudo systemctl enable datenschutz-tool
        sudo systemctl start datenschutz-tool
        ok "Systemd-Service eingerichtet und gestartet"
        echo ""
        echo "  Service-Befehle:"
        echo "    sudo systemctl status datenschutz-tool"
        echo "    sudo systemctl restart datenschutz-tool"
        echo "    sudo journalctl -u datenschutz-tool -f"
    fi
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Installation abgeschlossen!                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Starten mit: ./start.sh oder npm start"
echo ""
