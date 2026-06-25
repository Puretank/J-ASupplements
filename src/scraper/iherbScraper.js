import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import chromium from "@sparticuz/chromium";

const PROMO_KEYWORDS = [
  "sale",
  "promotion",
  "special",
  "discount",
  "oferta",
  "descuento",
  "promo"
];

const CATEGORY_MAP = {
  protein: "Proteínas",
  whey: "Proteínas",
  creatine: "Creatina",
  vitamin: "Vitaminas",
  omega: "Omega-3",
  fish: "Omega-3",
  preworkout: "Pre-Entreno",
  "pre-workout": "Pre-Entreno",
  bcaa: "Aminoácidos",
  amino: "Aminoácidos",
  collagen: "Colágeno",
  probiotic: "Probióticos",
  weight: "Control de Peso",
  fat: "Quemadores",
  burner: "Quemadores",
  snack: "Snacks",
  bar: "Barras"
};

function getJsonLdProduct($) {
  const scripts = $('script[type="application/ld+json"]').toArray();

  for (const script of scripts) {
    const raw = $(script).html();
    if (!raw) continue;

    try {
      const json = JSON.parse(raw);
      const product = findProduct(json);
      if (product) return product;
    } catch {
      continue;
    }
  }

  return null;
}

function findProduct(json) {
  if (!json) return null;

  if (Array.isArray(json)) {
    for (const item of json) {
      const product = findProduct(item);
      if (product) return product;
    }
    return null;
  }

  if (typeof json === "object" && json["@type"] === "Product") {
    return json;
  }

  if (json["@graph"]) {
    return findProduct(json["@graph"]);
  }

  if (json.mainEntity) {
    return findProduct(json.mainEntity);
  }

  return null;
}

function getJsonLdImage(image) {
  if (!image) return null;
  if (Array.isArray(image)) {
    return image.find(Boolean) || image[0];
  }
  return image;
}

function normalizeText(text) {
  return (text || "").toString().trim();
}

function parsePrice(text) {
  if (text === null || text === undefined) return 0;
  const normalized = typeof text === "string" ? text : String(text);
  return parseFloat(normalized.replace(/[^0-9.]/g, "")) || 0;
}

function detectCurrency(text) {
  if (!text) return "USD";
  const lowerText = text.toString().toLowerCase();
  if (lowerText.includes("cop") || lowerText.includes("peso") || lowerText.includes("col")) {
    return "COP";
  }
  if (lowerText.includes("usd") || lowerText.includes("us$") || lowerText.includes("us dollar")) {
    return "USD";
  }
  if (lowerText.includes("$") && !lowerText.includes("us$")) {
    return "COP";
  }
  return "USD";
}

function detectCategory($, nombre) {
  const breadcrumb = $('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]')
    .text()
    .toLowerCase();

  const categoryLinks = $('[class*="category"], [data-testid*="category"]')
    .text()
    .toLowerCase();

  const combined = `${breadcrumb} ${categoryLinks} ${nombre}`.toLowerCase();

  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (combined.includes(keyword)) {
      return category;
    }
  }

  return "Suplementos";
}

function extractImage($, jsonLdProduct) {
  let image = "";

  if (jsonLdProduct) {
    const src = getJsonLdImage(jsonLdProduct.image);
    if (src && typeof src === "string" && src.length > 10 && !src.startsWith("data:")) {
      image = src.startsWith("//") ? `https:${src}` : src;
    }
  }

  const imageSelectors = [
    '[data-testid="product-image"] img',
    '.product-image img',
    '[class*="product-image"] img',
    '[class*="gallery"] img',
    'meta[property="og:image"]'
  ];

  // Primero busca imágenes con patrón /l/ de iHerb
  for (const selector of imageSelectors) {
    if (selector.startsWith("meta")) {
      const src = $(selector).attr("content");
      if (src && !src.includes("placeholder") && !src.startsWith("data:") && src.includes("/l/")) {
        image = src;
        break;
      }
      continue;
    }

    $(selector).each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && !src.includes("placeholder") && !src.startsWith("data:") && src.length > 10) {
        if (src.includes("/l/") && (src.includes("iherb") || src.includes("cloudinary"))) {
          image = src.startsWith("//") ? `https:${src}` : src;
        }
      }
    });
  }

  // Si no encuentra imagen con patrón /l/, usa cualquier imagen válida
  if (!image) {
    for (const selector of imageSelectors) {
      if (selector.startsWith("meta")) {
        const src = $(selector).attr("content");
        if (src && !src.includes("placeholder") && !src.startsWith("data:")) {
          image = src;
          break;
        }
        continue;
      }

      const el = $(selector).first();
      const src = el.attr("src") || el.attr("data-src");
      if (src && !src.includes("placeholder") && !src.startsWith("data:") && src.length > 10) {
        image = src.startsWith("//") ? `https:${src}` : src;
        break;
      }
    }
  }

  // Fallback
  if (!image) {
    const fallback = $("img")
      .filter((_, el) => {
        const src = $(el).attr("src") || "";
        return (src.includes("iherb") || src.includes("cloudinary")) && !src.startsWith("data:");
      })
      .first()
      .attr("src");

    image = fallback?.startsWith("//") ? `https:${fallback}` : fallback || "";
  }

  // Siempre reemplaza /g/ con /l/ en la imagen final
  if (image) {
    image = image.replace(/\/g\//g, "/l/");
  }

  return image;
}

