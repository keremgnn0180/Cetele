function registerPlantingIpc(registry, { database, schemas }) {
  registry.handle('ekimler:get-all', () => {
    const sql = `
      SELECT e.*, t.isim AS tarla_isim, u.isim AS urun_isim
      FROM ekimler e
      LEFT JOIN tarlalar t ON e.tarla_id = t.id
      LEFT JOIN urunler u ON e.urun_id = u.id
      ORDER BY e.tarih DESC, e.id DESC
    `;
    return database.query(sql);
  });

  registry.handle('ekimler:add', (_event, data) => {
    const payload = schemas.plantingSchema.parse(data);
    const sql = 'INSERT INTO ekimler (tarla_id, urun_id, miktar, birim, tarih, aciklama) VALUES (?, ?, ?, ?, ?, ?)';
    return database.run(sql, [
      payload.tarla_id,
      payload.urun_id,
      payload.miktar,
      payload.birim,
      payload.tarih,
      payload.aciklama || ''
    ]);
  });

  registry.handle('ekimler:remove', (_event, id) => {
    return database.run('DELETE FROM ekimler WHERE id = ?', [schemas.idSchema.parse(id)]);
  });
}

module.exports = registerPlantingIpc;
