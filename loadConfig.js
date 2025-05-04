import fs from 'fs/promises';

export async function loadConfig(path) {
    const data = await fs.readFile(path, 'utf-8');
    return JSON.parse(data);
}