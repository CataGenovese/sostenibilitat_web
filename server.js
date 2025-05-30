import express from "express";
import cors from "cors";
import fs from "fs";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Sirve todo lo que está en public directamente
app.use('/public', express.static(path.join(__dirname, 'public')));

// Sirve específicamente el contenido de /public/script en /script
app.use('/script', express.static(path.join(__dirname, 'public', 'script')));

// Ruta raíz "/" que sirve menu.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "HTML", "menu.html"));
});

// Las demás rutas API que ya tienes:
const readData = () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, "public", "script", "incendios.json"));
    return JSON.parse(data);
  } catch (error) {
    console.error("Error leyendo JSON:", error);
    return [];
  }
};

app.get("/dates", (req, res) => {
  const data = readData();
  const dates = [...new Set(data.map(item => item["DATA_INCENDI"]))];
  res.json(dates);
});

app.get("/comarcas", (req, res) => {
  const data = readData();
  const comarcas = [...new Set(data.map(item => item["COMARCA"]))];
  res.json(comarcas);
});

app.get("/incendios/date/:fecha", (req, res) => {
  const data = readData();
  const fecha = req.params.fecha;
  const filtered = data.filter(item => item["DATA_INCENDI"] === fecha)
    .map(item => ({
      comarca: item["COMARCA"],
      hectareas: item["HAFORESTAL"]
    }));
  res.json(filtered);
});

app.get("/incendios/comarca/:comarca", (req, res) => {
  const data = readData();
  const comarca = decodeURIComponent(req.params.comarca);
  const filtered = data.filter(item => item["COMARCA"] === comarca)
    .map(item => ({
      fecha: item["DATA_INCENDI"],
      hectareas: item["HAFORESTAL"]
    }));
  res.json(filtered);
});

app.listen(3000, () => {
  console.log("Servidor escuchando en puerto 3000");
});
