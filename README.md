# Worklytics

> **Daily Work Status & Productivity Tracker** — A cross-platform offline-first desktop application built with React, Rust, Tauri, and SQLite.

Track your daily work mode (WFO, WFH, WFC), manage holidays and leaves, log daily tasks, jot sticky notes, auto-detect weekends, and visualise monthly/yearly analytics — all stored locally with zero cloud dependency.

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

### Core Work Tracking

| Feature | Description |
|---|---|
| 📅 **Calendar View** | Interactive monthly calendar with colour-coded work statuses and task count indicators |
| 🏢 **WFO / 🏠 WFH / 🏗️ WFC** | Mark each workday with your work location |
| 🎉 **Holiday Manager** | Add, edit, delete holidays; supports recurring yearly holidays |
| 🏖️ **Leave Manager** | Track leaves by type (Casual, Sick, Earned, etc.) and approval status |
| 📆 **Weekend Auto-detection** | Saturday & Sunday are automatically marked as Weekend |
| ⚙️ **Weekend Work Override** | Optionally configure Saturday and/or Sunday as working days |
| ⚖️ **Priority Rules** | Leave > Holiday > Work Mode > Weekend > Unset |

### Productivity

| Feature | Description |
|---|---|
| ✅ **Daily Tasks** | Log daily task updates with title, details, notes, tags, status, and time spent |
| 🗒️ **Sticky Notes** | Coloured sticky notes (yellow, blue, green, pink, purple) with pin, search, and filter |
| 📊 **Analytics Dashboard** | Monthly/yearly charts — bar, area, and pie charts with configurable year range |
| 📤 **CSV Export** | Export monthly or yearly work-status data to CSV |
| 📊 **Excel Export** | Export work statuses and tasks to a formatted `.xlsx` workbook |

### Settings & Customisation

| Feature | Description |
|---|---|
| 🌙 **Dark / Light / System Theme** | Per-app theme toggle; system preference auto-detected |
| 🕐 **Real-time Clock** | Live clock with timezone abbreviation displayed in the header |
| 🌍 **Timezone Selector** | Choose display timezone for the header clock |
| 📅 **Configurable Year Range** | Set the calendar/analytics year range (e.g. 2020–2050) |
| 🗄️ **Custom DB Location** | Choose where the SQLite database is stored; one-click migration |
| 🗂️ **Collapsible Sidebar** | Sidebar collapses to icon-only mode to maximise screen space |
| 💾 **Offline-First** | All data lives in a local SQLite database — no internet required |
| 🪟 **Windows EXE** | Packages as a native Windows installer (NSIS + WiX MSI) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend UI | React 18 + TypeScript |
| Styling | Tailwind CSS v3 (dark mode via `class` strategy) |
| Charts | Recharts |
| State | Zustand v5 (with `persist` middleware) |
| Routing | React Router v6 |
| Desktop Runtime | Tauri 2 |
| Backend Logic | Rust |
| Database | SQLite (bundled via `rusqlite`) |
| Excel Export | SheetJS (`xlsx`) |
| Date Utilities | date-fns v3 |
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
            Store["Zustand Store\n(persisted to localStorage)"]
            Charts["Recharts Analytics"]
        end
        subgraph "Tauri Bridge"
            IPC["invoke() – IPC Layer"]
            Dialog["tauri-plugin-dialog\n(folder picker)"]
        end
        subgraph "Backend – Rust"
            Cmds["Tauri Commands\n(work, tasks, notes, settings,\nholidays, leaves, excel, db)"]
            BL["Business Logic\n(Priority Resolution)"]
            DB["rusqlite\nSQLite Driver"]
            DBC["db_config.rs\n(custom DB path)"]
        end
        subgraph "Storage"
            SQLite["SQLite Database\n(worklytics.db)"]
            Config["db_config.json\n(custom path config)"]
        end
    end

    UI --> IPC
    IPC --> Cmds
    Cmds --> BL
    BL --> DB
    DB --> SQLite
    Cmds --> DBC
    DBC --> Config
    Dialog --> IPC
    Cmds --> UI
