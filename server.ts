import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // Create RESPALDOS directory if it doesn't exist
  const backupDir = path.join(process.cwd(), 'RESPALDOS');
  if (!fs.existsSync(backupDir)) {
    try {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('Directorio RESPALDOS creado.');
    } catch (err) {
      console.warn('No se pudo crear el directorio RESPALDOS:', err);
    }
  }

  // API Route for Automatic Backup
  app.post("/api/backup", (req, res) => {
    try {
      const backupData = req.body;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `respaldo_automatico_${timestamp}.json`;
      const filePath = path.join(backupDir, filename);

      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
      console.log(`Respaldo guardado en: ${filePath}`);
      
      res.json({ 
        success: true, 
        message: "Respaldo guardado correctamente en la carpeta RESPALDOS",
        filename: filename
      });
    } catch (error) {
      console.error("Error al guardar respaldo:", error);
      res.status(500).json({ success: false, error: "Error al guardar el respaldo en el servidor" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with Vite...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode...");
    const distPath = path.resolve(process.cwd(), 'dist');
    console.log(`Checking for dist folder at: ${distPath}`);
    
    if (fs.existsSync(distPath)) {
      console.log("'dist' folder found, serving static files.");
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send("index.html not found in dist folder.");
        }
      });
    } else {
      console.error("Error: 'dist' folder not found. Please ensure 'npm run build' was executed.");
      app.get('*', (req, res) => {
        res.status(500).send("Application build not found. Please contact support.");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on port ${PORT}`);
    console.log(`Production URL: http://0.0.0.0:${PORT}`);
  });
}

startServer();
