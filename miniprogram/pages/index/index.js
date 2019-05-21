//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    motto: '开始背诵',
    avatarUrl: "",
    userInfo: {}
  },
  // // 事件处理函数
  // bindViewTap: function () {
  //   wx.navigateTo({
  //     url: '../logs/logs'
  //   })
  // },
  onLoad: function () {

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
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo,
              })
              app.globalData.userInfo = res.userInfo
              console.log(app.globalData.userInfo)
            }
          })
        }
      }
    })
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        console.log(app.globalData.openid)
        this.checklogin(app.globalData.openid)
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)

      }
    })
  },
  getUserInfo: function (e) {

    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  ontapbutton: function () {
    var that = this
    var app = getApp()
    const db = wx.cloud.database()
    db.collection("user").where({
     // _openid : this.data.userInfo.openid
      _openid:app.globalData.userid
    }).get({
      success(res){
        console.log(res.data[0].wordcount)
        app.globalData.wordcount = res.data[0].wordcount
        app.globalData.exist = true
      
      }

    })
    wx.switchTab({
      url: '../main/begin/begin',
      success: function (res) { },
      fail: function (res) { },
      complete: function (res) { },
    })
  },
  checklogin: function (userid) {//检查该用户是否为user库中已经存在的用户，新用户则添加用户信息
    const db = wx.cloud.database()
    const WORDNum = 40//默认用户每日单词量
    var app = getApp()
    app.globalData.userid = userid
    console.log('globaluserid:', app.globalData.userid)
    db.collection('user').get({
      success(res) {
        var exit = false
        for (var i = 0; i < res.data.length; i++) {
          if (userid == res.data[i]._openid) {
            exit = true
          }
        }
        if (exit == false) {
          db.collection('user').add({
            data: {
              userInfo: app.globalData.userInfo,
              wordcount: WORDNum,
              wordsum:0,
              reviewnum:0,
              newnum:0,
              begintime:null,
              currentBook:null,
            },
            success: res => {
              console.log('[user数据库] [新增记录] 成功，记录 _id: ', res._id)
              console.log('记录 wordcount: ', res.wordcount)
            },
            fail: err => {
              wx.showToast({
                icon: 'none',
                title: '新增记录失败'
              })
              console.error('[user数据库] [新增记录] 失败：', err)
            }
          })
        }
        else{//用户更改微信资料的时候同步更新
          db.collection('user').where({
            _openid:app.globalData.userid
          }).get({
            success(res){
              db.collection('user').doc(res._id).update({
                data:{
                  userInfo:app.globalData.userInfo,
                }
              })
            }
          })
        }
      }
    })
  },
})
