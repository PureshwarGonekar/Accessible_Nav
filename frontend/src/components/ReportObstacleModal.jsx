import React, { useState } from 'react';
import { X, AlertTriangle, AlertOctagon, Users, CloudRain, Clock, Camera, Accessibility } from 'lucide-react';
import api from '../api';
import { getCurrentLocation } from '../locationService';

const ReportObstacleModal = ({ onClose, onReportSubmitted }) => {
    const [type, setType] = useState('Construction');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // New Fields
    const [duration, setDuration] = useState('1 hour');
    const [affectsWheelchair, setAffectsWheelchair] = useState(false);
    const [photoUrl, setPhotoUrl] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');

    // Cleanup object URL on unmount or change
    React.useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileUpload = async (file) => {
        // Immediate local preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        const formData = new FormData();
        formData.append('image', file);

        setLoading(true);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Assuming backend returns full URL or relative path. 
            // If relative, we might relies on standard HTML behavior or need formatting.
            // But for submission, we want the server URL.
            setPhotoUrl(res.data.url);
        } catch (err) {
            console.error("Upload failed", err);
            alert("Failed to upload image.");
            setPreviewUrl(''); // Clear preview on failure
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const location = await getCurrentLocation();

            const payload = {
                type,
                message,
                location_lat: location.lat,
                location_lng: location.lng,
                expected_duration: duration,
                affects_wheelchair: affectsWheelchair,
                photo_url: photoUrl || null // Send null if empty
            };

            // Changed endpoint to /reports to match new backend logic
            await api.post('/reports', payload);

            onReportSubmitted();
            onClose();
            alert('Report submitted successfully! Thank you for helping the community.');
        } catch (err) {
            console.error('Failed to report obstacle:', err);
            alert('Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const types = [
        { value: 'Construction', label: 'Construction', icon: AlertTriangle },
        { value: 'Accident', label: 'Accident', icon: AlertOctagon },
        { value: 'Crowd', label: 'Crowd / Event', icon: Users },
        { value: 'Weather', label: 'Weather Hazard', icon: CloudRain },
        { value: 'Other', label: 'Other', icon: AlertTriangle },
    ];

    return (
        <div className="fade-in" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            <div className="card hide-scrollbar" style={{ width: '90%', maxWidth: '500px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        color: 'hsl(var(--text-muted))',
                        cursor: 'pointer'
                    }}
                >
                    <X size={24} />
                </button>

                <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertTriangle color="hsl(var(--warning))" />
                    Report Obstacle
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Obstacle Type</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {types.map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setType(t.value)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid',
                                        borderColor: type === t.value ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.1)',
                                        background: type === t.value ? 'rgba(100, 80, 255, 0.1)' : 'transparent',
                                        color: type === t.value ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    <t.icon size={20} />
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Expected Duration</label>
                            <div style={{ position: 'relative' }}>
                                <Clock size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'hsl(var(--text-muted))' }} />
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 10px 10px 34px',
                                        background: 'hsl(var(--bg-input))',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                    }}
                                >
                                    <option value="1 hour">1 Hour</option>
                                    <option value="4 hours">4 Hours</option>
                                    <option value="1 day">1 Day</option>
                                    <option value="1 week">1 Week</option>
                                    <option value="unknown">Unknown</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Accessibility size={20} color={affectsWheelchair ? 'hsl(var(--danger))' : 'white'} />
                            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Affects Wheelchair Users?</span>
                        </div>
                        <label className="switch">
                            <input type="checkbox" checked={affectsWheelchair} onChange={(e) => setAffectsWheelchair(e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    {/* Style for toggle switch */}
                    <style>{`
            .switch {
              position: relative;
              display: inline-block;
              width: 40px;
              height: 24px;
            }
            .switch input { 
              opacity: 0;
              width: 0;
              height: 0;
            }
            .slider {
              position: absolute;
              cursor: pointer;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: #ccc;
              transition: .4s;
            }
            .slider:before {
              position: absolute;
              content: "";
              height: 16px;
              width: 16px;
              left: 4px;
              bottom: 4px;
              background-color: white;
              transition: .4s;
            }
            input:checked + .slider {
              background-color: hsl(var(--primary));
            }
            input:focus + .slider {
              box-shadow: 0 0 1px hsl(var(--primary));
            }
            input:checked + .slider:before {
              transform: translateX(16px);
            }
            .slider.round {
              border-radius: 34px;
            }
            .slider.round:before {
              border-radius: 50%;
            }
          `}</style>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Photo (Optional)</label>
                        <div
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'hsl(var(--primary))'; }}
                            onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                            onDrop={async (e) => {
                                e.preventDefault();
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                const file = e.dataTransfer.files[0];
                                if (file) await handleFileUpload(file);
                            }}
                            style={{
                                border: '2px dashed rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                padding: '20px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: 'rgba(0,0,0,0.2)',
                                transition: 'border-color 0.2s',
                                position: 'relative'
                            }}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (file) await handleFileUpload(file);
                                }}
                            />

                            {previewUrl || photoUrl ? (
                                <div style={{ position: 'relative' }}>
                                    <img src={previewUrl || photoUrl} alt="Preview" style={{ maxHeight: '150px', borderRadius: '4px', maxWidth: '100%' }} />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setPhotoUrl('');
                                            setPreviewUrl('');
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '-10px',
                                            right: '-10px',
                                            background: 'hsl(var(--danger))',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ color: 'hsl(var(--text-muted))', pointerEvents: 'none' }}>
                                    <Camera size={24} style={{ marginBottom: '8px' }} />
                                    <div style={{ fontSize: '0.9rem' }}>Drag & Drop or Click to Upload</div>
                                    <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.7 }}>Supports JPG, PNG</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
                        <textarea
                            required
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe the obstacle (e.g. 'Ramp blocked by construction materials')"
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'hsl(var(--bg-input))',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'white',
                                minHeight: '80px',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{ marginTop: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        {loading ? 'Submitting...' : 'Submit Report'} <AlertTriangle size={18} />
                    </button>

                </form>
            </div>
        </div>
    );
};

export default ReportObstacleModal;
