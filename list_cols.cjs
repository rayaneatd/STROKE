const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function getCandidateColumns() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'candidates'
      ORDER BY column_name;
    `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

getCandidateColumns();
