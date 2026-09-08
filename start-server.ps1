# PowerShell Native HTTP Static Server
$port = 8080
$path = $PSScriptRoot

# Tim dia chi IP LAN
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notmatch 'Loopback|vEthernet' -and ($_.IPAddress -match '^192\.168\.' -or $_.IPAddress -match '^10\.' -or $_.IPAddress -match '^172\.') 
} | Select-Object -First 1).IPAddress

if (-not $ip) { $ip = "127.0.0.1" }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://*:$port/")

try {
    $listener.Start()
} catch {
    # Neu khong co quyen bind http://*, fallback sang http://localhost va IP cu the
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Prefixes.Add("http://127.0.0.1:$port/")
    $listener.Start()
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   🎮 MAY CHU QUIZ LIVE SHOW DA SAN SANG HOAT DONG!      " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🖥️ Màn hình Quản trò (Host / Máy chiếu):" -ForegroundColor Yellow
Write-Host "   http://$($ip):$port/quiz/host.html" -ForegroundColor White
Write-Host "   http://localhost:$port/quiz/host.html" -ForegroundColor Gray
Write-Host ""
Write-Host "📱 Màn hình Người chơi (Điện thoại quét QR hoặc vào link):" -ForegroundColor Yellow
Write-Host "   http://$($ip):$port/quiz/player.html" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Trang chủ trung tâm (Hub):" -ForegroundColor Yellow
Write-Host "   http://$($ip):$port/quiz/index.html" -ForegroundColor White
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Nhan Ctrl+C de dung may chu." -ForegroundColor DarkGray

# Tu dong mo trinh duyet voi link Host
Start-Process "http://$($ip):$port/quiz/host.html"

# Vong lap lang nghe yeu cau HTTP
while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($urlPath)) { $urlPath = "index.html" }

        $filePath = Join-Path $path $urlPath.Replace('/', [IO.Path]::DirectorySeparatorChar)

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [IO.File]::ReadAllBytes($filePath)
            
            # Content-Type mapping
            $ext = [IO.Path]::GetExtension($filePath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".htm"  { "text/html; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                ".ico"  { "image/x-icon" }
                default { "application/octet-stream" }
            }

            $response.ContentType = $contentType
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {
        # Bo qua loi ngat ket noi
    }
}
