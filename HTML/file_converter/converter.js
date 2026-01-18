// ===== Elements =====
const drop = document.getElementById('drop');
const picker = document.getElementById('picker');
const outputSelect = document.getElementById('outputFormat');
const goBtn = document.getElementById('go');
const lastEl = document.getElementById('last');
const logEl = document.getElementById('log');

let file = null;
let sourceExt = "";

// ===== Allowed Conversion Matrix =====
const allowedMatrix = {
    pdf:  ['docx', 'txt'],
    docx: ['pdf', 'txt'],
    csv:  ['xlsx', 'json', 'txt'],
    xlsx: ['csv', 'json', 'txt'],
    json: ['csv', 'txt'],
    png:  ['jpg', 'webp'],
    jpg:  ['png', 'webp'],
    webp: ['png', 'jpg'],
    wav:  ['mp3'],
    mp3:  ['wav'],
    txt:  ['pdf']
};

// ===== Helpers =====
function getFileExt(name) {
    const idx = name.lastIndexOf(".");
    if (idx <= 0) return "";
    return name.slice(idx+1).toLowerCase();
}

function log(msg) {
    logEl.textContent = msg;
}

async function saveFile(blob, suggestedName) {
    if (window.showSaveFilePicker) {
        try {
            const handle = await showSaveFilePicker({
                suggestedName,
                types: [{
                    description: "Converted File",
                    accept: { "*/*": [`.${suggestedName.split('.').pop()}`] }
                }]
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            log(`Saved as: ${handle.name}`);
            return;
        } catch (err) {
            console.warn("Save cancelled or failed:", err);
        }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    log(`Download started: ${suggestedName}`);
}

// ===== UI Updating =====
function setFile(f) {
    file = f;
    sourceExt = getFileExt(f.name);
    lastEl.textContent = `Selected: ${f.name}`;
    log(`Detected file type: .${sourceExt}`);
    updateOutputOptions(sourceExt);
}

function updateOutputOptions(ext) {
    const opts = allowedMatrix[ext] || [];

    // clear old
    for (const opt of [...outputSelect.options]) {
        if (opt.value) opt.remove();
    }

    opts.forEach(t => {
        const o = document.createElement("option");
        o.value = t;
        o.textContent = t.toUpperCase();
        outputSelect.appendChild(o);
    });

    if (opts.length === 1) outputSelect.value = opts[0];

    goBtn.disabled = !(file && outputSelect.value);
}

// ===== Drag/Drop & Picker =====
drop.addEventListener("click", () => picker.click());
drop.addEventListener("dragover", e => e.preventDefault());
drop.addEventListener("drop", e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
});
picker.addEventListener("change", e => {
    const f = e.target.files[0];
    if (f) setFile(f);
});

// ===== Conversion Dispatch =====
goBtn.addEventListener("click", async () => {
    if (!file) return log("Select a file first");

    const target = outputSelect.value;
    const validTargets = allowedMatrix[sourceExt] || [];

    if (!validTargets.includes(target)) {
        return log(`Conversion from .${sourceExt} to .${target} is not supported.`);
    }

    log(`Converting ${file.name} from .${sourceExt} → .${target} ...`);

    const buf = await file.arrayBuffer();

    switch(target) {
        case "txt":  return convertToTXT(buf, file);
        case "json": return convertToJSON(buf, file);
        case "csv":  return convertToCSV(buf, file);
        case "xlsx": return convertToXLSX(buf, file);
        case "mp3":  return convertToMP3(buf, file);
        case "wav":  return convertToWAV(buf, file);
        // pdf/docx left for backend
        default:
            log(`Conversion engine for .${target} not implemented yet.`);
    }
});

// ===== Converters =====

// Text Output
async function convertToTXT(buf, f) {
    const text = new TextDecoder().decode(buf);
    const out = new Blob([text], { type: "text/plain" });
    const name = f.name.replace(/\.[^.]+$/, "") + ".txt";
    await saveFile(out, name);
}

// JSON Output (from CSV)
async function convertToJSON(buf, f) {
    const csv = new TextDecoder().decode(buf).trim();
    const lines = csv.split(/\r?\n/);
    const headers = lines.shift().split(",");
    const data = lines.map(l => {
        const vals = l.split(",");
        return Object.fromEntries(headers.map((h,i)=>[h,vals[i]]));
    });
    const out = new Blob([JSON.stringify(data,null,2)], { type:"application/json" });
    const name = f.name.replace(/\.[^.]+$/, "") + ".json";
    await saveFile(out, name);
}

// CSV Output (from JSON)
async function convertToCSV(buf, f) {
    const json = JSON.parse(new TextDecoder().decode(buf));
    const headers = Object.keys(json[0]);
    const rows = json.map(o => headers.map(h => o[h]).join(","));
    const out = new Blob([[headers.join(","), ...rows].join("\n")], { type:"text/csv" });
    const name = f.name.replace(/\.[^.]+$/, "") + ".csv";
    await saveFile(out, name);
}

// XLSX Output (requires SheetJS)
async function convertToXLSX(buf, f) {
    const json = JSON.parse(new TextDecoder().decode(buf));
    const XLSX = await import("https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs");
    const ws = XLSX.utils.json_to_sheet(json);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const out = XLSX.write(wb, { bookType:"xlsx", type:"array" });
    const blob = new Blob([out], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const name = f.name.replace(/\.[^.]+$/, "") + ".xlsx";
    await saveFile(blob, name);
}

// Audio conversions (stub for now)
async function convertToMP3(buf, f) {
    log("MP3 conversion via ffmpeg.wasm coming soon.");
}
async function convertToWAV(buf, f) {
    log("WAV conversion via ffmpeg.wasm coming soon.");
}
