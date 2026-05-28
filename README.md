# 💰 FinSight AI — Smart Finance Intelligence Platform

> Intelligent OCR-based expense tracking, personalized savings insights, and loan risk analysis in one unified fintech dashboard.

---

## 🚀 Features

### 📄 Intelligent Expense Categorizer (OCR)

* Upload receipt images
* OCR-based text extraction using Tesseract.js
* Auto-detect:

  * Merchant
  * Amount
  * Date
* Smart expense categorization
* Interactive expense dashboard

### Supported Categories

* 🍔 Food
* 🚕 Travel
* 🛍️ Shopping
* 🛒 Grocery
* 🎬 Entertainment
* 📦 Others

---

### 💡 Spend Smart — Saving Suggestion Engine

* Upload CSV transaction history
* Analyze 30-day spending patterns
* Detect overspending categories
* Generate personalized saving tips
* Monthly savings estimation
* Spending insights dashboard

#### Example Insights

* Biggest spending category
* Weekend overspending
* Most frequent merchant
* Potential monthly savings

---

### 🏦 Loan Risk Scoring Engine

* Debt-to-Income (DTI) analysis
* Credit history validation
* Default detection
* Loan approval/rejection prediction
* Credit score generation (300–900)
* Explainable decision engine

#### Example Rules

* DTI > 45% → High Risk
* Defaults > 1 → Reject
* Credit History < 6 months → Reject

---

# 🛠️ Tech Stack

| Frontend     | Backend    | Database | OCR          |
| ------------ | ---------- | -------- | ------------ |
| React.js     | Node.js    | MongoDB  | Tesseract.js |
| Tailwind CSS | Express.js | Mongoose | OCR Parsing  |
| Recharts     | REST APIs  |          |              |

---

# 📂 Project Structure

```bash
finance-intelligence/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── charts/
│   └── services/
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   │   ├── categorizer.js
│   │   ├── ocrService.js
│   │   ├── recommendationEngine.js
│   │   └── riskEngine.js
│   │
│   ├── models/
│   └── server.js
```

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/finsight-ai.git
cd finsight-ai
```

---

## 2️⃣ Install Dependencies

### Frontend

```bash
cd frontend
npm install
```

### Backend

```bash
cd backend
npm install
```

---

# ▶️ Running the Application

## Start Backend

```bash
cd backend
npm start
```

Backend runs on:

```bash
http://localhost:5000
```

---

## Start Frontend

```bash
cd frontend
npm start
```

Frontend runs on:

```bash
http://localhost:3000
```

---

# 📄 Sample Test Files

## CSV Transaction File

```bash
sample-transactions.csv
```

## OCR Receipt Testing

```bash
test-receipts/
```

---

# 📊 Dashboard Features

* 📈 Pie Charts
* 📊 Bar Charts
* 📅 Monthly Expense Summary
* 📉 Spending Trends
* 💰 Savings Insights
* 🧠 Financial Recommendations

---

# 🧠 Intelligent Recommendation Examples

```txt
You spent ₹8,000 on food delivery this month.
Reducing food orders by 20% could save ₹1,600/month.
```

```txt
You used Uber 18 times this month.
Consider a monthly metro or cab subscription plan.
```

---

# 🧪 API Endpoints

## OCR Upload

```http
POST /api/ocr/upload
```

---

## CSV Analytics

```http
POST /api/analytics/upload
```

---

## Loan Risk Analysis

```http
POST /api/risk/analyze
```

---

# 📈 Scoring Coverage

| Criteria               | Implementation            |
| ---------------------- | ------------------------- |
| OCR Accuracy           | Tesseract + Regex Parsing |
| Categorization Quality | Merchant + Keyword Rules  |
| Dashboard/UI           | Recharts + Responsive UI  |
| Logic                  | Rule-Based Engines        |
| Explainability         | Reason Codes              |
| Code Quality           | Modular Architecture      |

---

# 🌟 Future Improvements

* 🤖 AI-powered categorization
* 📈 ML-based saving predictions
* 👥 Multi-user authentication
* 🏦 Real-time bank integrations
* ⚙️ Dynamic rule configuration
* 🎙️ Voice-enabled financial assistant

-
