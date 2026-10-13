import os
import sys
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    HRFlowable, Image as RLImage, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Canvas that adds running header and footer with total page count."""
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, 580, "AegisDrive — Road Accident Analysis & Safety Platform | Complete Implementation Plan")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(36, 574, 756, 574)

        # Footer
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(756, 20, footer_text)
        self.drawString(36, 20, "Confidential & Proprietary — AegisDrive Project Documentation | Live: https://aegisdrive-app.vercel.app")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(36, 28, 756, 28)
        self.restoreState()

def build_pdf(output_pdf_path, image_path):
    # Landscape letter: 792 width, 612 height. Margins: 36 pt (0.5 inch)
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=landscape(letter),
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0b1120'),
        alignment=0,
        spaceAfter=4
    )

    tagline_style = ParagraphStyle(
        'CoverTagline',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0284c7'),
        spaceAfter=8
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#475569')
    )

    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=12,
        spaceAfter=8
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    story = []

    # ════════════════════════════════════════════════════════════════
    # PAGE 1: TITLE & HIGH-RESOLUTION WORKFLOW INFOGRAPHIC
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph("AegisDrive — Road Accident Analysis & Safety Platform", title_style))
    story.append(Paragraph("End-to-End Project Workflow & Architectural Implementation Blueprint | From Data to Safer Roads", tagline_style))
    
    meta_html = (
        "<b>Frontend (Live):</b> https://aegisdrive-app.vercel.app &nbsp;&nbsp;|&nbsp;&nbsp; "
        "<b>Backend API (Live):</b> https://aegisdrive-production.up.railway.app &nbsp;&nbsp;|&nbsp;&nbsp; "
        "<b>GitHub:</b> https://github.com/Samrudhi-J07/aegisdrive"
    )
    story.append(Paragraph(meta_html, meta_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=8, spaceBefore=4))

    # Embed User's Workflow Diagram Image
    # Printable landscape width: 792 - 72 = 720 pt. Max available height on page ~ 460 pt
    if os.path.exists(image_path):
        img_w = 720
        img_h = 445
        story.append(RLImage(image_path, width=img_w, height=img_h))
    else:
        story.append(Paragraph(f"[Image not found at {image_path}]", body_style))

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # PAGE 2: STEP-BY-STEP IMPLEMENTATION (PHASES 1 TO 11)
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph("1. Detailed Step-by-Step Implementation Workflow (Phases 1 — 11)", h1_style))
    story.append(Paragraph(
        "AegisDrive was developed and deployed following a rigorous 11-stage full-stack engineering lifecycle, "
        "spanning dataset engineering, distributed analytics, machine learning pipeline training, reactive frontend UI, "
        "and multi-cloud automated CI/CD deployment.",
        body_style
    ))
    story.append(Spacer(1, 8))

    phases_data = [
        [
            Paragraph("Phase & Scope", table_header),
            Paragraph("Core Objectives & Actions Taken", table_header),
            Paragraph("Tools & Technologies", table_header),
            Paragraph("Output / Artifacts", table_header)
        ],
        [
            Paragraph("<b>Phase 1: Environment Setup</b>", body_style),
            Paragraph("Configure local workstation, ensure Python 3.12, Node.js 18+, Git, and virtual environments.", body_style),
            Paragraph("VS Code, Windows PowerShell, Git 2.55", body_style),
            Paragraph("Clean isolated dev environment", body_style)
        ],
        [
            Paragraph("<b>Phase 2: Repository Architecture</b>", body_style),
            Paragraph("Initialize Git repo, configure root .gitignore (protecting models & secrets), create directory hierarchy.", body_style),
            Paragraph("Git, GitHub CLI, PowerShell", body_style),
            Paragraph("Monorepo structure (backend/ + frontend/)", body_style)
        ],
        [
            Paragraph("<b>Phase 3: Backend & API Core</b>", body_style),
            Paragraph("Develop FastAPI ASGI application, CORS middleware, REST routers for analytics, upload, and chat.", body_style),
            Paragraph("FastAPI, Uvicorn, Pydantic, Python 3.12", body_style),
            Paragraph("Interactive OpenAPI docs at /docs", body_style)
        ],
        [
            Paragraph("<b>Phase 4: Big Data & Parquet Cache</b>", body_style),
            Paragraph("Clean 20,000+ accident records, compute derived risk scores, convert CSV to columnar Parquet for sub-second queries.", body_style),
            Paragraph("Pandas, DuckDB, PyArrow, Parquet", body_style),
            Paragraph("Optimized processed_accidents.parquet", body_style)
        ],
        [
            Paragraph("<b>Phase 5: Machine Learning Suite</b>", body_style),
            Paragraph("Train XGBoost multi-class classifier (Severity: Minor, Major, Fatal) and Random Forest Risk Regressor (0.00-1.00).", body_style),
            Paragraph("XGBoost, Scikit-Learn, PyTorch, Joblib", body_style),
            Paragraph("severity_model.pkl, risk_model.pkl", body_style)
        ],
        [
            Paragraph("<b>Phase 6: Frontend Development</b>", body_style),
            Paragraph("Build single page application with Cyberpunk Midnight Blue theme, executive KPI cards, charts, and Leaflet map.", body_style),
            Paragraph("React 18, Vite 5, TailwindCSS, Framer Motion", body_style),
            Paragraph("Modular UI components with micro-interactions", body_style)
        ],
        [
            Paragraph("<b>Phase 7: Geospatial Hotspot Map</b>", body_style),
            Paragraph("Render 20,000+ coordinates across India with severity color codes (Red/Orange/Green) on CARTO dark tiles.", body_style),
            Paragraph("Leaflet, React-Leaflet, CARTO Basemaps API", body_style),
            Paragraph("High-contrast watermark-free spatial map", body_style)
        ],
        [
            Paragraph("<b>Phase 8: What-If & Dataset Uploader</b>", body_style),
            Paragraph("Develop interactive safety simulator with speed/weather sliders and universal CSV/Excel/PDF upload auto-EDA.", body_style),
            Paragraph("ReportLab, OpenPyXL, FormData", body_style),
            Paragraph("Dynamic policy advice & instant PDF exports", body_style)
        ],
        [
            Paragraph("<b>Phase 9: Offline AI & Security</b>", body_style),
            Paragraph("Build Aegis AI assistant with 10 NLP intent categories and JWT authentication with PBKDF2 password hashing.", body_style),
            Paragraph("Regex NLP, SQLite, HMAC SHA-256", body_style),
            Paragraph("Floating conversational widget & User Auth", body_style)
        ],
        [
            Paragraph("<b>Phase 10: Backend Cloud Deploy</b>", body_style),
            Paragraph("Containerize backend with Python 3.12-slim Dockerfile, deploy to Railway, expose public port 8080.", body_style),
            Paragraph("Docker, Railway, Uvicorn", body_style),
            Paragraph("Live API: aegisdrive-production.up.railway.app", body_style)
        ],
        [
            Paragraph("<b>Phase 11: Frontend Cloud Deploy</b>", body_style),
            Paragraph("Deploy Vite SPA to Vercel Edge network, link VITE_API_BASE_URL and CARTO credentials, test live integration.", body_style),
            Paragraph("Vercel Edge CDN, Git Push CI/CD", body_style),
            Paragraph("Live Web App: aegisdrive-app.vercel.app", body_style)
        ]
    ]

    t_phases = Table(phases_data, colWidths=[130, 290, 160, 140])
    t_phases.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8fafc'), colors.white]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5)
    ]))
    story.append(t_phases)

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # PAGE 3: TECHNOLOGY STACK & SYSTEM ARCHITECTURE
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph("2. Technology Stack & Architectural Specifications", h1_style))
    story.append(Spacer(1, 4))

    # Two column layout for Tech Stack and System Architecture
    tech_data = [
        [Paragraph("Category", table_header), Paragraph("Technology / Tool", table_header), Paragraph("Version", table_header), Paragraph("Role & Capabilities", table_header)],
        [Paragraph("<b>Frontend Framework</b>", body_style), Paragraph("React + Vite", body_style), Paragraph("18.3 / 5.4", body_style), Paragraph("Single Page Application core, ultra-fast HMR and bundling", body_style)],
        [Paragraph("<b>Styling & UX</b>", body_style), Paragraph("TailwindCSS + Framer Motion", body_style), Paragraph("3.4 / 11.0", body_style), Paragraph("Midnight Blue glassmorphic theme, fluid spring animations", body_style)],
        [Paragraph("<b>Data Visualization</b>", body_style), Paragraph("Recharts + Leaflet", body_style), Paragraph("2.12 / 1.9", body_style), Paragraph("Declarative SVG charts (Area, Bar, Pie) and spatial heatmaps", body_style)],
        [Paragraph("<b>Backend API</b>", body_style), Paragraph("FastAPI + Uvicorn", body_style), Paragraph("0.110 / 0.30", body_style), Paragraph("Asynchronous REST gateway, OpenAPI schemas, high concurrency", body_style)],
        [Paragraph("<b>Machine Learning</b>", body_style), Paragraph("XGBoost + Scikit-Learn", body_style), Paragraph("2.0 / 1.4", body_style), Paragraph("Severity multi-class classification and continuous hazard scoring", body_style)],
        [Paragraph("<b>Big Data Engine</b>", body_style), Paragraph("Apache PySpark + DuckDB", body_style), Paragraph("3.5 / 0.10", body_style), Paragraph("Distributed ETL, windowed analytics, sub-second aggregation", body_style)],
        [Paragraph("<b>Authentication</b>", body_style), Paragraph("PBKDF2 SHA-256 + JWT", body_style), Paragraph("StdLib", body_style), Paragraph("Zero-dependency secure authentication & role management", body_style)],
        [Paragraph("<b>Report Generators</b>", body_style), Paragraph("ReportLab + OpenPyXL", body_style), Paragraph("4.1 / 3.1", body_style), Paragraph("Automated multi-page PDF export and Excel workbook generation", body_style)],
        [Paragraph("<b>Cloud & Hosting</b>", body_style), Paragraph("Vercel + Railway + Docker", body_style), Paragraph("Latest", body_style), Paragraph("Global Edge CDN frontend and containerized Python backend", body_style)]
    ]
    t_tech = Table(tech_data, colWidths=[120, 160, 80, 360])
    t_tech.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0369a1')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f0f9ff'), colors.white]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#bae6fd')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5)
    ]))
    story.append(t_tech)
    story.append(Spacer(1, 10))

    story.append(Paragraph("3. Core Modules & Production Capabilities", h2_style))
    
    modules_data = [
        [
            Paragraph("<b>Module</b>", table_header),
            Paragraph("<b>Key Features & Capabilities</b>", table_header),
            Paragraph("<b>API Endpoint / Data Flow</b>", table_header)
        ],
        [
            Paragraph("<b>Executive Dashboard</b>", body_style),
            Paragraph("Macro accident KPIs (20,000+ crashes, 34,529 casualties), hourly frequency curves, dynamic filter toolbar (Search, State, Severity, Weather), one-click PDF & Excel exports.", body_style),
            Paragraph("<code>GET /api/analytics/summary</code><br/><code>GET /api/analytics/charts</code><br/><code>GET /api/analytics/export-pdf</code>", body_style)
        ],
        [
            Paragraph("<b>Geospatial Hotspot Map</b>", body_style),
            Paragraph("Visualizes 1,200+ coordinate clusters with severity color tags (Fatal=Red, Major=Orange, Minor=Green), accident causality popups, state filters, and CARTO dark raster basemaps.", body_style),
            Paragraph("<code>GET /api/analytics/map</code><br/>CARTO Basemaps API integration", body_style)
        ],
        [
            Paragraph("<b>Predictive Studio</b>", body_style),
            Paragraph("Real-time inference calculating multi-class severity probabilities and risk indices from environmental features (visibility, lanes, rush hour, weather, crash cause).", body_style),
            Paragraph("<code>POST /api/predict/severity</code><br/>XGBoost & Random Forest pipeline", body_style)
        ],
        [
            Paragraph("<b>What-If Simulator</b>", body_style),
            Paragraph("Scenario playground with dynamic sliders for traffic speed multipliers, adverse weather, and peak hours. Generates actionable road safety policies automatically.", body_style),
            Paragraph("<code>POST /api/simulation/what-if</code><br/>Dynamic multiplier calculation", body_style)
        ],
        [
            Paragraph("<b>Upload & Analyze</b>", body_style),
            Paragraph("Universal data ingestion (.csv, .xlsx, .json, .pdf) with automated data health score (0-100), missing value analysis, 10+ generated charts, preview table, and PDF download.", body_style),
            Paragraph("<code>POST /api/upload/analyze</code><br/><code>POST /api/upload/export-pdf</code>", body_style)
        ],
        [
            Paragraph("<b>Aegis AI Chatbot</b>", body_style),
            Paragraph("100% offline conversational assistant with 10 NLP intent categories (STATS, TOP_N, TIME, CAUSE, PREDICTION, etc.), in-chat progress bars, and deep-link navigation buttons.", body_style),
            Paragraph("<code>POST /api/chat/message</code><br/>In-memory vectorized aggregation", body_style)
        ],
        [
            Paragraph("<b>User Authentication</b>", body_style),
            Paragraph("Secure user accounts with PBKDF2 password hashing, JWT token authorization, SQLite persistence, role profiles (Analyst, Engineer, Admin), and persistent sessions.", body_style),
            Paragraph("<code>POST /api/auth/signup</code><br/><code>POST /api/auth/login</code>", body_style)
        ]
    ]

    t_modules = Table(modules_data, colWidths=[120, 390, 210])
    t_modules.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5)
    ]))
    story.append(t_modules)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated: {output_pdf_path}")

if __name__ == "__main__":
    img = r"C:\Users\user\.gemini\antigravity\scratch\road_accident_analysis\workflow_diagram.jpg"
    out1 = r"C:\Users\user\.gemini\antigravity\scratch\road_accident_analysis\AegisDrive_Project_Workflow_and_Implementation_Plan.pdf"
    out2 = r"C:\Users\user\.gemini\antigravity\brain\d53968c5-5eba-42be-ac4a-952a9bdc5088\AegisDrive_Project_Workflow_and_Implementation_Plan.pdf"
    
    build_pdf(out1, img)
    build_pdf(out2, img)
