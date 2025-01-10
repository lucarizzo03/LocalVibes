import React, { useState, useEffect } from 'react';


const Dashboard = () => {
    const [song, setSong] = useState(true);
    const [favorites, setFavorites] = useState([]); 

   
    const fetchRandomSong = async () => {
        try {
            
            const response = await fetch('http://localhost:4000/genSong', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            console.log('Response:', response);

            const data = await response.json();
            setSong(data);
            console.log("fetch succsess")
        } 
        catch (error) {
            console.log("fetch failed")
            console.error('Error fetching random song:', error);
        }
       
    };

    const handleFire = () => {
        if (song) {
            setFavorites([...favorites, song]);  
        }
        fetchRandomSong(); // gettin song
    };

    const handleBrokenHeart = () => {
        fetchRandomSong(); // gitin song 
    };

    useEffect(() => {
        fetchRandomSong();
    }, []);

    return (
        <div>
            <h1>MusicSwipe</h1>
                <div className="song-area">
                    <h2>Now Playing:</h2>
                    <p><strong>Title:</strong> {song.title}</p>
                    <p><strong>Artist:</strong> {song.artist}</p>
                    <p><strong>Album:</strong> {song.album}</p>
                    <img src={song.albumCover} alt="Album Cover" className="album-cover" />
                    <audio controls>
                        <source src={song.preview} type="audio/mpeg" />
                        Your browser does not support the audio element.
                    </audio>
                    <div className="actions">
                        <button onClick={handleFire}>
                            <span role="img" aria-label="fire">🔥</span> Fire
                        </button>
                        <button onClick={handleBrokenHeart}>
                            <span role="img" aria-label="broken-heart">💔</span> Nah
                        </button>
                    </div>
                </div>
        </div>
    );
};

export default Dashboard;
