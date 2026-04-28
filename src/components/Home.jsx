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

    const categories = ["Barchasi", "Burger", "Pizza", "Hot Dog", "Ichimlik"]

    const allProductsList = [
        { id: 1, name: "Frank Burger", price: 55000, img: "https://d3af5evjz6cdzs.cloudfront.net/images/uploads/800x0/_92f500a1ab64dba500d217959650e0fd1704267708.jpg", category: "Burger" },
        { id: 2, name: "Big Burger", price: 45000, img: "https://www.osieurope.com/wp-content/uploads/2022/05/My-project-1.jpg", category: "Burger" },
        { id: 3, name: "Oddiy Burger", price: 35000, img: "https://www.eatingwell.com/thmb/UY5N-tQKYgA91XJBwiolc_1nbJ0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/3757723-7c4020ccc47240138323b9bc5b730e8d.jpg", category: "Burger" },

        { id: 4, name: "Katta Bola Pitsa 1", price: 75000, img: "https://cdn.foodpicasso.com/assets/0e/20/22/12/0e20221284bc94fd51a34540fb55b03c---png_1000x_103c0_convert.png", category: "Pizza" },
        { id: 5, name: "Katta Bola Pitsa 2", price: 90000, img: "https://cdn.foodpicasso.com/assets/0e/20/22/12/0e20221284bc94fd51a34540fb55b03c---png_1000x_103c0_convert.png", category: "Pizza" },
        { id: 6, name: "Go'shtli Pitsa 1", price: 75000, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeYxZEMX7Cjhsd3PnKCzS1Bb_ZBHOY7UyFhg&s", category: "Pizza" },
        { id: 7, name: "Go'shtli Pitsa 2", price: 90000, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeYxZEMX7Cjhsd3PnKCzS1Bb_ZBHOY7UyFhg&s", category: "Pizza" },
        { id: 8, name: "Margarita Pitsa", price: 65000, img: "https://adriano.com.ua/wp-content/uploads/2022/08/%D0%9C%D0%B0%D1%80%D0%B3%D0%B0%D1%80%D0%B8%D1%82%D0%B0.jpeg", category: "Pizza" },
        { id: 9, name: "Peperonli Pitsa", price: 65000, img: "https://cdn.foodpicasso.com/assets/59/ea/75/2d/59ea752dde4979f03c5db5165797f029---png_1000x_103c0_convert.png", category: "Pizza" },
        { id: 10, name: "Peperonli Pitsa", price: 75000, img: "https://cdn.foodpicasso.com/assets/59/ea/75/2d/59ea752dde4979f03c5db5165797f029---png_1000x_103c0_convert.png", category: "Pizza" },
        { id: 11, name: "Tovuqli Pitsa", price: 65000, img: "https://cdn.foodpicasso.com/assets/59/ea/75/2d/59ea752dde4979f03c5db5165797f029---png_1000x_103c0_convert.png", category: "Pizza" },
        { id: 12, name: "4 ta Sirli Pitsa", price: 55000, img: "https://cdn.zoomda.uz/products/2025/06/12/1749711559001138432.jpg", category: "Pizza" },
        { id: 13, name: "Choco Pitsa", price: 90000, img: "https://as1.ftcdn.net/jpg/07/30/10/74/1000_F_730107452_FeQTBf0dwrnTX9B7v1Uv9PkgeYhlRehm.jpg", category: "Pizza" },
        { id: 14, name: "Shaverma Pitsa", price: 60000, img: "https://moresushisverdlovo.ru/wp-content/uploads/2022/08/shaverma.jpg", category: "Pizza" },
        { id: 15, name: "Bif Kabob Pitsa 30 sm", price: 75000, img: "https://back.baxtrestoran.uz/storage/Product/61/image_path/693a735178da4_original.webp", category: "Pizza" },
        { id: 16, name: "Bif Kabob Pitsa 40 sm", price: 90000, img: "https://back.baxtrestoran.uz/storage/Product/61/image_path/693a735178da4_original.webp", category: "Pizza" },

        { id: 11, name: "Classic Hot Dog", price: 12000, img: "https://www.belbrandsfoodservice.com/wp-content/uploads/2018/05/recipe-desktop-merkts-cheesy-hot-dawg.jpg", category: "Hot Dog" },
        { id: 12, name: "Dvaynoy Hot Dog", price: 35000, img: "https://fairu.gusto.at/9f533c35-cbea-4ddb-b5e7-21732a2494f0/Hot+Dog.jpg?width=2560&height=1769&quality=90", category: "Hot Dog" },
        { id: 13, name: "Go'shtli Hot Dog", price: 35000, img: "https://back.baxtrestoran.uz/storage/Product/84/image_path/693d7babe9c74_original.webp", category: "Hot Dog" },
        { id: 14, name: "Sirli Hot Dog", price: 15000, img: "https://foodmetamorphosis.com/wp-content/uploads/2024/06/puerto-rican-hotdog.jpg", category: "Hot Dog" },
        { id: 15, name: "Achchiq Hot Dog", price: 18000, img: "https://www.belbrandsfoodservice.com/wp-content/uploads/2018/05/recipe-desktop-merkts-cheesy-hot-dawg.jpg", category: "Hot Dog" },

        { id: 16, name: "Coca Cola 1.5L", price: 22000, img: "https://images.uzum.uz/cd8gafrb3ho5lmur0lf0/original.jpg", category: "Ichimlik" },
        { id: 17, name: "Fanta 1.5L", price: 22000, img: "https://images.uzum.uz/cthuastht56qpot7dns0/original.jpg", category: "Ichimlik" },
        { id: 18, name: "Pepsi 1.5L", price: 22000, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhY3e-IlnDmsQZc7vkuvjE5g6sMl5m4d753Q&s", category: "Ichimlik" },
        { id: 19, name: "Suv 0.5L", price: 5000, img: "https://sawepecomcdn.blob.core.windows.net/kfc-web-ordering/KFC_RS/34_WoltIntegration/05_web_delivery_termekkepek/13_drinks/440x440/kfc_srb_still_water_05l_440x440.png", category: "Ichimlik" }
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