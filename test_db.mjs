import postgres from 'postgres';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

// Load test env
dotenv.config({ path: './services/crm-service/.env.test' });

console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 70) + '...');

const sql = postgres(process.env.DATABASE_URL);

// Test insert and select
async function test() {
  try {
    const testId = randomUUID();
    const testName = 'Test DB Connection ' + Date.now();
    const criteria = JSON.stringify([]);

    console.log('Inserting segment with ID:', testId);
    console.log('Inserting segment with name:', testName);

    const insertResult = await sql`
      INSERT INTO customer_segments (id, name, criteria, operator, is_active, created_by)
      VALUES (${testId}::uuid, ${testName}, ${criteria}::jsonb, 'AND', true, '123e4567-e89b-12d3-a456-426614174000'::uuid)
      RETURNING *
    `;
    console.log('Insert result rows:', insertResult.length);
    if (insertResult.length > 0) {
      console.log('Inserted segment:', insertResult[0]);
    }

    console.log('\n--- Querying by ID:', testId);
    const selectById = await sql`SELECT * FROM customer_segments WHERE id = ${testId}::uuid`;
    console.log('Select by ID result rows:', selectById.length);
    if (selectById.length > 0) {
      console.log('Found segment:', selectById[0]);
    }

    console.log('\n--- Querying by name:', testName);
    const selectByName = await sql`SELECT * FROM customer_segments WHERE name = ${testName}`;
    console.log('Select by name result rows:', selectByName.length);
    if (selectByName.length > 0) {
      console.log('Found segment:', selectByName[0]);
    }

    // Cleanup
    await sql`DELETE FROM customer_segments WHERE id = ${testId}::uuid`;
    console.log('\n--- Cleanup done');

    await sql.end();

    if (selectById.length === 0 || selectByName.length === 0) {
      console.error('\n❌ ERROR: Data was inserted but not found!');
      process.exit(1);
    } else {
      console.log('\n✅ SUCCESS: Data was inserted and found!');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

test();
