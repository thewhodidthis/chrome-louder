window.AudioContext = window.AudioContext || window.webkitAudioContext

const louder = {}

chrome.browserAction.onClicked.addListener(({ audible }) => {
  // Skip if tab capture unavailable
  if (!audible) {
    return
  }

  if (louder.audio && louder.audio.state === 'running') {
    // Revert
    louder.fader.gain.setTargetAtTime(1.0, louder.audio.currentTime + 0.25, 0.5)

    // Prep for next click
    louder.fader.disconnect()
    louder.input.mediaStream.getAudioTracks().pop().stop()
    louder.audio.close()

    return
  }

  chrome.tabCapture.capture({ audio: true }, (stream) => {
    if (stream) {
      const audio = new AudioContext()

      const input = audio.createMediaStreamSource(stream)
      const fader = audio.createGain()

      fader.gain.setTargetAtTime(3.0, audio.currentTime + 0.25, 0.25)

      input.connect(fader)
      fader.connect(audio.destination)

      Object.assign(louder, { audio, input, fader })
    } else {
      console.log(chrome.runtime.lastError)
    }
  })
})

const handleIconChange = ({ status, tabId }) => {
  const variant = status === 'active' ? 'x' : ''
  const basename = variant.length ? `icon-${variant}` : 'icon'

  chrome.browserAction.setIcon({ tabId, path: `assets/${basename}.png` })
}

chrome.tabCapture.getCapturedTabs((capturedTabs) => {
  capturedTabs.forEach(handleIconChange)
})

chrome.tabCapture.onStatusChanged.addListener(handleIconChange)
