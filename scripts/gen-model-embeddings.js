const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Load MODEL_DATA from the browser bundle file by evaluating it in a sandbox-like scope.
// If direct import fails due to ESM/CJS differences, fallback to reading the file and extracting JSON.
function loadModelData() {
    const filePath = path.resolve(__dirname, '..', 'model-data.js');
    const code = fs.readFileSync(filePath, 'utf8');
    // Quick-and-safe extraction: evaluate in a Function with minimal scope
    const sandbox = { module: { exports: {} } };
    const wrapped = new Function('module', 'exports', 'window', code + '\n;return module.exports || {};');
    const mod = wrapped(sandbox.module, sandbox.module.exports, {});
    if (mod && mod.MODEL_DATA) return mod.MODEL_DATA;
    throw new Error('Unable to load MODEL_DATA from model-data.js');
}

function cardText(name, d) {
    return [name, d.purpose, d.useCase, `Category: ${d.category}`, `Industry: ${d.industry}`]
        .filter(Boolean).join('\n');
}

async function embedBatch(texts, model = 'i3-embedding') {
    const baseURL = process.env.I3_PROXY_BASE || 'http://localhost:8000';
    const apiKey = process.env.I3_API_KEY;
    if (!apiKey) throw new Error('Missing I3_API_KEY');
    const res = await fetch(`${baseURL}/embeddings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'I3-API-Key': apiKey
        },
        body: JSON.stringify({ model, input: texts })
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    // Proxy shape: { success, data: { data: [ { embedding } ] } }
    const arr = (json && json.data && Array.isArray(json.data.data)) ? json.data.data : [];
    return arr.map(x => x.embedding);
}

async function main() {
    // Require proxy API key
    if (!process.env.I3_API_KEY) {
        console.error('Missing I3_API_KEY');
        process.exit(1);
    }

    const MODEL_DATA = loadModelData();
    const entries = Object.entries(MODEL_DATA);
    const items = entries.map(([name, d]) => ({ name, text: cardText(name, d) }));

    const out = [];
    const B = 64;
    for (let i = 0; i < items.length; i += B) {
        const batch = items.slice(i, i + B);
        const embs = await embedBatch(batch.map(x => x.text));
        for (let j = 0; j < batch.length; j++) {
            out.push({ name: batch[j].name, embedding: embs[j] });
        }
        console.log(`Embedded ${Math.min(i + B, items.length)} / ${items.length}`);
        await new Promise(r => setTimeout(r, 150));
    }

    const outPath = path.resolve(process.cwd(), 'model-embeddings.json');
    fs.writeFileSync(outPath, JSON.stringify(out));
    console.log('Wrote', outPath, 'items:', out.length);
}

main().catch(e => { console.error(e); process.exit(1); });


