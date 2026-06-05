import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Car,
  CheckCircle2,
  ClipboardList,
  Fuel,
  Gauge,
  History,
  Download,
  RotateCcw,
  Sparkles,
  Wrench
} from "lucide-react";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Field } from "./components/ui/field";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import "./styles.css";

const initialForm = {
  make: "",
  model: "",
  year: "",
  mileage: "",
  trim: "",
  engine: "",
  fuelType: "",
  transmission: "",
  bodyClass: "",
  weeklyFuelLiters: "",
  lastOilKm: "",
  lastOilFilterKm: "",
  lastAirFilterKm: "",
  lastCabinFilterKm: "",
  lastBrakesKm: "",
  lastTiresKm: "",
  lastSparkPlugsKm: "",
  lastCoolantKm: "",
  lastTransmissionKm: "",
  lastTimingKm: "",
  notes: ""
};

const steps = [
  { title: "Vehículo", icon: Car, description: "Modelo y ficha base" },
  { title: "Uso", icon: Gauge, description: "Kilometraje y combustible" },
  { title: "Historial", icon: History, description: "Servicios opcionales" },
  { title: "Diagnóstico", icon: Bot, description: "IA y plan sugerido" }
];

const historyFields = [
  ["lastOilKm", "Cambio de aceite", "Ej. 78000"],
  ["lastOilFilterKm", "Filtro de aceite", "Ej. 78000"],
  ["lastAirFilterKm", "Filtro de aire", "Ej. 70000"],
  ["lastCabinFilterKm", "Filtro de cabina", "Ej. 70000"],
  ["lastBrakesKm", "Revisión de frenos", "Ej. 76000"],
  ["lastTiresKm", "Rotación de llantas", "Ej. 76000"],
  ["lastSparkPlugsKm", "Bujías", "Ej. 45000"],
  ["lastCoolantKm", "Refrigerante", "Ej. 50000"],
  ["lastTransmissionKm", "Aceite transmisión", "Ej. 60000"],
  ["lastTimingKm", "Distribución", "Ej. 90000"]
];

function formatKm(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `${number.toLocaleString("es-BO")} km`;
}

function selectClass() {
  return "h-11 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-50 outline-none transition focus:border-yellow-300/80 focus:ring-2 focus:ring-yellow-300/20";
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No se pudo completar la solicitud.");
  return data;
}

function Stepper({ current, setCurrent }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const active = current === index;
        const done = current > index;
        return (
          <button
            key={step.title}
            type="button"
            onClick={() => setCurrent(index)}
            className={[
              "group rounded-md border p-4 text-left transition bg-red",
              active ? "border-yellow-300/70 bg-yellow-300/10" : "border-zinc-800 bg-zinc-950 hover:border-yellow-300/30",
              done ? "border-emerald-300/30" : ""
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 text-yellow-300">
                {done ? <CheckCircle2 size={18} /> : <Icon size={18} />}
              </span>
              <span className="text-xs font-black text-zinc-600">0{index + 1}</span>
            </div>
            <strong className="mt-3 block text-zinc-50">{step.title}</strong>
            <small className="text-zinc-500">{step.description}</small>
          </button>
        );
      })}
    </div>
  );
}

