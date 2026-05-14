# Guía de Instalación Local - Y.G Facturación

Este sistema está preparado para ser instalado como una aplicación de escritorio (archivo .exe) en cualquier computadora con Windows (o .app en Mac).

## Pasos para instalar en tu computadora:

1. **Descargar el código:**
   - En AI Studio, ve al menú de configuración (icono de engranaje) y selecciona **"Export to ZIP"**.
   - Descomprime el archivo en tu computadora.

2. **Requisitos previos:**
   - Debes tener instalado **Node.js** (recomendado versión 18 o superior). Puedes descargarlo en [nodejs.org](https://nodejs.org/).

3. **Instalar dependencias:**
   - Abre una terminal o consola en la carpeta donde descargaste el código y ejecuta:
     ```bash
     npm install
     ```

4. **Crear el instalador ejecutable:**
   - En la misma terminal, ejecuta el siguiente comando:
     ```bash
     npm run desktop:build
     ```
   - Este comando hará dos cosas:
     - Compilará la aplicación web (`dist`) con rutas relativas para que funcione en escritorio.
     - Creará el archivo ejecutable (`.exe`) dentro de una carpeta llamada `dist-electron`.

5. **Instalar la aplicación:**
   - Ve a la carpeta `dist-electron` y busca el archivo llamado `Y.G Facturación Setup 0.0.0.exe`.
   - Ejecútalo para instalar el sistema en tu computadora como cualquier otro programa profesional.

---

## Solución a problemas comunes:

### La pantalla se queda en blanco:
He configurado el sistema para que use rutas relativas (`base: './'`). Si antes veías una pantalla blanca, descarga nuevamente el código (Export to ZIP) y repite el proceso. Esto asegura que el programa encuentre sus archivos internos.

---

## Opción alterna (PWA - Sin descargar nada):
Si prefieres no descargar el código, puedes "Instalar" la aplicación directamente desde el navegador (Chrome o Edge) haciendo clic en el icono de **"Instalar Aplicación"** que aparece en la barra de direcciones mientras visualizas la aplicación compartida.

---

**Nota:** El sistema utiliza Firebase para los datos, por lo que la computadora necesitará conexión a internet para sincronizar las ventas y productos, a menos que se configure una base de datos local adicional.
