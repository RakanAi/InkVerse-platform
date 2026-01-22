import React from 'react';

export default function Contact() {
    return (
        <div style={{
            padding: '50px',
            textAlign: 'center',
            minHeight: '80vh',
        }} className='border container w-auto rounded-3 border-3'>
            <h1 style={{ color: '#1565c0', fontSize: '3em', marginBottom: '20px' }}>
                Contact Us 📬
            </h1>
            <p style={{ fontSize: '1.2em', color: '#424242', marginBottom: '30px' }}>
                We'd love to hear from you! Whether you have questions, feedback, or ideas, we're here to help. 💬
            </p>

            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left', marginBottom: '40px' }}>
                <h2 style={{ color: '#1976d2', marginBottom: '15px' }}>What to Contact Us For:</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '10px', fontSize: '1.1em' }}>🛠️ <strong>Technical Support:</strong> Issues with the site, bugs, or feature requests.</li>
                    <li style={{ marginBottom: '10px', fontSize: '1.1em' }}>
                        💡 <strong>Feedback & Suggestions:</strong> Ideas to improve InkVerse or share your thoughts.
                        <br />
                        <small style={{ color: '#666', marginLeft: '20px' }}>
                            For feedback, bug reports, or feature requests, please include:<br />
                            • The page or book you were viewing<br />
                            • A short description of the issue<br />
                            • Screenshots (if possible)
                        </small>
                    </li>
                    <li style={{ marginBottom: '10px', fontSize: '1.1em' }}>🤝 <strong>Partnerships:</strong> Collaborations, promotions, or business inquiries.</li>
                    <li style={{ marginBottom: '10px', fontSize: '1.1em' }}>📖 <strong>Content Questions:</strong> Inquiries about stories, authors, or community guidelines.</li>
                    <li style={{ marginBottom: '10px', fontSize: '1.1em' }}>🎉 <strong>General Chat:</strong> Just say hi or join the community!</li>
                </ul>
            </div>

            <div style={{ marginTop: '40px' }}>
                <h2 style={{ color: '#1976d2', marginBottom: '20px' }}>Get in Touch:</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <a
                        href="mailto:InkVerseOdeh@gmail.com"
                        style={{
                            display: 'inline-block',
                            padding: '15px 25px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            fontSize: '1.1em',
                            transition: 'background-color 0.3s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#1565c0'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#1976d2'}
                    >
                        📧 Email Us
                    </a>
                    <a
                        href="https://discord.gg/YOUR_INVITE"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-block',
                            padding: '15px 25px',
                            backgroundColor: '#5865f2',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            fontSize: '1.1em',
                            transition: 'background-color 0.3s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#4752c4'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#5865f2'}
                    >
                        💬 Join Discord
                    </a>
                </div>
            </div>
        </div>
    );
}