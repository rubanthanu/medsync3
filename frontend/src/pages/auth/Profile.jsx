import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';

const Profile = () => {
    const { user, setUser } = useContext(AuthContext); // Use setUser to update current user state
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const [profileImageFile, setProfileImageFile] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState('');
    const [sigFile, setSigFile] = useState(null);
    const [sigPreview, setSigPreview] = useState('');

    const fileInputRef = useRef(null);
    const sigInputRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/user/get_profile');
                setProfile(res.data);
                
                // Sync AuthContext if needed (e.g. on fresh visit after someone else changed it)
                if (res.data.profile_image !== user.profile_image || res.data.full_name !== user.full_name) {
                    setUser({
                        ...user,
                        full_name: res.data.full_name,
                        profile_image: res.data.profile_image
                    });
                }

                if (res.data.profile_image) {
                    setProfileImagePreview(`http://localhost/medsync3/uwu-medsync-api/${res.data.profile_image}`);
                }
                if (res.data.digital_signature) {
                    setSigPreview(`http://localhost/medsync3/uwu-medsync-api/${res.data.digital_signature}`);
                }
            } catch (err) {
                console.error(err);
                setErrorMsg('Failed to load profile details.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImageFile(file);
            setProfileImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSigChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSigFile(file);
            setSigPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            const formData = new FormData();
            // Append all profile state fields
            Object.keys(profile).forEach(key => {
                if (profile[key] !== null && profile[key] !== undefined) {
                    formData.append(key, profile[key]);
                }
            });

            // Role specific fields custom handling if missing
            if (user.role === 'Patient') {
                formData.append('university_id', profile.university_id || '');
                formData.append('blood_group', profile.blood_group || '');
                formData.append('allergies', profile.allergies || '');
                formData.append('medical_conditions', profile.medical_conditions || '');
                formData.append('emergency_contact_name', profile.emergency_contact_name || '');
                formData.append('emergency_contact_phone', profile.emergency_contact_phone || '');
            } else if (user.role === 'Doctor') {
                formData.append('specialization', profile.specialization || '');
            }

            // Append files if selected
            if (profileImageFile) {
                formData.append('profile_image', profileImageFile);
            }
            if (sigFile) {
                formData.append('digital_signature', sigFile);
            }

            const res = await api.post('/user/update_profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSuccessMsg(res.data.message || 'Profile updated successfully!');
            
            // Proactively update user session details in frontend if name / image changed
            if (res.data.full_name) {
                const updatedUser = { 
                    ...user, 
                    full_name: res.data.full_name,
                    profile_image: res.data.profile_image 
                };
                // Update context
                if (setUser) {
                    setUser(updatedUser);
                }
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordSuccess('');
        setPasswordError('');

        if (passwordData.new_password !== passwordData.confirm_password) {
            setPasswordError('New passwords do not match');
            return;
        }

        setChangingPassword(true);
        try {
            const res = await api.post('/auth/change_password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            setPasswordSuccess(res.data.message);
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading Profile...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4 animate-fade-in" style={{ maxWidth: '900px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-0">My Profile</h2>
                    <small className="text-primary">Manage your account details and credentials</small>
                </div>
            </div>

            {successMsg && (
                <div className="alert alert-success alert-dismissible fade show rounded-4 d-flex align-items-center gap-2 mb-4 shadow-sm" role="alert">
                    <i className="bi bi-check-circle-fill"></i>
                    <div>{successMsg}</div>
                    <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
                </div>
            )}

            {errorMsg && (
                <div className="alert alert-danger alert-dismissible fade show rounded-4 d-flex align-items-center gap-2 mb-4 shadow-sm" role="alert">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <div>{errorMsg}</div>
                    <button type="button" className="btn-close" onClick={() => setErrorMsg('')}></button>
                </div>
            )}

            <form onSubmit={handleSaveProfile} className="needs-validation">
                {/* Profile Header Card */}
                <div className="card border-0 shadow-sm bg-white p-4 rounded-4 mb-4">
                    <div className="d-flex align-items-center gap-4">
                        {/* Avatar Picker */}
                        <div className="position-relative">
                            {profileImagePreview ? (
                                <img src={profileImagePreview} alt={profile.full_name} className="rounded-circle object-fit-cover shadow-sm" style={{ width: '100px', height: '100px' }} />
                            ) : (
                                <div className="bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-2 rounded-circle shadow-sm" style={{ width: '100px', height: '100px' }}>
                                    {getInitials(profile?.full_name)}
                                </div>
                            )}
                            <button 
                                type="button" 
                                className="position-absolute bottom-0 end-0 d-flex align-items-center justify-content-center bg-primary text-white rounded-circle shadow-sm" 
                                onClick={() => fileInputRef.current?.click()} 
                                style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    border: '2px solid white',
                                    cursor: 'pointer',
                                    padding: '0',
                                    zIndex: 10
                                }}
                            >
                                <i className="bi bi-pencil-fill" style={{ fontSize: '14px' }}></i>
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleProfileImageChange} accept="image/*" className="d-none" />
                        </div>
                        
                        <div>
                            <h4 className="fw-bold text-dark mb-1">{profile?.full_name || 'User Name'}</h4>
                            <p className="text-muted mb-2">{profile?.email}</p>
                            <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 fw-semibold">{user?.role}</span>
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="card border-0 shadow-sm bg-white p-4 rounded-4 mb-4">
                    <h5 className="fw-bold text-dark mb-4 border-bottom pb-2">Personal Information</h5>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-semibold text-secondary small">FULL NAME</label>
                            <input type="text" className="form-control rounded-pill px-3" value={profile?.full_name || ''} onChange={e => setProfile({...profile, full_name: e.target.value})} required />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold text-secondary small">EMAIL (READ-ONLY)</label>
                            <input type="email" className="form-control rounded-pill px-3 bg-light" value={profile?.email || ''} readOnly />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold text-secondary small">PHONE (10 digits)</label>
                            <input 
                                type="tel" 
                                className="form-control rounded-pill px-3" 
                                value={profile?.phone || ''} 
                                onChange={e => setProfile({...profile, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10)})} 
                                placeholder="7712345678"
                                maxLength="10"
                            />
                            {profile?.phone && profile.phone.length < 10 && <small className="text-danger d-block mt-1">Phone must be 10 digits</small>}
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold text-secondary small">DATE OF BIRTH</label>
                            <input type="date" className="form-control rounded-pill px-3" value={profile?.date_of_birth || ''} onChange={e => setProfile({...profile, date_of_birth: e.target.value})} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold text-secondary small">GENDER</label>
                            <select className="form-select rounded-pill px-3" value={profile?.gender || ''} onChange={e => setProfile({...profile, gender: e.target.value})}>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="col-12">
                            <label className="form-label fw-semibold text-secondary small">ADDRESS</label>
                            <textarea className="form-control rounded-4 p-3" rows="3" value={profile?.address || ''} onChange={e => setProfile({...profile, address: e.target.value})} placeholder="123, Main Street, Colombo, Sri Lanka"></textarea>
                        </div>
                    </div>
                </div>

                {/* Medical Information (Patient Only) */}
                {user?.role === 'Patient' && (
                    <div className="card border-0 shadow-sm bg-white p-4 rounded-4 mb-4">
                        <h5 className="fw-bold text-dark mb-4 border-bottom pb-2">Medical Information</h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold text-secondary small">UNIVERSITY ID</label>
                                <input type="text" className="form-control rounded-pill px-3" value={profile?.university_id || ''} onChange={e => setProfile({...profile, university_id: e.target.value})} placeholder="UWU/STD/21/001" required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-semibold text-secondary small">BLOOD GROUP</label>
                                <select className="form-select rounded-pill px-3" value={profile?.blood_group || ''} onChange={e => setProfile({...profile, blood_group: e.target.value})}>
                                    <option value="">Select Blood Group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-semibold text-secondary small">EMERGENCY CONTACT NAME</label>
                                <input type="text" className="form-control rounded-pill px-3" value={profile?.emergency_contact_name || ''} onChange={e => setProfile({...profile, emergency_contact_name: e.target.value})} required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-semibold text-secondary small">EMERGENCY CONTACT PHONE (10 digits)</label>
                                <input 
                                    type="tel" 
                                    className="form-control rounded-pill px-3" 
                                    value={profile?.emergency_contact_phone || ''} 
                                    onChange={e => setProfile({...profile, emergency_contact_phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10)})} 
                                    placeholder="7712345678"
                                    maxLength="10"
                                    required 
                                />
                                {profile?.emergency_contact_phone && profile.emergency_contact_phone.length < 10 && <small className="text-danger d-block mt-1">Phone must be 10 digits</small>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-semibold text-secondary small">ALLERGIES</label>
                                <textarea className="form-control rounded-4 p-3" rows="2" value={profile?.allergies || ''} onChange={e => setProfile({...profile, allergies: e.target.value})} placeholder="e.g. Penicillin, Pollen, Peanuts (or 'None')"></textarea>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-semibold text-secondary small">MEDICAL CONDITIONS</label>
                                <textarea className="form-control rounded-4 p-3" rows="2" value={profile?.medical_conditions || ''} onChange={e => setProfile({...profile, medical_conditions: e.target.value})} placeholder="e.g. Asthma, Hypertension (or 'None')"></textarea>
                            </div>
                        </div>
                    </div>
                )}

                {/* Professional Information (Doctor Only) */}
                {user?.role === 'Doctor' && (
                    <div className="card border-0 shadow-sm bg-white p-4 rounded-4 mb-4">
                        <h5 className="fw-bold text-dark mb-4 border-bottom pb-2">Professional Information</h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold text-secondary small">SPECIALIZATION</label>
                                <input type="text" className="form-control rounded-pill px-3" value={profile?.specialization || ''} onChange={e => setProfile({...profile, specialization: e.target.value})} placeholder="e.g. General Physician, Cardiologist" required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-semibold text-secondary small">DIGITAL SIGNATURE</label>
                                <div className="d-flex align-items-center gap-3">
                                    {sigPreview && (
                                        <img src={sigPreview} alt="Signature Preview" className="border rounded bg-light p-1" style={{ height: '50px', maxWidth: '150px', objectFit: 'contain' }} />
                                    )}
                                    <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={() => sigInputRef.current?.click()}>
                                        Upload Signature Image
                                    </button>
                                    <input type="file" ref={sigInputRef} onChange={handleSigChange} accept="image/*" className="d-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit button */}
                <div className="text-end mb-5">
                    <button type="submit" className="btn btn-primary btn-lg rounded-pill px-5 shadow-sm" disabled={saving}>
                        {saving ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Saving Changes...
                            </>
                        ) : (
                            'Save Profile'
                        )}
                    </button>
                </div>
            </form>

            {/* Change Password Section */}
            <div className="card border-0 shadow-sm bg-white p-4 rounded-4 mb-5">
                <h5 className="fw-bold text-dark mb-4 border-bottom pb-2">Change Password</h5>
                
                {passwordSuccess && (
                    <div className="alert alert-success alert-dismissible fade show rounded-4 d-flex align-items-center gap-2 mb-4" role="alert">
                        <i className="bi bi-check-circle-fill"></i>
                        <div>{passwordSuccess}</div>
                        <button type="button" className="btn-close" onClick={() => setPasswordSuccess('')}></button>
                    </div>
                )}

                {passwordError && (
                    <div className="alert alert-danger alert-dismissible fade show rounded-4 d-flex align-items-center gap-2 mb-4" role="alert">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        <div>{passwordError}</div>
                        <button type="button" className="btn-close" onClick={() => setPasswordError('')}></button>
                    </div>
                )}

                <form onSubmit={handleChangePassword}>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label fw-semibold text-secondary small">CURRENT PASSWORD</label>
                            <input 
                                type="password" 
                                className="form-control rounded-pill px-3" 
                                value={passwordData.current_password}
                                onChange={e => setPasswordData({...passwordData, current_password: e.target.value})}
                                required 
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold text-secondary small">NEW PASSWORD</label>
                            <input 
                                type="password" 
                                className="form-control rounded-pill px-3" 
                                value={passwordData.new_password}
                                onChange={e => setPasswordData({...passwordData, new_password: e.target.value})}
                                required 
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold text-secondary small">CONFIRM NEW PASSWORD</label>
                            <input 
                                type="password" 
                                className="form-control rounded-pill px-3" 
                                value={passwordData.confirm_password}
                                onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})}
                                required 
                            />
                        </div>
                    </div>
                    <div className="text-end mt-4">
                        <button type="submit" className="btn btn-outline-primary btn-md rounded-pill px-4" disabled={changingPassword}>
                            {changingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
