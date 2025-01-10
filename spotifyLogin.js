import React from 'react';

function SpotifyLog() {
    function handle() {
        window.location.href = 'http://localhost:4000/login';
    };

    return (
        <div>
            <h1 className="app-title">MusicSwipe</h1>
            <p className="app-description">Is it heat or nah?!?!?</p>
            <button onClick={handle}>Spotify Log In</button>
        </div>
    );
};

export default SpotifyLog;
