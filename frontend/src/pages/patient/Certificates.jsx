import { useState, useEffect } from 'react';
import api from '../../api/axios';

const Certificates = () => {
    const [formData, setFormData] = useState({ start_date: '', end_date: '', reason: '' });
    const [proofFile, setProofFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Documents list states
    const [certificates, setCertificates] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [activeTab, setActiveTab] = useState('request'); // 'request', 'documents'

    useEffect(() => {
        if (activeTab === 'documents') {
            fetchDocuments();
        }
    }, [activeTab]);

    const fetchDocuments = async () => {
        try {
            // Fetch certificates
            const resCerts = await api.get('/certificate/get_patient_certificates');
            setCertificates(resCerts.data);
            
            // Fetch prescriptions
            const resPresc = await api.get('/prescription/get_patient_prescriptions');
            setPrescriptions(resPresc.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const data = new FormData();
        data.append('start_date', formData.start_date);
        data.append('end_date', formData.end_date);
        data.append('reason', formData.reason);
        data.append('proof_pdf', proofFile);

        try {
            await api.post('/certificate/request', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: 'Certificate request submitted successfully.' });
            setFormData({ start_date: '', end_date: '', reason: '' });
            setProofFile(null);
        } catch (err) {
            setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to submit request.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-4 animate-fade-in">
            <h2 className="fw-bold mb-4">Certificates & Prescriptions</h2>

            {/* Navigation Tabs */}
            <ul className="nav nav-pills mb-4 gap-2 bg-light p-2 rounded-4 d-inline-flex border-0 shadow-sm">
                <li className="nav-item">
                    <button className={`nav-link rounded-pill px-4 fw-semibold border-0 ${activeTab === 'request' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`} onClick={() => setActiveTab('request')}>
                        <i className="bi bi-file-earmark-plus me-2"></i> Request Medical Certificate
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link rounded-pill px-4 fw-semibold border-0 ${activeTab === 'documents' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`} onClick={() => setActiveTab('documents')}>
                        <i className="bi bi-folder2-open me-2"></i> My Documents
                    </button>
                </li>
            </ul>

            {/* Request Certificate Tab */}
            {activeTab === 'request' && (
                <div className="row">
                    <div className="col-lg-8">
                        <div className="card p-4 p-md-5 border-0 shadow-sm rounded-4 bg-white">
                            <h4 className="fw-bold text-dark mb-4 border-bottom pb-2">New Certificate Request</h4>
                            {message.text && (
                                <div className={`alert alert-${message.type} alert-dismissible fade show rounded-4 d-flex align-items-center gap-2 mb-4`} role="alert">
                                    <i className={message.type === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-triangle-fill'}></i>
                                    <div>{message.text}</div>
                                    <button type="button" className="btn-close" onClick={() => setMessage({type:'', text:''})}></button>
                                </div>
                            )}
                            <form onSubmit={handleSubmit}>
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-secondary small">START DATE</label>
                                        <input type="date" className="form-control rounded-pill px-3" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-secondary small">END DATE</label>
                                        <input type="date" className="form-control rounded-pill px-3" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} required />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold text-secondary small">REASON FOR MEDICAL LEAVE</label>
                                    <textarea className="form-control rounded-4 p-3" rows="4" placeholder="Explain your illness/condition..." value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} required></textarea>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-semibold text-secondary small">UPLOAD MEDICAL PROOF (PDF/IMAGE)</label>
                                    <input type="file" className="form-control rounded-pill px-3" accept=".pdf,image/*" onChange={e => setProofFile(e.target.files[0])} required />
                                    <div className="form-text text-muted small px-2">Please upload a valid scan/photo of your clinical prescription or report.</div>
                                </div>
                                <button type="submit" className="btn btn-primary rounded-pill px-5 py-2 shadow-sm fw-bold hover-grow" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Request'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* My Documents Tab */}
            {activeTab === 'documents' && (
                <div className="row g-4">
                    {/* Medical Certificates List */}
                    <div className="col-lg-6">
                        <div className="card p-4 rounded-4 border-0 shadow-sm bg-white h-100">
                            <h4 className="fw-bold text-dark mb-4 border-bottom pb-2">
                                <i className="bi bi-file-earmark-medical text-primary me-2"></i> Approved Certificates
                            </h4>
                            {certificates.length > 0 ? (
                                <div className="d-flex flex-column gap-3">
                                    {certificates.map(cert => (
                                        <div key={cert.certificate_id} className="card border-0 bg-light p-3 rounded-4 shadow-sm small hover-grow">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className={`badge rounded-pill px-3 py-1 fw-semibold ${cert.status === 'Approved' ? 'bg-success-subtle text-success' : (cert.status === 'Pending' ? 'bg-warning-subtle text-warning' : 'bg-danger-subtle text-danger')}`}>
                                                    {cert.status}
                                                </span>
                                                <span className="text-muted small">{new Date(cert.requested_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="mb-1"><strong>Period:</strong> {cert.start_date} to {cert.end_date}</p>
                                            <p className="mb-1 text-muted"><strong>Reason:</strong> {cert.reason}</p>
                                            {cert.doctor_name && <p className="mb-1 text-muted"><strong>Reviewed By:</strong> Dr. {cert.doctor_name}</p>}
                                            {cert.rejection_reason && <p className="mb-1 text-danger"><strong>Rejection Reason:</strong> {cert.rejection_reason}</p>}
                                            
                                            {cert.status === 'Approved' && cert.certificate_pdf && (
                                                <a 
                                                    href={`http://localhost/medsync3/uwu-medsync-api/uploads/generated_pdfs/${cert.certificate_pdf}`} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="btn btn-outline-primary btn-sm rounded-pill mt-3 shadow-sm text-decoration-none text-center"
                                                >
                                                    <i className="bi bi-download me-1"></i> Download Certificate PDF
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-folder-x display-6"></i>
                                    <p className="mt-2 mb-0">No medical certificates found.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* e-Prescriptions List */}
                    <div className="col-lg-6">
                        <div className="card p-4 rounded-4 border-0 shadow-sm bg-white h-100">
                            <h4 className="fw-bold text-dark mb-4 border-bottom pb-2">
                                <i className="bi bi-prescription text-success me-2"></i> My e-Prescriptions
                            </h4>
                            {prescriptions.length > 0 ? (
                                <div className="d-flex flex-column gap-3">
                                    {prescriptions.map(presc => (
                                        <div key={presc.prescription_id} className="card border-0 bg-light p-3 rounded-4 shadow-sm small hover-grow">
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="fw-bold text-success">Prescription #{presc.prescription_id}</span>
                                                <span className="text-muted small">{new Date(presc.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="mb-1"><strong>Doctor:</strong> Dr. {presc.doctor_name}</p>
                                            <div className="bg-white p-2 rounded-3 my-2 small border-start border-success border-3">
                                                <strong>Medicines:</strong>
                                                <div className="text-secondary whitespace-pre">{presc.medicines}</div>
                                                {presc.dosage && <div className="text-muted text-xs">Dosage: {presc.dosage}</div>}
                                                {presc.instructions && <div className="text-muted text-xs">Instructions: {presc.instructions}</div>}
                                            </div>
                                            
                                            {presc.prescription_pdf && (
                                                <a 
                                                    href={`http://localhost/medsync3/uwu-medsync-api/uploads/generated_pdfs/${presc.prescription_pdf}`} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="btn btn-outline-success btn-sm rounded-pill mt-2 shadow-sm text-decoration-none text-center"
                                                >
                                                    <i className="bi bi-download me-1"></i> Download Prescription PDF
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-folder-x display-6"></i>
                                    <p className="mt-2 mb-0">No e-prescriptions found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Certificates;
