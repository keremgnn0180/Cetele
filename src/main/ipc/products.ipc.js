function registerProductIpc(registry, { database, schemas }) {
  registry.handle('urunler:get-all', () => database.query('SELECT * FROM urunler ORDER BY id DESC'));

  registry.handle('urunler:add', (_event, data) => {
    const payload = schemas.productSchema.parse(data);
    const sql = 'INSERT INTO urunler (isim, kategori, tohum_markasi, tohum_marka, tohum_cesidi, tohum_cesit, tohum_notu) VALUES (?, ?, ?, ?, ?, ?, ?)';
    return database.run(sql, [
      payload.isim,
      payload.kategori || '',
      payload.tohum_markasi || '',
      payload.tohum_markasi || payload.tohum_marka || '',
      payload.tohum_cesidi || '',
      payload.tohum_cesidi || payload.tohum_cesit || '',
      payload.tohum_notu || ''
    ]);
  });

  registry.handle('urunler:remove', (_event, id) => {
    return database.run('DELETE FROM urunler WHERE id = ?', [schemas.idSchema.parse(id)]);
  });
}

module.exports = registerProductIpc;
