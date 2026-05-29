function registerHarvestIpc(registry, { database, schemas }) {
  registry.handle('hasatlar:get-all', () => {
    const sql = `
      SELECT h.*, t.isim AS tarla_isim, u.isim AS urun_isim
      FROM hasatlar h
      LEFT JOIN tarlalar t ON h.tarla_id = t.id
      LEFT JOIN urunler u ON h.urun_id = u.id
      ORDER BY h.tarih DESC, h.id DESC
    `;
    return database.query(sql);
  });

  registry.handle('hasatlar:add', (_event, data) => {
    const payload = schemas.harvestSchema.parse(data);
    const gelir = payload.miktar * payload.birim_satis_fiyati;
    const sql = 'INSERT INTO hasatlar (tarla_id, urun_id, miktar, birim, birim_satis_fiyati, gelir, tarih, aciklama) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    return database.run(sql, [
      payload.tarla_id,
      payload.urun_id,
      payload.miktar,
      payload.birim,
      payload.birim_satis_fiyati,
      gelir,
      payload.tarih,
      payload.aciklama || ''
    ]);
  });

  registry.handle('hasatlar:remove', (_event, id) => {
    return database.run('DELETE FROM hasatlar WHERE id = ?', [schemas.idSchema.parse(id)]);
  });
}

module.exports = registerHarvestIpc;
