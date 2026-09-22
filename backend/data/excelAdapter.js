import XLSX from "xlsx";
import { fileURLToPath } from "node:url";
import path from "node:path";

const workbookPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "test.updated.xlsx"
);

export function getItemByAliasId(aliasId) {
  const workbook = XLSX.readFile(workbookPath);
  const itemsSheet = workbook.Sheets[workbook.SheetNames[0]];
  const itemRows = XLSX.utils.sheet_to_json(itemsSheet, { defval: "" });
  const item = itemRows.find(
    (row) => String(row.AliasID).trim() === aliasId
  );

  if (!item) {
    return null;
  }

  const propertyColumns = ["Parameter1", "Parameter2", "Parameter3", "Parameter4"];
  const visibleProperties = Object.fromEntries(
    propertyColumns
      .map((column) => String(item[column] || "").trim())
      .filter(Boolean)
      .map((property) => {
        const separatorIndex = property.indexOf(":");
        return separatorIndex === -1
          ? [property, ""]
          : [property.slice(0, separatorIndex).trim(), property.slice(separatorIndex + 1).trim()];
      })
  );

  return {
    aliasId: String(item.AliasID).trim(),
    partNumber: String(item.PartNumber).trim(),
    manufacturer: String(item.Manufacturer).trim(),
    componentType: String(item.ComponentType).trim(),
    properties: Object.keys(visibleProperties).length > 0
      ? visibleProperties
      : JSON.parse(String(item.Properties || "{}"))
  };
}