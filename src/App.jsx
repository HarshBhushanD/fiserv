import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Papa from "papaparse";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import * as THREE from "three";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from "recharts";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});
const COLORS = ["#22d3ee", "#14b8a6", "#38bdf8", "#a78bfa", "#fb7185"];

function evaluateRiskFrontend(input) {
  const income = Number(input.income || 0);
  const emi = Number(input.emi || 0);
  const defaults = Number(input.defaults || 0);
  const creditHistory = Number(input.creditHistory || 0);
  const age = Number(input.age || 0);
  const existingLoans = Number(input.existingLoans || 0);
  const dti = income > 0 ? (emi / income) * 100 : 100;

  let score = 300;
  const reasons = [];
  let approved = true;

  if (dti <= 30) {
    score += 200;
    reasons.push("Healthy debt-to-income ratio");
  } else if (dti <= 45) {
    score += 80;
    reasons.push("Manageable debt-to-income ratio");
  } else {
    reasons.push("DTI exceeded 45%");
    approved = false;
  }

  if (defaults === 0) {
    score += 150;
    reasons.push("No previous defaults");
  } else if (defaults === 1) {
    score += 40;
    reasons.push("One historical default");
  } else {
    reasons.push("More than one default in history");
    approved = false;
  }

  if (creditHistory >= 24) {
    score += 150;
    reasons.push("Strong credit history length");
  } else if (creditHistory >= 6) {
    score += 70;
    reasons.push("Moderate credit history");
  } else {
    reasons.push("Credit history less than 6 months");
    approved = false;
  }

  if (age >= 23 && age <= 58) {
    score += 60;
    reasons.push("Borrower age within stable earning bracket");
  }

  if (existingLoans <= 2) {
    score += 40;
  }

  score = Math.max(300, Math.min(900, Math.round(score)));
  const risk = !approved || score < 620 ? "High" : score < 740 ? "Medium" : "Low";

  return {
    score,
    risk,
    approval: approved && risk !== "High",
    reasons,
    dti: Number(dti.toFixed(2)),
  };
}

function ReceiptUploader({ onUploaded }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const onDrop = async (files) => {
    if (!files[0]) return;
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("receipt", files[0]);
    try {
      const { data } = await api.post("/ocr/upload", formData);
      onUploaded(data.transaction);
    } catch (err) {
      setError(err.response?.data?.error || "OCR upload failed");
    } finally {
      setLoading(false);
    }
  };
  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { "image/*": [] } });
  return (
    <div className="card soft-border">
      <div className="card-title">OCR Expense Upload</div>
      <p className="card-subtitle">Drop a receipt image and auto-extract merchant, date and amount.</p>
      <div {...getRootProps()} className={`dropzone ${loading ? "dropzone-loading" : ""}`}>
        <input {...getInputProps()} />
        {loading ? "Processing OCR..." : "Drag & drop receipt image here (or click to browse)"}
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

function CsvUploader({ onUploaded }) {
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: async ({ data }) => {
        const payload = data.filter((row) => row.amount);
        await api.post("/transactions/bulk", { transactions: payload });
        onUploaded();
      },
    });
  };
  return <input type="file" accept=".csv" onChange={handleFile} />;
}

