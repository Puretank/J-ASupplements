"use client";

import { useState } from "react";
import { formatCOP } from "../../lib/format";

export default function ProductCard({ product, onAddToCart }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Usa array de imagenes si existe, sino intenta usar imagen sola
  const images = product.imagenes && product.imagenes.length > 0
    ? product.imagenes
    : product.imagen
    ? [product.imagen]
    : [];

  const currentImage = images[imageIndex];

  const handlePrevImage = (e) => {
    e.preventDefault();
    setImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = (e) => {
    e.preventDefault();
    setImageIndex((prev) => (prev + 1) % images.length);
  };

  const handleImageClick = () => {
    if (currentImage) {
      setIsZoomed(true);
    }
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-surface-700 transition duration-300 hover:border-brand-500/30 hover:shadow-glow">

      <div className="relative aspect-square overflow-hidden bg-surface-600">
        {currentImage ? (
          <>
            <img
              src={currentImage}
              alt={product.nombre}
              className="h-full w-full cursor-pointer object-contain p-4 transition duration-500 group-hover:scale-105"
              onClick={handleImageClick}
            />
            
            {/* Carrusel de imágenes si hay más de 1 */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/70"
                  aria-label="Imagen anterior"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/70"
                  aria-label="Imagen siguiente"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Puntos indicadores */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setImageIndex(idx)}
                      className={`h-2 w-2 rounded-full transition ${
                        idx === imageIndex 
                          ? "bg-brand-400" 
                          : "bg-white/30 hover:bg-white/50"
                      }`}
                      aria-label={`Imagen ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-600">
            Sin imagen
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.categoria && (
          <span className="mb-1 text-xs font-medium uppercase tracking-wider text-brand-400">
            {product.categoria}
          </span>
        )}

        <h3 className="mb-1 line-clamp-2 font-medium text-white">
          {product.nombre}
        </h3>

        <p className="mb-2 text-sm text-gray-400">{product.marca}</p>

        {product.tamano && (
          <p className="mb-2 text-xs text-gray-500">{product.tamano}</p>
        )}

        <div className="mt-auto">
          <p className="font-display text-2xl font-bold text-white">
            {formatCOP(product.precio_final)}
          </p>

          <button
            onClick={() => onAddToCart(product)}
            className="mt-3 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-black transition hover:bg-brand-400 active:scale-[0.98]"
          >
            Agregar al carrito
          </button>
        </div>
      </div>

      {/* Modal de zoom */}
      {isZoomed && currentImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-h-full max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute -top-12 right-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Cerrar zoom"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={() => handlePrevImage({ preventDefault: () => {} })}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70"
                  aria-label="Imagen anterior"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={() => handleNextImage({ preventDefault: () => {} })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70"
                  aria-label="Imagen siguiente"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            <img
              src={currentImage}
              alt={product.nombre}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />

            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setImageIndex(idx)}
                    className={`h-2 w-2 rounded-full transition ${
                      idx === imageIndex
                        ? "bg-brand-400"
                        : "bg-white/30 hover:bg-white/50"
                    }`}
                    aria-label={`Imagen ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