async function checkImageExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

async function extractImages($, jsonLdProduct) {
  const images = [];

  // Usa extractImage para obtener la imagen principal
  const mainImage = extractImage($, jsonLdProduct);
  // Solo agregar si es de alta calidad (images-iherb.com) y usar /l/ siempre
  if (mainImage && mainImage.length > 10 && mainImage.includes("images-iherb.com")) {
    // Reemplazar /r/ o /g/ con /l/ para asegurar alta calidad
    const highQualityMain = mainImage.replace(/\/[gr]\//g, "/l/");
    images.push(highQualityMain);
  }

  // Si tenemos la imagen principal y tiene el patrón de iHerb, genera todas las imágenes disponibles
  if (images.length === 1) {
    const mainImage = images[0];
    // Patrón: /g/8.jpg → /l/13.jpg o /l/8.jpg → /l/13.jpg (incrementa el número en 5 o 6)
    const match = mainImage.match(/\/[gl]\/(\d+)\.jpg/);
    if (match) {
      const currentNumber = parseInt(match[1]);

      // Intenta generar múltiples imágenes incrementando el número
      // iHerb normalmente tiene imágenes en secuencia
      for (let i = 1; i <= 15; i++) {
        // Intenta con +5 y +6 alternativamente
        const increment = i % 2 === 0 ? 6 : 5;
        const nextNumber = currentNumber + (i * increment);
        const nextImage = mainImage.replace(/\/[gl]\/\d+\.jpg/, `/l/${nextNumber}.jpg`);

        // Verifica si la imagen existe y es de alta calidad
        const exists = await checkImageExists(nextImage);
        if (exists && nextImage.includes("images-iherb.com") && !images.includes(nextImage)) {
          images.push(nextImage);
        } else {
          // Si una imagen no existe, intentamos con el siguiente patrón
          const altNumber = currentNumber + (i * (increment === 5 ? 6 : 5));
          const altImage = mainImage.replace(/\/[gl]\/\d+\.jpg/, `/l/${altNumber}.jpg`);
          const altExists = await checkImageExists(altImage);
          if (altExists && altImage.includes("images-iherb.com") && !images.includes(altImage)) {
            images.push(altImage);
          }
        }
      }
    }
  }

  // También intenta buscar imágenes en la galería del producto
  const gallerySelectors = [
    '[data-testid="product-gallery"] img',
    '[class*="gallery"] img',
    '[class*="thumbnail"] img',
    '[class*="product-image"] img'
  ];

  for (const selector of gallerySelectors) {
    $(selector).each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && src.length > 10 && !src.includes("placeholder") && !src.startsWith("data:")) {
        const fullSrc = src.startsWith("//") ? `https:${src}` : src;
        // Reemplaza /r/ y /g/ con /l/ para mejor calidad
        const highQualitySrc = fullSrc.replace(/\/[gr]\//g, "/l/");
        // Solo agregar si es de alta calidad (images-iherb.com)
        if (highQualitySrc.includes("images-iherb.com") && !images.includes(highQualitySrc)) {
          images.push(highQualitySrc);
        }
      }
    });
  }

  // Eliminar duplicados y devolver todas las imágenes encontradas
  return [...new Set(images)];
}

