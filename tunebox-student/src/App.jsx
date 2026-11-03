// src/App.jsx
// The interface (renderer): the songs of the chosen folder, the song that
// is playing with its elapsed time, and the playback buttons.
import { useEffect, useState } from 'react';

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function App() {
  const [songs, setSongs] = useState([]);
  const [current, setCurrent] = useState(null); // the song that is playing
  const [elapsed, setElapsed] = useState(0);

  // Start listening for the elapsed time; stop listening when App goes away.
  useEffect(() => window.tunebox.onProgress(setElapsed), []);

  async function chooseFolder() {
    const list = await window.tunebox.chooseFolder();
    if (list) setSongs(list); // null when the dialog is cancelled
  }

  async function playSong(song) {
    await window.tunebox.play(song.path);
    setCurrent(song);
  }

  function stopSong() {
    window.tunebox.stop();
    setCurrent(null);
  }

  return (
    <div>
      <button onClick={chooseFolder}>Choose music folder…</button>

      <ul>
        {songs.map((song) => (
          <li key={song.path} onClick={() => playSong(song)}>{song.name}</li>
        ))}
      </ul>

      <footer>
        <p>{current ? `${current.name} — ${formatTime(elapsed)}` : 'Nothing playing'}</p>
        <button onClick={() => window.tunebox.togglePause()} disabled={!current}>Pause / Resume</button>
        <button onClick={stopSong} disabled={!current}>Stop</button>
      </footer>
    </div>
  );
}
