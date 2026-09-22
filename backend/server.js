import "dotenv/config";
import express from "express";
import cors from "cors";

import { getItemByAliasId } from "./data/excelAdapter.js";
import { verifyItem } from "./services/geminiService.js";
import { compareItemData } from "./services/verificationService.js";

function buildFallbackVerification(item) {
  const properties = Object.entries(item.properties || {}).map(([name, value]) => {
    const normalizedValue = value === null || value === undefined ? "" : String(value).trim();

    return {
      name,
      existingValue: normalizedValue,
      verifiedValue: "",
      status: "NOT_VERIFIED",
      source: "Local fallback verification",
      explanation: "The remote verification service was unavailable, so this Excel value was not independently verified."
    };
  });

  return {
    componentType: item.componentType || "",
    verifiedProperties: properties
  };
}

const app = express();

app.use(cors());
app.use(express.json());


// ========================================
// HOME / HEALTH CHECK
// ========================================

app.get("/", (req, res) => {
  res.json({
    message: "Item Verification Backend is running",
    status: "OK"
  });
});


// ========================================
// ITEM VERIFICATION
// ========================================

app.post("/api/verify-item", async (req, res) => {

  try {

    const { aliasId } = req.body;

    console.log("\n=================================");
    console.log("ITEM VERIFICATION REQUEST");
    console.log("=================================");

    console.log("Alias ID:", aliasId);


    // -------------------------------
    // Validate Alias ID
    // -------------------------------

    if (!aliasId || aliasId.trim() === "") {

      return res.status(400).json({
        error: "Alias ID is required"
      });

    }


    // -------------------------------
    // Get Existing Item
    // -------------------------------

    const item = getItemByAliasId(aliasId.trim());


    if (!item) {

      console.log("Item not found.");

      return res.status(404).json({
        error: `No item found for Alias ID: ${aliasId}`
      });

    }


    console.log("\nExisting item:");
    console.log(JSON.stringify(item, null, 2));


    // -------------------------------
    // Gemini Verification
    // -------------------------------

    let verifiedData;


    try {

      console.log("\nSending item to verification API...");

      verifiedData = await verifyItem(item);

      console.log("\nVerification completed.");

    }

    catch (error) {

      console.log("\nVerification service unavailable.");
      console.log("Reason:", error.message);

      verifiedData = buildFallbackVerification(item);

      console.log("\nUsing local fallback verification to keep the app functional.");

    }


    // -------------------------------
    // Compare Existing vs Verified
    // -------------------------------

    console.log("\nComparing item data...");

    const comparison = compareItemData(
      item,
      verifiedData
    );


    console.log("\nFinal comparison:");

    console.log(
      JSON.stringify(comparison, null, 2)
    );


    // -------------------------------
    // Send Response
    // -------------------------------

    return res.status(200).json(comparison);


  }

  catch (error) {

    console.error("\n=================================");
    console.error("BACKEND ERROR");
    console.error("=================================");

    console.error(error);


    return res.status(500).json({

      error: "Item verification failed",

      details: error.message

    });

  }

});


// ========================================
// START SERVER
// ========================================

const PORT = 5000;


app.listen(PORT, () => {

  console.log("");
  console.log("=================================");
  console.log("ITEM VERIFICATION BACKEND");
  console.log("=================================");
  console.log(
    `Server running on http://localhost:${PORT}`
  );
  console.log("=================================");
  console.log("");

});