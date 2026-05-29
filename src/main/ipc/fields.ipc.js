function registerFieldIpc(registry, { database, schemas }) {
  registry.handle('tarlalar:get-all', () => database.query('SELECT * FROM tarlalar ORDER BY id DESC'));

  registry.handle('tarlalar:add', (_event, data) => {
    const payload = schemas.fieldSchema.parse(data);
    return database.run('INSERT INTO tarlalar (isim, donum, konum) VALUES (?, ?, ?)', [
      payload.isim,
      payload.donum,
      payload.konum || ''
    ]);
  });

  registry.handle('tarlalar:remove', (_event, id) => {
    return database.run('DELETE FROM tarlalar WHERE id = ?', [schemas.idSchema.parse(id)]);
  });
}

module.exports = registerFieldIpc;
