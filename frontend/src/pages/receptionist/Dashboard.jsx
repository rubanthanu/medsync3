import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const ReceptionistDashboard = () => {
    const [windows, setWindows] = useState([]);
    const [selectedWindow, setSelectedWindow] = useState(null);
    const [queue, setQueue] = useState([]);
    const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'mc'
    const [mcRequests, setMcRequests] = useState([]);
    const [bookingData, setBookingData] = useState({ email: '', window_id: '', appointment_date: new Date().toISOString().split('T')[0] });
    const [bookingMsg, setBookingMsg] = useState({ text: '', type: '' });
    
    useEffect(() => {
        fetchWindows();
        fetchMCRequests();
    }, []);

    const fetchWindows = async () => {
        try {
            const res = await api.get('/appointment/get_windows');
            setWindows(res.data);
            if(res.data.length > 0 && !selectedWindow) {
                handleSelectWindow(res.data[0]);
                setBookingData(prev => ({ ...prev, window_id: res.data[0].window_id }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMCRequests = async () => {
        try {
            const res = await api.get('/certificate/get_requests');
            setMcRequests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectWindow = async (win) => {
        setSelectedWindow(win);
        try {
            const res = await api.get(`/queue/get_queue?window_id=${win.window_id}`);
            setQueue(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const updateStatus = async (appointment_id, status) => {
        try {
            await api.post('/queue/update_status', { appointment_id, status });
            handleSelectWindow(selectedWindow);
            Swal.fire({ icon: 'success', title: 'Status Updated', timer: 1000, showConfirmButton: false });
        } catch (err) {
            Swal.fire('Error!', err.response?.data?.message || 'Error updating status', 'error');
        }
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        setBookingMsg({ text: 'Processing...', type: 'info' });
        try {
            await api.post('/appointment/staff_book', bookingData);
            setBookingMsg({ text: 'Booking successful!', type: 'success' });
            setBookingData({ ...bookingData, email: '' });
            if (activeTab === 'queue' && selectedWindow?.window_id == bookingData.window_id) {
                handleSelectWindow(selectedWindow);
            }
        } catch (err) {
            setBookingMsg({ text: err.response?.data?.message || 'Error booking appointment', type: 'danger' });
        }
    };

    return (
        <div className="container py-4 animate-fade-in">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-0">Receptionist Dashboard</h2>
                    <p className="text-muted mb-0">Manage daily queue and monitor clinic activities</p>
                </div>
                <div className="d-flex gap-2">
                    <button 
                        className={`btn rounded-pill px-4 ${activeTab === 'queue' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActiveTab('queue')}
                    >
                        <i className="bi bi-people-fill me-2"></i> Queue
                    </button>
                    <button 
                        className={`btn rounded-pill px-4 ${activeTab === 'mc' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActiveTab('mc')}
                    >
                        <i className="bi bi-file-earmark-medical me-2"></i> MC Requests
                    </button>
                </div>
            </div>
            
            <div className="row g-4">
                {/* Left Column: Quick Booking Form */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 sticky-top" style={{ top: '20px' }}>
                        <div className="card-header bg-white border-bottom-0 pt-4 px-4 pb-2">
                            <h5 className="fw-bold mb-0">Quick Booking</h5>
                            <small className="text-muted">Register walk-in or manual booking</small>
                        </div>
                        <div className="card-body p-4">
                            {bookingMsg.text && (
                                <div className={`alert alert-${bookingMsg.type} py-2 small rounded-3 mb-3`}>
                                    {bookingMsg.text}
                                </div>
                            )}
                            <form onSubmit={handleBookingSubmit}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">PATIENT EMAIL</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-0"><i className="bi bi-envelope"></i></span>
                                        <input 
                                            type="email" 
                                            className="form-control border-0 bg-light" 
                                            placeholder="patient@std.uwu.ac.lk"
                                            value={bookingData.email}
                                            onChange={e => setBookingData({...bookingData, email: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">WINDOW</label>
                                    <select 
                                        className="form-select border-0 bg-light"
                                        value={bookingData.window_id}
                                        onChange={e => setBookingData({...bookingData, window_id: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Window</option>
                                        {windows.map(win => (
                                            <option key={win.window_id} value={win.window_id}>{win.window_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">DATE</label>
                                    <input 
                                        type="date" 
                                        className="form-control border-0 bg-light"
                                        value={bookingData.appointment_date}
                                        onChange={e => setBookingData({...bookingData, appointment_date: e.target.value})}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-100 rounded-pill py-2 fw-bold mt-2 shadow-sm">
                                    Book Appointment
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                
                {/* Right Column: Dynamic Content */}
                <div className="col-lg-8">
                    {activeTab === 'queue' ? (
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="bg-white p-3 border-bottom d-flex gap-2 overflow-auto scrollbar-hide">
                                {windows.map(win => (
                                    <button 
                                        key={win.window_id} 
                                        className={`btn rounded-4 px-4 text-nowrap flex-shrink-0 ${selectedWindow?.window_id === win.window_id ? 'btn-primary' : 'btn-light'}`}
                                        onClick={() => handleSelectWindow(win)}
                                    >
                                        <div className="fw-bold">{win.window_name}</div>
                                        <div className="x-small opacity-75">{win.start_time}-{win.end_time}</div>
                                        <div className="badge bg-white text-primary mt-1">{win.booked_count || 0}</div>
                                    </button>
                                ))}
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="ps-4">Queue #</th>
                                                <th>Patient Name</th>
                                                <th>Status</th>
                                                <th className="text-end pe-4">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {queue.map(q => (
                                                <tr key={q.appointment_id}>
                                                    <td className="ps-4 fw-bold text-primary fs-5">#{q.queue_number}</td>
                                                    <td>
                                                        <div className="fw-bold">{q.patient_name}</div>
                                                        <div className="text-muted small">{q.university_id || 'Student/Staff'}</div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge px-3 py-2 rounded-pill font-monospace ${
                                                            q.appointment_status === 'Booked' ? 'bg-info-subtle text-info' : 
                                                            q.appointment_status === 'Walk-In' ? 'bg-success-subtle text-success' : 
                                                            q.appointment_status === 'Absent' ? 'bg-danger-subtle text-danger' : 'bg-secondary-subtle text-secondary'
                                                        }`}>
                                                            {q.appointment_status}
                                                        </span>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        {q.appointment_status === 'Booked' && (
                                                            <div className="btn-group gap-2">
                                                                <button className="btn btn-sm btn-success rounded-pill px-3 shadow-sm" onClick={() => updateStatus(q.appointment_id, 'Walk-In')}>
                                                                    <i className="bi bi-person-check-fill me-1"></i> Walk-In
                                                                </button>
                                                                <button className="btn btn-sm btn-danger rounded-pill px-3 shadow-sm" onClick={() => updateStatus(q.appointment_id, 'Absent')}>
                                                                    <i className="bi bi-person-x-fill me-1"></i> Absent
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {queue.length === 0 && (
                                                <tr><td colSpan="4" className="text-center p-5 text-muted">No appointments found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="card-header bg-white border-0 pt-4 px-4">
                                <h5 className="fw-bold mb-0">Medical Certificate Requests</h5>
                                <p className="text-muted small">View and monitor patient MC requests</p>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="ps-4">Patient</th>
                                                <th>Reason</th>
                                                <th>Period</th>
                                                <th className="text-end pe-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mcRequests.map(mc => (
                                                <tr key={mc.certificate_id}>
                                                    <td className="ps-4">
                                                        <div className="fw-bold">{mc.patient_name}</div>
                                                        <div className="text-muted small">{mc.university_id}</div>
                                                    </td>
                                                    <td>{mc.reason}</td>
                                                    <td className="small">
                                                        {mc.start_date} to {mc.end_date}
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <span className={`badge rounded-pill px-3 py-2 ${
                                                            mc.status === 'Approved' ? 'bg-success' : 
                                                            mc.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'
                                                        }`}>
                                                            {mc.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {mcRequests.length === 0 && (
                                                <tr><td colSpan="4" className="text-center p-5 text-muted">No MC requests found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReceptionistDashboard;
