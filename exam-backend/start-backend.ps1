# ─────────────────────────────────────────────────────────────────────────────
# AI Exam Platform — Backend Start Script (No Docker Required)
# Uses SQLite (built-in) instead of PostgreSQL + Redis
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "Starting AI Exam Platform Backend..." -ForegroundColor Cyan
Write-Host "Database: SQLite (exam_analyzer.db)" -ForegroundColor Green
Write-Host "No Docker / PostgreSQL / Redis required." -ForegroundColor Green
Write-Host ""

# Navigate to the backend folder (run this script from project root)
Set-Location -Path $PSScriptRoot

# Install dependencies if needed
# pip install -r requirements.txt

# Start FastAPI server
Write-Host "Starting API Server on http://localhost:8000 ..." -ForegroundColor Yellow
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
