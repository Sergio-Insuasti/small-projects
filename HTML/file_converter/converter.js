const RANDOM_FALLBACK_URLS = [
    "https://drive.google.com/file/d/1zpZEVnXognffJCqKY5b30rwZoOcCeeZy/view?usp=sharing",
    "https://drive.google.com/file/d/1ZNAsuxKCui3O08UHeHV2rv8dyfjppgMP/view?usp=sharing",
    "https://drive.google.com/file/d/1AjIqsBvLs3ttb2FAzOwI85E74EpRcsqF/view?usp=sharing",
    "https://drive.google.com/file/d/10W2niKHqKDZFBzrvmDbYVeweaUUz2Xx9/view?usp=sharing",
    "https://drive.google.com/file/d/1XFdRrS7OC5Fld1KjZcOVnhkpKRedRiA7/view?usp=sharing",
    "https://drive.google.com/file/d/1PHpuaDUM-wzjcAPYKx1Vvj-WbfwHPNCr/view?usp=sharing",
    "https://drive.google.com/file/d/1BEbvjbukUMJ8FJHdissRkY6RyWLF2_fW/view?usp=sharing",
    "https://drive.google.com/file/d/1GiDUgoryOg7MBeqA-7TvmFG7uiIDX7ES/view?usp=sharing",
    "https://drive.google.com/file/d/1exJxZYFKJXRaHY59fOmEplE21W_jM1-d/view?usp=sharing",
    "https://drive.google.com/file/d/1VEa_-MAlCQiqb0PQnqNu9Bug9eXD6TCQ/view?usp=sharing"
];

const drop = document.getElementById('drop');
const picker = document.getElementById('picker');
const go = document.getElementById('go');
const logEl = document.getElementById('log');
const lastEl = document.getElementById('last');

let file = null;

drop.addEventListener('click', () => picker.click());
drop.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); picker.click(); }
});
['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); drop.classList.add('dragover'); }));
['dragleave', 'dragend', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); drop.classList.remove('dragover'); }));
drop.addEventListener('drop', (e) => { const f = e.dataTransfer?.files?.[0]; if (f) setFile(f); });
picker.addEventListener('change', (e) => { const f = e.target.files?.[0]; if (f) setFile(f); });

function setFile(f) { file = f; lastEl.textContent = `Selected: ${file.name}`; log(''); }

const converters = ['tocsv', 'totxt', 'towav', 'mysteryzip', 'surprise'];

go.addEventListener('click', async () => {
    if (!file) return log('Pick or drop a file first.');
    const target = converters[Math.floor(Math.random() * converters.length)];

    try {
        const buf = await file.arrayBuffer();
        if (target === 'tocsv') await tocsv(buf, file.name);
        else if (target === 'mysteryzip') await toMysteryZip(buf, file.name);
        else if (target === 'totxt') await toTXT(buf, file);
        else if (target === 'towav') await toWAV(buf, file);
        else { // "surprise"
            log('Conversion failed successfully. Deploying Mystery Gift!');
            mysteryFallbackDownload();
            return;
        }
        log('Conversion completed abysmally. Open at your peril!');
    } catch (err) {
        console.error('[Converter error]', err);
        log('Conversion failed successfully. Deploying Mystery Gift!');
        mysteryFallbackDownload();
    }
});


async function tocsv(buf, originalName) {
    const text = safeDecode(buf);
    const rows = text.split(/\r?\n/).map(l => l.replace(/\s+/g, ','));
    for (let i = 0; i < Math.min(3, Math.floor(rows.length / 5)); i++) {
        rows.splice(Math.floor(Math.random() * rows.length), 0, '');
    }
    const csv = rows.join('\n');
    await download(new Blob([csv], { type: 'text/csv' }), replaceExt(originalName, 'csv'));
}

async function toTXT(buf, f) {
    let text;
    try {
        text = safeDecode(buf);
        const lines = text.split(/\r?\n/).slice(0, 200);
        text = [
            `### Mystery Transcript for: ${f.name}`,
            `[confidence: ${(50 + Math.random() * 60).toFixed(1)}%]`,
            '',
            ...lines.map((ln, i) => `${stamp(i)} ${garble(ln)}`),
            '',
            '(end of low-confidence transcript)'
        ].join('\n');
    } catch {
        text = fakeTranscript(f.name);
    }
    await download(new Blob([text], { type: 'text/plain' }), replaceExt(f.name, 'txt'));
}

async function toWAV(buf, f) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) throw new Error('Web Audio API not supported');
    const ctx = new AudioCtx();
    let audioBuffer;
    try { audioBuffer = await ctx.decodeAudioData(buf.slice(0)); }
    catch { audioBuffer = synthTone(ctx, 2.0); }
    const wavBlob = audioBufferToWavBlob(audioBuffer);
    await download(wavBlob, replaceExt(f.name, 'wav'));
    if (ctx.close) { try { await ctx.close(); } catch { } }
}

