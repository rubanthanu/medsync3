import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';

const CompleteProfile = () => {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        university_id: '',
        blood_group: '',
        allergies: '',
        medical_conditions: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        gender: '',
        date_of_birth: '',
        address: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/user/complete_profile', formData);
            // Update user context
            const updatedUser = { ...user, profile_completed: true };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            navigate('/patient/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="row justify-content-center animate-fade-in mt-4 mb-5">
            <div className="col-md-8">
                <div className="card p-5 border-0 shadow-sm">
                    <div className="mb-4 text-center">
                        <h2 className="fw-bold text-primary">Complete Your Profile</h2>
                        <p className="text-muted">Please provide your medical information to continue using UWU MedSync.</p>
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <h5 className="text-secondary mb-3 border-bottom pb-2">Personal Information</h5>
                        <div className="row mb-4">
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-semibold">University ID</label>
                                <input type="text" className="form-control" value={formData.university_id} onChange={e => setFormData({...formData, university_id: e.target.value})} required />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-semibold">Phone Number</label>
                                <input 
                                    type="tel" 
                                    className="form-control" 
                                    value={formData.phone} 
                                    onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^0-9+ ]/g, '')})} 
                                    placeholder="+94 77 123 4567"
                                    required 
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-semibold">Gender</label>
                                <select className="form-select form-control" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} required>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-semibold">Date of Birth</label>
                                <input type="date" className="form-control" value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} required />
                            </div>
                            <div className="col-12 mb-3">
                                <label className="form-label fw-semibold">Address</label>
                                <textarea className="form-control" rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required></textarea>
                            </div>
                        </div>

                        <h5 className="text-secondary mb-3 border-bottom pb-2">Medical Information</h5>
                        <div className="row mb-4">
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-semibold">Blood Group</label>
                                <select className="form-select form-control" value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})} required>
                                    <option value="">Select Blood Group</option>
                                    <option value="A+">A+</option><option value="A-">A-</option>
                                    <option value="B+">B+</option><option value="B-">B-</option>
                                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                    <option value="O+">O+</option><option value="O-">O-</option>
                                </select>
                            </div>
                            <div className="col-12 mb-3">
                                <label className="form-label fw-semibold">Allergies (if any)</label>
                                <textarea className="form-control" rows="2" value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})}></textarea>
                            </div>
                            <div className="col-12 mb-3">
                                <label className="form-label fw-semibold">Medical Conditions</label>
                                <textarea className="form-control" rows="2" value={formData.medical_conditions} onChange={e => setFormData({...formData, medical_conditions: e.target.value})}></textarea>
                            </div>
                        </div>

                        <h5 className="text-secondary mb-3 border-bottom pb-2">Emergency Contact</h5>
                        <div className="row mb-4">
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-semibold">Contact Name</label>
                                <input type="text" className="form-control" value={formData.emergency_contact_name} onChange={e => setFormData({...formData, emergency_contact_name: e.target.value})} required />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-semibold">Contact Phone</label>
                                <input 
                                    type="tel" 
                                    className="form-control" 
                                    value={formData.emergency_contact_phone} 
                                    onChange={e => setFormData({...formData, emergency_contact_phone: e.target.value.replace(/[^0-9+ ]/g, '')})} 
                                    placeholder="+94 77 123 4567"
                                    required 
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-100 py-3 rounded-pill fw-bold" disabled={loading}>
                            {loading ? 'Saving Profile...' : 'Complete Profile'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default CompleteProfile;
