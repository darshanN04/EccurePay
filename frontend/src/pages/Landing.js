import React from 'react'
import '../styles/landing.css'
import { useNavigate } from 'react-router-dom'
import Steps from './steps2';
import Contact from './contact'; // Importing the Contact component


const Navbar = () => {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <h2 className="navbar_logo">Eccurepay</h2>
      <ul className="navbar_links">
        <li onClick={() => navigate('/')}>Home</li>
        <li onClick={() => navigate('/about')}>About Us</li>
      </ul>
    </nav>
  );
};

const Landing = () => {

  const navigate = useNavigate()
  return (
    <div className="landing">
      <Navbar />
      <h1 className="main_heading">Welcome to Eccurepay</h1>
      <p className="para">Here you can suggest your ideas and vote for the best ones!</p>
      <div className="buttons_landing">
        <button className="login_button" onClick={() => navigate('login')}>Login</button>
        <button className="signup_button" onClick={() => navigate('signup')}>Sign Up</button>
      </div>

      {/* Insert Steps component here */}
      <Steps
        step1Title="Create an Account"
        step1Description="Sign up for an EccurePay account by providing your email and creating a secure password."
        step2Title="Add Payment Method"
        step2Description="Add your preferred payment method to securely make transactions on EccurePay."
        step3Title="Make Secure Payments"
        step3Description="Enjoy making secure payments for your purchases with EccurePay's advanced security features."
        step4Title="Manage Transactions"
        step4Description="Easily track and manage your transactions through your EccurePay account dashboard."
      />

      {/* Add the Contact component here */}
      <Contact 
        content2="Our customer service team is available 24/7 to assist you."
        email1="support@eccurepay.com"
        address1="Manipal 576104, Karnataka, India"
        content3="Feel free to contact us via email or phone for any inquiries."
        content1="Have a question or need support? Reach out to us!"
        content4="We value your feedback and are here to help."
        heading1="Contact Us"
        content5="Stay connected with us for updates and news."
        phone1="+1-800-123-4567"
      />
    </div>
  )
}

export default Landing