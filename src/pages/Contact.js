import React from 'react';
import { NavLink } from 'react-router-dom';
import '../App.css';

function Contact() {
  return (
    <main className="auth-shell">
      <section className="auth-card auth-card-wide">
        <div className="auth-badge">Contact Us</div>
        <h1>Get in Touch</h1>
        
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--purple-dark)', marginBottom: '16px' }}>Contact Information</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>Email</h3>
            <p style={{ lineHeight: '1.6', color: 'var(--muted)' }}>
              <a href="mailto:admin@spendsmart.com" style={{ color: 'var(--purple)', textDecoration: 'none' }}>
                admin@spendsmart.com
              </a>
            </p>
          </div>
          
          <h2 style={{ fontSize: '1.3rem', color: 'var(--purple-dark)', marginBottom: '16px' }}>Support</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--muted)', marginBottom: '20px' }}>
            For technical support, bug reports, or feature requests, please email us at the address above. We typically respond within 24-48 hours during weekdays.
          </p>
          
          <h2 style={{ fontSize: '1.3rem', color: 'var(--purple-dark)', marginBottom: '16px' }}>Feedback</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--muted)', marginBottom: '20px' }}>
            We value your feedback! If you have suggestions on how to improve StudentHub, we'd love to hear from you. Your input helps us make the platform better for all students.
          </p>
          
          <h2 style={{ fontSize: '1.3rem', color: 'var(--purple-dark)', marginBottom: '16px' }}>General Inquiries</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--muted)' }}>
            For general questions about StudentHub, partnership opportunities, or press inquiries, please reach out via email and we'll get back to you as soon as possible.
          </p>
        </div>
        
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <NavLink className="landing-btn landing-btn-primary" to="/">Back to Home</NavLink>
        </div>
      </section>
    </main>
  );
}

export default Contact;
