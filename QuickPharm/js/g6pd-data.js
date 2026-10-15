// G6PD deficiency — drug & substance safety reference.
// Three tiers: avoid (clear hemolysis risk / contraindicated), caution (risk is
// dose-, variant- or evidence-dependent), safe (generally considered safe at
// therapeutic doses). Lists differ between sources and by variant severity, so
// every entry is a starting point to verify, not a final word.
//
// `match` = lowercase fragments compared against drug names in drugs-data.js so
// the dose calculator can warn automatically.

export const G6PD_RISK = {
  avoid: { label: "اجتناب", short: "ممنوع / اجتناب" },
  caution: { label: "احتیاط", short: "با احتیاط" },
  safe: { label: "معمولاً ایمن", short: "معمولاً ایمن" },
};

export const G6PD_ITEMS = [
  // ------------------------------------------------------------ AVOID
  {
    id: "primaquine", nameEn: "Primaquine", nameFa: "پریماکین", group: "ضدمالاریا", risk: "avoid",
    aliases: [], match: ["primaquine"],
    note: "هموليز وابسته به دوز. پیش از مصرف، سنجش کمّی فعالیت G6PD لازم است؛ در کمبود شدید ممنوع.",
  },
  {
    id: "tafenoquine", nameEn: "Tafenoquine", nameFa: "تافنوکین", group: "ضدمالاریا", risk: "avoid",
    aliases: [], match: ["tafenoquine"],
    note: "در کمبود G6PD (و فعالیت پایین آنزیم) کنتراندیکه است؛ تست کمّی پیش از شروع الزامی است.",
  },
  {
    id: "dapsone-oral", nameEn: "Dapsone (oral)", nameFa: "داپسون خوراکی", group: "ضدجذام / پوست", risk: "avoid",
    aliases: ["دپسون"], match: ["dapsone"],
    note: "هموليز و متهموگلوبینمی وابسته به دوز. پیش از شروع، وضعیت G6PD باید مشخص باشد.",
  },
  {
    id: "methylene-blue", nameEn: "Methylene blue (methylthioninium)", nameFa: "متیلن بلو", group: "آنتی‌دوت", risk: "avoid",
    aliases: ["متیلتیونینیوم"], match: ["methylene", "methylthioninium"],
    note: "کنتراندیکه. علاوه بر هموليز، در متهموگلوبینمی هم بی‌اثر است چون به NADPH نیاز دارد.",
  },
  {
    id: "rasburicase", nameEn: "Rasburicase", nameFa: "راسبوریکاز", group: "انکولوژی / اورژانس", risk: "avoid",
    aliases: [], match: ["rasburicase"],
    note: "هشدار جعبه‌ای (Boxed warning): هموليز شدید و متهموگلوبینمی. پیش از مصرف غربالگری G6PD انجام شود.",
  },
  {
    id: "pegloticase", nameEn: "Pegloticase", nameFa: "پگلوتیکاز", group: "نقرس", risk: "avoid",
    aliases: [], match: ["pegloticase"],
    note: "هشدار جعبه‌ای: هموليز و متهموگلوبینمی در کمبود G6PD؛ غربالگری پیش از شروع.",
  },
  {
    id: "nitrofurantoin", nameEn: "Nitrofurantoin", nameFa: "نیتروفورانتوئین", group: "آنتی‌بیوتیک ادراری", risk: "avoid",
    aliases: ["ماکروبید"], match: ["nitrofurantoin"],
    note: "هموليز گزارش‌شده؛ در نوزادان زیر ۱ ماه نیز ممنوع است. انتخاب جایگزین بر اساس کشت و آنتی‌بیوگرام.",
  },
  {
    id: "phenazopyridine", nameEn: "Phenazopyridine", nameFa: "فنازوپیریدین", group: "ضددرد ادراری", risk: "avoid",
    aliases: ["پیریدیوم"], match: ["phenazopyridine"],
    note: "هموليز و متهموگلوبینمی؛ در کمبود G6PD اجتناب شود.",
  },
  {
    id: "nalidixic-acid", nameEn: "Nalidixic acid", nameFa: "نالیدیکسیک اسید", group: "آنتی‌بیوتیک ادراری", risk: "avoid",
    aliases: [], match: ["nalidixic"],
    note: "هموليز مستند در کمبود G6PD؛ اجتناب.",
  },
  {
    id: "furazolidone", nameEn: "Furazolidone", nameFa: "فورازولیدون", group: "ضدانگل / ضدباکتری", risk: "avoid",
    aliases: ["فورازولیدون", "ژیاردیا"], match: ["furazolidone"],
    note: "نیتروفوران با خطر هموليز؛ در کمبود G6PD اجتناب.",
  },
  {
    id: "sulfadiazine", nameEn: "Sulfadiazine / sulfanilamide", nameFa: "سولفادیازین و سولفونامیدهای سیستمیک", group: "سولفونامید", risk: "avoid",
    aliases: ["سولفا"], match: ["sulfadiazine", "sulfanilamide", "sulfapyridine"],
    note: "گروه سولفونامیدها از محرک‌های شناخته‌شده هموليز هستند؛ در صورت وجود جایگزین، اجتناب.",
  },
  {
    id: "menadione", nameEn: "Menadione (vitamin K3, synthetic)", nameFa: "منادیون (ویتامین K3 مصنوعی)", group: "ویتامین", risk: "avoid",
    aliases: ["ویتامین کا۳"], match: ["menadione"],
    note: "هموليز، به‌خصوص در نوزادان. (ویتامین K1 یعنی فیتونادیون ایمن است.)",
  },
  {
    id: "vitamin-c-iv", nameEn: "Ascorbic acid (high-dose IV)", nameFa: "ویتامین C با دوز بالا (وریدی)", group: "ویتامین", risk: "avoid",
    aliases: ["اسکوربیک اسید"], match: [],
    note: "دوزهای وریدی بالا هموليز ایجاد کرده‌اند. دوز خوراکی معمول مشکلی ندارد.",
  },
  {
    id: "naphthalene", nameEn: "Naphthalene (mothballs)", nameFa: "نفتالین (گلوله ضدبید)", group: "مواد محیطی", risk: "avoid",
    aliases: ["ضدبید", "قرص نفتالین"], match: [],
    note: "تماس یا استنشاق بخار، به‌ویژه لباس و پتوی نوزاد نگهداری‌شده با نفتالین، می‌تواند هموليز شدید بدهد.",
  },
  {
    id: "fava-beans", nameEn: "Fava beans", nameFa: "باقلا", group: "غذا", risk: "avoid",
    aliases: ["باقلای تازه", "فاویسم"], match: [],
    note: "عامل فاویسم؛ هم خام و هم پخته. حتی گرده/بخار در برخی بیماران اثر دارد. همه مبتلایان با شدت‌های متفاوت حساس‌اند.",
  },
  {
    id: "henna-infants", nameEn: "Henna (infants)", nameFa: "حنا (نوزادان و شیرخواران)", group: "مواد محیطی", risk: "avoid",
    aliases: ["حنا"], match: [],
    note: "استفاده پوستی حنا در نوزادان مبتلا با هموليز شدید گزارش شده است؛ برای نوزاد و شیرخوار اجتناب.",
  },

  // ---------------------------------------------------------- CAUTION
  {
    id: "cotrimoxazole", nameEn: "Co-trimoxazole (TMP-SMX)", nameFa: "کوتریموکسازول", group: "آنتی‌بیوتیک", risk: "caution",
    aliases: ["باکتریم", "تری‌متوپریم سولفامتوکسازول", "سپترین"], match: ["cotrimoxazole", "sulfamethoxazole"],
    note: "برچسب دارو هموليز در کمبود G6PD را ذکر می‌کند و شواهد ریسک متغیر است. در صورت وجود جایگزین مناسب ترجیحاً انتخاب نشود؛ در غیر این صورت با پایش.",
  },
  {
    id: "sulfasalazine", nameEn: "Sulfasalazine", nameFa: "سولفاسالازین", group: "گوارش / روماتولوژی", risk: "caution",
    aliases: [], match: ["sulfasalazine"],
    note: "هموليز گزارش شده (وابسته به دوز و نوع واریانت)؛ با پایش CBC و علائم.",
  },
  {
    id: "sulfacetamide", nameEn: "Sulfacetamide (topical/ophthalmic)", nameFa: "سولفاستامید موضعی / قطره چشمی", group: "موضعی", risk: "caution",
    aliases: ["سولفاستامید"], match: ["sulfacetamide"],
    note: "در برخی فهرست‌ها اجتناب ذکر شده؛ جذب سیستمیک شکل موضعی کم است ولی در کمبود شدید یا سطح وسیع احتیاط.",
  },
  {
    id: "dapsone-topical", nameEn: "Dapsone gel (topical)", nameFa: "ژل داپسون موضعی", group: "پوست", risk: "caution",
    aliases: [], match: [],
    note: "جذب سیستمیک کم، اما موارد هموليز و متهموگلوبینمی در بیماران دچار کمبود گزارش شده است؛ با احتیاط و پایش.",
  },
  {
    id: "chloramphenicol", nameEn: "Chloramphenicol", nameFa: "کلرامفنیکل", group: "آنتی‌بیوتیک", risk: "caution",
    aliases: [], match: ["chloramphenicol"],
    note: "در برخی منابع محرک احتمالی است؛ فرم سیستمیک را با احتیاط و در صورت نبود جایگزین بهتر. فرم قطره/پماد چشمی ریسک کمتری دارد.",
  },
  {
    id: "quinine", nameEn: "Quinine", nameFa: "کینین", group: "ضدمالاریا", risk: "caution",
    aliases: [], match: ["quinine"],
    note: "هموليز در موارد کمبود گزارش شده؛ در درمان مالاریا در صورت نیاز با پایش بالینی.",
  },
  {
    id: "ciprofloxacin", nameEn: "Ciprofloxacin / fluoroquinolones", nameFa: "سیپروفلوکساسین و فلوروکینولون‌ها", group: "آنتی‌بیوتیک", risk: "caution",
    aliases: ["سیپرو", "لووفلوکساسین"], match: ["ciprofloxacin", "levofloxacin", "ofloxacin"],
    note: "ریسک پایین و عمدتاً گزارش‌های موردی؛ در عمل اغلب قابل استفاده است. در کمبود شدید یا هموليز فعال با احتیاط.",
  },
  {
    id: "aspirin-high", nameEn: "Aspirin (high analgesic doses)", nameFa: "آسپیرین (دوز بالای ضددرد)", group: "ضددرد / NSAID", risk: "caution",
    aliases: ["اسپرین", "استیل سالیسیلیک اسید"], match: [],
    note: "دوزهای بالا خطر دارند؛ دوز پایین ضدپلاکت معمولاً مشکلی ندارد. در کودکان به دلیل سندرم ری هم اصولاً توصیه نمی‌شود.",
  },
  {
    id: "glibenclamide", nameEn: "Sulfonylureas (glibenclamide…)", nameFa: "سولفونیل‌اوره‌ها (گلی‌بنکلامید و…)", group: "ضددیابت", risk: "caution",
    aliases: ["گلیبن کلامید"], match: ["glibenclamide", "glyburide"],
    note: "موارد نادر هموليز گزارش شده؛ در کمبود شدید با احتیاط و پایش.",
  },
  {
    id: "menthol-camphor-infants", nameEn: "Menthol / camphor (infants)", nameFa: "منتول و کافور (شیرخواران)", group: "مواد محیطی / موضعی", risk: "caution",
    aliases: ["بادام تلخ", "ویکس", "روغن کافور"], match: [],
    note: "فرآورده‌های موضعی حاوی کافور و منتول در نوزاد و شیرخوار توصیه نمی‌شود و در کمبود G6PD خطر بیشتری دارد.",
  },

  // ------------------------------------------------------------- SAFE
  {
    id: "acetaminophen", nameEn: "Acetaminophen (paracetamol)", nameFa: "استامینوفن (پاراستامول)", group: "ضددرد / تب‌بر", risk: "safe",
    aliases: ["پاراستامول"], match: ["acetaminophen"],
    note: "در دوز درمانی ایمن است؛ هموليز تنها در اوردوز مطرح می‌شود.",
  },
  {
    id: "ibuprofen", nameEn: "Ibuprofen", nameFa: "ایبوپروفن", group: "ضددرد / تب‌بر", risk: "safe",
    aliases: [], match: ["ibuprofen"],
    note: "در دوز درمانی معمولاً ایمن است.",
  },
  {
    id: "penicillins", nameEn: "Penicillins (amoxicillin, penicillin V)", nameFa: "پنی‌سیلین‌ها (آموکسی‌سیلین، پنی‌سیلین V)", group: "آنتی‌بیوتیک", risk: "safe",
    aliases: ["آموکسی سیلین", "آموکسی‌سیلین", "کوآموکسی کلاو", "آگمنتین"], match: ["amoxicillin", "penicillin", "coamoxicalve"],
    note: "از گزینه‌های ایمن در کمبود G6PD.",
  },
  {
    id: "cephalosporins", nameEn: "Cephalosporins (cephalexin, cefixime, cefuroxime)", nameFa: "سفالوسپورین‌ها", group: "آنتی‌بیوتیک", risk: "safe",
    aliases: ["سفالکسین", "سفیکسیم", "سفوروکسیم"], match: ["cefalexin", "cephalexin", "cefixime", "cefuroxime"],
    note: "در دوز درمانی ایمن.",
  },
  {
    id: "macrolides", nameEn: "Macrolides (azithromycin, clarithromycin, erythromycin)", nameFa: "ماکرولیدها", group: "آنتی‌بیوتیک", risk: "safe",
    aliases: ["آزیترومایسین", "کلاریترومایسین", "اریترومایسین"], match: ["azithromycin", "clarithromycin", "erythromycin"],
    note: "در دوز درمانی ایمن.",
  },
  {
    id: "clindamycin", nameEn: "Clindamycin", nameFa: "کلیندامایسین", group: "آنتی‌بیوتیک", risk: "safe",
    aliases: [], match: ["clindamycin"],
    note: "در دوز درمانی ایمن.",
  },
  {
    id: "metronidazole", nameEn: "Metronidazole", nameFa: "مترونیدازول", group: "آنتی‌بیوتیک / ضدانگل", risk: "safe",
    aliases: ["فلاژیل"], match: ["metronidazole"],
    note: "در منابع جدیدتر در دوز درمانی ایمن تلقی می‌شود؛ برخی فهرست‌های قدیمی احتیاط ذکر کرده‌اند.",
  },
  {
    id: "chloroquine", nameEn: "Chloroquine / hydroxychloroquine", nameFa: "کلروکین و هیدروکسی‌کلروکین", group: "ضدمالاریا", risk: "safe",
    aliases: ["هیدروکسی کلروکین"], match: ["chloroquine"],
    note: "در دوزهای استاندارد معمولاً قابل استفاده است؛ در دوزهای بالا یا کمبود شدید پایش شود.",
  },
  {
    id: "ondansetron", nameEn: "Ondansetron / domperidone", nameFa: "اندانسترون و دومپریدون", group: "ضدتهوع", risk: "safe",
    aliases: [], match: ["ondansetron", "domperidone"],
    note: "از نظر G6PD مشکلی گزارش نشده است.",
  },
  {
    id: "ppi-h2", nameEn: "Omeprazole / famotidine", nameFa: "امپرازول و فاموتیدین", group: "گوارش", risk: "safe",
    aliases: [], match: ["omeprazole", "famotidine"],
    note: "از نظر G6PD مشکلی گزارش نشده است.",
  },
  {
    id: "antihistamines", nameEn: "Cetirizine / loratadine", nameFa: "ستیریزین و لوراتادین", group: "آنتی‌هیستامین", risk: "safe",
    aliases: [], match: ["cetirizine", "loratadine", "desloratadine"],
    note: "از نظر G6PD مشکلی گزارش نشده است.",
  },
  {
    id: "phytonadione", nameEn: "Phytonadione (vitamin K1)", nameFa: "فیتونادیون (ویتامین K1)", group: "ویتامین", risk: "safe",
    aliases: ["ویتامین کا"], match: ["phytonadione"],
    note: "برخلاف منادیون (K3) ایمن است و تزریق معمول نوزادان مشکلی ندارد.",
  },
];
