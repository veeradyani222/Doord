'use client';
import Image from "next/image";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './SignUp.css'
import Google from './../assets/Google.svg'
import Facebook from './../assets/Facebook.svg'
import Apple from './../assets/Apple.svg'


export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('signup'); // 'signup' or 'otpVerification'
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    
    try {
      const response = await fetch('https://doord.onrender.com/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setStep('otpVerification'); // Move to OTP verification step
      } else {
        setError(data.errors || 'Signup failed.');
      }
    } catch (err) {
      setError('Signup failed.');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    
    try {
      const response = await fetch('https://doord.onrender.com/verify-email', { // Use the correct backend route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, verificationCode: otp }), // Change "otp" to "verificationCode"
      });
  
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        router.push('/'); // Redirect to home on success
      } else {
        setError(data.errors || 'OTP verification failed.');
      }
    } catch (err) {
      setError('OTP verification failed.');
    }
  };

  return (
    <div > 
    <div className='container1'>  <div className='head3'>
    Are you already a member? <Link href="/signin">Sign In</Link>
  </div></div>
    <div className='signup-container'>
      {step === 'signup' ? (
        <div>
      
        <div className='signupheads'>
        <div className='head1'>CREATE AN ACCOUNT</div>
        <div className='head2'>Let's get you started</div>
        </div>
          <form onSubmit={handleSubmit} className='inputs-form'>
            <div className='input-order'>
              <label>Your Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className='input-order'>
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className='input-order'>
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>
            <button type="submit">Get Started</button>
          </form>
          <div className='orusecont'><div className='oruse'> Or Use </div></div>
          <div className='otherbtns'>
  <Image src={Google} alt="Google" className="social-icon" width={40} height={40} />
  <Image src={Apple} alt="Apple" className="social-icon" width={40} height={40} />
  <Image src={Facebook} alt="Facebook" className="social-icon" width={40} height={40} />
</div>
        </div>
      ) : (
        <div>
          <h2>Verify OTP</h2>
          <form onSubmit={handleOtpSubmit}>
            <div>
              <label>Enter OTP</label>
              <input type="text" name="otp" value={otp} onChange={handleOtpChange} required />
            </div>
            <button type="submit">Verify OTP</button>
          </form>
        </div>
      )}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
    </div>
  );
}
