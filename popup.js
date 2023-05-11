const TOP_TRACKS_DEFAULT_COUNT = 5

const KEY_ARTIST_TRACK_COUNT = 'artistTopTrackCount'
const KEY_ARTIST_TRACKS_ENABLED = 'artistTopTracksEnabled'
const ARTIST_TRACKS_ENABLED_DEFAULT_VALUE = true
const EVENT_ARTIST_TRACK_COUNT_CHANGED = 'topArtistTrackCountChanged'
const EVENT_ARTIST_TRACK_ENABLED_CHANGED = 'topArtistEnabledChanged'

const KEY_TRACK_COUNT = 'topTrackCount'
const KEY_TRACKS_ENABLED = 'topTracksEnabled'
const TRACKS_ENABLED_DEFAULT_VALUE = false
const EVENT_TRACK_COUNT_CHANGED = 'topTrackCountChanged'
const EVENT_TRACK_ENABLED_CHANGED = 'topTrackEnabledChanged'

document.addEventListener('DOMContentLoaded', () => {
    initTopTracksDropdown(
        'artistTrackCountSelect',
        KEY_ARTIST_TRACK_COUNT,
        TOP_TRACKS_DEFAULT_COUNT,
        EVENT_ARTIST_TRACK_COUNT_CHANGED,
        'artistTracksCheckbox',
        KEY_ARTIST_TRACKS_ENABLED,
        ARTIST_TRACKS_ENABLED_DEFAULT_VALUE,
        EVENT_ARTIST_TRACK_ENABLED_CHANGED
    )
    initTopTracksDropdown(
        'trackCountSelect',
        KEY_TRACK_COUNT,
        TOP_TRACKS_DEFAULT_COUNT,
        EVENT_TRACK_COUNT_CHANGED,
        'tracksCheckBox',
        KEY_TRACKS_ENABLED,
        TRACKS_ENABLED_DEFAULT_VALUE,
        EVENT_TRACK_ENABLED_CHANGED
    )
});

function initTopTracksDropdown(
    selectElementId,
    trackCountKey,
    defaultTrackCount,
    tracksCountChangeEvent,
    checkboxElementId,
    enabledKey,
    defaultEnabled,
    enabledChangeEvent
) {
    const trackCountSelect = document.getElementById(selectElementId);
    const trackCountCheckbox = document.getElementById(checkboxElementId)

    populateDropdown(trackCountSelect)

    trackCountSelect.addEventListener('change', () => {
        const trackCount = trackCountSelect.value
        console.log(`Track count changed for ${selectElementId}: ${trackCount}`);

        chrome.storage.sync.set({[trackCountKey]: trackCount})

        chrome.runtime.sendMessage({
            event: tracksCountChangeEvent,
            trackCount: trackCount
        })
    })

    trackCountCheckbox.addEventListener('change', () => {
        const enabled = trackCountCheckbox.checked
        console.log(`Enable changed for ${checkboxElementId}: ${enabled}`)

        trackCountSelect.disabled = !enabled

        chrome.storage.sync.set({[enabledKey]: enabled})

        chrome.runtime.sendMessage(({
            event: enabledChangeEvent,
            enabled: enabled
        }))
    })

    chrome.storage.sync.get(
        {
            [trackCountKey]: defaultTrackCount,
            [enabledKey]: defaultEnabled
        },
        result => {
            trackCountSelect.value = result[trackCountKey]
            trackCountCheckbox.checked = result[enabledKey]
            trackCountSelect.disabled = !result[enabledKey]
    })
}

function populateDropdown(trackCountSelect) {
    for (let i = 1; i <= 10; i++) {
        const option = document.createElement('option');
        option.value = i.toString();
        option.text = i.toString();
        trackCountSelect.appendChild(option);
    }
}