export function compareItemData(existingItem, verifiedData) {

  const results = verifiedData.verifiedProperties || [];

  const matches = results.filter(
    (property) => property.status === "MATCH"
  );

  const mismatches = results.filter(
    (property) => property.status === "MISMATCH"
  );

  const notVerified = results.filter(
    (property) => property.status === "NOT_VERIFIED"
  );

  return {
    aliasId: existingItem.aliasId,
    partNumber: existingItem.partNumber,
    manufacturer: existingItem.manufacturer,

    componentType: verifiedData.componentType,

    summary: {
      totalProperties: results.length,
      matches: matches.length,
      mismatches: mismatches.length,
      notVerified: notVerified.length
    },

    properties: results,

    corrections: mismatches.map((property) => ({
      property: property.name,
      oldValue: property.existingValue,
      newValue: property.verifiedValue,
      source: property.source,
      explanation: property.explanation
    }))
  };
}