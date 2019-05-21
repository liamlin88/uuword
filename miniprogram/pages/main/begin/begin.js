// pages/main/begin/begin.js
var util = require('../../../utils/util.js')
const app = getApp()
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
    ascPoint: [],
    length:0,//改变wordsum用的
    review:0,//改变realnum用的
    currentbook:null,
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
   var that = this
    that.getReciteWords()//更新数据库的wordsum
    const db = wx.cloud.database()
    // 解决第一个单词不显示的问题（虽然还是会出现第一个单词不显示，但是是偶然现象）
    db.collection('user').where({
      _openid: app.globalData.userid
    }).get({
      success(res){
            db.collection('words2').where({
              range: res.data.currentBook
            }).skip(res.data[0].wordsum - 1).limit(1).get({
          success(res){
            that.show(res.data[0]._id)
          }
        })
        // setData({
        //   currentbook: res.data.currentBook
        // })
     //   console.log('hujimh,ihj', that.data.currentbook)
      },
      complete:com =>{
        that.getId()
      }
    })
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
    var app = getApp()
    var recitenum//复习量
    var twoThirdCountnum//每日单词量的2/3，取整
    let realnum//当天复习的真实数量
    var newnum//到当天为止新学单词数总和
    var reviewnum//到当天为止复习单词书总和
    var that = this
    const db = wx.cloud.database()
    db.collection('recite').where({
      _openid:app.globalData.userid,
      rememberstate:"unclear"
    }).count({
      success(res) {
        recitenum = res.total
      },
      complete(com){
        db.collection('user').where({
          _openid: app.globalData.userid
        }).get({
          success(res) {
            if (!app.globalData.learnmore) 
            {//如果不是再来10个的话，这个量就取每日单词量的2/3，如果是再来10个的话就取7
            twoThirdCountnum = (res.data[0].wordcount * 2 / 3).toFixed(0)
            }
            else{
              twoThirdCountnum = 7
            }
          },
          complete: com => {//防止异步执行，按顺序执行代码
            realnum = twoThirdCountnum < recitenum ? twoThirdCountnum : recitenum
            that.setData({
              review: realnum
            })
            db.collection('user').where({
              _openid:app.globalData.userid
            }).get({
              success(res){
                if (!app.globalData.learnmore) {//单词总数 再来10个就取10，不然的话就从数据库中找
                newnum = res.data[0].newnum + res.data[0].wordcount - that.data.review
                }
                else{
                  newnum = res.data[0].newnum + 10 - that.data.review
                }
                reviewnum = res.data[0].reviewnum + that.data.review
                console.log('newnum|reviewnum|res.new|res.review', newnum, reviewnum, res.data[0].newnum, res.data[0].reviewnum)
              },
            })
            that.getReview()//取出复习的单词
            that.getWords()//取出新学的单词
          },
        })
      }
    })
  },
  /*
  * 从数据库获得的单词
  * 这是一个可以用来递归的函数，因为微信限制我们只能拿20个一次，所以我们多次调用这个函数来多拿单词
  * 用了promise写法
  */
  getReview: function (wordid = [], forget = [], repeat = [], skipCount = 0) {
    let app = getApp()
    //没查到怎么添加结构体数组，就声明了三个数组，每个数组对应位置都代表同一个单词的属性
    const db = wx.cloud.database()
    let length = 0
    var that = this
    db.collection('user').where({
      _openid: app.globalData.userid
    }).get()
      .then(res => {
          length =  that.data.review
       //   console.log('1400s0as', length)
        db.collection('user').doc(res.data[0]._id).update({//更新数据库中的复习总数
          data: {
            reviewnum: res.data[0].reviewnum + length
          }
        })
        if (skipCount == 0) {
          //微信的BUG, skip=0时候报错
          return db.collection('recite').where({
            rememberstate: "unclear"
          }).where({
            _openid:app.globalData.userid
            }).orderBy('forgetTimes', 'desc').get()//按忘记次数降序排序
        } else {
          return db.collection('recite').skip(skipCount).where({
            rememberstate: "unclear"
          }.where({
            _openid: app.globalData.userid
          }).orderBy('forgetTimes', 'desc')).get()
        }
      })
      .then(res => {
        let unavailableWordsCount = length - skipCount
        let t = unavailableWordsCount < 20 ? unavailableWordsCount : 20
     //   console.log('dataaaaaaaaaaa',res.data)
        for (let i = 0; i < t; i++) {
          forget.push(0)
          repeat.push(0)
          wordid.push(res.data[i].wordid)
          that.removeID(res.data[i].wordid)
        }//初始化，将单词id放到wordid数组中，忘记和重复置0
        if (res.data.length + skipCount < length) {
          skipCount += res.data.length
          this.getWords(wordid, forget, repeat, skipCount)
        } else {
          this.setData({//将复习和新学的单词合并到一起后成为wordid进行后续操作
            id: this.data.id.concat(wordid),
            forgetTimes: this.data.forgetTimes.concat(forget),
            repeatTime: this.data.repeatTime.concat(repeat)
          })
        }
    //    console.log('id|forget|repeatassss',that.data.id,that.data.forgetTimes,that.data.repeatTime)
      })
  },

