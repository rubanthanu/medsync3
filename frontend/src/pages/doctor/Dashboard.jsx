import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const DoctorDashboard = () => {
    const [windows, setWindows] = useState([]);
    const [activeWindow, setActiveWindow] = useState(null);
    const [selectedWindow, setSelectedWindow] = useState(null);
    const [queue, setQueue] = useState([]);
    
    // Health posts state
    const [posts, setPosts] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [newPost, setNewPost] = useState({ title: '', content: '', category: 'Wellness', image_url: '' });
    
    // Certificate requests states
    const [certificates, setCertificates] = useState([]);
    const [selectedCert, setSelectedCert] = useState(null); // For MC review modal
    const [rejectionReason, setRejectionReason] = useState('');
    const [reviewing, setReviewing] = useState(false);

    // Leave management states
    const [leaves, setLeaves] = useState([]);
    const [leaveDate, setLeaveDate] = useState('');
    const [leaveReason, setLeaveReason] = useState('Medical Leave');
    const [markingLeave, setMarkingLeave] = useState(false);

    // Prescription modal states
    const [activeAppointment, setActiveAppointment] = useState(null); // Active patient being prescribed
    const [patientHistory, setPatientHistory] = useState([]);
    const [patientProfile, setPatientProfile] = useState(null);
    const [prescriptionForm, setPrescriptionForm] = useState({ diagnosis: '', notes: '', medicines: '', dosage: '', instructions: '' });
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [savingPrescription, setSavingPrescription] = useState(false);

    const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'certificates', 'posts', 'feedbacks', 'leaves'

    useEffect(() => {
        fetchWindows();
        fetchPosts();
        fetchFeedbacks();
        fetchCertificates();
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const res = await api.get('/doctor/get_leaves');
            setLeaves(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkLeave = async (e) => {
        e.preventDefault();
        const result = await Swal.fire({
            title: 'Mark Leave?',
            text: `Marking leave on ${leaveDate} will CANCEL all existing appointments for that day. Patients will be notified by email. Proceed?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, mark leave'
        });
        if (!result.isConfirmed) return;
        
        setMarkingLeave(true);
        try {
            const res = await api.post('/doctor/mark_leave', { leave_date: leaveDate, reason: leaveReason });
            Swal.fire('Success', res.data.message, 'success');
            setLeaveDate('');
            fetchLeaves();
        } catch (err) {
            Swal.fire('Error!', err.response?.data?.message || 'Failed to mark leave', 'error');
        } finally {
            setMarkingLeave(false);
        }
    };

    const handleDeleteLeave = async (leave_id) => {
        const result = await Swal.fire({
            title: 'Cancel Leave?',
            text: 'You will become available for booking again.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, cancel leave'
        });
        if (!result.isConfirmed) return;
        try {
            await api.post('/doctor/delete_leave', { leave_id });
            fetchLeaves();
            Swal.fire('Success', 'Leave cancelled', 'success');
        } catch (err) {
            Swal.fire('Error!', 'Failed to cancel leave', 'error');
        }
    };

    const fetchWindows = async (preferredWindowId = null) => {
        try {
            const res = await api.get('/appointment/get_windows');
            setWindows(res.data);
            const active = res.data.find(w => w.is_active > 0);

            const targetWindowId = preferredWindowId || selectedWindow?.window_id;
            if (targetWindowId) {
                const refreshedSelected = res.data.find(w => w.window_id === targetWindowId);
                if (refreshedSelected) {
                    setSelectedWindow(refreshedSelected);
                    setActiveWindow(refreshedSelected.is_active > 0 ? refreshedSelected : (active || null));
                    fetchQueue(refreshedSelected.window_id);
                    return;
                }
            }

            if (active) {
                setActiveWindow(active);
                setSelectedWindow(active);
                fetchQueue(active.window_id);
            } else {
                setActiveWindow(null);
                setSelectedWindow(null);
                setQueue([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectWindow = (win) => {
        setSelectedWindow(win);
        fetchQueue(win.window_id);
    };

    const fetchQueue = async (window_id) => {
        try {
            const res = await api.get(`/queue/get_queue?window_id=${window_id}`);
            setQueue(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPosts = async () => {
        try {
            const res = await api.get('/healthpost/get_all');
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchFeedbacks = async () => {
        try {
            const res = await api.get('/feedback/get_all');
            setFeedbacks(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            setFeedbacks([]);
        }
    };

    const fetchCertificates = async () => {
        try {
            const res = await api.get('/certificate/get_requests');
            setCertificates(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleStartWindow = async (window_id) => {
        try {
            await api.post('/queue/start_window', { window_id });
            fetchWindows(window_id);
            Swal.fire({ icon: 'success', title: 'Window Started', timer: 1500, showConfirmButton: false });
        } catch (err) {
            Swal.fire('Error!', err.response?.data?.message || 'Failed to start window', 'error');
        }
    };

    const handleStopWindow = async (window_id) => {
        const result = await Swal.fire({
            title: 'Finish Session?',
            text: 'Are you sure you want to finish this time window?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, finish it!'
        });
        if (!result.isConfirmed) return;
        try {
            await api.post('/queue/stop_window', { window_id });
            fetchWindows(window_id);
            Swal.fire('Finished!', 'The window has been closed.', 'success');
        } catch (err) {
            Swal.fire('Error!', err.response?.data?.message || 'Failed to stop window', 'error');
        }
    };

    const handleNextPatient = async () => {
        if (!selectedWindow || selectedWindow.is_active <= 0) {
            Swal.fire('Wait!', 'Please start this window before calling the next patient.', 'warning');
            return;
        }

        try {
            const res = await api.post('/queue/next_patient', { window_id: selectedWindow.window_id });
            Swal.fire({
                title: 'Next Patient Called',
                text: res.data.message,
                icon: 'info',
                timer: 2000,
                showConfirmButton: false
            });
            fetchQueue(selectedWindow.window_id);
        } catch (err) {
            Swal.fire('Error!', err.response?.data?.message || 'Error', 'error');
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        try {
            await api.post('/healthpost/create', newPost);
            setNewPost({ title: '', content: '', category: 'Wellness', image_url: '' });
            fetchPosts();
            Swal.fire('Created!', 'Post created successfully!', 'success');
        } catch (err) {
            Swal.fire('Error!', 'Failed to create post: ' + (err.response?.data?.message || 'Error'), 'error');
        }
    };

    const handleDeletePost = async (post_id) => {
        const result = await Swal.fire({
            title: 'Delete Post?',
            text: 'Are you sure you want to delete this post?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });
        if (!result.isConfirmed) return;
        try {
            await api.post('/healthpost/delete', { post_id });
            fetchPosts();
            Swal.fire('Deleted!', 'Post deleted successfully.', 'success');
        } catch (err) {
            Swal.fire('Error!', 'Failed to delete post: ' + (err.response?.data?.message || 'Unauthorized'), 'error');
        }
    };

    // Open side-by-side prescription modal and fetch patient's medical details
    const handleOpenPrescription = async (appt) => {
        setActiveAppointment(appt);
        setPrescriptionForm({ diagnosis: '', notes: '', medicines: '', dosage: '', instructions: '' });
        setLoadingHistory(true);
        try {
            // Get patient profile (allergies, medical conditions)
            const resProfile = await api.get(`/user/get_patient_details?patient_id=${appt.patient_id}`);
            setPatientProfile(resProfile.data);
            // Get past checkup history
            const resHistory = await api.get(`/prescription/get_history?patient_id=${appt.patient_id}`);
            setPatientHistory(resHistory.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSavePrescription = async (e) => {
        e.preventDefault();
        setSavingPrescription(true);
        try {
            await api.post('/prescription/create', {
                appointment_id: activeAppointment.appointment_id,
                diagnosis: prescriptionForm.diagnosis,
                notes: prescriptionForm.notes,
                medicines: prescriptionForm.medicines,
                dosage: prescriptionForm.dosage,
                instructions: prescriptionForm.instructions
            });
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Prescription created, Checkup history logged, and Appointment completed successfully!',
                timer: 3000,
                showConfirmButton: false
            });
            setActiveAppointment(null);
            if (selectedWindow) {
                fetchQueue(selectedWindow.window_id);
            }
            fetchWindows(selectedWindow?.window_id); // refresh selected and active windows
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Operation Failed',
                text: err.response?.data?.message || 'Failed to save prescription'
            });
        } finally {
            setSavingPrescription(false);
        }
    };

    const handleReviewCertificate = async (status) => {
        if (status === 'Rejected' && !rejectionReason.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Reason Required',
                text: 'Please specify a rejection reason.'
            });
            return;
        }
        setReviewing(true);
        try {
            await api.post('/certificate/review', {
                certificate_id: selectedCert.certificate_id,
                status,
                rejection_reason: status === 'Rejected' ? rejectionReason : ''
            });
            Swal.fire({
                icon: 'success',
                title: 'Done',
                text: `Medical certificate request ${status.toLowerCase()} successfully.`,
                timer: 2000,
                showConfirmButton: false
            });
            setSelectedCert(null);
            setRejectionReason('');
            fetchCertificates();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.message || 'Failed to review certificate'
            });
        } finally {
            setReviewing(false);
        }
    };

    return (
        <div className="container py-4 animate-fade-in">
            {/* Dashboard Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">Doctor Dashboard</h2>
                <Link to="/profile" className="btn btn-outline-primary rounded-pill px-4 shadow-sm">
                    <i className="bi bi-person-gear me-2"></i> Edit Profile
                </Link>
            </div>
            
            {/* Dashboard Navigation Tabs */}
            <ul className="nav nav-pills mb-4 gap-2 bg-light p-2 rounded-4 d-inline-flex border-0">
                <li className="nav-item">
                    <button className={`nav-link rounded-pill px-4 fw-semibold border-0 ${activeTab === 'queue' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`} onClick={() => setActiveTab('queue')}>
                        <i className="bi bi-calendar2-check me-2"></i> Active Queue
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link rounded-pill px-4 fw-semibold border-0 ${activeTab === 'certificates' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`} onClick={() => setActiveTab('certificates')}>
                        <i className="bi bi-file-earmark-medical me-2"></i> Certificate Requests {certificates.filter(c => c.status === 'Pending').length > 0 && <span className="badge bg-danger ms-2">{certificates.filter(c => c.status === 'Pending').length}</span>}
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link rounded-pill px-4 fw-semibold border-0 ${activeTab === 'posts' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`} onClick={() => setActiveTab('posts')}>
                        <i className="bi bi-journal-medical me-2"></i> Health Posts
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link rounded-pill px-4 fw-semibold border-0 ${activeTab === 'feedbacks' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`} onClick={() => setActiveTab('feedbacks')}>
                        <i className="bi bi-chat-left-heart me-2"></i> Patient Feedback
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link rounded-pill px-4 fw-semibold border-0 ${activeTab === 'leaves' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`} onClick={() => setActiveTab('leaves')}>
                        <i className="bi bi-calendar-x me-2"></i> Leave Management
                    </button>
                </li>
            </ul>

            {/* Active Queue Tab */}
            {activeTab === 'queue' && (
                <div>
                    {/* Today's Windows List */}
                    <div className="row g-4 mb-5">
                        {windows.map(win => (
                            <div className="col-md-3" key={win.window_id} onClick={() => handleSelectWindow(win)} role="button" tabIndex={0}>
                                <div className={`card h-100 border-0 shadow-sm rounded-4 ${win.is_active ? 'bg-primary text-white shadow' : 'bg-white'} ${selectedWindow?.window_id === win.window_id ? 'border border-2 border-primary' : ''}`}>
                                    <div className="card-body p-4 text-center">
                                        <h5 className="fw-bold">{win.window_name}</h5>
                                        <p className={`small ${win.is_active ? 'text-white-50' : 'text-muted'}`}>
                                            {win.start_time} - {win.end_time}
                                        </p>
                                        {!win.is_active && (
                                            <button className="btn btn-outline-primary btn-sm rounded-pill mt-3 w-100" onClick={(e) => { e.stopPropagation(); handleStartWindow(win.window_id); }}>
                                                Start Window
                                            </button>
                                        )}
                                        {win.is_active > 0 && (
                                            <>
                                                <div><span className="badge bg-light text-primary rounded-pill mt-3 px-3 fw-semibold">Ongoing</span></div>
                                                <button className="btn btn-outline-danger btn-sm rounded-pill mt-2 w-100" onClick={(e) => { e.stopPropagation(); handleStopWindow(win.window_id); }}>
                                                    Finish Window
                                                </button>
                                            </>
                                        )}
                                        <div className="mt-3 fs-5 fw-bold">
                                            {win.booked_count || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Active Queue Details */}
                    {selectedWindow ? (
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="card-header bg-white border-bottom-0 p-4 d-flex justify-content-between align-items-center">
                                <h4 className="fw-bold mb-0 text-dark">Patient List - {selectedWindow.window_name}</h4>
                                {selectedWindow.is_active > 0 ? (
                                    <button className="btn btn-success rounded-pill fw-bold px-4 hover-grow shadow-sm" onClick={handleNextPatient}>
                                        <i className="bi bi-person-check-fill me-2"></i> Next Patient
                                    </button>
                                ) : (
                                    <span className="badge bg-secondary rounded-pill px-3 py-2">Start this window for live queue</span>
                                )}
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light text-secondary">
                                            <tr>
                                                <th className="ps-4">Queue #</th>
                                                <th>Patient Name</th>
                                                <th>Status</th>
                                                <th className="text-end pe-4">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {queue.map(q => (
                                                <tr key={q.appointment_id} className={q.appointment_status === 'Current' ? 'table-warning' : ''}>
                                                    <td className="ps-4 fw-bold fs-5 text-primary">#{q.queue_number}</td>
                                                    <td className="fw-semibold text-dark">{q.patient_name}</td>
                                                    <td>
                                                        <span className={`badge bg-${q.appointment_status === 'Walk-In' ? 'success' : (q.appointment_status === 'Current' ? 'warning text-dark' : 'secondary')} rounded-pill px-3`}>
                                                            {q.appointment_status}
                                                        </span>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        {q.appointment_status === 'Current' && selectedWindow.is_active > 0 && (
                                                            <button className="btn btn-sm btn-outline-primary rounded-pill px-3 shadow-sm" onClick={() => handleOpenPrescription(q)}>
                                                                <i className="bi bi-file-earmark-medical me-1"></i> Write Prescription
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {queue.length === 0 && (
                                                <tr><td colSpan="4" className="text-center p-4 text-muted">No patients in the queue.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-5 bg-white rounded-4 shadow-sm text-muted">
                            <i className="bi bi-calendar-x display-6"></i>
                            <p className="mt-2 mb-0">Click a window to view patients. Press Start Window to make it live.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Certificate Requests Tab */}
            {activeTab === 'certificates' && (
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-white border-bottom-0 p-4">
                        <h4 className="fw-bold mb-0 text-dark">Medical Certificate Requests</h4>
                    </div>
                    <div className="card-body p-0">
                        {certificates.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light text-secondary">
                                        <tr>
                                            <th className="ps-4">Patient Name</th>
                                            <th>University ID</th>
                                            <th>Date Range</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                            <th className="text-end pe-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {certificates.map(cert => (
                                            <tr key={cert.certificate_id}>
                                                <td className="ps-4 fw-semibold text-dark">{cert.patient_name}</td>
                                                <td className="text-muted">{cert.university_id}</td>
                                                <td className="text-dark small">{cert.start_date} to {cert.end_date}</td>
                                                <td className="text-muted small text-wrap" style={{ maxWidth: '250px' }}>{cert.reason}</td>
                                                <td>
                                                    <span className={`badge bg-${cert.status === 'Pending' ? 'warning text-dark' : (cert.status === 'Approved' ? 'success' : 'danger')} rounded-pill px-3`}>
                                                        {cert.status}
                                                    </span>
                                                </td>
                                                <td className="text-end pe-4">
                                                    {cert.status === 'Pending' ? (
                                                        <button className="btn btn-sm btn-primary rounded-pill px-3 shadow-sm" onClick={() => setSelectedCert(cert)}>
                                                            Review Request
                                                        </button>
                                                    ) : (
                                                        <span className="text-muted small">Reviewed</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-5 text-muted">
                                <i className="bi bi-file-earmark-medical display-6"></i>
                                <p className="mt-2 mb-0">No certificate requests found.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Health Posts Tab */}
            {activeTab === 'posts' && (
                <div className="row g-4">
                    {/* Create Health Post Form */}
                    <div className="col-lg-5">
                        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
                            <h5 className="fw-bold mb-4 text-dark border-bottom pb-2">Publish New Health Post</h5>
                            <form onSubmit={handleCreatePost}>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold text-secondary small">POST TITLE</label>
                                    <input type="text" className="form-control rounded-pill px-3" placeholder="Enter post title" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold text-secondary small">CATEGORY</label>
                                    <select className="form-select rounded-pill px-3" value={newPost.category} onChange={e => setNewPost({...newPost, category: e.target.value})} required>
                                        <option value="Wellness">Wellness</option>
                                        <option value="Mental Health">Mental Health</option>
                                        <option value="Nutrition">Nutrition</option>
                                        <option value="General">General</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold text-secondary small">IMAGE URL (OPTIONAL)</label>
                                    <input type="text" className="form-control rounded-pill px-3" placeholder="https://unsplash.com/..." value={newPost.image_url} onChange={e => setNewPost({...newPost, image_url: e.target.value})} />
                                    <div className="form-text text-muted small px-2">Leave blank to use category default illustration.</div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold text-secondary small">POST CONTENT</label>
                                    <textarea className="form-control rounded-4 p-3" rows="5" placeholder="Write post information here..." value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} required></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary rounded-pill px-4 w-100 shadow-sm">Publish Post</button>
                            </form>
                        </div>
                    </div>

                    {/* Existing Health Posts */}
                    <div className="col-lg-7">
                        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
                            <h5 className="fw-bold mb-4 text-dark border-bottom pb-2">Existing Health Posts</h5>
                            {posts.length > 0 ? (
                                <div className="list-group list-group-flush">
                                    {posts.map(post => (
                                        <div key={post.post_id} className="list-group-item p-3 mb-3 border-0 bg-light rounded-4 d-flex justify-content-between align-items-center hover-grow">
                                            <div>
                                                <h6 className="fw-bold text-primary mb-1">{post.title}</h6>
                                                <span className="badge bg-secondary-subtle text-secondary rounded-pill me-2 px-2 small">{post.category || 'Wellness'}</span>
                                                <small className="text-muted">By {post.author_name} | {new Date(post.created_at).toLocaleDateString()}</small>
                                            </div>
                                            <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => handleDeletePost(post.post_id)}>Delete</button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-journal-medical display-6"></i>
                                    <p className="mt-2 mb-0">No health posts found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Patient Feedback Tab */}
            {activeTab === 'feedbacks' && (
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-white border-bottom-0 p-4">
                        <h4 className="fw-bold mb-0 text-dark">Patient Feedback</h4>
                    </div>
                    <div className="card-body p-0">
                        {feedbacks.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light text-secondary">
                                        <tr>
                                            <th className="ps-4">Patient</th>
                                            <th>Email</th>
                                            <th>Feedback Message</th>
                                            <th>Submitted At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.isArray(feedbacks) && feedbacks.map(f => (
                                            <tr key={f.feedback_id}>
                                                <td className="ps-4 fw-semibold text-dark">{f.patient_name}</td>
                                                <td className="text-muted">{f.patient_email}</td>
                                                <td className="text-dark py-3 text-wrap" style={{ maxWidth: '400px' }}>{f.feedback_text}</td>
                                                <td className="text-muted small">{f.submitted_at ? new Date(f.submitted_at).toLocaleString() : 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-5 text-muted">
                                <i className="bi bi-chat-left-dots display-6"></i>
                                <p className="mt-2 mb-0">No patient feedback received yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Leave Management Tab */}
            {activeTab === 'leaves' && (
                <div className="row g-4">
                    <div className="col-lg-5">
                        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
                            <h5 className="fw-bold mb-4 text-dark border-bottom pb-2">Plan a Leave</h5>
                            <div className="alert alert-warning small rounded-3 mb-4">
                                <i className="bi bi-info-circle-fill me-2"></i>
                                <strong>Note:</strong> Marking a leave on a date will automatically <strong>cancel all existing appointments</strong> for that day and notify the patients.
                            </div>
                            <form onSubmit={handleMarkLeave}>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold text-secondary small">LEAVE DATE</label>
                                    <input 
                                        type="date" 
                                        className="form-control rounded-pill px-3" 
                                        value={leaveDate} 
                                        onChange={e => setLeaveDate(e.target.value)} 
                                        min={new Date().toISOString().split('T')[0]}
                                        required 
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-semibold text-secondary small">REASON (OPTIONAL)</label>
                                    <textarea 
                                        className="form-control rounded-4 p-3" 
                                        rows="3" 
                                        placeholder="e.g. Medical center duty, University event..."
                                        value={leaveReason}
                                        onChange={e => setLeaveReason(e.target.value)}
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn btn-danger rounded-pill px-4 w-100 shadow-sm" disabled={markingLeave || !leaveDate}>
                                    {markingLeave ? (
                                        <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                                    ) : (
                                        <><i className="bi bi-calendar-check me-2"></i>Mark Leave & Cancel Appointments</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="col-lg-7">
                        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
                            <h5 className="fw-bold mb-4 text-dark border-bottom pb-2">My Planned Leaves</h5>
                            {leaves.length > 0 ? (
                                <div className="list-group list-group-flush">
                                    {leaves.map(leave => (
                                        <div key={leave.leave_id} className="list-group-item p-3 mb-3 border-0 bg-light rounded-4 d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 className="fw-bold text-dark mb-1">
                                                    <i className="bi bi-calendar-date text-primary me-2"></i>
                                                    {new Date(leave.leave_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </h6>
                                                <p className="text-muted small mb-0">Reason: {leave.reason}</p>
                                            </div>
                                            <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => handleDeleteLeave(leave.leave_id)}>
                                                Cancel Leave
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-calendar3 display-6"></i>
                                    <p className="mt-2 mb-0">No planned leaves found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL OVERLAYS --- */}

            {/* Write Prescription Split Modal */}
            {activeAppointment && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 animate-fade-in" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}>
                    <div className="card border-0 shadow-lg rounded-4 bg-white w-100 h-100" style={{ maxWidth: '1200px', maxHeight: '90%' }}>
                        <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
                            <h4 className="fw-bold mb-0 text-dark">
                                <i className="bi bi-file-earmark-medical text-primary me-2"></i> 
                                Medical Record & Prescription: {activeAppointment.patient_name}
                            </h4>
                            <button type="button" className="btn-close" onClick={() => setActiveAppointment(null)}></button>
                        </div>
                        
                        <div className="card-body p-0 d-flex flex-column flex-md-row overflow-hidden">
                            {/* Left Side: Medical Info & Checkup History (45% width) */}
                            <div className="w-100 w-md-45 border-end p-4 overflow-y-auto bg-light" style={{ maxHeight: '100%' }}>
                                <h5 className="fw-bold text-dark mb-3 border-bottom pb-2">Patient Health Profile</h5>
                                
                                {loadingHistory ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status"></div>
                                        <p className="text-muted small mt-2">Loading medical records...</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Profile summary */}
                                        {patientProfile && (
                                            <div className="card border-0 bg-white p-3 rounded-4 mb-4 shadow-sm small">
                                                <div className="row g-2">
                                                    <div className="col-6"><strong>Gender:</strong> {patientProfile.gender || 'Not specified'}</div>
                                                    <div className="col-6"><strong>Blood Group:</strong> <span className="badge bg-danger rounded-pill px-2">{patientProfile.blood_group || 'N/A'}</span></div>
                                                    <div className="col-6"><strong>Phone:</strong> {patientProfile.phone || 'N/A'}</div>
                                                    <div className="col-6"><strong>University ID:</strong> {patientProfile.university_id || 'N/A'}</div>
                                                    <div className="col-12 mt-2">
                                                        <strong className="text-danger"><i className="bi bi-exclamation-triangle"></i> Allergies:</strong>
                                                        <div className="p-2 bg-danger-subtle text-danger-emphasis rounded-3 mt-1 fw-semibold">{patientProfile.allergies || 'None reported'}</div>
                                                    </div>
                                                    <div className="col-12 mt-2">
                                                        <strong>Medical Conditions:</strong>
                                                        <div className="p-2 bg-warning-subtle text-warning-emphasis rounded-3 mt-1">{patientProfile.medical_conditions || 'None reported'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <h5 className="fw-bold text-dark mb-3 border-bottom pb-2">Past Checkup History</h5>
                                        {patientHistory.length > 0 ? (
                                            <div className="d-flex flex-column gap-3">
                                                {patientHistory.map((hist, index) => (
                                                    <div key={hist.history_id} className="card border-0 bg-white p-3 rounded-4 shadow-sm small">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span className="fw-bold text-primary">Visit #{patientHistory.length - index}</span>
                                                            <span className="text-muted small">{new Date(hist.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="mb-1"><strong>Diagnosis:</strong> {hist.diagnosis}</p>
                                                        <p className="mb-1 text-muted"><strong>Notes:</strong> {hist.notes || 'None'}</p>
                                                        {hist.medicines && (
                                                            <div className="mt-2 bg-light p-2 rounded-3 border-start border-primary border-3">
                                                                <strong>Medicines:</strong>
                                                                <div className="text-secondary small whitespace-pre">{hist.medicines}</div>
                                                                {hist.dosage && <div className="text-muted small">Dosage: {hist.dosage}</div>}
                                                                {hist.instructions && <div className="text-muted small">Instructions: {hist.instructions}</div>}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 bg-white rounded-4 border">
                                                <i className="bi bi-folder2-open text-muted fs-3"></i>
                                                <p className="text-muted small mt-1 mb-0">No previous checkup history found.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Right Side: Writing Prescription Form (55% width) */}
                            <form onSubmit={handleSavePrescription} className="w-100 w-md-55 p-4 overflow-y-auto d-flex flex-column justify-content-between" style={{ maxHeight: '100%' }}>
                                <div>
                                    <h5 className="fw-bold text-dark mb-4 border-bottom pb-2">Record Diagnosis & Prescribe</h5>
                                    
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-secondary small">DIAGNOSIS</label>
                                        <input type="text" className="form-control rounded-pill px-3" placeholder="e.g. Common Cold, Migraine, Gastroentiritis" value={prescriptionForm.diagnosis} onChange={e => setPrescriptionForm({...prescriptionForm, diagnosis: e.target.value})} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-secondary small">CHECKUP NOTES / SYMPTOMS</label>
                                        <textarea className="form-control rounded-4 p-3" rows="2" placeholder="Describe symptoms and advice..." value={prescriptionForm.notes} onChange={e => setPrescriptionForm({...prescriptionForm, notes: e.target.value})}></textarea>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-secondary small">PRESCRIBED MEDICINES (ONE PER LINE)</label>
                                        <textarea className="form-control rounded-4 p-3" rows="4" placeholder="e.g. Paracetamol 500mg&#10;Amoxicillin 250mg" value={prescriptionForm.medicines} onChange={e => setPrescriptionForm({...prescriptionForm, medicines: e.target.value})} required></textarea>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold text-secondary small">DOSAGE (E.G. 1-0-1, 1-1-1)</label>
                                            <input type="text" className="form-control rounded-pill px-3" placeholder="e.g. Twice daily after meals" value={prescriptionForm.dosage} onChange={e => setPrescriptionForm({...prescriptionForm, dosage: e.target.value})} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold text-secondary small">DURATION / INSTRUCTIONS</label>
                                            <input type="text" className="form-control rounded-pill px-3" placeholder="e.g. Take for 5 days" value={prescriptionForm.instructions} onChange={e => setPrescriptionForm({...prescriptionForm, instructions: e.target.value})} />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-top pt-3 d-flex justify-content-end gap-2">
                                    <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setActiveAppointment(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary rounded-pill px-5 shadow-sm" disabled={savingPrescription}>
                                        {savingPrescription ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Generating PDF...
                                            </>
                                        ) : (
                                            'Save & Complete Visit'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Medical Certificate Modal */}
            {selectedCert && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 animate-fade-in" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}>
                    <div className="card border-0 shadow-lg rounded-4 bg-white w-100" style={{ maxWidth: '650px' }}>
                        <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
                            <h4 className="fw-bold mb-0 text-dark">Review Medical Certificate</h4>
                            <button type="button" className="btn-close" onClick={() => { setSelectedCert(null); setRejectionReason(''); }}></button>
                        </div>
                        <div className="card-body p-4">
                            <div className="mb-4 bg-light p-3 rounded-4 small">
                                <p className="mb-1"><strong>Patient:</strong> {selectedCert.patient_name} ({selectedCert.university_id})</p>
                                <p className="mb-1"><strong>Requested Leave Period:</strong> {selectedCert.start_date} to {selectedCert.end_date}</p>
                                <p className="mb-1"><strong>Reason for Leave:</strong> {selectedCert.reason}</p>
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-semibold text-secondary small">1. VERIFY PROOF FILE</label>
                                <a 
                                    href={`http://localhost/medsync3/uwu-medsync-api/uploads/medical_proofs/${selectedCert.proof_pdf}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="btn btn-outline-info d-block rounded-pill text-center py-2 shadow-sm text-decoration-none"
                                >
                                    <i className="bi bi-file-earmark-pdf me-2"></i> View Uploaded Proof Document <i className="bi bi-box-arrow-up-right ms-1"></i>
                                </a>
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-semibold text-secondary small">2. ACTION & REJECTION REASON (IF REJECTING)</label>
                                <input 
                                    type="text" 
                                    className="form-control rounded-pill px-3" 
                                    placeholder="Enter rejection reason only if rejecting..." 
                                    value={rejectionReason} 
                                    onChange={e => setRejectionReason(e.target.value)} 
                                />
                            </div>

                            <div className="d-flex justify-content-end gap-2 border-top pt-3">
                                <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => { setSelectedCert(null); setRejectionReason(''); }}>Cancel</button>
                                <button type="button" className="btn btn-danger rounded-pill px-4 shadow-sm" onClick={() => handleReviewCertificate('Rejected')} disabled={reviewing}>
                                    Reject Request
                                </button>
                                <button type="button" className="btn btn-success rounded-pill px-4 shadow-sm" onClick={() => handleReviewCertificate('Approved')} disabled={reviewing}>
                                    Approve Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorDashboard;
