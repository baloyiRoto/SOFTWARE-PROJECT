import React, { useState, useEffect } from 'react';
import '../App.css';

function Tutorial({ onComplete }) {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const steps = [
    {
      title: 'Welcome to StudentHub!',
      content: 'This is your all-in-one platform for managing student life. Let us show you around.',
      icon: '👋'
    },
    {
      title: 'SpendSmart Module',
      content: 'Track your expenses, set budgets, and view detailed reports to manage your finances effectively.',
      icon: '💰'
    },
    {
      title: 'MealMate Module',
      content: 'Manage your food inventory, generate AI-powered recipes, and create smart shopping lists.',
      icon: '🍳'
    },
    {
      title: 'Categories',
      content: 'Customize expense categories to match your spending habits. Add new categories anytime!',
      icon: '📋'
    },
    {
      title: 'Budgets',
      content: 'Set monthly budgets for each category and track your spending against your goals.',
      icon: '📊'
    },
    {
      title: 'Reports',
      content: 'View detailed expense reports and export data to CSV or PDF for your records.',
      icon: '📈'
    },
    {
      title: 'You\'re All Set!',
      content: 'Start exploring StudentHub and take control of your student life. Good luck!',
      icon: '🎉'
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setIsVisible(false);
      setTimeout(() => onComplete(), 300);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(() => onComplete(), 300);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.3s ease'
    }}>
      <div style={{
        backgroundColor: 'var(--bg)',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'transform 0.3s ease'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>{steps[step].icon}</div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--purple-dark)', marginBottom: '12px' }}>
            {steps[step].title}
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--muted)', lineHeight: '1.6' }}>
            {steps[step].content}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
          {steps.map((_, index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: index === step ? 'var(--purple)' : 'var(--border)',
                transition: 'background-color 0.3s ease'
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
          <button
            onClick={handleSkip}
            style={{
              padding: '10px 20px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: 'var(--purple)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          >
            {step === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Tutorial;
