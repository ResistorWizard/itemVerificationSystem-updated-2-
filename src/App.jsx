import { useState } from "react";

function App() {
  const [aliasId, setAliasId] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [selectedProperties, setSelectedProperties] = useState({});


  // ========================================
  // CALL BACKEND
  // ========================================

  const handleSearch = async () => {

    if (aliasId.trim() === "") {
      return;
    }

    setLoading(true);
    setError("");
    setShowResult(false);

    try {

      const response = await fetch(
        "http://localhost:5000/api/verify-item",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            aliasId: aliasId.trim()
          })
        }
      );


      const data = await response.json();


      if (!response.ok) {
        throw new Error(
          data.error || "Failed to verify item"
        );
      }


      console.log("Backend response:", data);

      setResult(data);
      setShowResult(true);


      // Select all MATCH and MISMATCH properties by default
      const initialSelection = {};

      data.properties?.forEach((property) => {

        if (
          property.status === "MATCH" ||
          property.status === "MISMATCH"
        ) {
          initialSelection[property.name] = true;
        } else {
          initialSelection[property.name] = false;
        }

      });

      setSelectedProperties(initialSelection);

    }

    catch (err) {

      console.error("Verification error:", err);

      setError(err.message);

    }

    finally {

      setLoading(false);

    }
  };


  // ========================================
  // CHECKBOX HANDLER
  // ========================================

  const handlePropertySelection = (propertyName) => {

    setSelectedProperties((previous) => ({
      ...previous,
      [propertyName]: !previous[propertyName]
    }));

  };


  // ========================================
  // GET SELECTED PROPERTIES
  // ========================================

  const selectedItems =
    result?.properties?.filter(
      (property) =>
        selectedProperties[property.name]
    ) || [];


  return (
    <div className="app">

      {/* Header */}

      <header className="header">

        <div>

          <p className="eyebrow">
            ENGINEERING DATA
          </p>

          <h1>
            Item Verification System
          </h1>

          <p className="subtitle">
            Verify and compare item information using Alias ID
          </p>

        </div>


        <div className="status">

          <span className="status-dot"></span>

          System Ready

        </div>

      </header>


      {/* Main */}

      <main className="container">


        {/* Search */}

        <section className="search-card">

          <label>
            Alias ID
          </label>


          <div className="search-box">

            <input
              type="text"
              placeholder="Enter Alias ID"
              value={aliasId}
              onChange={(e) =>
                setAliasId(e.target.value)
              }
              onKeyDown={(e) => {

                if (e.key === "Enter") {
                  handleSearch();
                }

              }}
            />


            <button
              onClick={handleSearch}
              disabled={loading}
            >

              {loading
                ? "Analyzing..."
                : "Analyze Item"}

            </button>

          </div>


          <p className="hint">
            Enter the Alias ID of the item you want to verify.
          </p>


          {/* Error */}

          {error && (

            <p
              style={{
                color: "#dc2626",
                marginTop: "12px"
              }}
            >
              {error}
            </p>

          )}

        </section>



        {/* Results */}

        {showResult && result && (

          <div className="results">


            {/* Result Heading */}

            <div className="result-heading">

              <div>

                <p className="eyebrow">
                  ITEM FOUND
                </p>

                <h2>
                  {result.aliasId}
                </h2>

              </div>


              <span className="verification-badge">

                {result.summary?.mismatches > 0
                  ? "Corrections Required"
                  : "Verification Complete"}

              </span>

            </div>



            {/* Data Cards */}

            <div className="data-grid">


              {/* Existing Data */}

              <DataCard
                title="Existing Data"
                source="EXCEL"
                data={buildExistingData(result)}
              />


              {/* Verified Data */}

              <DataCard
                title="Verified Output"
                source="AI"
                data={buildVerifiedData(result)}
                copilot
              />

            </div>



            {/* Component Type */}

            {result.componentType && (

              <section className="card">

                <div className="section-header">

                  <div>

                    <p className="eyebrow">
                      COMPONENT
                    </p>

                    <h3>
                      Component Type
                    </h3>

                  </div>

                </div>


                <div className="properties">

                  <div className="property">

                    <span>
                      Type
                    </span>

                    <strong>
                      {result.componentType}
                    </strong>

                  </div>

                </div>

              </section>

            )}



            {/* Comparison */}

            <section className="card">

              <div className="section-header">

                <div>

                  <p className="eyebrow">
                    VERIFICATION
                  </p>

                  <h3>
                    Property Comparison
                  </h3>

                  <p>
                    Existing data compared with verified output.
                  </p>

                </div>

              </div>


              <div className="comparison">


                <div className="comparison-header">

                  <span>
                    Property
                  </span>

                  <span>
                    Existing Data
                  </span>

                  <span>
                    Verified Output
                  </span>

                  <span>
                    Status
                  </span>

                </div>


                {result.properties?.map(
                  (property) => (

                    <ComparisonRow
                      key={property.name}
                      name={property.name}
                      oldValue={
                        property.existingValue || "—"
                      }
                      newValue={
                        property.verifiedValue || "Not verified"
                      }
                      status={property.status}
                    />

                  )
                )}

              </div>

            </section>



            {/* Correction Summary */}

            <section className="card">

              <div className="section-header">

                <div>

                  <p className="eyebrow">
                    DATA CORRECTION
                  </p>

                  <h3>
                    Correction Summary
                  </h3>

                  <p>
                    Values that need to be corrected in the existing data.
                  </p>

                </div>


                <span className="warning-badge">

                  {result.summary?.mismatches || 0}
                  {" "}
                  Corrections

                </span>

              </div>


              {result.corrections?.length > 0 ? (

                <div className="corrections">

                  {result.corrections.map(
                    (correction) => (

                      <div
                        className="correction"
                        key={correction.property}
                      >

                        <strong>
                          {correction.property}
                        </strong>

                        <span className="old">
                          {correction.oldValue}
                        </span>

                        <span className="arrow">
                          →
                        </span>

                        <span className="new">
                          {correction.newValue}
                        </span>

                      </div>

                    )
                  )}

                </div>

              ) : (

                <p>
                  No corrections available.
                </p>

              )}

            </section>



            {/* Selective Output */}

            <section className="card">

              <div className="section-header">

                <div>

                  <p className="eyebrow">
                    FINAL OUTPUT
                  </p>

                  <h3>
                    Selective Output
                  </h3>

                  <p>
                    Select the properties required for the final output.
                  </p>

                </div>

              </div>



              <div className="checkbox-grid">

                {result.properties?.map(
                  (property) => (

                    <label key={property.name}>

                      <input
                        type="checkbox"
                        checked={
                          selectedProperties[
                            property.name
                          ] || false
                        }
                        onChange={() =>
                          handlePropertySelection(
                            property.name
                          )
                        }
                        disabled={
                          property.status ===
                          "NOT_VERIFIED"
                        }
                      />

                      {property.name}

                    </label>

                  )
                )}

              </div>



              {/* Final Output */}

              <div className="final-output">

                <h4>
                  Selected Properties
                </h4>


                {selectedItems.length === 0 ? (

                  <p>
                    No properties selected.
                  </p>

                ) : (

                  selectedItems.map(
                    (property) => (

                      <div
                        key={property.name}
                      >

                        <span>
                          {property.name}
                        </span>

                        <strong>
                          {property.status ===
                            "MISMATCH"
                            ? property.verifiedValue
                            : property.existingValue}
                        </strong>

                      </div>

                    )
                  )

                )}

              </div>

            </section>


          </div>

        )}

      </main>


      <footer>
        Item Verification System
      </footer>

    </div>
  );
}



