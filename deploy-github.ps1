# Script tự động đẩy mã nguồn lên GitHub và kích hoạt GitHub Pages
$git = "git"
if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
    $git = "$env:LOCALAPPDATA\Programs\MinGit\cmd\git.exe"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   TRIỂN KHAI PERSONAL HUB & QUIZ LIVE LÊN GITHUB PAGES  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Lấy remote hiện tại nếu có
$currentRemote = (& $git remote get-url origin 2>$null)
if ([string]::IsNullOrWhiteSpace($currentRemote)) {
    $currentRemote = "https://github.com/Thang605/personal-hub.git"
}

Write-Host "Remote URL hiện tại: $currentRemote" -ForegroundColor Yellow
$repoUrl = Read-Host "Nhấn ENTER để dùng link trên (hoặc dán link Repository mới)"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    $repoUrl = $currentRemote
}

& $git remote remove origin 2>$null
& $git remote add origin $repoUrl.Trim()
& $git add .
& $git commit -m "Deploy Personal Hub with Multiplayer Quiz Live Show" 2>$null
& $git branch -M main

Write-Host ""
Write-Host "Đang đẩy toàn bộ mã nguồn lên GitHub..." -ForegroundColor Green
& $git push -u origin main

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🎉 ĐÃ ĐẨY MÃ NGUỒN LÊN GITHUB THÀNH CÔNG!" -ForegroundColor Green
Write-Host ""
Write-Host "CÁC BƯỚC ĐỂ LẤY LINK CHƠI TRỰC TUYẾN TOÀN CẦU:" -ForegroundColor Yellow
Write-Host "1. Vào: https://github.com/Thang605/personal-hub/settings/pages"
Write-Host "2. Tại mục 'Build and deployment' -> Source: Deploy from a branch"
Write-Host "3. Mục 'Branch': Chọn 'main' và thư mục '/ (root)' -> Bấm 'Save'"
Write-Host "4. Chờ 1-2 phút, link chơi trực tuyến của bạn sẽ là:"
Write-Host "   👉 Màn hình Quản trò (Host): https://thang605.github.io/personal-hub/quiz/host.html" -ForegroundColor Cyan
Write-Host "   👉 Cổng trung tâm (Hub):     https://thang605.github.io/personal-hub/quiz/index.html" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Pause
