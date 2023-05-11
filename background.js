const CLIENT_ID = "4702359ae40b439c9bb8f23d02364dc1"

const TOP_TRACKS_DEFAULT_COUNT = 5

const ARTIST_TRACKS_CONTEXT_MENU_ID = "top_artist_tracks_context_menu"
const TRACKS_CONTEXT_MENU_ID = "top_tracks_context_menu"

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

class SpotifyAuthorizator {
    auth() {
        const redirectUrl = chrome.identity.getRedirectURL();
        const authUrl = this.buildAuthUrl(redirectUrl)
        return new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow({
                url: authUrl,
                interactive: true
            }, function (redirectUrl) {
                try {
                    const accessToken = redirectUrl.match(/access_token=([^&]+)/)[1];
                    resolve(accessToken)
                } catch (e) {
                    reject(e)
                }
            });
        })

    }

    buildAuthUrl(redirectUrl) {
        const authUrl = new URL("https://accounts.spotify.com/authorize")
        const authParams = new URLSearchParams({
            'client_id': CLIENT_ID,
            'response_type': 'token',
            'redirect_uri': redirectUrl,
            'scope': 'user-top-read,user-read-private'
        })
        authUrl.search = authParams.toString()
        return authUrl.href
    }
}

class SpotifyService {

    constructor() {
        this.authorizator = new SpotifyAuthorizator()

    }

    getTopTracksByArtist(artistName, count) {
        return this.authorizator
            .auth()
            .then(accessToken => this.getTopTracksByArtistWithAT(artistName, count, accessToken))
    }

    getTopTracks(query, count) {
        return this.authorizator
            .auth()
            .then(accessToken => this.querySpotify(query, 'track', count, accessToken))
            .then(data => data.tracks.items)
    }

    getTopTracksByArtistWithAT(artistName, count, accessToken) {
        console.log(artistName + ' ' + count)

        const artistIdUrl = new URL('/v1/search', 'https://api.spotify.com')
        const artistIdSearchParams = new URLSearchParams({
            'q': artistName,
            'type': 'artist',
            'limit': '1'
        })
        artistIdUrl.search = artistIdSearchParams.toString()

        const artistIdPromise = this.querySpotify(artistName, 'artist', 1, accessToken)
            .then(data => data.artists.items[0].id)

        const countryUrl = new URL('/v1/me', 'https://api.spotify.com')
        const countryPromise = fetch(countryUrl.href, this.fetchInit(accessToken))
            .then(response => response.json())
            .then(data => data.country)
            .catch(() => 'US')

        return Promise.all([artistIdPromise, countryPromise])
            .then(results => {
                const artistId = results[0]
                const country = results[1]
                console.log(`artistId: ${artistId}, country: ${country}`)
                return this.getTopTracksByArtistIdWithAT(artistId, count, country, accessToken)
            })
    }

    querySpotify(query, type, limit, accessToken) {
        const searchUrl = new URL('/v1/search', 'https://api.spotify.com')
        const searchParams = new URLSearchParams({
            'q': query,
            'type': type,
            'limit': limit.toString()
        })
        searchUrl.search = searchParams.toString()
        return fetch(searchUrl.href, this.fetchInit(accessToken))
            .then(response => response.json())
    }

    getTopTracksByArtistIdWithAT(artistId, count, country, accessToken) {

        const url = new URL(`/v1/artists/${artistId}/top-tracks`, 'https://api.spotify.com')
        const urlParams = new URLSearchParams({
            'limit': count.toString(),
            'market': country
        })
        url.search = urlParams.toString()

        return fetch(url.href, this.fetchInit(accessToken))
            .then(response => response.json())
            .then(data => data.tracks.slice(0, count))
    }

    fetchInit(accessToken) {
        return {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }
    }
}

const spotifyService = new SpotifyService()

