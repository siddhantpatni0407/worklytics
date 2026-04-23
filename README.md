# Worklytics

> **Daily Work Status Tracker** — A cross-platform offline-first desktop application built with React, Rust, Tauri, and SQLite.

Track your daily work mode (WFO, WFH, WFC), manage holidays and leaves, auto-detect weekends, and visualise monthly/yearly analytics — all stored locally with zero cloud dependency.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema](#database-schema)
5. [Application Flow](#application-flow)
6. [Status Priority Rules](#status-priority-rules)
7. [Folder Structure](#folder-structure)
8. [Prerequisites & Installation (Step-by-Step)](#prerequisites--installation-step-by-step)
9. [Project Setup](#project-setup)
10. [Running in Development](#running-in-development)
11. [Building the Windows EXE](#building-the-windows-exe)
12. [UI Overview](#ui-overview)
13. [Tauri Commands Reference](#tauri-commands-reference)
14. [Export Feature](#export-feature)
15. [Contributing](#contributing)

---

## Features

| Feature | Description |
|---|---|
| 📅 **Calendar View** | Interactive monthly calendar with colour-coded work statuses |
| 🏢 **WFO / 🏠 WFH / 🏗️ WFC** | Mark each workday with your work location |
| 🎉 **Holiday Manager** | Add, edit, delete holidays; supports recurring yearly holidays |
| 🏖️ **Leave Manager** | Track leaves by type (Casual, Sick, Earned, etc.) and approval status |
| 📆 **Weekend Auto-detection** | Saturday & Sunday are automatically marked as Weekend |
| ⚖️ **Priority Rules** | Leave > Holiday > Work Mode > Weekend > Unset |
| 📊 **Analytics Dashboard** | Monthly/yearly charts — bar, area, and pie charts |
| 📤 **CSV Export** | Export monthly or yearly data to CSV |
| 💾 **Offline-First** | All data lives in a local SQLite database |
| 🪟 **Windows EXE** | Packages as a native Windows installer |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend UI | React 18 + TypeScript |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| State | Zustand |
| Routing | React Router v6 |
| Desktop Runtime | Tauri 2 |
| Backend Logic | Rust |
| Database | SQLite (bundled via `rusqlite`) |
| Date Utilities | date-fns |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Build | Vite 5 |

---

## Architecture Overview

```mermaid
graph TB
    subgraph "Desktop App (Tauri 2)"
        subgraph "Frontend – React + TypeScript"
            UI["React UI Components"]
            Router["React Router v6"]
            Store["Zustand Store"]
            Charts["Recharts Analytics"]
        end
        subgraph "Tauri Bridge"
            IPC["invoke() – IPC Layer"]
        end
        subgraph "Backend – Rust"
            Cmds["Tauri Commands"]
            BL["Business Logic\n(Priority Resolution)"]
            DB["rusqlite\nSQLite Driver"]
        end
        subgraph "Storage"
            SQLite["SQLite Database\n(worklytics.db)"]
        end
    end

    UI --> IPC
    IPC --> Cmds
    Cmds --> BL
    BL --> DB
    DB --> SQLite
    Cmds --> UI
```

---

## Database Schema

```mermaid
erDiagram
    WORK_ENTRIES {
        INTEGER id PK
        TEXT    date      "YYYY-MM-DD (UNIQUE)"
        TEXT    status    "WFO | WFH | WFC"
        TEXT    notes
        TEXT    created_at
        TEXT    updated_at
    }

    HOLIDAYS {
        INTEGER id PK
        TEXT    name
        TEXT    date      "YYYY-MM-DD (UNIQUE)"
        TEXT    description
        INTEGER is_recurring "0 = one-time, 1 = yearly"
        TEXT    created_at
        TEXT    updated_at
    }

    LEAVES {
        INTEGER id PK
        TEXT    start_date   "YYYY-MM-DD"
        TEXT    end_date     "YYYY-MM-DD"
        TEXT    leave_type   "CASUAL|SICK|EARNED|..."
        TEXT    reason
        TEXT    status       "PENDING|APPROVED|REJECTED"
        TEXT    created_at
        TEXT    updated_at
    }
```

---

## Application Flow

```mermaid
sequenceDiagram
    participant User
    participant ReactUI as React UI
    participant Tauri as Tauri Bridge
    participant Rust as Rust Backend
    participant SQLite

    User->>ReactUI: Open App
    ReactUI->>Tauri: invoke("cmd_get_month_statuses", {year, month})
    Tauri->>Rust: cmd_get_month_statuses()
    Rust->>SQLite: Query work_entries, holidays, leaves
    SQLite-->>Rust: Raw records
    Rust->>Rust: resolve_day_status() per day
    Rust-->>Tauri: Vec<DayStatus>
    Tauri-->>ReactUI: JSON array
    ReactUI->>User: Render colour-coded calendar

    User->>ReactUI: Click a day cell
    ReactUI->>User: Open WorkStatusModal
    User->>ReactUI: Select WFH, add notes, Save
    ReactUI->>Tauri: invoke("cmd_set_work_entry", {date, status, notes})
    Tauri->>Rust: cmd_set_work_entry()
    Rust->>SQLite: UPSERT work_entries
    Rust-->>ReactUI: Updated DayStatus
    ReactUI->>User: Refresh calendar cell
```

---

## Status Priority Rules

```mermaid
flowchart TD
    A["Given Date"] --> B{Approved Leave\ncovers this date?}
    B -- Yes --> LEAVE["✅ LEAVE"]
    B -- No  --> C{Holiday on\nthis date?}
    C -- Yes --> HOLIDAY["🎉 HOLIDAY"]
    C -- No  --> D{Manual work\nentry exists?}
    D -- Yes --> WORK["💼 WFO / WFH / WFC"]
    D -- No  --> E{Saturday or\nSunday?}
    E -- Yes --> WEEKEND["🌤️ WEEKEND"]
    E -- No  --> UNSET["⬜ UNSET"]
```

**Priority order:** `LEAVE` > `HOLIDAY` > `WFO/WFH/WFC` > `WEEKEND` > `UNSET`

---

## Folder Structure

```
worklytics/
├── src/                              # React frontend
│   ├── components/
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx      # Main calendar grid
│   │   │   ├── CalendarCell.tsx      # Individual day cell
│   │   │   └── WorkStatusModal.tsx   # Status picker modal
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx         # KPI summary card
│   │   │   ├── MonthlyChart.tsx      # Stacked bar chart
│   │   │   ├── YearlyTrendChart.tsx  # Area trend chart
│   │   │   └── StatusDistributionChart.tsx  # Pie chart
│   │   ├── holidays/
│   │   │   ├── HolidayManager.tsx    # List + CRUD controller
│   │   │   └── HolidayForm.tsx       # Add/Edit modal form
│   │   ├── leaves/
│   │   │   ├── LeaveManager.tsx      # List + CRUD controller
│   │   │   └── LeaveForm.tsx         # Add/Edit modal form
│   │   ├── layout/
│   │   │   ├── Layout.tsx            # App shell
│   │   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   │   └── Header.tsx            # Top header bar
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── StatusBadge.tsx
│   ├── pages/
│   │   ├── CalendarPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── HolidaysPage.tsx
│   │   ├── LeavesPage.tsx
│   │   └── SettingsPage.tsx
│   ├── store/
│   │   └── appStore.ts               # Zustand global state
│   ├── types/
│   │   └── index.ts                  # All TypeScript types
│   ├── utils/
│   │   ├── tauriCommands.ts          # invoke() wrappers
│   │   ├── dateUtils.ts              # Date helpers
│   │   └── cn.ts                     # Tailwind class merger
│   ├── styles/
│   │   └── globals.css               # Tailwind + global styles
│   ├── App.tsx                       # Router setup
│   └── main.tsx                      # React entry point
│
├── src-tauri/                        # Rust/Tauri backend
│   ├── src/
│   │   ├── main.rs                   # Entry point
│   │   ├── lib.rs                    # App setup & command registration
│   │   ├── error.rs                  # Custom error type
│   │   ├── database/
│   │   │   ├── mod.rs                # DB state & initialisation
│   │   │   └── migrations.rs         # Schema creation
│   │   ├── models/
│   │   │   ├── mod.rs
│   │   │   ├── holiday.rs
│   │   │   ├── leave.rs
│   │   │   └── work_entry.rs
│   │   └── commands/
│   │       ├── mod.rs
│   │       ├── holiday_commands.rs
│   │       ├── leave_commands.rs
│   │       ├── work_commands.rs      # Includes resolve_day_status()
│   │       ├── analytics_commands.rs
│   │       └── export_commands.rs
│   ├── capabilities/
│   │   └── default.json              # Tauri v2 permissions
│   ├── icons/                        # App icons (generated)
│   ├── Cargo.toml
│   ├── build.rs
│   └── tauri.conf.json
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
└── README.md
```

---

## Prerequisites & Installation (Step-by-Step)

Install the following tools **in the exact order listed below**. Each step must complete successfully before moving to the next.

---

### Step 1 — Node.js (v18 LTS or later)

**Why:** Runs the Vite dev server, npm scripts, and the Tauri CLI frontend build.

| | |
|---|---|
| **Download** | https://nodejs.org/en/download |
| **Recommended** | Node.js 20 LTS (Windows Installer `.msi`) |
| **Verify** | `node --version` → `v20.x.x` |
| **npm included** | `npm --version` → `10.x.x` |

**winget (alternative):**
```powershell
winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements
```

---

### Step 2 — Visual Studio Build Tools 2022 (C++ Desktop Workload)

**Why:** Rust compiles to native Windows code using the MSVC toolchain. The `link.exe` linker that ships with VS Build Tools is **mandatory** — VS Code alone is NOT sufficient.

| | |
|---|---|
| **Download** | https://visualstudio.microsoft.com/visual-cpp-build-tools/ |
| **Direct installer** | https://aka.ms/vs/17/release/vs_BuildTools.exe |
| **Verify after install** | Open **x64 Native Tools Command Prompt** and run `link` |

**During installation, select exactly this workload:**

```
☑  Desktop development with C++
      ☑  MSVC v143 – VS 2022 C++ x64/x86 build tools (Latest)
      ☑  Windows 11 SDK (10.0.22621.0) or Windows 10 SDK
      ☑  C++ CMake tools for Windows
```

**Silent install via winget (run as Administrator):**
```powershell
winget install --id Microsoft.VisualStudio.2022.BuildTools -e `
  --accept-source-agreements --accept-package-agreements `
  --override "--wait --quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

> ⚠️ **Reboot your machine after installing Build Tools** before continuing.

---

### Step 3 — Rust Toolchain (via rustup)

**Why:** The Tauri backend is written in Rust. `cargo` builds and bundles the application.

| | |
|---|---|
| **Download** | https://rustup.rs |
| **Windows installer** | https://win.rustup.rs/ (downloads `rustup-init.exe`) |
| **Minimum version** | Rust 1.77+ |

**Installation steps (Windows):**
```powershell
# 1. Download and run the installer
#    → Accept defaults (press Enter at each prompt)
#    → Installer selects "x86_64-pc-windows-msvc" automatically when VS Build Tools is present

# 2. After install, open a NEW PowerShell window, then verify:
rustup --version    # rustup 1.27.x
cargo --version     # cargo 1.77.x
rustc --version     # rustc 1.77.x
```

**If cargo is not found in PATH after install**, add it manually:
```powershell
# Add to current session
$env:PATH += ";$env:USERPROFILE\.cargo\bin"

# Make permanent (run once)
[System.Environment]::SetEnvironmentVariable(
  "PATH",
  [System.Environment]::GetEnvironmentVariable("PATH","User") + ";$env:USERPROFILE\.cargo\bin",
  "User"
)
```

**Verify the MSVC target is active:**
```powershell
rustup target list --installed
# Expected output: x86_64-pc-windows-msvc
```

**If the MSVC target is missing, add it:**
```powershell
rustup target add x86_64-pc-windows-msvc
rustup default stable-x86_64-pc-windows-msvc
```

---

### Step 4 — WebView2 Runtime

**Why:** Tauri uses Microsoft Edge WebView2 to render the React UI.

| | |
|---|---|
| **Windows 11** | Pre-installed — no action needed |
| **Windows 10** | Download from https://developer.microsoft.com/en-us/microsoft-edge/webview2/ |
| **Direct installer** | https://go.microsoft.com/fwlink/p/?LinkId=2124703 |
| **Verify** | Registry key `HKLM\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226...}` exists |

**winget:**
```powershell
winget install --id Microsoft.EdgeWebView2Runtime -e --accept-source-agreements
```

---

### Step 5 — Git (optional but recommended)

**Why:** To clone the repository.

| | |
|---|---|
| **Download** | https://git-scm.com/download/win |
| **winget** | `winget install --id Git.Git -e --accept-source-agreements` |
| **Verify** | `git --version` |

---

### Prerequisites Summary Table

| # | Tool | Min Version | Download Link | Verify Command |
|---|---|---|---|---|
| 1 | Node.js | 20 LTS | https://nodejs.org/en/download | `node --version` |
| 2 | npm | 10.x | bundled with Node.js | `npm --version` |
| 3 | VS Build Tools 2022 (C++ workload) | 17.x | https://aka.ms/vs/17/release/vs_BuildTools.exe | `link` in x64 cmd |
| 4 | Rust (rustup) | 1.77+ | https://win.rustup.rs/ | `cargo --version` |
| 5 | WebView2 Runtime | latest | https://go.microsoft.com/fwlink/p/?LinkId=2124703 | pre-installed on Win 11 |
| 6 | Git | 2.x | https://git-scm.com/download/win | `git --version` |

---

### Installation Order Diagram

```mermaid
flowchart LR
    A["1️⃣ Node.js\nnodejs.org"] --> B["2️⃣ VS Build Tools 2022\n+ C++ Workload\naka.ms/vs/17/release/vs_BuildTools.exe"]
    B --> C["🔁 Reboot"]
    C --> D["3️⃣ Rust via rustup\nwin.rustup.rs"]
    D --> E["4️⃣ WebView2 Runtime\nWin 11: pre-installed\nWin 10: download"]
    E --> F["5️⃣ Clone Repo\ngit clone ..."]
    F --> G["6️⃣ npm install"]
    G --> H["✅ npm run tauri dev"]
```

---

## Project Setup

### 1. Clone the repository

```bash
git clone https://github.com/siddhantpatni0407/worklytics.git
cd worklytics
```

### 2. Install Node.js dependencies

```bash
npm install
```

### 3. (Optional) Generate application icons

Place a 1024×1024 PNG icon at `app-icon.png` in the project root, then run:

```bash
npm run tauri icon app-icon.png
```

This generates all required icon sizes under `src-tauri/icons/`.

> **Note:** For quick testing you can skip this step — Tauri will use placeholder icons.

---

## Running in Development

```bash
# Start Tauri in development mode
# (Vite dev server + hot-reload + Tauri window)
npm run tauri dev
```

This will:
1. Start the Vite dev server on `http://localhost:1420`
2. Compile the Rust backend
3. Open the Worklytics desktop window with hot-reload

---

## Building the Windows EXE

### Full release build

```bash
# Build everything (React → dist/, then Rust → .exe)
npm run tauri build
```

The packaged installers will be at:

```
src-tauri/target/release/bundle/
├── msi/
│   └── Worklytics_1.0.0_x64_en-US.msi     ← MSI installer
├── nsis/
│   └── Worklytics_1.0.0_x64-setup.exe     ← NSIS installer
└── worklytics.exe                           ← Standalone executable
```

### Build for specific targets

```bash
# Windows x64 only
npm run tauri build -- --target x86_64-pc-windows-msvc

# Build without bundler (just the .exe)
npm run tauri build -- --bundles none
```

### CI/CD build commands sequence

```bash
npm ci                          # Clean install dependencies
npm run build                   # Build React frontend
cd src-tauri
cargo build --release           # Compile Rust backend
cd ..
npm run tauri build             # Package with Tauri
```

---

## UI Overview

### Calendar View (`/`)
- Monthly grid showing all 7 days per week
- **Colour coding:**
  - 🔵 Blue — Work From Office (WFO)
  - 🟢 Green — Work From Home (WFH)
  - 🟣 Violet — Work From Client (WFC)
  - 🟡 Amber — Leave
  - 🔴 Red — Holiday
  - ⬜ Grey — Weekend (auto)
  - ⬜ White — Unset weekday
- Click any editable weekday to open the **Work Status Modal**
- Today's date is highlighted with a brand colour circle

### Analytics Dashboard (`/dashboard`)
- **KPI Cards:** Total WFO, WFH, WFC, Leave, Holiday days
- **Progress Bar:** Days logged vs total working days
- **Stacked Bar Chart:** Monthly breakdown across all statuses
- **Area Chart:** Work mode trend over the year
- **Pie Chart:** Annual status distribution
- **Data Table:** Month-by-month summary

### Holiday Manager (`/holidays`)
- Full CRUD for holidays
- Toggle recurring (repeats same MM-DD every year)
- Sorted by date, scoped to selected year

### Leave Manager (`/leaves`)
- Full CRUD for leave records
- Leave types: Casual, Sick, Earned, Maternity, Paternity, Unpaid, Comp Off, Other
- Status: Approved, Pending, Rejected
- Summary cards showing totals

### Settings (`/settings`)
- App information
- Status priority explanation
- Technology stack

---

## Tauri Commands Reference

All commands are defined in `src-tauri/src/commands/` and wired via `lib.rs`.

### Holiday Commands

| Command | Parameters | Returns |
|---|---|---|
| `cmd_get_holidays` | — | `Holiday[]` |
| `cmd_get_holidays_by_year` | `year: i32` | `Holiday[]` |
| `cmd_add_holiday` | `holiday: CreateHoliday` | `Holiday` |
| `cmd_update_holiday` | `holiday: UpdateHoliday` | `Holiday` |
| `cmd_delete_holiday` | `id: i64` | `bool` |

### Leave Commands

| Command | Parameters | Returns |
|---|---|---|
| `cmd_get_leaves` | — | `Leave[]` |
| `cmd_get_leaves_by_year` | `year: i32` | `Leave[]` |
| `cmd_add_leave` | `leave: CreateLeave` | `Leave` |
| `cmd_update_leave` | `leave: UpdateLeave` | `Leave` |
| `cmd_delete_leave` | `id: i64` | `bool` |

### Work Entry Commands

| Command | Parameters | Returns |
|---|---|---|
| `cmd_get_work_entry` | `date: String` | `WorkEntry?` |
| `cmd_set_work_entry` | `entry: SetWorkEntry` | `DayStatus` |
| `cmd_delete_work_entry` | `date: String` | `DayStatus` |
| `cmd_get_effective_status` | `date: String` | `DayStatus` |
| `cmd_get_month_statuses` | `year: i32, month: u32` | `DayStatus[]` |

### Analytics Commands

| Command | Parameters | Returns |
|---|---|---|
| `cmd_get_monthly_analytics` | `year: i32, month: u32` | `MonthlyAnalytics` |
| `cmd_get_yearly_analytics` | `year: i32` | `YearlyAnalytics` |
| `cmd_get_summary_stats` | `year: i32` | `SummaryStats` |

### Export Commands

| Command | Parameters | Returns |
|---|---|---|
| `cmd_export_monthly_csv` | `year: i32, month: u32` | `String` (file path) |
| `cmd_export_yearly_csv` | `year: i32` | `String` (file path) |

---

## Export Feature

CSV files are exported to:

```
Documents/Worklytics/Exports/
├── worklytics_2025_01.csv           # Monthly
└── worklytics_2025_full_year.csv    # Yearly
```

CSV columns:

```
Date, Day, Effective Status, Work Notes, Is Leave, Leave Type, Is Holiday, Holiday Name
```

---

## Mermaid: Component Interaction

```mermaid
graph LR
    subgraph Pages
        CP[CalendarPage]
        DP[DashboardPage]
        HP[HolidaysPage]
        LP[LeavesPage]
        SP[SettingsPage]
    end

    subgraph Components
        CV[CalendarView]
        CC[CalendarCell]
        WSM[WorkStatusModal]
        AD[AnalyticsDashboard]
        SC[StatsCard]
        MC[MonthlyChart]
        YTC[YearlyTrendChart]
        SDC[StatusDistChart]
        HM[HolidayManager]
        HF[HolidayForm]
        LM[LeaveManager]
        LF[LeaveForm]
    end

    subgraph State
        AS[appStore\nZustand]
    end

    subgraph API
        TC[tauriCommands.ts\ninvoke wrappers]
    end

    CP --> CV
    CV --> CC
    CV --> WSM
    DP --> SC
    DP --> MC
    DP --> YTC
    DP --> SDC
    HP --> HM
    HM --> HF
    LP --> LM
    LM --> LF
    CV --> AS
    HM --> AS
    LM --> AS
    DP --> AS
    CV --> TC
    HM --> TC
    LM --> TC
    DP --> TC
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes following the existing code style
4. Run `npm run tauri dev` to verify everything works
5. Submit a pull request

---

## License

SP © Worklytics Contributors
