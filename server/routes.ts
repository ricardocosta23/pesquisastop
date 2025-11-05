import type { Express } from "express";
import { createServer, type Server } from "http";
import { dbService } from "./db";
import axios from "axios";
import type { TripEvaluation, QuestionAnswer, Hotel, NamedRating, RatingDistribution, CategoryDistribution, RatingCount } from "@shared/schema";

const MONDAY_API_URL = "https://api.monday.com/v2";
const BOARD_ID = "9242892489";

interface MondayColumnValue {
  id: string;
  text?: string;
  value?: string;
  type?: string;
}

interface MondayWebhookPayload {
  event?: {
    type?: string;
    boardId?: number;
    pulseId?: number;
    itemId?: number;
  };
  challenge?: string;
}

async function fetchBoardColumns(boardId: string): Promise<any[]> {
  const apiKey = process.env.MONDAY_API;

  if (!apiKey) {
    throw new Error("MONDAY_API not configured");
  }

  const query = `
    query {
      boards(ids: [${boardId}]) {
        columns {
          id
          title
          type
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      MONDAY_API_URL,
      { query },
      {
        headers: {
          "Authorization": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.errors) {
      console.error("Monday.com API errors:", response.data.errors);
      throw new Error("Failed to fetch board columns from Monday.com");
    }

    const boards = response.data?.data?.boards || [];
    return boards.length > 0 ? boards[0].columns : [];
  } catch (error) {
    console.error("Error fetching board columns from Monday.com:", error);
    throw error;
  }
}

async function fetchItemFromMonday(itemId: string): Promise<any> {
  const apiKey = process.env.MONDAY_API;

  if (!apiKey) {
    throw new Error("MONDAY_API not configured");
  }

  const query = `
    query {
      items(ids: [${itemId}]) {
        id
        name
        board {
          id
        }
        column_values {
          id
          text
          value
          type
          ... on MirrorValue {
            display_value
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      MONDAY_API_URL,
      { query },
      {
        headers: {
          "Authorization": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.errors) {
      console.error("Monday.com API errors:", response.data.errors);
      throw new Error("Failed to fetch item from Monday.com");
    }

    const items = response.data?.data?.items || [];
    return items.length > 0 ? items[0] : null;
  } catch (error) {
    console.error("Error fetching from Monday.com:", error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/webhook/create", async (req, res) => {
    const data: MondayWebhookPayload = req.body;
    const challenge = data?.challenge;

    if (challenge) {
      return res.json({ challenge });
    }

    try {
      console.log("Create webhook received:", JSON.stringify(data, null, 2));

      const itemId = data?.event?.pulseId?.toString() || data?.event?.itemId?.toString();
      const boardId = data?.event?.boardId?.toString() || BOARD_ID;

      if (!itemId) {
        return res.status(400).json({ error: "Item ID is required" });
      }

      // Check if we have column definitions for this board, if not fetch and store them
      const existingColumns = await dbService.getColumnsByBoardId(boardId);

      if (existingColumns.length === 0) {
        console.log(`🔍 First webhook for board ${boardId} - fetching column definitions...`);
        const boardColumns = await fetchBoardColumns(boardId);

        console.log(`Found ${boardColumns.length} columns, storing definitions...`);

        for (const col of boardColumns) {
          await dbService.createColumn({
            boardId: boardId,
            columnId: col.id,
            columnTitle: col.title,
            columnType: col.type,
          });
        }

        console.log(`✓ Stored ${boardColumns.length} column definitions for board ${boardId}`);
      }

      console.log(`Fetching item ${itemId} from Monday.com...`);
      const mondayItem = await fetchItemFromMonday(itemId);

      if (!mondayItem) {
        console.error(`Item ${itemId} not found on Monday.com`);
        return res.status(404).json({ error: "Item not found on Monday.com" });
      }

      console.log(`Found item: ${mondayItem.name} with ${mondayItem.column_values.length} columns`);

      // Transform all column values into a structured object
      const columnValues: Record<string, any> = {};
      for (const col of mondayItem.column_values) {
        columnValues[col.id] = {
          text: col.text || null,
          value: col.value || null,
          type: col.type || null,
        };
      }

      // Apply logic to set tipo (color_mksvhn92) if it's empty
      const tipoValue = columnValues[COLUMN_IDS.tipo]?.text;
      if (!tipoValue || tipoValue.trim() === '') {
        const guiasValue = columnValues['text_mksdvk9t']?.text;
        const corporativoValue = columnValues['text_mkswbqbp']?.text;

        if (guiasValue && guiasValue.trim() !== '') {
          columnValues[COLUMN_IDS.tipo] = {
            text: 'Guias',
            value: JSON.stringify({ label: 'Guias' }),
            type: 'color',
          };
          console.log(`✓ Set tipo to "Guias" based on text_mksdvk9t`);
        } else if (corporativoValue && corporativoValue.trim() !== '') {
          columnValues[COLUMN_IDS.tipo] = {
            text: 'Corporativo',
            value: JSON.stringify({ label: 'Corporativo' }),
            type: 'color',
          };
          console.log(`✓ Set tipo to "Corporativo" based on text_mkswbqbp`);
        } else {
          columnValues[COLUMN_IDS.tipo] = {
            text: 'Convidados',
            value: JSON.stringify({ label: 'Convidados' }),
            type: 'color',
          };
          console.log(`✓ Set tipo to "Convidados" (default)`);
        }
      }

      console.log(`Processed ${Object.keys(columnValues).length} column values`);

      const existingItem = await dbService.getItemByMondayId(itemId);

      if (existingItem) {
        await dbService.updateItem(itemId, columnValues);
        console.log(`✓ Updated item ${itemId} in database with all columns`);
      } else {
        await dbService.createItem({
          mondayItemId: itemId,
          boardId: mondayItem.board.id.toString(),
          itemName: mondayItem.name,
          columnValues: columnValues,
        });
        console.log(`✓ Created item ${itemId} in database with all columns`);
      }

      return res.json({
        success: true,
        message: "Item created/updated successfully",
        itemId
      });
    } catch (error) {
      console.error("Error processing create webhook:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Error processing webhook"
      });
    }
  });

  app.post("/api/webhook/delete", async (req, res) => {
    const data: MondayWebhookPayload = req.body;
    const challenge = data?.challenge;

    if (challenge) {
      return res.json({ challenge });
    }

    try {
      console.log("Delete webhook received:", JSON.stringify(data, null, 2));

      const itemId = data?.event?.pulseId?.toString() || data?.event?.itemId?.toString();

      if (!itemId) {
        return res.status(400).json({ error: "Item ID is required" });
      }

      const deleted = await dbService.deleteItem(itemId);

      if (deleted) {
        console.log(`✓ Deleted item ${itemId} from database`);
        return res.json({
          success: true,
          message: "Item deleted successfully",
          itemId
        });
      } else {
        console.log(`⚠ Item ${itemId} not found in database`);
        return res.status(404).json({
          error: "Item not found in database",
          itemId
        });
      }
    } catch (error) {
      console.error("Error processing delete webhook:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Error processing webhook"
      });
    }
  });

  app.post("/api/salvarchave", async (req, res) => {
    const data: MondayWebhookPayload = req.body;
    const challenge = data?.challenge;

    if (challenge) {
      return res.json({ challenge });
    }

    try {
      console.log("Salvarchave webhook received:", JSON.stringify(data, null, 2));

      const itemId = data?.event?.pulseId?.toString() || data?.event?.itemId?.toString();

      if (!itemId) {
        return res.status(400).json({ error: "Item ID is required" });
      }

      console.log(`Fetching item ${itemId} from Monday.com for chave data...`);
      const mondayItem = await fetchItemFromMonday(itemId);

      if (!mondayItem) {
        console.error(`Item ${itemId} not found on Monday.com`);
        return res.status(404).json({ error: "Item not found on Monday.com" });
      }

      const columnValues: Record<string, any> = {};
      for (const col of mondayItem.column_values) {
        columnValues[col.id] = {
          text: col.text || null,
          value: col.value || null,
          type: col.type || null,
          display_value: col.display_value || null,
        };
      }

      // Query mirror column lookup_mkrkwqep for numero de negocio
      const numeroDeNegocio = columnValues["lookup_mkrkwqep"]?.display_value || columnValues["lookup_mkrkwqep"]?.text;
      // Get chave from text_mkxd7q83 column
      const chave = columnValues["text_mkxd7q83"]?.text;

      if (!numeroDeNegocio) {
        console.error("Numero de negocio not found in item data");
        return res.status(400).json({ error: "Numero de negocio not found in item" });
      }

      if (!chave) {
        console.error("Chave not found in item data");
        return res.status(400).json({ error: "Chave not found in item" });
      }

      const deletedCount = await dbService.deleteChavesByItemId(itemId);
      console.log(`✓ Deleted ${deletedCount} existing chave(s) for item ${itemId}`);

      const newChave = await dbService.createChave({
        itemId: itemId,
        numeroDeNegocio: numeroDeNegocio,
        chave: chave,
      });

      console.log(`✓ Created new chave for item ${itemId}: ${chave}`);

      return res.json({
        success: true,
        message: "Chave saved successfully",
        itemId,
        numeroDeNegocio,
        chave,
        deletedCount,
      });
    } catch (error) {
      console.error("Error processing salvarchave webhook:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Error processing salvarchave webhook"
      });
    }
  });

  app.get("/api/items", async (req, res) => {
    try {
      const items = await dbService.getAllItems();
      return res.json({
        success: true,
        count: items.length,
        items
      });
    } catch (error) {
      console.error("Error fetching items:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Error fetching items"
      });
    }
  });

  app.get("/api/items/:mondayItemId", async (req, res) => {
    try {
      const { mondayItemId } = req.params;
      const item = await dbService.getItemByMondayId(mondayItemId);

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      return res.json({
        success: true,
        item
      });
    } catch (error) {
      console.error("Error fetching item:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Error fetching item"
      });
    }
  });

  app.get("/api/columns", async (req, res) => {
    try {
      const columns = await dbService.getAllColumns();
      return res.json({
        success: true,
        count: columns.length,
        columns
      });
    } catch (error) {
      console.error("Error fetching columns:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Error fetching columns"
      });
    }
  });

  app.get("/api/columns/board/:boardId", async (req, res) => {
    try {
      const { boardId } = req.params;
      const columns = await dbService.getColumnsByBoardId(boardId);
      return res.json({
        success: true,
        count: columns.length,
        boardId,
        columns
      });
    } catch (error) {
      console.error("Error fetching board columns:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Error fetching board columns"
      });
    }
  });

  function getTextValue(columnValues: any, columnId: string): string {
    return columnValues[columnId]?.text || "";
  }

  function getNumericValue(columnValues: any, columnId: string): number | null {
    const value = columnValues[columnId]?.text;
    if (!value) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  function getLongTextComments(columnValues: any, items?: any[], tipo?: string): any[] {
    const longTextColumns = tipo === "Guias" ? {
      "Avaliação das companhias aéreas": COLUMN_IDS.avaliacaoCiasAereas,
      "Nome dos guias locais": COLUMN_IDS.nomeGuiasLocais,
      "Comentários sobre os guias locais": COLUMN_IDS.comentariosGuiasLocais,
      "Comentários sobre transfer": COLUMN_IDS.comentariosTransfer,
      "Comentários feitos pelos guias que avaliaram": COLUMN_IDS.comentariosGuia,
      "Sugestões dos guias que avaliaram": COLUMN_IDS.sugestoes,
      "Custos extras?": COLUMN_IDS.quaisCustosExtras,
      "Comentários sobre passeio": COLUMN_IDS.comentarioPasseio,
    } : tipo === "Convidados" ? {
      "Comentários gerais": COLUMN_IDS.comentarios,
      "Sugestões de destinos": COLUMN_IDS.sugestaoDestino,
      "Comentários sobre passeios": COLUMN_IDS.comentarioPasseio,
    } : {
      "Comentários": COLUMN_IDS.comentarios,
      "Sugestão Destino": COLUMN_IDS.sugestaoDestino,
      "Convidados No show": COLUMN_IDS.convidadosNoShow,
      "Avaliação cias aéreas": COLUMN_IDS.avaliacaoCiasAereas,
      "Nome guias locais": COLUMN_IDS.nomeGuiasLocais,
      "Comentários guias locais": COLUMN_IDS.comentariosGuiasLocais,
      "Comentários transfer": COLUMN_IDS.comentariosTransfer,
      "Comentários Guia": COLUMN_IDS.comentariosGuia,
      "Sugestões": COLUMN_IDS.sugestoes,
      "Comentários alimentação": COLUMN_IDS.comentariosAlimentacao,
      "Quais custos extras?": COLUMN_IDS.quaisCustosExtras,
      "Comentário passeio": COLUMN_IDS.comentarioPasseio,
      "Por favor deixe comentários ou sugestões": COLUMN_IDS.comentariosMelhoriasContinuas,
      "Comente experiência": COLUMN_IDS.comenteExperiencia,
      "Comente criação": COLUMN_IDS.comenteCriacao,
      "Comente Qualidade": COLUMN_IDS.comenteQualidade,
    };

    const comments: any[] = [];

    for (const [title, columnId] of Object.entries(longTextColumns)) {
      if (items) {
        const commentsWithAuthors = items
          .map(item => {
            const text = getTextValue(item.columnValues, columnId);
            if (!text || text.trim().length === 0) return null;
            
            const itemTipo = getTextValue(item.columnValues, COLUMN_IDS.tipo);
            let author = '';
            
            if (itemTipo === 'Guias') {
              author = getTextValue(item.columnValues, COLUMN_IDS.nomeGuia);
            } else if (itemTipo === 'Corporativo') {
              author = getTextValue(item.columnValues, COLUMN_IDS.nomeCorporativo);
            }
            
            return { text, author };
          })
          .filter(comment => comment !== null);

        if (commentsWithAuthors.length > 0) {
          const combinedContent = commentsWithAuthors
            .map(c => c!.author ? `${c!.text}\n\n— ${c!.author}` : c!.text)
            .join('\n\n---\n\n');
          
          comments.push({
            title,
            content: combinedContent
          });
        }
      } else {
        const content = getTextValue(columnValues, columnId);
        if (content && content.trim().length > 0) {
          let author = '';
          
          if (tipo === 'Guias') {
            author = getTextValue(columnValues, COLUMN_IDS.nomeGuia);
          } else if (tipo === 'Corporativo') {
            author = getTextValue(columnValues, COLUMN_IDS.nomeCorporativo);
          }
          
          comments.push({ 
            title, 
            content,
            author: author || undefined
          });
        }
      }
    }

    return comments;
  }

  // Column ID mapping from Monday.com board 9242892489
  const COLUMN_IDS = {
    cliente: "text_mkrjdnry",
    destino: "text_mkrb17ct",
    dataViagem: "text_mksq2j87",
    numeroNegocio: "text_mkrkqj1g",
    tipo: "color_mksvhn92",

    // Hotels
    hotel1Name: "text_mkrjf13y",
    hotel1Rating: "numeric_mkrjpfxv",
    hotel2Name: "text_mkrjk4yg",
    hotel2Rating: "numeric_mkrjg1ar",
    hotel3Name: "text_mkwbhmb8",
    hotel3Rating: "numeric_mkwbs9zj",
    hotel4Name: "text_mkwb72y5",
    hotel4Rating: "numeric_mkwbspwv",

    // Passeios
    passeio1Name: "text_mksdf2av",
    passeio1Rating: "numeric_mkrj6132",
    passeio2Name: "text_mksd268p",
    passeio2Rating: "numeric_mksdsjte",
    passeio3Name: "text_mksdr0qv",
    passeio3Rating: "numeric_mksdyxw2",
    passeio4Name: "text_mksdppd8",
    passeio4Rating: "numeric_mksdy42p",
    passeio5Name: "text_mkwb139p",
    passeio5Rating: "numeric_mkwb8wbk",
    passeio6Name: "text_mkwbr83g",
    passeio6Rating: "numeric_mkwbxvtr",
    passeio7Name: "text_mkwbay38",
    passeio7Rating: "numeric_mkwbvrp7",
    passeio8Name: "text_mkwbcdag",
    passeio8Rating: "numeric_mkwbyg53",
    passeio9Name: "text_mkwbae9e",
    passeio9Rating: "numeric_mkwbb4tc",
    passeio10Name: "text_mkwb7sn7",
    passeio10Rating: "numeric_mkwbwt0q",

    // Restaurantes
    rest1Name: "text_mksvnywe",
    rest1Rating: "numeric_mksv5c1r",
    rest2Name: "text_mksvbzw7",
    rest2Rating: "numeric_mksvwpmx",
    rest3Name: "text_mksv90t7",
    rest3Rating: "numeric_mksvw70j",
    rest4Name: "text_mksv7z2r",
    rest4Rating: "numeric_mksvncrj",
    rest5Name: "text_mksv5a0x",
    rest5Rating: "numeric_mksvcc72",
    rest6Name: "text_mkwbx4dw",
    rest6Rating: "numeric_mkwbw80h",
    rest7Name: "text_mkwb3h9m",
    rest7Rating: "numeric_mkwb2tr4",
    rest8Name: "text_mkwbvtja",
    rest8Rating: "numeric_mkwb301n",
    rest9Name: "text_mkwbremc",
    rest9Rating: "numeric_mkwbr94z",
    rest10Name: "text_mkwbacpf",
    rest10Rating: "numeric_mkwbk94v",

    // Ratings
    notaMalhaAerea: "numeric_mkrjqam",
    notaVigemGeral: "numeric_mkrjv5re",
    notaAssentosAdequados: "numeric_mksd3094",
    notaMalhaAerea2: "numeric_mksdw5nf",
    notaAssistenciaAeroporto: "numeric_mksdt1bq",
    notaTempoConexao: "numeric_mksds0py",
    notaDMC1: "numeric_mksdja3e",
    notaDMC2: "numeric_mksdv98h",
    nomeDMC1: "text_mksdhgmp",
    nomeDMC2: "text_mksdaqvj",
    notaGuiasLocais: "numeric_mksdsem2",
    notaTransfer: "numeric_mksd391j",
    notaAlimentacao: "numeric_mksqce6j",
    avaliacaoMaterial: "numeric_mksqebx9",
    notaTopAntesViagem: "numeric_mkw5ggsf",

    // Corporate
    experienciaTop: "numeric_mkswcfyz",
    qualidadeProposta: "numeric_mkswwx18",
    materiaisComunicacao: "numeric_mksw7pb4",
    gerenteContas: "numeric_mkswxtje",
    atendimentoCorporativo: "numeric_mksw2p8t",
    rsvp: "numeric_mksw7wav",
    equipeCampo: "numeric_mkswe8sf",
    servicosTecnologia: "numeric_mksweem",
    viagemGeralCorporativo: "numeric_mkswarb1",
    indicariaTop: "numeric_mkwx31h6",
    avaliacaoBrindes: "numeric_mkwzk7ty",
    avalieDestino: "numeric_mkwzag7t",

    // Long Text Comments
    comentarios: "long_text_mkrjwfwx",
    sugestaoDestino: "long_text_mkrjd4z0",
    convidadosNoShow: "long_text_mksdpbqr",
    avaliacaoCiasAereas: "long_text_mksdw43g",
    nomeGuiasLocais: "long_text_mksdgq94",
    comentariosGuiasLocais: "long_text_mksdg5nd",
    comentariosTransfer: "long_text_mksdxghk",
    comentariosGuia: "long_text_mksdfcf4",
    sugestoes: "long_text_mksdxwh3",
    comentariosAlimentacao: "long_text_mksq9zqr",
    quaisCustosExtras: "long_text_mksq9rnp",
    comentarioPasseio: "long_text_mksvbj9b",
    comentariosMelhoriasContinuas: "long_text_mksw2m76",
    comenteExperiencia: "long_text_mkwbsxh0",
    comenteCriacao: "long_text_mkwb57md",
    comenteQualidade: "long_text_mkwb4g5f",
    
    // Author name columns
    nomeGuia: "text_mksdvk9t",
    nomeCorporativo: "text_mkswbqbp",
  };

  const getCategoryAverage = (categoryName: string, evaluation: TripEvaluation | null): number | null => {
    if (!evaluation) return null;

    const simpleMapping: Record<string, keyof TripEvaluation | null> = {
      'Nota assentos adequados': 'assentos',
      'nota malha aérea': 'malhaAerea2',
      'Nota assistência aeroporto?': 'assistenciaAeroporto',
      'Nota tempo conexão': 'tempoConexao',
      'Nota DMC 1': 'dmc1',
      'Nota DMC 2': 'dmc2',
      'Nota guias locais': 'guiasLocais',
      'Nota transfer': 'transfer',
      'Avaliação material': 'materialCriacao',
      'Nota Top antes viagem': 'topAntesViagem',
      'Nota viagem geral': 'viagemGeral',
      'De 1 a 10, o quanto você indicaria a Top Service para realização de uma futura viagem?': 'indicariaTop',
      'Como foi sua experiência com a Top Service?': 'experienciaTop',
      'Avalie a qualidade e a criatividade da nossa proposta inicial.': 'qualidadeProposta',
      'Avalie a qualidade e a criatividade dos materiais de comunicação? (KV, tags, carta de boas-vindas, banners e outros...)': 'materiaisComunicacao',
      'Avalie o gerente de contas que acompanhou seu projeto': 'gerenteContas',
      'Avalie a qualidade do nosso atendimento corporativo?': 'atendimentoCorporativo',
      'Avalie a qualidade do RSVP (Atendimento ao convidado)': 'rsvp',
      'Avalie a qualidade da equipe de campo? (Guias Top Service)': 'equipeCampo',
      'Qual nota você da para a viagem de uma maneira geral?': 'viagemGeralCorporativo',
      'Avalie nossos serviços de tecnologia.': 'servicosTecnologia',
      'Nota alimentação': 'alimentacao',
      'Como você avalia de os brindes entregues, no seu apartamento?': null,
      'Avalie Destino': null,
    };

    if (categoryName === 'Nota alimentação') {
      return evaluation.alimentacao.alimentacaoGeral;
    }

    const key = simpleMapping[categoryName];
    if (key && evaluation && typeof evaluation[key] === 'number') {
      return evaluation[key] as number;
    }

    // Handle Hotel ratings - match by actual hotel names from evaluation
    if (evaluation?.hotels) {
      for (let i = 0; i < evaluation.hotels.length; i++) {
        if (evaluation.hotels[i].name === categoryName) {
          return evaluation.hotels[i].rating;
        }
      }
    }

    // Handle Passeio ratings - match by actual passeio names from evaluation
    if (evaluation?.passeios) {
      for (let i = 0; i < evaluation.passeios.length; i++) {
        if (evaluation.passeios[i].name === categoryName) {
          return evaluation.passeios[i].rating;
        }
      }
    }

    // Handle Restaurante ratings - match by actual restaurant names from evaluation
    if (evaluation?.alimentacao?.restaurantes) {
      for (let i = 0; i < evaluation.alimentacao.restaurantes.length; i++) {
        if (evaluation.alimentacao.restaurantes[i].name === categoryName) {
          return evaluation.alimentacao.restaurantes[i].rating;
        }
      }
    }

    return null;
  };

  function getAverageRating(items: any[], nameColumnId: string, ratingColumnId: string, targetName: string): number | null {
    const ratings: number[] = [];

    for (const item of items) {
      const name = getTextValue(item.columnValues, nameColumnId);
      const rating = getNumericValue(item.columnValues, ratingColumnId);

      if (name === targetName && rating !== null) {
        ratings.push(rating);
      }
    }

    if (ratings.length === 0) return null;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  }

  function getAverageSimpleRating(items: any[], columnId: string): number | null {
    const ratings: number[] = [];

    for (const item of items) {
      const rating = getNumericValue(item.columnValues, columnId);
      if (rating !== null) {
        ratings.push(rating);
      }
    }

    if (ratings.length === 0) return null;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  }

  function transformToTripEvaluationWithAggregation(items: any[], tipo: string): TripEvaluation {
    const firstItem = items[0];
    const cv = firstItem.columnValues;

    // Collect all unique hotels, passeios, and restaurantes across all items
    const hotelNames = new Set<string>();
    const passeioNames = new Set<string>();
    const restauranteNames = new Set<string>();

    for (const item of items) {
      const itemCv = item.columnValues;

      [COLUMN_IDS.hotel1Name, COLUMN_IDS.hotel2Name, COLUMN_IDS.hotel3Name, COLUMN_IDS.hotel4Name].forEach(colId => {
        const name = getTextValue(itemCv, colId);
        if (name) hotelNames.add(name);
      });

      [
        COLUMN_IDS.passeio1Name, COLUMN_IDS.passeio2Name, COLUMN_IDS.passeio3Name, COLUMN_IDS.passeio4Name,
        COLUMN_IDS.passeio5Name, COLUMN_IDS.passeio6Name, COLUMN_IDS.passeio7Name, COLUMN_IDS.passeio8Name,
        COLUMN_IDS.passeio9Name, COLUMN_IDS.passeio10Name
      ].forEach(colId => {
        const name = getTextValue(itemCv, colId);
        if (name) passeioNames.add(name);
      });

      [
        COLUMN_IDS.rest1Name, COLUMN_IDS.rest2Name, COLUMN_IDS.rest3Name, COLUMN_IDS.rest4Name,
        COLUMN_IDS.rest5Name, COLUMN_IDS.rest6Name, COLUMN_IDS.rest7Name, COLUMN_IDS.rest8Name,
        COLUMN_IDS.rest9Name, COLUMN_IDS.rest10Name
      ].forEach(colId => {
        const name = getTextValue(itemCv, colId);
        if (name) restauranteNames.add(name);
      });
    }

    // Build hotels with aggregated ratings
    const hotels: Hotel[] = Array.from(hotelNames).map(name => {
      const ratings: number[] = [];
      for (const item of items) {
        const itemCv = item.columnValues;
        [
          { name: COLUMN_IDS.hotel1Name, rating: COLUMN_IDS.hotel1Rating },
          { name: COLUMN_IDS.hotel2Name, rating: COLUMN_IDS.hotel2Rating },
          { name: COLUMN_IDS.hotel3Name, rating: COLUMN_IDS.hotel3Rating },
          { name: COLUMN_IDS.hotel4Name, rating: COLUMN_IDS.hotel4Rating },
        ].forEach(({ name: nameCol, rating: ratingCol }) => {
          if (getTextValue(itemCv, nameCol) === name) {
            const rating = getNumericValue(itemCv, ratingCol);
            if (rating !== null) ratings.push(rating);
          }
        });
      }
      const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;
      return { name, rating: avgRating };
    });

    // Build passeios with aggregated ratings
    const passeios: NamedRating[] = Array.from(passeioNames).map(name => {
      const ratings: number[] = [];
      for (const item of items) {
        const itemCv = item.columnValues;
        [
          { name: COLUMN_IDS.passeio1Name, rating: COLUMN_IDS.passeio1Rating },
          { name: COLUMN_IDS.passeio2Name, rating: COLUMN_IDS.passeio2Rating },
          { name: COLUMN_IDS.passeio3Name, rating: COLUMN_IDS.passeio3Rating },
          { name: COLUMN_IDS.passeio4Name, rating: COLUMN_IDS.passeio4Rating },
          { name: COLUMN_IDS.passeio5Name, rating: COLUMN_IDS.passeio5Rating },
          { name: COLUMN_IDS.passeio6Name, rating: COLUMN_IDS.passeio6Rating },
          { name: COLUMN_IDS.passeio7Name, rating: COLUMN_IDS.passeio7Rating },
          { name: COLUMN_IDS.passeio8Name, rating: COLUMN_IDS.passeio8Rating },
          { name: COLUMN_IDS.passeio9Name, rating: COLUMN_IDS.passeio9Rating },
          { name: COLUMN_IDS.passeio10Name, rating: COLUMN_IDS.passeio10Rating },
        ].forEach(({ name: nameCol, rating: ratingCol }) => {
          if (getTextValue(itemCv, nameCol) === name) {
            const rating = getNumericValue(itemCv, ratingCol);
            if (rating !== null) ratings.push(rating);
          }
        });
      }
      const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;
      return { name, rating: avgRating };
    });

    // Build restaurantes with aggregated ratings
    const restaurantes: NamedRating[] = Array.from(restauranteNames).map(name => {
      const ratings: number[] = [];
      for (const item of items) {
        const itemCv = item.columnValues;
        [
          { name: COLUMN_IDS.rest1Name, rating: COLUMN_IDS.rest1Rating },
          { name: COLUMN_IDS.rest2Name, rating: COLUMN_IDS.rest2Rating },
          { name: COLUMN_IDS.rest3Name, rating: COLUMN_IDS.rest3Rating },
          { name: COLUMN_IDS.rest4Name, rating: COLUMN_IDS.rest4Rating },
          { name: COLUMN_IDS.rest5Name, rating: COLUMN_IDS.rest5Rating },
          { name: COLUMN_IDS.rest6Name, rating: COLUMN_IDS.rest6Rating },
          { name: COLUMN_IDS.rest7Name, rating: COLUMN_IDS.rest7Rating },
          { name: COLUMN_IDS.rest8Name, rating: COLUMN_IDS.rest8Rating },
          { name: COLUMN_IDS.rest9Name, rating: COLUMN_IDS.rest9Rating },
          { name: COLUMN_IDS.rest10Name, rating: COLUMN_IDS.rest10Rating },
        ].forEach(({ name: nameCol, rating: ratingCol }) => {
          if (getTextValue(itemCv, nameCol) === name) {
            const rating = getNumericValue(itemCv, ratingCol);
            if (rating !== null) ratings.push(rating);
          }
        });
      }
      const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;
      return { name, rating: avgRating };
    });

    const malhaAerea: QuestionAnswer[] = [];
    const alimentacao: QuestionAnswer[] = [];
    const acomodacao: QuestionAnswer[] = [];
    const geral: QuestionAnswer[] = [];

    for (const [columnId, data] of Object.entries(cv) as [string, any][]) {
      if (data.type === "text" && data.text) {
        const question = data.text;
        if (question && question.length > 10) {
          const lowerQ = question.toLowerCase();
          if (lowerQ.includes("malha") || lowerQ.includes("aérea") || lowerQ.includes("voo")) {
            malhaAerea.push({ question, answer: data.text });
          } else if (lowerQ.includes("alimentação") || lowerQ.includes("restaurante") || lowerQ.includes("comida")) {
            alimentacao.push({ question, answer: data.text });
          } else if (lowerQ.includes("acomodação") || lowerQ.includes("hotel")) {
            acomodacao.push({ question, answer: data.text });
          } else {
            geral.push({ question, answer: data.text });
          }
        }
      }
    }

    return {
      id: firstItem.mondayItemId,
      cliente: getTextValue(cv, COLUMN_IDS.cliente),
      destino: getTextValue(cv, COLUMN_IDS.destino),
      dataViagem: getTextValue(cv, COLUMN_IDS.dataViagem),
      hotels,
      malhaAerea,
      alimentacao: {
        questions: alimentacao,
        restaurantes,
        alimentacaoGeral: getAverageSimpleRating(items, COLUMN_IDS.notaAlimentacao),
      },
      acomodacao,
      geral,
      passeios,
      topAntesViagem: getAverageSimpleRating(items, COLUMN_IDS.notaTopAntesViagem),
      viagemGeral: getAverageSimpleRating(items, COLUMN_IDS.notaVigemGeral),
      indicariaTop: getAverageSimpleRating(items, COLUMN_IDS.indicariaTop),
      assentos: getAverageSimpleRating(items, COLUMN_IDS.notaAssentosAdequados),
      malhaAerea2: getAverageSimpleRating(items, COLUMN_IDS.notaMalhaAerea2),
      assistenciaAeroporto: getAverageSimpleRating(items, COLUMN_IDS.notaAssistenciaAeroporto),
      tempoConexao: getAverageSimpleRating(items, COLUMN_IDS.notaTempoConexao),
      dmc1: getAverageSimpleRating(items, COLUMN_IDS.notaDMC1),
      dmc2: getAverageSimpleRating(items, COLUMN_IDS.notaDMC2),
      nomeDMC1: getTextValue(firstItem.columnValues, COLUMN_IDS.nomeDMC1),
      nomeDMC2: getTextValue(firstItem.columnValues, COLUMN_IDS.nomeDMC2),
      guiasLocais: getAverageSimpleRating(items, COLUMN_IDS.notaGuiasLocais),
      transfer: getAverageSimpleRating(items, COLUMN_IDS.notaTransfer),
      materialCriacao: getAverageSimpleRating(items, COLUMN_IDS.avaliacaoMaterial),
      experienciaTop: getAverageSimpleRating(items, COLUMN_IDS.experienciaTop),
      qualidadeProposta: getAverageSimpleRating(items, COLUMN_IDS.qualidadeProposta),
      materiaisComunicacao: getAverageSimpleRating(items, COLUMN_IDS.materiaisComunicacao),
      gerenteContas: getAverageSimpleRating(items, COLUMN_IDS.gerenteContas),
      atendimentoCorporativo: getAverageSimpleRating(items, COLUMN_IDS.atendimentoCorporativo),
      rsvp: getAverageSimpleRating(items, COLUMN_IDS.rsvp),
      equipeCampo: getAverageSimpleRating(items, COLUMN_IDS.equipeCampo),
      viagemGeralCorporativo: getAverageSimpleRating(items, COLUMN_IDS.viagemGeralCorporativo),
      servicosTecnologia: getAverageSimpleRating(items, COLUMN_IDS.servicosTecnologia),
      longTextComments: getLongTextComments(cv, items, tipo),
    };
  }

  function transformToTripEvaluation(item: any, tipo: string): TripEvaluation {
    const cv = item.columnValues;

    const hotels: Hotel[] = [
      { name: getTextValue(cv, COLUMN_IDS.hotel1Name), rating: getNumericValue(cv, COLUMN_IDS.hotel1Rating) },
      { name: getTextValue(cv, COLUMN_IDS.hotel2Name), rating: getNumericValue(cv, COLUMN_IDS.hotel2Rating) },
      { name: getTextValue(cv, COLUMN_IDS.hotel3Name), rating: getNumericValue(cv, COLUMN_IDS.hotel3Rating) },
      { name: getTextValue(cv, COLUMN_IDS.hotel4Name), rating: getNumericValue(cv, COLUMN_IDS.hotel4Rating) },
    ].filter(h => h.name);

    const passeios: NamedRating[] = [
      { name: getTextValue(cv, COLUMN_IDS.passeio1Name), rating: getNumericValue(cv, COLUMN_IDS.passeio1Rating) },
      { name: getTextValue(cv, COLUMN_IDS.passeio2Name), rating: getNumericValue(cv, COLUMN_IDS.passeio2Rating) },
      { name: getTextValue(cv, COLUMN_IDS.passeio3Name), rating: getNumericValue(cv, COLUMN_IDS.passeio3Rating) },
      { name: getTextValue(cv, COLUMN_IDS.passeio4Name), rating: getNumericValue(cv, COLUMN_IDS.passeio4Rating) },
      { name: getTextValue(cv, COLUMN_IDS.passeio5Name), rating: getNumericValue(cv, COLUMN_IDS.passeio5Rating) },
      { name: getTextValue(cv, COLUMN_IDS.passeio6Name), rating: getNumericValue(cv, COLUMN_IDS.passeio6Rating) },
      { name: getTextValue(cv, COLUMN_IDS.passeio7Name), rating: getNumericValue(cv, COLUMN_IDS.passeio7Rating) },
      { name: getTextValue(cv, COLUMN_IDS.passeio8Name), rating: getNumericValue(cv, COLUMN_IDS.passeio8Rating) },
      { name: getTextValue(cv, COLUMN_IDS.passeio9Name), rating: getNumericValue(cv, COLUMN_IDS.passeio9Rating) },
      { name: getTextValue(cv, COLUMN_IDS.passeio10Name), rating: getNumericValue(cv, COLUMN_IDS.passeio10Rating) },
    ].filter(p => p.name);

    const restaurantes: NamedRating[] = [
      { name: getTextValue(cv, COLUMN_IDS.rest1Name), rating: getNumericValue(cv, COLUMN_IDS.rest1Rating) },
      { name: getTextValue(cv, COLUMN_IDS.rest2Name), rating: getNumericValue(cv, COLUMN_IDS.rest2Rating) },
      { name: getTextValue(cv, COLUMN_IDS.rest3Name), rating: getNumericValue(cv, COLUMN_IDS.rest3Rating) },
      { name: getTextValue(cv, COLUMN_IDS.rest4Name), rating: getNumericValue(cv, COLUMN_IDS.rest4Rating) },
      { name: getTextValue(cv, COLUMN_IDS.rest5Name), rating: getNumericValue(cv, COLUMN_IDS.rest5Rating) },
      { name: getTextValue(cv, COLUMN_IDS.rest6Name), rating: getNumericValue(cv, COLUMN_IDS.rest6Rating) },
      { name: getTextValue(cv, COLUMN_IDS.rest7Name), rating: getNumericValue(cv, COLUMN_IDS.rest7Rating) },
      { name: getTextValue(cv, COLUMN_IDS.rest8Name), rating: getNumericValue(cv, COLUMN_IDS.rest8Rating) },
      { name: getTextValue(cv, COLUMN_IDS.rest9Name), rating: getNumericValue(cv, COLUMN_IDS.rest9Rating) },
      { name: getTextValue(cv, COLUMN_IDS.rest10Name), rating: getNumericValue(cv, COLUMN_IDS.rest10Rating) },
    ].filter(r => r.name);

    const malhaAerea: QuestionAnswer[] = [];
    const alimentacao: QuestionAnswer[] = [];
    const acomodacao: QuestionAnswer[] = [];
    const geral: QuestionAnswer[] = [];

    for (const [columnId, data] of Object.entries(cv) as [string, any][]) {
      if (data.type === "text" && data.text) {
        const question = data.text;
        if (question && question.length > 10) {
          const lowerQ = question.toLowerCase();
          if (lowerQ.includes("malha") || lowerQ.includes("aérea") || lowerQ.includes("voo")) {
            malhaAerea.push({ question, answer: data.text });
          } else if (lowerQ.includes("alimentação") || lowerQ.includes("restaurante") || lowerQ.includes("comida")) {
            alimentacao.push({ question, answer: data.text });
          } else if (lowerQ.includes("acomodação") || lowerQ.includes("hotel")) {
            acomodacao.push({ question, answer: data.text });
          } else {
            geral.push({ question, answer: data.text });
          }
        }
      }
    }

    return {
      id: item.mondayItemId,
      cliente: getTextValue(cv, COLUMN_IDS.cliente),
      destino: getTextValue(cv, COLUMN_IDS.destino),
      dataViagem: getTextValue(cv, COLUMN_IDS.dataViagem),
      hotels,
      malhaAerea,
      alimentacao: {
        questions: alimentacao,
        restaurantes,
        alimentacaoGeral: getNumericValue(cv, COLUMN_IDS.notaAlimentacao),
      },
      acomodacao,
      geral,
      passeios,
      topAntesViagem: getNumericValue(cv, COLUMN_IDS.notaTopAntesViagem),
      viagemGeral: getNumericValue(cv, COLUMN_IDS.notaVigemGeral),
      indicariaTop: getNumericValue(cv, COLUMN_IDS.indicariaTop),
      assentos: getNumericValue(cv, COLUMN_IDS.notaAssentosAdequados),
      malhaAerea2: getNumericValue(cv, COLUMN_IDS.notaMalhaAerea2),
      assistenciaAeroporto: getNumericValue(cv, COLUMN_IDS.notaAssistenciaAeroporto),
      tempoConexao: getNumericValue(cv, COLUMN_IDS.notaTempoConexao),
      dmc1: getNumericValue(cv, COLUMN_IDS.notaDMC1),
      dmc2: getNumericValue(cv, COLUMN_IDS.notaDMC2),
      nomeDMC1: getTextValue(cv, COLUMN_IDS.nomeDMC1),
      nomeDMC2: getTextValue(cv, COLUMN_IDS.nomeDMC2),
      guiasLocais: getNumericValue(cv, COLUMN_IDS.notaGuiasLocais),
      transfer: getNumericValue(cv, COLUMN_IDS.notaTransfer),
      materialCriacao: getNumericValue(cv, COLUMN_IDS.avaliacaoMaterial),
      experienciaTop: getNumericValue(cv, COLUMN_IDS.experienciaTop),
      qualidadeProposta: getNumericValue(cv, COLUMN_IDS.qualidadeProposta),
      materiaisComunicacao: getNumericValue(cv, COLUMN_IDS.materiaisComunicacao),
      gerenteContas: getNumericValue(cv, COLUMN_IDS.gerenteContas),
      atendimentoCorporativo: getNumericValue(cv, COLUMN_IDS.atendimentoCorporativo),
      rsvp: getNumericValue(cv, COLUMN_IDS.rsvp),
      equipeCampo: getNumericValue(cv, COLUMN_IDS.equipeCampo),
      viagemGeralCorporativo: getNumericValue(cv, COLUMN_IDS.viagemGeralCorporativo),
      servicosTecnologia: getNumericValue(cv, COLUMN_IDS.servicosTecnologia),
      longTextComments: getLongTextComments(cv, undefined, tipo),
    };
  }

  app.get("/api/evaluation/:searchId", async (req, res) => {
    try {
      const { searchId } = req.params;
      const { type } = req.query;

      if (!searchId || !type) {
        return res.status(400).json({ error: "searchId e type são obrigatórios" });
      }

      const tipo = type as string;

      // Get all items that match this numero de negocio and tipo
      const allItems = await dbService.getAllItemsByTipo(tipo);
      const matchingItems = allItems.filter(item => {
        const numeroNegocio = getTextValue(item.columnValues, COLUMN_IDS.numeroNegocio);
        return numeroNegocio === searchId;
      });

      if (matchingItems.length === 0) {
        return res.status(404).json({ error: "Avaliação não encontrada" });
      }

      console.log(`Found ${matchingItems.length} items for numero de negocio ${searchId}`);

      // Use the first item for non-numeric data, but aggregate all numeric ratings
      const firstItem = matchingItems[0];
      const evaluation = transformToTripEvaluationWithAggregation(matchingItems, tipo);

      return res.json(evaluation);
    } catch (error) {
      console.error("Error fetching evaluation:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Erro ao buscar avaliação"
      });
    }
  });

  app.get("/api/rating-distribution/:searchId", async (req, res) => {
    try {
      const { searchId } = req.params;
      const { type } = req.query;

      if (!searchId || !type) {
        return res.status(400).json({ error: "searchId e type são obrigatórios" });
      }

      const tipo = type as string;

      // Get all items that match this numero de negocio (searchId) and tipo
      const allItems = await dbService.getAllItemsByTipo(tipo);
      const matchingItems = allItems.filter(item => {
        const numeroNegocio = getTextValue(item.columnValues, COLUMN_IDS.numeroNegocio);
        return numeroNegocio === searchId;
      });

      if (matchingItems.length === 0) {
        return res.status(404).json({ error: "Nenhum item encontrado para este número de negócio" });
      }

      console.log(`Found ${matchingItems.length} items for numero de negocio ${searchId}`);

      const categories: CategoryDistribution[] = [];

      // Column ID to display name mapping
      const columnMapping: Record<string, string> = {
        [COLUMN_IDS.hotel1Name]: COLUMN_IDS.hotel1Rating,
        [COLUMN_IDS.hotel2Name]: COLUMN_IDS.hotel2Rating,
        [COLUMN_IDS.hotel3Name]: COLUMN_IDS.hotel3Rating,
        [COLUMN_IDS.hotel4Name]: COLUMN_IDS.hotel4Rating,
        [COLUMN_IDS.passeio1Name]: COLUMN_IDS.passeio1Rating,
        [COLUMN_IDS.passeio2Name]: COLUMN_IDS.passeio2Rating,
        [COLUMN_IDS.passeio3Name]: COLUMN_IDS.passeio3Rating,
        [COLUMN_IDS.passeio4Name]: COLUMN_IDS.passeio4Rating,
        [COLUMN_IDS.passeio5Name]: COLUMN_IDS.passeio5Rating,
        [COLUMN_IDS.passeio6Name]: COLUMN_IDS.passeio6Rating,
        [COLUMN_IDS.passeio7Name]: COLUMN_IDS.passeio7Rating,
        [COLUMN_IDS.passeio8Name]: COLUMN_IDS.passeio8Rating,
        [COLUMN_IDS.passeio9Name]: COLUMN_IDS.passeio9Rating,
        [COLUMN_IDS.passeio10Name]: COLUMN_IDS.passeio10Rating,
        [COLUMN_IDS.rest1Name]: COLUMN_IDS.rest1Rating,
        [COLUMN_IDS.rest2Name]: COLUMN_IDS.rest2Rating,
        [COLUMN_IDS.rest3Name]: COLUMN_IDS.rest3Rating,
        [COLUMN_IDS.rest4Name]: COLUMN_IDS.rest4Rating,
        [COLUMN_IDS.rest5Name]: COLUMN_IDS.rest5Rating,
        [COLUMN_IDS.rest6Name]: COLUMN_IDS.rest6Rating,
        [COLUMN_IDS.rest7Name]: COLUMN_IDS.rest7Rating,
        [COLUMN_IDS.rest8Name]: COLUMN_IDS.rest8Rating,
        [COLUMN_IDS.rest9Name]: COLUMN_IDS.rest9Rating,
        [COLUMN_IDS.rest10Name]: COLUMN_IDS.rest10Rating,
      };

      // Process named entities (hotels, passeios, restaurantes)
      for (const [nameColumnId, ratingColumnId] of Object.entries(columnMapping)) {
        const ratingsMap = new Map<string, number[]>();

        for (const item of matchingItems) {
          const name = getTextValue(item.columnValues, nameColumnId);
          const rating = getNumericValue(item.columnValues, ratingColumnId);

          if (name && rating !== null) {
            if (!ratingsMap.has(name)) {
              ratingsMap.set(name, []);
            }
            ratingsMap.get(name)!.push(rating);
          }
        }

        for (const [name, ratings] of Array.from(ratingsMap.entries())) {
          const distribution: RatingCount[] = [];
          for (let rating = 1; rating <= 10; rating++) {
            const count = ratings.filter((r: number) => r === rating).length;
            const percentage = (count / ratings.length) * 100;
            distribution.push({ rating, count, percentage });
          }

          categories.push({
            category: name,
            totalResponses: ratings.length,
            distribution,
          });
        }
      }

      // Get DMC names from first matching item
      const firstItem = matchingItems[0];
      const dmc1Name = getTextValue(firstItem.columnValues, COLUMN_IDS.nomeDMC1) || 'DMC 1';
      const dmc2Name = getTextValue(firstItem.columnValues, COLUMN_IDS.nomeDMC2) || 'DMC 2';

      // Process simple rating fields
      const simpleRatingFields: Record<string, string> = {
        [COLUMN_IDS.notaMalhaAerea]: 'Nota Malha Aérea',
        [COLUMN_IDS.notaAssentosAdequados]: 'Assentos',
        [COLUMN_IDS.notaMalhaAerea2]: 'Malha Aérea',
        [COLUMN_IDS.notaAssistenciaAeroporto]: 'Assistência Aeroporto',
        [COLUMN_IDS.notaTempoConexao]: 'Tempo Conexão',
        [COLUMN_IDS.notaDMC1]: dmc1Name,
        [COLUMN_IDS.notaDMC2]: dmc2Name,
        [COLUMN_IDS.notaGuiasLocais]: 'Guias Locais',
        [COLUMN_IDS.notaTransfer]: 'Transfer',
        [COLUMN_IDS.avaliacaoMaterial]: 'Material Criação',
        [COLUMN_IDS.notaAlimentacao]: 'Alimentação',
        [COLUMN_IDS.experienciaTop]: 'Experiência com a Top',
        [COLUMN_IDS.qualidadeProposta]: 'Qualidade e Criatividade da Proposta',
        [COLUMN_IDS.materiaisComunicacao]: 'Materiais Comunicação',
        [COLUMN_IDS.gerenteContas]: 'Gerente de Contas',
        [COLUMN_IDS.atendimentoCorporativo]: 'Atendimento Corporativo',
        [COLUMN_IDS.rsvp]: 'RSVP',
        [COLUMN_IDS.equipeCampo]: 'Equipe de Campo',
        [COLUMN_IDS.viagemGeralCorporativo]: 'Viagem em Geral',
        [COLUMN_IDS.servicosTecnologia]: 'Serviços de Tecnologia',
        [COLUMN_IDS.indicariaTop]: 'Indicaria a Top?',
        [COLUMN_IDS.notaTopAntesViagem]: 'Top Antes da Viagem',
        [COLUMN_IDS.notaVigemGeral]: 'Viagem Geral',
      };

      for (const [columnId, displayName] of Object.entries(simpleRatingFields)) {
        const ratings: number[] = [];

        for (const item of matchingItems) {
          const rating = getNumericValue(item.columnValues, columnId);
          if (rating !== null) {
            ratings.push(rating);
          }
        }

        if (ratings.length > 0) {
          const distribution: RatingCount[] = [];
          for (let rating = 1; rating <= 10; rating++) {
            const count = ratings.filter(r => r === rating).length;
            const percentage = (count / ratings.length) * 100;
            distribution.push({ rating, count, percentage });
          }

          categories.push({
            category: displayName,
            totalResponses: ratings.length,
            distribution,
          });
        }
      }

      const ratingDistribution: RatingDistribution = {
        searchId,
        tipo,
        categories,
      };

      return res.json(ratingDistribution);
    } catch (error) {
      console.error("Error fetching rating distribution:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Erro ao buscar distribuição"
      });
    }
  });

  app.get("/api/pesquisas-top/evaluation/:chave", async (req, res) => {
    try {
      const { chave } = req.params;

      if (!chave) {
        return res.status(400).json({ error: "Chave é obrigatória" });
      }

      const chaveRecord = await dbService.getChaveByValue(chave);
      
      if (!chaveRecord) {
        return res.status(404).json({ error: "Chave não encontrada" });
      }

      const numeroDeNegocio = chaveRecord.numeroDeNegocio;
      const tipo = "Convidados";

      console.log(`Found numero de negocio ${numeroDeNegocio} for chave ${chave}, searching with tipo ${tipo}`);

      const allItems = await dbService.getAllItemsByTipo(tipo);
      const matchingItems = allItems.filter(item => {
        const numeroNegocio = getTextValue(item.columnValues, COLUMN_IDS.numeroNegocio);
        return numeroNegocio === numeroDeNegocio;
      });

      if (matchingItems.length === 0) {
        return res.status(404).json({ error: "Nenhuma avaliação encontrada para esta chave" });
      }

      console.log(`Found ${matchingItems.length} items for chave ${chave} (numero ${numeroDeNegocio})`);

      const evaluation = transformToTripEvaluationWithAggregation(matchingItems, tipo);

      return res.json(evaluation);
    } catch (error) {
      console.error("Error fetching pesquisas-top evaluation:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Erro ao buscar avaliação"
      });
    }
  });

  app.get("/api/pesquisas-top/distribution/:chave", async (req, res) => {
    try {
      const { chave } = req.params;

      if (!chave) {
        return res.status(400).json({ error: "Chave é obrigatória" });
      }

      const chaveRecord = await dbService.getChaveByValue(chave);
      
      if (!chaveRecord) {
        return res.status(404).json({ error: "Chave não encontrada" });
      }

      const numeroDeNegocio = chaveRecord.numeroDeNegocio;
      const tipo = "Convidados";

      console.log(`Found numero de negocio ${numeroDeNegocio} for chave ${chave}, getting distribution with tipo ${tipo}`);

      const allItems = await dbService.getAllItemsByTipo(tipo);
      const matchingItems = allItems.filter(item => {
        const numeroNegocio = getTextValue(item.columnValues, COLUMN_IDS.numeroNegocio);
        return numeroNegocio === numeroDeNegocio;
      });

      if (matchingItems.length === 0) {
        return res.status(404).json({ error: "Nenhuma avaliação encontrada para esta chave" });
      }

      console.log(`Found ${matchingItems.length} items for chave ${chave}`);

      const categories: CategoryDistribution[] = [];

      const columnMapping: Record<string, string> = {
        [COLUMN_IDS.hotel1Name]: COLUMN_IDS.hotel1Rating,
        [COLUMN_IDS.hotel2Name]: COLUMN_IDS.hotel2Rating,
        [COLUMN_IDS.hotel3Name]: COLUMN_IDS.hotel3Rating,
        [COLUMN_IDS.hotel4Name]: COLUMN_IDS.hotel4Rating,
        [COLUMN_IDS.passeio1Name]: COLUMN_IDS.passeio1Rating,
        [COLUMN_IDS.passeio2Name]: COLUMN_IDS.passeio2Rating,
        [COLUMN_IDS.passeio3Name]: COLUMN_IDS.passeio3Rating,
        [COLUMN_IDS.passeio4Name]: COLUMN_IDS.passeio4Rating,
        [COLUMN_IDS.passeio5Name]: COLUMN_IDS.passeio5Rating,
        [COLUMN_IDS.passeio6Name]: COLUMN_IDS.passeio6Rating,
        [COLUMN_IDS.passeio7Name]: COLUMN_IDS.passeio7Rating,
        [COLUMN_IDS.passeio8Name]: COLUMN_IDS.passeio8Rating,
        [COLUMN_IDS.passeio9Name]: COLUMN_IDS.passeio9Rating,
        [COLUMN_IDS.passeio10Name]: COLUMN_IDS.passeio10Rating,
        [COLUMN_IDS.rest1Name]: COLUMN_IDS.rest1Rating,
        [COLUMN_IDS.rest2Name]: COLUMN_IDS.rest2Rating,
        [COLUMN_IDS.rest3Name]: COLUMN_IDS.rest3Rating,
        [COLUMN_IDS.rest4Name]: COLUMN_IDS.rest4Rating,
        [COLUMN_IDS.rest5Name]: COLUMN_IDS.rest5Rating,
        [COLUMN_IDS.rest6Name]: COLUMN_IDS.rest6Rating,
        [COLUMN_IDS.rest7Name]: COLUMN_IDS.rest7Rating,
        [COLUMN_IDS.rest8Name]: COLUMN_IDS.rest8Rating,
        [COLUMN_IDS.rest9Name]: COLUMN_IDS.rest9Rating,
        [COLUMN_IDS.rest10Name]: COLUMN_IDS.rest10Rating,
      };

      for (const [nameColumnId, ratingColumnId] of Object.entries(columnMapping)) {
        const ratingsMap = new Map<string, number[]>();

        for (const item of matchingItems) {
          const name = getTextValue(item.columnValues, nameColumnId);
          const rating = getNumericValue(item.columnValues, ratingColumnId);

          if (name && rating !== null) {
            if (!ratingsMap.has(name)) {
              ratingsMap.set(name, []);
            }
            ratingsMap.get(name)!.push(rating);
          }
        }

        for (const [name, ratings] of Array.from(ratingsMap.entries())) {
          const distribution: RatingCount[] = [];
          for (let rating = 1; rating <= 10; rating++) {
            const count = ratings.filter((r: number) => r === rating).length;
            const percentage = (count / ratings.length) * 100;
            distribution.push({ rating, count, percentage });
          }

          categories.push({
            category: name,
            totalResponses: ratings.length,
            distribution,
          });
        }
      }

      const firstItem = matchingItems[0];
      const dmc1Name = getTextValue(firstItem.columnValues, COLUMN_IDS.nomeDMC1) || 'DMC 1';
      const dmc2Name = getTextValue(firstItem.columnValues, COLUMN_IDS.nomeDMC2) || 'DMC 2';

      const simpleRatingFields: Record<string, string> = {
        [COLUMN_IDS.notaMalhaAerea]: 'Nota Malha Aérea',
        [COLUMN_IDS.notaAssentosAdequados]: 'Assentos',
        [COLUMN_IDS.notaMalhaAerea2]: 'Malha Aérea',
        [COLUMN_IDS.notaAssistenciaAeroporto]: 'Assistência Aeroporto',
        [COLUMN_IDS.notaTempoConexao]: 'Tempo Conexão',
        [COLUMN_IDS.notaDMC1]: dmc1Name,
        [COLUMN_IDS.notaDMC2]: dmc2Name,
        [COLUMN_IDS.notaGuiasLocais]: 'Guias Locais',
        [COLUMN_IDS.notaTransfer]: 'Transfer',
        [COLUMN_IDS.avaliacaoMaterial]: 'Material Criação',
        [COLUMN_IDS.notaAlimentacao]: 'Alimentação',
        [COLUMN_IDS.experienciaTop]: 'Experiência com a Top',
        [COLUMN_IDS.qualidadeProposta]: 'Qualidade e Criatividade da Proposta',
        [COLUMN_IDS.materiaisComunicacao]: 'Materiais Comunicação',
        [COLUMN_IDS.gerenteContas]: 'Gerente de Contas',
        [COLUMN_IDS.atendimentoCorporativo]: 'Atendimento Corporativo',
        [COLUMN_IDS.rsvp]: 'RSVP',
        [COLUMN_IDS.equipeCampo]: 'Equipe de Campo',
        [COLUMN_IDS.viagemGeralCorporativo]: 'Viagem em Geral',
        [COLUMN_IDS.servicosTecnologia]: 'Serviços de Tecnologia',
        [COLUMN_IDS.indicariaTop]: 'Indicaria a Top?',
        [COLUMN_IDS.notaTopAntesViagem]: 'Top Antes da Viagem',
        [COLUMN_IDS.notaVigemGeral]: 'Viagem Geral',
      };

      for (const [columnId, displayName] of Object.entries(simpleRatingFields)) {
        const ratings: number[] = [];

        for (const item of matchingItems) {
          const rating = getNumericValue(item.columnValues, columnId);
          if (rating !== null) {
            ratings.push(rating);
          }
        }

        if (ratings.length > 0) {
          const distribution: RatingCount[] = [];
          for (let rating = 1; rating <= 10; rating++) {
            const count = ratings.filter(r => r === rating).length;
            const percentage = (count / ratings.length) * 100;
            distribution.push({ rating, count, percentage });
          }

          categories.push({
            category: displayName,
            totalResponses: ratings.length,
            distribution,
          });
        }
      }

      const ratingDistribution: RatingDistribution = {
        searchId: chave,
        tipo,
        categories,
      };

      return res.json(ratingDistribution);
    } catch (error) {
      console.error("Error fetching pesquisas-top distribution:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Erro ao buscar distribuição"
      });
    }
  });

  app.get("/api/fornecedores", async (req, res) => {
    try {
      const { location, type } = req.query;

      if (!location || !type) {
        return res.status(400).json({ error: "location e type são obrigatórios" });
      }

      const searchTerm = (location as string).toLowerCase().trim();
      const fornecedorType = type as string;

      // Get all items
      const allItems = await dbService.getAllItems();

      // Define column mappings based on type
      const typeColumnMapping: Record<string, { nameColumns: string[], ratingColumns: string[] }> = {
        "Restaurantes": {
          nameColumns: [
            COLUMN_IDS.rest1Name, COLUMN_IDS.rest2Name, COLUMN_IDS.rest3Name,
            COLUMN_IDS.rest4Name, COLUMN_IDS.rest5Name, COLUMN_IDS.rest6Name,
            COLUMN_IDS.rest7Name, COLUMN_IDS.rest8Name, COLUMN_IDS.rest9Name,
            COLUMN_IDS.rest10Name
          ],
          ratingColumns: [
            COLUMN_IDS.rest1Rating, COLUMN_IDS.rest2Rating, COLUMN_IDS.rest3Rating,
            COLUMN_IDS.rest4Rating, COLUMN_IDS.rest5Rating, COLUMN_IDS.rest6Rating,
            COLUMN_IDS.rest7Rating, COLUMN_IDS.rest8Rating, COLUMN_IDS.rest9Rating,
            COLUMN_IDS.rest10Rating
          ]
        },
        "Hotéis": {
          nameColumns: [COLUMN_IDS.hotel1Name, COLUMN_IDS.hotel2Name, COLUMN_IDS.hotel3Name, COLUMN_IDS.hotel4Name],
          ratingColumns: [COLUMN_IDS.hotel1Rating, COLUMN_IDS.hotel2Rating, COLUMN_IDS.hotel3Rating, COLUMN_IDS.hotel4Rating]
        },
        "DMC": {
          nameColumns: [COLUMN_IDS.nomeDMC1, COLUMN_IDS.nomeDMC2],
          ratingColumns: [COLUMN_IDS.notaDMC1, COLUMN_IDS.notaDMC2]
        },
        "Passeios": {
          nameColumns: [
            COLUMN_IDS.passeio1Name, COLUMN_IDS.passeio2Name, COLUMN_IDS.passeio3Name,
            COLUMN_IDS.passeio4Name, COLUMN_IDS.passeio5Name, COLUMN_IDS.passeio6Name,
            COLUMN_IDS.passeio7Name, COLUMN_IDS.passeio8Name, COLUMN_IDS.passeio9Name,
            COLUMN_IDS.passeio10Name
          ],
          ratingColumns: [
            COLUMN_IDS.passeio1Rating, COLUMN_IDS.passeio2Rating, COLUMN_IDS.passeio3Rating,
            COLUMN_IDS.passeio4Rating, COLUMN_IDS.passeio5Rating, COLUMN_IDS.passeio6Rating,
            COLUMN_IDS.passeio7Rating, COLUMN_IDS.passeio8Rating, COLUMN_IDS.passeio9Rating,
            COLUMN_IDS.passeio10Rating
          ]
        }
      };

      const mapping = typeColumnMapping[fornecedorType];
      if (!mapping) {
        return res.status(400).json({ error: "Tipo de fornecedor inválido" });
      }

      // Aggregate suppliers by name
      const supplierMap = new Map<string, { ratings: number[], locations: Set<string>, countries: Set<string> }>();

      for (const item of allItems) {
        const destino = getTextValue(item.columnValues, COLUMN_IDS.destino).toLowerCase();

        // Process each supplier column for this type
        for (let i = 0; i < mapping.nameColumns.length; i++) {
          const name = getTextValue(item.columnValues, mapping.nameColumns[i]);
          const rating = getNumericValue(item.columnValues, mapping.ratingColumns[i]);

          if (!name || rating === null) continue;

          // Check if search term matches either location OR supplier name
          const matchesLocation = destino.includes(searchTerm) || searchTerm.includes(destino.split(',')[0].trim());
          const matchesName = name.toLowerCase().includes(searchTerm);

          if (!matchesLocation && !matchesName) continue;

          // Extract country from destino (usually last part after comma)
          const destinoParts = getTextValue(item.columnValues, COLUMN_IDS.destino).split(',').map(p => p.trim());
          const country = destinoParts.length > 1 ? destinoParts[destinoParts.length - 1] : destinoParts[0];
          const fullLocation = getTextValue(item.columnValues, COLUMN_IDS.destino);

          if (!supplierMap.has(name)) {
            supplierMap.set(name, { ratings: [], locations: new Set(), countries: new Set() });
          }
          const supplier = supplierMap.get(name)!;
          supplier.ratings.push(rating);
          supplier.locations.add(fullLocation);
          supplier.countries.add(country);
        }
      }

      // Group by country
      const countryGroups = new Map<string, any[]>();

      for (const [name, data] of Array.from(supplierMap.entries())) {
        const averageRating = data.ratings.reduce((sum: number, r: number) => sum + r, 0) / data.ratings.length;
        const country = Array.from(data.countries)[0] as string; // Use first country for grouping
        const location = Array.from(data.locations).join(', ') as string;

        if (!countryGroups.has(country)) {
          countryGroups.set(country, []);
        }

        // Calculate distribution
        const distribution: { rating: number; count: number }[] = [];
        for (let rating = 1; rating <= 10; rating++) {
          const count = data.ratings.filter((r: number) => r === rating).length;
          if (count > 0) {
            distribution.push({ rating, count });
          }
        }

        countryGroups.get(country)!.push({
          name,
          location,
          country,
          averageRating,
          totalEvaluations: data.ratings.length,
          distribution,
        });
      }

      // Sort suppliers within each country by average rating
      const results = Array.from(countryGroups.entries()).map(([country, suppliers]) => ({
        country,
        suppliers: suppliers.sort((a, b) => b.averageRating - a.averageRating)
      }));

      return res.json({
        type: fornecedorType,
        location: location as string,
        results
      });
    } catch (error) {
      console.error("Error fetching fornecedores:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Erro ao buscar fornecedores"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}