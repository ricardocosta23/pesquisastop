
import axios from "axios";

const MONDAY_API_URL = "https://api.monday.com/v2";
const BOARD_ID = "9242892489";

async function fetchColumns() {
  const apiKey = process.env.MONDAY_API_KEY;
  
  if (!apiKey) {
    throw new Error("MONDAY_API_KEY not configured");
  }

  const query = `
    query {
      boards(ids: ${BOARD_ID}) {
        columns {
          id
          title
          type
          settings_str
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

    const columns = response.data?.data?.boards?.[0]?.columns || [];
    
    console.log("\n=== BOARD COLUMNS ===\n");
    console.log(JSON.stringify(columns, null, 2));
    
    return columns;
  } catch (error) {
    console.error("Error fetching columns:", error);
    throw error;
  }
}

fetchColumns();
