import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import pkg from "pg";
const { Pool } = pkg;
import { mondayColumns } from "../shared/schema.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function showColumns() {
  try {
    const columns = await db
      .select()
      .from(mondayColumns)
      .where(eq(mondayColumns.boardId, "9242892489"));

    console.log("\n=== BOARD 9242892489 COLUMN MAPPINGS ===\n");
    
    columns.forEach((col) => {
      console.log(`${col.columnTitle} at ${col.columnId}`);
    });

    console.log(`\n=== Total: ${columns.length} columns ===\n`);
  } catch (error) {
    console.error("Error fetching columns:", error);
  } finally {
    await pool.end();
  }
}

showColumns();
