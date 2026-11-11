
import { useState, useEffect } from "react";

import {
  LayoutDashboard,
  Users,
  Search,
  RefreshCw,
  UserPlus,
  CheckCircle,
  XCircle,
  Database,
  Activity,
  ShieldAlert,
  AlertCircle,
  Eye,
  UploadCloud,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import "./App.css";

const API_URL = "http://127.0.0.1:8000";

const VALIDATION_COLORS = ["#16A34A", "#DC2626"];


// --------------------------------------------------
// CONVERT API ERRORS INTO READABLE MESSAGES
// --------------------------------------------------

function getErrorMessage(data) {
  if (!data) {
    return "Something went wrong. Please try again.";
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((error) => {
        const field = Array.isArray(error.loc)
          ? error.loc.filter((part) => part !== "body").join(".")
          : "";

        const message =
          error.msg || error.message || error.type || "Invalid value";

        return field ? `${field}: ${message}` : message;
      })
      .join(" | ");
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  if (data.detail && typeof data.detail === "object") {
    return JSON.stringify(data.detail);
  }

  return "Request failed. Please check your input and try again.";
}


function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const [candidates, setCandidates] = useState([]);
  const [quarantineRecords, setQuarantineRecords] = useState([]);

  const [stats, setStats] = useState({
    total_candidates: 0,
    valid_candidates: 0,
    invalid_candidates: 0,
    quarantined_records: 0,
  });

  const [backendStatus, setBackendStatus] = useState("Checking");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    skills: "",
    experience: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // CSV UPLOAD STATES

  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const [csvMessage, setCsvMessage] = useState("");
  const [csvMessageType, setCsvMessageType] = useState("");


  // --------------------------------------------------
  // FETCH ALL VALID CANDIDATES
  // --------------------------------------------------

  const fetchCandidates = async () => {
    try {
      const response = await fetch(`${API_URL}/candidates`);

      if (!response.ok) {
        throw new Error("Unable to fetch candidates");
      }

      const data = await response.json();

      setCandidates(
        Array.isArray(data) ? data : data.candidates || []
      );
    } catch (error) {
      console.error("Candidate fetch error:", error);
    }
  };


  // --------------------------------------------------
  // FETCH QUARANTINED RECORDS
  // --------------------------------------------------

  const fetchQuarantineRecords = async () => {
    try {
      const response = await fetch(`${API_URL}/quarantine`);

      if (!response.ok) {
        throw new Error("Unable to fetch invalid records");
      }

      const data = await response.json();

      setQuarantineRecords(data.quarantined_records || []);
    } catch (error) {
      console.error("Quarantine fetch error:", error);
    }
  };


  // --------------------------------------------------
  // FETCH DASHBOARD STATISTICS
  // --------------------------------------------------

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/stats`);

      if (!response.ok) {
        throw new Error("Unable to fetch statistics");
      }

      const data = await response.json();

      setStats({
        total_candidates: data.total_candidates ?? 0,
        valid_candidates: data.valid_candidates ?? 0,
        invalid_candidates: data.invalid_candidates ?? 0,
        quarantined_records: data.quarantined_count ?? 0,
      });
    } catch (error) {
      console.error("Statistics error:", error);
    }
  };


  // --------------------------------------------------
  // CHECK BACKEND HEALTH
  // --------------------------------------------------

  const checkBackend = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);

      if (!response.ok) {
        throw new Error("Backend unavailable");
      }

      setBackendStatus("Online");
    } catch {
      setBackendStatus("Offline");
    }
  };


  // --------------------------------------------------
  // REFRESH ALL APPLICATION DATA
  // --------------------------------------------------

  const refreshData = async () => {
    setLoading(true);

    try {
      await Promise.all([
        fetchCandidates(),
        fetchStats(),
        fetchQuarantineRecords(),
        checkBackend(),
      ]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    refreshData();
  }, []);


  // --------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------

  const navigateTo = (page) => {
    setActivePage(page);
    setSearchTerm("");
    setSelectedRecord(null);

    if (page === "dashboard") {
      refreshData();
    }

    if (page === "candidates") {
      fetchCandidates();
    }

    if (page === "invalid-records") {
      fetchQuarantineRecords();
    }
  };


  // --------------------------------------------------
  // HANDLE FORM INPUT
  // --------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // --------------------------------------------------
  // REGISTER SINGLE CANDIDATE
  // --------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setMessage("");
    setMessageType("");

    const skills = formData.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (skills.length === 0) {
      setMessage("Please enter at least one skill.");
      setMessageType("error");
      return;
    }

    if (
      formData.experience === "" ||
      Number(formData.experience) < 0 ||
      !Number.isFinite(Number(formData.experience))
    ) {
      setMessage("Please enter valid experience (0 or greater).");
      setMessageType("error");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      skills,
      experience: Number(formData.experience),
    };

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/candidates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getErrorMessage(data));
      }

      setMessage("Candidate registered successfully!");
      setMessageType("success");

      setFormData({
        name: "",
        email: "",
        skills: "",
        experience: "",
      });

      await refreshData();

    } catch (error) {
      setMessage(
        error.message ||
          "Candidate registration failed. Please try again."
      );

      setMessageType("error");

    } finally {
      setSubmitting(false);
    }
  };


  // --------------------------------------------------
  // CSV BULK UPLOAD
  // --------------------------------------------------

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setCsvMessage("Please select a CSV file first.");
      setCsvMessageType("error");
      return;
    }

    if (!csvFile.name.toLowerCase().endsWith(".csv")) {
      setCsvMessage("Only CSV files are allowed.");
      setCsvMessageType("error");
      return;
    }

    setCsvUploading(true);
    setCsvMessage("");
    setCsvMessageType("");
    setCsvResult(null);

    const uploadData = new FormData();

    uploadData.append("file", csvFile);

    try {
      const response = await fetch(
        `${API_URL}/candidates/upload-csv`,
        {
          method: "POST",
          body: uploadData,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getErrorMessage(data));
      }

      setCsvResult(data);
      setCsvMessage("CSV uploaded and processed successfully!");
      setCsvMessageType("success");

      setCsvFile(null);

      // Refresh candidates, statistics and quarantine
      await refreshData();

    } catch (error) {
      setCsvMessage(
        error.message || "CSV upload failed. Please try again."
      );

      setCsvMessageType("error");

    } finally {
      setCsvUploading(false);
    }
  };


  // --------------------------------------------------
  // FILTER VALID CANDIDATES
  // --------------------------------------------------

  const filteredCandidates = candidates.filter((candidate) => {
    const search = searchTerm.toLowerCase();

    const skills = Array.isArray(candidate.skills)
      ? candidate.skills.join(", ")
      : candidate.skills || "";

    return (
      String(candidate.id || "").toLowerCase().includes(search) ||
      (candidate.name || "").toLowerCase().includes(search) ||
      (candidate.email || "").toLowerCase().includes(search) ||
      skills.toLowerCase().includes(search)
    );
  });


  // --------------------------------------------------
  // FILTER INVALID RECORDS
  // --------------------------------------------------

  const filteredInvalidRecords = quarantineRecords.filter((record) => {
    const submitted = record.submitted_data || {};

    const errors = (record.errors || [])
      .map((error) => {
        const field = error.loc?.join(".") || "";

        return `${field} ${
          error.msg || error.message || error.type || ""
        }`;
      })
      .join(" ");

    const skills = Array.isArray(submitted.skills)
      ? submitted.skills.join(", ")
      : submitted.skills || "";

    const searchableText = [
      record.record_number,
      submitted.name,
      submitted.email,
      skills,
      errors,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(searchTerm.toLowerCase());
  });


  // --------------------------------------------------
  // DONUT CHART DATA
  // --------------------------------------------------

  const validationChartData = [
    {
      name: "Valid Candidates",
      value: stats.valid_candidates,
    },
    {
      name: "Invalid Candidates",
      value: stats.invalid_candidates,
    },
  ];


  // --------------------------------------------------
  // TECHNICAL SKILLS CHART DATA
  // --------------------------------------------------

  const skillCounts = {};

  candidates.forEach((candidate) => {
    const skills = Array.isArray(candidate.skills)
      ? candidate.skills
      : typeof candidate.skills === "string"
        ? candidate.skills.split(",")
        : [];

    const uniqueSkills = new Set(
      skills
        .map((skill) => skill.trim())
        .filter(Boolean)
        .map((skill) => skill.toLowerCase())
    );

    uniqueSkills.forEach((skill) => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
  });

  const skillsChartData = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([skill, count]) => ({
      skill: skill.charAt(0).toUpperCase() + skill.slice(1),
      candidates: count,
    }));


  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <div className="app-container">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="brand-icon">
            <Activity size={24} />
          </div>

          <div>
            <h2>TalentFlow</h2>
            <span>Candidate Management</span>
          </div>

        </div>


        <div className="sidebar-section">

          <p className="sidebar-heading">MAIN MENU</p>

          <button
            className={`nav-item ${
              activePage === "dashboard" ? "active" : ""
            }`}
            onClick={() => navigateTo("dashboard")}
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </button>


          <button
            className={`nav-item ${
              activePage === "candidates" ? "active" : ""
            }`}
            onClick={() => navigateTo("candidates")}
          >
            <Users size={19} />
            <span>Candidates</span>
          </button>


          <button
            className={`nav-item ${
              activePage === "invalid-records" ? "active" : ""
            }`}
            onClick={() => navigateTo("invalid-records")}
          >
            <ShieldAlert size={19} />
            <span>Invalid Records</span>

            {stats.invalid_candidates > 0 && (
              <span className="nav-count">
                {stats.invalid_candidates}
              </span>
            )}
          </button>

        </div>


        <div className="sidebar-footer">

          <div className="system-indicator"></div>

          <span>Candidate Management System</span>

        </div>

      </aside>


      {/* MAIN CONTENT */}

      <main className="main-content">

        {/* TOP HEADER */}

        <header className="topbar">

          <div>

            <h2>
              {activePage === "dashboard"
                ? "Dashboard"
                : activePage === "candidates"
                  ? "Candidates"
                  : "Invalid Records"}
            </h2>

            <p>
              {activePage === "dashboard"
                ? "Manage and track candidate information"
                : activePage === "candidates"
                  ? "View and manage all registered candidates"
                  : "Review rejected submissions and validation errors"}
            </p>

          </div>


          <div className="topbar-right">

            <div className="system-status">

              <span
                className={`status-dot ${
                  backendStatus === "Online" ? "online" : "offline"
                }`}
              ></span>

              System {backendStatus}

            </div>


            <button
              className="refresh-button"
              onClick={refreshData}
              disabled={loading}
              title="Refresh data"
            >
              <RefreshCw
                size={17}
                className={loading ? "spin" : ""}
              />
            </button>

          </div>

        </header>


        {/* DASHBOARD PAGE */}

        {activePage === "dashboard" && (

          <section className="page-content">

            <div className="stats-grid">

              <div className="stat-card">
                <div className="stat-icon blue">
                  <Users size={22} />
                </div>

                <p>Total Candidates</p>
                <h2>{stats.total_candidates}</h2>
                <span>Stored in PostgreSQL</span>
              </div>


              <div className="stat-card">
                <div className="stat-icon green">
                  <CheckCircle size={22} />
                </div>

                <p>Valid Candidates</p>
                <h2>{stats.valid_candidates}</h2>
                <span>Successfully stored</span>
              </div>


              <div className="stat-card">
                <div className="stat-icon red">
                  <XCircle size={22} />
                </div>

                <p>Invalid Candidates</p>
                <h2>{stats.invalid_candidates}</h2>
                <span>Rejected submissions</span>

                <button
                  className="stat-link"
                  onClick={() => navigateTo("invalid-records")}
                >
                  View invalid records →
                </button>
              </div>


              <div className="stat-card">
                <div className="stat-icon purple">
                  <Database size={22} />
                </div>

                <p>Quarantined Records</p>
                <h2>{stats.quarantined_records}</h2>
                <span>Records requiring review</span>
              </div>

            </div>


            {/* ANALYTICS */}

            <div className="analytics-grid">

              <div className="content-card chart-card">

                <div className="section-header">
                  <div>
                    <h3>Candidate Validation Overview</h3>
                    <p>Valid vs rejected candidate records</p>
                  </div>

                  <Activity size={22} />
                </div>

                {validationChartData.some((item) => item.value > 0) ? (

                  <ResponsiveContainer width="100%" height={270}>
                    <PieChart>

                      <Pie
                        data={validationChartData}
                        cx="50%"
                        cy="45%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {validationChartData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={VALIDATION_COLORS[index]}
                          />
                        ))}
                      </Pie>

                      <Tooltip />
                      <Legend verticalAlign="bottom" />

                    </PieChart>
                  </ResponsiveContainer>

                ) : (
                  <p className="empty-state">
                    No candidate data available for analytics.
                  </p>
                )}

              </div>


              <div className="content-card chart-card">

                <div className="section-header">
                  <div>
                    <h3>Top Technical Skills</h3>
                    <p>Most common skills among registered candidates</p>
                  </div>

                  <Database size={22} />
                </div>

                {skillsChartData.length > 0 ? (

                  <ResponsiveContainer width="100%" height={270}>
                    <BarChart
                      data={skillsChartData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -15,
                        bottom: 5,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="skill"
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="candidates"
                        name="Candidates"
                        fill="#3975ed"
                        radius={[6, 6, 0, 0]}
                        barSize={35}
                      />

                    </BarChart>
                  </ResponsiveContainer>

                ) : (
                  <p className="empty-state">
                    No skill data available yet.
                  </p>
                )}

              </div>

            </div>


            {/* INDIVIDUAL REGISTRATION */}

            <div className="content-card">

              <div className="section-header">
                <div>
                  <h3>Candidate Registration</h3>
                  <p>Add a new candidate to the system</p>
                </div>

                <UserPlus size={22} />
              </div>


              <form onSubmit={handleSubmit}>

                <div className="form-grid">

                  <div className="form-group">
                    <label>Full Name</label>

                    <input
                      type="text"
                      name="name"
                      placeholder="Enter candidate name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>


                  <div className="form-group">
                    <label>Email Address</label>

                    <input
                      type="email"
                      name="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>


                  <div className="form-group">
                    <label>Skills</label>

                    <input
                      type="text"
                      name="skills"
                      placeholder="Python, SQL, React"
                      value={formData.skills}
                      onChange={handleChange}
                      required
                    />

                    <small>
                      Separate skills using commas.
                    </small>
                  </div>


                  <div className="form-group">
                    <label>Experience (Years)</label>

                    <input
                      type="number"
                      name="experience"
                      min="0"
                      step="any"
                      placeholder="Enter experience"
                      value={formData.experience}
                      onChange={handleChange}
                      required
                    />
                  </div>

                </div>


                <button
                  type="submit"
                  className="submit-button"
                  disabled={submitting}
                >
                  <UserPlus size={17} />

                  {submitting
                    ? "Registering..."
                    : "Register Candidate"}
                </button>


                {message && (
                  <p
                    className={`form-message ${messageType}`}
                    role="alert"
                  >
                    {message}
                  </p>
                )}

              </form>

            </div>


            {/* RECENT CANDIDATES */}

            <div className="content-card">

              <div className="section-header">
                <div>
                  <h3>Recent Candidates</h3>
                  <p>Latest registered candidates</p>
                </div>

                <button
                  className="view-all-button"
                  onClick={() => navigateTo("candidates")}
                >
                  View All
                </button>
              </div>

              <CandidateTable
                candidates={candidates.slice(0, 5)}
              />

            </div>

          </section>

        )}


        {/* CANDIDATES PAGE */}

        {activePage === "candidates" && (

          <section className="page-content">

            <div className="content-card">

              <div className="section-header">
                <div>
                  <h3>All Candidates</h3>

                  <p>
                    {candidates.length} candidates registered in PostgreSQL
                  </p>
                </div>

                <Users size={23} />
              </div>


              {/* CSV BULK UPLOAD */}

              <div className="csv-upload-section">

                <div className="csv-upload-heading">

                  <div className="csv-upload-icon">
                    <UploadCloud size={23} />
                  </div>

                  <div>
                    <h3>Bulk Candidate Ingestion</h3>
                    <p>
                      Upload a CSV file to register multiple candidates at once.
                    </p>
                  </div>

                </div>


                <div className="csv-upload-controls">

                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(event) => {
                      setCsvFile(event.target.files?.[0] || null);
                      setCsvMessage("");
                      setCsvResult(null);
                    }}
                    disabled={csvUploading}
                  />

                  <button
                    type="button"
                    className="csv-upload-button"
                    onClick={handleCsvUpload}
                    disabled={csvUploading || !csvFile}
                  >
                    <UploadCloud size={17} />

                    {csvUploading ? "Uploading..." : "Upload CSV"}
                  </button>

                </div>


                {csvFile && (
                  <p className="csv-file-name">
                    Selected file: {csvFile.name}
                  </p>
                )}


                {csvMessage && (
                  <p
                    className={`csv-message ${csvMessageType}`}
                    role="status"
                  >
                    {csvMessage}
                  </p>
                )}


                {csvResult && (

                  <div className="csv-result">

                    <h4>Ingestion Summary</h4>

                    <div className="csv-result-grid">

                      <div>
                        <strong>
                          {csvResult.total_received ?? 0}
                        </strong>
                        <span>Received</span>
                      </div>

                      <div>
                        <strong className="csv-valid">
                          {csvResult.total_valid ?? 0}
                        </strong>
                        <span>Valid</span>
                      </div>

                      <div>
                        <strong className="csv-invalid">
                          {csvResult.total_invalid ?? 0}
                        </strong>
                        <span>Invalid</span>
                      </div>

                    </div>

                    <p>
                      {csvResult.quarantined_count ?? 0} records moved to quarantine.
                    </p>

                  </div>

                )}

              </div>


              {/* SEARCH CANDIDATES */}

              <div className="search-container">

                <Search size={19} />

                <input
                  type="text"
                  placeholder="Search by name, email, ID or skills..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                />

              </div>


              {loading ? (
                <p className="empty-state">
                  Loading candidates...
                </p>
              ) : (
                <CandidateTable
                  candidates={filteredCandidates}
                />
              )}


              {!loading && filteredCandidates.length === 0 && (
                <p className="empty-state">
                  No matching candidates found.
                </p>
              )}

            </div>

          </section>

        )}


        {/* INVALID RECORDS PAGE */}

        {activePage === "invalid-records" && (

          <section className="page-content">

            <div className="invalid-overview">

              <div className="invalid-overview-icon">
                <AlertCircle size={25} />
              </div>

              <div>
                <p>Total Invalid Records</p>
                <h2>{quarantineRecords.length}</h2>

                <span>
                  Stored in quarantine JSONL file
                </span>
              </div>

            </div>


            <div className="content-card">

              <div className="section-header">
                <div>
                  <h3>Rejected Submissions</h3>

                  <p>
                    Inspect original candidate data and validation errors
                  </p>
                </div>

                <ShieldAlert size={23} />
              </div>


              <div className="search-container">

                <Search size={19} />

                <input
                  type="text"
                  placeholder="Search name, email, record number or error..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                />

              </div>


              {loading ? (

                <p className="empty-state">
                  Loading invalid records...
                </p>

              ) : (

                <div className="table-container">

                  <table className="candidate-table">

                    <thead>
                      <tr>
                        <th>Record No.</th>
                        <th>Candidate</th>
                        <th>Email</th>
                        <th>Skills</th>
                        <th>Experience</th>
                        <th>Validation Error</th>
                        <th>Status</th>
                        <th>Details</th>
                      </tr>
                    </thead>


                    <tbody>

                      {filteredInvalidRecords.map((record, index) => {

                        const submitted = record.submitted_data || {};
                        const errors = record.errors || [];

                        return (
                          <tr key={index}>

                            <td>
                              #{record.record_number ?? "-"}
                            </td>

                            <td className="candidate-name">
                              {submitted.name || "Unknown"}
                            </td>

                            <td>
                              {submitted.email || "-"}
                            </td>

                            <td>
                              {Array.isArray(submitted.skills)
                                ? submitted.skills.join(", ") || "-"
                                : submitted.skills || "-"}
                            </td>

                            <td>
                              {submitted.experience ?? "-"}
                            </td>

                            <td className="error-cell">

                              {errors.map((error, errorIndex) => (
                                <div key={errorIndex}>

                                  <strong>
                                    {error.loc?.join(".") || "Validation"}
                                  </strong>

                                  <p>
                                    {error.msg ||
                                      error.message ||
                                      error.type}
                                  </p>

                                </div>
                              ))}

                            </td>

                            <td>
                              <span className="invalid-badge">
                                Rejected
                              </span>
                            </td>

                            <td>
                              <button
                                className="details-button"
                                onClick={() => setSelectedRecord(record)}
                                title="View complete record"
                              >
                                <Eye size={16} />
                                View
                              </button>
                            </td>

                          </tr>
                        );

                      })}

                    </tbody>

                  </table>


                  {filteredInvalidRecords.length === 0 && (
                    <p className="empty-state">
                      No invalid records found.
                    </p>
                  )}

                </div>

              )}

            </div>


            {/* SELECTED RECORD DETAILS */}

            {selectedRecord && (

              <div className="content-card record-details">

                <div className="section-header">

                  <div>
                    <h3>Record Details</h3>

                    <p>
                      Record #{selectedRecord.record_number ?? "-"}
                    </p>
                  </div>

                  <button
                    className="close-button"
                    onClick={() => setSelectedRecord(null)}
                  >
                    Close
                  </button>

                </div>


                <h4>Original Submitted Data</h4>

                <pre>
                  {JSON.stringify(
                    selectedRecord.submitted_data,
                    null,
                    2
                  )}
                </pre>


                <h4>Validation Errors</h4>

                <pre>
                  {JSON.stringify(
                    selectedRecord.errors,
                    null,
                    2
                  )}
                </pre>

              </div>

            )}

          </section>

        )}

      </main>

    </div>
  );
}


// --------------------------------------------------
// REUSABLE CANDIDATE TABLE
// --------------------------------------------------

function CandidateTable({ candidates }) {

  return (

    <div className="table-container">

      <table className="candidate-table">

        <thead>
          <tr>
            <th>ID</th>
            <th>Candidate Name</th>
            <th>Email</th>
            <th>Skills</th>
            <th>Experience</th>
          </tr>
        </thead>


        <tbody>

          {candidates.map((candidate, index) => (

            <tr key={candidate.id || index}>

              <td>
                #{candidate.id || "-"}
              </td>

              <td className="candidate-name">
                {candidate.name}
              </td>

              <td>
                {candidate.email}
              </td>

              <td>
                {Array.isArray(candidate.skills)
                  ? candidate.skills.join(", ")
                  : candidate.skills || "-"}
              </td>

              <td>
                {candidate.experience ?? "-"} years
              </td>

            </tr>

          ))}

        </tbody>

      </table>


      {candidates.length === 0 && (
        <p className="empty-state">
          No candidate records available.
        </p>
      )}

    </div>

  );
}


export default App;
