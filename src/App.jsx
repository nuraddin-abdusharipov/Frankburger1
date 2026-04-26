import './App.css'
import { Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Footer from './components/layout/Footer'
import { useState, useEffect } from "react"
import Loading from './components/Loading'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import Orders from './components/Orders'
import Admin from './components/Admin'
import Profile from './components/Profile'

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  const tg = window.Telegram?.WebApp

  if (tg) {
    tg.expand()
    tg.ready()
  }

  setLoading(false)
}, [])

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/order/:orderId" element={<Admin />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App