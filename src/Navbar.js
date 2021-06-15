import { NavLink } from 'react-router-dom';

const Navbar = () => {
  return ( 
    <nav className="navbar">
      <h1>SingleEntry React</h1>
      <div className="links">
        <NavLink activeClassName="selected" exact to="/">Home</NavLink>
        <NavLink activeClassName="selected" to="/Status">Status</NavLink>
      </div>
    </nav>
   );
}
 
export default Navbar;