function LoanRisk() {
  const [form, setForm] = useState({ income: "", existingLoans: "", emi: "", creditHistory: "", defaults: "", age: "" });
  const [result, setResult] = useState(null);

  const submit = async () => {
    const data = evaluateRiskFrontend(form);
    setResult(data);
  };

  return (
    <div className="card soft-border">
      <div className="card-title">Loan Risk Scoring Engine</div>
      <p className="card-subtitle">Explainable approval with DTI and credit behavior rules.</p>
      <div className="grid grid-2">
        {Object.keys(form).map((key) => (
          <input key={key} placeholder={key} value={form[key]} onChange={(e) => setForm((s) => ({ ...s, [key]: e.target.value }))} />
        ))}
      </div>
      <button className="btn btn-primary" onClick={submit} style={{ marginTop: 10 }}>Assess Loan Risk</button>
      {result && (
        <div style={{ marginTop: 12 }} className="result-panel">
          <b>Score:</b> {result.score} | <b>Risk:</b> {result.risk} | <b>Approved:</b> {String(result.approval)}
          <ul className="list">{result.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function App() {
  const bgCanvasRef = useRef(null);
  const contentRef = useRef(null);
  const [transactions, setTransactions] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [coachQ, setCoachQ] = useState("");
  const [coachA, setCoachA] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    try {
      const [txRes, recRes] = await Promise.all([api.get("/transactions"), api.get("/recommendations/analyze")]);
      setTransactions(txRes.data.transactions);
      setAnalysis(recRes.data);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const target = bgCanvasRef.current;
    if (!target) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ canvas: target, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.IcosahedronGeometry(1.7, 1);
    const material = new THREE.MeshStandardMaterial({
      color: "#2563eb",
      emissive: "#0ea5e9",
      emissiveIntensity: 0.45,
      metalness: 0.2,
      roughness: 0.3,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(1.6, 0.7, 0);
    scene.add(mesh);

    const ambient = new THREE.AmbientLight("#67e8f9", 1.3);
    const point = new THREE.PointLight("#38bdf8", 1.6);
    point.position.set(2, 2, 2);
    scene.add(ambient, point);

    let frameId;
    const tick = () => {
      mesh.rotation.x += 0.003;
      mesh.rotation.y += 0.004;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!contentRef.current) return;
    gsap.fromTo(
      ".card",
      { y: 24, opacity: 0, filter: "blur(4px)" },
      { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.7, stagger: 0.06, ease: "power3.out" }
    );
    gsap.fromTo(".hero h1", { backgroundPositionX: "0%" }, { backgroundPositionX: "100%", duration: 6, repeat: -1, ease: "none" });
  }, []);

  const monthly = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const key = new Date(t.date).toISOString().slice(0, 7);
      map[key] = (map[key] || 0) + Number(t.amount || 0);
    });
    return Object.entries(map).map(([month, amount]) => ({ month, amount }));
  }, [transactions]);

  const weekly = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const day = new Date(t.date).toLocaleDateString("en-US", { weekday: "short" });
      map[day] = (map[day] || 0) + Number(t.amount || 0);
    });
    return Object.entries(map).map(([day, amount]) => ({ day, amount }));
  }, [transactions]);

  const categoryData = analysis ? Object.entries(analysis.totals || {}).map(([name, value]) => ({ name, value })) : [];
  const categories = ["Food", "Travel", "Shopping", "Entertainment", "Groceries", "Health", "Transport", "Others"];
  const hasTransactions = transactions.length > 0;
  const hasCategoryData = categoryData.length > 0;

  return (
    <div className="app-shell">
      <canvas ref={bgCanvasRef} className="fx-canvas" />
      <div className="fx-overlay" />
    <div ref={contentRef} className="container">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="hero card">
        <div className="pill">Finance Intelligence Platform</div>
        <h1>FinSight</h1>
        <p>Live finance intelligence dashboard powered by your uploaded data.</p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={refresh}>{busy ? "Refreshing..." : "Refresh Dashboard"}</button>
          <span className="meta-text">{transactions.length} transactions tracked</span>
        </div>
      </motion.div>
      <div className="grid grid-2 section">
        <ReceiptUploader onUploaded={refresh} />
        <div className="card soft-border">
          <div className="card-title">CSV Upload (Spend Smart)</div>
          <p className="card-subtitle">Import historical transactions for stronger recommendations.</p>
          <CsvUploader onUploaded={refresh} />
          <button className="btn" style={{ marginTop: 8 }} onClick={refresh}>Refresh Dashboard</button>
        </div>
      </div>
      <div className="metrics-grid">
        {hasTransactions && analysis ? (
          <>
            <div className="card stat">
              <div>Total Spend</div>
              <b>INR {analysis.totalSpend}</b>
            </div>
            <div className="card stat">
              <div>Potential Saving</div>
              <b>INR {analysis.potentialSaving}</b>
            </div>
            <div className="card stat">
              <div>Top Category</div>
              <b>{analysis.biggestSpend?.category}</b>
            </div>
            <div className="card stat">
              <div>Frequent Merchant</div>
              <b>{analysis.mostFrequentMerchant?.merchant}</b>
            </div>
          </>
        ) : (
          <div className="card stat">
            <div>No live data yet</div>
            <b>Upload a receipt or CSV to populate dashboard</b>
          </div>
        )}
      </div>
      <div className="grid grid-2 section">
        <div className="card chart-card">
          <div className="card-title">Category Distribution</div>
          {hasCategoryData ? (
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" outerRadius={95}>
                  {categoryData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-panel">No categorized transactions yet.</div>
          )}
        </div>
        <div className="card chart-card">
          <div className="card-title">Monthly Spending</div>
          {monthly.length ? (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" /><YAxis /><Tooltip />
                <Bar dataKey="amount" fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-panel">Monthly chart appears after uploads.</div>
          )}
        </div>
      </div>
      <div className="card chart-card section">
        <div className="card-title">Weekly Trend</div>
        {weekly.length ? (
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" /><YAxis /><Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#22d3ee" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-panel">Weekly trend appears after uploads.</div>
        )}
      </div>

      {hasTransactions && analysis && (
        <div className="grid grid-2 section">
          <div className="card soft-border">
            <div className="card-title">Insight Cards</div>
            <p>Biggest Spend: {analysis.biggestSpend?.category} INR {analysis.biggestSpend?.amount}</p>
            <p>Potential Savings: INR {analysis.potentialSaving}</p>
            <p>Highest Day: {analysis.highestDay}</p>
            <p>Frequent Merchant: {analysis.mostFrequentMerchant?.merchant}</p>
            <ul className="list">{analysis.recommendations?.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
          <div className="card soft-border">
            <div className="card-title">AI Financial Coach</div>
            <input placeholder="Ask a question..." value={coachQ} onChange={(e) => setCoachQ(e.target.value)} />
            <button
              className="btn btn-primary"
              style={{ marginTop: 8 }}
              onClick={async () => {
                if (!coachQ.trim()) return;
                const { data } = await api.get("/recommendations/coach", { params: { question: coachQ } });
                setCoachA(data.response);
              }}
            >
              Ask Coach
            </button>
            {coachA && <p style={{ marginTop: 8 }}>{coachA}</p>}
          </div>
        </div>
      )}
      <div className="section">
        <LoanRisk />
      </div>
      <div className="card soft-border section">
        <div className="card-title">Recent Transactions (Manual Re-categorization)</div>
        {hasTransactions ? (
          transactions.slice(-8).reverse().map((tx) => (
            <div key={tx.id} className="txn-row">
              <span className="txn-main">{tx.merchant} - INR {tx.amount}</span>
              <span className="txn-date">{new Date(tx.date).toLocaleDateString()}</span>
              <select
                value={tx.category}
                onChange={async (e) => {
                  await api.patch(`/transactions/${tx.id}/category`, { category: e.target.value });
                  refresh();
                }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          ))
        ) : (
          <div className="empty-panel">No transactions yet.</div>
        )}
      </div>
    </div>
    </div>
  );
}

export default App;
