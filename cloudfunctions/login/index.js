//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    motto: '开始背诵',
    avatarUrl: "",
    userInfo: {}
  },
  // 事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
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
    wx.navigateTo({
      url: '../main/begin/begin',
      success: function (res) { },
      fail: function (res) { },
      complete: function (res) { },
    })
  },
  checklogin: function (userid) {
    const db = wx.cloud.database()
    const WORDNum = 40
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
              wordcount: WORDNum
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
      }
    })
  },
})
