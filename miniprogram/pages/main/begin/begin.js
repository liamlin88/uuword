// pages/main/begin/begin.js
Page({

  /**
   * Page initial data
   */
  data: {
    englishword: "",
    mark: "",
    chinesename: "",
    id: [],
    forgetTimes: [],//忘记次数
    repeatTime: [],//为了判定跳出背单词循环设置的变量
    chinesenameDisplayProperty: 'hidden',
    showChinese: '',
    time: (new Date()).toString(),//获得当前时间函数
    number: 0,
    reviewNumber: 0, //复习单词数量 
    ascPoint: []
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
   var that = this
    var app = getApp()
    const db = wx.cloud.database()
    console.log('ssasadca', app.globalData.userid)
    db.collection('user').where({
      _openid: app.globalData.userid
    }).get({
      success(res){
        db.collection('words').skip(res.data[0].wordsum - 1).limit(1).get({
          success(res){
            that.show(res.data[0]._id)
          }
        })
      }
    })
    that.getId(app.globalData.userid)
    that.changeDBwordsum()
  },
  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function () {

  },
  /**
   * Lifecycle function--Called when page show
   */
  onShow: function () {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide: function () {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function () {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh: function () {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom: function () {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage: function () {
  },

  getId: function () {
    this.getWords()
    //之前的名字好像和功能不太对映哈
  },
  /*
  * 从数据库获得的单词
  * 这是一个可以用来递归的函数，因为微信限制我们只能拿20个一次，所以我们多次调用这个函数来多拿单词
  * 用了promise写法
  */
  getWords: function (wordid = [], forget =[], repeat=[],skipCount = 0 ) {
    let app = getApp()
    //没查到怎么添加结构体数组，就声明了三个数组，每个数组对应位置都代表同一个单词的属性
    const db = wx.cloud.database()
    let length = 0
    db.collection('user').where({
      _openid: app.globalData.userid
    }).get()
      .then(res => {
        length = res.data[0].wordcount //数据库中openid等于该用户openid的数据只有一条，因此取第0号元素则为该用户，wordcount为每日单词量, skipCount表示已经拿了多少个单词了（微信有限制一次只能拿20条数据）
          if (res.data[0].wordsum +skipCount == 0) {   
          //微信的BUG, skip=0时候报错
          return db.collection('words').get()
        } else {
          return db.collection('words').skip(res.data[0].wordsum+skipCount).get()
        }   
      })
      .then(res => {
        console.log(res)
        let unavailableWordsCount = length - skipCount
        let t = unavailableWordsCount < 20 ? unavailableWordsCount : 20
        for (let i = 0; i < t; i++) {
          forget.push(0)
          repeat.push(0)
          wordid.push(res.data[i]._id)
        }//初始化，将单词id放到wordid数组中，忘记和重复置0
        if (res.data.length + skipCount < length) {
          skipCount += res.data.length
          this.getWords(wordid, forget, repeat, skipCount)
        } else {
          this.setData({
            id: wordid,
            forgetTimes: forget,
            repeatTime: repeat
          })
        }
      })
  },
  know: function () {
    var id = this.data.id.shift()
    var forgettimes = this.data.forgetTimes.shift()
    var repeattimes = this.data.repeatTime.shift()
    //取数组0号元素
    if (forgettimes == 0) {//第一次就记住则标记记住并加入recite
      this.onAdd(id, "know", 0)
    }
    else {//不是第一次记住标记忘记并加入recite
      this.onAdd(id, "unclear", forgettimes)
    }
    this.show(this.data.id[0])//这个地方就是因为在最开始就show（）了一下，为了保持看到的东西和实际存的东西同步，因此就取下一个show，也就是数组的第1号元素而不是第0号
    this.check()
    this.reset()
  },
  unclear: function () {
    var id = this.data.id.shift()
    var forgettimes = this.data.forgetTimes.shift()
    var repeattimes = this.data.repeatTime.shift()
    this.data.id.push(id)
    this.data.forgetTimes.push(forgettimes + 0.5)//模糊时 我就定为忘记次数记+0.5
    this.data.repeatTime.push(repeattimes + 1)
    this.show(this.data.id[0])
    this.check()
    this.reset()
  },
  strange: function () {
    var id = this.data.id.shift()
    var forgettimes = this.data.forgetTimes.shift()
    var repeattimes = this.data.repeatTime.shift()
    this.data.id.push(id)
    this.data.forgetTimes.push(forgettimes + 1)//忘记时 忘记次数记+1
    this.data.repeatTime.push(repeattimes + 1)
    this.show(this.data.id[0])
    this.check()
    this.reset()
  },
  check: function () {//确认是不是满足背完单词的条件，即重复次数到了5次或者全背完了则完成今日背诵
    var checkbutton = false
    for (var i = 0; i < this.data.repeatTime.length; i++) {
      if (this.data.repeatTime[i] >= 5) {
        checkbutton = true
      }
    }
    for (var i = 0; i < this.data.id.length; i++) {
      console.log('id:', this.data.id[i], ' forgettimes:', this.data.forgetTimes[i], '  repeattimes:', this.data.repeatTime[i])
    }//控制台看忘记和重复次数，方便监控
    console.log('times show end')
    if (this.data.id.length == 0 || checkbutton == true) {
      for (var i = 0; i < this.data.id.length; i++) {
        this.onAdd(this.data.id[i], "forget", this.data.forgetTimes[i])
      }
      wx.redirectTo({//满足条件跳转到final
        url: '../finish/finish',
      })
    }
  },
  onAdd: function (id, state, forgettimes) {
    const db = wx.cloud.database()
    db.collection('recite').add({
      data: {
        rememberstate: state,
        forgetTimes: forgettimes,
        time: this.data.time,
        wordid: id,
      },
      success: res => {
        // 在返回结果中会包含新创建的记录的 _id
        console.log('[repite数据库] [新增记录] 成功，记录 _id: ', res._id)
      },
      fail: err => {
        console.error('[repite数据库] [新增记录] 失败：', err)
      }
    })
  },
  show: function (id) {
    var that = this
    const db = wx.cloud.database()
    db.collection('words').doc(id).get({
      success(res) {
        // res.data 包含该记录的数据
        that.setData({
          englishword: res.data.english,
          mark: res.data.soundmark,
          chinesename: res.data.translate
        })
      }
    })
  },
  showChinesename: function () {
    this.setData({
      chinesenameDisplayProperty: '',
      showChinese: 'hidden'
    })
  },
  notShowChinesename: function () {
    this.setData({
      chinesenameDisplayProperty: 'hidden',
      showChinese: ''

    })
  },
  reset: function () {
    //换页的时候，记得叫一下这个函数
    this.notShowChinesename();
  },
  review: function (wordid = [], skipCount = 0) {
    const db = wx.cloud.database()
    db.collection("user").where({
      _openid: app.globalData.userid
    }).get()
      .then(res => {

        // length = res.data[0].wordcount
        if (skipCount == 0) {
          //当跳转单词为0，从第一条数据按顺序返回20条数据
          return db.collection('recite').get()
        } else {
          //如果不为0，则从第skipCount条往后开始返回20条数据

          return db.collection('recite').skip(skipCount).get()
        }

      }).then(res => {

        for (let i = 0; i < res.data.length; i++) {
          wordid.push(res.data[i]._id)
        }
        if (res.data.length == 0) {

          this.setData({
            number: this.data.id.length,
            // 100 将来会被 total number word 替代

          })

        } else {
          skipCount += res.data.length
          this.review(wordid, skipCount)

          this.setData({
            id: wordid,
            reviewNumber: wordid.length,
            // ascPoint: res.data.forgetTimes


          })
        }
        console.log(this.data.id)

      })
    // if(this.data.reviewNumber == 0){
    //   return db.collection("recite").get()
    // }else{
    // const db = wx.cloud.database()
    // db.collection('recite').orderBy('forgetTimes', 'des')
    //   .get()
    //   .then(console.log)
    //   .catch(console.error)
    // }
  },
  //用来改变数据库中 wordsum属性
  changeDBwordsum: function (openid) {
    const db = wx.cloud.database()
    var length = this.getReciteWords()
    console.log('llllllllelsl',length)
    db.collection('user').where({
      _openid: openid
    }).get({
      success: res => {
        db.collection('user').doc(res.data[0]._id).update({
          data: {
            wordsum: length
          }
        })
      }
    })
  },
  getReciteWords: function (wordid = [], skipCount = 0) {

      this.getTotalNumberWord()
      var app = getApp()
    const db = wx.cloud.database()
    db.collection("user").where({
      _openid: app.globalData.userid
    }).get()
      .then(res => {
        // length = res.data[0].wordcount
        if (skipCount == 0) {
          //当跳转单词为0，从第一条数据按顺序返回20条数据
          return db.collection('recite').get()
        } else {
          //如果不为0，则从第skipCount条往后开始返回20条数据

          return db.collection('recite').skip(skipCount).get()
        }

      }).then(res => {

        for (let i = 0; i < res.data.length; i++) {
          wordid.push(res.data[i]._id)
        }
        if (res.data.length != 0) {
          skipCount += res.data.length
          //   this.getReciteWords(wordid, skipCount)

          // this.setData({
          //   id: wordid,
          // })
        }


      })
    return wordid.length
  },
  //获取words数据库里的单词总数量
  getTotalNumberWord: function (wordid = [], skipCount = 0) {

    const db = wx.cloud.database()
    db.collection("words").get({
      success: res => {
        console.log("uye", res.data.length)
      }
    })
  },
})
