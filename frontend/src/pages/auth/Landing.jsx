import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import logo from '../../assets/logo.png';

const Landing = () => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await api.get('/healthpost/get_all');
                setPosts(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchPosts();

        // Handle direct url hash scroll
        if (window.location.hash) {
            const id = window.location.hash.replace('#', '');
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 300);
        }
    }, []);

    const getCategoryImage = (post) => {
        if (post.image_url) return post.image_url;
        const cat = post.category?.toLowerCase();
        if (cat === 'wellness') return 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80';
        if (cat === 'mental health') return 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80';
        if (cat === 'nutrition') return 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80';
        return 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80';
    };

    const getCategoryBadgeClass = (category) => {
        const cat = category?.toLowerCase();
        if (cat === 'wellness') return 'bg-success-subtle text-success';
        if (cat === 'mental health') return 'bg-primary-subtle text-primary';
        if (cat === 'nutrition') return 'bg-warning-subtle text-warning';
        return 'bg-secondary-subtle text-secondary';
    };

    return (
        <div className="container py-3 animate-fade-in" id="home">
            {/* Hero Section */}
            <div className="row align-items-center mb-5 min-vh-75 py-4">
                <div className="col-lg-6">
                    <img src={logo} alt="UWU MedSync Logo" height="60" className="mb-3" />
                    <span className="badge bg-primary-subtle text-primary mb-3 px-3 py-2 rounded-pill fw-semibold ms-2">Smart University Healthcare</span>
                    <h1 className="display-4 fw-bold text-dark mb-4 leading-tight">
                        UWU MedSync Portal
                    </h1>
                    <p className="lead text-muted mb-4 fs-5">
                        Book appointments, track live queues, access e-prescriptions, and manage your university healthcare digitally — all in one integrated, campus-wide smart system.
                    </p>
                    <div className="d-flex gap-3">
                        <Link to="/register" className="btn btn-primary btn-lg px-4 rounded-pill shadow-sm hover-grow">Get Started</Link>
                        <Link to="/login" className="btn btn-outline-secondary btn-lg px-4 rounded-pill hover-grow">Login to Portal</Link>
                    </div>
                </div>
                <div className="col-lg-6 mt-5 mt-lg-0 text-center position-relative">
                    
                    <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Medical Center" className="img-fluid rounded-4 shadow-lg border border-light" style={{ maxHeight: '420px', width: '100%', objectFit: 'cover' }} />
                </div>
            </div>

            {/* Services Quick Grid */}
            <div className="row g-4 py-5 text-center" id="services">
                <div className="col-lg-3 col-md-6">
                    <div className="card h-100 p-4 border-0 shadow-sm bg-white rounded-4 hover-grow">
                        <div className="icon-box bg-primary-subtle text-primary rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                            <i className="bi bi-calendar-event fs-4"></i>
                        </div>
                        <h3 className="h5 fw-bold text-dark mb-3">Smart Appointments</h3>
                        <p className="text-muted small">Book your convenient time slot without standing in long queues at the medical center.</p>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card h-100 p-4 border-0 shadow-sm bg-white rounded-4 hover-grow">
                        <div className="icon-box bg-success-subtle text-success rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                            <i className="bi bi-hourglass-split fs-4"></i>
                        </div>
                        <h3 className="h5 fw-bold text-dark mb-3">Live Queue Tracking</h3>
                        <p className="text-muted small">Track your exact position in the queue real-time from anywhere on campus.</p>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card h-100 p-4 border-0 shadow-sm bg-white rounded-4 hover-grow">
                        <div className="icon-box bg-warning-subtle text-warning rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                            <i className="bi bi-file-earmark-medical fs-4"></i>
                        </div>
                        <h3 className="h5 fw-bold text-dark mb-3">e-Prescriptions</h3>
                        <p className="text-muted small">Access your digital prescriptions and treatment records instantly as secure PDFs.</p>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card h-100 p-4 border-0 shadow-sm bg-white rounded-4 hover-grow">
                        <div className="icon-box bg-danger-subtle text-danger rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                            <i className="bi bi-patch-check fs-4"></i>
                        </div>
                        <h3 className="h5 fw-bold text-dark mb-3">Digital MC</h3>
                        <p className="text-muted small">Request and download verified digital medical certificates (MC) without physical visits.</p>
                    </div>
                </div>
            </div>

            {/* About Us Section */}
            <div className="row align-items-center py-5 my-5 border-top border-bottom" id="about">
                <div className="col-lg-6 mb-4 mb-lg-0">
                    <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="About MedSync" className="img-fluid rounded-4 shadow" style={{ maxHeight: '350px', width: '100%', objectFit: 'cover' }} />
                </div>
                <div className="col-lg-6 ps-lg-5">
                    <span className="badge bg-secondary-subtle text-secondary mb-3 px-3 py-2 rounded-pill fw-semibold">About UWU Medical</span>
                    <h2 className="fw-bold text-dark mb-3">Dedicated to Student Wellbeing</h2>
                    <p className="text-muted mb-4">
                        The Uva Wellassa University Medical Center provides high-quality healthcare services to our university community. With the launch of **UWU MedSync**, we are modernizing care delivery. Our digital portal bridges the gap between medical staff and students, minimizing wait times and ensuring health support is always within reach.
                    </p>
                    <div className="d-flex align-items-center gap-3 bg-light p-3 rounded-4 border-start border-primary border-4">
                        <i className="bi bi-clock-history text-primary fs-3"></i>
                        <div>
                            <h6 className="fw-bold mb-1">Standard Opening Hours</h6>
                            <p className="text-muted small mb-0">Monday – Friday: 8:00 AM – 5:00 PM</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Health Posts Section */}
            <div className="py-5" id="health-posts">
                <div className="text-center mb-5">
                    <span className="badge bg-info-subtle text-info px-3 py-2 rounded-pill mb-3 fw-semibold">Health Posts</span>
                    <h2 className="fw-bold text-dark">Latest Health Awareness</h2>
                    <p className="text-muted">Stay informed with health tips and wellness guidance from our medical team.</p>
                </div>

                {posts.length > 0 ? (
                    <div className="row g-4">
                        {posts.map(post => (
                            <div className="col-lg-4 col-md-6" key={post.post_id}>
                                <div className="card h-100 border-0 shadow-sm bg-white rounded-4 overflow-hidden hover-grow">
                                    <div className="position-relative" style={{ height: '200px', overflow: 'hidden' }}>
                                        <img src={getCategoryImage(post)} alt={post.title} className="w-100 h-100 object-fit-cover transition-transform" />
                                        <span className={`position-absolute top-0 start-0 m-3 badge rounded-pill px-3 py-2 shadow-sm fw-semibold ${getCategoryBadgeClass(post.category)}`}>
                                            {post.category || 'Wellness'}
                                        </span>
                                    </div>
                                    <div className="card-body p-4 d-flex flex-column">
                                        <h5 className="fw-bold text-dark mb-2 line-clamp-2">{post.title}</h5>
                                        <p className="text-muted small mb-4 flex-grow-1 line-clamp-3">{post.content}</p>
                                        <div className="mt-auto border-top pt-3 text-secondary small d-flex justify-content-between align-items-center">
                                            <span className="d-flex align-items-center gap-1">
                                                <i className="bi bi-person text-primary"></i> 
                                                <span className="fw-semibold">{post.author_name}</span>
                                            </span>
                                            <span><i className="bi bi-calendar3 me-1"></i> {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                        <i className="bi bi-journal-medical text-muted display-4"></i>
                        <p className="text-muted mt-3">No health posts available at the moment. Check back soon!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Landing;