function VehicleStep({ form, setValue, catalog, applyVehicle }) {
  return (
    <div className="grid gap-5">
      <Field label="Catálogo latinoamericano">
        <select className={selectClass()} value="" onChange={(event) => applyVehicle(event.target.value)}>
          <option value="">Selecciona un vehículo</option>
          {catalog.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Marca">
          <Input value={form.make} onChange={(event) => setValue("make", event.target.value)} required placeholder="Toyota" />
        </Field>
        <Field label="Modelo">
          <Input value={form.model} onChange={(event) => setValue("model", event.target.value)} required placeholder="Corolla" />
        </Field>
        <Field label="Año">
          <Input value={form.year} onChange={(event) => setValue("year", event.target.value)} required inputMode="numeric" placeholder="2018" />
        </Field>
        <Field label="Versión">
          <Input value={form.trim} onChange={(event) => setValue("trim", event.target.value)} placeholder="XEI, Sport, Limited..." />
        </Field>
      </div>
    </div>
  );
}

function UsageStep({ form, setValue }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Kilometraje actual">
        <Input value={form.mileage} onChange={(event) => setValue("mileage", event.target.value)} required inputMode="numeric" placeholder="85000" />
      </Field>
      <Field label="Gasolina semanal">
        <Input value={form.weeklyFuelLiters} onChange={(event) => setValue("weeklyFuelLiters", event.target.value)} inputMode="decimal" placeholder="Ej. 35 litros" />
      </Field>
      <Field label="Motor">
        <Input value={form.engine} onChange={(event) => setValue("engine", event.target.value)} placeholder="1.8L, 2.0 Diesel..." />
      </Field>
      <Field label="Combustible">
        <select className={selectClass()} value={form.fuelType} onChange={(event) => setValue("fuelType", event.target.value)}>
          <option value="">Detectar</option>
          <option>Gasolina</option>
          <option>Diesel</option>
          <option>Hibrido</option>
          <option>Electrico</option>
        </select>
      </Field>
      <Field label="Transmisión">
        <Input value={form.transmission} onChange={(event) => setValue("transmission", event.target.value)} placeholder="Manual, AT, CVT" />
      </Field>
      <Field label="Observaciones" className="md:col-span-2">
        <Textarea value={form.notes} onChange={(event) => setValue("notes", event.target.value)} placeholder="Ruidos, humo, uso urbano, viajes largos, último servicio..." />
      </Field>
    </div>
  );
}

function HistoryStep({ form, setValue }) {
  return (
    <div className="grid gap-5">
      <div className="rounded-md border border-yellow-300/20 bg-yellow-300/10 p-4">
        <p className="text-sm text-zinc-300">
          Ingresa el kilometraje en que hiciste cada servicio. Si no lo sabes, déjalo vacío y el sistema estimará por kilometraje total.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {historyFields.map(([key, label, placeholder]) => (
          <Field key={key} label={label}>
            <Input value={form[key]} onChange={(event) => setValue(key, event.target.value)} inputMode="numeric" placeholder={placeholder} />
          </Field>
        ))}
      </div>
    </div>
  );
}

