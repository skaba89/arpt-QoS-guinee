#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Merge cover + body PDFs into final ONIT-PNG document."""
from pypdf import PdfReader, PdfWriter, Transformation

A4_W, A4_H = 595.28, 841.89

def normalize_page_to_a4(page):
    box = page.mediabox
    w, h = float(box.width), float(box.height)
    if abs(w - A4_W) > 2 or abs(h - A4_H) > 2:
        sx, sy = A4_W / w, A4_H / h
        page.add_transformation(Transformation().scale(sx=sx, sy=sy))
        page.mediabox.lower_left = (0, 0)
        page.mediabox.upper_right = (A4_W, A4_H)
    return page

cover_pdf = "/home/z/my-project/download/cover_onit.pdf"
body_pdf = "/home/z/my-project/download/onit_body.pdf"
output_pdf = "/home/z/my-project/download/ONIT-PNG_Guide_Sources_Donnees.pdf"

writer = PdfWriter()

# Cover as page 1
cover_page = PdfReader(cover_pdf).pages[0]
writer.add_page(normalize_page_to_a4(cover_page))

# Body pages follow
for page in PdfReader(body_pdf).pages:
    writer.add_page(normalize_page_to_a4(page))

writer.add_metadata({
    '/Title': 'ONIT-PNG - Guide des Sources de Données et Méthodes de Collecte',
    '/Author': 'ARPT - Autorité de Régulation des Postes et Télécommunications de Guinée',
    '/Creator': 'Z.ai',
    '/Subject': 'Guide des sources de données, formats et méthodes de collecte pour ONIT-PNG',
})

with open(output_pdf, 'wb') as f:
    writer.write(f)

print(f"Final PDF: {output_pdf}")
