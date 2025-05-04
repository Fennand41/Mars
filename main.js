import fs from 'fs';
import fetch from 'node-fetch';
import { loadConfig } from './loadConfig.js';

async function main() {
    const config = await loadConfig('config.json');
    const url = `https://api.nasa.gov/insight_weather/?api_key=${config.api_key}&feedtype=json&ver=1.0`;

    const response = await fetch(url);
    if (!response.ok) {
        console.error(`❌ Помилка API: ${response.status}`);
        return;
    }

    const data = await response.json();
    const sols = data.sol_keys;
    if (!sols || sols.length === 0) {
        console.log('Дані відсутні ❗');
        return;
    }

    fs.writeFileSync('output_insight.json', JSON.stringify(data, null, 2));
    console.log('✅ Дані збережено у файл output_insight.json');

    const row = (label, values) => {
        return `${label.padEnd(25)} | ${values.map(v => v.toString().padEnd(18)).join(' | ')}`;
    };

    const headers = sols.map(sol => `Sol ${sol}`);
    const dates = sols.map(sol => {
        const d = data[sol].First_UTC;
        return d ? new Date(d).toISOString().split('T')[0] : 'н/д';
    });
    const temps = sols.map(sol => {
        const t = data[sol].AT?.av;
        return t !== undefined ? `${t.toFixed(1)} °C` : 'н/д';
    });
    const winds = sols.map(sol => {
        const w = data[sol].HWS?.av;
        return w !== undefined ? `${w.toFixed(1)} м/с` : 'н/д';
    });
    const pressures = sols.map(sol => {
        const p = data[sol].PRE?.av;
        return p !== undefined ? `${p.toFixed(1)} Па` : 'н/д';
    });

    console.log('\n📊 Погода на Марсі:\n');
    console.log(row('Параметр / Sol', headers));
    console.log('-'.repeat(100));
    console.log(row('🌍 Земна дата', dates));
    console.log(row('🌡 Температура', temps));
    console.log(row('🌬 Вітер', winds));
    console.log(row('📈 Тиск', pressures));
}

main();
