import { Sprout, Leaf, Combine, ShieldCheck, FlaskConical } from "lucide-react";

export const BRAND_OPTIONS_MAP = {
  Tohum: [
    { name: "Pioneer", icon: Sprout },
    { name: "Syngenta", icon: Sprout },
    { name: "Dekalb", icon: Leaf },
    { name: "May Tohum", icon: Leaf },
    { name: "Progen", icon: Sprout },
  ],
  Gübre: [
    { name: "Toros Gübre", icon: Combine },
    { name: "İgsaş", icon: Combine },
    { name: "Gübretaş", icon: Combine },
    { name: "Bagfaş", icon: Combine },
    { name: "Hektaş", icon: Combine },
  ],
  İlaç: [
    { name: "Bayer", icon: ShieldCheck },
    { name: "Syngenta", icon: ShieldCheck },
    { name: "BASF", icon: FlaskConical },
    { name: "Hektaş", icon: FlaskConical },
    { name: "Koruma Klor", icon: ShieldCheck },
  ],
};

export const DEFAULT_FERTILIZERS = {
  Yara: {
    Üre: ["Yara Üre"],
    DAP: ["Yara DAP"],
    CAN: ["YaraBela CAN 26"],
    NPK: ["YaraMila Complex", "YaraMila Cropcare"],
    Organik: ["Yara Organik"],
    "Amonyum Sülfat": ["Yara Amonyum Sülfat"],
    "Potasyum Nitrat": ["Yara Potasyum Nitrat"],
    Çinko: ["Yara Çinko"],
    "Mikro Element": ["Yara Mikro Element"],
    "Sıvı Gübre": ["YaraTera"],
  },
  Toros: {
    Üre: ["Üre 46"],
    DAP: ["DAP 18-46", "Toros DAP Plus"],
    CAN: ["Toros CAN"],
    NPK: ["Toros NPK"],
    Organik: ["Toros Organik"],
    "Amonyum Sülfat": ["Toros Amonyum Sülfat"],
    "Potasyum Nitrat": ["Toros Potasyum Nitrat"],
    Çinko: ["Toros Çinko"],
    "Mikro Element": ["Toros Mikro Element"],
    "Sıvı Gübre": ["Toros Sıvı Gübre"],
  },
  Gübretaş: {
    Üre: ["Gübretaş Üre"],
    DAP: ["Gübretaş DAP"],
    CAN: ["Gübretaş CAN"],
    NPK: ["20-20-0", "15-15-15", "25-5-10"],
    Organik: ["Gübretaş Organik"],
    "Amonyum Sülfat": ["Gübretaş Amonyum Sülfat"],
    "Potasyum Nitrat": ["Gübretaş Potasyum Nitrat"],
    Çinko: ["Gübretaş Çinko"],
    "Mikro Element": ["Gübretaş Mikro Element"],
    "Sıvı Gübre": ["Gübretaş Sıvı Gübre"],
  },
  İGSAŞ: {
    Üre: ["İGSAŞ Üre"],
    DAP: ["İGSAŞ DAP"],
    CAN: ["CAN 26"],
    NPK: ["İGSAŞ NPK"],
    Organik: ["İGSAŞ Organik"],
    "Amonyum Sülfat": ["Amonyum Sülfat"],
    "Potasyum Nitrat": ["İGSAŞ Potasyum Nitrat"],
    Çinko: ["İGSAŞ Çinko"],
    "Mikro Element": ["İGSAŞ Mikro Element"],
    "Sıvı Gübre": ["İGSAŞ Sıvı Gübre"],
  },
  Bagfaş: {
    Üre: ["Bagfaş Üre"],
    DAP: ["Bagfaş DAP"],
    CAN: ["Bagfaş CAN"],
    NPK: ["Bagfaş NPK"],
    Organik: ["Bagfaş Organik"],
    "Amonyum Sülfat": ["Bagfaş Amonyum Sülfat"],
    "Potasyum Nitrat": ["Bagfaş Potasyum Nitrat"],
    Çinko: ["Bagfaş Çinko"],
    "Mikro Element": ["Bagfaş Mikro Element"],
    "Sıvı Gübre": ["Bagfaş Sıvı Gübre"],
  },
  Hektaş: {
    "Sıvı Gübre": ["Hektaş Sıvı Gübre"],
    "Mikro Element": ["Hektaş Mikro Element"],
  },
  "Eti Gübre": {
    NPK: ["Eti Gübre NPK"],
    DAP: ["Eti Gübre DAP"],
  },
  EuroChem: {
    NPK: ["EuroChem NPK"],
    DAP: ["EuroChem DAP"],
  },
  Basf: {
    "Mikro Element": ["Basf Mikro Element"],
    Çinko: ["Basf Çinko"],
  },
  Bayer: {
    "Mikro Element": ["Bayer Mikro Element"],
    "Sıvı Gübre": ["Bayer Sıvı Gübre"],
  },
};

export const STORAGE_KEY = "cetele_fertilizers";
export const NEW_BRAND_OPTION = "+ Yeni Marka Ekle";
export const NEW_TYPE_OPTION = "+ Yeni Tür Ekle";
export const NEW_VARIETY_OPTION = "+ Yeni Çeşit Ekle";

export const KATEGORILER = [
  "Gübre",
  "İlaç",
  "Tohum",
  "Yakıt",
  "İşçilik",
  "Diğer",
];

export const DEFAULT_BIRIMLER = [
  "Adet",
  "Kilo",
  "Litre",
  "Ton",
  "Çuval",
  "Paket",
  "Dekar",
];

export const ISCILIK_BIRIMLER = [
  "Adet",
  "Saat",
  "Gün",
  "Dönüm",
  "Dekar",
  "Hektar",
  "Çuval",
  "Paket",
];

export const PRODUCT_CATEGORIES = ["Gübre", "İlaç", "Tohum"];
export const DEFAULT_FILTER_VALUE = "HEPSİ";
export const GENERAL_FILTER_VALUE = "GENEL";
