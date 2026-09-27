import "dotenv/config";

import express from "express";
import cors from "cors";

import {
  getItemByAliasId,
  getSubclassCandidates
} from "./data/excelAdapter.js";

import {
  verifyItem,
  identifySubclass
} from "./services/geminiService.js";

import {
  compareItemData
} from "./services/verificationService.js";


// =========================================================
// FALLBACK
// =========================================================

function buildFallbackVerification(item) {
  const properties =
    Object.entries(
      item.properties || {}
    ).map(([name, value]) => {
      const normalizedValue =
        value === null ||
        value === undefined
          ? ""
          : String(value).trim();

      return {
        name,

        existingValue:
          normalizedValue,

        verifiedValue:
          "",

        status:
          "NOT_VERIFIED",

        source:
          "Local fallback verification",

        explanation:
          "The remote verification service was unavailable, so this Excel value was not independently verified."
      };
    });

  return {
    componentType:
      item.componentType || "",

    verifiedProperties:
      properties
  };
}


// =========================================================
// EXPRESS APP
// =========================================================

const app = express();

app.use(cors());

app.use(express.json());


// =========================================================
// HEALTH CHECK
// =========================================================

app.get("/", (req, res) => {
  res.json({
    message:
      "Item Verification Backend is running",

    status:
      "OK"
  });
});


// =========================================================
// ITEM VERIFICATION
// =========================================================

app.post(
  "/api/verify-item",
  async (req, res) => {
    try {
      const { aliasId } =
        req.body;

      console.log(
        "\n================================="
      );

      console.log(
        "ITEM VERIFICATION REQUEST"
      );

      console.log(
        "================================="
      );

      console.log(
        "Alias ID:",
        aliasId
      );


      // -------------------------------------------------
      // VALIDATE
      // -------------------------------------------------

      if (
        !aliasId ||
        aliasId.trim() === ""
      ) {
        return res.status(400).json({
          error:
            "Alias ID is required"
        });
      }


      const normalizedAliasId =
        aliasId.trim();


      // -------------------------------------------------
      // GET ITEM FROM EXCEL
      // -------------------------------------------------

      const item =
        getItemByAliasId(
          normalizedAliasId
        );


      if (!item) {
        console.log(
          "Item not found."
        );

        return res.status(404).json({
          error:
            `No item found for Alias ID: ${normalizedAliasId}`
        });
      }


      console.log(
        "\nExisting item:"
      );

      console.log(
        JSON.stringify(
          item,
          null,
          2
        )
      );


      // -------------------------------------------------
      // AI ITEM VERIFICATION
      // -------------------------------------------------

      let verifiedData;

      try {
        console.log(
          "\nSending item to verification API..."
        );

        verifiedData =
          await verifyItem(
            item
          );

        console.log(
          "\nVerification completed."
        );
      } catch (error) {
        console.log(
          "\nVerification service unavailable."
        );

        console.log(
          "Reason:",
          error.message
        );

        verifiedData =
          buildFallbackVerification(
            item
          );

        console.log(
          "\nUsing local fallback verification."
        );
      }


      // -------------------------------------------------
      // SUBCLASS CANDIDATES
      // -------------------------------------------------

      let subclassCandidates = [];

      try {
        subclassCandidates =
          getSubclassCandidates(
            item
          );

        console.log(
          "\nSubclass candidates:"
        );

        console.log(
          subclassCandidates
        );
      } catch (error) {
        console.warn(
          "Unable to read subclass candidates:",
          error.message
        );
      }


      // -------------------------------------------------
      // AI SUBCLASS IDENTIFICATION
      // -------------------------------------------------

      let subclassIdentification = {
        predictedSubclass: "",
        confidence: 0,
        candidates: [],
        reason:
          "Subclass identification was not available."
      };


      if (
        subclassCandidates.length > 0
      ) {
        try {
          console.log(
            "\nSending item for subclass identification..."
          );

          subclassIdentification =
            await identifySubclass(
              item,
              subclassCandidates
            );

          console.log(
            "\nSubclass identification completed."
          );

          console.log(
            JSON.stringify(
              subclassIdentification,
              null,
              2
            )
          );
        } catch (error) {
          console.warn(
            "\nSubclass identification unavailable."
          );

          console.warn(
            "Reason:",
            error.message
          );
        }
      } else {
        console.log(
          "\nNo subclass candidates found in Excel."
        );
      }


      // -------------------------------------------------
      // COMPARE
      // -------------------------------------------------

      console.log(
        "\nComparing item data..."
      );

      const comparison =
        compareItemData(
          item,
          verifiedData,
          subclassIdentification
        );


      // -------------------------------------------------
      // FINAL RESPONSE
      // -------------------------------------------------

      console.log(
        "\nFinal comparison:"
      );

      console.log(
        JSON.stringify(
          comparison,
          null,
          2
        )
      );


      return res.status(200).json(
        comparison
      );

    } catch (error) {
      console.error(
        "\n================================="
      );

      console.error(
        "BACKEND ERROR"
      );

      console.error(
        "================================="
      );

      console.error(
        error
      );

      return res.status(500).json({
        error:
          "Item verification failed",

        details:
          error.message
      });
    }
  }
);


// =========================================================
// START SERVER
// =========================================================

const PORT = 5000;

app.listen(
  PORT,
  () => {
    console.log("");

    console.log(
      "================================="
    );

    console.log(
      "ITEM VERIFICATION BACKEND"
    );

    console.log(
      "================================="
    );

    console.log(
      `Server running on http://localhost:${PORT}`
    );

    console.log(
      "================================="
    );

    console.log("");
  }
);