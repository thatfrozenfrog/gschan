#!/usr/bin/env bash
# ==============================================================================
# gschan — Quick Start & Setup Script (Linux / macOS / WSL)
# ==============================================================================
set -e

# ANSI styling
BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

echo -e "${CYAN}${BOLD}"
echo "   ____ _____ ____ _   _    _    _   _ "
echo "  / ___/ ___// ___| | | |  / \  | \ | |"
echo " | |  _\___ \ |   | |_| | / _ \ |  \| |"
echo " | |_| |___) | |__|  _  |/ ___ \| |\  |"
echo "  \____|____/ \____|_| |_/_/   \_\_| \_|"
echo -e "${RESET}"
echo -e "${BOLD}gschan Setup & Dev Launcher${RESET}\n"

# 1. Check for Node.js
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Node.js is not installed or not in PATH.${RESET}"
    echo -e "Please install Node.js (v18 or newer) from: ${CYAN}https://nodejs.org/${RESET}"
    exit 1
fi

NODE_VER=$(node -v)
echo -e "${GREEN}✓${RESET} Node.js detected (${CYAN}${NODE_VER}${RESET})"

# 2. Check for pnpm or npm
PKG_MGR=""
if command -v pnpm >/dev/null 2>&1; then
    PKG_MGR="pnpm"
    echo -e "${GREEN}✓${RESET} Package manager: ${CYAN}pnpm${RESET} ($(pnpm -v))"
elif command -v npm >/dev/null 2>&1; then
    PKG_MGR="npm"
    echo -e "${GREEN}✓${RESET} Package manager: ${CYAN}npm${RESET} ($(npm -v))"
else
    echo -e "${RED}[ERROR] Neither pnpm nor npm was found in PATH.${RESET}"
    echo -e "Please install pnpm (${CYAN}npm i -g pnpm${RESET}) or npm."
    exit 1
fi

# 3. Install dependencies
echo -e "\n${BOLD}[1/3] Installing dependencies with ${PKG_MGR}...${RESET}"
$PKG_MGR install

# 4. Run interactive setup wizard
echo -e "\n${BOLD}[2/3] Launching interactive setup wizard...${RESET}"
$PKG_MGR run setup

# 5. Start development server
echo -e "\n${BOLD}[3/3] Starting development server...${RESET}"
$PKG_MGR run dev