async function toMysteryZip(buf, originalName) {
    const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
    const zip = new JSZip();
    zip.file(originalName, buf);
    zip.file('manifest.json', JSON.stringify({
        originalName,
        entropy: (Math.random() * 10).toFixed(2),
        convertedBy: 'Mystery Converter',
        notes: 'We promised nothing.'
    }, null, 2));
    const blob = await zip.generateAsync({ type: 'blob' });
    await download(blob, replaceExt(originalName, 'mystery.zip'));
}

async function download(blob, name) {
    if ('showSaveFilePicker' in window) {
        try {
            const ext = name.split('.').pop();
            const handle = await window.showSaveFilePicker({
                suggestedName: name,
                types: [{ description: 'File', accept: { '*/*': [`.${ext}`] } }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            log(`Saved: ${handle.name}`);
            return;
        } catch (e) { }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a);
    try { a.click(); } catch { }
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function mysteryFallbackDownload() {
    if (!RANDOM_FALLBACK_URLS.length) {
        alert('Add public Drive links to RANDOM_FALLBACK_URLS');
        return;
    }
    const raw = RANDOM_FALLBACK_URLS[Math.floor(Math.random() * RANDOM_FALLBACK_URLS.length)];
    const url = normalizeDriveLink(raw);
    window.open(url, '_blank', 'noopener');
}

function normalizeDriveLink(url) {
    try {
        const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})\//);
        if (m && m[1]) {
            return `https://drive.google.com/uc?export=download&id=${m[1]}`;
        }
        return url;
    } catch { return url; }
}

function replaceExt(name, newExt) { return (name.replace(/\.[^.]+$/, '') || 'file') + '.' + newExt; }
function readAsDataURL(f) { return new Promise((res, rej) => { const r = new FileReader(); r.onerror = rej; r.onload = () => res(r.result); r.readAsDataURL(f); }); }
function safeDecode(buf) { return new TextDecoder().decode(buf); }
function log(msg) { logEl.textContent = msg; }

function stamp(i) { const s = i % 3600, m = Math.floor(s / 60), r = s % 60; return `[${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}]`; }
function garble(s) { if (!s) return ''; return s.replace(/\s{2,}/g, ' ').split(' ').map(w => { if (Math.random() < 0.08) return w.toUpperCase(); if (Math.random() < 0.08) return w + (Math.random() < 0.5 ? '...' : '?'); return w; }).join(Math.random() < 0.2 ? '  ' : ' '); }
function fakeTranscript(name) {
    const lines = [
        '[00:00] Ooooo Mystery',
        '[00:07] Speaker: Welcome to this mystery fileeeee.',
        '[00:19] A spell has been cast!',
        '[00:31] We couldn\'t convert your file, so we gave one for free!',
        '[00:52] Ooooo Mystery'
    ];
    return `### Mystery Transcript for: ${name}\n[confidence: ${(50 + Math.random() * 60).toFixed(1)}%]\n\n${lines.join('\n')}\n\nABRACADABRA!\n`;
}

function synthTone(ctx, seconds = 2.0, freq = 440) {
    const sr = ctx.sampleRate || 44100;
    const len = Math.floor(sr * seconds);
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
        const t = i / sr;
        const wobble = 1 + 0.01 * Math.sin(2 * Math.PI * 3 * t);
        const amp = 0.3 * Math.pow(1 - i / len, 0.3);
        data[i] = Math.sin(2 * Math.PI * freq * wobble * t) * amp;
    }
    return buf;
}
function audioBufferToWavBlob(audioBuffer) {
    const numCh = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const len = audioBuffer.length;
    let interleaved;
    if (numCh === 2) {
        const L = audioBuffer.getChannelData(0);
        const R = audioBuffer.getChannelData(1);
        interleaved = new Float32Array(len * 2);
        for (let i = 0, j = 0; i < len; i++, j += 2) { interleaved[j] = L[i]; interleaved[j + 1] = R[i]; }
    } else {
        interleaved = audioBuffer.getChannelData(0);
    }
    const wav = encodeWAV(interleaved, sampleRate, numCh);
    return new Blob([wav], { type: 'audio/wav' });
}
function encodeWAV(samples, sampleRate, numCh = 1) {
    const bytesPerSample = 2, blockAlign = numCh * bytesPerSample;
    const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample), view = new DataView(buffer);
    writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + samples.length * bytesPerSample, true);
    writeString(view, 8, 'WAVE'); writeString(view, 12, 'fmt '); view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); view.setUint16(22, numCh, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); view.setUint16(32, blockAlign, true); view.setUint16(34, 16, true);
    writeString(view, 36, 'data'); view.setUint32(40, samples.length * bytesPerSample, true);
    floatTo16BitPCM(view, 44, samples); return view;
}
function floatTo16BitPCM(view, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}
function writeString(view, offset, string) { for (let i = 0; i < string.length; i++) { view.setUint8(offset + i, string.charCodeAt(i)); } }