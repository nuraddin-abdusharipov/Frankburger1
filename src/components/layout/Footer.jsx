import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'

function Footer() {
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const updateCartCount = () => {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        const cart = JSON.parse(savedCart)
        const count = cart.reduce((sum, item) => sum + item.quantity, 0)
        setCartCount(count)
      }
    }

    updateCartCount()
    
    window.addEventListener('storage', updateCartCount)
    
    const handleCartUpdate = () => updateCartCount()
    window.addEventListener('cartUpdated', handleCartUpdate)
    
    return () => {
      window.removeEventListener('storage', updateCartCount)
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [])

  const styles = {
    footer: {
      display: "flex",
      width: "100%",
      maxWidth: "400px",
      height: "10%",
      background: "rgba(20, 20, 35, 0.95)",
      backdropFilter: "blur(20px)",
      borderRadius: "30px 30px 0 0",
      alignItems: "center",
      justifyContent: "space-evenly",
      borderTop: "1px solid rgba(255, 107, 53, 0.2)",
      boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3)",
      position: "relative",
      zIndex: 100,
    },
    navlink: {
      textDecoration: "none",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "5px",
      width: "65px",
      height: "55px",
      borderRadius: "20px",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",
    },
    icon: {
      fontSize: "22px",
      transition: "all 0.3s ease",
    },
    label: {
      fontSize: "11px",
      fontWeight: "500",
      transition: "all 0.3s ease",
    },
    badge: {
      position: "absolute",
      top: "-5px",
      right: "5px",
      background: "linear-gradient(135deg, #ff6b35, #ff3b00)",
      color: "white",
      fontSize: "10px",
      fontWeight: "bold",
      padding: "2px 6px",
      borderRadius: "20px",
      minWidth: "18px",
      textAlign: "center",
      boxShadow: "0 2px 8px rgba(255, 107, 53, 0.4)",
      animation: "pulse 1.5s infinite",
    }
  }

  return (
    <div style={styles.footer}>
      <NavLink
        to="/"
        style={({ isActive }) => ({
          ...styles.navlink,
          background: isActive ? "rgba(255, 107, 53, 0.15)" : "transparent",
          transform: isActive ? "translateY(-3px)" : "translateY(0)",
        })}
      >
        {({ isActive }) => (
          <>
            <i 
              className="fa-solid fa-house" 
              style={{
                ...styles.icon,
                color: isActive ? "#ff6b35" : "#888",
                textShadow: isActive ? "0 0 10px rgba(255, 107, 53, 0.5)" : "none",
              }}
            ></i>
            <span 
              style={{
                ...styles.label,
                color: isActive ? "#ff6b35" : "#888",
              }}
            >
              Bosh sahifa
            </span>
            {isActive && (
              <div style={{
                position: "absolute",
                bottom: "-2px",
                width: "30px",
                height: "3px",
                background: "linear-gradient(90deg, #ff6b35, #ff3b00)",
                borderRadius: "3px",
              }} />
            )}
          </>
        )}
      </NavLink>

      <NavLink
        to="/cart"
        style={({ isActive }) => ({
          ...styles.navlink,
          background: isActive ? "rgba(255, 107, 53, 0.15)" : "transparent",
          transform: isActive ? "translateY(-3px)" : "translateY(0)",
        })}
      >
        {({ isActive }) => (
          <>
            <div style={{ position: "relative" }}>
              <i 
                className="fa-solid fa-cart-shopping" 
                style={{
                  ...styles.icon,
                  color: isActive ? "#ff6b35" : "#888",
                  textShadow: isActive ? "0 0 10px rgba(255, 107, 53, 0.5)" : "none",
                }}
              ></i>
              {cartCount > 0 && (
                <span style={styles.badge}>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <span 
              style={{
                ...styles.label,
                color: isActive ? "#ff6b35" : "#888",
              }}
            >
              Savat
            </span>
            {isActive && (
              <div style={{
                position: "absolute",
                bottom: "-2px",
                width: "30px",
                height: "3px",
                background: "linear-gradient(90deg, #ff6b35, #ff3b00)",
                borderRadius: "3px",
              }} />
            )}
          </>
        )}
      </NavLink>

      <NavLink
        to="/orders"
        style={({ isActive }) => ({
          ...styles.navlink,
          background: isActive ? "rgba(255, 107, 53, 0.15)" : "transparent",
          transform: isActive ? "translateY(-3px)" : "translateY(0)",
        })}
      >
        {({ isActive }) => (
          <>
            <i 
              className="fa-solid fa-clipboard-list" 
              style={{
                ...styles.icon,
                color: isActive ? "#ff6b35" : "#888",
                textShadow: isActive ? "0 0 10px rgba(255, 107, 53, 0.5)" : "none",
              }}
            ></i>
            <span 
              style={{
                ...styles.label,
                color: isActive ? "#ff6b35" : "#888",
              }}
            >
              Buyurtmalar
            </span>
            {isActive && (
              <div style={{
                position: "absolute",
                bottom: "-2px",
                width: "30px",
                height: "3px",
                background: "linear-gradient(90deg, #ff6b35, #ff3b00)",
                borderRadius: "3px",
              }} />
            )}
          </>
        )}
      </NavLink>

      <NavLink
        to="/profile"
        style={({ isActive }) => ({
          ...styles.navlink,
          background: isActive ? "rgba(255, 107, 53, 0.15)" : "transparent",
          transform: isActive ? "translateY(-3px)" : "translateY(0)",
        })}
      >
        {({ isActive }) => (
          <>
            <i 
              className="fa-solid fa-user" 
              style={{
                ...styles.icon,
                color: isActive ? "#ff6b35" : "#888",
                textShadow: isActive ? "0 0 10px rgba(255, 107, 53, 0.5)" : "none",
              }}
            ></i>
            <span 
              style={{
                ...styles.label,
                color: isActive ? "#ff6b35" : "#888",
              }}
            >
              Profil
            </span>
            {isActive && (
              <div style={{
                position: "absolute",
                bottom: "-2px",
                width: "30px",
                height: "3px",
                background: "linear-gradient(90deg, #ff6b35, #ff3b00)",
                borderRadius: "3px",
              }} />
            )}
          </>
        )}
      </NavLink>

      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes glow {
          0% {
            box-shadow: 0 0 5px rgba(255, 107, 53, 0.3);
          }
          100% {
            box-shadow: 0 0 15px rgba(255, 107, 53, 0.6);
          }
        }
      `}</style>
    </div>
  )
}

export default Footer