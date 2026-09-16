const form = document.getElementById("checkupForm");
const history = document.getElementById("history");
const historyList = document.getElementById("historyList");
const toast = document.getElementById("toast");
const status = document.getElementById("status");

const STORAGE_KEY = "chequeo_operadores_registros_v1";
const API_URL = ""; // En una siguiente etapa se colocará aquí la URL de Google Apps Script.

function pad(n){return String(n).padStart(2,"0")}
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"),2600);
}
function setCurrentDateTime(){
  const d = new Date();
  document.getElementById("fecha").value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  document.getElementById("hora").value = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function getRecords(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")}catch(e){return []}
}
function saveRecords(records){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}
function formData(){
  const fd = new FormData(form);
  return {
    fecha: fd.get("fecha"),
    hora: fd.get("hora"),
    empleado: fd.get("empleado"),
    nombre: fd.get("nombre"),
    dm: fd.get("dm"),
    hta: fd.get("hta"),
    antidoping: fd.get("antidoping"),
    alcoholimetro: fd.get("alcoholimetro"),
    destino: fd.get("destino"),
    tension_arterial: fd.get("ta"),
    temperatura: fd.get("temperatura"),
    glucosa: fd.get("glucosa"),
    peso: fd.get("peso"),
    fc: fd.get("fc"),
    spo2: fd.get("spo2"),
    apto: fd.get("apto"),
    motivo: fd.get("motivo"),
    observacion: fd.get("observacion"),
    atendio: fd.get("atendio"),
    creado: new Date().toISOString()
  };
}
function validateMedicalValues(data){
  if(data.temperatura !== "" && (Number(data.temperatura)<30 || Number(data.temperatura)>45)) return "Temperatura fuera del rango permitido.";
  if(data.glucosa !== "" && (Number(data.glucosa)<20 || Number(data.glucosa)>600)) return "Glucosa fuera del rango permitido.";
  if(data.peso !== "" && (Number(data.peso)<20 || Number(data.peso)>300)) return "Peso fuera del rango permitido.";
  if(data.fc !== "" && (Number(data.fc)<20 || Number(data.fc)>250)) return "Frecuencia cardiaca fuera del rango permitido.";
  if(data.spo2 !== "" && (Number(data.spo2)<0 || Number(data.spo2)>100)) return "SpO₂ fuera del rango permitido.";
  if(data.alcoholimetro !== "" && Number(data.alcoholimetro)<0) return "El alcoholímetro no puede ser negativo.";
  return "";
}
async function sendToGoogleSheets(data){
  if(!API_URL) return false;
  const response = await fetch(API_URL,{
    method:"POST",
    headers:{"Content-Type":"text/plain;charset=utf-8"},
    body:JSON.stringify(data)
  });
  if(!response.ok) throw new Error("No se pudo enviar a Google Sheets");
  return true;
}
form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  if(!form.checkValidity()){
    form.reportValidity();
    return;
  }
  const data = formData();
  const validation = validateMedicalValues(data);
  if(validation){showToast(validation);return;}

  const records = getRecords();
  records.unshift(data);
  saveRecords(records);

  try{
    const synced = await sendToGoogleSheets(data);
    status.textContent = synced ? "Registro guardado y enviado a Google Sheets" : "Registro guardado en el dispositivo";
  }catch(err){
    status.textContent = "Guardado local; pendiente de sincronización";
  }

  showToast("Registro guardado correctamente");
  form.reset();
  setCurrentDateTime();
  window.scrollTo({top:0,behavior:"smooth"});
});

function renderHistory(){
  const records = getRecords();
  if(!records.length){
    historyList.innerHTML = "<p>No hay registros guardados en este dispositivo.</p>";
    return;
  }
  historyList.innerHTML = records.map((r,i)=>`
    <div class="record">
      <strong>${escapeHtml(r.nombre || "Sin nombre")}</strong>
      <small>Empleado: ${escapeHtml(r.empleado)} · ${escapeHtml(r.fecha)} ${escapeHtml(r.hora)}</small><br>
      <small>Antidoping: ${escapeHtml(r.antidoping)} · Aptitud: ${escapeHtml(r.apto)} · Atendió: ${escapeHtml(r.atendio)}</small>
    </div>`).join("");
}
function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
document.getElementById("historyBtn").addEventListener("click",()=>{
  renderHistory(); history.classList.remove("hidden"); history.scrollIntoView({behavior:"smooth"});
});
document.getElementById("closeHistory").addEventListener("click",()=>history.classList.add("hidden"));
document.getElementById("newBtn").addEventListener("click",()=>{
  form.reset(); setCurrentDateTime(); window.scrollTo({top:0,behavior:"smooth"}); showToast("Nuevo registro");
});
document.getElementById("exportBtn").addEventListener("click",()=>{
  const records = getRecords();
  if(!records.length){showToast("No hay registros para exportar");return;}
  const cols = ["fecha","hora","empleado","nombre","dm","hta","antidoping","alcoholimetro","destino","tension_arterial","temperatura","glucosa","peso","fc","spo2","apto","motivo","observacion","atendio"];
  const header = cols.join(",");
  const rows = records.map(r=>cols.map(k=>`"${String(r[k]??"").replace(/"/g,'""')}"`).join(","));
  const blob = new Blob(["\ufeff"+header+"\n"+rows.join("\n")],{type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download="registros_chequeo_operadores.csv"; a.click();
  URL.revokeObjectURL(url);
});
setCurrentDateTime();

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}
