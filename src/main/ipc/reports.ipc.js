function registerReportIpc(registry, { database }) {
  registry.handle('raporlar:get-summary', () => {
    const tarlalarRes = database.query('SELECT COUNT(*) AS count, SUM(donum) AS totalDonum FROM tarlalar');
    const masraflarRes = database.query('SELECT SUM(tutar) AS total FROM masraflar');
    const hasatlarRes = database.query('SELECT SUM(gelir) AS total FROM hasatlar');

    const monthlyExpenses = database.query(`
      SELECT strftime('%Y-%m', tarih) AS ay, SUM(tutar) AS total
      FROM masraflar
      GROUP BY ay
      ORDER BY ay ASC
      LIMIT 12
    `);

    const monthlyRevenue = database.query(`
      SELECT strftime('%Y-%m', tarih) AS ay, SUM(gelir) AS total
      FROM hasatlar
      GROUP BY ay
      ORDER BY ay ASC
      LIMIT 12
    `);

    const catExpenses = database.query('SELECT kategori, SUM(tutar) AS total FROM masraflar GROUP BY kategori');

    const recentActivities = database.query(`
      SELECT * FROM (
        SELECT 'ekim' AS tip, e.tarih, e.miktar || ' ' || e.birim AS miktar, u.isim AS detay, t.isim AS tarla
        FROM ekimler e
        LEFT JOIN tarlalar t ON e.tarla_id = t.id
        LEFT JOIN urunler u ON e.urun_id = u.id
        UNION ALL
        SELECT 'masraf' AS tip, m.tarih, m.tutar || ' TL' AS miktar, m.kategori || ' - ' || COALESCE(m.urun_adi, '') AS detay, COALESCE(t.isim, 'Genel') AS tarla
        FROM masraflar m
        LEFT JOIN tarlalar t ON m.tarla_id = t.id
        UNION ALL
        SELECT 'hasat' AS tip, h.tarih, h.gelir || ' TL' AS miktar, u.isim AS detay, t.isim AS tarla
        FROM hasatlar h
        LEFT JOIN tarlalar t ON h.tarla_id = t.id
        LEFT JOIN urunler u ON h.urun_id = u.id
      )
      ORDER BY tarih DESC
      LIMIT 8
    `);

    const fieldPerformances = database.query(`
      SELECT
        t.id,
        t.isim,
        t.donum,
        COALESCE(me.total, 0) AS expenses,
        COALESCE(hr.total, 0) AS revenue,
        COALESCE(hr.total, 0) - COALESCE(me.total, 0) AS profit
      FROM tarlalar t
      LEFT JOIN (
        SELECT tarla_id, SUM(tutar) AS total FROM masraflar GROUP BY tarla_id
      ) me ON me.tarla_id = t.id
      LEFT JOIN (
        SELECT tarla_id, SUM(gelir) AS total FROM hasatlar GROUP BY tarla_id
      ) hr ON hr.tarla_id = t.id
      ORDER BY profit DESC
    `).map((item) => ({
      ...item,
      profitPerDonum: item.donum > 0 ? item.profit / item.donum : 0
    }));

    const totalExpenses = masraflarRes[0]?.total || 0;
    const totalRevenue = hasatlarRes[0]?.total || 0;

    return {
      totalFields: tarlalarRes[0]?.count || 0,
      totalArea: tarlalarRes[0]?.totalDonum || 0,
      totalExpenses,
      totalRevenue,
      netProfit: totalRevenue - totalExpenses,
      catExpenses,
      monthlyExpenses,
      monthlyRevenue,
      recentActivities,
      fieldPerformances
    };
  });
}

module.exports = registerReportIpc;
