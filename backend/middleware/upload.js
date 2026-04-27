const multer = require('multer');
const path = require('path');

// Налаштування сховища
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Куди зберігати файли
    },
    filename: function (req, file, cb) {
        // Генеруємо унікальне ім'я, щоб файли не перезаписували один одного
        // Наприклад: 169546543-123456.jpg
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Фільтр: приймаємо ТІЛЬКИ картинки
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Дозволені тільки зображення (JPG, PNG, WEBP)!'), false);
    }
};

// Створюємо об'єкт upload (ліміт розміру файлу - 5 МБ)
const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } 
});

module.exports = upload;