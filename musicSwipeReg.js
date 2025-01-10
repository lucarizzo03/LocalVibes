import React, { useState } from "react";

function MusicReg() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmitFunc = async (event) => {
        event.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:4000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name, 
                    email: formData.email,
                    password: formData.password
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Registration failed.');
                return;
            }

            const data = await response.json();

            if (data.message === 'User registered successfully') {
                alert('Registration successful!');
                window.location.href = '/musicLog';
            } else {
                setError(data.message || 'Registration failed.');
            }
        } catch (err) {
            console.error('Error during registration:', err);
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div className="auth-page">
            <h1>Register for MusicSwipe</h1>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmitFunc}>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Register</button>
            </form>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                    onClick={() => (window.location.href = '/musicLog')}
                    style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#007bff',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                    }}
                >
                    Already registered? Login here
                </button>
            </div>
        </div>
    );
}

export default MusicReg;
