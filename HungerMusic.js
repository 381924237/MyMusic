let EventCenter = {
  on(type,handler){
    $(document).on(type,handler)
  },
  fire(type,data){
    $(document).trigger(type,data)
  }
}


let Footer = {
  init(){
    this.$footer = $('footer')
    this.$ul = this.$footer.find('ul')
    this.$box = this.$footer.find('.box')
    this.$leftBtn = this.$footer.find('.icon-left')
    this.$rightBtn = this.$footer.find('.icon-right')
    this.isToEnd = false
    this.isToStart = true
    this.isAnimate = false
    this.bind()
    this.getData()
  },
  bind(){
    this.$rightBtn.on('click',()=>{
      if(this.isAnimate) return
      let itemWidth = this.$box.find('li').outerWidth(true)
      let rowCount = Math.floor(this.$box.width()/itemWidth)
      if(!this.isToEnd){
        this.isAnimate = true
        this.$ul.animate({
          left: '-=' +  itemWidth*rowCount
        },400,()=>{
          this.isAnimate = false
          this.isToStart = false
          if(parseFloat(this.$box.width()) - parseFloat(this.$ul.css('left')) >= this.$ul.width()){
            this.isToEnd = true
          }
        })
      }
    })

    this.$leftBtn.on('click',()=>{
      if(this.isAnimate) return
      let itemWidth = this.$box.find('li').outerWidth(true)
      let rowCount = Math.floor(this.$box.width()/itemWidth)
      if(!this.isToStart){
        this.isAnimate = true
        this.$ul.animate({
          left: '+=' + itemWidth * rowCount
        },300,()=>{
          this.isAnimate = false
          this.isToEnd = false
          if(parseFloat(this.$ul.css('left')) >= 0){
            this.isToStart = true
          }
        })
      }
    })

    this.$footer.on('click','li',function(){
      $(this).addClass('active')
             .siblings().removeClass('active')
      
      EventCenter.fire('select-album',{
        channelId: $(this).attr('data-channel-id'),
        channelName: $(this).attr('data-channel-name')
      })
    })
  },
  getData(){
    $.getJSON('//jirenguapi.applinzi.com/fm/getChannels.php')
      .done((ret)=>{
        // console.log(ret)
        this.render(ret.channels)
      }).fail(()=>{
        console.log('error...')
      })
      
  },
  render(channels){
    let html = '' 
    channels.unshift({
      channel_id: 0,
      name: '我的最爱',
      cover_small: 'http://cloud.hunger-valley.com/17-10-24/1906806.jpg-small',
      cover_middle: 'http://cloud.hunger-valley.com/17-10-24/1906806.jpg-middle',
      cover_big: 'http://cloud.hunger-valley.com/17-10-24/1906806.jpg-big'
    })
    channels.forEach(function(channel){
      html += '<li class="item" data-channel-id='+channel.channel_id+' data-channel-name='+channel.name+'>'
           + '<div class="cover" style="background-image:url('+channel.cover_small+')"></div>'
           + '<h3>'+channel.name+'</h3>'
           + '</li>'
    })
    this.$footer.find('ul').html(html)
    this.setStyle()
  },
  setStyle(){
    let count = this.$footer.find('li').length
    let width = this.$footer.find('li').outerWidth(true)
    this.$ul.css({
      width: count * width + 'px'
    })
  }
}

