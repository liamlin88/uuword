//app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: "uuwords-3dq4i",
        traceUser: true,
      })
    }

    this.globalData = {}

  },
  globalData: {
   
    openid:null,
    userid: null,//该用户的id作为全局变量在许多页面中都有用到
    wordcount:0,
    existe:false,
    learnmore:false,
 //   number: 0,
  //  recited: 0, //已背诵的单词量
   // countnum: 0,
  },
})
