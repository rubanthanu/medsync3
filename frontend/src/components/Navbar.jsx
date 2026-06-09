import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import logo from '../assets/logo.png';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleNavClick = (id) => {
        if (window.location.pathname === '/') {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate(`/#${id}`);
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light sticky-top">
            <div className="container">
                <Link className="navbar-brand d-flex align-items-center fw-bold text-primary" to="/" onClick={() => handleNavClick('home')}>
                    <img src={logo} alt="UWU MedSync Logo" height="40" className="me-2" />
                    <span>UWU MedSync</span>
                </Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        {!user && (
                            <>
                                <li className="nav-item">
                                    <button className="nav-link btn btn-link text-decoration-none border-0" onClick={() => handleNavClick('home')}>Home</button>
                                </li>
                                <li className="nav-item">
                                    <button className="nav-link btn btn-link text-decoration-none border-0" onClick={() => handleNavClick('about')}>About</button>
                                </li>
                                <li className="nav-item">
                                    <button className="nav-link btn btn-link text-decoration-none border-0" onClick={() => handleNavClick('health-posts')}>Health Posts</button>
                                </li>
                            </>
                        )}
                        {user && user.role === 'Patient' && (
                            <>
                                <li className="nav-item"><Link className="nav-link" to="/patient/dashboard">Dashboard</Link></li>
                                <li className="nav-item"><Link className="nav-link" to="/patient/book">Book Appointment</Link></li>
                                <li className="nav-item"><Link className="nav-link" to="/patient/queue">Live Queue</Link></li>
                                <li className="nav-item"><Link className="nav-link" to="/patient/certificates">Certificates</Link></li>
                                <li className="nav-item"><Link className="nav-link" to="/profile">Profile</Link></li>
                            </>
                        )}
                        {user && user.role === 'Doctor' && (
                            <>
                                <li className="nav-item"><Link className="nav-link" to="/doctor/dashboard">Dashboard</Link></li>
                                <li className="nav-item"><Link className="nav-link" to="/profile">Profile</Link></li>
                            </>
                        )}
                        {user && user.role === 'Receptionist' && (
                            <>
                                <li className="nav-item"><Link className="nav-link" to="/receptionist/dashboard">Dashboard</Link></li>
                                <li className="nav-item"><Link className="nav-link" to="/profile">Profile</Link></li>
                            </>
                        )}
                        {user && user.role === 'Admin' && (
                            <>
                                <li className="nav-item"><Link className="nav-link" to="/admin/dashboard">Dashboard</Link></li>
                                <li className="nav-item"><Link className="nav-link" to="/profile">Profile</Link></li>
                            </>
                        )}
                    </ul>
                    <ul className="navbar-nav ms-auto">
                        {user ? (
                            <li className="nav-item dropdown">
                                <a className="nav-link dropdown-toggle fw-semibold d-flex align-items-center gap-2" href="#" role="button" data-bs-toggle="dropdown">
                                    {user.profile_image ? (
                                        <img 
                                            src={`http://localhost/medsync3/uwu-medsync-api/${user.profile_image}?t=${Date.now()}`} 
                                            alt={user.full_name} 
                                            className="rounded-circle object-fit-cover shadow-sm"
                                            style={{ width: '35px', height: '35px', border: '1px solid #dee2e6' }}
                                        />
                                    ) : (
                                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '35px', height: '35px', fontSize: '13px' }}>
                                            {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                                        </div>
                                    )}
                                    <span>{user.full_name} <small className="text-muted d-none d-md-inline" style={{ fontSize: '0.8em' }}>({user.role})</small></span>
                                </a>
                                <ul className="dropdown-menu dropdown-menu-end border-0 shadow-sm mt-2">
                                    <li><Link className="dropdown-item" to="/profile">My Profile</Link></li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button></li>
                                </ul>
                            </li>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className="btn btn-outline-primary me-2 px-4 rounded-pill" to="/login">Login</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="btn btn-primary px-4 rounded-pill" to="/register">Register</Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};
export default Navbar;
