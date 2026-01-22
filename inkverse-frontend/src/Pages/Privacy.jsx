import React from 'react';

export default function Privacy() {
    return (
        <div style={{
            padding: '50px',
            textAlign: 'center',
            minHeight: '80vh',
        }} className='container w-auto border border-3 rounded-3'>
            <h1 style={{ color: '#4a148c', fontSize: '3em', marginBottom: '20px' }}>
                Privacy Policy 🔒
            </h1>
            <p style={{ fontSize: '1.2em', color: '#424242', marginBottom: '30px' }}>
                Your privacy matters to us. 🛡️
            </p>

            <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left', fontSize: '1.1em', color: '#333' }}>
                <p style={{ marginBottom: '20px' }}>
                    InkVerse collects only the information necessary to operate the platform, such as:
                </p>
                <ul style={{ marginBottom: '20px' }}>
                    <li>• Account details (email, username)</li>
                    <li>• Reading progress</li>
                    <li>• User-generated content (reviews, comments)</li>
                </ul>

                <p style={{ marginBottom: '20px' }}>
                    We do not sell or share personal data with third parties. 🔒
                </p>

                <p style={{ marginBottom: '20px' }}>
                    Passwords are securely stored using industry-standard encryption. 🔐
                </p>

                <p style={{ marginBottom: '20px' }}>
                    Authentication tokens are used only to keep you logged in. 🔑
                </p>

                <p>
                    As InkVerse grows, this policy may be updated to reflect new features. 📈
                </p>
            </div>
        </div>
    );
}