import React, { useState } from "react";
import './musicSwipeLog.css'

function MusicLog() {
   const [formData, setFormData] = useState({
    email: '',
    pass: ''
   })

   const [error, setError] = useState('');

   const handChange = (e) => {
    setFormData({
        ...formData,
        [e.target.name]: e.target.value
    })
   };

    const handleSubmitFunc = async (event) => {
        event.preventDefault(); // no reloading of the page 
        setError('');

        try {
            const response = await fetch('http://localhost:4000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    pass: formData.pass
                })
            })

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Login Failed');
                return;
            }

            const data = await response.json();

            if (data.message === 'Bro is logged in') {
                alert('Bro Logged IN');
                window.location.href = '/musicDash';
            } else {
                setError(data.message || 'Login failed.');
            }
        }
        catch (err) {
            console.error('Error during login:', err);
            setError('An error occurred. Please try again.');
        }
    }

    const navigateToRegister = () => {
        window.location.href = '/musicReg';
    };

    return (
        <div className="auth-page">
            <h1>Login to MusicSwipe</h1>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmitFunc}>
            <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handChange}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        name="pass"
                        value={formData.pass}
                        onChange={handChange}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
            <button onClick={navigateToRegister}>Register</button>
          
        </div>
    );   
};

export default MusicLog;
