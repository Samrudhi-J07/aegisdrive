import io
import re
import json
import pandas as pd
import numpy as np
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def parse_uploaded_file(file_bytes: bytes, filename: str) -> pd.DataFrame:
    """Parses uploaded file bytes into a Pandas DataFrame based on file extension."""
    ext = filename.lower().split('.')[-1]
    
    if ext == 'csv':
        try:
            return pd.read_csv(io.BytesIO(file_bytes))
        except Exception:
            return pd.read_csv(io.BytesIO(file_bytes), encoding='latin-1')
            
    elif ext in ['xlsx', 'xls']:
        return pd.read_excel(io.BytesIO(file_bytes))
        
    elif ext == 'json':
        try:
            return pd.read_json(io.BytesIO(file_bytes))
        except Exception:
            data = json.loads(file_bytes.decode('utf-8'))
            if isinstance(data, list):
                return pd.DataFrame(data)
            elif isinstance(data, dict):
                return pd.DataFrame([data])
            else:
                raise ValueError("Unsupported JSON format")
                
    elif ext == 'pdf':
        return parse_pdf_file(file_bytes)
        
    else:
        raise ValueError(f"Unsupported file extension: .{ext}")

def parse_pdf_file(file_bytes: bytes) -> pd.DataFrame:
    """Extracts tables or text structured data from PDF files using pypdf / fitz."""
    extracted_rows = []
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            tables = page.find_tables()
            if tables and len(tables.tables) > 0:
                for tab in tables:
                    df_tab = tab.to_pandas()
                    if not df_tab.empty:
                        return df_tab
            # Fallback text lines extraction
            text = page.get_text("text")
            lines = [line.strip() for line in text.split('\n') if line.strip()]
            for line in lines:
                parts = re.split(r'[,\t|;]', line)
                if len(parts) > 1:
                    extracted_rows.append(parts)
    except Exception as e:
        print(f"PyMuPDF fallback to pypdf: {e}")
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        for page in reader.pages:
            text = page.extract_text()
            if text:
                lines = [l.strip() for l in text.split('\n') if l.strip()]
                for line in lines:
                    parts = re.split(r'[,\t|;]', line)
                    if len(parts) > 1:
                        extracted_rows.append(parts)

    if extracted_rows:
        header = [f"Col_{i+1}" for i in range(len(extracted_rows[0]))]
        df = pd.DataFrame(extracted_rows[1:], columns=header[:len(extracted_rows[0])])
        return df
        
    # Return dummy dataframe if no tabular data detected in PDF
    return pd.DataFrame({"Extracted_Content": ["PDF Text content could not be parsed into a table automatically."]})

def analyze_dataframe(df: pd.DataFrame) -> dict:
    """Performs comprehensive automated EDA & chart specification generation."""
    df = df.copy()
    total_rows, total_cols = df.shape
    
    # Clean column names
    df.columns = [str(c).strip() for c in df.columns]
    
    # Missing value analytics
    null_counts = df.isnull().sum()
    total_nulls = int(null_counts.sum())
    null_pct_by_col = (null_counts / max(total_rows, 1) * 100).round(2).to_dict()
    
    # Data Quality Health Score (0 to 100)
    missing_ratio = total_nulls / max(total_rows * total_cols, 1)
    health_score = int(max(10, min(100, round((1.0 - missing_ratio * 2.5) * 100))))
    
    # Column details
    col_details = []
    num_cols = []
    cat_cols = []
    date_cols = []
    
    for col in df.columns:
        dtype_str = str(df[col].dtype)
        null_c = int(null_counts[col])
        unique_c = int(df[col].nunique())
        
        # Check if date
        is_date = False
        if 'date' in col.lower() or 'time' in col.lower():
            try:
                pd.to_datetime(df[col], errors='raise')
                is_date = True
                date_cols.append(col)
            except Exception:
                pass
                
        if np.issubdtype(df[col].dtype, np.number) and not is_date:
            num_cols.append(col)
        elif not is_date:
            cat_cols.append(col)
            
        col_details.append({
            "name": col,
            "dtype": dtype_str,
            "null_count": null_c,
            "null_pct": null_pct_by_col[col],
            "unique_values": unique_c,
            "sample_value": str(df[col].dropna().iloc[0]) if not df[col].dropna().empty else "N/A"
        })
        
    # Summary Statistics for Numeric Columns
    numeric_stats = {}
    if num_cols:
        desc = df[num_cols].describe().round(3).to_dict()
        numeric_stats = desc
        
    # Categorical Top Distributions
    cat_distributions = {}
    for col in cat_cols[:6]:
        top_vals = df[col].astype(str).value_counts().head(8).to_dict()
        cat_distributions[col] = [{"name": k, "count": int(v)} for k, v in top_vals.items()]
        
    # AUTO-GENERATE 10+ CHARTS SPECIFICATIONS FOR FRONTEND
    charts_spec = []
    
    # Chart 1: Missing Data Distribution Bar Chart
    missing_chart_data = [{"column": col, "missing": int(null_counts[col]), "valid": total_rows - int(null_counts[col])} for col in df.columns[:12]]
    charts_spec.append({
        "id": "missing_data",
        "title": "Missing vs Valid Cell Distribution",
        "type": "bar_stacked",
        "data": missing_chart_data,
        "xKey": "column",
        "keys": ["valid", "missing"]
    })
    
    # Chart 2 to 5: Numerical Distribution Histograms (Up to 4 numeric cols)
    for col in num_cols[:4]:
        series = df[col].dropna()
        if not series.empty:
            counts, bin_edges = np.histogram(series, bins=8)
            hist_data = [{"bin": f"{round(bin_edges[i], 1)}-{round(bin_edges[i+1], 1)}", "count": int(counts[i])} for i in range(len(counts))]
            charts_spec.append({
                "id": f"hist_{col}",
                "title": f"Frequency Distribution: {col}",
                "type": "area",
                "data": hist_data,
                "xKey": "bin",
                "yKey": "count"
            })
            
    # Chart 6 to 9: Categorical Value Count Bar Charts (Up to 4 cat cols)
    for col in cat_cols[:4]:
        charts_spec.append({
            "id": f"cat_{col}",
            "title": f"Top Frequency Breakdown: {col}",
            "type": "bar",
            "data": cat_distributions.get(col, []),
            "xKey": "name",
            "yKey": "count"
        })
        
    # Chart 10: Numerical Correlation Heatmap Data
    if len(num_cols) >= 2:
        corr_matrix = df[num_cols[:6]].corr().round(2).fillna(0).to_dict()
        corr_data = []
        for c1 in corr_matrix:
            for c2 in corr_matrix[c1]:
                corr_data.append({"feature1": c1, "feature2": c2, "correlation": corr_matrix[c1][c2]})
        charts_spec.append({
            "id": "correlation_matrix",
            "title": "Feature Correlation Strength Data",
            "type": "correlation",
            "data": corr_data
        })

    # First 100 rows for preview table
    preview_rows = df.head(100).fillna("").to_dict(orient="records")
    
    return {
        "status": "success",
        "filename_analyzed": "",
        "total_rows": total_rows,
        "total_cols": total_cols,
        "total_nulls": total_nulls,
        "data_health_score": health_score,
        "columns": col_details,
        "numeric_stats": numeric_stats,
        "categorical_distributions": cat_distributions,
        "charts": charts_spec,
        "preview_rows": preview_rows
    }