let Fm = {
  init(){
    this.$container = $('#panel main')
    this.$play = this.$container.find('.btn-play')
    this.$love = this.$container.find('.btn-love')
    this.$next = this.$container.find('.btn-next')
    this.collections = this.loadFromLocal()
    this.currentSong = null
    this.audio = new Audio()
    this.clock
    this.percent = 0
    this.audio.autoplay = true
    this.bind()

    EventCenter.fire('select-album',{
      channelId: '11',
      channelName: '随便听听'
    })
  },
  bind(){
    EventCenter.on('select-album',(e,data)=>{
      this.channelId = data.channelId
      this.channelName = data.channelName
      this.$play.removeClass('icon-play').addClass('icon-stop')
      this.loadMusic()
    })

    this.$play.on('click',()=>{
      if(this.audio.paused){
        this.$play.removeClass('icon-play').addClass('icon-stop')
        this.audio.play()          
      }else{
        this.$play.removeClass('icon-stop').addClass('icon-play')
        this.audio.pause()          
      }
    })

    this.$next.on('click',()=>{
      this.loadMusic()
    })

    this.audio.addEventListener('play',()=>{
      clearInterval(this.clock)
      this.clock = setInterval(()=>{
        this.updateMusicStatus()
      },1000)
    })

    this.audio.addEventListener('pause',()=>{
      clearInterval(this.clock)
    })

    this.audio.addEventListener('ended',()=>{
      this.loadMusic()
    })

    this.$container.find('.bar').on('click',(e)=>{
      this.percent = e.offsetX / this.$container.find('.bar').width()
      this.audio.currentTime = this.audio.duration * this.percent
      this.updateMusicStatus()
    })

    this.$container.find('.btn-love').on('click',(e)=>{
      let $btn = $(e.target)
      if($btn.hasClass('active')){
        $btn.removeClass('active')
        delete this.collections[this.currentSong.sid]
      }else{
        $btn.addClass('active')
        this.collections[this.currentSong.sid] = this.currentSong
      }
      this.saveToLocal()
      // console.log(this.collections)
    })
  },
  loadMusic(){
    if(this.channelId === '0'){
      this.loadCollection()
    }else{
      $.getJSON('//api.jirengu.com/fm/getSong.php',{channel:this.channelId})
      .done((ret)=>{
        this.song = ret.song[0]
        // console.log(this.song)
        this.setMusic(this.song)

      })
    }
  },
  setMusic(song){
    this.currentSong = song
    this.audio.src = song.url
    $('.background').css('background-image','url('+song.picture+')')
    this.$container.find('figure').css('background-image','url('+song.picture+')')
    this.$container.find('h3').text(song.title)
    this.$container.find('.author').text(song.artist)
    this.$container.find('.tab').text(this.channelName)
    this.$container.find('.number-1').text(this.getRandomInt(1000,5000))
    this.$container.find('.number-2').text(this.getRandomInt(1000,5000))
    this.$container.find('.number-3').text(this.getRandomInt(1000,5000))

    if(this.collections[song.sid]){
      this.$container.find('.btn-love').addClass('active')
    }else{
      this.$container.find('.btn-love').removeClass('active')
    }

    this.$play.removeClass('icon-play').addClass('icon-stop')

    this.loadLyric(song)
  },
  loadLyric(song){
    $.getJSON('//api.jirengu.com/fm/getLyric.php',{sid:song.sid})
    .done((ret)=>{
      let lyric = ret.lyric
      // window.lyric = ret.lyric
      let lyricObj = {}
      lyric.split('\n').forEach((line)=>{
        let times = line.match(/\d{2}:\d{2}/g)
        let str = line.replace(/\[.+?\]/g,'')
        if(times){
          lyricObj[times] = str
        }
      })
      this.lyricObj = lyricObj
      console.log(this.lyricObj)
    })
  },
  updateMusicStatus(){
    this.$container.find('.bar-progress').css('width',(this.audio.currentTime/this.audio.duration)*100 + '%')
    let min = Math.floor(this.audio.currentTime/60) + ''
    min = (min.length === 2) ? min : ('0' + min)
    let sec = Math.floor(this.audio.currentTime%60) + ''
    sec = (sec.length === 2) ? sec : ('0' + sec)
    this.$container.find('.currentTime').text(min + ':' + sec)

    let line = this.lyricObj[min + ':' + sec]
    console.log(line)
    if(this.lyricObj && line){
      this.$container.find('.lyric').text(line)
    }
  },
  getRandomInt(min,max){
    return Math.floor(Math.random()*(max-min+1)) + min
  },

  loadFromLocal(){
    return JSON.parse(localStorage['collections']||'{}')
  },
  saveToLocal(){
    localStorage['collections'] = JSON.stringify(this.collections)
  },
  loadCollection(){
    let keyArray = Object.keys(this.collections)
    if(keyArray.length === 0) return 
    let randomIndex = Math.floor(Math.random()*keyArray.length)
    let randomSid = keyArray[randomIndex]
    this.setMusic(this.collections[randomSid])
  }
}


Footer.init()
Fm.init()
