# B.Tech Student ERP Frontend

A responsive web dashboard built with **React**, **Vite**, and **Tailwind CSS** for the B.Tech Student ERP system.

## Features
- **Dashboard Overview**: Live stats for total students, B.Tech branches, attendance logs, and pending fees.
- **Student Services Section**:
  - Unified Tabular Profile (editable & submit)
  - ID Card Application with photo/signature uploads
  - Mess Off Application with Raise Request, Forward, and Reset actions
  - Student Well-Being counseling request portal
  - Convocation details & gown registration
  - Apply for Bonafide Certificate with printable certificate preview
- **Attendance Tracker**: Daily class attendance sheet strictly supporting **`Present`** and **`Absent`** with student percentage analytics.
- **Fee Management**: Invoicing, payment recording, and official receipt generation.
- **Examinations & Transcripts**: Marks entry with automatic letter grade assignment (`A+` to `F`) and student report card generator.
- **B.Tech Branch Catalog**: Directory of all 10 engineering programs.
- **Authentication**: JWT login supporting Admin (`admin` / `admin123`), Faculty, and Student roles.

## Running the Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173` and automatically proxies requests to your backend at `http://localhost:5000`.

