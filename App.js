import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SpotifyLog from './spotifyLogin';
import Callback from './callback';
import MusicReg from './musicSwipeReg';
import MusicLog from './musicSwipeLog';
import Dashboard from './musicDashSwipe';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SpotifyLog/>}/>
        <Route path='/callback' element={<Callback/>}/>
        <Route path='/musicLog' element={<MusicLog/>}/>
        <Route path='/musicReg' element={<MusicReg/>}/>
        <Route path='/musicDash' element={<Dashboard/>}/>
        
        
  
      </Routes>
    </BrowserRouter>
  );
}

export default App;