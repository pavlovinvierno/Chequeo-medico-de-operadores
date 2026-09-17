const form = document.getElementById("checkupForm");
const history = document.getElementById("history");
const historyList = document.getElementById("historyList");
const toast = document.getElementById("toast");
const status = document.getElementById("status");

const STORAGE_KEY = "chequeo_operadores_registros_v3";
const LEGACY_STORAGE_KEY = "chequeo_operadores_registros_v2";
// URL de la implementación Web App de Google Apps Script.
const API_URL = "https://script.google.com/macros/s/AKfycbwiLcBQem7JPmlumKX8KHt1ba7z92z1t8rGyJtaULsJIozK-JCxYQ5fI_Fe9h0nmnSn7Q/exec";

function pad(n){return String(n).padStart(2,"0")}
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"),3000);
}
function setCurrentDateTime(){
  const d = new Date();
  document.getElementById("fecha").value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  document.getElementById("hora").value = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function getRecords(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")}catch(e){return []}
}
function migrateLegacyRecords(){
  try{
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "[]");
    if(!current.length && legacy.length){
      const migrated = legacy.map(r=>({
        ...r,
        id_registro: r.id_registro || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
        sync_status: r.sync_status === "sincronizado" ? "sincronizado" : "pendiente"
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated.length;
    }
  }catch(e){}
  return 0;
}
function saveRecords(records){localStorage.setItem(STORAGE_KEY, JSON.stringify(records));}

function setNA(id, isNA){
  const input = document.getElementById(id);
  if(!input) return;
  input.disabled = isNA;
  if(isNA) input.value = "";
  const wrapper = input.closest(".measurement");
  if(wrapper) wrapper.classList.toggle("na", isNA);
}
document.querySelectorAll("[data-na-for]").forEach(cb=>{
  cb.addEventListener("change", e=>setNA(e.target.dataset.naFor, e.target.checked));
});
function getMeasurement(id){
  const cb = document.querySelector(`[data-na-for="${id}"]`);
  const input = document.getElementById(id);
  if(cb && cb.checked) return "No aplica";
  return input ? input.value : "";
}
function formData(){
  const fd = new FormData(form);
  return {
    fecha: fd.get("fecha"), hora: fd.get("hora"), empleado: fd.get("empleado"), nombre: fd.get("nombre"),
    dm: fd.get("dm"), hta: fd.get("hta"), antidoping: fd.get("antidoping"), alcoholimetro: fd.get("alcoholimetro"),
    destino: fd.get("destino"), tension_arterial: getMeasurement("ta"), temperatura: getMeasurement("temperatura"),
    glucosa: getMeasurement("glucosa"), peso: getMeasurement("peso"), fc: getMeasurement("fc"), spo2: getMeasurement("spo2"),
    apto: fd.get("apto"), motivo: fd.get("motivo"), observacion: fd.get("observacion"), atendio: fd.get("atendio"),
    creado: new Date().toISOString()
  };
}
function validateMedicalValues(data){
  const checks = [["temperatura",30,45,"Temperatura"],["glucosa",20,600,"Glucosa"],["peso",20,300,"Peso"],["fc",20,250,"Frecuencia cardiaca"],["spo2",0,100,"SpO₂"]];
  for(const [key,min,max,label] of checks){
    if(data[key] !== "No aplica" && data[key] !== ""){
      const n=Number(data[key]);
      if(Number.isNaN(n) || n<min || n>max) return `${label} fuera del rango permitido.`;
    }
  }
  if(!["Positivo","Negativo","No aplica"].includes(data.alcoholimetro)) return "Selecciona un resultado para alcoholímetro.";
  return "";
}

/*
 * Google Apps Script no devuelve encabezados CORS para una respuesta fetch
 * normal desde GitHub Pages. El POST se envía como text/plain y en modo
 * no-cors, que evita el preflight. El navegador no permite leer la respuesta,
 * por lo que la confirmación se maneja como "enviado"; el backend usa el ID
 * único para evitar duplicados si el registro se reintenta.
 */
async function sendToGoogleSheets(data){
  if(!API_URL) return {sent:false};
  await fetch(API_URL,{
    method:"POST",
    mode:"no-cors",
    headers:{"Content-Type":"text/plain;charset=utf-8"},
    body:JSON.stringify(data),
    keepalive:true
  });
  return {sent:true,id_registro:data.id_registro,unconfirmed:true};
}

async function syncOneRecord(record){
  const result = await sendToGoogleSheets(record);
  if(result.sent){
    record.sync_status = "enviado";
    record.sync_note = "Solicitud enviada a Google Apps Script; el navegador no permite leer la confirmación por CORS.";
    record.last_sync_attempt = new Date().toISOString();
    return true;
  }
  return false;
}

form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  if(!form.checkValidity()){form.reportValidity();return;}
  const data=formData();
  const validation=validateMedicalValues(data);
  if(validation){showToast(validation);return;}

  data.id_registro = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  data.sync_status = API_URL ? "pendiente" : "local";
  const records=getRecords();
  records.unshift(data);
  saveRecords(records);

  try{
    const result=await sendToGoogleSheets(data);
    if(result.sent){
      data.sync_status = "enviado";
      data.sync_note = "Solicitud enviada a Google Apps Script; el navegador no permite leer la confirmación por CORS.";
      data.last_sync_attempt = new Date().toISOString();
      const updated=getRecords();
      const pos=updated.findIndex(r=>r.id_registro===data.id_registro);
      if(pos>=0){updated[pos]=data;saveRecords(updated);}
      status.textContent="Registro enviado a Google Sheets";
      showToast("Registro guardado y enviado a Google Sheets");
    }
  }catch(err){
    const updated=getRecords();
    const pos=updated.findIndex(r=>r.id_registro===data.id_registro);
    if(pos>=0){updated[pos].sync_status="pendiente";saveRecords(updated);}
    status.textContent="Registro guardado localmente; pendiente de envío";
    showToast("Guardado localmente; pendiente de sincronización");
  }

  form.reset();
  document.querySelectorAll("[data-na-for]").forEach(cb=>setNA(cb.dataset.naFor,false));
  setCurrentDateTime();
  window.scrollTo({top:0,behavior:"smooth"});
});

async function syncPending(){
  if(!API_URL){showToast("Primero configura la URL de Google Apps Script");return;}
  const records=getRecords();
  let sent=0;
  for(const r of records){
    // Los registros pendientes se reintentan. Los ya enviados no se repiten
    // salvo que el usuario los deje nuevamente como pendientes.
    if(r.sync_status!=="pendiente" && r.sync_status!=="local") continue;
    try{ if(await syncOneRecord(r)) sent++; }catch(_){}
  }
  saveRecords(records);
  status.textContent = sent ? `${sent} registro(s) enviado(s) a Google Sheets` : "No había registros pendientes de envío";
  showToast(sent ? `${sent} registro(s) enviado(s)` : "Sin registros pendientes");
}

function formatDate(date){if(!date) return ""; const [y,m,d]=date.split("-"); return `${d}/${m}/${y}`;}
function groupByDate(records){return records.reduce((groups,r)=>{const key=r.fecha || "Sin fecha";(groups[key] ||= []).push(r);return groups;},{});}
function renderHistory(){
  const groups=groupByDate(getRecords());
  const dates=Object.keys(groups).sort((a,b)=>b.localeCompare(a));
  if(!dates.length){historyList.innerHTML="<p>No hay registros guardados en este dispositivo.</p>";return;}
  historyList.innerHTML=dates.map(date=>{
    const rows=groups[date];
    return `<div class="day-group">
      <div class="day-head"><span class="day-title">${escapeHtml(date==="Sin fecha" ? date : formatDate(date))}</span><span class="day-count">${rows.length} ${rows.length===1?"chequeo":"chequeos"}</span></div>
      <div>${rows.slice(0,5).map(r=>`<div class="record"><strong>${escapeHtml(r.nombre || "Sin nombre")}</strong><small>Empleado: ${escapeHtml(r.empleado)} · ${escapeHtml(r.hora)}</small><br><small>Antidoping: ${escapeHtml(r.antidoping)} · Alcoholímetro: ${escapeHtml(r.alcoholimetro)} · Aptitud: ${escapeHtml(r.apto)} · Estado: ${escapeHtml(r.sync_status || "local")}</small></div>`).join("")}
      ${rows.length>5 ? `<small>Se muestran los primeros 5. El archivo del día incluye todos.</small>` : ""}</div>
      <button class="day-export" type="button" data-export-date="${escapeHtml(date)}">EXPORTAR DÍA (${rows.length})</button>
    </div>`;
  }).join("");
  document.querySelectorAll("[data-export-date]").forEach(btn=>btn.addEventListener("click",()=>exportCSV(groups[btn.dataset.exportDate],`registros_${btn.dataset.exportDate}.csv`)));
}
function escapeHtml(value){return String(value ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function exportCSV(records, filename){
  if(!records || !records.length){showToast("No hay registros para exportar");return;}
  const cols=[["fecha","Fecha"],["hora","Hora"],["empleado","# Empleado"],["nombre","Nombre"],["dm","DM"],["hta","HTA"],["antidoping","Antidoping"],["alcoholimetro","Alcoholímetro"],["destino","Destino"],["tension_arterial","Tensión arterial"],["temperatura","Temp. corporal"],["glucosa","Glucosa"],["peso","Peso (kg)"],["fc","FC"],["spo2","SpO₂"],["apto","Apto (Sí/No)"],["motivo","Motivo"],["observacion","Observación"],["atendio","Atendió"]];
  const header=cols.map(c=>`"${c[1]}"`).join(",");
  const rows=records.map(r=>cols.map(c=>`"${String(r[c[0]]??"").replace(/"/g,'""')}"`).join(","));
  const blob=new Blob(["\ufeff"+header+"\n"+rows.join("\n")],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);showToast(`Exportados ${records.length} registros`);
}

document.getElementById("historyBtn").addEventListener("click",()=>{renderHistory();history.classList.remove("hidden");history.scrollIntoView({behavior:"smooth"});});
document.getElementById("closeHistory").addEventListener("click",()=>history.classList.add("hidden"));
document.getElementById("newBtn").addEventListener("click",()=>{form.reset();document.querySelectorAll("[data-na-for]").forEach(cb=>setNA(cb.dataset.naFor,false));setCurrentDateTime();window.scrollTo({top:0,behavior:"smooth"});showToast("Nuevo registro");});
document.getElementById("exportAllBtn").addEventListener("click",()=>exportCSV(getRecords(),"registros_chequeo_operadores_todos.csv"));
document.getElementById("syncBtn").addEventListener("click", syncPending);

const migratedCount = migrateLegacyRecords();
setCurrentDateTime();
if(API_URL && !migratedCount) status.textContent = "Google Sheets configurado; registros guardados localmente y enviados cuando hay conexión";
if(migratedCount) status.textContent = `${migratedCount} registro(s) anteriores recuperados; pendientes de envío`;

if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{});}
