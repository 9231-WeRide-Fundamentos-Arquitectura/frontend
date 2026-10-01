@echo off
cd /d "%~dp0.."
npx json-server server/db.json --port 3000
