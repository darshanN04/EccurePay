import React, { useState } from 'react';
import img from '../assets/img.png';
import '../styles/signup.css';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [age, setAge] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const validateForm = () => {
        // Reset previous error/success messages
        setError('');
        setSuccess('');

        if (!username || !phone || !email || !age || !password || !confirm) {
            setError("All fields are required.");
            return false;
        }
        if (password !== confirm) {
            setError("Passwords do not match.");
            return false;
        }
        if (phone.length < 10 || phone.length > 15) {
            setError("Enter a valid phone number.");
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) { // Basic email validation
            setError("Enter a valid email address.");
            return false;
        }
        if (age <= 0) {
            setError("Enter a valid age.");
            return false;
        }
        return true;
    };

    const handleSignup = async () => {
        if (validateForm()) {
            try {
                const response = await fetch('http://localhost:5000/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username,
                        phone,
                        email,
                        age,
                        password
                    })
                });
                console.log(username);
                const data = await response.json();
    
                if (response.ok) { // Check for successful response
                    setSuccess("Account created successfully!");
                    setTimeout(() => navigate('/login'), 2000);
                } else {
                    setError(data.message || "Signup failed. Please try again.");
                }
            } catch (err) {
                console.error("Error:", err);
                setError("An error occurred. Please try again.");
            }
        }
    };
    

    return (
        <div className='body'>
            <div className='signup-box'>
                <div className='leftcol'>
                    <label className='signup-label'>Sign up</label>
                    <hr className='signup-sep' />
                    {error && <div className='error'>{error}</div>}
                    {success && <div className='success'>{success}</div>}
                </div>
                <div className='midcol'>
                    <div className='mid-row1'>
                        <div className='line1'>
                            <input type='text' placeholder='Username' className='username-in' value={username} onChange={(e) => setUsername(e.target.value)} required />
                            <input type='tel' placeholder='Phone number' className='phone-in' value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                        <div className='line2'>
                            <input type='email' placeholder='Email' className='email-in' value={email} onChange={(e) => setEmail(e.target.value)} />
                            <input type="number" placeholder='Age' className='age-in' value={age} onChange={(e) => setAge(e.target.value)} />
                        </div>
                        <div className='line3'>
                            <input type='password' placeholder='Password' className='password-in' value={password} onChange={(e) => setPassword(e.target.value)} />
                            <input type='password' placeholder='Confirm Password' className='confirm-in' value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                        </div>
                    </div>
                    <div className='mid-row2'>
                        <button className='signup-btn' onClick={handleSignup}>Submit</button>
                    </div>
                </div>
                <div className='rightcol'>
                    <img src={img} alt="Illustration" className='img' />
                </div>
            </div>
        </div>
    );
}

export default Signup;
