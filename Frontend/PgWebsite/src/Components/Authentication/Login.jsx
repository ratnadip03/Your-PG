import React, { useState } from "react";
import { MdEmail } from "react-icons/md";
import { FaUnlockAlt } from "react-icons/fa";
// Note: If react-icons doesn't have FcGoogle, install: npm install react-icons
// For now using inline SVG as fallback
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const submit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await axios.post("http://localhost:5000/login", { email, password });
      toast.success("Login successful!");
      localStorage.setItem("token", res.data.token);
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err.response?.data?.error || "❌ Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };
  
  return (
    <section className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p className="login-subtitle">Sign in to your account</p>
          </div>
          
          <form onSubmit={submit} className="login-form">
            <div className="login-input-group">
              <label htmlFor="email">Email Address</label>
              <div className="login-input-field">
                <MdEmail className="login-icon" />
                <input 
                  id="email"
                  type="email" 
                  placeholder="Enter your email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>
            
            <div className="login-input-group">
              <label htmlFor="password">Password</label>
              <div className="login-input-field">
                <FaUnlockAlt className="login-icon" />
                <input 
                  id="password"
                  type="password" 
                  placeholder="Enter your password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>
            
            <div className="login-forgot-password">
              <Link to="/forgot-password" className="login-forgot-link">
                Forgot Password?
              </Link>
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Google OAuth Button */}
          <div style={{ margin: "20px 0", textAlign: "center" }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              margin: "10px 0",
              color: "#666",
              fontSize: "14px"
            }}>
              <div style={{ flex: 1, height: "1px", background: "#ddd" }}></div>
              <span style={{ padding: "0 15px" }}>OR</span>
              <div style={{ flex: 1, height: "1px", background: "#ddd" }}></div>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{
                width: "100%",
                padding: "12px",
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "5px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                fontSize: "16px",
                fontWeight: "500",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#f5f5f5";
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </div>
          
          <div className="login-register-prompt">
            <p>Don't have an account?</p>
            <Link to="/register" className="login-register-link">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;