function extractSize($, jsonLdProduct) {
  if (jsonLdProduct) {
    if (jsonLdProduct.size?.name) {
      return jsonLdProduct.size.name.toString();
    }

    if (jsonLdProduct.weight?.value) {
      const unit = jsonLdProduct.weight?.unitText ? ` ${jsonLdProduct.weight.unitText}` : "";
      return `${jsonLdProduct.weight.value}${unit}`.trim();
    }
  }

  const sizeSelectors = [
    '[data-testid="package-quantity"]',
    '[class*="package-quantity"]',
    '[class*="product-size"]',
    'select[name*="size"] option:selected',
    '[class*="weight"]'
  ];

  for (const selector of sizeSelectors) {
    const text = $(selector).first().text().trim();
    if (text && text.length < 50) return text;
  }

  const title = $("h1").first().text();
  const sizeMatch = title.match(
    /(\d+\s*(?:g|kg|ml|l|oz|lb|caps|tablets|softgels|count|ct))/i
  );
  return sizeMatch ? sizeMatch[1] : null;
}

function extractFlavors($) {
  const flavors = new Set();

  const flavorSelectors = [
    '[class*="flavor"] option',
    '[data-testid*="flavor"]',
    '[class*="variant"] option',
    'select option'
  ];

  for (const selector of flavorSelectors) {
    $(selector).each((_, el) => {
      const text = $(el).text().trim();
      if (
        text &&
        text.length < 40 &&
        !text.toLowerCase().includes("select") &&
        !text.toLowerCase().includes("choose")
      ) {
        flavors.add(text);
      }
    });
  }

  return flavors.size > 0 ? Array.from(flavors) : null;
}



export async function scrapeIHerbProduct(url) {
  let browser;

  try {
    const isVercel = process.env.VERCEL === "1";

    if (isVercel) {
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless
      });
    } else {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });
    }

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    const html = await page.content();
    const $ = cheerio.load(html);
    const jsonLdProduct = getJsonLdProduct($);

    const nombre =
      normalizeText(jsonLdProduct?.name) ||
      $("h1").first().text().trim();

    const marca =
      normalizeText(
        typeof jsonLdProduct?.brand === "string"
          ? jsonLdProduct.brand
          : jsonLdProduct?.brand?.name || ""
      ) ||
      $('[data-testid="brand-name"]').first().text().trim() ||
      $('[class*="brand-name"]').first().text().trim() ||
      $('[class*="brand"] a').first().text().trim() ||
      "";

    const offer = Array.isArray(jsonLdProduct?.offers)
      ? jsonLdProduct.offers[0]
      : jsonLdProduct?.offers;

    const precioTexto =
      offer?.price && parsePrice(String(offer.price)) > 0
        ? String(offer.price)
        : [
            ".price",
            '[class*="discount-price"]',
            '[class*="sale-price"]',
            '[data-testid*="price"]'
          ]
            .map((selector) => $(selector).first().text())
            .find((text) => text && parsePrice(text) > 0) ||
          "";

    const precioOriginalTexto =
      (Array.isArray(offer?.priceSpecification)
        ? offer.priceSpecification
            .map((item) => item?.price || item?.value)
            .find((price) => parsePrice(price) > parsePrice(precioTexto))
        : offer?.priceSpecification?.price ||
          offer?.priceSpecification?.value) ||
      $(".price-original").first().text() ||
      $(".list-price").first().text() ||
      $("del").first().text() ||
      $("s").first().text() ||
      "";

    const precioActual = parsePrice(precioTexto);
    const precioOriginal = parsePrice(precioOriginalTexto);
    const moneda =
      detectCurrency(offer?.priceCurrency || offer?.currency || precioTexto);

    // Detectar promoción: si precio original > precio actual
    const tienePromocion = precioOriginal > precioActual && precioActual > 0;

    return {
      nombre,
      marca,
      precioUSD: moneda === "USD" ? precioActual : null,
      precioCOP: moneda === "COP" ? precioActual : null,
      precioOriginalUSD: moneda === "USD" ? precioOriginal : null,
      precioOriginalCOP: moneda === "COP" ? precioOriginal : null,
      moneda,
      imagen: extractImage($, jsonLdProduct),
      imagenes: await extractImages($, jsonLdProduct),
      tienePromocion,
      categoria:
        normalizeText(
          typeof jsonLdProduct?.category === "string"
            ? jsonLdProduct.category
            : jsonLdProduct?.category?.name || ""
        ) || detectCategory($, nombre),
      tamano: extractSize($, jsonLdProduct),
      sabores: extractFlavors($),
      iherb_url: url
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
