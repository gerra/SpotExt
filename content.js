const songsOuterContainer = document.createElement('div')
songsOuterContainer.className = 'spotext-songs-outer-container'

const topPanel = document.createElement('div')
topPanel.className = 'spotext-top-panel'

const closeButton = document.createElement('div')
closeButton.className = 'spotext-close-button'
closeButton.textContent = 'Close'
closeButton.addEventListener('click', () => {
    removeSongsPopup()
})

const songsContainer = document.createElement('div')
songsContainer.className = "spotext-songs-container"

topPanel.appendChild(closeButton)

songsOuterContainer.appendChild(topPanel)
songsOuterContainer.appendChild(songsContainer)

// Event listener for mouseup event
/*document.addEventListener('mouseup', () => {
    if (!window.getSelection().toString()) {
        songsContainer.remove()
    }
});*/

chrome.runtime.onMessage.addListener((message) => {
    if (message.event === 'showTracks') {
        removeSongsPopup()

        const songIds = message.songIds
        inflatePlayers(songsContainer, songIds);

        const selection = getSelectionCoordinates()
        songsOuterContainer.style.left = `${selection.x}px`
        songsOuterContainer.style.top = `${selection.y}px`

        document.body.appendChild(songsOuterContainer);
    }
});

window.onbeforeunload = () => {
    removeSongsPopup()
}

function removeSongsPopup() {
    songsOuterContainer.remove()
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
        player.style.backgroundColor = 'rgba(0, 0, 0, 0)'
        player.className = 'spotext-song-block'
        playersContainer.appendChild(player);
    });
}