removeID:function(wordid){//数据库中复习的单词我设定成了以最后一次背诵为准，所以拿出来的数就把之前的数据就给删除了
  var app = getApp()
  const db = wx.cloud.database()
  db.collection('recite').where({
    _openid: app.globalData.userid
  }).where({
    wordid: wordid
  }).get({
    success(res) {
      db.collection('recite').doc(res.data[0]._id).remove({
        success(res) {
          console.log('remove success')
        }
      })
      console.log('remove success in ',res.data)
    }
    }) 
},
//getwords和getreview大同小异，只是从不同的数据中取值
getWords: function (wordid = [], forget =[], repeat=[],skipCount = 0 ) {
    let app = getApp()
    var that = this
    //没查到怎么添加结构体数组，就声明了三个数组，每个数组对应位置都代表同一个单词的属性
    const db = wx.cloud.database()
    let length = 0
    db.collection('user').where({
      _openid: app.globalData.userid
    }).get()
      .then(res => {
        　if(app.globalData.learnmore){
          length = 10;//因为那个界面上是再来10个，我觉得10个还是比较合理的，后续可以改，
        }
        else{
           if (!app.globalData.learnmore){
           length = res.data[0].wordcount - this.data.review
           }
           else{
             length = 10 - this.data.review
           }
        //   console.log('1422222',length)
           db.collection('user').doc(res.data[0]._id).update({
             data: {
               newnum: res.data[0].newnum+length
             }
           })
        }
        console.log('hujimh,ihj', res.data[0].currentBook)
          if (res.data[0].wordsum +skipCount == 0) {   
          //微信的BUG, skip=0时候报错
     //     return db.collection('words2').get()
             return db.collection('words2').where({
               range: res.data[0].currentBook
             }).get()
        } else {
       //   return db.collection('words2').skip(res.data[0].wordsum+skipCount).get()
             return db.collection('words2').where({
               range: res.data[0].currentBook
             }).skip(res.data[0].wordsum + skipCount).get()
        }   
      })
      .then(res => {
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
            id: this.data.id.concat(wordid),
            forgetTimes: this.data.forgetTimes.concat(forget),
            repeatTime: this.data.repeatTime.concat(repeat)
          })
          console.log('id|forget|repeatnewwwww', this.data.id, this.data.forgetTimes, this.data.repeatTime)
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
        this.onAdd(this.data.id[i], "unclear", this.data.forgetTimes[i])//这个本来是forget我改成unclear，因为forgettimes已经对忘记和模糊进行区分，这里就没必要再多此一举了
      }
      wx.redirectTo({//满足条件跳转到finish
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
  //  db.collection('words').doc(id).get({
    db.collection('words2').doc(id).get({
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
//用来改变数据库中 wordsum属性
  getReciteWords: function(){
    var that = this
    var total
    const db = wx.cloud.database()
    db.collection('recite').where({
      _openid: app.globalData.userid
    }).count({
      success(res) {
        total = res.total
        that.setData({
          length: total,
        })
      },
      complete:com =>{
        db.collection('user').where({
          _openid: app.globalData.userid
        }).get({
          success: res => {
            db.collection('user').doc(res.data[0]._id).update({
              data: {
                wordsum: that.data.length
              }
            })
          }
        })
      }
    })
  },
})
