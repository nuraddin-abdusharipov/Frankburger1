import './Cart.css'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Cart() {
    const navigate = useNavigate()
    const [cart, setCart] = useState([])

    useEffect(() => {
        const savedCart = localStorage.getItem('cart')
        if (savedCart) {
            setCart(JSON.parse(savedCart))
        }
    }, [])

    const updateCart = (newCart) => {
        setCart(newCart)
        localStorage.setItem('cart', JSON.stringify(newCart))
    }

    const removeFromCart = (id) => {
        const newCart = cart.filter(item => item.id !== id)
        updateCart(newCart)
    }

    const increaseQuantity = (id) => {
        const newCart = cart.map(item =>
            item.id === id
                ? { ...item, quantity: item.quantity + 1 }
                : item
        )
        updateCart(newCart)
    }

    const decreaseQuantity = (id) => {
        const newCart = cart.map(item => {
            if (item.id === id) {
                if (item.quantity === 1) return null
                return { ...item, quantity: item.quantity - 1 }
            }
            return item
        }).filter(item => item !== null)
        updateCart(newCart)
    }

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const proceedToCheckout = () => {
        if (cart.length > 0) {
            navigate('/checkout')
        }
    }

    return (
        <div className="CartPage">
            <div className="cart-header">
                <Link to="/" className="back-btn">← Orqaga</Link>
            </div>

            <div className="cart-content">
                {cart.length === 0 ? (
                    <div className="empty-cart">
                        <p>Savat bo'sh</p>
                        <span><i class="fa-solid fa-burger"></i></span>
                        <Link to="/" className="shop-btn">Mahsulotlar</Link>
                    </div>
                ) : (
                    <>
                        <div className="cart-items-list">
                            {cart.map((item) => (
                                <div key={item.id} className="cart-item">
                                    <img src={item.img} alt={item.name} />
                                    <div className="item-details">
                                        <h3>{item.name}</h3>
                                        <p className="item-price">{item.price.toLocaleString()} so'm</p>
                                    </div>
                                    <div className="item-quantity">
                                        <button onClick={() => decreaseQuantity(item.id)}>-</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => increaseQuantity(item.id)}>+</button>
                                    </div>
                                    <div className="item-total">
                                        {(item.price * item.quantity).toLocaleString()} so'm
                                    </div>
                                    <button className="remove-item" onClick={() => removeFromCart(item.id)}>
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="cart-summary">
                            <div className="summary-row">
                                <span>Umumiy:</span>
                                <strong>{totalPrice.toLocaleString()} so'm</strong>
                            </div>
                            <button className="checkout-btn" onClick={proceedToCheckout}>
                                Rasmiylashtirish →
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Cart