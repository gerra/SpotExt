const CLIENT_ID = "4702359ae40b439c9bb8f23d02364dc1"
const TOP_TRACKS_CONTEXT_MENU_ID = "top_tracks_context_menu"
const TOP_TRACKS_DEFAULT_COUNT = 5

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

    getTopTracksByArtistWithAT(artistName, count, accessToken) {
        const artistIdUrl = new URL('/v1/search', 'https://api.spotify.com')
        const artistIdSearchParams = new URLSearchParams({
            'q': artistName,
            'type': 'artist',
            'limit': '1'
        })
        artistIdUrl.search = artistIdSearchParams.toString()

        const artistIdPromise = fetch(artistIdUrl.href, this.fetchInit(accessToken))
            .then(response => response.json())
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

getTracksCountFromStorage()
    .then(tracksCount => {
        chrome.contextMenus.create({
            id: TOP_TRACKS_CONTEXT_MENU_ID,
            title: contextMenuTitle(tracksCount),
            contexts: ["selection"],
        });
    })

function contextMenuTitle(count) {
    return `Show Top ${count} Tracks`
}

chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === TOP_TRACKS_CONTEXT_MENU_ID) {
        onTopTracksShowClicked(info.selectionText)
    }
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.event === 'trackCountChanged') {
        const trackCount = message.trackCount
        chrome.contextMenus.update(TOP_TRACKS_CONTEXT_MENU_ID, {
            title: contextMenuTitle(trackCount)
        })
    }
});

const spotifyService = new SpotifyService()

function getTracksCountFromStorage() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(
            {'trackCount': TOP_TRACKS_DEFAULT_COUNT},
            function (result) {
                const trackCount = result.trackCount;
                resolve(trackCount)
        });
    })

}

function onTopTracksShowClicked(selectionText) {
    getTracksCountFromStorage()
        .then(tracksCount => spotifyService.getTopTracksByArtist(selectionText, tracksCount))
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
