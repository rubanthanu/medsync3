import { useState, useEffect } from 'react';
import api from '../../api/axios';

const BookAppointment = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [windows, setWindows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchWindows();
    }, [date]);

    const fetchWindows = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/appointment/get_windows?date=${date}`);
            setWindows(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const maxDate = new Date();
    maxDate.setDate(new Date().getDate() + 2);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    const handleBook = async (window_id) => {
        setMessage({ type: '', text: '' });
        try {
            const res = await api.post('/appointment/book', { window_id, appointment_date: date });
            setMessage({ type: 'success', text: `Success! Your queue number is ${res.data.queue_number}. Estimated time: ${res.data.estimated_time}` });
            fetchWindows(); // Refresh windows
        } catch (err) {
            setMessage({ type: 'danger', text: err.response?.data?.message || 'Booking failed' });
        }
    };

    return (
        <div className="container py-4 animate-fade-in">
            <h2 className="fw-bold mb-4">Book Appointment</h2>
            
            {message.text && (
                <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
                    {message.text}
                    <button type="button" className="btn-close" onClick={() => setMessage({ type:'', text:'' })}></button>
                </div>
            )}

            <div className="card border-0 shadow-sm p-4 mb-4">
                <div className="row align-items-center">
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Select Date</label>
                        <input 
                            type="date" 
                            className="form-control" 
                            value={date} 
                            min={new Date().toISOString().split('T')[0]}
                            max={maxDateStr}
                            onChange={(e) => setDate(e.target.value)} 
                        />
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {loading ? <div className="text-center py-5"><div className="spinner-border text-primary"></div></div> : 
                 windows.length > 0 ? (
                    windows.map(win => (
                        <div className="col-md-6" key={win.window_id}>
                            <div className={`card h-100 border-0 shadow-sm ${win.status === 'Full' ? 'bg-light opacity-75' : ''}`}>
                                <div className="card-body p-4 d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h4 className="fw-bold mb-0 text-primary">{win.window_name}</h4>
                                        <span className={`badge ${win.status === 'Full' ? 'bg-danger' : 'bg-success'} rounded-pill px-3 py-2`}>
                                            {win.status}
                                        </span>
                                    </div>
                                    <h6 className="text-muted mb-4">
                                        <i className="bi bi-clock me-2"></i>
                                        {win.start_time} - {win.end_time}
                                    </h6>
                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between small fw-bold mb-1">
                                            <span>Occupancy</span>
                                            <span>{win.booked_count} / {win.max_slots} Booked</span>
                                        </div>
                                        <div className="progress" style={{height: '8px'}}>
                                            <div 
                                                className={`progress-bar ${win.status === 'Full' ? 'bg-danger' : 'bg-primary'}`} 
                                                role="progressbar" 
                                                style={{width: `${(win.booked_count / win.max_slots) * 100}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                    <button 
                                        className="btn btn-primary w-100 mt-auto rounded-pill" 
                                        disabled={win.status === 'Full'}
                                        onClick={() => handleBook(win.window_id)}
                                    >
                                        {win.status === 'Full' ? 'Fully Booked' : 'Book Slot'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                 ) : (
                    <div className="col-12 text-center py-5">
                        <div className="bg-light p-5 rounded-4">
                            <i className="bi bi-calendar-x text-muted display-1"></i>
                            <h4 className="mt-4 fw-bold">No Slots Available</h4>
                            <p className="text-muted">There are no doctors available or appointments open for the selected date. Please try another date.</p>
                        </div>
                    </div>
                 )}
            </div>
        </div>
    );
};
export default BookAppointment;
