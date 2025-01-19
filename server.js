const express = require('express');
const axios = require('axios')
const database = require("./database");

const session = require('express-session');
const MemoryStore = require('memorystore')(session);

const bcrypt = require('bcrypt');
const spotifyFile = require('./spotify');
const querystring = require('querystring');
const request = require('request');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

const clientID = '71f486a79e86416393b429a291edd6f6';
const secretID = '6eccafb116364980bff02eeed75c9a5a';


app.use(
  session({
    store: new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    }),
    secret: '6eccafb116364980bff02eeed75c9a5a', // Replace with a secure key
    resave: false, // Prevent unnecessary session saves
    saveUninitialized: true, // Save unmodified sessions
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true, // Prevent access via client-side scripts
      maxAge: 3600000, // Example: 1 hour session expiration
    },
  })
);

app.use(cors({
  origin: 'http://localhost:3000', // Frontend origin
  credentials: true, // Allow cookies to be sent
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow necessary headers
  methods: ['GET', 'POST'], // Specify allowed methods
}));

app.use(express.json());  // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));




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
    var scope = 'playlist-modify-public user-library-read user-read-private user-read-email';
  
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: '71f486a79e86416393b429a291edd6f6',
        scope: scope,
        redirect_uri: 'http://localhost:4000/callback',
        show_dialog: true,
        state: state
      }));
  });
 
    
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
          'Authorization': 'Basic ' + (new Buffer.from(clientID + ':' + secretID).toString('base64'))
        },
        json: true
      };
    }

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
          const access_token = body.access_token;
          const refresh_token = body.refresh_token;
          const expires_in = body.expires_in;

          console.log(access_token);
          console.log(refresh_token);
          console.log(expires_in);

          console.log("DID shit print");
         

          // Save tokens in session
          req.session.access_token = access_token;
          req.session.refresh_token = refresh_token;
          req.session.expires_in = Date.now() + expires_in * 1000;

          req.session.save((err) => {
            if (err) {
                console.error('Error saving session:', err);
            } else {
                console.log('Session saved successfully');
            }
          });

          console.log('TOKEN',req.session.access_token);         
     
          console.log(req.session)


          const userOptions = {
            url: 'https://api.spotify.com/v1/me',
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
            json: true,
          };
  
          request.get(userOptions, function (err, resp, userBody) {
            if (!err && resp.statusCode === 200) {
              const user_id = userBody.id; // Spotify User ID
              console.log('Spotify User ID:', user_id);
  
              
              req.session.user_id = user_id;
  
              req.session.save((err) => {
                if (err) {
                  console.error('Error saving user_id to session:', err);
                } else {
                  console.log('User ID saved successfully to session.');
                }
              });


              console.log("USER ID", req.session.user_id);
  
            } else {
              console.error('Error fetching user profile:', err || resp.statusCode);
              res.redirect(
                '/#' +
                  querystring.stringify({
                    error: 'user_profile_fetch_failed',
                  })
              );
            }
          });


          res.redirect('http://localhost:3000/musicLog'); 
      } else {
          res.redirect('/#' + querystring.stringify({ error: 'invalid_token' }));
      }
    });
  });


  app.get('/refresh_token', function(req, res) {

    var refresh_token = req.query.refresh_token;
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + (new Buffer.from(clientID + ':' + secretID).toString('base64'))
      },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };
  
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token,
            refresh_token = body.refresh_token || refresh_token;
        res.send({
          'access_token': access_token,
          'refresh_token': refresh_token
        });
      }
    });
  });


// user registration - GOOD
app.post('/api/register', async (req, res) => {
  console.log(req.body); 
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
}

  const hashPass = await bcrypt.hash(password, 10);

  const query = 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)';

  database.query(query, [name, email, hashPass], (err) => {
      if (err) {
          console.error('Error registering user:', err);
          return res.status(500).send('Error registering user');
      }

      res.status(200).json({ message: 'User registered successfully' });
  });
});


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
        res.status(200).json({ message: 'Bro is logged in'});

    })
})




// function tp call spotify func randoSong to generate a rando rec song from user's account
app.get('/genSong', async (req, res) => {
  console.log('Received request for genSong'); 
  let x = req.session.access_token;
  console.log("Access token from session:", x);
  console.log('GENSONG USER ID', req.session.user_id)

  
  if (!req.session.access_token) {
    console.log("shit failed")
    return res.redirect('http://localhost:4000/login');
  }
    
  console.log("after req check")

  if (Date.now() > req.session.expires_in) {
    console.log('Access token has expired. Redirecting to refresh token...');
    return res.redirect('http://localhost:4000/refresh_token');  
  }


  try {
      console.log("in try")

      const response = await axios.get('https://api.spotify.com/v1/me/tracks', {
        headers: {
            'Authorization': `Bearer ${req.session.access_token}`
        },

        params: {
            limit: 1,
            market: 'US'    
        } 
    }); 

    const totalTracks = response.data.total;

    if (!totalTracks) {
        throw new Error('No tracks found in the response.'); 
    } 

    let track = Math.floor(Math.random() * totalTracks);

    const responseTwo = await axios.get('https://api.spotify.com/v1/me/tracks', {
      headers: {
          'Authorization': `Bearer ${req.session.access_token}`
      },

      params: {
          limit: 1,
          offset: track,
          market: 'US' 
      } 
    });

    const song = responseTwo.data.items && responseTwo.data.items[0].track;

    if (!song) {
      throw new Error('No song found in the response.'); 
    } 

    const id = song.id;
    const title = song.name;
    const artist = song.artists[0].name;  
    const albumCoverUrl = song.album.images[0].url;  
    const sound = song.preview_url;

    console.log("got song", title);
    console.log(artist)
    console.log(albumCoverUrl);
    console.log(sound);

    res.json({id, title, artist, albumCoverUrl, sound});
  }
  catch(error) {
    console.log('Error in genSong:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// creates user the spotify playlist 
app.post('/playlist', async (req, res) => {

  console.log('PLAYLIST USER', req.session.user_id, req.session.access_token);

  try {
    if (!req.session.user_id) {
      throw new Error('NO USER ID FAILED PLAYLIST')
    }

    console.log("GETS HERE")
  
    const response = await axios.post(
      `https://api.spotify.com/v1/users/${req.session.user_id}/playlists`,
      {
        name: 'MUSICSWIPE PLAYLIST', 
        public: true,               
      },
      {
        headers: {
          Authorization: `Bearer ${req.session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    req.session.playlist_id = response.data.id;
    console.log('Playlist created with ID:', req.session.playlist_id);

    res.status(200).json(response.d);

  }
  catch (err) {
    console.error('Error creating playlist:', err.message);
    console.error('Full error object:', err);
  }

})


// add song to playlist 
app.post('/addPlaylist', async (req, res) => {
  try {

    if (!req.session.playlist_id) {
      throw new Error('No PLAYLIST ID')
    }

    const songID = req.body.songId;

    const response = await axios.post(`https://api.spotify.com/v1/playlists/${req.session.playlist_id}/tracks`, 
      {
        uris: [`spotify:track:${songID}`],
      },
      {
        headers: {
          Authorization: `Bearer ${req.session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )

   console.log('added song')
   res.status(200).json(response.data);
  }
  catch (err) {
    console.log(err);
  }
})



app.listen(PORT, () => {
    console.log(`Listenging: ${PORT}`);
}) // npm start -> to run server
