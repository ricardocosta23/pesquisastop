
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import pkg from "pg";
const { Pool } = pkg;
import { 
  mondayItems, 
  mondayColumns,
  chaves,
  type InsertMondayItem, 
  type MondayItem,
  type InsertMondayColumn,
  type MondayColumn,
  type InsertChave,
  type Chave
} from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export class DatabaseService {
  async createItem(itemData: InsertMondayItem): Promise<MondayItem> {
    const [item] = await db.insert(mondayItems).values(itemData).returning();
    return item;
  }

  async updateItem(mondayItemId: string, columnValues: any): Promise<MondayItem | null> {
    const [item] = await db
      .update(mondayItems)
      .set({
        columnValues,
        updatedAt: new Date(),
      })
      .where(eq(mondayItems.mondayItemId, mondayItemId))
      .returning();
    
    return item || null;
  }

  async deleteItem(mondayItemId: string): Promise<boolean> {
    const result = await db
      .delete(mondayItems)
      .where(eq(mondayItems.mondayItemId, mondayItemId))
      .returning();
    
    return result.length > 0;
  }

  async getItemByMondayId(mondayItemId: string): Promise<MondayItem | null> {
    const [item] = await db
      .select()
      .from(mondayItems)
      .where(eq(mondayItems.mondayItemId, mondayItemId))
      .limit(1);
    
    return item || null;
  }

  async getAllItems(): Promise<MondayItem[]> {
    return await db.select().from(mondayItems);
  }

  async createColumn(columnData: InsertMondayColumn): Promise<MondayColumn> {
    const [column] = await db.insert(mondayColumns).values(columnData).returning();
    return column;
  }

  async getColumnByColumnId(columnId: string): Promise<MondayColumn | null> {
    const [column] = await db
      .select()
      .from(mondayColumns)
      .where(eq(mondayColumns.columnId, columnId))
      .limit(1);
    
    return column || null;
  }

  async getAllColumns(): Promise<MondayColumn[]> {
    return await db.select().from(mondayColumns);
  }

  async getColumnsByBoardId(boardId: string): Promise<MondayColumn[]> {
    return await db
      .select()
      .from(mondayColumns)
      .where(eq(mondayColumns.boardId, boardId));
  }

  async searchItemByNumeroAndTipo(numeroNegocio: string, tipo: string): Promise<MondayItem | null> {
    // Column IDs from mapping: Num negócio at text_mkrkqj1g, Tipo at color_mksvhn92
    const items = await db
      .select()
      .from(mondayItems)
      .where(
        sql`
          ${mondayItems.columnValues}::jsonb->'text_mkrkqj1g'->>'text' = ${numeroNegocio}
          AND ${mondayItems.columnValues}::jsonb->'color_mksvhn92'->>'text' = ${tipo}
        `
      )
      .limit(1);
    
    return items.length > 0 ? items[0] : null;
  }

  async getAllItemsByTipo(tipo: string): Promise<MondayItem[]> {
    // Column ID from mapping: Tipo at color_mksvhn92
    return await db
      .select()
      .from(mondayItems)
      .where(
        sql`${mondayItems.columnValues}::jsonb->'color_mksvhn92'->>'text' = ${tipo}`
      );
  }

  async createChave(chaveData: InsertChave): Promise<Chave> {
    const [chave] = await db.insert(chaves).values(chaveData).returning();
    return chave;
  }

  async deleteChavesByItemId(itemId: string): Promise<number> {
    const result = await db
      .delete(chaves)
      .where(eq(chaves.itemId, itemId))
      .returning();
    
    return result.length;
  }

  async getChavesByItemId(itemId: string): Promise<Chave[]> {
    return await db
      .select()
      .from(chaves)
      .where(eq(chaves.itemId, itemId));
  }

  async getChaveByValue(chaveValue: string): Promise<Chave | null> {
    const [chave] = await db
      .select()
      .from(chaves)
      .where(eq(chaves.chave, chaveValue))
      .limit(1);
    
    return chave || null;
  }

  async getAllChaves(): Promise<Chave[]> {
    return await db.select().from(chaves);
  }
}

export const dbService = new DatabaseService();
