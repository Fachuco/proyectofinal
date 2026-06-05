const http = require("node:http");
const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const DIST_DIR = path.join(__dirname, "dist");
const PUBLIC_DIR = fsSync.existsSync(DIST_DIR) ? DIST_DIR : path.join(__dirname, "public");
const CATALOG_PATH = path.join(__dirname, "data", "latinVehicles.json");
const AI_PROVIDER = process.env.AI_PROVIDER || "auto";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

async function getVehicleCatalog() {
  const file = await fs.readFile(CATALOG_PATH, "utf8");
  return JSON.parse(file).map((vehicle, index) => ({
    id: String(index + 1),
    label: `${vehicle.make} ${vehicle.model} ${vehicle.trim} (${vehicle.year})`,
    ...vehicle
  }));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString("utf8");
  if (!body) return {};
  return JSON.parse(body);
}

function toNumber(value, fallback = 0) {
  const cleaned = String(value ?? "").replace(/[^\d.]/g, "");
  if (!cleaned) return fallback;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function parseJsonContent(content) {
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch {
    const match = String(content).match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  }
}

function detectFuel(vehicle) {
  const text = [
    vehicle.fuelType,
    vehicle.engine,
    vehicle.displacement,
    vehicle.model,
    vehicle.trim
  ].join(" ").toLowerCase();

  if (text.includes("diesel")) return "diesel";
  if (text.includes("electric")) return "electrico";
  if (text.includes("hybrid") || text.includes("hibrido")) return "hibrido";
  return "gasolina";
}

function maintenanceHistory(body) {
  return {
    oil: toNumber(body.lastOilKm, null),
    "oil-filter": toNumber(body.lastOilFilterKm, null),
    "air-filter": toNumber(body.lastAirFilterKm, null),
    "cabin-filter": toNumber(body.lastCabinFilterKm, null),
    brakes: toNumber(body.lastBrakesKm, null),
    tires: toNumber(body.lastTiresKm, null),
    "spark-plugs": toNumber(body.lastSparkPlugsKm, null),
    coolant: toNumber(body.lastCoolantKm, null),
    transmission: toNumber(body.lastTransmissionKm, null),
    timing: toNumber(body.lastTimingKm, null)
  };
}

function maintenanceRules(vehicle) {
  const fuel = detectFuel(vehicle);
  const base = [
    {
      id: "oil",
      item: "Cambio de aceite de motor",
      intervalKm: fuel === "diesel" ? 7000 : 10000,
      urgencyWindowKm: 1000,
      applies: fuel !== "electrico",
      detail: "Protege el motor y reduce desgaste interno."
    },
    {
      id: "oil-filter",
      item: "Filtro de aceite",
      intervalKm: fuel === "diesel" ? 7000 : 10000,
      urgencyWindowKm: 1000,
      applies: fuel !== "electrico",
      detail: "Conviene cambiarlo junto con el aceite."
    },
    {
      id: "air-filter",
      item: "Filtro de aire",
      intervalKm: 15000,
      urgencyWindowKm: 1500,
      applies: fuel !== "electrico",
      detail: "Mejora la combustión y el consumo."
    },
    {
      id: "cabin-filter",
      item: "Filtro de cabina",
      intervalKm: 15000,
      urgencyWindowKm: 1500,
      applies: true,
      detail: "Mantiene limpio el aire del habitáculo."
    },
    {
      id: "brakes",
      item: "Inspección de frenos",
      intervalKm: 10000,
      urgencyWindowKm: 1200,
      applies: true,
      detail: "Revisar pastillas, discos, líquido y ruidos."
    },
    {
      id: "tires",
      item: "Rotación y presión de llantas",
      intervalKm: 10000,
      urgencyWindowKm: 1200,
      applies: true,
      detail: "Ayuda a evitar desgaste irregular."
    },
    {
      id: "spark-plugs",
      item: "Bujías",
      intervalKm: fuel === "diesel" || fuel === "electrico" ? 0 : 40000,
      urgencyWindowKm: 3000,
      applies: fuel === "gasolina" || fuel === "hibrido",
      detail: "Afectan encendido, potencia y consumo."
    },
    {
      id: "coolant",
      item: "Refrigerante",
      intervalKm: 40000,
      urgencyWindowKm: 3000,
      applies: true,
      detail: "Previene sobrecalentamiento y corrosión."
    },
    {
      id: "transmission",
      item: "Aceite de transmisión",
      intervalKm: 60000,
      urgencyWindowKm: 5000,
      applies: true,
      detail: "Intervalo variable según caja manual, automática o CVT."
    },
    {
      id: "timing",
      item: "Correa/cadena de distribución",
      intervalKm: 90000,
      urgencyWindowKm: 8000,
      applies: fuel !== "electrico",
      detail: "Si usa correa, ignorarla puede causar daños graves."
    }
  ];

  return base.filter((rule) => rule.applies && rule.intervalKm > 0);
}

function evaluateOctaneBooster(vehicle, mileage) {
  const fuel = detectFuel(vehicle);
  const engineText = [vehicle.engine, vehicle.trim, vehicle.model].join(" ").toLowerCase();
  const weeklyFuel = toNumber(vehicle.weeklyFuelLiters);
  const isGasolineCompatible = fuel === "gasolina" || fuel === "hibrido";

  if (!isGasolineCompatible) {
    return {
      applicable: false,
      item: "Elevador de octanaje AIS",
      status: "No aplica",
      urgency: "Baja",
      nextDue: null,
      reason: "No se recomienda elevador de octanaje en vehículos diésel o eléctricos.",
      detail: "Usar solo productos compatibles con el combustible indicado por el fabricante."
    };
  }

  const intervalKm = engineText.includes("turbo") || weeklyFuel >= 45 ? 5000 : 10000;
  const cycles = Math.floor(mileage / intervalKm);
  const lastDue = cycles * intervalKm;
  const nextDue = lastDue + intervalKm;
  const kmSinceDue = mileage - lastDue;
  const kmToNext = nextDue - mileage;

  let status = "Opcional";
  let urgency = "Baja";
  let reason = `Próxima carga preventiva sugerida en ${nextDue.toLocaleString("es-BO")} km.`;

  if (mileage >= intervalKm && kmSinceDue <= 700) {
    status = "Recomendado ahora";
    urgency = "Media";
    reason = `Por kilometraje, puedes usar elevador de octanaje AIS en la próxima carga de combustible. Referencia: ${lastDue.toLocaleString("es-BO")} km.`;
  } else if (kmToNext <= 700 && kmToNext > 0) {
    status = "Próximo";
    urgency = "Media";
    reason = `Faltan aproximadamente ${kmToNext.toLocaleString("es-BO")} km para la próxima carga preventiva con elevador de octanaje AIS.`;
  }

  return {
    applicable: true,
    item: "Elevador de octanaje AIS",
    status,
    urgency,
    intervalKm,
    nextDue,
    reason,
    detail:
      "Recomendación opcional: usar solo si el producto es compatible con gasolina y respetando la dosis del envase. No reemplaza mantenimiento ni combustible del octanaje indicado por el fabricante."
  };
}

function evaluateMaintenance(vehicle) {
  const mileage = toNumber(vehicle.mileage);
  const rules = maintenanceRules(vehicle);
  const history = vehicle.maintenanceHistory || {};
  const tasks = rules.map((rule) => {
    const lastServiceKm = Number.isFinite(history[rule.id]) ? history[rule.id] : null;
    const hasHistory = lastServiceKm !== null && lastServiceKm >= 0 && lastServiceKm <= mileage;
    const kmSinceService = hasHistory ? mileage - lastServiceKm : null;
    const cycles = Math.floor(mileage / rule.intervalKm);
    const estimatedLastDue = cycles * rule.intervalKm;
    const referenceKm = hasHistory ? lastServiceKm : estimatedLastDue;
    const nextDue = referenceKm + rule.intervalKm;
    const kmSinceReference = mileage - referenceKm;
    const kmToNext = nextDue - mileage;

    let status = "Al dia";
    let urgency = "Baja";
    let reason = hasHistory
      ? `Último registro en ${lastServiceKm.toLocaleString("es-BO")} km. Próximo control sugerido en ${nextDue.toLocaleString("es-BO")} km.`
      : `Próximo control sugerido en ${nextDue.toLocaleString("es-BO")} km.`;

    if (hasHistory && kmSinceService >= rule.intervalKm) {
      status = "Vencido";
      urgency = "Alta";
      reason = `Han pasado ${kmSinceService.toLocaleString("es-BO")} km desde el último registro. Este servicio debe atenderse pronto.`;
    } else if (hasHistory && kmToNext <= rule.urgencyWindowKm && kmToNext > 0) {
      status = "Proximo";
      urgency = "Media";
      reason = `Faltan aproximadamente ${kmToNext.toLocaleString("es-BO")} km desde el último registro para este servicio.`;
    } else if (!hasHistory && mileage >= rule.intervalKm && kmSinceReference <= rule.urgencyWindowKm) {
      status = "Revisar ahora";
      urgency = "Media";
      reason = `Si no se realizó en ${estimatedLastDue.toLocaleString("es-BO")} km, este servicio ya está en zona de revisión.`;
    } else if (!hasHistory && mileage >= rule.intervalKm && kmSinceReference > rule.urgencyWindowKm && kmToNext < rule.intervalKm * 0.45) {
      status = "Vencido";
      urgency = "Alta";
      reason = `Si no se realizó en ${estimatedLastDue.toLocaleString("es-BO")} km, este servicio debe atenderse pronto.`;
    } else if (!hasHistory && kmToNext <= rule.urgencyWindowKm && kmToNext > 0) {
      status = "Proximo";
      urgency = "Media";
      reason = `Faltan aproximadamente ${kmToNext.toLocaleString("es-BO")} km para el servicio.`;
    }

    return {
      ...rule,
      status,
      urgency,
      nextDue,
      lastServiceKm,
      kmSinceService,
      reason
    };
  });

  const urgentCount = tasks.filter((task) => task.urgency === "Alta").length;
  const soonCount = tasks.filter((task) => task.urgency === "Media").length;
  const overallStatus = urgentCount > 0 ? "Necesita mantenimiento" : soonCount > 0 ? "Revisión recomendada" : "Sin alertas críticas";

  return {
    mileage,
    fuel: detectFuel(vehicle),
    overallStatus,
    urgentCount,
    soonCount,
    tasks,
    octaneBooster: evaluateOctaneBooster(vehicle, mileage)
  };
}

function fallbackAiAnalysis(vehicle, evaluation) {
  const makeModel = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .join(" ");
  const urgent = evaluation.tasks.filter((task) => task.urgency === "Alta");
  const soon = evaluation.tasks.filter((task) => task.urgency === "Media");
  const primary = urgent[0] || soon[0] || evaluation.tasks[0];
  const octane = evaluation.octaneBooster;
  const fuelUse = vehicle.weeklyFuelLiters
    ? ` También registra un consumo/carga semanal aproximada de ${vehicle.weeklyFuelLiters.toLocaleString("es-BO")} litros, dato útil para evaluar uso intensivo y costos.`
    : "";
  const octaneText = octane?.applicable
    ? ` Para elevador de octanaje AIS: ${octane.reason}`
    : ` Elevador de octanaje AIS: ${octane?.reason || "no evaluado"}`;

  return {
    mode: "demo-local",
    title: evaluation.overallStatus,
    summary: `${makeModel || "El vehículo"} registra ${evaluation.mileage.toLocaleString("es-BO")} km. ${
      urgent.length
        ? "Hay servicios vencidos que conviene atender antes de seguir usando el vehículo diariamente."
        : soon.length
          ? "No hay una falla confirmada, pero el kilometraje ya sugiere una revisión preventiva."
          : "No aparecen mantenimientos críticos por kilometraje en esta revisión básica."
    }${fuelUse}${octaneText}`,
    priority: urgent.length ? "Alta" : soon.length ? "Media" : "Baja",
    explanation: primary
      ? `${primary.item}: ${primary.reason} ${primary.detail}`
      : "No se encontraron reglas aplicables para este tipo de vehículo.",
    recommendations: [
      urgent.length ? `Atender primero: ${urgent.map((item) => item.item).join(", ")}.` : "Verificar historial real de servicios para afinar el diagnóstico.",
      soon.length ? `Programar pronto: ${soon.map((item) => item.item).join(", ")}.` : "Registrar fecha y kilometraje del próximo mantenimiento.",
      octane?.applicable ? `${octane.item}: ${octane.reason}` : `${octane?.item || "Elevador de octanaje AIS"}: no aplica para este combustible.`,
      "Confirmar siempre con el manual del fabricante o un taller certificado."
    ]
  };
}

function addOctaneRecommendation(ai, evaluation) {
  const octane = evaluation.octaneBooster;
  if (!ai || !octane) return ai;

  const recommendation = octane.applicable
    ? `${octane.item}: ${octane.reason}`
    : `${octane.item}: ${octane.reason}`;
  const current = Array.isArray(ai.recommendations) ? ai.recommendations : [];
  const alreadyIncluded = current.some((item) => String(item).toLowerCase().includes("octanaje"));

  return {
    ...ai,
    recommendations: alreadyIncluded ? current : [...current, recommendation]
  };
}

async function askOpenAi(vehicle, evaluation) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const prompt = {
    vehicle,
    evaluation,
    instruction:
      "Responde en español para un sistema de mantenimiento vehicular. Devuelve solo JSON con: title, summary, priority, explanation, recommendations."
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "Eres un asistente técnico automotriz. No inventes especificaciones exactas; explica el diagnóstico con prudencia y recomienda verificar el manual del fabricante."
        },
        {
          role: "user",
          content: JSON.stringify(prompt)
        }
      ],
      text: {
        format: {
          type: "json_object"
        }
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = data.output_text || data.output?.[0]?.content?.[0]?.text;
  if (!content) return null;
  return {
    mode: "openai",
    ...JSON.parse(content)
  };
}

