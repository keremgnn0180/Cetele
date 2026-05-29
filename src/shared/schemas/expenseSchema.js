const { z } = require('zod');

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((value) => value || '');

const expenseSchema = z.object({
  tarla_id: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional(),
  kategori: z.string().trim().min(1).max(80),
  urun_adi: optionalText,
  gubre_marka: optionalText,
  gubre_turu: optionalText,
  gubre_cesit: optionalText,
  miktar: z.coerce.number().finite().nonnegative(),
  birim: z.string().trim().min(1).max(30),
  birim_fiyat: z.coerce.number().finite().nonnegative(),
  tarih: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  aciklama: optionalText
});

function validateExpensePayload(payload) {
  return expenseSchema.parse(payload);
}

module.exports = {
  expenseSchema,
  validateExpensePayload
};
