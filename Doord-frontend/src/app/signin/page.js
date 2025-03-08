'use client';
import Image from "next/image";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './signin.css'; // Keeping the same CSS file for consistency
import Google from './../assets/Google.png';
import Facebook from './../assets/Facebook.png';
import Apple from './../assets/Apple.png';
import Arrow from './../assets/arrow-right.png';

export default function SignIn() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('https://doord.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token); // Store token if needed
        router.push('/'); // Redirect to homepage after successful login
      } else {
        setError(data.errors || 'Login failed.');
      }
    } catch (err) {
      setError('Login failed.');
    }
  };

  return (
    <div>
      <div className='container1'>
        <div className='head3'>
          Not a member yet? <Link href="/signup">JOIN NOW</Link>
        </div>
      </div>
      
      <div className='signup-container'>
        <div className='signupheads'>
          <div className='head1'>WELCOME BACK EXCLUSIVE MEMBER</div>
          <div className='head2'>Sign in to continue</div>
        </div>

        <form onSubmit={handleSubmit} className='inputs-form'>
          <div className='input-order'>
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className='input-order'>
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          
          <button className="signinbtn" type="submit"> <div> Proceed to my Account</div>
          <Image src={Arrow} alt="Go" className="social-icon" width={40} height={40} /> </button>
        </form>

        <div className='oruseconts'><div className='oruse'> OR USE </div></div>

        <div className='otherbtns'>
          <Image src={Google} alt="Google" className="social-icon" width={40} height={40} />
          <Image src={Apple} alt="Apple" className="social-icon" width={40} height={40} />
          <Image src={Facebook} alt="Facebook" className="social-icon" width={40} height={40} />
        </div>

        <div className='oruseconts'><div className='oruse'> <Link href="/forgotpassword" className='forgot-password'>Having Issues with your password?</Link></div></div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
}
