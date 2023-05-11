const TOP_TRACKS_DEFAULT_COUNT = 5

const KEY_ARTIST_TRACK_COUNT = 'artistTopTrackCount'
const KEY_TRACK_COUNT = 'topTrackCount'

const EVENT_ARTIST_TRACK_COUNT_CHANGED = 'topArtistTrackCountChanged'
const EVENT_TRACK_COUNT_CHANGED = 'topTrackCountChanged'

document.addEventListener('DOMContentLoaded', () => {
    initTopTracksDropdown('artistTrackCountSelect', KEY_ARTIST_TRACK_COUNT, EVENT_ARTIST_TRACK_COUNT_CHANGED)
    initTopTracksDropdown('trackCountSelect', KEY_TRACK_COUNT, EVENT_TRACK_COUNT_CHANGED)
});

function initTopTracksDropdown(elementId, trackCountKey, event) {
    const trackCountSelect = document.getElementById(elementId);
    populateDropdown(trackCountSelect)

    chrome.storage.sync.get({[trackCountKey]: TOP_TRACKS_DEFAULT_COUNT}, function (result) {
        trackCountSelect.value = result[trackCountKey]
    })

    trackCountSelect.addEventListener('change', () => {
        const trackCount = trackCountSelect.value
        console.log(`Track count changed for ${elementId}: ${trackCount}`);

        chrome.storage.sync.set({[trackCountKey]: trackCount});

        chrome.runtime.sendMessage({
            event: event,
            trackCount: trackCount
        })
    });
}

function populateDropdown(trackCountSelect) {
    for (let i = 1; i <= 10; i++) {
        const option = document.createElement('option');
        option.value = i.toString();
        option.text = i.toString();
        trackCountSelect.appendChild(option);
    }
}