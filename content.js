const songsContainer = document.createElement('div');
songsContainer.className = "songs-container"

// Event listener for mouseup event
document.addEventListener('mouseup', () => {
    if (!window.getSelection().toString()) {
        songsContainer.remove()
    }
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.event === 'showTracks') {
        removeSongsContainer()

        const songIds = message.songIds
        inflatePlayers(songsContainer, songIds);

        const selection = getSelectionCoordinates()
        songsContainer.style.left = `${selection.x}px`
        songsContainer.style.top = `${selection.y}px`

        document.body.appendChild(songsContainer);
    }
});

window.onbeforeunload = () => {
    removeSongsContainer()
}

function removeSongsContainer() {
    songsContainer.remove()
    songsContainer.replaceChildren();
}

function getSelectionCoordinates() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const boundingRect = range.getBoundingClientRect();

    return {
        x: boundingRect.left + window.scrollX,
        y: boundingRect.top + window.scrollY
    };
}

function inflatePlayers(playersContainer, songIds) {
    console.log(`inflatePlayers for ${songIds.length}`)

    if (songIds.length === 1) {
        playersContainer.style.columnCount = '1'
    } else {
        playersContainer.style.columnCount = '2'
    }
    songIds.forEach((song) => {
        const player = document.createElement('iframe');
        player.src = `https://open.spotify.com/embed/track/${song}`;
        player.width = "300";
        player.height = "80";
        player.frameborder = "0";
        player.allowtransparency = "true";
        player.allow = "encrypted-media";
        player.className = 'song-block'
        playersContainer.appendChild(player);
    });
}