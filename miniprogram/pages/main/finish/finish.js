// miniprogram/pages/main/finish/finish.js
var util = require('../../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */

  data: {
     length:0,
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
  turnword: function() {//这里要先把数据库里的wordsum值更新一下，不然直接跳的话他有延时不更新，取到的单词还是之前的那些，代码就和begin.js里的几乎是一样的，你要是有其他好的方法可以不这么写的话可以把这里改一下嘻嘻
    var app = getApp()
    app.globalData.learnmore = true
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
      complete: com => {
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
        wx.switchTab({//跳转到begin
          url: '../begin/begin',
        })
      }
    })
  },
  turnset: function () {
    wx.switchTab({
      url: '../setting/setting',
    })
  },
  //弹窗
  showDialogBtn: function () {
    this.setData({
      showModal: true
    })
  },
  /**
   * 弹出框蒙层截断touchmove事件
   */
  preventTouchMove: function () {
  },
  /**
   * 隐藏模态对话框
   */
  hideModal: function () {
    this.setData({
      showModal: false
    });
  },
  /**
   * 对话框确认按钮点击事件
   */
  onConfirm: function () {
    wx.navigateTo({
      url: '../../../pages/main/Calendar/Calendar',
    })
  }
})