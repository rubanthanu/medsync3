import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import logo from '../../assets/logo.png';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ full_name: '', email: '', password: '', confirm_password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (formData.password !== formData.confirm_password) {
            return setError('Passwords do not match');
        }

        setLoading(true);
        try {
            await api.post('/auth/register', formData);
            navigate('/verify-otp', { state: { email: formData.email } });
        } catch (err) {
            if (err.response?.data?.requires_verification) {
                navigate('/verify-otp', { state: { email: formData.email } });
            } else {
                setError(err.response?.data?.message || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="row justify-content-center animate-fade-in mt-4">
            <div className="col-md-5">
                <div className="card p-5">
                    <div className="text-center mb-4">
                        <img src={logo} alt="UWU MedSync Logo" height="80" className="mb-3" />
                        <h2 className="fw-bold text-primary">Create Account</h2>
                        <p className="text-muted">Register for UWU MedSync using your University Email</p>
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Full Name</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                value={formData.full_name}
                                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">University Email</label>
                            <input 
                                type="email" 
                                className="form-control" 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                pattern=".*@(std\.)?uwu\.ac\.lk$"
                                title="Please enter a valid @std.uwu.ac.lk or @uwu.ac.lk email address"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Password</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="form-label fw-semibold">Confirm Password</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                value={formData.confirm_password}
                                onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100 py-2 rounded-pill mb-3" disabled={loading}>
                            {loading ? 'Registering...' : 'Register Account'}
                        </button>
                        <div className="text-center">
                            <span className="text-muted">Already have an account? </span>
                            <Link to="/login" className="text-primary text-decoration-none fw-semibold">Login here</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default Register;
