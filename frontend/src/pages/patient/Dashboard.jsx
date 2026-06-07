import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const PatientDashboard = () => {
    const [notifications, setNotifications] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [feedbackText, setFeedbackText] = useState('');
    const [toast, setToast] = useState(null);
    const [appointmentsLoading, setAppointmentsLoading] = useState(true);
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notification/get_all');
            setNotifications(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(timer);
    }, [toast]);
    
    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const res = await api.get('/appointment/get_patient_appointments');
                setAppointments(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setAppointmentsLoading(false);
            }
        };
        fetchAppointments();
    }, []);

    const refreshAppointments = async () => {
        try {
            const res = await api.get('/appointment/get_patient_appointments');
            setAppointments(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCancelAppointment = async (appointmentId) => {
        const result = await Swal.fire({
            title: 'Cancel Appointment?',
            text: 'Are you sure you want to cancel this appointment?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, cancel it',
            cancelButtonText: 'No, keep it'
        });

        if (!result.isConfirmed) return;

        try {
            await api.post('/appointment/cancel', { appointment_id: appointmentId });
            setToast({ type: 'success', message: 'Appointment cancelled successfully.' });
            await refreshAppointments();
        } catch (err) {
            setToast({ type: 'danger', message: err?.response?.data?.message || 'Unable to cancel appointment.' });
        }
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (!feedbackText.trim()) {
            setToast({ type: 'danger', message: 'Please enter feedback before submitting.' });
            return;
        }

        setFeedbackLoading(true);
        try {
            await api.post('/feedback/submit', { feedback_text: feedbackText });
            setFeedbackText('');
            setToast({ type: 'success', message: 'Feedback submitted successfully.' });
        } catch (err) {
            setToast({ type: 'danger', message: err?.response?.data?.message || 'Unable to submit feedback.' });
        } finally {
            setFeedbackLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await api.post('/notification/mark_read', { notification_id: notificationId });
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const formatAppointmentTime = (appointment) => {
        if (appointment.estimated_time) {
            return appointment.estimated_time;
        }

        return `${appointment.start_time} - ${appointment.end_time}`;
    };

    const isCancelable = (status) => ['Booked', 'Walk-In'].includes(status);

    return (
        <div className="container py-4 animate-fade-in patient-dashboard-shell">
            {toast && (
                <div className={`toast-alert toast-alert-${toast.type}`} role="status" aria-live="polite">
                    <span>{toast.message}</span>
                    <button type="button" className="btn-close btn-close-white ms-3" aria-label="Close" onClick={() => setToast(null)}></button>
                </div>
            )}

            <div className="dashboard-hero mb-4">
                <div>
                    <p className="eyebrow mb-2">Patient Space</p>
                    <h2 className="fw-bold mb-2">Patient Dashboard</h2>
                    <p className="mb-0 text-muted">Manage bookings, review notifications, and share feedback from one place.</p>
                </div>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="card h-100 p-4 border-0 bg-primary-subtle text-primary text-center rounded-4 hover-grow shadow-sm surface-card">
                        <i className="bi bi-calendar2-check display-4 mb-3"></i>
                        <h5 className="fw-bold">Book Appointment</h5>
                        <p className="small text-muted">Schedule a visit with our university doctors.</p>
                        <Link to="/patient/book" className="btn btn-primary rounded-pill mt-auto">Book Now</Link>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card h-100 p-4 border-0 bg-success-subtle text-success text-center rounded-4 hover-grow shadow-sm surface-card">
                        <i className="bi bi-person-lines-fill display-4 mb-3"></i>
                        <h5 className="fw-bold">Live Queue</h5>
                        <p className="small text-muted">Track your current queue status.</p>
                        <Link to="/patient/queue" className="btn btn-success rounded-pill mt-auto">View Queue</Link>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card h-100 p-4 border-0 bg-warning-subtle text-warning-emphasis text-center rounded-4 hover-grow shadow-sm surface-card">
                        <i className="bi bi-file-earmark-medical display-4 mb-3"></i>
                        <h5 className="fw-bold">Certificates & Prescriptions</h5>
                        <p className="small text-muted">Access your medical documents.</p>
                        <Link to="/patient/certificates" className="btn btn-warning text-white rounded-pill mt-auto">View Documents</Link>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card h-100 p-4 border-0 bg-info-subtle text-info-emphasis text-center rounded-4 hover-grow shadow-sm surface-card">
                        <i className="bi bi-person-gear display-4 mb-3"></i>
                        <h5 className="fw-bold">My Profile</h5>
                        <p className="small text-muted">Manage your personal and medical info.</p>
                        <Link to="/profile" className="btn btn-info text-white rounded-pill mt-auto">Edit Profile</Link>
                    </div>
                </div>
            </div>

            <div className="surface-panel mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                        <p className="eyebrow mb-1">My Appointments</p>
                        <h4 className="fw-bold mb-0">Booked appointments</h4>
                    </div>
                    <span className="text-muted small">Latest records first</span>
                </div>

                <div className="row g-3">
                    {appointmentsLoading ? (
                        <div className="col-12 text-center py-4 text-muted">Loading appointments...</div>
                    ) : appointments.length > 0 ? appointments.map((appointment) => (
                        <div key={appointment.appointment_id} className="col-12 col-lg-6">
                            <div className="appointment-card h-100">
                                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                                    <div>
                                        <div className="text-uppercase small text-muted fw-semibold">{appointment.window_name}</div>
                                        <h5 className="fw-bold mb-1">Queue #{appointment.queue_number}</h5>
                                        <div className="text-muted small">Doctor: {appointment.doctor_name || 'Assigned doctor'}</div>
                                    </div>
                                    <span className={`status-pill status-${appointment.appointment_status.toLowerCase().replace(/\s+/g, '-')}`}>
                                        {appointment.appointment_status}
                                    </span>
                                </div>

                                <div className="appointment-meta">
                                    <div>
                                        <span>Date</span>
                                        <strong>{new Date(appointment.appointment_date).toLocaleDateString()}</strong>
                                    </div>
                                    <div>
                                        <span>Time</span>
                                        <strong>{formatAppointmentTime(appointment)}</strong>
                                    </div>
                                    <div>
                                        <span>Window</span>
                                        <strong>{appointment.window_name}</strong>
                                    </div>
                                </div>

                                {isCancelable(appointment.appointment_status) && (
                                    <div className="mt-3">
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger rounded-pill px-4"
                                            onClick={() => handleCancelAppointment(appointment.appointment_id)}
                                        >
                                            Cancel Appointment
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="col-12">
                            <div className="empty-state text-center py-5 text-muted">
                                No booked appointments found.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="surface-panel mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                        <p className="eyebrow mb-1">Recent Notifications</p>
                        <h4 className="fw-bold mb-0">Updates from the clinic</h4>
                    </div>
                </div>

                <div className="list-group notification-list shadow-sm border-0 rounded-4">
                    {notifications.filter(n => n.is_read == 0).length > 0 ? notifications.filter(n => n.is_read == 0).map(notif => (
                        <div key={notif.notification_id} className="list-group-item p-3 border-0 border-bottom d-flex align-items-center justify-content-between notification-item">
                            <div className="d-flex align-items-center">
                                <div className="bg-light rounded-circle p-2 me-3">
                                    <i className="bi bi-bell text-primary"></i>
                                </div>
                                <div>
                                    <h6 className="mb-1 fw-bold">{notif.notification_type}</h6>
                                    <p className="mb-0 text-muted small">{notif.message}</p>
                                    <small className="text-secondary">{new Date(notif.created_at).toLocaleString()}</small>
                                </div>
                            </div>
                            <button 
                                className="btn btn-sm btn-outline-primary rounded-pill px-3" 
                                onClick={() => handleMarkAsRead(notif.notification_id)}
                            >
                                Mark as read
                            </button>
                        </div>
                    )) : (
                        <div className="list-group-item p-4 text-center text-muted">
                            No unread notifications.
                        </div>
                    )}
                </div>
            </div>

            <div className="feedback-panel mt-5">
                <div className="feedback-copy">
                    <p className="eyebrow mb-1">Feedback</p>
                    <h4 className="fw-bold mb-2 text-dark">Submit Feedback</h4>
                    <p className="mb-0 text-muted">Share a quick note about your visit or the platform experience.</p>
                </div>

                <form className="feedback-form mt-4 card border-0 shadow-sm p-4 rounded-4" onSubmit={handleFeedbackSubmit}>
                    <textarea
                        className="form-control feedback-textarea rounded-4 p-3 mb-3"
                        rows="4"
                        placeholder="Tell us what went well or what we can improve..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                    ></textarea>
                    <div className="d-flex justify-content-end">
                        <button type="submit" className="btn btn-primary rounded-pill px-5 shadow-sm" disabled={feedbackLoading}>
                            {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default PatientDashboard;
