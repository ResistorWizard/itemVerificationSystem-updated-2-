import { useMemo, useState } from "react";

const Icon = ({ name, size = 18 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    home: (
      <svg {...common}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),

    file: (
      <svg {...common}>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    ),

    hierarchy: (
      <svg {...common}>
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <rect x="3" y="17" width="6" height="4" rx="1" />
        <rect x="9" y="17" width="6" height="4" rx="1" />
        <rect x="15" y="17" width="6" height="4" rx="1" />
        <path d="M12 7v5M6 12h12M6 12v5M12 12v5M18 12v5" />
      </svg>
    ),

    comparison: (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="1" />
        <path d="M4 9h16M9 4v16M14 9v11" />
      </svg>
    ),

    wrench: (
      <svg {...common}>
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.2 2.2-3-3z" />
      </svg>
    ),

    download: (
      <svg {...common}>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 20h14" />
      </svg>
    ),

    search: (
      <svg {...common}>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </svg>
    ),

    network: (
      <svg {...common}>
        <circle cx="12" cy="5" r="2.5" />
        <circle cx="5" cy="19" r="2.5" />
        <circle cx="19" cy="19" r="2.5" />
        <path d="M12 7.5v5M12 12.5 5 17M12 12.5l7 4.5" />
      </svg>
    ),

    check: (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    ),

    alert: (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>
    ),

    info: (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10v6M12 7h.01" />
      </svg>
    ),

    arrow: (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    ),
  };

  return icons[name] || icons.info;
};

const navItems = [
  { id: "home", label: "Home", icon: "home" },
  { id: "details", label: "Item Details", icon: "file" },
  { id: "subclass", label: "Subclass Identification", icon: "hierarchy" },
  { id: "comparison", label: "Property Comparison", icon: "comparison" },
  { id: "correction", label: "Correction Summary", icon: "wrench" },
  { id: "selective", label: "Selective Output", icon: "download" },
  { id: "hierarchy", label: "Hierarchy View", icon: "network" },
];

