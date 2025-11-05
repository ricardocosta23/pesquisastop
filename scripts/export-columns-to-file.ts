
import axios from "axios";
import { writeFileSync } from "fs";
import { join } from "path";

const MONDAY_API_URL = "https://api.monday.com/v2";
const BOARD_ID = "9242892489";

async function exportColumnsToFile() {
  const apiKey = process.env.MONDAY_API_KEY;
  
  if (!apiKey) {
    console.error("❌ MONDAY_API_KEY not found in environment variables");
    process.exit(1);
  }

  const query = `
    query {
      boards(ids: ${BOARD_ID}) {
        name
        columns {
          id
          title
          type
        }
      }
    }
  `;

  try {
    console.log("🔍 Fetching columns from Monday.com board...\n");
    
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

    const board = response.data?.data?.boards?.[0];
    
    if (!board) {
      console.error("❌ Board not found");
      process.exit(1);
    }

    console.log(`📋 Board: ${board.name}`);
    console.log(`📊 Board ID: ${BOARD_ID}`);
    console.log(`\n${"=".repeat(80)}\n`);
    console.log(`Total Columns: ${board.columns.length}\n`);

    // Print to console
    for (const col of board.columns) {
      console.log(`${col.title} at ${col.id}`);
    }

    // Create text file content
    let fileContent = `Board: ${board.name}\n`;
    fileContent += `Board ID: ${BOARD_ID}\n`;
    fileContent += `Total Columns: ${board.columns.length}\n`;
    fileContent += `${"=".repeat(80)}\n\n`;
    
    for (const col of board.columns) {
      fileContent += `${col.title} at ${col.id}\n`;
    }

    // Save to attached_assets folder
    const filePath = join(process.cwd(), "attached_assets", "board_9242892489_columns.txt");
    writeFileSync(filePath, fileContent, "utf-8");

    console.log(`\n✅ Column list saved to: attached_assets/board_9242892489_columns.txt`);

  } catch (error) {
    console.error("❌ Error fetching columns:", error);
    if (axios.isAxiosError(error)) {
      console.error("Response:", error.response?.data);
    }
    process.exit(1);
  }
}

exportColumnsToFile();
