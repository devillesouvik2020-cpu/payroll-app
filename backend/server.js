require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

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
    await seedInitialData();
  } catch (err) {
    isDbConnected = false;
    console.warn("⚠️  MongoDB Connection Failed:", err.message);
    console.warn(
      "👉 Start MongoDB on 127.0.0.1:27017 or set MONGODB_URI to a reachable MongoDB instance."
    );
  }
}

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
    role: { type: String, enum: ["admin", "hr", "it", "employee"], default: "employee" },
    basicPay: { type: Number, required: true, min: 0 },
    allowances: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    joiningDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    // Personal Information (new)
    personalEmail: { type: String, default: "" },
    phone: { type: String, default: "" },
    dob: { type: String, default: "" },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    address: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    emergencyPhone: { type: String, default: "" },
    // Office Information (new)
    officeEmail: { type: String, default: "" },
    reportingManager: { type: String, default: "" },
    workLocation: { type: String, default: "" },
    employmentType: { type: String, enum: ["full-time", "part-time", "contract", "intern", ""], default: "" },
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
    // Hours-based fields
    hoursWorked:    { type: Number, default: 0 },   // actual hours worked
    standardHours:  { type: Number, default: 0 },   // expected hours for the month
    overtimeHours:  { type: Number, default: 0 },   // hours beyond standard
    overtimePay:    { type: Number, default: 0 },   // extra pay for overtime
    hourlyRate:     { type: Number, default: 0 },   // basicPay / standardHours
    status: {
      type: String,
      enum: ["generated", "paid"],
      default: "generated",
    },
  },
  { timestamps: true }
);

const Payroll = mongoose.model("Payroll", payrollSchema);

// ─── Attendance Schema ─────────────────────────────────────────────────────────
const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD format
    status: {
      type: String,
      enum: ["present", "absent", "late", "leave"],
      required: true,
    },
    checkIn: { type: String, default: "" },
    checkOut: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// One record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

// ─── TimeTracker Schema ────────────────────────────────────────────────────────
const timeTrackerSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    loginTime: { type: String, default: "" },
    logoutTime: { type: String, default: "" },
    totalHours: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    // "office" = recorded via Office Entry button; "manual" = added via Time Tracker page
    entryType: { type: String, enum: ["office", "manual", ""], default: "" },
  },
  { timestamps: true }
);

timeTrackerSchema.index({ employee: 1, date: 1 }, { unique: true });

const TimeTracker = mongoose.model("TimeTracker", timeTrackerSchema);

// ─── Task Schema ───────────────────────────────────────────────────────────────
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

// ─── Performance Schema ────────────────────────────────────────────────────────
const performanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: "" },
    strengths: { type: String, default: "" },
    improvements: { type: String, default: "" },
    goals: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "submitted", "reviewed"],
      default: "draft",
    },
    reviewDate: { type: String, default: "" },
  },
  { timestamps: true }
);

const Performance = mongoose.model("Performance", performanceSchema);

// ─── Asset Schema ──────────────────────────────────────────────────────────────
const assetSchema = new mongoose.Schema(
  {
    assetName: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "Laptop",
        "Desktop",
        "Monitor",
        "Keyboard",
        "Mouse",
        "Mobile",
        "ID Card",
        "Other",
      ],
      required: true,
    },
    assetId: {
      type: String,
      unique: true,
      default: () => "AST" + Date.now().toString().slice(-6),
    },
    serialNumber: { type: String, default: "" },
    purchaseDate: { type: String, default: "" },
    status: {
      type: String,
      enum: ["available", "assigned", "returned"],
      default: "available",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    assignmentDate: { type: String, default: "" },
    returnDate: { type: String, default: "" },
    condition: {
      type: String,
      enum: ["new", "good", "fair", "poor"],
      default: "new",
    },
  },
  { timestamps: true }
);

const Asset = mongoose.model("Asset", assetSchema);

// ─── HR Manager Schema ────────────────────────────────────────────────────────
const hrManagerSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Admin" },
    personalEmail: { type: String, default: "" },
    officeEmail: { type: String, default: "" },
    phone: { type: String, default: "" },
    managerId: {
      type: String,
      default: () => "HRM" + Date.now().toString().slice(-4),
    },
    department: { type: String, default: "Human Resources" },
    designation: { type: String, default: "HR Manager" },
    joiningDate: { type: String, default: "" },
    reportingTo: { type: String, default: "" },
    bio: { type: String, default: "" },
    address: { type: String, default: "" },
  },
  { timestamps: true }
);

const HRManager = mongoose.model("HRManager", hrManagerSchema);

// ─── Settings Schema ──────────────────────────────────────────────────────────
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);

// ─── User Schema (Login Accounts) ─────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "hr", "it", "employee"], default: "employee" },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// ─── Helper: Generate Random Password ─────────────────────────────────────────
function generateRandomPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Default settings
const DEFAULT_SETTINGS = {
  companyName: "PayrollPro Inc.",
  companyAddress: "",
  companyPhone: "",
  companyEmail: "",
  workingHoursStart: "09:00",
  workingHoursEnd: "18:00",
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  annualLeaves: 24,
  sickLeaves: 12,
  casualLeaves: 6,
  departments: [
    "Engineering",
    "Product",
    "Design",
    "Marketing",
    "Sales",
    "Finance",
    "HR",
    "Operations",
    "Legal",
    "Customer Support",
  ],
  designations: [
    "Intern",
    "Junior Developer",
    "Senior Developer",
    "Team Lead",
    "Manager",
    "Director",
    "VP",
    "CTO",
    "CEO",
  ],
  notifyOnAttendance: true,
  notifyOnLeave: true,
  notifyOnPayroll: true,
  notifyOnTask: true,
};

