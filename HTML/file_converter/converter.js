// ===============================
// Utility Logging
// ===============================
const logBox = document.getElementById('log');
function log(msg) {
    logBox.textContent = msg;
}

// ===============================
// File Elements
// ===============================
const inputPicker = document.getElementById('picker');
const dropZone = document.getElementById('drop');
const fileCard = document.getElementById('fileCard');
const outputSelect = document.getElementById('outputFormat');
const convertBtn = document.getElementById('go');

let currentFile = null;

// ===============================
// Supported Local Capabilities
// ===============================
const capabilities = {
    csv:   ["json", "xlsx", "txt"],
    xlsx:  ["csv", "json", "txt"],
    json:  ["csv", "xlsx", "txt"],
    txt:   ["pdf", "docx", "txt"],
    docx:  ["txt", "pdf"],
    jpg:   ["png", "webp", "pdf"],
    jpeg:  ["png", "webp", "pdf"],
    png:   ["jpg", "webp", "pdf"],
    webp:  ["jpg", "png", "pdf"]
};

// ===============================
// Helpers
// ===============================
function getExt(filename) {
    return filename.split('.').pop().toLowerCase();
}

function iconFor(ext) {
    const map = {
        pdf: "📄",
        docx: "📄",
        txt: "📄",
        csv: "📊",
        xlsx: "📊",
        json: "📊",
        png: "🖼️",
        jpg: "🖼️",
        jpeg: "🖼️",
        webp: "🖼️",
        mp3: "🎵",
        wav: "🎵"
    };
    return map[ext] || "📁";
}

// ===============================
// UI Behavior When File Selected
// ===============================
function handleFile(file) {
    currentFile = file;
    const ext = getExt(file.name);

    // Hide dropzone, show card
    dropZone.style.display = "none";
    fileCard.style.display = "inline-flex";

    fileCard.innerHTML = `
        <div class="file-top-row">
            <span class="file-icon">${iconFor(ext)}</span>
            <span class="file-name-text">${file.name}</span>
        </div>
        <div class="file-actions">
            <button class="file-replace">Replace</button>
        </div>
    `;

    document.querySelector(".file-replace").onclick = () => {
        inputPicker.value = "";
        inputPicker.click();
    };

    log(`Uploaded: ${file.name} (${ext})`);
    styleSelectFor(ext);
}

// ===============================
// Restore Dropzone
// ===============================
function restoreDropzone() {
    currentFile = null;
    inputPicker.value = "";
    outputSelect.value = "";
    outputSelect.disabled = false;
    convertBtn.disabled = false;

    const groups = outputSelect.querySelectorAll('optgroup');
    groups.forEach(g => g.style.display = 'block');

    fileCard.style.display = "none";
    dropZone.style.display = "block";
    log("");
}

// ===============================
// Format Filtering Logic
// ===============================
function styleSelectFor(ext) {
    const allowed = capabilities[ext] || [];
    const groups = outputSelect.querySelectorAll('optgroup');

    // If file type not supported at all (e.g., PDF right now)
    if (allowed.length === 0) {
        outputSelect.disabled = true;
        convertBtn.disabled = true;
        groups.forEach(g => g.style.display = 'none');
        log(`Conversion for .${ext.toUpperCase()} is not supported yet.`);
        return;
    }

    outputSelect.disabled = false;
    convertBtn.disabled = false;

    groups.forEach(group => {
        const opts = Array.from(group.querySelectorAll('option'));
        let validWithinGroup = 0;

        opts.forEach(opt => {
            if (allowed.includes(opt.value)) {
                opt.disabled = false;
                validWithinGroup++;
            } else {
                opt.disabled = true;
            }
        });

        group.style.display = validWithinGroup > 0 ? 'block' : 'none';
    });

    const enabled = Array.from(outputSelect.querySelectorAll('option:not([disabled])'));
    outputSelect.value = enabled.length === 1 ? enabled[0].value : "";
}

// ===============================
// Conversions
// ===============================
async function convertFile(file, target) {
    const ext = getExt(file.name);
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onerror = reject;

        reader.onload = e => {
            const data = e.target.result;

            // ==== CSV / Data Conversions ====
            if (ext === "csv" && target === "json") return resolve(csvToJson(data));
            if (ext === "csv" && target === "txt") return resolve(new Blob([data], { type: "text/plain" }));
            if (ext === "csv" && target === "xlsx") {
                const wb = XLSX.read(data, { type: "string" });
                const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                return resolve(new Blob([out], { type: "application/vnd.openxmlformats" }));
            }

            if (ext === "xlsx" && target === "csv") {
                const wb = XLSX.read(data);
                const csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
                return resolve(new Blob([csv], { type: "text/csv" }));
            }

            if (ext === "xlsx" && target === "json") {
                const wb = XLSX.read(data);
                const js = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                return resolve(new Blob([JSON.stringify(js,null,2)], { type: "application/json" }));
            }

            if (ext === "json" && target === "csv") {
                const arr = JSON.parse(data);
                const ws = XLSX.utils.json_to_sheet(arr);
                const csv = XLSX.utils.sheet_to_csv(ws);
                return resolve(new Blob([csv], { type: "text/csv" }));
            }

            // ==== Image Conversion ====
            if (["png","jpg","jpeg","webp"].includes(ext)) {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    if (target === "pdf") {
                        const pdf = new jsPDF();
                        const dataURL = canvas.toDataURL("image/jpeg", 1.0);
                        pdf.addImage(dataURL, "JPEG", 0, 0, 210, 297);
                        return resolve(pdf.output("blob"));
                    }

                    const mime = target === "jpg" ? "image/jpeg" :
                                 target === "png" ? "image/png" : "image/webp";

                    canvas.toBlob(blob => resolve(blob), mime, 1.0);
                };
                img.src = URL.createObjectURL(file);
                return;
            }

            reject("Unsupported");
        };

        if (ext === "xlsx") reader.readAsArrayBuffer(file);
        else if (["json","csv","txt"].includes(ext)) reader.readAsText(file);
        else reader.readAsDataURL(file);
    });
}

// ===============================
// CSV Helper
// ===============================
function csvToJson(csv) {
    const rows = csv.split('\n');
    const headers = rows[0].split(',').map(h => h.trim());
    const json = rows.slice(1).map(r => {
        const vals = r.split(',');
        let obj = {};
        headers.forEach((h,i) => obj[h] = vals[i]);
        return obj;
    });
    return new Blob([JSON.stringify(json,null,2)], { type: "application/json" });
}

// ===============================
// Save Helper
// ===============================
async function saveFile(blob, suggestedName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = suggestedName;
    a.click();
    URL.revokeObjectURL(url);
}

// ===============================
// UI Events
// ===============================
dropZone.onclick = () => inputPicker.click();

inputPicker.onchange = e => {
    if (e.target.files.length) handleFile(e.target.files[0]);
};

convertBtn.onclick = async () => {
    if (!currentFile) return log("Upload a file first.");
    if (!outputSelect.value) return log("Choose a format.");

    const ext = getExt(currentFile.name);
    const allowed = capabilities[ext] || [];

    if (!allowed.includes(outputSelect.value)) {
        return log(`Cannot convert ${ext.toUpperCase()} → ${outputSelect.value.toUpperCase()}.`);
    }

    try {
        const blob = await convertFile(currentFile, outputSelect.value);
        const outName = currentFile.name.replace(/\.[^.]+$/, `.${outputSelect.value}`);
        saveFile(blob, outName);
        log(`Converted to ${outputSelect.value}`);
    } catch {
        log("Conversion failed or unsupported.");
    }
};
