import React from 'react';

export default function Author() {
    return (
        <div style={{
            textAlign: 'center',
            padding: '50px',
            // backgroundColor: '#f0f8ff',
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'Arial, sans-serif'
        }}>
            <h1 style={{ color: '#333', fontSize: '3em', marginBottom: '20px' }}>
                🚀 Author Paradise Incoming! 🚀
            </h1>
            <p style={{ fontSize: '1.5em', color: '#555', marginBottom: '20px' }}>
                Hey there, word wizards and storytellers! 🌟
            </p>
            <p style={{ fontSize: '1.2em', color: '#666', marginBottom: '30px', maxWidth: '600px' }}>
                This website is currently chilling in demo mode, but buckle up! Soon, you'll be able to craft amazing tales, share your creativity, and even turn your passion into profit! 💰📚✨
            </p>
            <p style={{ fontSize: '1.3em', color: '#444', fontWeight: 'bold' }}>
                Stay tuned for the epic launch! 🎉
            </p>
            <div style={{ marginTop: '40px', fontSize: '4em' }}>
                📖✍️💡
            </div>
        </div>
    );
}