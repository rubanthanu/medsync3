import { useState, useEffect } from 'react';
import api from '../../api/axios';

const LiveQueue = () => {
    const [windows, setWindows] = useState([]);
    const [activeWindow, setActiveWindow] = useState(null);
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchWindows = async () => {
        try {
            const res = await api.get(`/appointment/get_windows?date=${new Date().toISOString().split('T')[0]}`);
            setWindows(res.data);
            const active = res.data.find(w => w.is_active > 0);
            if(active) {
                setActiveWindow(active);
                fetchQueue(active.window_id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchQueue = async (window_id) => {
        setLoading(true);
        try {
            const res = await api.get(`/queue/get_queue?window_id=${window_id}`);
            setQueue(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchWindows();
        const interval = setInterval(fetchWindows, 10000); // Auto refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const getBadgeClass = (status) => {
        switch(status) {
            case 'Booked': return 'bg-primary';
            case 'Walk-In': return 'bg-success';
            case 'Current': return 'bg-warning text-dark';
            case 'Completed': return 'bg-secondary';
            case 'Absent': return 'bg-danger';
            case 'Cancelled': return 'bg-dark';
            default: return 'bg-light text-dark';
        }
    };

    return (
        <div className="container py-4 animate-fade-in">
            <h2 className="fw-bold mb-4">Live Queue Tracking</h2>
            
            {!activeWindow ? (
                <div className="alert alert-info border-0 shadow-sm glass-alert p-4 text-center">
                    <i className="bi bi-info-circle display-4 d-block mb-3 text-info"></i>
                    <h4 className="fw-bold">No Active Queue</h4>
                    <p className="mb-0">The doctor has not started any session yet today.</p>
                </div>
            ) : (
                <div className="row g-4">
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm bg-primary text-white p-4 text-center sticky-top" style={{top: '80px'}}>
                            <h5 className="opacity-75">Currently Active</h5>
                            <h2 className="fw-bold mb-4">{activeWindow.window_name}</h2>
                            <div className="bg-white text-primary rounded-4 p-4 mb-3">
                                <h6 className="fw-bold text-uppercase mb-1">Current Patient</h6>
                                <h1 className="display-1 fw-bold mb-0">
                                    {queue.find(q => q.appointment_status === 'Current')?.queue_number || '--'}
                                </h1>
                            </div>
                            <p className="mb-0 opacity-75">
                                <i className="bi bi-clock me-2"></i>
                                {activeWindow.start_time} - {activeWindow.end_time}
                            </p>
                        </div>
                    </div>
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-bottom-0 p-4">
                                <h4 className="fw-bold mb-0">Queue List</h4>
                            </div>
                            <div className="card-body p-0">
                                {loading && queue.length === 0 ? <div className="text-center p-5"><div className="spinner-border text-primary"></div></div> : 
                                 <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="ps-4">Queue #</th>
                                                <th>Patient Name</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {queue.map(q => (
                                                <tr key={q.appointment_id} className={q.appointment_status === 'Current' ? 'queue-active' : ''}>
                                                    <td className="ps-4 fw-bold text-primary fs-5">#{q.queue_number}</td>
                                                    <td className="fw-semibold">{q.patient_name}</td>
                                                    <td>
                                                        <span className={`badge ${getBadgeClass(q.appointment_status)} px-3 py-2 rounded-pill`}>
                                                            {q.appointment_status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {queue.length === 0 && (
                                                <tr><td colSpan="3" className="text-center p-4 text-muted">No patients in this queue.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                 </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default LiveQueue;
