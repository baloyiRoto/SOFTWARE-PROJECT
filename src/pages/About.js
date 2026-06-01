import React from 'react';
import { NavLink } from 'react-router-dom';
import '../App.css';

function About() {
  return (
    <main className="auth-shell">
      <section className="auth-card auth-card-wide">
        <div className="auth-badge">About Us</div>
        <h1>Meet the StudentHub Team</h1>
        
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--purple-dark)', marginBottom: '16px' }}>Who We Are</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--muted)', marginBottom: '20px' }}>
            StudentHub was created by a passionate team of 5 developers who understand the challenges students face in managing their daily lives. Our mission is to provide a comprehensive platform that helps students track their expenses, manage budgets, and plan their meals efficiently.
          </p>
          
          <h2 style={{ fontSize: '1.3rem', color: 'var(--purple-dark)', marginBottom: '16px' }}>Our Mission</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--muted)', marginBottom: '20px' }}>
            We believe that every student deserves access to tools that simplify their financial management and meal planning. By combining expense tracking, budget management, and meal planning into one intuitive platform, we aim to help students make better financial decisions and reduce food waste.
          </p>
          
          <h2 style={{ fontSize: '1.3rem', color: 'var(--purple-dark)', marginBottom: '16px' }}>What We Offer</h2>
          <ul style={{ lineHeight: '1.8', color: 'var(--muted)', marginBottom: '20px' }}>
            <li><strong>SpendSmart:</strong> Track expenses, set budgets, and generate detailed reports</li>
            <li><strong>MealMate:</strong> Manage inventory, generate AI-powered recipes, and create shopping lists</li>
            <li><strong>User-Friendly Interface:</strong> Clean, intuitive design built with students in mind</li>
            <li><strong>Data Privacy:</strong> Your data stays on your device - we don't store your information on external servers</li>
          </ul>
          
          <h2 style={{ fontSize: '1.3rem', color: 'var(--purple-dark)', marginBottom: '16px' }}>Get in Touch</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--muted)' }}>
            Have questions or feedback? We'd love to hear from you! Visit our Contact page to reach out to our team.
          </p>
        </div>
        
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <NavLink className="landing-btn landing-btn-primary" to="/">Back to Home</NavLink>
        </div>
      </section>
    </main>
  );
}

export default About;
