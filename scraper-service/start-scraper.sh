#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# QuickLiqi Scraper Service — Startup Script
# ──────────────────────────────────────────────────────────────────────
# IMPORTANT: Before first run, make this file executable:
#   chmod +x start-scraper.sh
#
# This script creates/activates a Python virtual environment to comply
# with Kali Linux's PEP 668 externally-managed-environment policy,
# installs all dependencies, downloads Chromium, and starts the server.
# ──────────────────────────────────────────────────────────────────────

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[1/5] Creating Python virtual environment..."
python3 -m venv venv

echo "[2/5] Activating virtual environment..."
source venv/bin/activate

echo "[3/5] Installing Python dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo "[4/5] Installing Chromium browser for Playwright..."
playwright install chromium

echo "[5/5] Starting FastAPI server on http://localhost:8000 ..."
echo "       Docs available at http://localhost:8000/docs"
echo ""
uvicorn main:app --reload --port 8000
