import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/forgot_password', { email });
            navigate('/reset-password', { state: { email } });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="row justify-content-center animate-fade-in mt-5">
            <div className="col-md-5">
                <div className="card p-5">
                    <div className="text-center mb-4">
                        <div className="bg-primary-subtle rounded-circle d-inline-flex p-3 mb-3">
                            <i className="bi bi-shield-lock text-primary fs-2"></i>
                        </div>
                        <h2 className="fw-bold text-dark">Forgot Password?</h2>
                        <p className="text-muted">Enter your email and we'll send you an OTP to reset your password.</p>
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="form-label fw-semibold">Email address</label>
                            <input 
                                type="email" 
                                className="form-control" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100 py-2 rounded-pill mb-3" disabled={loading}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                        <div className="text-center">
                            <Link to="/login" className="text-primary text-decoration-none fw-semibold">Back to Login</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;