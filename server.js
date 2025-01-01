const express = require('express');
const axios = require('axios');
const database = require("./database");
require('dotenv').config();
const parse = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const spotifyFile = require('./spotify');
const querystring = require('querystring');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(parse.json()); // parsing the POST reqs coming in 
app.use(parse.urlencoded({ extended: true })); // converts POST data to use req.body
app.use(session({
    secret: process.env.seshKey || 'key', 
    resave: false, // keep this false so it doesnt save if nothing was changed, performance reasons -> too much saving 
    saveUninitialized: true // saving a new session, but that is not modified
})); // used so we can store user-specific info 

// Function to generate a random string for state parameter
function generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

// spotify login - FROM SPOTIFY
app.get('/login', function(req, res) {

    var state = generateRandomString(16);
    var scope = 'user-read-private user-read-email';
  
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: '71f486a79e86416393b429a291edd6f6',
        scope: scope,
        redirect_uri: 'http://localhost:4000/callback',
        state: state
      }));
  });

    
  // call back func - FROM SPOTIFY
  app.get('/callback', function(req, res) {
    var code = req.query.code || null;
    var state = req.query.state || null;
  
    if (state === null) {
      res.redirect('/#' +
        querystring.stringify({
          error: 'state_mismatch'
        }));
    } else {
      var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
          code: code,
          redirect_uri: 'http://localhost:4000/callback',
          grant_type: 'authorization_code'
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + (new Buffer.from(/*client_id*/ + ':' + /*client_secret*/).toString('base64'))
        },
        json: true
      };
    }
  });


// user registration - GOOD
app.post('/api/register', async (req, res) => {
    const {email, pass, username} = req.body;

    // hashing password 
    const hashPass = await bcrypt.hash(pass, 10);

    // sending the info up in the data base dawg with this mane 
    const query = 'INSERT INTO users (email, password_hash) VALUES (?, ?)';

    // now it sending it up in there 
    database.query(query, [email, hashPass, username], (err) => {
        if (err) {
            console.error('Error registering user:', err);
            return res.status(500).send('Error registering user');
        }

        res.send('User Registered');
    })
})


// user login - GOOD 
app.post('/api/login', (req, res) => {
    const {email, pass} = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';

    database.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Error logging in:', err);
            return res.status(500).send('Error logging in');
        }

        const passHashed = await bcrypt.compare(pass, results[0].password_hash);

        if (results === 0) {
            return res.status(400).send('Invalid results');
        }


        if (!passHashed) {
            return res.status(400).send('Invalid password');
        }

        req.session.user = { id: results[0].id, email: results[0].email };
        res.send('Bro is logged in');

    })
})


// API call
// getting spotify artist and top-tracks from API call from spotify file 
app.get('/api/artist', async (req, res) => {
    const artistName = req.query.name;

    if (!artistName) {
        return res.status(400).send('No artist name');
    }

    const artist = await spotifyFile.getArtist(artistName);

    if (!artist) {
        return res.status(400).send('There is no artist');
    }

    const topTracks = await spotifyFile.getTopTracks(artist.id);

    res.json(topTracks);
});


// user favorites -> will add the user's favorite artist to their list 
app.post('/api/favorites', async (req, res) => {
    const { artistName } = req.body;

    if (!req.session.user) {
        return res.status(401).send('Not logged in');
    }

    if (!artistName) {
        return res.status(400).send('Need artist name');
    }

    const userID = req.session.user.id;

    const query = 'INSERT INTO favorites (user_id, artistName) VALUES (?, ?)';

    database.query(query, [userID, artistName], (err) => {
        if (err) {
            return res.status(500).send('Error adding to favorites.');
        }
        res.send('Artist added to favorites!');
    })

});






































// user logout 
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.send('Logged out');
    });
});


app.listen(PORT, () => {
    console.log(`Listenging: ${PORT}`);
}) // npm start -> to run server