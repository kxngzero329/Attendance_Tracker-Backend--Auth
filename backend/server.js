import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminNotificationRoutes from "./routes/adminNotificationRoutes.js";

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json());

// ======================== ROUTES ========================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminNotificationRoutes);

// ======================== HOME PAGE ========================
app.get("/", (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ClockIt Attendance Tracker API</title>
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: 'Poppins', sans-serif;
      }

      body {
        background-color: #FAFAF0;
        color: #222;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 40px 20px;
      }

      h1 {
        font-size: 2.5rem;
        margin-bottom: 10px;
        text-align: center;
        color: #06C3A7;
      }

      p {
        font-size: 1rem;
        opacity: 0.9;
        margin-bottom: 30px;
        text-align: center;
      }

      .card {
        background: #fff;
        border: 1px solid rgba(0,0,0,0.08);
        border-radius: 16px;
        padding: 24px;
        max-width: 900px;
        width: 100%;
        box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }

      th, td {
        text-align: left;
        padding: 12px 8px;
      }

      th {
        color: #06C3A7;
        font-size: 1rem;
        border-bottom: 1px solid rgba(0,0,0,0.1);
      }

      tr:hover {
        background-color: rgba(6,195,167,0.08);
        transition: 0.3s;
      }

      td {
        font-size: 0.95rem;
      }

      footer {
        margin-top: 40px;
        font-size: 0.8rem;
        opacity: 0.7;
        text-align: center;
      }

      .endpoint {
        color: #06C3A7;
        font-weight: 600;
        font-family: monospace;
      }

      .method {
        font-weight: 600;
        text-transform: uppercase;
      }

      .get { color: #06C3A7; }
      .post { color: #0EA5E9; }
      .put { color: #F59E0B; }
      .delete { color: #DC2626; }

      .accordion {
        background: #ffffff;
        margin-top: 40px;
        padding: 24px;
        border-radius: 16px;
        border: 1px solid rgba(0,0,0,0.08);
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      }

      .accordion-item {
        margin-bottom: 10px;
        border: 1px solid rgba(0,0,0,0.08);
        border-radius: 10px;
        overflow: hidden;
      }

      .accordion-header {
        background-color: #06C3A7;
        color: #fff;
        padding: 12px 16px;
        cursor: pointer;
        font-weight: 600;
        transition: 0.3s;
      }

      .accordion-header:hover {
        background-color: #0EA5E9;
      }

      .accordion-content {
        display: none;
        background: #fff;
        padding: 16px;
        border-top: 1px solid rgba(0,0,0,0.08);
      }

      .accordion-content pre {
        background: rgba(6,195,167,0.08);
        padding: 10px;
        border-radius: 6px;
        overflow-x: auto;
      }

      code {
        background: rgba(6,195,167,0.08);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body>
    <h1>ClockIt Attendance Tracker API</h1>
    <p>⚡ Backend Connected | Node.js + Express + MySQL</p>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="method post">POST</td><td class="endpoint">/api/auth/signup</td><td>Register new user</td></tr>
          <tr><td class="method post">POST</td><td class="endpoint">/api/auth/login</td><td>Login (JWT + lockout + reset)</td></tr>
          <tr><td class="method post">POST</td><td class="endpoint">/api/auth/forgot-password</td><td>Request password reset email</td></tr>
          <tr><td class="method post">POST</td><td class="endpoint">/api/auth/reset-password</td><td>Reset password via link</td></tr>
          <tr><td class="method post">POST</td><td class="endpoint">/api/auth/unlock-account</td><td>Manually unlock locked account</td></tr>
          <tr><td class="method get">GET</td><td class="endpoint">/api/users/profile</td><td>Fetch logged-in user's profile</td></tr>
          <tr><td class="method get">GET</td><td class="endpoint">/api/notifications</td><td>Fetch user's personal notifications</td></tr>
          <tr><td class="method post">POST</td><td class="endpoint">/api/admin/notify/all</td><td>Send broadcast message (Admin only)</td></tr>
          <tr><td class="method post">POST</td><td class="endpoint">/api/admin/notify/user</td><td>Send message to specific staff (Admin only)</td></tr>
        </tbody>
      </table>
    </div>

    <div class="accordion">
      <h2 style="color:#06C3A7;margin-bottom:10px;">API Testing Guide (Thunder Client)</h2>

      <div class="accordion-item">
        <div class="accordion-header">1️⃣ Register a User</div>
        <div class="accordion-content">
          <p><code>POST /api/auth/signup</code></p>
          <pre>{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "phone": "+27710001111"
}</pre>
        </div>
      </div>

      <div class="accordion-item">
        <div class="accordion-header">2️⃣ Login and Copy Token</div>
        <div class="accordion-content">
          <p><code>POST /api/auth/login</code></p>
          <p>Response will include a <code>token</code>. Copy it to test protected routes.</p>
        </div>
      </div>

      <div class="accordion-item">
        <div class="accordion-header">3️⃣ View Profile (Protected)</div>
        <div class="accordion-content">
          <p><code>GET /api/users/profile</code></p>
          <p>Add header: <code>Authorization: Bearer &lt;your_token&gt;</code></p>
        </div>
      </div>

      <div class="accordion-item">
        <div class="accordion-header">4️⃣ Forgot Password</div>
        <div class="accordion-content">
          <p><code>POST /api/auth/forgot-password</code></p>
          <pre>{
  "email": "john@example.com"
}</pre>
        </div>
      </div>
      <div class="accordion-item">
        <div class="accordion-header">5️⃣ Reset Password</div>
        <div class="accordion-content">
          <p><code>POST /api/auth/reset-password</code></p>
          <pre>{
  "email": "email@gmail.com",
  "token": "token from reset link goes here",
  "newPassword": "NewPassword321!"
}
</pre>
        </div>
      </div>

      <div class="accordion-item">
        <div class="accordion-header">6️⃣ Admin Broadcast Message</div>
        <div class="accordion-content">
          <p><code>POST /api/admin/notify/all</code></p>
          <pre>{
  "title": "System Update",
  "message": "Server maintenance at 8PM tonight"
}</pre>
        </div>
      </div>

      <div class="accordion-item">
        <div class="accordion-header">7️⃣ Admin Personal Message</div>
        <div class="accordion-content">
          <p><code>POST /api/admin/notify/user</code></p>
          <pre>{
  "userId": 3,
  "title": "Reminder",
  "message": "Please submit your report today."
}</pre>
        </div>
      </div>

      <div class="accordion-item">
        <div class="accordion-header">8️⃣ Staff Notifications</div>
        <div class="accordion-content">
          <p><code>GET /api/notifications</code> — Requires staff JWT token</p>
          <p>Shows any personal or broadcast messages sent by the admin.</p>
        </div>
      </div>
    </div>

    <footer>© ${new Date().getFullYear()} ClockIt Attendance Tracker | Backend running on port ${process.env.PORT || 4000
    }</footer>

    <script>
      document.querySelectorAll(".accordion-header").forEach(header => {
        header.addEventListener("click", () => {
          const content = header.nextElementSibling;
          const open = content.style.display === "block";
          document.querySelectorAll(".accordion-content").forEach(c => c.style.display = "none");
          content.style.display = open ? "none" : "block";
        });
      });
    </script>
  </body>
  </html>`;
  res.status(200).send(html);
});

// ======================== ERROR HANDLER ========================
app.use(errorHandler);

// ======================== SERVER START ========================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Backend Connected!! Server is running on http://localhost:${PORT}`)
);
