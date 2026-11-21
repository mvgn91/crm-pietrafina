// Port SIEMDES → PF; see PORT-SIEMDES.md.
// csv-model.js — Exportación CSV (RF-21, F2-08E).
//
// Un solo formateador para las dos vistas. BOM UTF-8 para que Excel abra los
// acentos, comillas escapadas y sin dependencias. La descarga toca el DOM; la
// generación pura se prueba con node (scripts/test-segmentos.mjs).

const escapar = (valor) => {
  const texto = String(valor ?? "");
  return /[",\n\r;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

/**
 * @param {Array<object>} filas
 * @param {Array<{key: string, label: string, value?: Function}>} columnas
 */
export const aCSV = (filas = [], columnas = []) => {
  const encabezado = columnas.map((col) => escapar(col.label)).join(",");
  const cuerpo = (Array.isArray(filas) ? filas : []).map((fila) =>
    columnas
      .map((col) =>
        escapar(
          typeof col.value === "function" ? col.value(fila) : fila?.[col.key],
        ),
      )
      .join(","),
  );
  return `\uFEFF${[encabezado, ...cuerpo].join("\r\n")}\r\n`;
};

export const descargarCSV = (nombre, texto) => {
  const blob = new Blob([texto], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.style.display = "none";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
};

export const nombreArchivo = (prefijo, fecha = new Date()) => {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${prefijo}-${y}-${m}-${d}.csv`;
};

// PF backup extension. Preserve complete JSON per row, including notes and sequences.
export const exportarBase = (rows=[]) => aCSV(rows,[{key:'id',label:'id'},{label:'prospect_json',value:p=>JSON.stringify(p)}]);
export const parseCSV = text => {
  const rows=[];let row=[],field='',quoted=false;
  text=String(text).replace(/^\uFEFF/,'');
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"' && text[i+1]==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}
    else if(c==='"'){if(field)throw new Error('Comillas CSV inválidas.');quoted=true;}
    else if(c===','){row.push(field);field='';}
    else if(c==='\n' || c==='\r'){if(c==='\r' && text[i+1]==='\n')i++;row.push(field);if(row.some(v=>v!==''))rows.push(row);row=[];field='';}
    else field+=c;
  }
  if(quoted)throw new Error('CSV con comillas sin cerrar.');
  if(field || row.length){row.push(field);rows.push(row);}
  return rows;
};
export const importarBase = text => {
  const [header,...data]=parseCSV(text);
  if(!header || header.join(',')!=='id,prospect_json')throw new Error('Usa un respaldo PF con columnas id y prospect_json.');
  const ids=new Set();
  return data.map((row,i)=>{
    if(row.length!==2)throw new Error(`Fila ${i+2} inválida.`);
    let p;try{p=JSON.parse(row[1]);}catch{throw new Error(`JSON inválido en fila ${i+2}.`);}
    if(!p || typeof p!=='object' || Array.isArray(p) || typeof p.id!=='string' || !p.id || p.id!==row[0] || ids.has(p.id))throw new Error(`ID inválido o duplicado en fila ${i+2}.`);
    if(typeof p.businessName!=='string' || !p.businessName.trim() || typeof p.status!=='string')throw new Error(`Prospecto incompleto en fila ${i+2}.`);
    if(p.followUpNotes!==undefined && !Array.isArray(p.followUpNotes))throw new Error(`Historial inválido en fila ${i+2}.`);
    ids.add(p.id);return p;
  });
};
