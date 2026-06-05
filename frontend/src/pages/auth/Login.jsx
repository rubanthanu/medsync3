import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import logo from '../../assets/logo.png';

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(formData.email, formData.password);
            navigate(`/${data.user.role.toLowerCase()}/dashboard`);
        } catch (err) {
            if (err.response?.data?.requires_verification) {
                navigate('/verify-otp', { state: { email: formData.email } });
            } else {
                setError(err.response?.data?.message || 'Login failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="row justify-content-center animate-fade-in mt-5">
            <div className="col-md-5">
                <div className="card p-5">
                    <div className="text-center mb-4">
                        <img src={logo} alt="UWU MedSync Logo" height="80" className="mb-3" />
                        <h2 className="fw-bold text-primary">Welcome Back</h2>
                        <p className="text-muted">Login to your UWU MedSync account</p>
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Email address</label>
                            <input 
                                type="email" 
                                className="form-control" 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <div className="d-flex justify-content-between mb-1">
                                <label className="form-label fw-semibold mb-0">Password</label>
                                <Link to="/forgot-password" size="sm" className="text-primary text-decoration-none small">Forgot password?</Link>
                            </div>
                            <input 
                                type="password" 
                                className="form-control" 
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100 py-2 rounded-pill mb-3" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                        <div className="text-center">
                            <span className="text-muted">Don't have an account? </span>
                            <Link to="/register" className="text-primary text-decoration-none fw-semibold">Register here</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default Login;
