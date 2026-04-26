import { NavLink } from 'react-router-dom'

function Footer() {

  const styles = {
    navlink: {
      textDecoration: "none",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "50px",
      height: "50px",
    }
  }

  return (
    <div style={{
      display: "flex",
      width: "100%",
      maxWidth: "400px",
      height: "10%",
      backgroundColor: "rgb(25, 25, 25)",
      borderRadius: "25px 25px 0 0",
      alignItems: "center",
      justifyContent: "space-evenly"
    }}>

      <NavLink
        to="/"
        style={({ isActive }) => ({
          ...styles.navlink,
          color: isActive ? "orangered" : "white"
        })}
      >
        <i class="fa-solid fa-house"></i> Uy
      </NavLink>

      <NavLink
        to="/cart"
        style={({ isActive }) => ({
          ...styles.navlink,
          color: isActive ? "orangered" : "white"
        })}
      >
        <i class="fa-solid fa-cart-arrow-down"></i> Savat
      </NavLink>

      <NavLink
        to="/orders"
        style={({ isActive }) => ({
          ...styles.navlink,
          color: isActive ? "orangered" : "white"
        })}
      >
        <i class="fa-solid fa-list"></i> Buyurtma
      </NavLink>

      <NavLink
        to="/profile"
        style={({ isActive }) => ({
          ...styles.navlink,
          color: isActive ? "orangered" : "white"
        })}
      >
        <i class="fa-solid fa-user"></i> Profil
      </NavLink> 

    </div>
  )
}

export default Footer