const DESCUENTO_PROVEEDOR = 0.20;
const GANANCIA_DEFAULT = 45000;

export function redondearAMil(valor) {
  return Math.round(valor / 1000) * 1000;
}

export function calcularPrecio(
  precioInicial,
  ganancia = GANANCIA_DEFAULT,
  precioVenta
) {
  const precio = Number(precioInicial) || 0;

  // Siempre aplicar 20% de descuento
  const costo_real = precio * (1 - DESCUENTO_PROVEEDOR);

  // Precio final de venta
  const precio_final = redondearAMil(
    Number(precioVenta) || (costo_real + Number(ganancia))
  );

  // Ganancia real
  const utilidad = precio_final - costo_real;

  return {
    precio_inicial: Math.round(precio),
    costo_real: Math.round(costo_real),
    precio_final,
    utilidad: Math.round(utilidad),
  };
}

export function recalcularConPrecioFinal(
  precio_inicial,
  precio_final
) {
  const precio = Number(precio_inicial) || 0;

  // Siempre aplicar 20% de descuento
  const costo_real = precio * (1 - DESCUENTO_PROVEEDOR);

  const final = redondearAMil(Number(precio_final) || 0);

  return {
    precio_inicial: Math.round(precio),
    costo_real: Math.round(costo_real),
    precio_final: final,
    utilidad: Math.round(final - costo_real),
  };
}