initContextMenuItems()
function initContextMenuItems() {
    chrome.contextMenus.removeAll()
    initContextMenuItem(
        ARTIST_TRACKS_CONTEXT_MENU_ID,
        KEY_ARTIST_TRACKS_ENABLED,
        ARTIST_TRACKS_ENABLED_DEFAULT_VALUE,
        KEY_ARTIST_TRACK_COUNT,
        artistTracksContextMenuTitle
    )
    initContextMenuItem(
        TRACKS_CONTEXT_MENU_ID,
        KEY_TRACKS_ENABLED,
        TRACKS_ENABLED_DEFAULT_VALUE,
        KEY_TRACK_COUNT,
        tracksContextMenuTitle
    )
}

function initContextMenuItem(id, enabledKey, defaultEnabled, trackCountKey, titleFunction) {
    getEnabledFromStorage(enabledKey, defaultEnabled)
        .then(enabled => updateContextMenu(id, enabled, trackCountKey, titleFunction))
}

function updateContextMenu(id, enabled, trackCountKey, titleFunction) {
    if (enabled) {
        getTracksCountFromStorage(trackCountKey)
            .then(tracksCount => {
                chrome.contextMenus.create({
                    id: id,
                    title: titleFunction(tracksCount),
                    contexts: ["selection"],
                });
            })
    } else {
        chrome.contextMenus.remove(id, () => {
            chrome.runtime.lastError // to ignore
        })
    }
}

function artistTracksContextMenuTitle(count) {
    return `Show ${count} Tracks of Artist`
}

function tracksContextMenuTitle(count) {
    return `Show ${count} Tracks`
}

chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === ARTIST_TRACKS_CONTEXT_MENU_ID) {
        onTopTracksShowClicked(KEY_ARTIST_TRACK_COUNT, info.selectionText, spotifyService.getTopTracksByArtist)
    } else if (info.menuItemId === TRACKS_CONTEXT_MENU_ID) {
        onTopTracksShowClicked(KEY_TRACK_COUNT, info.selectionText, spotifyService.getTopTracks)
    }
});

chrome.runtime.onMessage.addListener((message) => {
    tryHandleCountChange(message)
    tryHandleEnableChange(message)
});

function tryHandleCountChange(message) {
    let id = null;
    let titleFunction = null;
    switch (message.event) {
        case EVENT_ARTIST_TRACK_COUNT_CHANGED:
            id = ARTIST_TRACKS_CONTEXT_MENU_ID
            titleFunction = artistTracksContextMenuTitle
            break
        case EVENT_TRACK_COUNT_CHANGED:
            id = TRACKS_CONTEXT_MENU_ID
            titleFunction = tracksContextMenuTitle
            break
    }
    if (id && titleFunction) {
        const trackCount = message.trackCount
        chrome.contextMenus.update(id, {
            title: titleFunction(trackCount)
        })
    }
}

function tryHandleEnableChange(message) {
    switch (message.event) {
        case EVENT_ARTIST_TRACK_ENABLED_CHANGED:
        case EVENT_TRACK_ENABLED_CHANGED:
            initContextMenuItems()
            break
    }
}

function getTracksCountFromStorage(trackCountKey) {
    return getStorageValuePromise(trackCountKey, TOP_TRACKS_DEFAULT_COUNT)
}

function getEnabledFromStorage(enabledKey, defaultEnabled) {
    return getStorageValuePromise(enabledKey, defaultEnabled)
}

function getStorageValuePromise(key, defValue) {
    return new Promise((resolve) => {
        chrome.storage.sync.get(
            {[key]: defValue},
            function (result) {
                resolve(result[key])
            });
    })
}

function onTopTracksShowClicked(trackCountKey, selectionText, topTracksFunction) {
    getTracksCountFromStorage(trackCountKey)
        .then(tracksCount => topTracksFunction.call(spotifyService, selectionText, tracksCount))
        .then(tracks => showTracks(tracks))
        .catch(e => console.error(e))
}

function showTracks(tracks) {
    getCurrentTabId((tabId) => {
        const songIds = tracks.map(track => track.id);
        const message = {
            event: 'showTracks',
            songIds: songIds,
        };
        chrome.tabs.sendMessage(tabId, message);
    }, () => console.error("Unable to get current tab id"))
}

function getCurrentTabId(onSuccess, onFail) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (tabs.length > 0) {
            onSuccess(tabs[0].id)
        } else {
            onFail()
        }
    });
}