```

---

## Database Schema

```mermaid
erDiagram
    WORK_ENTRIES {
        INTEGER id PK
        TEXT    date        "YYYY-MM-DD (UNIQUE)"
        TEXT    status      "WFO | WFH | WFC"
        TEXT    notes
        TEXT    created_at
        TEXT    updated_at
    }

    HOLIDAYS {
        INTEGER id PK
        TEXT    name
        TEXT    date        "YYYY-MM-DD (UNIQUE)"
        TEXT    description
        INTEGER is_recurring "0 = one-time, 1 = yearly"
        TEXT    created_at
        TEXT    updated_at
    }

    LEAVES {
        INTEGER id PK
        TEXT    start_date  "YYYY-MM-DD"
        TEXT    end_date    "YYYY-MM-DD"
        TEXT    leave_type  "CASUAL|SICK|EARNED|..."
        TEXT    reason
        TEXT    status      "PENDING|APPROVED|REJECTED"
        TEXT    created_at
        TEXT    updated_at
    }

    TASKS {
        INTEGER id PK
        TEXT    date        "YYYY-MM-DD"
        TEXT    title
        TEXT    details
        TEXT    notes
        TEXT    status      "IN_PROGRESS|COMPLETED|BLOCKED"
        TEXT    tags        "comma-separated"
        REAL    time_spent  "hours"
        TEXT    created_at
        TEXT    updated_at
    }

    STICKY_NOTES {
        INTEGER id PK
        TEXT    title
        TEXT    content
        TEXT    color       "yellow|blue|green|pink|purple"
        INTEGER pinned      "0 or 1"
        TEXT    created_at
        TEXT    updated_at
    }

    APP_SETTINGS {
        TEXT    key   PK
        TEXT    value
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
    Rust->>SQLite: Query work_entries, holidays, leaves, app_settings
    SQLite-->>Rust: Raw records
    Rust->>Rust: resolve_day_status() per day\n(respects work_saturday / work_sunday settings)
    Rust-->>Tauri: Vec<DayStatus>
    Tauri-->>ReactUI: JSON array
    ReactUI->>Tauri: invoke("cmd_get_task_counts_for_month", {year, month})
    Tauri-->>ReactUI: task count per date
    ReactUI->>User: Render calendar with status colours + task badges

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
    D -- No  --> E{Saturday or Sunday?\n(unless overridden\nin Settings)}
    E -- Yes --> WEEKEND["🌤️ WEEKEND"]
    E -- No  --> UNSET["⬜ UNSET"]
```

**Priority order:** `LEAVE` > `HOLIDAY` > `WFO/WFH/WFC` > `WEEKEND` > `UNSET`

> Weekend detection respects the **"Mark Saturdays/Sundays as working days"** toggles in Settings.

---

## Folder Structure

```
worklytics/
├── src/                                  # React frontend
│   ├── components/
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx          # Main calendar grid (month/year dropdowns, task counts)
│   │   │   ├── CalendarCell.tsx          # Individual day cell (status colour + task badge)
│   │   │   └── WorkStatusModal.tsx       # Status picker modal
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx             # KPI summary card
│   │   │   ├── MonthlyChart.tsx          # Stacked bar chart
│   │   │   ├── YearlyTrendChart.tsx      # Area trend chart
│   │   │   └── StatusDistributionChart.tsx
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx              # Expandable task card
│   │   │   ├── TaskForm.tsx              # Add/edit task modal
│   │   │   └── TaskFilters.tsx           # Search, status, tag, date-range filters
│   │   ├── notes/
│   │   │   ├── NoteCard.tsx              # Coloured sticky note card
│   │   │   └── NoteEditor.tsx            # Create/edit note modal
│   │   ├── holidays/
│   │   │   ├── HolidayManager.tsx
│   │   │   └── HolidayForm.tsx
│   │   ├── leaves/
│   │   │   ├── LeaveManager.tsx
│   │   │   └── LeaveForm.tsx
│   │   ├── layout/
│   │   │   ├── Layout.tsx                # App shell + dark-mode class injection
│   │   │   ├── Sidebar.tsx               # Collapsible grouped navigation
│   │   │   └── Header.tsx                # Real-time clock + theme toggle
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── StatusBadge.tsx
│   ├── pages/
│   │   ├── CalendarPage.tsx
│   │   ├── DashboardPage.tsx             # Includes Excel export
│   │   ├── HolidaysPage.tsx
│   │   ├── LeavesPage.tsx
│   │   ├── TasksPage.tsx                 # Daily task tracking
│   │   ├── NotesPage.tsx                 # Sticky notes
│   │   └── SettingsPage.tsx              # Theme, timezone, year range, weekend, DB path
│   ├── store/
│   │   └── appStore.ts                   # Zustand (persisted: year, month, settings, sidebar)
│   ├── types/
│   │   └── index.ts                      # All TypeScript types + DEFAULT_SETTINGS
│   ├── utils/
│   │   ├── tauriCommands.ts              # All invoke() wrappers
│   │   ├── dateUtils.ts                  # Date helpers + yearRangeFromBounds
│   │   ├── excelExport.ts                # XLSX workbook builder
│   │   └── cn.ts                         # Tailwind class merger
│   ├── styles/
│   │   └── globals.css                   # CSS custom properties (dark/light), component classes
│   ├── App.tsx                           # Router setup
│   └── main.tsx                          # React entry point
│
├── src-tauri/                            # Rust/Tauri backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs                        # App setup, plugin init, command registration
│   │   ├── error.rs                      # WorklyticsError enum
│   │   ├── db_config.rs                  # Custom DB path config (db_config.json)
│   │   ├── database/
│   │   │   ├── mod.rs                    # DbState + initialize_database()
│   │   │   └── migrations.rs             # All table creation (idempotent)
│   │   ├── models/
│   │   │   ├── mod.rs
│   │   │   ├── holiday.rs
│   │   │   ├── leave.rs
│   │   │   ├── task.rs                   # Task, CreateTask, UpdateTask
│   │   │   ├── note.rs                   # StickyNote, CreateNote, UpdateNote
│   │   │   └── work_entry.rs
│   │   └── commands/
│   │       ├── mod.rs
│   │       ├── holiday_commands.rs
│   │       ├── leave_commands.rs
│   │       ├── work_commands.rs          # resolve_day_status() + weekend settings
│   │       ├── analytics_commands.rs
│   │       ├── export_commands.rs        # CSV export
│   │       ├── excel_commands.rs         # Raw .xlsx bytes writer
│   │       ├── task_commands.rs          # CRUD + task counts for calendar
│   │       ├── note_commands.rs          # CRUD + pin + search for sticky notes
│   │       ├── settings_commands.rs      # app_settings key-value store
│   │       └── db_commands.rs            # DB path get/set/migrate/reset
│   ├── capabilities/
│   │   └── default.json                  # Tauri v2 permissions (dialog:allow-open/save)
│   ├── icons/
│   ├── Cargo.toml
│   ├── build.rs
│   └── tauri.conf.json
│
├── scripts/                              # Build utility scripts (optional)
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
# Download and run the installer
# → Accept defaults (press Enter at each prompt)
# → Installer selects "x86_64-pc-windows-msvc" automatically when VS Build Tools is present

# After install, open a NEW PowerShell window, then verify:
rustup --version    # rustup 1.27.x
cargo --version     # cargo 1.77.x
rustc --version     # rustc 1.77.x
```

**If cargo is not found in PATH after install**, add it manually:
```powershell
$env:PATH += ";$env:USERPROFILE\.cargo\bin"
```

**Verify the MSVC target is active:**
```powershell
rustup target list --installed
# Expected: x86_64-pc-windows-msvc
```

---

### Step 4 — WebView2 Runtime

**Why:** Tauri uses Microsoft Edge WebView2 to render the React UI.

| | |
|---|---|
| **Windows 11** | Pre-installed — no action needed |
| **Windows 10** | Download from https://developer.microsoft.com/en-us/microsoft-edge/webview2/ |

```powershell
winget install --id Microsoft.EdgeWebView2Runtime -e --accept-source-agreements
```

---

### Step 5 — Git (optional but recommended)

```powershell
winget install --id Git.Git -e --accept-source-agreements
```

---

### Prerequisites Summary Table

| # | Tool | Min Version | Download Link | Verify Command |
|---|---|---|---|---|
| 1 | Node.js | 20 LTS | https://nodejs.org/en/download | `node --version` |
| 2 | npm | 10.x | bundled with Node.js | `npm --version` |
| 3 | VS Build Tools 2022 (C++ workload) | 17.x | https://aka.ms/vs/17/release/vs_BuildTools.exe | `link` in x64 cmd |
| 4 | Rust (rustup) | 1.77+ | https://win.rustup.rs/ | `cargo --version` |
| 5 | WebView2 Runtime | latest | https://go.microsoft.com/fwlink/p/?LinkId=2124703 | pre-installed Win 11 |
| 6 | Git | 2.x | https://git-scm.com/download/win | `git --version` |

---

### Installation Order Diagram

```mermaid
flowchart LR
    A["1️⃣ Node.js\nnodejs.org"] --> B["2️⃣ VS Build Tools 2022\n+ C++ Workload"]
    B --> C["🔁 Reboot"]
    C --> D["3️⃣ Rust via rustup\nwin.rustup.rs"]
    D --> E["4️⃣ WebView2 Runtime\nWin 11: pre-installed"]
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

> For quick testing you can skip this — Tauri will use placeholder icons.

---

## Running in Development

```bash
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
npm run tauri build
```

The packaged installers will be at:

```
src-tauri/target/release/bundle/
├── nsis/
│   └── Worklytics_2.0.0_x64-setup.exe     ← NSIS installer
├── msi/
│   └── Worklytics_2.0.0_x64_en-US.msi     ← WiX MSI installer
└── worklytics.exe                           ← Standalone executable
```

### Build for specific targets

```bash
# Windows x64 only
npm run tauri build -- --target x86_64-pc-windows-msvc

# Build without bundler (just the .exe)
npm run tauri build -- --bundles none
```

---

## UI Overview

### Calendar View (`/`)
- Monthly grid with colour-coded day cells
- **Task count badge** on any day that has logged tasks
- Month and year **dropdown selectors** (range configurable in Settings)
- Click any editable weekday to open the **Work Status Modal**
- Today's date highlighted with a brand-colour ring
- **Colour coding:**
  - 🔵 Blue — Work From Office (WFO)
  - 🟢 Green — Work From Home (WFH)
  - 🟣 Violet — Work From Client (WFC)
  - 🟡 Amber — Leave
  - 🔴 Red — Holiday
  - ⬜ Slate — Weekend (auto-detected)
  - ⬜ White — Unset weekday

### Tasks (`/tasks`)
- Log daily work updates with title, details, notes, tags, and time spent (hours)
- Task statuses: **In Progress**, **Completed**, **Blocked**
- Filter by status, tag, date range, or free-text search
- Tasks grouped by date, newest first
- Stats cards: Total, Completed, In Progress, Total Hours

### Sticky Notes (`/notes`)
- Five colour themes: **Yellow**, **Blue**, **Green**, **Pink**, **Purple**
- Pin important notes to keep them at the top
- Inline expand/collapse for long content
- Search notes by title or content
- Filter by colour
- Sort newest/oldest
- Floating **+** button for quick creation

### Analytics Dashboard (`/dashboard`)
- **KPI Cards:** Total WFO, WFH, WFC, Leave, Holiday days
- **Progress Bar:** Days logged vs total working days
- **Stacked Bar Chart:** Monthly breakdown across all statuses
- **Area Chart:** Work mode trend over the year
- **Pie Chart:** Annual status distribution
- **Data Table:** Month-by-month summary
- **Export buttons:** CSV and Excel (`.xlsx`)

### Holiday Manager (`/holidays`)
- Full CRUD for holidays with recurring toggle

### Leave Manager (`/leaves`)
- Types: Casual, Sick, Earned, Maternity, Paternity, Unpaid, Comp Off, Other
- Status: Approved, Pending, Rejected

### Settings (`/settings`)
- **Appearance** — Light / Dark / System theme
- **Timezone & Clock** — Display timezone for the header clock
- **Calendar Year Range** — Configurable start/end year
- **Database Configuration** — View current DB path, browse to change it, migrate data, reset to default
- **Weekend Work** — Toggle Saturday and/or Sunday as working days
- **Status Priority Rules** — Visual explanation
- **About** — App and tech stack info

---

## Tauri Commands Reference

All commands are in `src-tauri/src/commands/` and registered in `lib.rs`.

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
| `cmd_write_excel_file` | `filename: String, bytes: Vec<u8>` | `String` (file path) |

### Task Commands

| Command | Parameters | Returns |
|---|---|---|
| `cmd_get_tasks_by_date` | `date: String` | `Task[]` |
| `cmd_get_tasks_by_range` | `from: String, to: String` | `Task[]` |
| `cmd_get_all_tasks` | — | `Task[]` |
| `cmd_add_task` | `task: CreateTask` | `Task` |
| `cmd_update_task` | `task: UpdateTask` | `Task` |
| `cmd_delete_task` | `id: i64` | `bool` |
| `cmd_get_task_counts_for_month` | `year: i32, month: u32` | `(String, i64)[]` |

### Sticky Note Commands

| Command | Parameters | Returns |
|---|---|---|
| `cmd_get_all_notes` | — | `StickyNote[]` |
| `cmd_search_notes` | `query: String` | `StickyNote[]` |
| `cmd_get_notes_by_color` | `color: String` | `StickyNote[]` |
| `cmd_add_note` | `note: CreateNote` | `StickyNote` |
| `cmd_update_note` | `note: UpdateNote` | `StickyNote` |
| `cmd_delete_note` | `id: i64` | `bool` |
| `cmd_pin_note` | `id: i64, pinned: bool` | `StickyNote` |

### Settings Commands

| Command | Parameters | Returns |
|---|---|---|
| `cmd_get_setting` | `key: String` | `String?` |
| `cmd_get_all_settings` | — | `(String, String)[]` |
| `cmd_set_setting` | `key: String, value: String` | `void` |
| `cmd_set_settings_batch` | `settings: (String, String)[]` | `void` |

### Database Configuration Commands

| Command | Parameters | Returns |
|---|---|---|
| `cmd_get_db_path` | — | `String` |
| `cmd_get_default_db_path` | — | `String` |
| `cmd_is_custom_db_path` | — | `bool` |
| `cmd_select_db_directory` | — | `String?` (folder picker) |
| `cmd_migrate_db` | `new_path: String` | `String` |
| `cmd_reset_db_path` | — | `String` |

---

## Export Feature

### CSV

Exported to:
```
Documents/Worklytics/Exports/
├── worklytics_2025_01.csv
└── worklytics_2025_full_year.csv
```

CSV columns:
```
Date, Day, Effective Status, Work Notes, Is Leave, Leave Type, Is Holiday, Holiday Name
```

### Excel (`.xlsx`)

Exported to `Documents/Worklytics/Exports/` with two sheets:

| Sheet | Contents |
|---|---|
| **Work Status** | Date, Day, Status, Notes, Leave Type, Holiday Name |
| **Tasks** | Date, Title, Status, Tags, Time Spent, Details |

Export is triggered from the **Analytics Dashboard** page.

---

## Component Interaction

```mermaid
graph LR
    subgraph Pages
        CP[CalendarPage]
        DP[DashboardPage]
        HP[HolidaysPage]
        LP[LeavesPage]
        TP[TasksPage]
        NP[NotesPage]
        SP[SettingsPage]
    end

    subgraph Components
        CV[CalendarView]
        CC[CalendarCell]
        WSM[WorkStatusModal]
        TCard[TaskCard]
        TForm[TaskForm]
        TFilters[TaskFilters]
        NCard[NoteCard]
        NEditor[NoteEditor]
        HM[HolidayManager]
        LM[LeaveManager]
        SB[Sidebar]
        HD[Header]
    end

    subgraph State
        AS[appStore – Zustand\n(persisted)]
    end

    subgraph API
        TC[tauriCommands.ts]
    end

    CP --> CV --> CC
    CV --> WSM
    DP --> TC
    TP --> TCard
    TP --> TForm
    TP --> TFilters
    NP --> NCard
    NP --> NEditor
    HP --> HM
    LP --> LM
    SB --> AS
    HD --> AS
    CV --> AS
    CV --> TC
    TP --> TC
    NP --> TC
    HM --> TC
    LM --> TC
    DP --> TC
    SP --> TC
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes following the existing code style
4. Run `npm run tauri dev` to verify everything works
5. Submit a pull request

---


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
