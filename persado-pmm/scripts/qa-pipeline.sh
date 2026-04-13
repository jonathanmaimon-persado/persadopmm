#!/bin/bash
# Usage: bash scripts/qa-pipeline.sh output/decks/my-deck.pptx

INPUT="$1"
BASENAME=$(basename "$INPUT" .pptx)
QA_DIR="output/qa/$BASENAME"

mkdir -p "$QA_DIR"

# Step 1: Convert to PDF
echo "Converting to PDF..."
libreoffice --headless --convert-to pdf "$INPUT" --outdir "$QA_DIR"

# Step 2: Render per-slide JPEGs
echo "Rendering slide images..."
pdftoppm -jpeg -r 150 "$QA_DIR/$BASENAME.pdf" "$QA_DIR/slide"

echo "QA images ready in $QA_DIR/"
ls "$QA_DIR/"
