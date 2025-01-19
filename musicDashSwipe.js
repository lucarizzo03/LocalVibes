import React, { useState, useEffect } from 'react';
import './dash.css'


const Dashboard = () => {
    const [song, setSong] = useState(
        {
            title: "",
            artist: "",
            albumCoverUrl: "",
            sound: "",
        }
    );
    
    

   
    const fetchRandomSong = async () => {
        try {
            
            const response = await fetch('http://localhost:4000/genSong', {
                method: 'GET',
                credentials: 'include',
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


    const playlistCreate = async () => {
        try {

            const responseTwo = await fetch('http://localhost:4000/playlist', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

           if (responseTwo.ok) {
            const data = responseTwo.json();
            console.log('Playlist created successfully:', data);
            alert("PLAYLIST CREAETD IN SPOTIFY")

           }
           else {
            console.log('Playlist Failed Creation');
           }
        }
        catch(err) {
            throw new Error(' There an error playlist dash')
        }
    }



    // add to playlist
    const addSong = async () => {
        try {
            
            const responseThree = await fetch('http://localhost:4000/addPlaylist', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    songId: song.id,  // Send the song ID to the backend
                }),
            })

            if (responseThree.ok) {
                const data = await responseThree.json();
                console.log('Song added successfully:', data);
            }
        }
        catch(err) {
            console.log('shit did not add')

        }
    }



    const handleFire = (event) => {
        event.preventDefault();
        addSong();
        fetchRandomSong(); // gettin song
        
    };

    const handleBrokenHeart = () => {
        fetchRandomSong(); // gitin song 
    };

    const createP = (event) => {
        event.preventDefault();
        playlistCreate()
    }

    const playSound = () => {
        const audio = new Audio(song.sound);
        audio.play();
    }


    useEffect(() => {
        fetchRandomSong()
    }, []);

    return (
        <div>
            <h1>MusicSwipe</h1>

            <div className="song-area">
                <h2>Now Playing:</h2>
                <p><strong>Title:</strong> {song.title}</p>
                <p><strong>Artist:</strong> {song.artist}</p>
                <img
                    src={song.albumCoverUrl}
                    alt="Album Cover"
                    className="album-cover"
                    style={{ maxWidth: '300px', height: 'auto' }}
                />

                <div className="actions">
                    <button type="button" onClick={handleFire}>
                        <span role="img" aria-label="fire">🔥</span> ADD
                    </button>
                    <button type="button" onClick={handleBrokenHeart}>
                        <span role="img" aria-label="broken-heart">💔</span> SKIP
                    </button>
                    <button type="button" onClick={createP}>
                        <span role="img" aria-label="playlist">🎶</span> CREATE PLAYLIST
                    </button>
                    {/* Play Sound Button */}
                    {song.sound && (
                        <button type="button" onClick={playSound}>
                            <span role="img" aria-label="sound">🔊</span> PLAY SOUND
                        </button>
                    )}
                </div>
            </div>
        </div>


       
    );
};

export default Dashboard;
