# Script tự động đẩy mã nguồn lên GitHub và kích hoạt GitHub Pages
$git = "git"
if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
    $git = "$env:LOCALAPPDATA\Programs\MinGit\cmd\git.exe"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   TRIỂN KHAI PERSONAL HUB & QUIZ LIVE LÊN GITHUB PAGES  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

& $git config --global --add safe.directory "c:/Dropbox/0.AI AGENT/9.Web" 2>$null
& $git config --global user.name "Thang605" 2>$null
& $git config --global user.email "thang605@users.noreply.github.com" 2>$null
& $git config --global credential.helper manager 2>$null

# Lấy remote hiện tại nếu có
$currentRemote = (& $git remote get-url origin 2>$null)
if ([string]::IsNullOrWhiteSpace($currentRemote)) {
    $currentRemote = "https://github.com/Thang605/personal-hub.git"
}

Write-Host "Remote URL: $currentRemote" -ForegroundColor Yellow
Write-Host "Đang chuẩn bị gói dữ liệu và đẩy lên GitHub..." -ForegroundColor White

& $git remote remove origin 2>$null
& $git remote add origin $currentRemote.Trim()
& $git add .
& $git commit -m "Fix: QR code link and realtime voting sync for PowerPoint Web Viewer" 2>$null
& $git branch -M main

Write-Host ""
Write-Host "Đang đẩy toàn bộ mã nguồn lên GitHub (Nếu xuất hiện cửa sổ đăng nhập GitHub, vui lòng chọn Authorize)..." -ForegroundColor Green
& $git push -u origin main

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🎉 HOÀN TẤT ĐẨY MÃ NGUỒN LÊN GITHUB!" -ForegroundColor Green
Write-Host ""
Write-Host "Link trang web sau khi GitHub Pages build xong (khoảng 1 phút):" -ForegroundColor Yellow
Write-Host "   👉 Màn hình Slide bài giảng: https://thang605.github.io/personal-hub/quiz/slide.html?lesson=bai_giang_ai_2026&sec=1" -ForegroundColor Cyan
Write-Host "   👉 Màn hình Quản trò (Host):  https://thang605.github.io/personal-hub/quiz/host.html" -ForegroundColor Cyan
Write-Host "   👉 Cổng trung tâm (Hub):      https://thang605.github.io/personal-hub/quiz/index.html" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Pause
