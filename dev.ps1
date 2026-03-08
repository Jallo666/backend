Start-Process powershell -ArgumentList "-NoExit", "-Command", "dotnet run"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