// ─── Initial Database Seeding ──────────────────────────────────────────────────
async function seedInitialData() {
  try {
    const empCount = await Employee.countDocuments();
    if (empCount > 0) return;

    console.log("🌱 Seeding realistic demo data (Employees, Attendance, Tasks, Assets, Performance, Payroll)...");

    const todayStr = new Date().toISOString().split("T")[0];

    const sampleEmployees = await Employee.insertMany([
      {
        employeeId: "EMP001",
        name: "Sarah Chen",
        email: "sarah.chen@payrollpro.io",
        personalEmail: "sarah.chen92@gmail.com",
        phone: "+91 98765 11001",
        dob: "1994-06-15",
        gender: "female",
        address: "742 Evergreen Terrace, Bengaluru",
        emergencyContact: "David Chen (Brother)",
        emergencyPhone: "+91 98765 11002",
        officeEmail: "sarah.chen@payrollpro.io",
        designation: "Senior Frontend Engineer",
        department: "Engineering",
        reportingManager: "Alex Henderson (VP Eng)",
        workLocation: "Bengaluru Campus",
        employmentType: "full-time",
        basicPay: 85000,
        allowances: 15000,
        deductions: 5000,
        status: "active",
      },
      {
        employeeId: "EMP002",
        name: "David Miller",
        email: "david.miller@payrollpro.io",
        personalEmail: "david.m.design@gmail.com",
        phone: "+91 98765 22001",
        dob: "1991-03-22",
        gender: "male",
        address: "24 Baker Street, Bengaluru",
        emergencyContact: "Emily Miller (Spouse)",
        emergencyPhone: "+91 98765 22002",
        officeEmail: "david.miller@payrollpro.io",
        designation: "Lead Product Designer",
        department: "Design",
        reportingManager: "Sarah Chen (Director)",
        workLocation: "Bengaluru Campus",
        employmentType: "full-time",
        basicPay: 78000,
        allowances: 12000,
        deductions: 4500,
        status: "active",
      },
      {
        employeeId: "EMP003",
        name: "Priya Sharma",
        email: "priya.sharma@payrollpro.io",
        personalEmail: "priyasharma.hr@gmail.com",
        phone: "+91 98765 33001",
        dob: "1995-11-08",
        gender: "female",
        address: "102 Palm Grove, Mumbai",
        emergencyContact: "Raj Sharma (Father)",
        emergencyPhone: "+91 98765 33002",
        officeEmail: "priya.sharma@payrollpro.io",
        designation: "Operations Manager",
        department: "Operations",
        reportingManager: "Admin (HR Manager)",
        workLocation: "Mumbai Hub",
        employmentType: "full-time",
        basicPay: 65000,
        allowances: 10000,
        deductions: 3500,
        status: "active",
      },
      {
        employeeId: "EMP004",
        name: "Michael Scott",
        email: "michael.scott@payrollpro.io",
        personalEmail: "worldsbestboss@dundermifflin.com",
        phone: "+91 98765 44001",
        dob: "1988-03-15",
        gender: "male",
        address: "1725 Slough Avenue, Delhi",
        emergencyContact: "Jim Halpert (Colleague)",
        emergencyPhone: "+91 98765 44002",
        officeEmail: "michael.scott@payrollpro.io",
        designation: "Regional Sales Director",
        department: "Sales",
        reportingManager: "CEO",
        workLocation: "Delhi Office",
        employmentType: "full-time",
        basicPay: 95000,
        allowances: 25000,
        deductions: 8000,
        status: "active",
      },
      {
        employeeId: "EMP005",
        name: "Ananya Roy",
        email: "ananya.roy@payrollpro.io",
        personalEmail: "ananya.dev@gmail.com",
        phone: "+91 98765 55001",
        dob: "1997-09-29",
        gender: "female",
        address: "88 Lake Gardens, Kolkata",
        emergencyContact: "Sunita Roy (Mother)",
        emergencyPhone: "+91 98765 55002",
        officeEmail: "ananya.roy@payrollpro.io",
        designation: "Backend Cloud Architect",
        department: "Engineering",
        reportingManager: "Alex Henderson (VP Eng)",
        workLocation: "Remote",
        employmentType: "full-time",
        basicPay: 90000,
        allowances: 18000,
        deductions: 6000,
        status: "active",
      },
    ]);

    // Attendance records for today
    await Attendance.insertMany([
      { employee: sampleEmployees[0]._id, date: todayStr, status: "present", checkIn: "09:05", checkOut: "18:15", notes: "Sprint delivery" },
      { employee: sampleEmployees[1]._id, date: todayStr, status: "present", checkIn: "08:58", checkOut: "18:00", notes: "Figma workshops" },
      { employee: sampleEmployees[2]._id, date: todayStr, status: "late", checkIn: "09:45", checkOut: "18:45", notes: "Traffic delay" },
      { employee: sampleEmployees[3]._id, date: todayStr, status: "leave", checkIn: "", checkOut: "", notes: "Client summit leave" },
      { employee: sampleEmployees[4]._id, date: todayStr, status: "present", checkIn: "09:12", checkOut: "18:10", notes: "Cloud deployment" },
    ]);

    // Sample TimeTracker entries
    await TimeTracker.insertMany([
      { employee: sampleEmployees[0]._id, date: todayStr, loginTime: "09:05", logoutTime: "18:15", totalHours: 9.1, notes: "UI components & bugfixes" },
      { employee: sampleEmployees[1]._id, date: todayStr, loginTime: "08:58", logoutTime: "18:00", totalHours: 9.0, notes: "Design tokens sync" },
      { employee: sampleEmployees[4]._id, date: todayStr, loginTime: "09:12", logoutTime: "18:10", totalHours: 8.9, notes: "Microservices optimization" },
    ]);

    // Sample Tasks
    await Task.insertMany([
      { title: "Redesign Employee Onboarding Portal", description: "Create responsive glassmorphic screens and interactive flow.", assignedTo: sampleEmployees[1]._id, priority: "high", dueDate: "2026-09-20", status: "in-progress" },
      { title: "Configure Production MongoDB Indexes", description: "Optimize query latency for payroll aggregation pipeline.", assignedTo: sampleEmployees[4]._id, priority: "high", dueDate: "2026-09-18", status: "completed" },
      { title: "Quarterly Sales Pipeline Review", description: "Prepare regional revenue projection report for Q4.", assignedTo: sampleEmployees[3]._id, priority: "medium", dueDate: "2026-09-25", status: "pending" },
      { title: "React 19 State Migration", description: "Update context and form handlers across all modules.", assignedTo: sampleEmployees[0]._id, priority: "medium", dueDate: "2026-09-22", status: "in-progress" },
    ]);

    // Sample Performance
    await Performance.insertMany([
      {
        employee: sampleEmployees[0]._id,
        rating: 5,
        review: "Exceptional architecture skills and team leadership during recent project deadlines.",
        strengths: "Speed of execution, clean component patterns, mentoring juniors.",
        improvements: "Can delegate more routine pull request reviews.",
        goals: "Spearhead the frontend component design system for 2027.",
        status: "reviewed",
        reviewDate: todayStr,
      },
      {
        employee: sampleEmployees[1]._id,
        rating: 5,
        review: "Delivers pixel-perfect mockups and user experiences with deep empathy for customer flows.",
        strengths: "Visual flair, design system rigor, rapid wireframing.",
        improvements: "User research interview documentation.",
        goals: "Create company design guidelines book.",
        status: "reviewed",
        reviewDate: todayStr,
      },
      {
        employee: sampleEmployees[4]._id,
        rating: 4,
        review: "Strong cloud infrastructure knowledge, reduced deployment downtime by 40%.",
        strengths: "Kubernetes, MongoDB clustering, automated CI/CD.",
        improvements: "Cross-team communication on breaking changes.",
        goals: "Attain AWS Solutions Architect Professional certification.",
        status: "reviewed",
        reviewDate: todayStr,
      },
    ]);

    // Sample Assets
    await Asset.insertMany([
      { assetName: "MacBook Pro 16' M3 Pro", category: "Laptop", assetId: "AST-1001", serialNumber: "C02G899KMD6T", purchaseDate: "2024-01-15", status: "assigned", assignedTo: sampleEmployees[0]._id, assignmentDate: "2024-01-20", condition: "good" },
      { assetName: "Dell UltraSharp 27' 4K Monitor", category: "Monitor", assetId: "AST-1002", serialNumber: "CN-09K827-74261", purchaseDate: "2024-02-10", status: "assigned", assignedTo: sampleEmployees[1]._id, assignmentDate: "2024-02-15", condition: "new" },
      { assetName: "Apple Magic Keyboard + Trackpad", category: "Keyboard", assetId: "AST-1003", serialNumber: "MK-2024-8819", purchaseDate: "2024-03-01", status: "available", condition: "new" },
      { assetName: "ThinkPad P16 Gen 2 Workstation", category: "Laptop", assetId: "AST-1004", serialNumber: "TP-9921-9981", purchaseDate: "2023-11-20", status: "assigned", assignedTo: sampleEmployees[4]._id, assignmentDate: "2023-12-01", condition: "good" },
    ]);

    // Sample Payroll for current month
    const curMonth = new Date().getMonth() + 1;
    const curYear = new Date().getFullYear();
    await Payroll.insertMany([
      { employee: sampleEmployees[0]._id, month: curMonth, year: curYear, basicPay: 85000, allowances: 15000, deductions: 5000, netSalary: 95000, status: "paid" },
      { employee: sampleEmployees[1]._id, month: curMonth, year: curYear, basicPay: 78000, allowances: 12000, deductions: 4500, netSalary: 85500, status: "paid" },
      { employee: sampleEmployees[2]._id, month: curMonth, year: curYear, basicPay: 65000, allowances: 10000, deductions: 3500, netSalary: 71500, status: "generated" },
    ]);

    // Ensure HR Manager profile exists
    await HRManager.create({
      name: "Admin",
      managerId: "HR-MGR-001",
      designation: "Head of Human Resources & People Operations",
      department: "Human Resources",
      officeEmail: "admin.hr@payrollpro.io",
      personalEmail: "admin.personal@gmail.com",
      phone: "+91 98765 43210",
      joiningDate: "2022-04-01",
      reportingTo: "Chief Executive Officer (CEO)",
      bio: "Overseeing talent acquisition, organizational culture, compensation structuring, and compliance across all business units.",
    });

    // Create login accounts for seeded employees
    const demoPassword = "Demo@12345";
    const demoHash = await bcrypt.hash(demoPassword, 10);

    await User.insertMany([
      { email: "sarah.chen@payrollpro.io", passwordHash: demoHash, role: "employee", employee: sampleEmployees[0]._id },
      { email: "david.miller@payrollpro.io", passwordHash: demoHash, role: "employee", employee: sampleEmployees[1]._id },
      { email: "priya.sharma@payrollpro.io", passwordHash: demoHash, role: "hr", employee: sampleEmployees[2]._id },
      { email: "michael.scott@payrollpro.io", passwordHash: demoHash, role: "employee", employee: sampleEmployees[3]._id },
      { email: "ananya.roy@payrollpro.io", passwordHash: demoHash, role: "employee", employee: sampleEmployees[4]._id },
      { email: "admin.hr@payrollpro.io", passwordHash: demoHash, role: "admin", employee: null },
    ]);

    console.log("✅ Demo database successfully seeded with employees, attendance, tasks, assets, payroll & user accounts.");
  } catch (err) {
    console.warn("⚠️ Error seeding database:", err.message);
  }
}

