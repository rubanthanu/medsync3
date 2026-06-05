import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const OTP = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;
    
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    if (!email) {
        navigate('/login');
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            await api.post('/auth/verify_otp', { email, otp });
            navigate('/login', { state: { message: 'Account verified successfully. Please login.' } });
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setMessage('');
        setResendLoading(true);
        try {
            await api.post('/auth/resend_otp', { email, type: 'Registration' });
            setMessage('A new OTP has been sent to your email.');
            setTimer(30); // 30 seconds cooldown
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="row justify-content-center animate-fade-in mt-5">
            <div className="col-md-5">
                <div className="card p-5 text-center shadow-sm border-0">
                    <div className="mb-4">
                        <div className="bg-primary-subtle rounded-circle d-inline-flex p-3 mb-3">
                            <i className="bi bi-envelope-check text-primary fs-2"></i>
                        </div>
                        <h2 className="fw-bold text-dark">Verify Email</h2>
                        <p className="text-muted">We've sent a verification code to<br/><strong>{email}</strong></p>
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                    {message && <div className="alert alert-success">{message}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <input 
                                type="text" 
                                className="form-control form-control-lg text-center fw-bold" 
                                placeholder="000000"
                                value={otp}
                                maxLength="6"
                                onChange={(e) => setOtp(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100 py-2 rounded-pill mb-3" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Account'}
                        </button>
                    </form>
                    <div className="mt-2">
                        <p className="text-muted mb-0">Didn't receive the code?</p>
                        <button 
                            className="btn btn-link text-primary text-decoration-none fw-bold" 
                            onClick={handleResend} 
                            disabled={resendLoading || timer > 0}
                        >
                            {resendLoading ? 'Sending...' : timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default OTP;
