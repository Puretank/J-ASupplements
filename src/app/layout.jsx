import "./globals.css";
import { CartProvider } from "../context/CartContext";
import Navbar from "../components/layout/Navbar";

export const metadata = {
  title: "Supplements J&A Importados",
  description: "Tienda premium de suplementos importados"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          <Navbar />
          <main>{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
