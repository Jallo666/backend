#!/bin/bash
# Avvia backend e frontend in parallelo
dotnet run &
cd frontend && npm run dev &
wait
