// miniprogram/pages/main/finish/finish.js
var util = require('../../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */

  data: {
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var time = util.formatTime(new Date());
    // 再通过setData更改Page()里面的data，动态更新页面的数据
    this.setData({
      time: time
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  turnword: function() {
    var app = getApp()
    app.globalData.learnmore = true
    
    wx.switchTab({
      url: '../begin/begin',
    })
  },
  turnset: function () {
    wx.switchTab({
      url: '../setting/setting',
    })
  }
})