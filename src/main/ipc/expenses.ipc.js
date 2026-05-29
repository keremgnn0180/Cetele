function registerExpenseIpc(registry, { database, schemas }) {
  registry.handle('masraflar:get-all', () => {
    const sql = `
      SELECT m.*, t.isim AS tarla_isim
      FROM masraflar m
      LEFT JOIN tarlalar t ON m.tarla_id = t.id
      ORDER BY m.tarih DESC, m.id DESC
    `;
    return database.query(sql);
  });

  registry.handle('masraflar:add', (_event, data) => {
    const payload = schemas.expenseSchema.parse(data);
    const tutar = payload.miktar * payload.birim_fiyat;
    const sql = 'INSERT INTO masraflar (tarla_id, kategori, urun_adi, gubre_marka, gubre_turu, gubre_cesit, miktar, birim, birim_fiyat, tutar, tarih, aciklama) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    return database.run(sql, [
      payload.tarla_id ? parseInt(payload.tarla_id) : null,
      payload.kategori,
      payload.urun_adi || '',
      payload.gubre_marka || null,
      payload.gubre_turu || null,
      payload.gubre_cesit || null,
      payload.miktar,
      payload.birim,
      payload.birim_fiyat,
      tutar,
      payload.tarih,
      payload.aciklama || ''
    ]);
  });

  registry.handle('masraflar:update', (_event, id, data) => {
    const payload = schemas.expenseSchema.parse(data);
    const tutar = payload.miktar * payload.birim_fiyat;
    const sql = `
      UPDATE masraflar
      SET tarla_id = ?, kategori = ?, urun_adi = ?, gubre_marka = ?, gubre_turu = ?, gubre_cesit = ?,
          miktar = ?, birim = ?, birim_fiyat = ?, tutar = ?, tarih = ?, aciklama = ?
      WHERE id = ?
    `;
    return database.run(sql, [
      payload.tarla_id ? parseInt(payload.tarla_id) : null,
      payload.kategori,
      payload.urun_adi || '',
      payload.gubre_marka || null,
      payload.gubre_turu || null,
      payload.gubre_cesit || null,
      payload.miktar,
      payload.birim,
      payload.birim_fiyat,
      tutar,
      payload.tarih,
      payload.aciklama || '',
      schemas.idSchema.parse(id)
    ]);
  });

  registry.handle('masraflar:remove', (_event, id) => {
    return database.run('DELETE FROM masraflar WHERE id = ?', [schemas.idSchema.parse(id)]);
  });
}

module.exports = registerExpenseIpc;