async function askOllama(vehicle, evaluation) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 75000);
  const compactEvaluation = {
    mileage: evaluation.mileage,
    fuel: evaluation.fuel,
    overallStatus: evaluation.overallStatus,
    urgentCount: evaluation.urgentCount,
    soonCount: evaluation.soonCount,
    octaneBooster: evaluation.octaneBooster,
    tasks: evaluation.tasks
      .filter((task) => task.urgency === "Alta" || task.urgency === "Media")
      .slice(0, 6)
      .map((task) => ({
        item: task.item,
        urgency: task.urgency,
        reason: task.reason,
        nextDue: task.nextDue
      }))
  };
  const prompt = {
    vehicle,
    evaluation: compactEvaluation,
    output:
      "Devuelve solo JSON valido y breve con las claves title, summary, priority, explanation y recommendations. recommendations debe ser un array de maximo 4 strings."
  };

  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        format: "json",
        options: {
          temperature: 0.2,
          num_ctx: 2048,
          num_predict: 220
        },
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente tecnico automotriz para mantenimiento preventivo. Responde en espanol. No inventes especificaciones exactas; usa solo los datos recibidos, las reglas de mantenimiento y prudencia tecnica. Recomienda verificar manual del fabricante cuando corresponda."
          },
          {
            role: "user",
            content: JSON.stringify(prompt)
          }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = String(data.message?.content || "").trim();
    const parsed = parseJsonContent(content);
    const fallback = fallbackAiAnalysis(vehicle, evaluation);
    if (!parsed) {
      return {
        mode: "ollama",
        title: fallback.title,
        summary: fallback.summary,
        priority: fallback.priority,
        explanation: content || fallback.explanation,
        recommendations: fallback.recommendations
      };
    }

    return {
      mode: "ollama",
      title: parsed.title || evaluation.overallStatus,
      summary: parsed.summary || fallback.summary,
      priority: parsed.priority || fallback.priority,
      explanation: parsed.explanation || fallback.explanation,
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : fallback.recommendations
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function getAiAnalysis(vehicle, evaluation) {
  const errors = [];

  if ((AI_PROVIDER === "auto" || AI_PROVIDER === "openai") && process.env.OPENAI_API_KEY) {
    try {
      const ai = await askOpenAi(vehicle, evaluation);
      if (ai) return { ai: addOctaneRecommendation(ai, evaluation), aiError: null };
    } catch (error) {
      errors.push(error.message);
      if (AI_PROVIDER === "openai") {
        return { ai: null, aiError: errors.join(" | ") };
      }
    }
  }

  if (AI_PROVIDER === "auto" || AI_PROVIDER === "ollama") {
    try {
      const ai = await askOllama(vehicle, evaluation);
      if (ai) return { ai: addOctaneRecommendation(ai, evaluation), aiError: null };
    } catch (error) {
      errors.push(error.message);
    }
  }

  return {
    ai: null,
    aiError: errors.length ? errors.join(" | ") : null
  };
}

async function handleApi(req, res) {
  try {
    if (req.method === "GET" && req.url === "/api/vehicles") {
      const catalog = await getVehicleCatalog();
      sendJson(res, 200, { count: catalog.length, vehicles: catalog });
      return;
    }

    if (req.method === "POST" && req.url === "/api/analyze") {
      const body = await readJson(req);
      const vehicle = {
        make: normalizeText(body.make),
        model: normalizeText(body.model),
        year: normalizeText(body.year),
        trim: normalizeText(body.trim),
        mileage: toNumber(body.mileage),
        engine: normalizeText(body.engine),
        fuelType: normalizeText(body.fuelType),
        transmission: normalizeText(body.transmission),
        bodyClass: normalizeText(body.bodyClass),
        weeklyFuelLiters: toNumber(body.weeklyFuelLiters),
        maintenanceHistory: maintenanceHistory(body),
        notes: normalizeText(body.notes)
      };

      const evaluation = evaluateMaintenance(vehicle);
      const { ai, aiError } = await getAiAnalysis(vehicle, evaluation);

      sendJson(res, 200, {
        vehicle,
        evaluation,
        ai: addOctaneRecommendation(ai || fallbackAiAnalysis(vehicle, evaluation), evaluation),
        aiError
      });
      return;
    }

    sendJson(res, 404, { error: "Endpoint no encontrado." });
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message || "Error interno." });
  }
}

async function serveStatic(req, res) {
  const rawPath = decodeURIComponent(req.url.split("?")[0]);
  const filePath = rawPath === "/" ? "/index.html" : rawPath;
  const safePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, "");
  const fullPath = path.join(PUBLIC_DIR, safePath);

  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(fullPath);
    const ext = path.extname(fullPath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(file);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Archivo no encontrado");
  }
}

function createServer() {
  return http.createServer((req, res) => {
    if (req.url.startsWith("/api/")) {
      handleApi(req, res);
      return;
    }
    serveStatic(req, res);
  });
}

function listen(port, attempts = 0) {
  const server = createServer();
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attempts < 10) {
      listen(port + 1, attempts + 1);
      return;
    }

    throw error;
  });

  server.listen(port, HOST, () => {
    console.log(`Sistema listo en http://${HOST}:${port}`);
  });
}

listen(PORT);
