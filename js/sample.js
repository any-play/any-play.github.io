var app = new AnyPlay.Plugin('sample')
var json = fetch('https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/f.json')
.then(res => res.json())
.then(data => data.categories[0])

app.route('/', values => {
  return json.then(data => {
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
  return json.then(data => {
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
