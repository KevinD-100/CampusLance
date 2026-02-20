import React, { useState, useEffect } from 'react';
import '../pages/Dashboard.css'; // Re-use dashboard styles

const SkillAssessment = ({ user, onComplete }) => {
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [quizFinished, setQuizFinished] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    // Expanded Question Bank
    const quizzes = [
        {
            id: 1,
            title: 'React.js Mastery',
            icon: '⚛️',
            description: 'Prove your component courage!',
            questions: [
                { q: "What hook handles side effects?", o: ["useState", "useEffect", "useContext", "useReducer"], a: "useEffect" },
                { q: "JSX stands for?", o: ["JS XML", "Java X", "JSON X", "None"], a: "JS XML" },
                { q: "How do you pass data to child?", o: ["State", "Props", "Context", "Ref"], a: "Props" },
                { q: "Virtual DOM is...?", o: ["Slow", "Real DOM copy", "In-memory rep", "Browser API"], a: "In-memory rep" }
            ]
        },
        {
            id: 2,
            title: 'Freelancing 101',
            icon: '💼',
            description: 'Soft skills for hard cash.',
            questions: [
                { q: "Best way to start a proposal?", o: ["Hi Sir", "Personalized greeting", "Copy-paste generic", "Just price"], a: "Personalized greeting" },
                { q: "Client asks for free work?", o: ["Do it", "Politely refuse", "Ignore", "Report"], a: "Politely refuse" },
                { q: "Project scope creep means?", o: ["More work, same pay", "Scary project", "Fast work", "None"], a: "More work, same pay" },
                { q: "Crucial for long-term success?", o: ["Low prices", "Communication", "24/7 aval.", "Luck"], a: "Communication" }
            ]
        },
        {
            id: 3,
            title: 'UI/UX Design',
            icon: '🎨',
            description: 'Create interfaces that convert.',
            questions: [
                { q: "What is Contrast?", o: ["Difference in color", "Size", "Shape", "None"], a: "Difference in color" },
                { q: "Primary goal of UX?", o: ["Look pretty", "User satisfaction", "Use animation", "Code clean"], a: "User satisfaction" },
                { q: "White space is...?", o: ["Wasted space", "Breathing room", "Bad design", "Color white"], a: "Breathing room" },
                { q: "F-Pattern refers to?", o: ["Coding style", "Scanning layout", "Color wheel", "Font size"], a: "Scanning layout" }
            ]
        }
    ];

    // Timer Logic
    useEffect(() => {
        if (activeQuiz && !quizFinished && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !quizFinished) {
            handleNext(false); // Time out = wrong answer
        }
    }, [timeLeft, activeQuiz, quizFinished]);

    const startQuiz = (quiz) => {
        setActiveQuiz(quiz);
        setCurrentQuestion(0);
        setScore(0);
        setTimeLeft(15);
        setQuizFinished(false);
        setShowCelebration(false);
    };

    const handleAnswer = (selectedOption) => {
        const isCorrect = selectedOption === activeQuiz.questions[currentQuestion].a;
        if (isCorrect) setScore(prev => prev + 10);
        handleNext(isCorrect);
    };

    const handleNext = (lastWasCorrect) => {
        if (currentQuestion + 1 < activeQuiz.questions.length) {
            setCurrentQuestion(prev => prev + 1);
            setTimeLeft(15); // Reset timer
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = () => {
        setQuizFinished(true);
        setShowCelebration(true);

        // Submit Score to Backend
        // (Assuming exact route from before, but we can update if needed)
        fetch('http://localhost:5000/api/quiz/submit', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, score: score })
        }).catch(err => console.error("Score submit error", err));

        if (onComplete) onComplete();
    };

    const getBadge = () => {
        const percentage = (score / (activeQuiz.questions.length * 10)) * 100;
        if (percentage >= 100) return { label: "🏆 GOLD", color: "#FFD700", glow: "0 0 20px #FFD700" };
        if (percentage >= 70) return { label: "🥈 SILVER", color: "#C0C0C0", glow: "0 0 15px #C0C0C0" };
        if (percentage >= 50) return { label: "🥉 BRONZE", color: "#CD7F32", glow: "0 0 10px #CD7F32" };
        return { label: "👶 NOVICE", color: "#718096", glow: "none" };
    };

    return (
        <div className="animate-fade-in">
            <h3 className="section-title">⚔️ Skill Assessment Arena</h3>

            {!activeQuiz ? (
                <div className="gigs-grid">
                    {quizzes.map(q => (
                        <div key={q.id} className="quiz-card tilt-card" onClick={() => startQuiz(q)}>
                            <div className="quiz-icon">{q.icon}</div>
                            <h4>{q.title}</h4>
                            <p>{q.description}</p>
                            <div className="quiz-meta">
                                <span>{q.questions.length} Qs</span>
                                <span>•</span>
                                <span>Blitz Mode</span>
                            </div>
                            <button className="start-quiz-btn">Enter Arena</button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="quiz-arena-container">
                    {!quizFinished ? (
                        <div className="active-quiz-card">
                            <div className="quiz-header">
                                <h4>{activeQuiz.title}</h4>
                                <div className="timer-badge" style={{ color: timeLeft < 5 ? 'red' : 'inherit' }}>
                                    ⏱️ {timeLeft}s
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="progress-track">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${((currentQuestion) / activeQuiz.questions.length) * 100}%` }}
                                ></div>
                            </div>

                            <div className="question-box">
                                <span className="q-num">Question {currentQuestion + 1} of {activeQuiz.questions.length}</span>
                                <p className="q-text">{activeQuiz.questions[currentQuestion].q}</p>
                            </div>

                            <div className="options-grid">
                                {activeQuiz.questions[currentQuestion].o.map(opt => (
                                    <button
                                        key={opt}
                                        className="quiz-option-btn"
                                        onClick={() => handleAnswer(opt)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="quiz-result-card animate-pop-in">
                            <div className="result-header">
                                <h2>Assessment Complete!</h2>
                            </div>

                            <div className="badge-reveal" style={{ boxShadow: getBadge().glow, borderColor: getBadge().color }}>
                                <span style={{ fontSize: '3rem' }}>{activeQuiz.icon}</span>
                                <h3 style={{ color: getBadge().color }}>{getBadge().label}</h3>
                            </div>

                            <p className="score-text">You Scored: <strong>{score}</strong> Points</p>
                            <p style={{ color: '#718096', marginBottom: '20px' }}>
                                {score >= 20 ? "Great job! This badge is now on your profile." : "Keep practicing to earn a higher rank!"}
                            </p>

                            <button className="btn-primary" onClick={() => setActiveQuiz(null)}>Back to Arena</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SkillAssessment;
