import axios from "axios";

const MONDAY_API_URL = "https://api.monday.com/v2";
const BOARD_ID = "18246552547";

async function listColumns() {
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
    console.log(`${"Column ID".padEnd(25)} | ${"Title".padEnd(35)} | Type`);
    console.log("-".repeat(80));

    for (const col of board.columns) {
      console.log(
        `${col.id.padEnd(25)} | ${col.title.padEnd(35)} | ${col.type}`
      );
    }

    console.log("\n" + "=".repeat(80) + "\n");
    
    console.log("📝 Column ID → Title mapping:");
    console.log("{");
    for (const col of board.columns) {
      console.log(`  "${col.id}": "${col.title}",`);
    }
    console.log("}");

  } catch (error) {
    console.error("❌ Error fetching columns:", error);
    if (axios.isAxiosError(error)) {
      console.error("Response:", error.response?.data);
    }
    process.exit(1);
  }
}

listColumns();
