// miniprogram/pages/main/setting/setting.js
var util = require('../../../utils/util.js');
const app = getApp()
const db = wx.cloud.database()
Page({
  data: {

    userInfo: {},
    hasUserInfo: false,
    wordcount: 0, //每日学习总量（复习加新学)
    number: 0, //已背诵的单词量
    review:0,
    total:0,//单词总量
    left_word: 0, //剩余单词量
    average_new_perday: 0, // 平均每天新学单词量
    averge_review_perday: 0, //平均每天复习单词量
    /*计算用户使用天数，从当前日期-用户第一次使用日期（recite中该用户第一个便是最早的使用日期） */
    begintime: "", //用户开始使用app的第一天
    time: util.formatDate(new Date()),//获得当前时间函数
  },

  onLoad: function () {
    this.setData({
      wordcount:app.globalData.wordcount
    })
    this.checkBeginTime()
    this.bindKeyInput2()
    this.getBooks()
    this.getChosenBook()

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
              wordcount: parseInt(that.data.inputValue) 
            }
          })
          console.log("Update successfully")
        } else {
          console.log("Update failed")
        }

      }

    })
  },
  bindKeyInput2:function(){//设置已背单词量和剩余单词量
   var that = this
    const db = wx.cloud.database()
    var num
    var total
    db.collection('user').where({
      _openid:app.globalData.userid
    }).get({
      success(res){ 
        db.collection('words2').where({
          range: res.data[0].currentBook
        }).count({
          success(res) {
            total = res.total
            that.setData({
              total: total,
            })
          },
          complete: com => {
            db.collection('user').where({
              _openid: app.globalData.userid
            }).get({
              success: res => {
                num = res.data[0].wordsum
                that.setData({
                  number: num,
                  left_word: total - num,
                })
              }
            })
          }
        })   
      },
    })
   // db.collection('words').where({
   /* db.collection('words1').where({
      range: 'Cet6'
    }).count({
      success(res) {
        total = res.total
        that.setData({
          total:total,
        })
      }
    })*/
  },
  //计算用户使用天数
  checkDate: function (endTime) {
    var that = this
    const db = wx.cloud.database()
    db.collection('user').where({
      _openid: app.globalData.userid
    }).get({
      success: res => {

        that.setData({
          begintime: util.formatDate(new Date(res.data[0].begintime))
        })



      }, complete: com => {//防止异步执行，按顺序执行代码
        //日期格式化
        var start_date = new Date(that.data.begintime);
        var end_date = new Date(endTime.replace(/-/g, "/"));
        //转成毫秒数，两个日期相减
        var days = end_date.getTime() - start_date.getTime();
        //转换成天数
        app.globalData.totalday = parseInt(days / (1000 * 60 * 60 * 24));
        //do something
        console.log("The first day of using app = ", that.data.begintime)
        console.log("The current day = ", endTime)
        console.log("day = ", app.globalData.totalday);
        this.getAverage()
      },
    })
   

  },
  checkBeginTime: function () {
    var time
    var that = this
    const db = wx.cloud.database()
    db.collection('recite').where({
      _openid: app.globalData.userid
    }).get({
      success: res => {
        that.setData({
          time: util.formatDate(new Date(res.data[0].time))
        })
        db.collection('user').where({
          _openid: app.globalData.userid
        }).get({
          success: res => {
            db.collection('user').doc(res.data[0]._id).update({
              data: {
                begintime: that.data.time
              }
            })

          }

        })
      }, complete: com => {//防止异步执行，按顺序执行代码
        db.collection('user').where({
          _openid: app.globalData.userid
        }).get({
          success: res => {
          }
        })
        this.checkDate(util.formatDate(new Date()))

      }

    })
  },
  getAverage:function(){//设置平均每天新学和平均每天复习
    const db = wx.cloud.database()
      var that = this
      var newnum
      var reviewnum
      db.collection('user').where({
        _openid: app.globalData.userid
      }).get({
        success(res) {
          newnum = res.data[0].newnum
          reviewnum = res.data[0].reviewnum
          newnum = newnum / (app.globalData.totalday + 1)
          reviewnum = reviewnum / (app.globalData.totalday + 1)
          console.log('new|review', newnum, reviewnum, app.globalData.totalday)
          that.setData({
            average_new_perday: newnum,
            averge_review_perday: reviewnum
          })
        }
      })
  },
  getBooks: function () {
    const db = wx.cloud.database()
    db.collection('books').where({})
      .get()
      .then(books => {
        this.setBooks(books.data.map(book =>
          book.chineseName
        ))
      })
  },
  getChosenBook: function() {
    db.collection('user').where({ _openid: app.globalData.userid })
      .get()
      .then(users => {
        return this.getBookPromise({range:users.data[0].currentBook})
      })
      .then(books => {
        this.setChosenBook(books.data[0].chineseName)
      })
  }
  ,
  setBooks: function (books) {
    let allBooksList = books.map(book => {
      return { name: book }
    })
    this.setData({
      allBooksList: allBooksList
    })
  },
  setChosenBook: function (name) {
    this.setData({
      chosenBooksList: [
        { name: name }
      ]
    })
  },
  getBookPromise: function (where) {
    return db.collection('books').where(where).get()
  },
  chooseBookButton: function (event) {
    this.setChosenBook(event.currentTarget.dataset.name)
    let range = ''
    this.getBookPromise({chineseName:event.currentTarget.dataset.name})
      .then(books => {
        range = books.data[0].range
        return db.collection('user').where({ _openid: app.globalData.userid }).get()
      })
      .then(res => {
        return db.collection('user').doc(res.data[0]._id).update({
          data: {
            currentBook: range
          }
        })
      })
      .then(res => {
        this.bindKeyInput2()
      })
  },
})