const axios = require('axios');

const clientID = process.env.spotifyClientID;
const secretID = process.env.spotifySecretClientID;

const getToken = async () => {
    const authHeader = Buffer.from(`${clientID}:${secretID}`).toString('base64');

    /*const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${authHeader}`
            }
        }
    )*/

        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            new URLSearchParams({
                'grant_type': 'client_credentials'
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${authHeader}`
                }
            }
        );

    return response.data.access_token;
}



// function to get profiles using spotify api
const getArtist = async (artistName) => {

    // getting spotify token
    const token = await getToken();

    const response = await axios.get('https://api.spotify.com/v1/search', {
        headers: {
            'Authorization': `Bearer ${token}`
        },

        params: {
            q: artistName,
            type: 'artist',
            limit: 1
        }
    })

    const artist = response.data.artists.items[0];

    return {
        id: artist.id,
        name: artist.name, 
        genres: artist.genres, 
        followers: artist.followers.total, 
        image: artist.images[0]?.url, 
        spotifyURL: artist.external_urls.spotify 
    };

}


// fucntion to get artist top tracks
const getTopTracks = async (artistID, market = 'US') => {
    const token = await getToken();

    const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
        headers: {
            'Authorization': `Bearer ${token}`
        },

        params: {
            'market': market
        }
    })

    return response.data.tracks.map(track => ({
        id: track.id,
        name: track.name,
        previewURL: track.preview_url,
        albumName: track.album.name,
        albumImage: track.album.images[0]?.url,
        spotifyURL: track.external_urls.spotify
    }));
};






module.exports = { getArtist, getTopTracks };