// ========================================
// EXISTING DATA
// ========================================

function buildExistingData(result) {

  const data = {
    "Part Number": result.partNumber || "Not available",
    Manufacturer: result.manufacturer || "Not available"
  };

  result.properties?.forEach(
    (property) => {

      data[property.name] =
        property.existingValue;

    }
  );

  return data;
}



// ========================================
// VERIFIED DATA
// ========================================

function buildVerifiedData(result) {

  const data = {};

  result.properties?.forEach(
    (property) => {

      data[property.name] =
        property.verifiedValue ||
        "Not verified";

    }
  );

  return data;
}



// ========================================
// DATA CARD
// ========================================

function DataCard({
  title,
  source,
  data,
  copilot
}) {

  return (

    <section
      className={`card ${
        copilot ? "copilot-card" : ""
      }`}
    >

      <div className="section-header">

        <div>

          <p className="eyebrow">
            SOURCE
          </p>

          <h3>
            {title}
          </h3>

        </div>


        <span className="source-badge">
          {source}
        </span>

      </div>


      <div className="properties">

        {Object.entries(data).map(
          ([key, value]) => (

            <div
              className="property"
              key={key}
            >

              <span>
                {key}
              </span>

              <strong>
                {value}
              </strong>

            </div>

          )
        )}

      </div>

    </section>

  );
}



// ========================================
// COMPARISON ROW
// ========================================

function ComparisonRow({
  name,
  oldValue,
  newValue,
  status
}) {

  let statusElement;


  if (status === "MATCH") {

    statusElement = (
      <b className="match">
        ✓ Match
      </b>
    );

  }

  else if (status === "MISMATCH") {

    statusElement = (
      <b className="incorrect">
        ✕ Incorrect
      </b>
    );

  }

  else {

    statusElement = (
      <b>
        — Not Verified
      </b>
    );

  }


  return (

    <div className="comparison-row">

      <span>
        {name}
      </span>

      <span>
        {oldValue}
      </span>

      <span>
        {newValue}
      </span>

      <span>
        {statusElement}
      </span>

    </div>

  );
}


export default App;