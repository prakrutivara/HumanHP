# Local npm registry proxy. Node/npm cannot reach registry.npmjs.org on this machine;
# WinHTTP (Invoke-WebRequest) can. This forwards metadata and tarballs.
$listenPrefix = "http://127.0.0.1:4873/"
$upstream = "https://registry.npmjs.org"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($listenPrefix)
$listener.Start()
Write-Output "PROXY_READY $listenPrefix"

function Send-Bytes {
  param($Response, [byte[]]$Bytes, [string]$ContentType, [int]$Status = 200)
  $Response.StatusCode = $Status
  $Response.ContentType = $ContentType
  $Response.ContentLength64 = $Bytes.Length
  $Response.Headers.Add("Cache-Control", "public, max-age=60")
  $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
  $Response.OutputStream.Close()
}

while ($listener.IsListening) {
  $ctx = $null
  try {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    $path = $req.Url.PathAndQuery
    if ($path -eq "/__shutdown") {
      Send-Bytes $res ([Text.Encoding]::UTF8.GetBytes("bye")) "text/plain"
      $listener.Stop()
      break
    }
    $upstreamUrl = $upstream + $path
    if ($path -match "\.tgz") {
      $tmp = Join-Path $env:TEMP ("npm-proxy-" + [Guid]::NewGuid().ToString() + ".tgz")
      Invoke-WebRequest -Uri $upstreamUrl -OutFile $tmp -UseBasicParsing
      $bytes = [System.IO.File]::ReadAllBytes($tmp)
      Remove-Item $tmp -Force -ErrorAction SilentlyContinue
      Send-Bytes $res $bytes "application/octet-stream"
    } else {
      $meta = Invoke-WebRequest -Uri $upstreamUrl -UseBasicParsing
      $text = $meta.Content
      $text = $text -replace "https://registry\.npmjs\.org", "http://127.0.0.1:4873"
      $bytes = [Text.Encoding]::UTF8.GetBytes($text)
      $ctype = $meta.Headers["Content-Type"]
      if (-not $ctype) { $ctype = "application/json" }
      Send-Bytes $res $bytes $ctype
    }
  } catch {
    if ($ctx -ne $null) {
      try {
        $msg = [Text.Encoding]::UTF8.GetBytes(("proxy error: " + $_.Exception.Message))
        Send-Bytes $ctx.Response $msg "text/plain" 502
      } catch { }
    }
  }
}
