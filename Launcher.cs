using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;

namespace ChurchMediaStudioLauncher
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string targetFile = "index.html";

                // Parse command line arguments for dedicated suite applications
                if (args != null && args.Length > 0)
                {
                    string fullArgs = string.Join(" ", args).ToLowerInvariant();
                    if (fullArgs.Contains("photo"))
                    {
                        targetFile = "photo.html";
                    }
                    else if (fullArgs.Contains("quote") || fullArgs.Contains("rhema"))
                    {
                        targetFile = "quotes.html";
                    }
                    else if (fullArgs.Contains("audio"))
                    {
                        targetFile = "audio.html";
                    }
                }

                string htmlPath = Path.Combine(baseDir, targetFile);
                if (!File.Exists(htmlPath))
                {
                    htmlPath = Path.Combine(baseDir, "Church Media Batch Watermark Studio (4).html");
                }
                if (!File.Exists(htmlPath))
                {
                    htmlPath = Path.Combine(baseDir, "index.html");
                }

                // If not found in current folder, extract the embedded standalone studio to LocalAppData
                if (!File.Exists(htmlPath))
                {
                    string targetFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ChurchMediaStudio");
                    if (!Directory.Exists(targetFolder))
                    {
                        Directory.CreateDirectory(targetFolder);
                    }
                    htmlPath = Path.Combine(targetFolder, "ChurchMediaStudio.html");

                    // Extract embedded resource if needed
                    var assembly = Assembly.GetExecutingAssembly();
                    using (Stream stream = assembly.GetManifestResourceStream("StudioHtml"))
                    {
                        if (stream != null)
                        {
                            using (FileStream fs = new FileStream(htmlPath, FileMode.Create, FileAccess.Write))
                            {
                                byte[] buffer = new byte[65536];
                                int read;
                                while ((read = stream.Read(buffer, 0, buffer.Length)) > 0)
                                {
                                    fs.Write(buffer, 0, read);
                                }
                            }
                        }
                    }
                }

                if (!File.Exists(htmlPath))
                {
                    MessageBox.Show("Could not initialize Church Media Studio files.", "Church Media Studio", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                string fileUri = new Uri(htmlPath).AbsoluteUri;

                // Launch in dedicated Edge App Mode (Clean dedicated desktop window without browser chrome)
                string edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe");
                if (!File.Exists(edgePath))
                {
                    edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe");
                }

                if (File.Exists(edgePath))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = edgePath,
                        Arguments = "--app=\"" + fileUri + "\" --window-size=1280,840",
                        UseShellExecute = true
                    });
                }
                else
                {
                    // Fallback to default browser
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = fileUri,
                        UseShellExecute = true
                    });
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error starting Church Media Studio: " + ex.Message, "Church Media Studio", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
