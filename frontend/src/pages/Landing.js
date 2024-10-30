import React from 'react'
import '../styles/landing.css'
import { useNavigate } from 'react-router-dom'

const Landing = () => {


  
  const navigate = useNavigate()
  return (
    <div className='landing'>
        <h1 className='main_heading'>Welcome to Eccurepay</h1>
        <p className='para'>Here you can suggest your ideas and vote for the best ones!</p>
        <div className='buttons_landing'>
            <button className='login_button' onClick={() => navigate('login')}>Login</button>
            <button className='signup_button' onClick={() => navigate('signup')}>Sign Up</button>

        </div>
    </div>
  )
}

export default Landing