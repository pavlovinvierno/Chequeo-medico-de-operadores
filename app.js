const form = document.getElementById("checkupForm");
const history = document.getElementById("history");
const historyList = document.getElementById("historyList");
const toast = document.getElementById("toast");
const status = document.getElementById("status");

const STORAGE_KEY = "chequeo_operadores_registros_v2";
const API_URL = "https://script.google.com/macros/s/AKfycbw1LcBQem7JPmlumKX8KHt1ba7z92z1t8rGyJtaULsJIozK-JCxYQ5fI_Fe9h0nmnSn7Q/exec"; // Pega aquí la URL /exec de tu Google Apps Script.

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
    fecha: fd.get("fecha"),
    hora: fd.get("hora"),
    empleado: fd.get("empleado"),
    nombre: fd.get("nombre"),
    dm: fd.get("dm"),
    hta: fd.get("hta"),
    antidoping: fd.get("antidoping"),
    alcoholimetro: fd.get("alcoholimetro"),
    destino: fd.get("destino"),
    tension_arterial: getMeasurement("ta"),
    temperatura: getMeasurement("temperatura"),
    glucosa: getMeasurement("glucosa"),
    peso: getMeasurement("peso"),
    fc: getMeasurement("fc"),
    spo2: getMeasurement("spo2"),
    apto: fd.get("apto"),
    motivo: fd.get("motivo"),
    observacion: fd.get("observacion"),
    atendio: fd.get("atendio"),
    creado: new Date().toISOString()
  };
}

function validateMedicalValues(data){
  const checks = [
    ["temperatura",30,45,"Temperatura"],
    ["glucosa",20,600,"Glucosa"],
    ["peso",20,300,"Peso"],
    ["fc",20,250,"Frecuencia cardiaca"],
    ["spo2",0,100,"SpO₂"]
  ];
  for(const [key,min,max,label] of checks){
    if(data[key] !== "No aplica" && data[key] !== ""){
      const n=Number(data[key]);
      if(Number.isNaN(n) || n<min || n>max) return `${label} fuera del rango permitido.`;
    }
  }
  if(data.alcoholimetro !== "Positivo" && data.alcoholimetro !== "Negativo" && data.alcoholimetro !== "No aplica")
    return "Selecciona un resultado para alcoholímetro.";
  return "";
}

async function sendToGoogleSheets(data){
  if(!API_URL) return {sent:false};
  const response = await fetch(API_URL,{
    method:"POST",
    headers:{"Content-Type":"text/plain;charset=utf-8"},
    body:JSON.stringify(data)
  });
  if(!response.ok) throw new Error("No se pudo enviar a Google Sheets");
  const result = await response.json();
  if(!result.ok) throw new Error(result.error || "Google Apps Script rechazó el registro");
  return {sent:true,id_registro:result.id_registro};
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
      data.sync_status = "sincronizado";
      data.google_id = result.id_registro;
      const updated=getRecords();
      const pos=updated.findIndex(r=>r.id_registro===data.id_registro);
      if(pos>=0){updated[pos]=data;saveRecords(updated);}
      status.textContent="Registro guardado y sincronizado con Google Sheets";
    }else{
      status.textContent="Registro guardado en el dispositivo";
    }
  }catch(err){
    status.textContent="Registro guardado localmente; pendiente de sincronización";
  }

  showToast("Registro guardado correctamente");
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
    if(r.sync_status==="sincronizado") continue;
    try{
      const result=await sendToGoogleSheets(r);
      if(result.sent){
        r.sync_status="sincronizado";
        r.google_id=result.id_registro;
        sent++;
      }
    }catch(_){}
  }
  saveRecords(records);
  status.textContent = sent ? `${sent} registro(s) sincronizado(s)` : "No había registros pendientes o no hay conexión";
  showToast(sent ? `${sent} registro(s) sincronizado(s)` : "Sin registros pendientes");
}