def generate_pdf_report(analysis: dict, filename: str = "Uploaded_Dataset") -> bytes:
    """Generates a professional multi-page PDF analysis report using ReportLab."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle', parent=styles['Title'],
        fontName='Helvetica-Bold', fontSize=22, textColor=colors.HexColor('#0f172a'), alignment=0, spaceAfter=8
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle', parent=styles['Normal'],
        fontName='Helvetica', fontSize=10, textColor=colors.HexColor('#64748b'), spaceAfter=15
    )
    heading_style = ParagraphStyle(
        'Heading2', parent=styles['Heading2'],
        fontName='Helvetica-Bold', fontSize=14, textColor=colors.HexColor('#1e293b'), spaceBefore=15, spaceAfter=8
    )

    # Title & Metadata
    story.append(Paragraph(f"AegisDrive AI — Executive Dataset Analysis Report", title_style))
    story.append(Paragraph(f"Source File: <b>{filename}</b> | Health Score: <b>{analysis.get('data_health_score', 90)}/100</b>", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#06b6d4'), spaceAfter=15))

    # Executive Overview KPI Table
    kpi_data = [
        ["Total Rows Processed", "Total Columns", "Total Missing Cells", "Data Quality Score"],
        [str(analysis.get('total_rows', 0)), str(analysis.get('total_cols', 0)), str(analysis.get('total_nulls', 0)), f"{analysis.get('data_health_score', 90)} / 100"]
    ]
    t_kpi = Table(kpi_data, colWidths=[130, 130, 130, 130])
    t_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#f1f5f9')),
        ('TEXTCOLOR', (0,1), (-1,1), colors.HexColor('#0f172a')),
        ('FONTNAME', (0,1), (-1,1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,1), (-1,1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1'))
    ]))
    story.append(t_kpi)
    story.append(Spacer(1, 15))

    # Column Schema Breakdown Table
    story.append(Paragraph("Column Schema & Data Quality Audit", heading_style))
    col_rows = [["Column Name", "Data Type", "Null Count", "Null %", "Unique Values"]]
    for col in analysis.get('columns', [])[:20]:
        col_rows.append([
            str(col['name'])[:20],
            str(col['dtype']),
            str(col['null_count']),
            f"{col['null_pct']}%",
            str(col['unique_values'])
        ])

    t_cols = Table(col_rows, colWidths=[150, 90, 80, 80, 120])
    t_cols.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_cols)
    story.append(Spacer(1, 15))

    # Safety & Data Quality Recommendations
    story.append(Paragraph("AI Recommendations & Safety Action Items", heading_style))
    recs = [
        "1. Complete missing values using KNN or median imputation prior to machine learning modeling.",
        "2. Standardize categorical text casing to eliminate duplicate categorical buckets.",
        "3. High risk hotspots should be cross-indexed with geographic GIS coordinates for spatial enforcement.",
        "4. Conduct automated outlier filtering on extreme numerical values before production deployment."
    ]
    for r in recs:
        story.append(Paragraph(r, styles['Normal']))
        story.append(Spacer(1, 4))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
