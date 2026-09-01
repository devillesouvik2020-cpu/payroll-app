require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection State
let isDbConnected = false;

async function connectDB() {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    // Try to load mongodb-memory-server if installed
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      console.log("ℹ️  No MONGODB_URI set — starting in-memory MongoDB...");
      const memServer = await MongoMemoryServer.create();
      uri = memServer.getUri();
      console.log(`✅ In-memory MongoDB running at: ${uri}`);
    } catch {
      // mongodb-memory-server not installed, fallback to default local URI
      uri = "mongodb://127.0.0.1:27017/payroll";
    }
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    isDbConnected = true;
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    isDbConnected = false;
    console.warn("⚠️  MongoDB Connection Failed:", err.message);
    console.warn(
      "👉 Start MongoDB on 127.0.0.1:27017 or set MONGODB_URI to a reachable MongoDB instance."
    );
  }
}

connectDB();

// ─── Employee Schema ───────────────────────────────────────────────────────────
const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
      default: () => "EMP" + Date.now().toString().slice(-6),
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    designation: { type: String, required: true },
    department: { type: String, required: true },
    basicPay: { type: Number, required: true, min: 0 },
    allowances: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    joiningDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

const Employee = mongoose.model("Employee", employeeSchema);

// ─── Payroll Schema ────────────────────────────────────────────────────────────
const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
    basicPay: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    status: {
      type: String,
      enum: ["generated", "paid"],
      default: "generated",
    },
  },
  { timestamps: true }
);

const Payroll = mongoose.model("Payroll", payrollSchema);

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Payroll API is running" });
});

app.use("/api", (req, res, next) => {
  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      message: "Database unavailable. Start MongoDB or configure MONGODB_URI.",
    });
  }
  next();
});

// ─── Employee Routes ───────────────────────────────────────────────────────────

// GET all employees
app.get("/api/employees", async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json({ success: true, data: employees, count: employees.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single employee
app.get("/api/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create employee
app.post("/api/employees", async (req, res) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();
    res
      .status(201)
      .json({ success: true, data: employee, message: "Employee created" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update employee
app.put("/api/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!employee)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    res.json({ success: true, data: employee, message: "Employee updated" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE employee
app.delete("/api/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    res.json({ success: true, message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Payroll Routes ────────────────────────────────────────────────────────────

// Generate payroll for an employee
app.post("/api/payroll/generate", async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;
    const employee = await Employee.findById(employeeId);
    if (!employee)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });

    // Check if payroll already exists for this month/year
    const existing = await Payroll.findOne({
      employee: employeeId,
      month,
      year,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Payroll for ${month}/${year} already generated`,
      });
    }

    const netSalary = employee.basicPay + employee.allowances - employee.deductions;

    const payroll = new Payroll({
      employee: employeeId,
      month,
      year,
      basicPay: employee.basicPay,
      allowances: employee.allowances,
      deductions: employee.deductions,
      netSalary,
    });

    await payroll.save();
    await payroll.populate("employee");

    res.status(201).json({ success: true, data: payroll });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET payroll records (optionally filter by employee or month/year)
app.get("/api/payroll", async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    const filter = {};
    if (employeeId) filter.employee = employeeId;
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const records = await Payroll.find(filter)
      .populate("employee", "name designation department employeeId")
      .sort({ year: -1, month: -1, createdAt: -1 });

    res.json({ success: true, data: records, count: records.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET payslip for a specific employee
app.get("/api/payroll/:id", async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate("employee");
    if (!payroll)
      return res
        .status(404)
        .json({ success: false, message: "Payroll record not found" });
    res.json({ success: true, data: payroll });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Mark payroll as paid
app.patch("/api/payroll/:id/pay", async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { status: "paid" },
      { new: true }
    ).populate("employee");
    if (!payroll)
      return res
        .status(404)
        .json({ success: false, message: "Payroll record not found" });
    res.json({ success: true, data: payroll, message: "Marked as paid" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Stats Route ───────────────────────────────────────────────────────────────
app.get("/api/stats", async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ status: "active" });
    const totalPayrolls = await Payroll.countDocuments();
    const paidPayrolls = await Payroll.countDocuments({ status: "paid" });

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const monthlyPayroll = await Payroll.aggregate([
      { $match: { month: currentMonth, year: currentYear } },
      { $group: { _id: null, total: { $sum: "$netSalary" } } },
    ]);

    const totalMonthlySalary =
      monthlyPayroll.length > 0 ? monthlyPayroll[0].total : 0;

    res.json({
      success: true,
      data: {
        totalEmployees,
        totalPayrolls,
        paidPayrolls,
        pendingPayrolls: totalPayrolls - paidPayrolls,
        totalMonthlySalary,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Backend running on port ${PORT}`)
);
