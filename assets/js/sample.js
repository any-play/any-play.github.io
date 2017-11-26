var app = new AnyPlay.Plugin('sample')
var api = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/f.json'

function getJson() {
  if (storage.json) return Promise.resolve(storage.json)

  var p = fetch(api).then(res => res.json())
  .then(data => (storage.json = data.categories[0]))

  getJson = () => p

  return p
}

app.route('/', values => {
  return getJson().then(data => {
    let links = data.videos.map((video, index) => {
      return {
        src: '/' + index.toString(),
        poster: data.images + video['image-480x270'],
        title: video.title,
        description: video.subtitle
      }
    });

    return {
      title: 'Chrome cast example videos',
      links: links
    }
  })
})

app.route('/:pid', values => {
  return getJson().then(data => {
    let video = data.videos[parseInt(values.pid)]

    return {
      title: video.title,
      video: {
        poster: data.images + video['image-480x270'],
        source: video.sources.map(source => ({
          type: source.mime.replace('videos/mp4', 'video/mp4'),
          src: data[source.type] + source.url
        }))
      }
    }
  })
})
