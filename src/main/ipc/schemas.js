const { z } = require('zod');
const { expenseSchema } = require('../../shared/schemas/expenseSchema.js');

const idSchema = z.coerce.number().int().positive();

const fieldSchema = z.object({
  isim: z.string().trim().min(1).max(120),
  donum: z.coerce.number().finite().nonnegative(),
  konum: z.string().trim().max(250).optional().default('')
});

const productSchema = z.object({
  isim: z.string().trim().min(1).max(120),
  kategori: z.string().trim().max(80).optional().default(''),
  tohum_markasi: z.string().trim().max(120).optional().default(''),
  tohum_marka: z.string().trim().max(120).optional().default(''),
  tohum_cesidi: z.string().trim().max(120).optional().default(''),
  tohum_cesit: z.string().trim().max(120).optional().default(''),
  tohum_notu: z.string().trim().max(500).optional().default('')
});

const plantingSchema = z.object({
  tarla_id: idSchema,
  urun_id: idSchema,
  miktar: z.coerce.number().finite().nonnegative(),
  birim: z.string().trim().min(1).max(30),
  tarih: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  aciklama: z.string().trim().max(500).optional().default('')
});

const harvestSchema = z.object({
  tarla_id: idSchema,
  urun_id: idSchema,
  miktar: z.coerce.number().finite().nonnegative(),
  birim: z.string().trim().min(1).max(30),
  birim_satis_fiyati: z.coerce.number().finite().nonnegative(),
  tarih: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  aciklama: z.string().trim().max(500).optional().default('')
});

const safePathSchema = z.string().trim().min(1).max(1000);

module.exports = {
  idSchema,
  fieldSchema,
  productSchema,
  plantingSchema,
  expenseSchema,
  harvestSchema,
  safePathSchema
};
