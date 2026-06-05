import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ total_appointments: 0, total_patients: 0, total_certificates: 0, total_prescriptions: 0 });
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [windows, setWindows] = useState([]);
    const [newPost, setNewPost] = useState({ title: '', content: '', category: 'Wellness', image_url: '' });
    const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role_id: '4' });
    const [showAddUser, setShowAddUser] = useState(false);
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'posts', 'feedbacks', 'windows'
    
    useEffect(() => {
        fetchStats();
        fetchUsers();
        fetchPosts();
        fetchFeedbacks();
        fetchWindows();
    }, []);

    const fetchWindows = async () => {
        try {
            const res = await api.get('/admin/get_appointment_windows');
            setWindows(res.data);
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

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/get_stats');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/get_users');
            setUsers(res.data);
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

    const toggleStatus = async (user_id, current_status) => {
        const newStatus = current_status === 'Active' ? 'Blocked' : 'Active';
        try {
            await api.post('/admin/update_user_status', { user_id, status: newStatus });
            fetchUsers();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to update user status' });
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/create_user', newUser);
            setNewUser({ full_name: '', email: '', password: '', role_id: '4' });
            setShowAddUser(false);
            fetchUsers();
            Swal.fire('Success!', 'User created successfully!', 'success');
        } catch (err) {
            Swal.fire('Error!', err.response?.data?.message || 'Failed to create user', 'error');
        }
    };

    const handleUpdateMaxSlots = async (window_id, max_slots) => {
        try {
            await api.post('/admin/update_window_slots', { window_id, max_slots: parseInt(max_slots) });
            fetchWindows();
            Swal.fire('Success!', 'Maximum patients updated successfully!', 'success');
        } catch (err) {
            Swal.fire('Error!', err.response?.data?.message || 'Failed to update slots', 'error');
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        try {
            await api.post('/healthpost/create', newPost);
            setNewPost({ title: '', content: '', category: 'Wellness', image_url: '' });
            fetchPosts();
            Swal.fire('Success!', 'Post created successfully!', 'success');
        } catch (err) {
            Swal.fire('Error!', 'Failed to create post', 'error');
        }
    };

    const handleDeletePost = async (post_id) => {
        const result = await Swal.fire({
            title: 'Delete post?',
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
            Swal.fire('Deleted!', 'Post has been deleted.', 'success');
        } catch (err) {
            Swal.fire('Error!', 'Failed to delete post', 'error');
        }
    };

    return (
        <div className="container py-4 animate-fade-in">
            {/* Dashboard Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">Admin Dashboard</h2>
                <Link to="/profile" className="btn btn-outline-primary rounded-pill px-4 shadow-sm">
                    <i className="bi bi-person-gear me-2"></i> Edit Profile
                </Link>
            </div>
            
            {/* Stats Cards */}
            <div className="row g-4 mb-5">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-primary text-white p-4 rounded-4">
                        <h6 className="opacity-75 text-uppercase fw-bold mb-1 small">Total Patients</h6>
                        <h2 className="display-5 fw-bold mb-0">{stats.total_patients}</h2>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-success text-white p-4 rounded-4">
                        <h6 className="opacity-75 text-uppercase fw-bold mb-1 small">Appointments</h6>
                        <h2 className="display-5 fw-bold mb-0">{stats.total_appointments}</h2>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-warning text-dark p-4 rounded-4">
                        <h6 className="opacity-75 text-uppercase fw-bold mb-1 small">Certificates</h6>
                        <h2 className="display-5 fw-bold mb-0">{stats.total_certificates}</h2>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-info text-white p-4 rounded-4">
                        <h6 className="opacity-75 text-uppercase fw-bold mb-1 small">Prescriptions</h6>
                        <h2 className="display-5 fw-bold mb-0">{stats.total_prescriptions}</h2>
                    </div>
                </div>
            </div>

            {/* Dashboard Navigation Tabs */}
            <ul className="nav nav-pills mb-4 gap-2 bg-light p-2 rounded-4 d-inline-flex border-0">
                <li className="nav-item">
                    <button className={`nav-link rounded-pill px-4 fw-semibold border-0 ${activeTab === 'users' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`} onClick={() => setActiveTab('users')}>
                        <i className="bi bi-people me-2"></i> User Management
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link rounded-pill px-4 fw-semibold border-0 ${activeTab === 'posts' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`} onClick={() => setActiveTab('posts')}>
                        <i className="bi bi-journal-medical me-2"></i> Manage Health Posts
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link rounded-pill px-4 fw-semibold border-0 ${activeTab === 'feedbacks' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`} onClick={() => setActiveTab('feedbacks')}>
                        <i className="bi bi-chat-left-heart me-2"></i> Patient Feedback
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link rounded-pill px-4 fw-semibold border-0 ${activeTab === 'windows' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`} onClick={() => setActiveTab('windows')}>
                        <i className="bi bi-clock me-2"></i> Appointment Slots
                    </button>
                </li>
            </ul>

            {/* User Management Tab */}
            {activeTab === 'users' && (
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                    <div className="card-header bg-white border-bottom-0 p-4 d-flex justify-content-between align-items-center">
                        <h4 className="fw-bold mb-0 text-dark">User Management</h4>
                        <button className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={() => setShowAddUser(!showAddUser)}>
                            <i className={`bi ${showAddUser ? 'bi-dash' : 'bi-plus-lg'} me-2`}></i> {showAddUser ? 'Close Form' : 'Add New User'}
                        </button>
                    </div>

                    {showAddUser && (
                        <div className="card-body bg-light border-bottom p-4">
                            <form onSubmit={handleAddUser} className="row g-3">
                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">FULL NAME</label>
                                    <input type="text" className="form-control rounded-pill px-3" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} required />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">EMAIL</label>
                                    <input type="email" className="form-control rounded-pill px-3" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">PASSWORD</label>
                                    <input type="password" className="form-control rounded-pill px-3" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">ROLE</label>
                                    <select className="form-select rounded-pill px-3" value={newUser.role_id} onChange={e => setNewUser({...newUser, role_id: e.target.value})}>
                                        <option value="4">Patient</option>
                                        <option value="2">Doctor</option>
                                        <option value="3">Receptionist</option>
                                        <option value="1">Admin</option>
                                    </select>
                                </div>
                                <div className="col-md-2 d-flex align-items-end">
                                    <button type="submit" className="btn btn-success rounded-pill px-4 w-100">Create</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light text-secondary">
                                    <tr>
                                        <th className="ps-4">ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th className="text-end pe-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.user_id}>
                                            <td className="ps-4 text-muted">#{u.user_id}</td>
                                            <td className="fw-semibold text-dark">{u.full_name}</td>
                                            <td className="text-muted">{u.email}</td>
                                            <td><span className="badge bg-secondary rounded-pill px-3">{u.role_name}</span></td>
                                            <td>
                                                <span className={`badge bg-${u.account_status === 'Active' ? 'success' : 'danger'} rounded-pill px-3`}>
                                                    {u.account_status}
                                                </span>
                                            </td>
                                            <td className="text-end pe-4">
                                                {u.role_name !== 'Admin' && (
                                                    <div className="d-flex gap-2 justify-content-end">
                                                        <button 
                                                            className={`btn btn-sm ${u.account_status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'} rounded-pill px-3`}
                                                            onClick={() => toggleStatus(u.user_id, u.account_status)}
                                                        >
                                                            {u.account_status === 'Active' ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Health Posts Tab */}
            {activeTab === 'posts' && (
                <div className="row g-4">
                    {/* Create Post Form */}
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

                    {/* Existing Posts */}
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
                                                <td className="text-dark py-3">{f.feedback_text}</td>
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

            {/* Appointment Windows Tab */}
            {activeTab === 'windows' && (
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-white border-bottom-0 p-4">
                        <h4 className="fw-bold mb-0 text-dark">Appointment Windows Management</h4>
                        <p className="text-muted small mb-0">Set the maximum number of patients allowed for each time slot.</p>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light text-secondary">
                                    <tr>
                                        <th className="ps-4">Window Name</th>
                                        <th>Time Schedule</th>
                                        <th>Current Max Slots</th>
                                        <th className="text-end pe-4">Update Slots</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {windows.map(win => (
                                        <tr key={win.window_id}>
                                            <td className="ps-4 fw-bold">{win.window_name}</td>
                                            <td>
                                                <span className="badge bg-light text-dark border rounded-pill px-3">
                                                    {win.start_time.substring(0, 5)} - {win.end_time.substring(0, 5)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="bi bi-people text-primary"></i>
                                                    <span className="fw-bold fs-5">{win.max_slots}</span>
                                                    <span className="text-muted small">patients</span>
                                                </div>
                                            </td>
                                            <td className="text-end pe-4">
                                                <div className="d-flex justify-content-end align-items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        className="form-control form-control-sm rounded-pill px-3" 
                                                        style={{ width: '80px' }}
                                                        defaultValue={win.max_slots}
                                                        min="1"
                                                        id={`slots-${win.window_id}`}
                                                    />
                                                    <button 
                                                        className="btn btn-sm btn-primary rounded-pill px-3"
                                                        onClick={() => {
                                                            const val = document.getElementById(`slots-${win.window_id}`).value;
                                                            handleUpdateMaxSlots(win.window_id, val);
                                                        }}
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
