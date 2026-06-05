import { Link } from 'react-router-dom';

const Footer = () => {
    const handleNavClick = (id) => {
        if (window.location.pathname === '/') {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            window.location.href = `/#${id}`;
        }
    };

    return (
        <footer className="bg-dark text-white pt-5 pb-4 mt-5">
            <div className="container">
                <div className="row g-4 mb-4">
                    {/* Brand Info */}
                    <div className="col-lg-4 col-md-6">
                        <h4 className="fw-bold text-primary mb-3">UWU MedSync</h4>
                        <p className="text-white-50 mb-4">Smart University Healthcare Management System for Uva Wellassa University.</p>
                        <div className="d-flex gap-3 fs-5">
                            <a href="#" className="text-white-50 hover-primary"><i className="bi bi-facebook"></i></a>
                            <a href="#" className="text-white-50 hover-primary"><i className="bi bi-twitter-x"></i></a>
                            <a href="#" className="text-white-50 hover-primary"><i className="bi bi-instagram"></i></a>
                            <a href="#" className="text-white-50 hover-primary"><i className="bi bi-linkedin"></i></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="col-lg-2 col-md-6 col-6">
                        <h6 className="text-uppercase fw-bold mb-3 text-white">Quick Links</h6>
                        <ul className="list-unstyled d-flex flex-column gap-2 text-white-50">
                            <li><button className="btn btn-link p-0 text-white-50 text-decoration-none hover-primary align-start text-start" onClick={() => handleNavClick('home')}>Home</button></li>
                            <li><button className="btn btn-link p-0 text-white-50 text-decoration-none hover-primary align-start text-start" onClick={() => handleNavClick('about')}>About Us</button></li>
                            <li><button className="btn btn-link p-0 text-white-50 text-decoration-none hover-primary align-start text-start" onClick={() => handleNavClick('services')}>Services</button></li>
                            <li><button className="btn btn-link p-0 text-white-50 text-decoration-none hover-primary align-start text-start" onClick={() => handleNavClick('health-posts')}>Health Posts</button></li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div className="col-lg-3 col-md-6 col-6">
                        <h6 className="text-uppercase fw-bold mb-3 text-white">Services</h6>
                        <ul className="list-unstyled d-flex flex-column gap-2 text-white-50">
                            <li><span className="text-white-50">Appointments</span></li>
                            <li><span className="text-white-50">Queue Tracking</span></li>
                            <li><span className="text-white-50">E-Prescriptions</span></li>
                            <li><span className="text-white-50">Certificates</span></li>
                            <li><span className="text-white-50">Notifications</span></li>
                        </ul>
                    </div>

                    {/* Contact Info & Emergency */}
                    <div className="col-lg-3 col-md-6">
                        <h6 className="text-uppercase fw-bold mb-3 text-white">Emergency</h6>
                        <ul className="list-unstyled d-flex flex-column gap-2 text-white-50 mb-4">
                            <li><i className="bi bi-geo-alt me-2 text-danger"></i> Medical Center, Uva Wellassa University</li>
                            <li><i className="bi bi-telephone me-2 text-danger"></i> Emergency: +94 55 222 6801 (Ext: 123)</li>
                            <li><i className="bi bi-envelope me-2 text-primary"></i> uwumedsync@gmail.com</li>
                        </ul>
                        <div className="card border-danger bg-danger-subtle text-danger p-3 rounded-4" style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)', border: '1px solid rgba(220, 53, 69, 0.2)' }}>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <i className="bi bi-exclamation-triangle-fill text-danger fs-5"></i>
                                <span className="fw-bold text-uppercase small tracking-wide">Emergency</span>
                            </div>
                            <h5 className="fw-bold mb-0 text-danger">+94 55 222 9999</h5>
                        </div>
                    </div>
                </div>

                <hr className="border-secondary my-4" />

                <div className="text-center text-white-50 small">
                    <p className="mb-0">© {new Date().getFullYear()} UWU MedSync. All rights reserved. Uva Wellassa University Medical Center.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
