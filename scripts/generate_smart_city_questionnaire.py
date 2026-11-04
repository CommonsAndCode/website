#!/usr/bin/env python3
"""
generate_smart_city_questionnaire.py

Liest die Excel-Datei 'Smart City Fragebogen.xlsx' ein (mittels Python-Standardbibliothek,
ohne externe Abhängigkeiten) und erzeugt:
1. website/data/smart_city_fragebogen.json (Strukturierte Daten für Hugo & den Shortcode)
2. website/static/downloads/smart-city-fragebogen.xlsx (Rohdaten-Download)

Verwendung:
    python3 scripts/generate_smart_city_questionnaire.py [Pfad/zur/Datei.xlsx]
"""

import json
import os
import re
import shutil
import sys
import xml.etree.ElementTree as ET
import zipfile


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = text.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text.strip("-")


def parse_xlsx(file_path: str):
    with zipfile.ZipFile(file_path, "r") as z:
        shared_strings = []
        if "xl/sharedStrings.xml" in z.namelist():
            tree = ET.fromstring(z.read("xl/sharedStrings.xml"))
            ns = {"ns": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
            for si in tree.findall("ns:si", ns):
                t_elems = si.findall(".//ns:t", ns)
                text = "".join([t.text or "" for t in t_elems])
                shared_strings.append(text)

        if "xl/worksheets/sheet1.xml" not in z.namelist():
            raise FileNotFoundError("xl/worksheets/sheet1.xml nicht in XLSX gefunden.")

        tree = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
        ns = {"ns": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
        rows = tree.findall(".//ns:row", ns)

        raw_rows = []
        for row in rows:
            r_idx = int(row.get("r", 0))
            cells = {}
            for c in row.findall("ns:c", ns):
                ref = c.get("r", "")
                col_letter = "".join([ch for ch in ref if ch.isalpha()])
                c_type = c.get("t")
                v = c.find("ns:v", ns)
                val = v.text if v is not None else ""
                if c_type == "s" and val.isdigit():
                    val = shared_strings[int(val)]
                cells[col_letter] = val
            raw_rows.append((r_idx, cells))

    return raw_rows


def process_questionnaire_data(raw_rows):
    categories_dict = {}
    question_counter = 0

    for r_idx, cells in raw_rows[1:]:
        col_a = cells.get("A", "").strip()
        col_b = cells.get("B", "").strip()
        col_c = cells.get("C", "").strip()
        col_d = cells.get("D", "").strip()

        # Ignore Größencluster notes at the bottom of the raw sheet
        if "Größencluster" in col_a or "Groessencluster" in col_a or "- Bis 10.000 EW" in col_a or "EW:" in col_a:
            continue

        if not col_a or not col_b:
            continue

        question_counter += 1
        q_id = f"q-{question_counter}"

        evaluation_type = "scale"
        scale_levels = []
        options = []

        if "Mehrfachauswahl" in col_c:
            evaluation_type = "multi_choice"
            raw_options = col_c.replace("Mehrfachauswahl:", "").replace("Mehrfachauswahl", "").strip()
            opts = [opt.strip() for opt in re.split(r"[,;\n]", raw_options) if opt.strip()]
            options = opts
        else:
            lines = [l.strip() for l in col_c.split("\n") if l.strip()]
            for line in lines:
                if "=" in line:
                    parts = line.split("=", 1)
                    lvl_num = parts[0].strip()
                    lvl_desc = parts[1].strip()
                    scale_levels.append({
                        "level": lvl_num,
                        "description": lvl_desc
                    })
                elif line:
                    scale_levels.append({
                        "level": str(len(scale_levels)),
                        "description": line
                    })

        cat_name = col_a
        if cat_name not in categories_dict:
            categories_dict[cat_name] = {
                "name": cat_name,
                "slug": slugify(cat_name),
                "questions": []
            }

        categories_dict[cat_name]["questions"].append({
            "id": q_id,
            "number": question_counter,
            "category": cat_name,
            "category_slug": slugify(cat_name),
            "question": col_b,
            "type": evaluation_type,
            "scale_levels": scale_levels,
            "options": options,
            "comment": col_d if col_d else None
        })

    categories_list = []
    for cat_name, cat_data in categories_dict.items():
        cat_data["count"] = len(cat_data["questions"])
        categories_list.append(cat_data)

    return {
        "title": "Smart City Fragebogen",
        "total_questions": question_counter,
        "categories_count": len(categories_list),
        "categories": categories_list
    }


def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    default_xlsx = os.path.join(repo_root, "tmp", "Smart City Fragebogen.xlsx")

    xlsx_path = sys.argv[1] if len(sys.argv) > 1 else default_xlsx

    if not os.path.exists(xlsx_path):
        print(f"Fehler: Datei '{xlsx_path}' nicht gefunden!", file=sys.stderr)
        sys.exit(1)

    print(f"Lese Excel-Datei: {xlsx_path}")
    raw_rows = parse_xlsx(xlsx_path)
    data = process_questionnaire_data(raw_rows)

    website_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    data_dir = os.path.join(website_dir, "data")
    static_downloads_dir = os.path.join(website_dir, "static", "downloads")

    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(static_downloads_dir, exist_ok=True)

    # 1. Speichere JSON
    json_path = os.path.join(data_dir, "smart_city_fragebogen.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"JSON generiert: {json_path} ({data['total_questions']} Fragen in {data['categories_count']} Kategorien)")

    # 2. Kopiere XLSX für Download
    target_xlsx = os.path.join(static_downloads_dir, "smart-city-fragebogen.xlsx")
    shutil.copy2(xlsx_path, target_xlsx)
    print(f"Rohdaten kopiert: {target_xlsx}")


if __name__ == "__main__":
    main()