connectDB();

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

// Helper function for duration calculation
function calcHours(login, logout) {
  if (!login || !logout) return 0;
  const [h1, m1] = login.split(":").map(Number);
  const [h2, m2] = logout.split(":").map(Number);
  const diffMinutes = h2 * 60 + m2 - (h1 * 60 + m1);
  if (diffMinutes <= 0) return 0;
  return Number((diffMinutes / 60).toFixed(2));
}

// GET employees who worked on current date
// Only includes employees who used the Office Entry button (entryType = "office")
app.get("/api/employees/logged-in-today", async (req, res) => {
  try {
    const today = req.query.date || new Date().toISOString().split("T")[0];

    // Only fetch TimeTracker records created via the Office Entry flow
    const timeRecords = await TimeTracker.find({
      date: today,
      entryType: "office",
      loginTime: { $exists: true, $ne: "" },
    })
      .populate("employee", "name designation department employeeId email status")
      .sort({ loginTime: 1 });

    // Current time for live hours on still-active employees
    const nowDate = new Date();
    const nowStr  = `${String(nowDate.getHours()).padStart(2, "0")}:${String(nowDate.getMinutes()).padStart(2, "0")}`;

    const records = timeRecords
      .filter((tr) => tr.employee?._id) // skip orphaned records
      .map((tr) => {
        const logoutTime  = tr.logoutTime || "";
        const isActive    = !logoutTime;
        const workedHours = logoutTime
          ? (tr.totalHours || calcHours(tr.loginTime, logoutTime))
          : calcHours(tr.loginTime, nowStr);

        return {
          _id:              tr._id,
          employee:         tr.employee,
          date:             tr.date,
          loginTime:        tr.loginTime,
          logoutTime,
          workedHours:      Number(workedHours.toFixed(2)),
          isActive,
          attendanceStatus: "present",
          notes:            tr.notes || "",
          source:           "office-entry",
        };
      });

    res.json({
      success: true,
      data: records,
      count: records.length,
      date: today,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET monthly attendance for a specific employee (login/logout + extra hours)
// IMPORTANT: must be before GET /api/employees/:id to avoid route collision
app.get("/api/employees/:id/monthly-attendance", async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    const mm = String(month || new Date().getMonth() + 1).padStart(2, "0");
    const yy = year || new Date().getFullYear();
    const dateRegex = `^${yy}-${mm}`;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const [attendanceRecords, timeRecords] = await Promise.all([
      Attendance.find({ employee: id, date: { $regex: dateRegex } }).sort({ date: 1 }),
      TimeTracker.find({ employee: id, date: { $regex: dateRegex } }).sort({ date: 1 }),
    ]);

    const dayMap = new Map();

    attendanceRecords.forEach((rec) => {
      dayMap.set(rec.date, {
        date: rec.date,
        status: rec.status,
        checkIn: rec.checkIn || "",
        checkOut: rec.checkOut || "",
        notes: rec.notes || "",
        loginTime: rec.checkIn || "",
        logoutTime: rec.checkOut || "",
        totalHours: rec.checkIn && rec.checkOut ? calcHours(rec.checkIn, rec.checkOut) : 0,
        extraHours: 0,
        source: "attendance",
      });
    });

    timeRecords.forEach((rec) => {
      const existing = dayMap.get(rec.date);
      const totalHours = rec.totalHours || (rec.loginTime && rec.logoutTime ? calcHours(rec.loginTime, rec.logoutTime) : 0);
      if (existing) {
        if (rec.loginTime) existing.loginTime = rec.loginTime;
        if (rec.logoutTime) existing.logoutTime = rec.logoutTime;
        existing.totalHours = totalHours;
        existing.source = "both";
      } else {
        dayMap.set(rec.date, {
          date: rec.date,
          status: totalHours > 0 ? "present" : "absent",
          checkIn: rec.loginTime || "",
          checkOut: rec.logoutTime || "",
          notes: rec.notes || "",
          loginTime: rec.loginTime || "",
          logoutTime: rec.logoutTime || "",
          totalHours,
          extraHours: 0,
          source: "time-tracker",
        });
      }
    });

    const STANDARD_HOURS = 8;
    const days = Array.from(dayMap.values())
      .map((d) => ({ ...d, extraHours: Math.max(0, Number((d.totalHours - STANDARD_HOURS).toFixed(2))) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const presentDays      = days.filter((d) => d.status === "present" || d.status === "late").length;
    const absentDays       = days.filter((d) => d.status === "absent").length;
    const leaveDays        = days.filter((d) => d.status === "leave").length;
    const totalExtraHours  = days.reduce((sum, d) => sum + d.extraHours, 0);
    const totalWorkingHours = days.reduce((sum, d) => sum + d.totalHours, 0);

    const daysInMonth = new Date(Number(yy), Number(mm), 0).getDate();
    let workingDaysInMonth = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(Number(yy), Number(mm) - 1, d).getDay();
      if (dow !== 0 && dow !== 6) workingDaysInMonth++;
    }

    res.json({
      success: true,
      data: {
        employee: {
          _id: employee._id,
          name: employee.name,
          employeeId: employee.employeeId,
          designation: employee.designation,
          department: employee.department,
          basicPay: employee.basicPay,
          allowances: employee.allowances,
          deductions: employee.deductions,
        },
        month: Number(mm),
        year: Number(yy),
        days,
        summary: {
          presentDays,
          absentDays,
          leaveDays,
          totalWorkingHours: Number(totalWorkingHours.toFixed(2)),
          totalExtraHours: Number(totalExtraHours.toFixed(2)),
          workingDaysInMonth,
        },
      },
    });
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

    // Auto-generate login credentials for the new employee
    const rawPassword = generateRandomPassword();
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    await User.create({
      email: employee.email,
      passwordHash,
      role: employee.role || "employee",
      employee: employee._id,
    });

    res.status(201).json({
      success: true,
      data: employee,
      credentials: { email: employee.email, password: rawPassword },
      message: "Employee created",
    });
  } catch (err) {
    // If User creation failed but Employee was created, clean up
    if (err.code === 11000 && err.keyPattern?.email) {
      res.status(400).json({ success: false, message: "A login account with this email already exists." });
    } else {
      res.status(400).json({ success: false, message: err.message });
    }
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
      .populate("employee", "name designation department employeeId email")
      .sort({ year: -1, month: -1, createdAt: -1 });

    res.json({ success: true, data: records, count: records.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Generate Payroll based on Working Hours ──────────────────────────────────
// Formula:
//   standardHours      = workingDaysInMonth × 8
//   hourlyRate         = basicPay / standardHours
//   earnedBasic        = min(actualHours, standardHours) × hourlyRate
//   overtimeHours      = max(0, actualHours - standardHours)
//   overtimePay        = overtimeHours × hourlyRate × 1.5
//   netSalary          = earnedBasic + overtimePay + allowances - deductions
app.post("/api/payroll/generate-attendance-based", async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;
    if (!employeeId || !month || !year) {
      return res.status(400).json({ success: false, message: "employeeId, month, year are required" });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Check if payroll already exists
    const existing = await Payroll.findOne({ employee: employeeId, month: Number(month), year: Number(year) });
    if (existing) {
      return res.status(400).json({ success: false, message: `Payroll for ${month}/${year} already generated` });
    }

    const mm = String(month).padStart(2, "0");

    // Fetch TimeTracker records (primary source for hours)
    const timeRecords = await TimeTracker.find({
      employee: employeeId,
      date: { $regex: `^${year}-${mm}` },
    });

    // Fallback: attendance checkIn/checkOut if no TimeTracker entries
    const attendanceRecords = await Attendance.find({
      employee: employeeId,
      date: { $regex: `^${year}-${mm}` },
    });

    // Build a hours map by date (TimeTracker takes priority)
    const hoursMap = new Map();
    attendanceRecords.forEach((r) => {
      if (r.checkIn && r.checkOut) {
        hoursMap.set(r.date, calcHours(r.checkIn, r.checkOut));
      }
    });
    timeRecords.forEach((r) => {
      const h = r.totalHours || (r.loginTime && r.logoutTime ? calcHours(r.loginTime, r.logoutTime) : 0);
      if (h > 0) hoursMap.set(r.date, h);
    });

    const actualHours = Array.from(hoursMap.values()).reduce((sum, h) => sum + h, 0);

    // Standard hours for the month (Mon–Fri × 8h)
    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
    let workingDaysInMonth = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(Number(year), Number(month) - 1, d).getDay();
      if (dow !== 0 && dow !== 6) workingDaysInMonth++;
    }
    const standardHours = workingDaysInMonth * 8;

    // If no hours recorded at all, fall back to full salary
    const effectiveHours = actualHours > 0 ? actualHours : standardHours;

    const hourlyRate      = standardHours > 0 ? employee.basicPay / standardHours : 0;
    const earnedBasic     = Math.round(Math.min(effectiveHours, standardHours) * hourlyRate);
    const overtimeHours   = Math.max(0, Number((effectiveHours - standardHours).toFixed(2)));
    const overtimePay     = Math.round(overtimeHours * hourlyRate * 1.5);
    const netSalary       = Math.max(0, earnedBasic + overtimePay + employee.allowances - employee.deductions);

    const payroll = new Payroll({
      employee: employeeId,
      month: Number(month),
      year: Number(year),
      basicPay: earnedBasic,
      allowances: employee.allowances,
      deductions: employee.deductions,
      netSalary,
      hoursWorked:   Number(effectiveHours.toFixed(2)),
      standardHours,
      overtimeHours,
      overtimePay,
      hourlyRate:    Number(hourlyRate.toFixed(2)),
    });

    await payroll.save();
    await payroll.populate("employee");

    res.status(201).json({
      success: true,
      data: payroll,
      meta: {
        actualHours: Number(effectiveHours.toFixed(2)),
        standardHours,
        overtimeHours,
        hourlyRate: Number(hourlyRate.toFixed(2)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Get or generate payslip for employee for a specific month/year ───────────
app.get("/api/payroll/payslip/:employeeId/:year/:month", async (req, res) => {
  try {
    const { employeeId, month, year } = req.params;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    let payroll = await Payroll.findOne({
      employee: employeeId,
      month: Number(month),
      year: Number(year),
    }).populate("employee");

    // Already generated — return as-is
    if (payroll) {
      return res.json({ success: true, data: payroll });
    }

    // ── Preview: calculate hours-based salary without saving ──
    const mm = String(month).padStart(2, "0");

    const [timeRecords, attendanceRecords] = await Promise.all([
      TimeTracker.find({ employee: employeeId, date: { $regex: `^${year}-${mm}` } }),
      Attendance.find({ employee: employeeId, date: { $regex: `^${year}-${mm}` } }),
    ]);

    // Build hours map — TimeTracker takes priority over attendance checkIn/Out
    const hoursMap = new Map();
    attendanceRecords.forEach((r) => {
      if (r.checkIn && r.checkOut) hoursMap.set(r.date, calcHours(r.checkIn, r.checkOut));
    });
    timeRecords.forEach((r) => {
      const h = r.totalHours || (r.loginTime && r.logoutTime ? calcHours(r.loginTime, r.logoutTime) : 0);
      if (h > 0) hoursMap.set(r.date, h);
    });

    const actualHours = Array.from(hoursMap.values()).reduce((sum, h) => sum + h, 0);

    // Standard hours for the month (Mon–Fri × 8h)
    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
    let workingDaysInMonth = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(Number(year), Number(month) - 1, d).getDay();
      if (dow !== 0 && dow !== 6) workingDaysInMonth++;
    }
    const standardHours   = workingDaysInMonth * 8;
    const effectiveHours  = actualHours > 0 ? actualHours : standardHours;
    const hourlyRate      = standardHours > 0 ? employee.basicPay / standardHours : 0;
    const earnedBasic     = Math.round(Math.min(effectiveHours, standardHours) * hourlyRate);
    const overtimeHours   = Math.max(0, Number((effectiveHours - standardHours).toFixed(2)));
    const overtimePay     = Math.round(overtimeHours * hourlyRate * 1.5);
    const netSalary       = Math.max(0, earnedBasic + overtimePay + employee.allowances - employee.deductions);

    return res.json({
      success: true,
      data: {
        _id: null,
        employee,
        month: Number(month),
        year: Number(year),
        basicPay: earnedBasic,
        allowances: employee.allowances,
        deductions: employee.deductions,
        netSalary,
        hoursWorked:  Number(effectiveHours.toFixed(2)),
        standardHours,
        overtimeHours,
        overtimePay,
        hourlyRate:   Number(hourlyRate.toFixed(2)),
        status: "preview",
      },
      meta: { actualHours: Number(effectiveHours.toFixed(2)), standardHours, overtimeHours, hourlyRate: Number(hourlyRate.toFixed(2)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all payslips for a specific employee (for My Payslips page)
app.get("/api/payroll/employee/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const records = await Payroll.find({ employee: employeeId })
      .populate("employee", "name designation department employeeId email joiningDate")
      .sort({ year: -1, month: -1 });
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

// ─── Attendance Routes ─────────────────────────────────────────────────────────

// GET attendance records with filters
app.get("/api/attendance", async (req, res) => {
  try {
    const { employeeId, date, month, year, status } = req.query;
    const filter = {};
    if (employeeId) filter.employee = employeeId;
    if (date) filter.date = date;
    if (status) filter.status = status;
    if (month && year) {
      const mm = String(month).padStart(2, "0");
      filter.date = { $regex: `^${year}-${mm}` };
    }

    const records = await Attendance.find(filter)
      .populate("employee", "name designation department employeeId")
      .sort({ date: -1, createdAt: -1 });

    res.json({ success: true, data: records, count: records.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET today's attendance summary
app.get("/api/attendance/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const records = await Attendance.find({ date: today })
      .populate("employee", "name designation department employeeId");

    const summary = {
      present: records.filter((r) => r.status === "present").length,
      absent: records.filter((r) => r.status === "absent").length,
      late: records.filter((r) => r.status === "late").length,
      leave: records.filter((r) => r.status === "leave").length,
      total: records.length,
    };

    res.json({ success: true, data: { records, summary } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET attendance summary for a month
app.get("/api/attendance/summary", async (req, res) => {
  try {
    const { month, year } = req.query;
    const mm = String(month || new Date().getMonth() + 1).padStart(2, "0");
    const yy = year || new Date().getFullYear();

    const records = await Attendance.find({
      date: { $regex: `^${yy}-${mm}` },
    });

    const summary = {
      present: records.filter((r) => r.status === "present").length,
      absent: records.filter((r) => r.status === "absent").length,
      late: records.filter((r) => r.status === "late").length,
      leave: records.filter((r) => r.status === "leave").length,
      total: records.length,
    };

    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST mark attendance
app.post("/api/attendance", async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, notes } = req.body;
    if (!employeeId || !date || !status) {
      return res
        .status(400)
        .json({ success: false, message: "employeeId, date, and status are required" });
    }

    // Upsert: update if exists for that employee+date, else create
    const record = await Attendance.findOneAndUpdate(
      { employee: employeeId, date },
      { employee: employeeId, date, status, checkIn, checkOut, notes },
      { new: true, upsert: true, runValidators: true }
    );
    await record.populate("employee", "name designation department employeeId");

    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
// PUT update attendance record
app.put("/api/attendance/:id", async (req, res) => {
  try {
    const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("employee", "name designation department employeeId");
    if (!record) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE attendance record
app.delete("/api/attendance/:id", async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }
    res.json({ success: true, message: "Attendance record deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Time Tracker Routes ───────────────────────────────────────────────────────

// GET time tracker records
app.get("/api/time-tracker", async (req, res) => {
  try {
    const { employeeId, date, month, year } = req.query;
    const filter = {};
    if (employeeId) filter.employee = employeeId;
    if (date) filter.date = date;
    if (month && year) {
      const mm = String(month).padStart(2, "0");
      filter.date = { $regex: `^${year}-${mm}` };
    }

    const records = await TimeTracker.find(filter)
      .populate("employee", "name designation department employeeId")
      .sort({ date: -1, createdAt: -1 });

    res.json({ success: true, data: records, count: records.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST log time
app.post("/api/time-tracker", async (req, res) => {
  try {
    const { employeeId, date, loginTime, logoutTime, notes } = req.body;
    if (!employeeId || !date) {
      return res
        .status(400)
        .json({ success: false, message: "employeeId and date are required" });
    }

    // Calculate total hours if both times given
    let totalHours = 0;
    if (loginTime && logoutTime) {
      const [lh, lm] = loginTime.split(":").map(Number);
      const [oh, om] = logoutTime.split(":").map(Number);
      totalHours = Math.max(0, (oh * 60 + om - (lh * 60 + lm)) / 60);
      totalHours = Math.round(totalHours * 100) / 100;
    }

    const record = await TimeTracker.findOneAndUpdate(
      { employee: employeeId, date },
      { employee: employeeId, date, loginTime, logoutTime, totalHours, notes },
      { new: true, upsert: true, runValidators: true }
    );
    await record.populate("employee", "name designation department employeeId");

    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── Task Routes ───────────────────────────────────────────────────────────────

// GET all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const { assignedTo, status, priority } = req.query;
    const filter = {};
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name designation department employeeId")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tasks, count: tasks.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET task stats
app.get("/api/tasks/stats", async (req, res) => {
  try {
    const total = await Task.countDocuments();
    const pending = await Task.countDocuments({ status: "pending" });
    const inProgress = await Task.countDocuments({ status: "in-progress" });
    const completed = await Task.countDocuments({ status: "completed" });

    res.json({
      success: true,
      data: { total, pending, inProgress, completed },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create task
app.post("/api/tasks", async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    await task.populate("assignedTo", "name designation department employeeId");
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update task
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("assignedTo", "name designation department employeeId");
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Performance Routes ────────────────────────────────────────────────────────

// GET all performance reviews
app.get("/api/performance", async (req, res) => {
  try {
    const { employeeId, status } = req.query;
    const filter = {};
    if (employeeId) filter.employee = employeeId;
    if (status) filter.status = status;

    const reviews = await Performance.find(filter)
      .populate("employee", "name designation department employeeId")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews, count: reviews.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create performance review
app.post("/api/performance", async (req, res) => {
  try {
    const { employee: empId, ...rest } = req.body;
    const review = new Performance({ employee: empId, ...rest });
    await review.save();
    await review.populate(
      "employee",
      "name designation department employeeId"
    );
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update performance review
app.put("/api/performance/:id", async (req, res) => {
  try {
    const review = await Performance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("employee", "name designation department employeeId");
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE performance review
app.delete("/api/performance/:id", async (req, res) => {
  try {
    const review = await Performance.findByIdAndDelete(req.params.id);
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Asset Routes ──────────────────────────────────────────────────────────────

// GET all assets
app.get("/api/assets", async (req, res) => {
  try {
    const { category, status, assignedTo } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    const assets = await Asset.find(filter)
      .populate("assignedTo", "name designation department employeeId")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: assets, count: assets.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create asset
app.post("/api/assets", async (req, res) => {
  try {
    const asset = new Asset(req.body);
    await asset.save();
    if (asset.assignedTo) {
      await asset.populate(
        "assignedTo",
        "name designation department employeeId"
      );
    }
    res.status(201).json({ success: true, data: asset });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update asset
app.put("/api/assets/:id", async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("assignedTo", "name designation department employeeId");
    if (!asset)
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    res.json({ success: true, data: asset });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE asset
app.delete("/api/assets/:id", async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset)
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    res.json({ success: true, message: "Asset deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── HR Manager Routes ────────────────────────────────────────────────────────

// GET HR Manager profile (returns the single profile, or creates a default one)
app.get("/api/hr-manager", async (req, res) => {
  try {
    let manager = await HRManager.findOne();
    if (!manager) {
      manager = await HRManager.create({});
    }
    res.json({ success: true, data: manager });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update HR Manager profile
app.put("/api/hr-manager", async (req, res) => {
  try {
    let manager = await HRManager.findOne();
    if (!manager) {
      manager = await HRManager.create(req.body);
    } else {
      Object.assign(manager, req.body);
      await manager.save();
    }
    res.json({ success: true, data: manager, message: "Profile updated" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── Settings Routes ──────────────────────────────────────────────────────────

// GET all settings
app.get("/api/settings", async (req, res) => {
  try {
    const dbSettings = await Settings.find();
    // Merge with defaults
    const result = { ...DEFAULT_SETTINGS };
    dbSettings.forEach((s) => {
      result[s.key] = s.value;
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update settings (accepts key-value pairs)
app.put("/api/settings", async (req, res) => {
  try {
    const updates = req.body; // { key1: value1, key2: value2 }
    for (const [key, value] of Object.entries(updates)) {
      await Settings.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true }
      );
    }
    // Return merged settings
    const dbSettings = await Settings.find();
    const result = { ...DEFAULT_SETTINGS };
    dbSettings.forEach((s) => {
      result[s.key] = s.value;
    });
    res.json({ success: true, data: result, message: "Settings updated" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── Enhanced Stats Route ──────────────────────────────────────────────────────
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

    // Today's attendance
    const today = new Date().toISOString().split("T")[0];
    const todayAttendance = await Attendance.find({ date: today });
    const presentToday = todayAttendance.filter(
      (a) => a.status === "present" || a.status === "late"
    ).length;

    // Attendance overview for current month
    const mm = String(currentMonth).padStart(2, "0");
    const monthAttendance = await Attendance.find({
      date: { $regex: `^${currentYear}-${mm}` },
    });
    const attendanceOverview = {
      present: monthAttendance.filter((a) => a.status === "present").length,
      absent: monthAttendance.filter((a) => a.status === "absent").length,
      late: monthAttendance.filter((a) => a.status === "late").length,
      leave: monthAttendance.filter((a) => a.status === "leave").length,
    };

    // Top department by employee count
    const departmentCounts = await Employee.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
    const topDepartment = departmentCounts.length > 0
      ? departmentCounts[0]
      : { _id: "N/A", count: 0 };

    // Task stats
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: "pending" });
    const completedTasks = await Task.countDocuments({ status: "completed" });

    res.json({
      success: true,
      data: {
        totalEmployees,
        totalPayrolls,
        paidPayrolls,
        pendingPayrolls: totalPayrolls - paidPayrolls,
        totalMonthlySalary,
        presentToday,
        attendanceOverview,
        topDepartment,
        departmentCounts,
        totalTasks,
        pendingTasks,
        completedTasks,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Auth Routes ──────────────────────────────────────────────────────────────

// POST login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate("employee", "name designation department employeeId");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Auto-record login for employee if logging in today and no entry exists
    if (user.employee && user.employee._id) {
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const existingTracker = await TimeTracker.findOne({ employee: user.employee._id, date: todayStr });
        if (!existingTracker) {
          await TimeTracker.create({
            employee: user.employee._id,
            date: todayStr,
            loginTime: timeStr,
            notes: "Portal Web Login",
            entryType: "manual",
          });
        }
      } catch (trackErr) {
        console.warn("Could not auto-record login in TimeTracker:", trackErr.message);
      }
    }

    res.json({
      success: true,
      data: {
        email: user.email,
        role: user.role,
        employee: user.employee,
      },
      message: "Login successful",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all user accounts (admin reference)
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("-passwordHash")
      .populate("employee", "name designation department employeeId")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: users, count: users.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Office Entry / Exit Routes ───────────────────────────────────────────────

// GET today's office status for an employee
app.get("/api/office/status/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = new Date().toISOString().split("T")[0];

    const tracker = await TimeTracker.findOne({ employee: employeeId, date: today });
    const attendance = await Attendance.findOne({ employee: employeeId, date: today });

    if (!tracker && !attendance) {
      return res.json({ success: true, data: { status: "not_entered", loginTime: null, logoutTime: null, date: today } });
    }

    const loginTime  = tracker?.loginTime  || attendance?.checkIn  || null;
    const logoutTime = tracker?.logoutTime || attendance?.checkOut || null;

    let status = "not_entered";
    if (loginTime && logoutTime) status = "exited";
    else if (loginTime)          status = "inside";

    res.json({ success: true, data: { status, loginTime, logoutTime, date: today } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST — Enter Office (records login time; only once per day)
app.post("/api/office/enter", async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: "employeeId is required" });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const today = new Date().toISOString().split("T")[0];
    const now   = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Check if already entered today
    const existingTracker = await TimeTracker.findOne({ employee: employeeId, date: today });
    if (existingTracker?.loginTime) {
      return res.status(400).json({
        success: false,
        message: `Already entered office today at ${existingTracker.loginTime}`,
        data: { loginTime: existingTracker.loginTime, logoutTime: existingTracker.logoutTime || null },
      });
    }

    // Upsert TimeTracker with login time
    const tracker = await TimeTracker.findOneAndUpdate(
      { employee: employeeId, date: today },
      { employee: employeeId, date: today, loginTime: timeStr, logoutTime: "", totalHours: 0, notes: "Office Entry", entryType: "office" },
      { new: true, upsert: true }
    );

    // Also upsert Attendance as "present"
    await Attendance.findOneAndUpdate(
      { employee: employeeId, date: today },
      { employee: employeeId, date: today, status: "present", checkIn: timeStr, notes: "Office Entry" },
      { upsert: true }
    );

    res.json({
      success: true,
      message: `Welcome, ${employee.name}! Entered office at ${timeStr}`,
      data: { status: "inside", loginTime: timeStr, logoutTime: null, date: today },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST — Exit Office (records logout time; only if already entered)
app.post("/api/office/exit", async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: "employeeId is required" });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const today = new Date().toISOString().split("T")[0];
    const now   = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const tracker = await TimeTracker.findOne({ employee: employeeId, date: today });
    if (!tracker?.loginTime) {
      return res.status(400).json({ success: false, message: "You haven't entered the office today yet." });
    }
    if (tracker.logoutTime) {
      return res.status(400).json({
        success: false,
        message: `Already exited office today at ${tracker.logoutTime}`,
        data: { loginTime: tracker.loginTime, logoutTime: tracker.logoutTime },
      });
    }

    const totalHours = calcHours(tracker.loginTime, timeStr);

    // Update TimeTracker with logout
    const updated = await TimeTracker.findOneAndUpdate(
      { employee: employeeId, date: today },
      { logoutTime: timeStr, totalHours, notes: "Office Exit", entryType: "office" },
      { new: true }
    );

    // Update Attendance checkOut
    await Attendance.findOneAndUpdate(
      { employee: employeeId, date: today },
      { checkOut: timeStr }
    );

    res.json({
      success: true,
      message: `Goodbye, ${employee.name}! Exited office at ${timeStr}. Total: ${totalHours}h`,
      data: { status: "exited", loginTime: tracker.loginTime, logoutTime: timeStr, totalHours, date: today },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Backend running on port ${PORT}`)
);
