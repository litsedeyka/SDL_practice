import { Pool } from 'pg';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import promptSync from 'prompt-sync';
import { fileURLToPath } from 'url';

const prompt = promptSync();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Явная проверка на опасные символы в инпутах
function validateNoInjectionAttempt(input) {
    const dangerousChars = /[{}()\[\]'"`;\\]/;
    if (dangerousChars.test(input)) {
        throw new Error('Ввод содержит недопустимые символы');
    }
    return input;
}

// Функция для валидации имени пользователя
function validateUsername(username) {
    if (!username || username === '') {
        throw new Error('Имя пользователя не может быть пустым');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error('Имя пользователя может содержать только буквы, цифры и подчеркивания');
    }
    return username;
}

// Функция для валидации пароля
function validatePassword(password) {
    if (!password || password === '') {
        throw new Error('Пароль не может быть пустым');
    }
    return password;
}

// Функция для валидации конфигурационного файла
function validateConfig(config) {
    const allowedConfig = {
        host: 'string',
        port: 'number', 
        database: 'string',
        maxConnections: 'number'
    };

    // Проверяем наличие всех обязательных полей
    for (const [key, type] of Object.entries(allowedConfig)) {
        if (!(key in config)) {
            throw new Error(`Конфигурация не содержит обязательное поле: ${key}`);
        }
        if (typeof config[key] !== type) {
            throw new Error(`Некорректный тип для поля ${key}: ожидается ${type}, получен ${typeof config[key]}`);
        }
    }

    return config;
}

function createPool() {
    try {
        // Проверяем существование конфигурационного файла
        const configPath = join(__dirname, 'dbconf.json');
        if (!existsSync(configPath)) {
            throw new Error(`Конфигурационный файл не найден: ${configPath}`);
        }

        // Читаем и парсим конфигурацию
        const configContent = readFileSync(configPath, 'utf8');
        let config;
        try {
            config = JSON.parse(configContent);
        } catch (parseError) {
            throw new Error(`Ошибка парсинга JSON: ${parseError.message}`);
        }

        // Валидируем конфигурацию
        const validatedConfig = validateConfig(config);

        // Запрашиваем и валидируем учетные данные
        const dbUser = prompt('Введите имя пользователя: ');
        const dbPassword = prompt('Введите пароль: ', { echo: '*' });

        // Дополнительная проверка на опасные символы
        const validatedUser = validateNoInjectionAttempt(validateUsername(dbUser));
        const validatedPassword = validateNoInjectionAttempt(validatePassword(dbPassword));

        console.log('Попытка подключения с параметрами:');
        console.log(`Хост: ${validatedConfig.host}`);
        console.log(`Порт: ${validatedConfig.port}`);
        console.log(`База данных: ${validatedConfig.database}`);
        console.log(`Пользователь: ${validatedUser}`);

        // Создаем пул с валидированными данными
        return new Pool({
            user: validatedUser,
            password: validatedPassword,
            host: validatedConfig.host,
            database: validatedConfig.database,
            port: validatedConfig.port,
            max: validatedConfig.maxConnections,
        });

    } catch (error) {
        console.error('Ошибка при создании подключения:', error.message);
        process.exit(1);
    }
}

export { createPool };