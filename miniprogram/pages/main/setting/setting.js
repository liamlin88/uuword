// miniprogram/pages/main/setting/setting.js
const app = getApp()
Page({
  data: {

    userInfo: {},
    hasUserInfo: false,
    wordcount: 0, //每日学习总量（复习加新学)
    recited: 0, //已背诵的单词量
    number: 0,
    left_word: 0, //剩余单词量
    average_new_perday: 0, // 平均每天新学单词量
    averge_review_perday: 0, //平均每天复习单词量
    scrolls: [{
      name: '大学英语四级词汇',
    },
    {
      name: '大学英语六级词汇',
    },
    {
      name: '大学英语六级词汇',
    },
    {
      name: '大学英语六级词汇',
    },
    ]
  },

  onLoad: function () {
  //  this.getReciteWords()
    this.setData({
      wordcount: app.globalData.wordcount
    })


    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  getUserInfo: function (e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  //用来改成user数据库中wordcount属性
  bindKeyInput1: function (e) {
    var _id = null
    const db = wx.cloud.database()
    var that = this
    that.setData({
      inputValue: e.detail.value
    })
    console.log(app.globalData.exist)
    console.log(app.globalData.userid)
    db.collection('user').where({
      _openid: app.globalData.userid
    }).get({

      success: res => {
        _id = res.data[0]._id
        if (app.globalData.exist) {
          const db = wx.cloud.database()
          db.collection('user').doc(_id).update({
            data: {
              wordcount: that.data.inputValue
            }
          })
          console.log("Update successfully")
        } else {
          console.log("Update failed")
        }

      }

    })
  },
  bindKeyInput2:function(){
    const db = wx.cloud.database()
    db.collection('user').where({
      _openid:app.globalData._openid
    }).get({
      success:res=>{
        this.setData({
          number:res.data[0].wordsum,
          left_word: 100 - res.data[0].wordsum,//100被总量代替
        })
    //    console.log('o')
      }
    })
  },
  /*
  //用来改变数据库中 wordsum属性
  bindKeyInput2: function () {
    var haverecited = 0
    var _id = null
    const db = wx.cloud.database()
    var that = this
    db.collection("recite").where({
      _openid: app.globalData.openid
    }).get({
      success: res => {
        haverecited = res.data.length
        this.setData({
          recited: haverecited
        })


        const db1 = wx.cloud.database()
        db1.collection("user").where({
          _openid: app.globalData.openid
        }).get({
          success: res => {
            _id = res.data[0]._id
            if (app.globalData.exist) {
              const db = wx.cloud.database()
              db.collection('user').doc(_id).update({
                data: {
                  wordsum: that.data.number

                }

              })

            }
          }
        })
      }
    })
  },
  //获取recite数据库里的单词总数量
  getReciteWords: function (wordid = [], skipCount = 0) {

    this.getTotalNumberWord()
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
           // number: this.data.id.length,
            number: app.bindKeyInput2(),
            // 100 将来会被 total number word 替代
          //  left_word: 100 - this.data.id.length,
            left_word: 100 - this.data.number,
            //recited : app.bindKeyInput2()
          })
          console.log('nummmmm', this.data.number)
        //  recited= app.bindKeyInput2(this.data.number)
        } else {
          skipCount += res.data.length
       //   this.getReciteWords(wordid, skipCount)

          this.setData({
            id: wordid,
          })
        }


      })


  },

  //获取words数据库里的单词总数量
  getTotalNumberWord: function (wordid = [], skipCount = 0) {

    const db = wx.cloud.database()
    db.collection("words").get({
      success: res => {
        console.log("uye", res.data.length)
      }
    })
  }*/
  //   const db = wx.cloud.database()
  //   db.collection("user").where({
  //     _openid: app.globalData.userid
  //   }).get()
  //     .then(res => {
  //       // length = res.data[0].wordcount
  //       if (skipCount == 0) {
  //         //当跳转单词为0，从第一条数据按顺序返回20条数据
  //         return db.collection('words').get()
  //       } else {
  //         //如果不为0，则从第skipCount条往后开始返回20条数据
  //         console.log(skipCount)
  //         return db.collection('words').skip(skipCount).get()
  //       }

  //     }).then(res => {

  //       for (let i = 0; i < res.data.length; i++) {
  //         wordid.push(res.data[i]._id)
  //       }
  //       if (res.data.length == 0) {
  //       } else {
  //         skipCount += res.data.length
  //         this.getReciteWords(wordid, skipCount)
  //         console.log(wordid)
  //         this.setData({
  //           id: wordid,
  //         })
  //       }
  //       console.log("id", this.data.id.length)
  //       this.setData({
  //         number: this.data.id.length
  //       })
  //     })
  // }

})