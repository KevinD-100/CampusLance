import React from 'react';

const ProjectRoadmap = ({ milestones, currentStatus }) => {
    const steps = [
        { id: 'hired', label: 'Hired', icon: '🤝' },
        { id: 'in_progress', label: 'In Progress', icon: '⚙️' },
        { id: 'delivered', label: 'Draft Sent', icon: '📝' },
        { id: 'final_delivered', label: 'Final Delivery', icon: '🚀' },
        { id: 'completed', label: 'Completed', icon: '✅' }
    ];

    // Determine current index based on status mapping
    const statusMap = {
        'pending': 0,
        'in_progress': 1,
        'draft_delivered': 2,
        'final_delivered': 3,
        'completed': 4,
        'revision_requested': 1 // Reverts to in_progress
    };

    const currentIndex = statusMap[currentStatus] || 0;

    return (
        <div style={{ marginTop: '20px', padding: '15px', background: '#F7FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                {/* Connecting Line */}
                <div style={{
                    position: 'absolute', top: '15px', left: '10%', right: '10%', height: '2px', background: '#E2E8F0', zIndex: 1
                }}></div>
                <div style={{
                    position: 'absolute', top: '15px', left: '10%', width: `${(currentIndex / (steps.length - 1)) * 80}%`, height: '2px', background: '#3182CE', zIndex: 1, transition: 'width 0.5s ease'
                }}></div>

                {steps.map((step, idx) => {
                    const isCompleted = idx < currentIndex;
                    const isActive = idx === currentIndex;

                    return (
                        <div key={step.id} style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%' }}>
                            <div style={{
                                width: '30px', height: '30px', borderRadius: '50%', background: isCompleted ? '#3182CE' : isActive ? 'white' : '#EDF2F7',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: isActive ? '2px solid #3182CE' : '2px solid transparent',
                                color: isCompleted ? 'white' : '#A0AEC0', transition: 'all 0.3s'
                            }}>
                                {isCompleted ? '✓' : step.icon}
                            </div>
                            <span style={{ fontSize: '0.65rem', marginTop: '8px', color: isActive ? '#3182CE' : '#718096', fontWeight: isActive ? 'bold' : 'normal', textAlign: 'center' }}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProjectRoadmap;
