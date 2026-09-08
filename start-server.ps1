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
Write-Host "   MAY CHU QUIZ LIVE SHOW DA SAN SANG HOAT DONG!          " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Màn hình Quản trò (Host / Máy chiếu):" -ForegroundColor Yellow
Write-Host "   http://$($ip):$port/quiz/host.html" -ForegroundColor White
Write-Host "   http://localhost:$port/quiz/host.html" -ForegroundColor Gray
Write-Host ""
Write-Host "Màn hình Người chơi (Điện thoại quét QR hoặc vào link):" -ForegroundColor Yellow
Write-Host "   http://$($ip):$port/quiz/player.html" -ForegroundColor White
Write-Host ""
Write-Host "Trang chủ trung tâm (Hub):" -ForegroundColor Yellow
Write-Host "   http://$($ip):$port/quiz/index.html" -ForegroundColor White
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan

# Mo trinh duyet
Start-Process "http://$($ip):$port/quiz/host.html"

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
