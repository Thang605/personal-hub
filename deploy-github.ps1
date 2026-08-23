# Script tự động đẩy mã nguồn lên GitHub và kích hoạt GitHub Pages
$git = "$env:LOCALAPPDATA\Programs\MinGit\cmd\git.exe"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   HUONG DAN DONG BO LEN GITHUB PAGES    " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Vao https://github.com/new tao Repository moi (Chon Public)."
Write-Host "2. Copy duong link HTTPS cua repo do (Vi du: https://github.com/username/personal-hub.git)"
Write-Host ""

$repoUrl = Read-Host "Nhap duong link GitHub Repository cua ban"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "Chua nhap link repository. Tam dung!" -ForegroundColor Yellow
    Pause
    Exit
}

& $git remote remove origin 2>$null
& $git remote add origin $repoUrl.Trim()
& $git add .
& $git commit -m "Update Personal Hub" 2>$null
& $git branch -M main

Write-Host ""
Write-Host "Dang day ma nguon len GitHub..." -ForegroundColor Green
& $git push -u origin main

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Da day ma nguon thanh cong!" -ForegroundColor Green
Write-Host "Buoc cuoi de lay Link co dinh:" -ForegroundColor Yellow
Write-Host "1. Vao trang repository tren GitHub -> Chon Settings -> Pages"
Write-Host "2. Muc 'Branch' chon 'main' -> Bam Save"
Write-Host "3. Link cua ban se la: https://<username>.github.io/<repo-name>/"
Write-Host "==========================================" -ForegroundColor Cyan
Pause
