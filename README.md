# FitStore Pro

Tienda profesional de suplementos importados desde iHerb.

## Stack

- Next.js 14 (App Router)
- Supabase
- Tailwind CSS
- Puppeteer + Cheerio
- React Context

## Configuración

1. Instalar dependencias:

```bash
npm install
```

2. Crear `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

3. Ejecutar el SQL en Supabase SQL Editor:

```bash
# Contenido en database.sql
```

4. Iniciar desarrollo:

```bash
npm run dev
```

## Estructura

```
src/
├── app/
│   ├── page.jsx              # Tienda (catálogo)
│   ├── cart/page.jsx         # Carrito + WhatsApp
│   ├── admin/                # Panel administrativo
│   │   ├── page.jsx          # Dashboard métricas
│   │   ├── products/         # CRUD productos
│   │   ├── orders/           # Gestión pedidos
│   │   ├── import/           # Importador iHerb
│   │   └── settings/         # TRM, ganancia, WhatsApp
│   └── api/                  # API routes
├── components/
├── context/CartContext.jsx
├── lib/pricing.js
└── scraper/iherbScraper.js
```

## Lógica de precios

- **Sin promoción:** USD × TRM → -20% → + ganancia → redondeo a $1.000
- **Con promoción:** USD × TRM → + ganancia → redondeo a $1.000 (sin 20%)

## Panel Admin

- `/admin` — Dashboard con métricas
- `/admin/products` — Tabla de productos con edición inline
- `/admin/orders` — Pedidos y estados de pago
- `/admin/import` — Importar desde iHerb
- `/admin/settings` — TRM, ganancia, WhatsApp
