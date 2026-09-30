param(
    [int]$Port = 3000
)

$source = @"
using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Collections.Generic;

public class FastHttpServer {
    private HttpListener _listener;
    private string _root;
    private int _port;
    private bool _running;
    private static readonly Dictionary<string, string> MimeTypes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) {
        { ".html", "text/html; charset=utf-8" },
        { ".htm",  "text/html; charset=utf-8" },
        { ".css",  "text/css; charset=utf-8" },
        { ".js",   "application/javascript; charset=utf-8" },
        { ".json", "application/json; charset=utf-8" },
        { ".png",  "image/png" },
        { ".jpg",  "image/jpeg" },
        { ".jpeg", "image/jpeg" },
        { ".gif",  "image/gif" },
        { ".svg",  "image/svg+xml" },
        { ".webp", "image/webp" },
        { ".ico",  "image/x-icon" },
        { ".woff", "font/woff" },
        { ".woff2", "font/woff2" },
        { ".ttf",  "font/ttf" }
    };

    public FastHttpServer(string rootDirectory, int port) {
        _root = Path.GetFullPath(rootDirectory);
        _port = port;
    }

    public void Start() {
        _listener = new HttpListener();
        _listener.Prefixes.Add("http://localhost:" + _port + "/");
        _listener.Prefixes.Add("http://127.0.0.1:" + _port + "/");
        _listener.Start();
        _running = true;
        Console.WriteLine("Server running at http://localhost:" + _port + "/");

        for (int i = 0; i < 8; i++) {
            ThreadPool.QueueUserWorkItem(ListenLoop);
        }
    }

    private void ListenLoop(object state) {
        while (_running && _listener.IsListening) {
            try {
                HttpListenerContext ctx = _listener.GetContext();
                ThreadPool.QueueUserWorkItem(ProcessRequest, ctx);
            } catch {
                if (!_running) break;
            }
        }
    }

    private void ProcessRequest(object state) {
        HttpListenerContext ctx = (HttpListenerContext)state;
        try {
            string rawUrl = ctx.Request.Url.LocalPath;
            if (rawUrl == "/" || string.IsNullOrEmpty(rawUrl)) {
                rawUrl = "/index.html";
            }
            string relativePath = Uri.UnescapeDataString(rawUrl).TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            string fullPath = Path.Combine(_root, relativePath);

            if (File.Exists(fullPath)) {
                string ext = Path.GetExtension(fullPath);
                string mime = "application/octet-stream";
                if (MimeTypes.ContainsKey(ext)) {
                    mime = MimeTypes[ext];
                }

                ctx.Response.ContentType = mime;
                ctx.Response.StatusCode = 200;
                ctx.Response.Headers["Access-Control-Allow-Origin"] = "*";
                ctx.Response.Headers["Cache-Control"] = "public, max-age=86400";

                using (FileStream fs = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read)) {
                    ctx.Response.ContentLength64 = fs.Length;
                    fs.CopyTo(ctx.Response.OutputStream);
                }
            } else {
                ctx.Response.StatusCode = 404;
                byte[] notFound = Encoding.UTF8.GetBytes("404 Not Found: " + rawUrl);
                ctx.Response.ContentType = "text/plain; charset=utf-8";
                ctx.Response.ContentLength64 = notFound.Length;
                ctx.Response.OutputStream.Write(notFound, 0, notFound.Length);
            }
        } catch {
            // Client closed connection
        } finally {
            try { ctx.Response.Close(); } catch {}
        }
    }

    public void Stop() {
        _running = false;
        try { _listener.Stop(); } catch {}
    }
}
"@

Add-Type -TypeDefinition $source -Language CSharp

$currentDir = Get-Location
$server = New-Object FastHttpServer($currentDir.Path, $Port)
$server.Start()

Write-Host "Antigravity High-Speed Server listening on http://localhost:$Port/"
while ($true) {
    Start-Sleep -Seconds 1
}