function App() {
  const [aliasId, setAliasId] = useState("");
  const [currentPage, setCurrentPage] = useState("home");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [selectedProperties, setSelectedProperties] = useState([]);

  const handleSearch = async () => {
    const normalizedAliasId = aliasId.trim();

    if (!normalizedAliasId) {
      setError("Please enter an Alias ID.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/verify-item",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            aliasId: normalizedAliasId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to verify item."
        );
      }

      setResult(data);
      setCurrentPage("home");

      const defaultSelected =
        (data.properties || [])
          .filter(
            (property) =>
              property.status !== "NOT_VERIFIED"
          )
          .map((property) => property.name);

      setSelectedProperties(defaultSelected);
    } catch (err) {
      setResult(null);
      setError(
        err.message ||
          "Unable to connect to the verification backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleProperty = (propertyName) => {
    setSelectedProperties((previous) =>
      previous.includes(propertyName)
        ? previous.filter(
            (item) => item !== propertyName
          )
        : [...previous, propertyName]
    );
  };

  const subclassData =
    result?.subclassIdentification || {
      predictedSubclass: "",
      confidence: 0,
      candidates: [],
      reason:
        "Subclass identification is not available.",
    };

  return (
    <div className="app-shell">
      <Sidebar
        currentPage={currentPage}
        navigate={setCurrentPage}
      />

      <main className="main-area">
        <TopBar />

        <div className="page-container">
          {currentPage === "home" && (
            <HomePage
              aliasId={aliasId}
              setAliasId={setAliasId}
              handleSearch={handleSearch}
              loading={loading}
              error={error}
              result={result}
              subclassData={subclassData}
              navigate={setCurrentPage}
            />
          )}

          {currentPage === "details" && (
            <ItemDetailsPage result={result} />
          )}

          {currentPage === "subclass" && (
            <SubclassPage
              result={result}
              subclassData={subclassData}
            />
          )}

          {currentPage === "comparison" && (
            <ComparisonPage result={result} />
          )}

          {currentPage === "correction" && (
            <CorrectionPage result={result} />
          )}

          {currentPage === "selective" && (
            <SelectiveOutputPage
              result={result}
              selectedProperties={selectedProperties}
              toggleProperty={toggleProperty}
            />
          )}

          {currentPage === "hierarchy" && (
            <HierarchyPage
              result={result}
              subclassData={subclassData}
            />
          )}
        </div>
      </main>
    </div>
  );
}


/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({ currentPage, navigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Icon name="hierarchy" size={20} />
        </div>

        <div>
          <div className="brand-title">
            Item Verification System
          </div>

          <div className="brand-subtitle">
            Verify and compare item
            <br />
            information using AI
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${
              currentPage === item.id
                ? "active"
                : ""
            }`}
            onClick={() => navigate(item.id)}
          >
            <span className="nav-icon">
              <Icon
                name={item.icon}
                size={17}
              />
            </span>

            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        Version 1.0
      </div>
    </aside>
  );
}


/* =========================================================
   TOP BAR
========================================================= */

function TopBar() {
  return (
    <header className="topbar">
      <div />

      <div className="system-status">
        <span className="status-dot" />
        <span>System Ready</span>
      </div>
    </header>
  );
}


/* =========================================================
   PAGE HEADER
========================================================= */

function PageHeader({
  icon,
  title,
  subtitle,
}) {
  return (
    <div className="page-heading">
      <div className="page-heading-icon">
        <Icon name={icon} size={21} />
      </div>

      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}


/* =========================================================
   HOME
========================================================= */

function HomePage({
  aliasId,
  setAliasId,
  handleSearch,
  loading,
  error,
  result,
  subclassData,
  navigate,
}) {
  return (
    <>
      <PageHeader
        icon="search"
        title="Item Verification System"
        subtitle="Verify and compare item information using Alias ID"
      />

      <section className="search-card">
        <label htmlFor="aliasId">
          Alias ID
        </label>

        <div className="search-row">
          <input
            id="aliasId"
            type="text"
            placeholder="Enter Alias ID"
            value={aliasId}
            onChange={(event) =>
              setAliasId(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
          />

          <button
            className="primary-button"
            onClick={handleSearch}
            disabled={loading}
          >
            <Icon name="search" size={16} />

            {loading
              ? "Analyzing..."
              : "Analyze Item"}
          </button>
        </div>

        <p className="input-hint">
          Enter the Alias ID of the item you want
          to verify.
        </p>
      </section>

      {error && (
        <div className="error-box">
          <Icon name="alert" size={18} />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <>
          <ItemInfoBar result={result} />

          <SubclassIdentificationCard
            subclassData={subclassData}
          />
        </>
      )}

      <NextSteps navigate={navigate} />
    </>
  );
}


/* =========================================================
   ITEM INFO
========================================================= */

function ItemInfoBar({ result }) {
  if (!result) {
    return null;
  }

  const subclass =
    result.subclassIdentification
      ?.predictedSubclass;

  const confidence =
    result.subclassIdentification
      ?.confidence;

  return (
    <section className="item-info-bar">
      <InfoItem
        label="Alias ID"
        value={result.aliasId || "—"}
      />

      <InfoItem
        label="Part Number"
        value={result.partNumber || "—"}
      />

      <InfoItem
        label="Manufacturer"
        value={result.manufacturer || "—"}
      />

      <InfoItem
        label="Main Component"
        value={result.componentType || "—"}
      />

      <div className="info-item highlighted-info">
        <span>
          Identified Subclass (Highest Confidence)
        </span>

        <strong>
          {subclass
            ? `${subclass} (${confidence || 0}%)`
            : "Not available"}
        </strong>
      </div>
    </section>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}


/* =========================================================
   SUBCLASS IDENTIFICATION
========================================================= */

function SubclassIdentificationCard({
  subclassData,
}) {
  const candidates =
    subclassData?.candidates || [];

  return (
    <section className="subclass-card">
      <div className="section-title-row">
        <div className="section-title">
          <div className="section-icon blue">
            <Icon
              name="hierarchy"
              size={18}
            />
          </div>

          <div>
            <h2>
              Relevant Subclass Identification
            </h2>

            <p>
              Based on the component details,
              the most relevant subclass has
              been identified.
            </p>
          </div>
        </div>

        <span className="ai-badge">
          AI Powered
        </span>
      </div>

      {candidates.length === 0 ? (
        <div className="no-subclass-data">
          <Icon name="info" size={17} />

          <span>
            No subclass candidates are currently
            available from the Excel data.
          </span>
        </div>
      ) : (
        <SubclassRanking
          candidates={candidates}
        />
      )}

      {subclassData.predictedSubclass && (
        <div className="most-relevant">
          <div className="success-icon">
            <Icon name="check" size={18} />
          </div>

          <div>
            <strong>
              Most Relevant Subclass:{" "}
              {subclassData.predictedSubclass}
            </strong>

            <p>
              {subclassData.reason ||
                "This subclass received the highest AI relevance score."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function SubclassPage({
  result,
  subclassData,
}) {
  if (!result) {
    return (
      <EmptyState
        message="Analyze an item to view subclass identification."
      />
    );
  }

  return (
    <>
      <PageHeader
        icon="hierarchy"
        title="Subclass Identification"
        subtitle="Identify the most relevant component subclass using AI"
      />

      <ItemInfoBar result={result} />

      <SubclassIdentificationCard
        subclassData={subclassData}
      />
    </>
  );
}

function SubclassRanking({ candidates }) {
  return (
    <div className="ranking-list">
      {candidates.map(
        (candidate, index) => {
          const confidence = Math.max(
            0,
            Math.min(
              100,
              Number(candidate.confidence) || 0
            )
          );

          return (
            <div
              className="ranking-row"
              key={`${candidate.subclass}-${index}`}
            >
              <div className="ranking-number">
                {index + 1}
              </div>

              <div className="ranking-name">
                {candidate.subclass}
              </div>

              <div className="ranking-bar-wrapper">
                <div className="ranking-bar">
                  <div
                    className={`ranking-fill ${
                      index === 0
                        ? "highest"
                        : ""
                    }`}
                    style={{
                      width: `${confidence}%`,
                    }}
                  />
                </div>
              </div>

              <div className="ranking-value">
                {confidence}%
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}


/* =========================================================
   NEXT STEPS
========================================================= */

function NextSteps({ navigate }) {
  const steps = [
    {
      number: "1",
      title: "Item Details",
      description:
        "View existing data and AI verified output.",
      page: "details",
      icon: "file",
    },

    {
      number: "2",
      title: "Property Comparison",
      description:
        "Compare existing and verified values.",
      page: "comparison",
      icon: "comparison",
    },

    {
      number: "3",
      title: "Correction Summary",
      description:
        "View properties that need to be updated.",
      page: "correction",
      icon: "wrench",
    },

    {
      number: "4",
      title: "Selective Output",
      description:
        "Select properties for final output.",
      page: "selective",
      icon: "download",
    },

    {
      number: "5",
      title: "Hierarchy View",
      description:
        "View component classification hierarchy.",
      page: "hierarchy",
      icon: "network",
    },
  ];

  return (
    <section className="next-steps-card">
      <div className="section-heading-simple">
        <h2>Next Steps</h2>

        <p>
          Navigate to the respective sections
          to view detailed information and
          results.
        </p>
      </div>

      <div className="steps-grid">
        {steps.map((step) => (
          <button
            className="step-card"
            key={step.number}
            onClick={() =>
              navigate(step.page)
            }
          >
            <div className="step-icon">
              <Icon
                name={step.icon}
                size={20}
              />
            </div>

            <span className="step-number">
              {step.number}
            </span>

            <h3>{step.title}</h3>

            <p>{step.description}</p>

            <span className="step-arrow">
              <Icon name="arrow" size={15} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}


/* =========================================================
   ITEM DETAILS
========================================================= */

function ItemDetailsPage({ result }) {
  if (!result) {
    return (
      <EmptyState
        message="Analyze an item to view its details."
      />
    );
  }

  const existingData = {
    "Part Number":
      result.partNumber || "—",

    Manufacturer:
      result.manufacturer || "—",

    "Component Type":
      result.componentType || "—",
  };

  const verifiedData = {
    "Component Type":
      result.componentType || "—",
  };

  (result.properties || []).forEach(
    (property) => {
      existingData[property.name] =
        property.existingValue || "—";

      verifiedData[property.name] =
        property.verifiedValue ||
        "Not verified";
    }
  );

  return (
    <>
      <PageHeader
        icon="file"
        title="Item Details"
        subtitle="View existing item information and AI verified output"
      />

      <ItemInfoBar result={result} />

      <div className="two-column">
        <DataPanel
          title="Existing Data"
          source="EXCEL"
          data={existingData}
        />

        <DataPanel
          title="Verified Output"
          source="AI"
          data={verifiedData}
          ai
        />
      </div>
    </>
  );
}

function DataPanel({
  title,
  source,
  data,
  ai = false,
}) {
  return (
    <section
      className={`data-panel ${
        ai ? "ai-panel" : ""
      }`}
    >
      <div className="card-heading">
        <div className="section-icon blue">
          <Icon name="file" size={18} />
        </div>

        <div>
          <h2>{title}</h2>

          <p>
            {ai
              ? "Values verified by AI."
              : "Values from existing Excel data."}
          </p>
        </div>

        <span
          className={`source-tag ${
            ai ? "ai" : ""
          }`}
        >
          {source}
        </span>
      </div>

      <div className="data-list">
        {Object.entries(data).map(
          ([key, value]) => (
            <div
              className="data-list-row"
              key={key}
            >
              <span>{key}</span>
              <strong>{value}</strong>
            </div>
          )
        )}
      </div>
    </section>
  );
}


/* =========================================================
   PROPERTY COMPARISON
========================================================= */

function ComparisonPage({ result }) {
  if (!result) {
    return (
      <EmptyState
        message="Analyze an item to view property comparison."
      />
    );
  }

  const properties =
    result.properties || [];

  return (
    <>
      <PageHeader
        icon="comparison"
        title="Property Comparison"
        subtitle="Compare existing data with AI verified data"
      />

      <ItemInfoBar result={result} />

      <section className="content-card">
        <div className="card-heading">
          <div className="section-icon blue">
            <Icon
              name="comparison"
              size={18}
            />
          </div>

          <div>
            <h2>
              Property Comparison
            </h2>

            <p>
              Comparison between existing data
              and AI verified data.
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Property</th>
                <th>Existing Value</th>
                <th>AI Verified Value</th>
                <th>Status</th>
                <th>Source</th>
                <th>Explanation</th>
              </tr>
            </thead>

            <tbody>
              {properties.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="empty-table"
                  >
                    No properties available.
                  </td>
                </tr>
              ) : (
                properties.map(
                  (property, index) => (
                    <ComparisonRow
                      key={`${property.name}-${index}`}
                      property={property}
                      index={index}
                    />
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ComparisonRow({
  property,
  index,
}) {
  const statusClass =
    property.status === "MATCH"
      ? "status-match"
      : property.status === "MISMATCH"
      ? "status-mismatch"
      : "status-not-verified";

  const statusText =
    property.status === "MATCH"
      ? "MATCH"
      : property.status === "MISMATCH"
      ? "MISMATCH"
      : "NOT VERIFIED";

  return (
    <tr>
      <td>{index + 1}</td>

      <td className="property-name">
        {property.name}
      </td>

      <td>
        {property.existingValue || "—"}
      </td>

      <td>
        {property.verifiedValue || "—"}
      </td>

      <td>
        <span
          className={`status-pill ${statusClass}`}
        >
          {statusText}
        </span>
      </td>

      <td>
        {property.source || "—"}
      </td>

      <td>
        {property.explanation || "—"}
      </td>
    </tr>
  );
}


/* =========================================================
   CORRECTION SUMMARY
========================================================= */

function CorrectionPage({ result }) {
  if (!result) {
    return (
      <EmptyState
        message="Analyze an item to view correction summary."
      />
    );
  }

  const corrections =
    result.corrections || [];

  return (
    <>
      <PageHeader
        icon="wrench"
        title="Correction Summary"
        subtitle="Review properties that need to be updated based on AI verification"
      />

      <ItemInfoBar result={result} />

      <section className="content-card">
        <div className="card-heading">
          <div className="section-icon blue">
            <Icon name="wrench" size={18} />
          </div>

          <div>
            <h2>
              Correction Summary
            </h2>

            <p>
              Properties that need to be
              updated based on AI verification.
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Property</th>
                <th>Current Value</th>
                <th>Suggested Value</th>
                <th>Source</th>
                <th>Explanation</th>
              </tr>
            </thead>

            <tbody>
              {corrections.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="empty-table"
                  >
                    No corrections are required.
                  </td>
                </tr>
              ) : (
                corrections.map(
                  (correction, index) => (
                    <tr
                      key={`${correction.property}-${index}`}
                    >
                      <td>{index + 1}</td>

                      <td className="property-name">
                        {correction.property}
                      </td>

                      <td className="old-value">
                        {correction.oldValue ||
                          "—"}
                      </td>

                      <td className="new-value">
                        {correction.newValue ||
                          "—"}
                      </td>

                      <td>
                        {correction.source ||
                          "—"}
                      </td>

                      <td>
                        {correction.explanation ||
                          "—"}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}


/* =========================================================
   SELECTIVE OUTPUT
========================================================= */

function SelectiveOutputPage({
  result,
  selectedProperties,
  toggleProperty,
}) {
  if (!result) {
    return (
      <EmptyState
        message="Analyze an item to create selective output."
      />
    );
  }

  const properties =
    result.properties || [];

  const selected =
    properties.filter((property) =>
      selectedProperties.includes(
        property.name
      )
    );

  return (
    <>
      <PageHeader
        icon="download"
        title="Selective Output"
        subtitle="Select the properties required for the final output"
      />

      <ItemInfoBar result={result} />

      <section className="content-card">
        <div className="card-heading">
          <div className="section-icon blue">
            <Icon
              name="download"
              size={18}
            />
          </div>

          <div>
            <h2>FINAL OUTPUT</h2>

            <p>
              Select the properties required
              for the final output.
            </p>
          </div>
        </div>

        <div className="checkbox-grid">
          {properties.length === 0 ? (
            <div className="empty-selection">
              No properties available.
            </div>
          ) : (
            properties.map((property) => (
              <label
                className="checkbox-item"
                key={property.name}
              >
                <input
                  type="checkbox"
                  checked={selectedProperties.includes(
                    property.name
                  )}
                  onChange={() =>
                    toggleProperty(
                      property.name
                    )
                  }
                />

                <span>
                  {property.name}
                </span>
              </label>
            ))
          )}
        </div>

        <div className="selected-output-box">
          <div className="selected-output-header">
            <span>
              SELECTED PROPERTIES
            </span>

            <span>
              {selected.length} selected
            </span>
          </div>

          {selected.length === 0 ? (
            <div className="no-selected">
              No properties selected.
            </div>
          ) : (
            <div className="selected-list">
              {selected.map((property) => (
                <div
                  className="selected-property"
                  key={property.name}
                >
                  <span>
                    {property.name}
                  </span>

                  <strong>
                    {property.verifiedValue ||
                      property.existingValue ||
                      "Not verified"}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}


/* =========================================================
   HIERARCHY VIEW
========================================================= */

function HierarchyPage({
  result,
  subclassData,
}) {
  if (!result) {
    return (
      <EmptyState
        message="Analyze an item to view component hierarchy."
      />
    );
  }

  const componentType =
    result.componentType ||
    "Component";

  const subclass =
    subclassData.predictedSubclass ||
    "Subclass not identified";

  const confidence =
    Number(subclassData.confidence) || 0;

  return (
    <>
      <PageHeader
        icon="network"
        title="Hierarchy View"
        subtitle="Component classification hierarchy from main component to the most specific subclass"
      />

      <ItemInfoBar result={result} />

      <section className="content-card hierarchy-card">
        <div className="card-heading">
          <div className="section-icon blue">
            <Icon
              name="network"
              size={18}
            />
          </div>

          <div>
            <h2>
              Component Hierarchy
            </h2>

            <p>
              Classification path based on
              available component information.
            </p>
          </div>

          <div className="confidence-box">
            <Icon
              name="check"
              size={16}
            />

            <div>
              <span>
                AI Relevance
              </span>

              <strong>
                {confidence}%
              </strong>
            </div>
          </div>
        </div>

        <div className="hierarchy-tree">
          <HierarchyNode
            label="Engineering Components"
            root
          />

          <div className="tree-line" />

          <HierarchyNode
            label={componentType}
            active
          />

          <div className="tree-line" />

          <HierarchyNode
            label={
              subclass ===
              "Subclass not identified"
                ? "Subclass"
                : subclass
            }
            active
            confidence={confidence}
          />
        </div>

        <div className="hierarchy-result">
          <div className="success-icon">
            <Icon
              name="check"
              size={18}
            />
          </div>

          <div className="hierarchy-result-text">
            <strong>
              Most Relevant Classification
            </strong>

            <p>
              Engineering Components
              {" → "}
              {componentType}
              {" → "}
              {subclass}
            </p>
          </div>

          <div className="hierarchy-confidence">
            <strong>
              {confidence}%
            </strong>

            <span>
              AI Relevance
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

function HierarchyNode({
  label,
  active = false,
  root = false,
  confidence,
}) {
  return (
    <div
      className={`hierarchy-node ${
        active ? "active" : ""
      } ${root ? "root" : ""}`}
    >
      <Icon
        name={
          root
            ? "network"
            : "file"
        }
        size={15}
      />

      <span>{label}</span>

      {confidence !== undefined && (
        <small>
          {confidence}%
        </small>
      )}
    </div>
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ message }) {
  return (
    <div className="empty-page">
      <div className="empty-icon">
        <Icon
          name="info"
          size={26}
        />
      </div>

      <h2>
        No Item Selected
      </h2>

      <p>{message}</p>
    </div>
  );
}
export default App;