function ResultPanel({ result }) {
  const ai = result?.ai;
  const evaluation = result?.evaluation;
  const octane = evaluation?.octaneBooster;

  return (
    <Card className="sticky top-24 border-yellow-300/25">
      <CardHeader>
        <div>
          <p className="eyebrow">Resultado</p>
          <CardTitle>{ai?.title || "Completa los pasos"}</CardTitle>
        </div>
        <Badge>{ai?.mode === "ollama" ? "IA Ollama" : ai?.mode === "openai" ? "IA OpenAI" : ai ? "IA demo" : "Pendiente"}</Badge>
      </CardHeader>
      <CardContent className="grid gap-5">
        <p className="text-sm text-zinc-400">
          {ai?.summary || "Al finalizar, el sistema evaluará kilometraje, historial, combustible, AIS y reglas preventivas."}
        </p>

        <div className="grid grid-cols-3 gap-2">
          <Metric label="Urgentes" value={evaluation?.urgentCount ?? 0} />
          <Metric label="Próximos" value={evaluation?.soonCount ?? 0} />
          <Metric label="Motor" value={evaluation?.fuel || "-"} />
        </div>

        <div className="rounded-md border border-yellow-300/20 bg-yellow-300/10 p-4">
          <strong className="text-sm text-zinc-50">Explicación IA</strong>
          <p className="mt-2 text-sm text-zinc-400">
            {ai ? [ai.explanation, ...(ai.recommendations || [])].join(" ") : "Aquí aparecerá el razonamiento del diagnóstico."}
          </p>
        </div>

        <div className="rounded-md border border-yellow-300/25 bg-zinc-950 p-4">
          <div className="flex items-start justify-between gap-3">
            <strong className="text-sm text-zinc-50">Elevador de octanaje AIS</strong>
            <Badge tone={octane?.urgency}>{octane?.status || "Pendiente"}</Badge>
          </div>
          <p className="mt-2 text-sm text-zinc-400">{octane?.reason || "Genera un diagnóstico para calcular el kilometraje recomendado."}</p>
          {octane?.nextDue ? <p className="mt-2 text-sm font-semibold text-yellow-200">Kilometraje sugerido: {formatKm(octane.nextDue)}</p> : null}
        </div>

        {result ? (
          <Button type="button" onClick={() => exportPdfReport(result)} className="w-full">
            <Download size={16} /> Exportar reporte PDF
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
      <span className="block truncate text-lg font-black text-yellow-300">{value}</span>
      <small className="font-semibold text-zinc-500">{label}</small>
    </div>
  );
}

function escapeReport(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function exportPdfReport(result) {
  if (!result) return;

  const { vehicle, evaluation, ai } = result;
  const octane = evaluation.octaneBooster;
  const tasksHtml = evaluation.tasks
    .map(
      (task) => `
        <tr>
          <td>${escapeReport(task.item)}</td>
          <td>${escapeReport(task.urgency)}</td>
          <td>${escapeReport(task.reason)}</td>
          <td>${escapeReport(formatKm(task.nextDue))}</td>
        </tr>
      `
    )
    .join("");
  const recommendations = (ai.recommendations || [])
    .map((item) => `<li>${escapeReport(item)}</li>`)
    .join("");

  const reportWindow = window.open("", "_blank", "width=980,height=720");
  if (!reportWindow) return;

  reportWindow.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Reporte AutoCheck IA</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 32px; color: #111; font-family: Inter, Arial, sans-serif; line-height: 1.45; }
          .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 4px solid #facc15; padding-bottom: 18px; }
          .brand { font-size: 28px; font-weight: 900; }
          .badge { display: inline-block; border-radius: 999px; background: #facc15; padding: 6px 10px; font-weight: 800; }
          h1 { margin: 24px 0 6px; font-size: 26px; }
          h2 { margin: 24px 0 10px; font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
          p { margin: 8px 0; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 24px; margin-top: 16px; }
          .item { border-bottom: 1px solid #eee; padding: 8px 0; }
          .item strong { display: block; color: #555; font-size: 12px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th, td { border: 1px solid #ddd; padding: 9px; text-align: left; vertical-align: top; }
          th { background: #111; color: #fff; }
          .note { margin-top: 24px; border-left: 4px solid #facc15; background: #fff8cc; padding: 12px; }
          @media print { body { padding: 18mm; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">AutoCheck IA</div>
            <p>Reporte de diagnóstico preventivo vehicular</p>
          </div>
          <div>
            <span class="badge">${escapeReport(ai.mode === "ollama" ? "IA Ollama" : ai.mode === "openai" ? "IA OpenAI" : "IA demo")}</span>
            <p>${escapeReport(new Date().toLocaleString("es-BO"))}</p>
          </div>
        </div>

        <h1>${escapeReport([vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" "))}</h1>
        <p><strong>Estado:</strong> ${escapeReport(evaluation.overallStatus)}</p>

        <h2>Datos del vehículo</h2>
        <div class="grid">
          <div class="item"><strong>Kilometraje</strong>${escapeReport(formatKm(vehicle.mileage))}</div>
          <div class="item"><strong>Combustible</strong>${escapeReport(vehicle.fuelType || evaluation.fuel)}</div>
          <div class="item"><strong>Motor</strong>${escapeReport(vehicle.engine || "-")}</div>
          <div class="item"><strong>Transmisión</strong>${escapeReport(vehicle.transmission || "-")}</div>
          <div class="item"><strong>Gasolina semanal</strong>${escapeReport(vehicle.weeklyFuelLiters ? `${vehicle.weeklyFuelLiters} litros` : "-")}</div>
          <div class="item"><strong>Urgentes / próximos</strong>${escapeReport(`${evaluation.urgentCount} / ${evaluation.soonCount}`)}</div>
        </div>

        <h2>Resumen IA</h2>
        <p>${escapeReport(ai.summary)}</p>
        <p>${escapeReport(ai.explanation)}</p>

        <h2>Elevador de octanaje AIS</h2>
        <p><strong>${escapeReport(octane.status)}:</strong> ${escapeReport(octane.reason)}</p>
        <p>${escapeReport(octane.detail)}</p>

        <h2>Plan de mantenimiento</h2>
        <table>
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Urgencia</th>
              <th>Motivo</th>
              <th>Próximo punto</th>
            </tr>
          </thead>
          <tbody>${tasksHtml}</tbody>
        </table>

        <h2>Recomendaciones</h2>
        <ul>${recommendations}</ul>

        <div class="note">
          Este reporte es orientativo. Confirmar siempre con el manual del fabricante o con un mecánico certificado.
        </div>

        <button class="no-print" onclick="window.print()" style="margin-top: 24px; padding: 10px 16px; border: 0; border-radius: 8px; background: #facc15; font-weight: 800;">
          Guardar o imprimir PDF
        </button>
      </body>
    </html>
  `);
  reportWindow.document.close();
  reportWindow.focus();
  setTimeout(() => reportWindow.print(), 300);
}

function DiagnosticStep({ result }) {
  const vehicle = result?.vehicle;
  const tasks = result?.evaluation?.tasks || [];

  if (!result) {
    return (
      <div className="rounded-md border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
        Presiona “Analizar mantenimiento” para generar el diagnóstico con IA.
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <p className="eyebrow">Ficha técnica</p>
              <CardTitle>Datos recuperados</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              {[
                ["Marca", vehicle.make],
                ["Modelo", vehicle.model],
                ["Año", vehicle.year],
                ["Versión", vehicle.trim],
                ["Motor", vehicle.engine],
                ["Combustible", vehicle.fuelType],
                ["Transmisión", vehicle.transmission],
                ["Gasolina semanal", vehicle.weeklyFuelLiters ? `${vehicle.weeklyFuelLiters} litros` : ""]
              ]
                .filter(([, value]) => value)
                .map(([term, value]) => (
                  <div key={term} className="grid grid-cols-[140px_1fr] gap-3 border-b border-zinc-800 pb-2">
                    <dt className="text-zinc-500">{term}</dt>
                    <dd className="font-semibold text-zinc-100">{value}</dd>
                  </div>
                ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <p className="eyebrow">Plan sugerido</p>
              <CardTitle>Mantenimiento</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {tasks.map((task) => (
              <article key={task.id} className="rounded-md border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-zinc-50">{task.item}</h3>
                  <Badge tone={task.urgency}>{task.urgency}</Badge>
                </div>
                <p className="mt-2 text-sm text-zinc-400">{task.reason}</p>
                {task.lastServiceKm !== null && task.lastServiceKm !== undefined ? (
                  <p className="mt-2 text-sm text-zinc-300">Último registro: {formatKm(task.lastServiceKm)}</p>
                ) : null}
                <p className="mt-2 text-sm font-semibold text-yellow-200">Próximo punto: {formatKm(task.nextDue)}</p>
              </article>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HistoryList({ items }) {
  return (
    <Card className="mt-5">
      <CardHeader>
        <div>
          <p className="eyebrow">Registro local</p>
          <CardTitle>Últimos diagnósticos</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {items.length ? (
          items.map((item, index) => (
            <article key={`${item.vehicleName}-${item.date}-${index}`} className="rounded-md border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-zinc-50">{item.vehicleName}</h3>
                <Badge tone={item.priority}>{item.priority}</Badge>
              </div>
              <p className="mt-2 text-sm text-zinc-500">
                {item.status} · {formatKm(item.mileage)} · {item.date}
              </p>
            </article>
          ))
        ) : (
          <p className="text-sm text-zinc-500">Los análisis realizados se guardan en este navegador.</p>
        )}
      </CardContent>
    </Card>
  );
}

function App() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [catalog, setCatalog] = useState([]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((response) => response.json())
      .then((data) => setCatalog(data.vehicles || []))
      .catch(() => setCatalog([]));
    setHistory(JSON.parse(localStorage.getItem("diagnosticos") || "[]"));
  }, []);

  const selectedName = useMemo(() => [form.year, form.make, form.model].filter(Boolean).join(" ") || "AutoCheck IA", [form]);

  function setValue(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyVehicle(id) {
    const vehicle = catalog.find((item) => item.id === id);
    if (!vehicle) return;
    setForm((current) => ({
      ...current,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      trim: vehicle.trim,
      engine: vehicle.engine,
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
      bodyClass: vehicle.bodyClass
    }));
    setMessage("Vehículo cargado desde catálogo.");
  }

  function loadSample() {
    setForm({
      ...initialForm,
      make: "Toyota",
      model: "Corolla",
      year: "2018",
      mileage: "86500",
      trim: "1.8 XEI",
      engine: "1.8L gasolina",
      fuelType: "Gasolina",
      transmission: "CVT",
      weeklyFuelLiters: "35",
      lastOilKm: "78000",
      lastOilFilterKm: "78000",
      lastAirFilterKm: "72000",
      lastCabinFilterKm: "72000",
      lastBrakesKm: "76000",
      lastTiresKm: "76000",
      lastSparkPlugsKm: "45000",
      lastCoolantKm: "50000",
      lastTransmissionKm: "60000",
      notes: "Uso urbano diario."
    });
    setMessage("Ejemplo cargado.");
  }

  async function analyze() {
    setLoading(true);
    setMessage("Analizando mantenimiento con IA...");
    try {
      const data = await postJson("/api/analyze", form);
      setResult(data);
      setStep(3);
      const vehicleName = [data.vehicle.year, data.vehicle.make, data.vehicle.model].filter(Boolean).join(" ") || "Vehículo";
      const nextHistory = [
        {
          vehicleName,
          mileage: data.vehicle.mileage,
          status: data.evaluation.overallStatus,
          priority: data.ai.priority,
          date: new Date().toLocaleString("es-BO")
        },
        ...history
      ].slice(0, 5);
      setHistory(nextHistory);
      localStorage.setItem("diagnosticos", JSON.stringify(nextHistory));
      setMessage(data.aiError ? "Análisis generado con fallback local." : "Análisis generado correctamente.");
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  const canAdvance = step === 0 ? form.make && form.model && form.year : step === 1 ? form.mileage : true;

  return (
    <div className="min-h-screen bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(180deg,#0d0d0d,#070707)] bg-[length:44px_44px,44px_44px,auto] text-zinc-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <a className="flex items-center gap-3 font-black text-zinc-50" href="/">
            AutoCheck
          </a>
          <nav className="flex flex-wrap gap-2 text-sm text-zinc-400">
            <a className="rounded-md px-3 py-2 hover:bg-zinc-900 hover:text-zinc-50" href="#diagnostico">Diagnóstico</a>
            <a className="rounded-md px-3 py-2 hover:bg-zinc-900 hover:text-zinc-50" href="#resultado">Resultado</a>
            <a className="rounded-md px-3 py-2 hover:bg-zinc-900 hover:text-zinc-50" href="#historial">Historial</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-12">
        <section id="diagnostico" className="grid min-h-[330px] gap-6 py-10 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <h1 className="max-w-4xl text-5xl font-black leading-none tracking-tight text-white md:text-7xl">
              Diagnóstico inteligente de mantenimiento vehicular
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-zinc-400">
              Un flujo por pasos para convertir kilometraje, uso semanal e historial real en un plan de mantenimiento asistido por IA.
            </p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <Card>
            <CardHeader>
              <div>
                <p className="eyebrow">Consulta guiada</p>
                <CardTitle>{steps[step].title}</CardTitle>
              </div>
              <Button variant="outline" type="button" onClick={loadSample}>
                <RotateCcw size={16} /> Ejemplo
              </Button>
            </CardHeader>
            <CardContent className="grid gap-6">
              <Stepper current={step} setCurrent={setStep} />

              <div className="rounded-md border border-zinc-800 bg-zinc-950/70 p-5">
                {step === 0 ? <VehicleStep form={form} setValue={setValue} catalog={catalog} applyVehicle={applyVehicle} /> : null}
                {step === 1 ? <UsageStep form={form} setValue={setValue} /> : null}
                {step === 2 ? <HistoryStep form={form} setValue={setValue} /> : null}
                {step === 3 ? <DiagnosticStep result={result} /> : null}
              </div>

              <div className="flex flex-col gap-3 border-t border-zinc-800 pt-5 md:flex-row md:items-center md:justify-between">
                <p className="min-h-6 text-sm text-zinc-500">{message || selectedName}</p>
                <div className="flex gap-2">
                  <Button variant="outline" type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>
                    <ArrowLeft size={16} /> Atrás
                  </Button>
                  {step < 2 ? (
                    <Button type="button" disabled={!canAdvance} onClick={() => setStep((value) => Math.min(3, value + 1))}>
                      Siguiente <ArrowRight size={16} />
                    </Button>
                  ) : (
                    <Button type="button" disabled={loading || !form.make || !form.model || !form.year || !form.mileage} onClick={analyze}>
                      {loading ? "Analizando..." : "Analizar mantenimiento"} <Wrench size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div id="resultado">
            <ResultPanel result={result} />
          </div>
        </section>

        <section id="historial">
          <HistoryList items={history} />
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
