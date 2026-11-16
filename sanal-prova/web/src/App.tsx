import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { StoreProvider, useStore } from './store';
import { AuthDialog, EmptyState, Footer, Header } from './components';
import { CartPage, Collection, Measurements, OrdersPage, ProductPage } from './pages';

function Shell() {
  const store = useStore(), location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); document.title = 'FIT STUDIO | Sana uyan koleksiyon'; }, [location.pathname]);
  return <><Header /><Routes><Route path="/" element={<Collection />} /><Route path="/tailored" element={<Collection mode="tailored" />} /><Route path="/favorites" element={<Collection mode="favorites" />} /><Route path="/products/:id" element={<ProductPage />} /><Route path="/measurements" element={<Measurements />} /><Route path="/cart" element={<CartPage />} /><Route path="/orders" element={<OrdersPage />} /><Route path="*" element={<EmptyState title="Bu sayfa bulunamadı." />} /></Routes><Footer />{store.authOpen && <AuthDialog />}</>;
}
export default function App() { return <StoreProvider><Shell /></StoreProvider>; }
