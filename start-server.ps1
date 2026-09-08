param (
    [string]$App = "cheo-thuyen"
)

# PowerShell Native HTTP Static Server
$port = 8080
$path = $PSScriptRoot

# Tim dia chi IP LAN
$ipObj = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { 
    $_.InterfaceAlias -notmatch 'Loopback|vEthernet' -and ($_.IPAddress -match '^192\.168\.' -or $_.IPAddress -match '^10\.' -or $_.IPAddress -match '^172\.') 
} | Select-Object -First 1

$ip = "127.0.0.1"
if ($ipObj) { $ip = $ipObj.IPAddress }

$listener = New-Object System.Net.HttpListener
try {
    $listener.Prefixes.Add("http://*:$port/")
    $listener.Start()
} catch {
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Prefixes.Add("http://127.0.0.1:$port/")
    $listener.Start()
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   MAY CHU GAME & QUIZ LIVE SHOW DA SAN SANG!             " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1] GAME CHÈO THUYỀN ĐUA NGANG (QUÉT QR CHƠI NGAY):" -ForegroundColor Cyan
Write-Host "   Máy chiếu / Quản trò : http://$($ip):$port/cheo-thuyen/index.html" -ForegroundColor White
Write-Host "   Người chơi (Điện thoại): http://$($ip):$port/cheo-thuyen/player.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "[2] QUIZ LIVE SHOW:" -ForegroundColor Cyan
Write-Host "   Máy chiếu / Quản trò : http://$($ip):$port/quiz/host.html" -ForegroundColor White
Write-Host "   Người chơi (Điện thoại): http://$($ip):$port/quiz/player.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "[3] TRUNG TÂM PERSONAL HUB:" -ForegroundColor Cyan
Write-Host "   Trang chủ Hub        : http://$($ip):$port/index.html" -ForegroundColor White
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan

# Mo trinh duyet theo App duoc chon
if ($App -eq "quiz") {
    Start-Process "http://$($ip):$port/quiz/host.html"
} elseif ($App -eq "cheo-thuyen") {
    Start-Process "http://$($ip):$port/cheo-thuyen/index.html"
} else {
    Start-Process "http://$($ip):$port/index.html"
}

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
            $ext = [IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "application/octet-stream"
            if ($ext -eq ".html" -or $ext -eq ".htm") { $contentType = "text/html; charset=utf-8" }
            elseif ($ext -eq ".js") { $contentType = "application/javascript; charset=utf-8" }
            elseif ($ext -eq ".css") { $contentType = "text/css; charset=utf-8" }
            elseif ($ext -eq ".json") { $contentType = "application/json; charset=utf-8" }
            elseif ($ext -eq ".png") { $contentType = "image/png" }
            elseif ($ext -eq ".jpg" -or $ext -eq ".jpeg") { $contentType = "image/jpeg" }
            elseif ($ext -eq ".svg") { $contentType = "image/svg+xml" }
            elseif ($ext -eq ".ico") { $contentType = "image/x-icon" }

            $response.ContentType = $contentType
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("File Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {
        # Catch and continue
    }
}
