using System.Diagnostics;
using System.Net;
using System.Net.Sockets;

var webRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot");
if (!Directory.Exists(webRoot))
{
    Console.Error.WriteLine("Build web nao encontrado. Publique novamente incluindo a pasta wwwroot.");
    return 1;
}

var port = GetPreferredPort(5174);
var prefix = $"http://localhost:{port}/";
using var listener = new HttpListener();
listener.Prefixes.Add(prefix);
listener.Start();

Console.WriteLine($"PAD iniciado em {prefix}");
OpenBrowser(prefix);

while (listener.IsListening)
{
    var context = await listener.GetContextAsync();
    _ = Task.Run(() => ServeAsync(context, webRoot));
}

return 0;

static int GetPreferredPort(int preferredPort)
{
    if (IsPortAvailable(preferredPort)) return preferredPort;
    return GetFreePort();
}

static bool IsPortAvailable(int port)
{
    try
    {
        using var socket = new TcpListener(IPAddress.Loopback, port);
        socket.Start();
        return true;
    }
    catch
    {
        return false;
    }
}

static int GetFreePort()
{
    using var socket = new TcpListener(IPAddress.Loopback, 0);
    socket.Start();
    return ((IPEndPoint)socket.LocalEndpoint).Port;
}

static void OpenBrowser(string url)
{
    Process.Start(new ProcessStartInfo
    {
        FileName = url,
        UseShellExecute = true,
    });
}

static async Task ServeAsync(HttpListenerContext context, string webRoot)
{
    try
    {
        var requestPath = Uri.UnescapeDataString(context.Request.Url?.AbsolutePath.TrimStart('/') ?? "");
        if (string.IsNullOrWhiteSpace(requestPath))
        {
            requestPath = "index.html";
        }

        var filePath = Path.GetFullPath(Path.Combine(webRoot, requestPath.Replace('/', Path.DirectorySeparatorChar)));
        if (!filePath.StartsWith(Path.GetFullPath(webRoot), StringComparison.OrdinalIgnoreCase) || !File.Exists(filePath))
        {
            filePath = Path.Combine(webRoot, "index.html");
        }

        var bytes = await File.ReadAllBytesAsync(filePath);
        context.Response.ContentType = ContentType(filePath);
        context.Response.ContentLength64 = bytes.LongLength;
        context.Response.Headers["Cache-Control"] = "no-store";
        await context.Response.OutputStream.WriteAsync(bytes);
    }
    catch (Exception ex)
    {
        var message = System.Text.Encoding.UTF8.GetBytes(ex.Message);
        context.Response.StatusCode = 500;
        context.Response.ContentType = "text/plain; charset=utf-8";
        await context.Response.OutputStream.WriteAsync(message);
    }
    finally
    {
        context.Response.OutputStream.Close();
    }
}

static string ContentType(string path)
{
    return Path.GetExtension(path).ToLowerInvariant() switch
    {
        ".html" => "text/html; charset=utf-8",
        ".js" => "text/javascript; charset=utf-8",
        ".css" => "text/css; charset=utf-8",
        ".json" => "application/json; charset=utf-8",
        ".svg" => "image/svg+xml",
        ".png" => "image/png",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".webp" => "image/webp",
        ".ico" => "image/x-icon",
        _ => "application/octet-stream",
    };
}
