📌 Що робить:
Завантажує API-ключ з config.json

Дає змогу обрати марсохід, тип дати (земна/sol), дату і камеру

Надсилає запит до NASA Mars Rover API

Виводить фото з описами у консоль

Зберігає отримані дані у файл latest_photos.json

Може також показувати погодні дані з Insight API і зберігати їх у output_insight.json

🚀 Запуск
```bash
    node main.js       # отримання погодних даних з Insight API
```
```bash
    node photos.js     # взаємодія з Mars Rover Photos API
```