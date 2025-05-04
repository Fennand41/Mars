import fetch from 'node-fetch';
import fs from 'fs';
import open from 'open';
import readline from 'readline';
import { loadConfig } from './loadConfig.js';

const rovers = ['perseverance', 'curiosity', 'opportunity', 'spirit'];

function promptUser(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(question, answer => {
        rl.close();
        resolve(answer.trim());
    }));
}

async function getAvailableCameras(rover, dateType, dateValue, apiKey) {
    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?${dateType}=${dateValue}&api_key=${apiKey}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Помилка при запиті: ${response.status}`);
        }
        const data = await response.json();
        const photos = data.photos;
        const cameraSet = new Set();
        photos.forEach(photo => {
            cameraSet.add(photo.camera.name);
        });
        return Array.from(cameraSet);
    } catch (error) {
        console.error(`❌ Сталася помилка при отриманні списку камер: ${error.message}`);
        return [];
    }
}

async function fetchPhotos() {
    const config = await loadConfig('config.json');
    const apiKey = config.api_key;

    // Вибір марсохода
    console.log('Доступні марсоходи:');
    rovers.forEach((rover, index) => {
        console.log(`${index + 1}. ${rover}`);
    });
    let roverIndex = await promptUser('Оберіть номер марсохода: ');
    roverIndex = parseInt(roverIndex, 10);
    if (isNaN(roverIndex) || roverIndex < 1 || roverIndex > rovers.length) {
        console.log('❌ Невірний вибір марсохода.');
        return;
    }
    const rover = rovers[roverIndex - 1];

    // Отримання маніфесту місії
    const manifestUrl = `https://api.nasa.gov/mars-photos/api/v1/manifests/${rover}?api_key=${apiKey}`;
    let manifestData;
    try {
        const manifestResponse = await fetch(manifestUrl);
        if (!manifestResponse.ok) {
            throw new Error(`Помилка при запиті маніфесту: ${manifestResponse.status}`);
        }
        const manifestJson = await manifestResponse.json();
        manifestData = manifestJson.photo_manifest;
    } catch (error) {
        console.error(`❌ Сталася помилка при отриманні маніфесту: ${error.message}`);
        return;
    }

    // Вивід доступних дат
    console.log(`\n📅 Доступні дати для марсохода ${rover}:`);
    console.log(`- Земна дата: від ${manifestData.landing_date} до ${manifestData.max_date}`);
    console.log(`- Марсіанські дні (Sol): від 0 до ${manifestData.max_sol}`);

    // Вибір типу дати
    const dateTypeChoice = await promptUser('\nОберіть тип дати (1 - Земна дата, 2 - Sol): ');
    let dateType = '';
    let dateValue = '';
    if (dateTypeChoice === '1') {
        dateType = 'earth_date';
        dateValue = await promptUser('Введіть дату у форматі YYYY-MM-DD: ');
    } else if (dateTypeChoice === '2') {
        dateType = 'sol';
        dateValue = await promptUser('Введіть номер Sol: ');
    } else {
        console.log('❌ Невірний вибір типу дати.');
        return;
    }

    // Отримання доступних камер
    const availableCameras = await getAvailableCameras(rover, dateType, dateValue, apiKey);
    if (availableCameras.length === 0) {
        console.log('❌ Немає доступних камер для вибраних параметрів.');
        return;
    }

    // Вибір камери
    console.log('\nДоступні камери:');
    availableCameras.forEach((cam, index) => {
        console.log(`${index + 1}. ${cam}`);
    });
    const cameraIndex = await promptUser('Оберіть номер камери (або натисніть Enter для всіх камер): ');
    let cameraParam = '';
    if (cameraIndex) {
        const camIdx = parseInt(cameraIndex, 10);
        if (isNaN(camIdx) || camIdx < 1 || camIdx > availableCameras.length) {
            console.log('❌ Невірний вибір камери.');
            return;
        }
        const camera = availableCameras[camIdx - 1];
        cameraParam = `&camera=${camera}`;
    }

    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?${dateType}=${dateValue}${cameraParam}&api_key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Помилка при запиті: ${response.status}`);
        }

        const data = await response.json();
        const photos = data.photos;

        if (!photos || photos.length === 0) {
            console.log('Немає доступних фотографій.');
            return;
        }

        // Зберігаємо дані у файл
        fs.writeFileSync('latest_photos.json', JSON.stringify(photos, null, 2));
        console.log('✅ Дані збережено у файл latest_photos.json');

        // Виводимо інформацію про фотографії
        photos.forEach((photo, index) => {
            console.log(`\n📷 Фото ${index + 1}`);
            console.log(`🗓 Земна дата: ${photo.earth_date}`);
            console.log(`📸 Камера: ${photo.camera.full_name}`);
            console.log(`🔗 Посилання: ${photo.img_src}`);
        });

    } catch (error) {
        console.error(`❌ Сталася помилка: ${error.message}`);
    }
}

fetchPhotos();
