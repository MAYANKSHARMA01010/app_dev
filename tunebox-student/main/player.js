// main/player.js
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

let vlc = null; // the VLC process that is playing a song, or null

// Returns the .mp3 files in `folder` as [{ name, path }, …].
export function readSongs(folder) {
  return fs
    .readdirSync(folder)
    .filter((name) => name.endsWith('.mp3'))
    .map((name) => ({ name, path: path.join(folder, name) }));
}

// Starts VLC with its remote-control interface, which reads commands on stdin.
export function play(songPath) {
  stop(); // only one song at a time
  vlc = spawn('vlc', ['--intf', 'rc', songPath]);
}

// VLC's "pause" command pauses a playing song and resumes a paused one.
export function togglePause() {
  if (vlc) vlc.stdin.write('pause\n');
}

export function stop() {
  if (vlc) {
    vlc.kill();
    vlc = null;
  }
}

export function isPlaying() {
  return vlc !== null;
}
