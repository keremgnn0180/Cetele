const { dialog } = require("electron");
const PdfGenerator = require("../pdf/PdfGenerator");

function registerPdfIpc(registry) {
  registry.handle("pdf:export", async (_event, data) => {
    const result = await dialog.showSaveDialog({
      title: "PDF Kaydet",
      defaultPath: data.fileName || "Çetele-Rapor.pdf",
      filters: [
        {
          name: "PDF",
          extensions: ["pdf"],
        },
      ],
    });

    if (result.canceled) {
      return false;
    }

    const pdf = new PdfGenerator(result.filePath);

    pdf.title(data.title);

    if (Array.isArray(data.info)) {
      pdf.subtitle("Genel Bilgiler");

      data.info.forEach((item) => {
        pdf.info(item.label, item.value);
      });
    }

    if (Array.isArray(data.table)) {
      pdf.subtitle("Detaylar");

      pdf.table(
        data.table.headers,
        data.table.rows,
      );
    }

    if (Array.isArray(data.footer)) {
      pdf.subtitle("Özet");

      data.footer.forEach((item) => {
        pdf.info(item.label, item.value);
      });
    }

    await pdf.save();

    return true;
  });
}

module.exports = registerPdfIpc;