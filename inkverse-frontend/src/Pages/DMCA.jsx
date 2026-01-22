import React from 'react';

export default function Help() {
    return (
        <div style={{
            padding: '50px',
            textAlign: 'center',
            minHeight: '80vh',
        }} className='border border-3 rounded-3 w-auto container'>
            <h1 style={{ color: '#2e7d32', fontSize: '3em', marginBottom: '20px' }}>
                DMCA Notice 📜
            </h1>
            <p style={{ fontSize: '1.2em', color: '#424242', marginBottom: '30px' }}>
                InkVerse respects the intellectual property rights of creators and copyright holders. ⚖️
            </p>

            <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left', fontSize: '1.1em', color: '#333' }}>
                <p style={{ marginBottom: '20px' }}>
                    If you believe that content available on InkVerse infringes your copyright,
                    you may submit a copyright infringement notice (DMCA notice).
                </p>

                <p style={{ marginBottom: '15px' }}>Your notice should include:</p>
                <ul style={{ marginBottom: '20px' }}>
                    <li>• Identification of the copyrighted work claimed to be infringed</li>
                    <li>• The URL or location of the allegedly infringing content</li>
                    <li>• Your name and contact information</li>
                    <li>• A statement that you believe the use is not authorized</li>
                    <li>• A statement that the information provided is accurate</li>
                </ul>

                <p style={{ marginBottom: '20px' }}>
                    Please send DMCA notices to: <strong>InkVerseOdeh@gmail.com</strong> .
                </p>

                <p style={{ marginBottom: '20px' }}>
                    Upon receiving a valid notice, InkVerse will review the request and take
                    appropriate action, which may include removing or disabling access to the content. 🚫
                </p>

                <p style={{ marginBottom: '20px' }}>
                    InkVerse users who repeatedly infringe copyright may have their accounts restricted or removed. ⚠️
                </p>

                <p>
                    This policy may be updated as InkVerse evolves. 📈
                </p>
            </div>
        </div>
    );
}