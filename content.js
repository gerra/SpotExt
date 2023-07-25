const EVENT_SELECTED_TEXT_CHANGED = 'selected_text_changed'

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

window.addEventListener("mouseup", () => {
    chrome.runtime.sendMessage(
        {
            event: EVENT_SELECTED_TEXT_CHANGED,
            selection: getSelectedPlainText(window.getSelection())
        }
    )
});

function getCurrentTabId(onSuccess, onFail) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (tabs.length > 0) {
            onSuccess(tabs[0].id)
        } else {
            onFail()
        }
    });
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

function getSelectedPlainText(selection) {
    let plainText = ""
    if (selection && selection.rangeCount) {
        const range = selection.getRangeAt(0)
        const clonedRange = range.cloneRange()
        const div = document.createElement("div")
        div.appendChild(clonedRange.cloneContents())
        plainText = div.textContent
    }
    return removeExtraSpaces(plainText)
}

function removeExtraSpaces(str) {
    return str.trim().replace(/\s{2,}/g, ' ')
}