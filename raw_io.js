process.stdin.setRawMode(true);
process.stdin.on('data', (data) => {
    console.log(data.toString(),data)
    if (data[0] === 0x03) { // Ctrl+C
      process.exit(0)
    }
    if (data[0] === 0x1b && data[1] === 0x5b) { 
        if (data[2] === 41) {
            console.log('Up arrow pressed');
        } else if (data[2] === 42) {
            console.log('Down arrow pressed');
        }
    }
});
