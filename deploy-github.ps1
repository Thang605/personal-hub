# Script tự động đẩy mã nguồn lên GitHub và kích hoạt GitHub Pages
$git = "git"
if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
    $git = "$env:LOCALAPPDATA\Programs\MinGit\cmd\git.exe"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   TRIỂN KHAI GAME CHÈO THUYỀN LÊN GITHUB PAGES          " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

& $git config --global --add safe.directory "c:/Dropbox/0.AI AGENT/9.Web" 2>$null
& $git config --global user.name "Thang605" 2>$null
& $git config --global user.email "thang605@users.noreply.github.com" 2>$null

$repoName = "Thang605/personal-hub"
$baseUrl = "https://github.com/$repoName.git"

& $git remote remove origin 2>$null
& $git remote add origin $baseUrl
& $git add .
& $git commit -m "Deploy Game Cheo Thuyen Dua Ngang Realtime QR" 2>$null
& $git branch -M main

Write-Host "Đang đẩy toàn bộ mã nguồn lên GitHub..." -ForegroundColor Green
$pushOutput = (& $git push -u origin main 2>&1)
$pushSuccess = ($LASTEXITCODE -eq 0)

if (-not $pushSuccess) {
    Write-Host ""
    Write-Host "⚠️ GitHub yêu cầu xác thực quyền đẩy mã nguồn (Personal Access Token)." -ForegroundColor Yellow
    Write-Host "Nếu chưa có Token, hãy dán Token của bạn vào bên dưới (hoặc nhấn ENTER để mở trang tạo Token tự động):" -ForegroundColor White
    $token = Read-Host "Dán GitHub Token (ghp_...) hoặc nhấn ENTER để mở trình duyệt"
    
    if ([string]::IsNullOrWhiteSpace($token)) {
        Start-Process "https://github.com/settings/tokens/new?scopes=repo&description=PersonalHub"
        Write-Host "Trình duyệt đã mở trang tạo Token. Sau khi bấm 'Generate token', hãy copy mã và dán vào đây:" -ForegroundColor Yellow
        $token = Read-Host "Dán GitHub Token vào đây"
    }

    if (-not [string]::IsNullOrWhiteSpace($token)) {
        $tokenClean = $token.Trim()
        $authUrl = "https://${tokenClean}@github.com/$repoName.git"
        & $git remote set-url origin $authUrl
        Write-Host "Đang đẩy lại với Token..." -ForegroundColor Green
        & $git push -u origin main
        & $git remote set-url origin $baseUrl
    }
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🎉 HOÀN TẤT ĐẨY MÃ NGUỒN LÊN GITHUB!" -ForegroundColor Green
Write-Host ""
Write-Host "Link trang web sau khi GitHub Pages build xong (khoảng 1 phút):" -ForegroundColor Yellow
Write-Host "   🚣 Game Chèo Thuyền (Quản trò/Máy chiếu): https://thang605.github.io/personal-hub/cheo-thuyen/index.html" -ForegroundColor Cyan
Write-Host "   📱 Game Chèo Thuyền (Tay cầm Người chơi): https://thang605.github.io/personal-hub/cheo-thuyen/player.html" -ForegroundColor Yellow
Write-Host "   👉 Màn hình Slide bài giảng:              https://thang605.github.io/personal-hub/quiz/slide.html?lesson=bai_giang_ai_2026&sec=1" -ForegroundColor Cyan
Write-Host "   👉 Màn hình Quiz Host:                   https://thang605.github.io/personal-hub/quiz/host.html" -ForegroundColor Cyan
Write-Host "   👉 Cổng trung tâm (Hub):                  https://thang605.github.io/personal-hub/quiz/index.html" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Pause
