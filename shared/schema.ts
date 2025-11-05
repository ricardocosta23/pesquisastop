import { z } from "zod";
import { pgTable, text, varchar, timestamp, jsonb, serial } from "drizzle-orm/pg-core";

export const mondayItems = pgTable("monday_items", {
  id: serial("id").primaryKey(),
  mondayItemId: varchar("monday_item_id", { length: 255 }).notNull().unique(),
  boardId: varchar("board_id", { length: 255 }).notNull(),
  itemName: text("item_name").notNull(),
  columnValues: jsonb("column_values").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mondayColumns = pgTable("monday_columns", {
  id: serial("id").primaryKey(),
  boardId: varchar("board_id", { length: 255 }).notNull(),
  columnId: varchar("column_id", { length: 255 }).notNull().unique(),
  columnTitle: text("column_title").notNull(),
  columnType: varchar("column_type", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chaves = pgTable("chaves", {
  id: serial("id").primaryKey(),
  itemId: varchar("item_id", { length: 255 }).notNull(),
  numeroDeNegocio: text("numero_de_negocio").notNull(),
  chave: text("chave").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MondayItem = typeof mondayItems.$inferSelect;
export type InsertMondayItem = typeof mondayItems.$inferInsert;
export type MondayColumn = typeof mondayColumns.$inferSelect;
export type InsertMondayColumn = typeof mondayColumns.$inferInsert;
export type Chave = typeof chaves.$inferSelect;
export type InsertChave = typeof chaves.$inferInsert;

export interface Hotel {
  name: string;
  rating: number | null;
}

export interface NamedRating {
  name: string;
  rating: number | null;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
}

export interface LongTextComment {
  title: string;
  content: string;
  author?: string;
}

export interface TripEvaluation {
  id: string;
  cliente: string;
  destino: string;
  dataViagem: string | null;
  hotels: Hotel[];
  malhaAerea: QuestionAnswer[];
  alimentacao: {
    questions: QuestionAnswer[];
    restaurantes: NamedRating[];
    alimentacaoGeral: number | null;
  };
  acomodacao: QuestionAnswer[];
  geral: QuestionAnswer[];
  passeios: NamedRating[];
  topAntesViagem: number | null;
  viagemGeral: number | null;
  indicariaTop: number | null;
  assentos: number | null;
  malhaAerea2: number | null;
  assistenciaAeroporto: number | null;
  tempoConexao: number | null;
  dmc1: number | null;
  dmc2: number | null;
  nomeDMC1: string;
  nomeDMC2: string;
  guiasLocais: number | null;
  transfer: number | null;
  materialCriacao: number | null;
  experienciaTop: number | null;
  qualidadeProposta: number | null;
  materiaisComunicacao: number | null;
  gerenteContas: number | null;
  atendimentoCorporativo: number | null;
  rsvp: number | null;
  equipeCampo: number | null;
  viagemGeralCorporativo: number | null;
  servicosTecnologia: number | null;
  longTextComments: LongTextComment[];
}

export const searchRequestSchema = z.object({
  searchId: z.string().min(1, "Por favor, insira um ID"),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

export interface RatingCount {
  rating: number;
  count: number;
  percentage: number;
}

export interface CategoryDistribution {
  category: string;
  totalResponses: number;
  distribution: RatingCount[];
}

export interface RatingDistribution {
  searchId: string;
  tipo: string;
  categories: CategoryDistribution[];
}