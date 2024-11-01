import React, { useState, useContext } from 'react';
import '../styles/login.css';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext';

const Login = () => {
    const { setUserId } = useContext(UserContext); // Use context to set userId
    const navigate = useNavigate();
    const [loginname, setLoginname] = useState('');
    const [loginpassword, setLoginpassword] = useState('');
    const [error, setError] = useState('');

    const validateForm = () => {
        if (!loginname || !loginpassword) {
            setError("Both fields are required.");
            return false;
        }
        setError('');
        return true;
    };

    const handleLogin = async () => {
        if (!validateForm())
            return;

        try {
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: loginname,
                    password: loginpassword
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                console.log("Login successful");
                setUserId(data.userId); // Store userId in context
                navigate('/CardPage');
            } else {
                alert(data.message); // Show the error message
            }
        } catch (err) {
            console.error("Error:", err);
            alert("An error occurred. Please try again.");
        }
    };

    return (
        <div className='body'>
            <div className="login_box">
                <div className='login_label'>Login</div>
                <hr className='login_label_sep' />
                {error && <div className='error'>{error}</div>}
                <div className='inputs'>
                    <input
                        type='text'
                        className="user_input1"
                        placeholder='Username'
                        value={loginname}
                        onChange={(e) => setLoginname(e.target.value)}
                    />
                    <input
                        type='password'
                        className="user_input2"
                        placeholder='Password'
                        value={loginpassword}
                        onChange={(e) => setLoginpassword(e.target.value)}
                    />
                </div>
                <div className='f_p'>
                    <label className='forgot_password'>Forgot password?</label>
                </div>
                <div className='buttons'>
                    <button className='submit_button' onClick={handleLogin}>Submit</button>
                    <button className='cancel_button' onClick={() => navigate(-1)}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

export default Login;
