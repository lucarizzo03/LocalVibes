const express = require('express');
const database = require("./database");
const parse = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const spotifyFile = require('./spotify');
const querystring = require('querystring');
const request = require('request');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(parse.json()); // parsing the POST reqs coming in 

app.use(parse.urlencoded({ extended: true })); // converts POST data to use req.body

app.use(session({
    secret: process.env.seshKey || 'key', 
    resave: false, // keep this false so it doesnt save if nothing was changed, performance reasons -> too much saving 
    saveUninitialized: true // saving a new session, but that is not modified
})); // used so we can store user-specific info 

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Allowing these HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'],  // Allowed headers
})); // allows comms between backend and frontend 

// Function to generate a random string for state parameter
function generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

const client = '71f486a79e86416393b429a291edd6f6';
const secret = '6eccafb116364980bff02eeed75c9a5a';

// spotify login - FROM SPOTIFY
app.get('/login', function(req, res) {

    var state = generateRandomString(16);
    var scope = 'user-read-private user-read-email';
  
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client,
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
          'Authorization': 'Basic ' + (new Buffer.from(client + ':' + secret).toString('base64'))
        },
        json: true
      };


      request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          const accessToken = body.access_token;
          const refreshToken = body.refresh_token;

          res.redirect(`http://localhost:3000/musicLog`);


        }
         else {
          console.error('Error during token exchange:', error);
          res.send(`
            <h1>Login Failed</h1>
            <p>Check server logs for details.</p>
          `);
        }
      });
    }
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
  try {
    const song = await spotifyFile.randoSong();

    if (song) {
      console.log("gen succsess")
      res.json(song);
    }
    else {
      console.log("gen failed")
      res.status(500).json({ message: 'Error fetching song' });
    }
  }
  catch(error) {
    console.log('Error in genSong:', error);
    res.status(500).json({ message: 'Server error' });
  }
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



// fucntion that calls create playlist - GET





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
