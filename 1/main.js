import { createPool } from './config/db.js';

async function main() {
    try {
        const pool = createPool();
        
        const result = await pool.query('SELECT VERSION()');
        console.log('Успешное подключение к БД');
        console.log('Версия PostgreSQL:', result.rows[0].version);
        
        await pool.end();
    } catch (error) {
        console.error('Ошибка подключения к БД:', error.message);
    }
}

main();