function formatDate(date){
  if(!date) return "";
  const [y,m,d]=date.split("-");
  return `${d}/${m}/${y}`;
}
function groupByDate(records){
  return records.reduce((groups,r)=>{
    const key=r.fecha || "Sin fecha";
    (groups[key] ||= []).push(r);
    return groups;
  },{});
}
function renderHistory(){
  const groups=groupByDate(getRecords());
  const dates=Object.keys(groups).sort((a,b)=>b.localeCompare(a));
  if(!dates.length){
    historyList.innerHTML="<p>No hay registros guardados en este dispositivo.</p>";
    return;
  }
  historyList.innerHTML=dates.map(date=>{
    const rows=groups[date];
    const id=`day-${date.replace(/[^0-9]/g,"")}`;
    return `<div class="day-group">
      <div class="day-head">
        <span class="day-title">${escapeHtml(date==="Sin fecha" ? date : formatDate(date))}</span>
        <span class="day-count">${rows.length} ${rows.length===1?"chequeo":"chequeos"}</span>
      </div>
      <div>${rows.slice(0,5).map(r=>`
        <div class="record">
          <strong>${escapeHtml(r.nombre || "Sin nombre")}</strong>
          <small>Empleado: ${escapeHtml(r.empleado)} · ${escapeHtml(r.hora)}</small><br>
          <small>Antidoping: ${escapeHtml(r.antidoping)} · Alcoholímetro: ${escapeHtml(r.alcoholimetro)} · Aptitud: ${escapeHtml(r.apto)}</small>
        </div>`).join("")}
        ${rows.length>5 ? `<small>Se muestran los primeros 5. El archivo del día incluye todos.</small>` : ""}
      </div>
      <button class="day-export" type="button" data-export-date="${escapeHtml(date)}">EXPORTAR DÍA (${rows.length})</button>
    </div>`;
  }).join("");

  document.querySelectorAll("[data-export-date]").forEach(btn=>{
    btn.addEventListener("click",()=>exportCSV(groups[btn.dataset.exportDate], `registros_${btn.dataset.exportDate}.csv`));
  });
}

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

function exportCSV(records, filename){
  if(!records || !records.length){showToast("No hay registros para exportar");return;}
  const cols=[
    ["fecha","Fecha"],["hora","Hora"],["empleado","# Empleado"],["nombre","Nombre"],
    ["dm","DM"],["hta","HTA"],["antidoping","Antidoping"],["alcoholimetro","Alcoholímetro"],
    ["destino","Destino"],["tension_arterial","Tensión arterial"],["temperatura","Temp. corporal"],
    ["glucosa","Glucosa"],["peso","Peso (kg)"],["fc","FC"],["spo2","SpO₂"],
    ["apto","Apto (Sí/No)"],["motivo","Motivo"],["observacion","Observación"],["atendio","Atendió"]
  ];
  const header=cols.map(c=>`"${c[1]}"`).join(",");
  const rows=records.map(r=>cols.map(c=>`"${String(r[c[0]]??"").replace(/"/g,'""')}"`).join(","));
  const blob=new Blob(["\ufeff"+header+"\n"+rows.join("\n")],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=filename;a.click();
  URL.revokeObjectURL(url);
  showToast(`Exportados ${records.length} registros`);
}

document.getElementById("historyBtn").addEventListener("click",()=>{
  renderHistory();
  history.classList.remove("hidden");
  history.scrollIntoView({behavior:"smooth"});
});
document.getElementById("closeHistory").addEventListener("click",()=>history.classList.add("hidden"));
document.getElementById("newBtn").addEventListener("click",()=>{
  form.reset();
  document.querySelectorAll("[data-na-for]").forEach(cb=>setNA(cb.dataset.naFor,false));
  setCurrentDateTime();
  window.scrollTo({top:0,behavior:"smooth"});
  showToast("Nuevo registro");
});
document.getElementById("exportAllBtn").addEventListener("click",()=>{
  exportCSV(getRecords(),"registros_chequeo_operadores_todos.csv");
});

setCurrentDateTime();

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}
