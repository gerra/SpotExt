document.addEventListener('DOMContentLoaded', () => {
    const trackCountSelect = document.getElementById('trackCountSelect');
    populateDropdown(trackCountSelect)

    chrome.storage.sync.get({'trackCount': 5}, function (result) {
        trackCountSelect.value = result.trackCount
    })

    trackCountSelect.addEventListener('change', () => {
        const trackCount = trackCountSelect.value
        console.log(`Track count changed: ${trackCount}`);

        chrome.storage.sync.set({trackCount: trackCount});

        chrome.runtime.sendMessage({
            event: 'trackCountChanged',
            trackCount: trackCount
        })
    });
});

function populateDropdown(trackCountSelect) {
    for (let i = 1; i <= 10; i++) {
        const option = document.createElement('option');
        option.value = i.toString();
        option.text = i.toString();
        trackCountSelect.appendChild(option);
    }
}