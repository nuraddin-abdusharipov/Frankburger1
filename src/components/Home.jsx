import './Home.css'
import { useRef, useState, useEffect } from "react"
import { Link } from 'react-router-dom'

function Home() {

    const barRef = useRef(null)
    let isDown = false
    let startX
    let scrollLeft
    let velocity = 0
    let raf

    const [activeCategory, setActiveCategory] = useState("Barchasi")
    const [cart, setCart] = useState([])

    // LocalStorage dan yuklash
    useEffect(() => {
        const savedCart = localStorage.getItem('cart')
        if (savedCart) {
            setCart(JSON.parse(savedCart))
        }
    }, [])

    // LocalStorage ga saqlash
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart))
    }, [cart])

    const categories = ["Barchasi", "Burger", "Pizza", "Hot Dog", "Drink", "Combo", "Dessert"]

    const allProductsList = [
        { id: 1, name: "Classic Burger", price: 25000, img: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?w=200&h=200&fit=crop", category: "Burger" },
        { id: 2, name: "Cheese Burger", price: 28000, img: "https://images.pexels.com/photos/1639559/pexels-photo-1639559.jpeg?w=200&h=200&fit=crop", category: "Burger" },
        { id: 3, name: "Double Burger", price: 35000, img: "https://images.pexels.com/photos/2983098/pexels-photo-2983098.jpeg?w=200&h=200&fit=crop", category: "Burger" },
        { id: 4, name: "Chicken Burger", price: 27000, img: "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?w=200&h=200&fit=crop", category: "Burger" },
        { id: 5, name: "Margherita", price: 32000, img: "https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?w=200&h=200&fit=crop", category: "Pizza" },
        { id: 6, name: "Pepperoni", price: 38000, img: "https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg?w=200&h=200&fit=crop", category: "Pizza" },
        { id: 7, name: "Hawaiian", price: 35000, img: "https://images.pexels.com/photos/1453690/pexels-photo-1453690.jpeg?w=200&h=200&fit=crop", category: "Pizza" },
        { id: 8, name: "Classic Hot Dog", price: 15000, img: "https://images.pexels.com/photos/1351239/pexels-photo-1351239.jpeg?w=200&h=200&fit=crop", category: "Hot Dog" },
        { id: 9, name: "Cheese Hot Dog", price: 18000, img: "https://images.pexels.com/photos/1757974/pexels-photo-1757974.jpeg?w=200&h=200&fit=crop", category: "Hot Dog" },
        { id: 10, name: "Coca Cola", price: 5000, img: "https://images.pexels.com/photos/50593/coca-cola-coke-soft-drink-coke-bottle-50593.jpeg?w=200&h=200&fit=crop", category: "Drink" },
        { id: 11, name: "Fanta", price: 5000, img: "https://images.pexels.com/photos/1556683/pexels-photo-1556683.jpeg?w=200&h=200&fit=crop", category: "Drink" },
        { id: 12, name: "Pepsi", price: 5000, img: "https://images.pexels.com/photos/1132537/pexels-photo-1132537.jpeg?w=200&h=200&fit=crop", category: "Drink" },
        { id: 13, name: "Water", price: 3000, img: "https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?w=200&h=200&fit=crop", category: "Drink" },
        { id: 14, name: "Burger + Cola", price: 28000, img: "https://images.pexels.com/photos/2602109/pexels-photo-2602109.jpeg?w=200&h=200&fit=crop", category: "Combo" },
        { id: 15, name: "Pizza + Cola", price: 35000, img: "https://images.pexels.com/photos/2990569/pexels-photo-2990569.jpeg?w=200&h=200&fit=crop", category: "Combo" },
        { id: 16, name: "Ice Cream", price: 8000, img: "https://images.pexels.com/photos/209040/pexels-photo-209040.jpeg?w=200&h=200&fit=crop", category: "Dessert" },
        { id: 17, name: "Brownie", price: 12000, img: "https://images.pexels.com/photos/2067421/pexels-photo-2067421.jpeg?w=200&h=200&fit=crop", category: "Dessert" }
    ]

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id)
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prevCart, { ...product, quantity: 1 }]
        })
    }

    const getFilteredProducts = () => {
        if (activeCategory === "Barchasi") {
            return allProductsList
        }
        return allProductsList.filter(product => product.category === activeCategory)
    }

    const filteredProducts = getFilteredProducts()

    const onMouseDown = (e) => {
        isDown = true
        startX = e.pageX
        scrollLeft = barRef.current.scrollLeft
        cancelAnimationFrame(raf)
        document.body.style.userSelect = 'none'
    }

    const onMouseMove = (e) => {
        if (!isDown) return
        const x = e.pageX
        const walk = x - startX
        barRef.current.scrollLeft = scrollLeft - walk
        velocity = walk
    }

    const onMouseUp = () => {
        if (!isDown) return
        isDown = false
        document.body.style.userSelect = ''
        startInertia()
    }

    const startInertia = () => {
        const decay = 0.92
        const minVelocity = 0.1

        const animate = () => {
            velocity *= decay
            barRef.current.scrollLeft -= velocity
            if (Math.abs(velocity) > minVelocity) {
                raf = requestAnimationFrame(animate)
            }
        }
        animate()
    }

    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

    return (
        <div className="Home">
            <nav className='nav'>
                <img src="/logo.png" alt="Logo" />
                <h2>Frank Burger</h2>
            </nav>

            <div 
                className="bar"
                ref={barRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            >
                {categories.map((cat) => (
                    <div 
                        key={cat}
                        className={`item ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </div>
                ))}
            </div>

            <div className="products-container">
                <div className="products-grid">
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="product-card">
                            <div className="product-img">
                                <img src={product.img} alt={product.name} />
                            </div>
                            <div className="product-info">
                                <h3>{product.name}</h3>
                                <p className="price">{product.price.toLocaleString()} so'm</p>
                                <button 
                                    className="add-btn"
                                    onClick={() => {
                                        addToCart(product)
                                        alert(`${product.name} savatga qo'shildi!`)
                                    }}
                                >
                                    + Savatga qo'shish
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Home