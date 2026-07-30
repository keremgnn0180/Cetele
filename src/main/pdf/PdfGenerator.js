const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class PdfGenerator {
  constructor(outputPath) {
    this.fontDir = path.join(process.cwd(), "assets", "fonts");

    this.doc = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
      autoFirstPage: true,
    });

    this.stream = fs.createWriteStream(outputPath);
    this.doc.pipe(this.stream);

    this.doc.registerFont(
      "Regular",
      path.join(this.fontDir, "NotoSans-Regular.ttf"),
    );

    this.doc.registerFont(
      "Bold",
      path.join(this.fontDir, "NotoSans-Bold.ttf"),
    );

    this.doc.font("Regular");
    this.width = this.doc.page.width;
    this.margin = 40;
  }

  title(text) {
    this.doc
      .font("Bold")
      .fontSize(22)
      .fillColor("#111827")
      .text(text);

    this.doc.moveDown(0.5);

    this.doc
      .strokeColor("#d1d5db")
      .lineWidth(1)
      .moveTo(this.margin, this.doc.y)
      .lineTo(this.width - this.margin, this.doc.y)
      .stroke();

    this.doc.moveDown();
  }

  subtitle(text) {
    this.doc
      .font("Bold")
      .fontSize(15)
      .fillColor("#374151")
      .text(text);

    this.doc.moveDown(0.4);
  }

  info(label, value) {
    this.doc
      .font("Bold")
      .fontSize(10)
      .fillColor("#111827")
      .text(label + ": ", {
        continued: true,
      });

    this.doc
      .font("Regular")
      .text(String(value));

    this.doc.moveDown(0.2);
  }

  text(text) {
    this.doc
      .font("Regular")
      .fontSize(10)
      .fillColor("#111827")
      .text(String(text));

    this.doc.moveDown(0.2);
  }

  table(headers, rows) {
    const startX = this.margin;
    const rowHeight = 22;
    const usableWidth = this.width - this.margin * 2;
    const colWidth = usableWidth / headers.length;

    const drawHeader = () => {
      let x = startX;

      headers.forEach((header) => {
        this.doc
          .rect(x, this.doc.y, colWidth, rowHeight)
          .fillAndStroke("#f3f4f6", "#d1d5db");

        this.doc
          .fillColor("#111827")
          .font("Bold")
          .fontSize(9)
          .text(header, x + 5, this.doc.y + 7, {
            width: colWidth - 10,
          });

        x += colWidth;
      });

      this.doc.y += rowHeight;
    };

    drawHeader();

    rows.forEach((row) => {
      if (this.doc.y > 740) {
        this.doc.addPage();
        drawHeader();
      }

      let x = startX;

      row.forEach((cell) => {
        this.doc
          .rect(x, this.doc.y, colWidth, rowHeight)
          .stroke("#e5e7eb");

        this.doc
          .font("Regular")
          .fontSize(9)
          .fillColor("#111827")
          .text(String(cell ?? ""), x + 5, this.doc.y + 6, {
            width: colWidth - 10,
          });

        x += colWidth;
      });

      this.doc.y += rowHeight;
    });

    this.doc.moveDown();
  }

  footer() {
    const range = this.doc.bufferedPageRange();

    for (let i = 0; i < range.count; i++) {
      this.doc.switchToPage(i);

      this.doc
        .font("Regular")
        .fontSize(9)
        .fillColor("#6b7280")
        .text(
          `Sayfa ${i + 1} / ${range.count}`,
          0,
          this.doc.page.height - 35,
          {
            align: "center",
          },
        );
    }
  }

  save() {
    this.footer();

    this.doc.end();

    return new Promise((resolve) => {
      this.stream.on("finish", resolve);
    });
  }
}

module.exports = PdfGenerator;