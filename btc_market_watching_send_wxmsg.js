// ==UserScript==
// @name         开启交易所做市异常监控
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  连续半小时出现价格横线就认为异常
// @author       You
// @match        https://**/**
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
    // 发送消息需要的信息
    // 消息接收者
    var currentName = '文件传输助手';
    // 接收者位置
    var scrollTop = -1;

    // 交易对列表
    var pairList = [];
    var index = 0;
    var timeLong = 10; //分钟
    var timeLongSecond = timeLong * 60;
    var timeLongSecondTimer = null;
    var lastMsgTime = null;
    var errorList = [];
    console.log('开启交易所做市异常监控');
    unsafeWindow.tenMinuteTimer = null;
    var started = false;

    // 每一轮请求用时
    var circleTime = 0;

    getPariList(function(list) {
        pairList = list;
        // started = true;
        // getEveryPair(index);
        // unsafeWindow.tenMinuteTimer = setInterval(function() {
        //     getEveryPair(index);
        // }, timeLong * 60 * 1000);
    });

    setInterval(function() {
        watchChat();
    }, 1000);

    function getEveryPair(idx) {
        var t1 = new Date();
        timeLongSecond = timeLong * 60;
        clearInterval(timeLongSecondTimer);
        var assetPair = pairList[idx].assetPair;
        getKline(pairList[idx], function(list) {
            if (typeof list != 'string') {
                var sameTime = 0;
                list.forEach(function(v) {
                    var item = v.split(',');
                    if (item[1] == item[2] && item[2] == item[3] && item[3] === item[4] || item[item.length - 1] == 0) {
                        sameTime++;
                    }
                });
                var t2 = new Date();
                if (sameTime > 1) {
                    console.log(`交易对 ${assetPair} 用时：${t2-t1}ms , 做市异常`);
                    errorList.push(`${assetPair} ${new Date().format('MM.dd HH:mm')} 做市异常×`);
                } else {
                    console.log(`交易对 ${assetPair} 用时：${t2-t1}ms`);
                }
                if (index < pairList.length - 1) {
                    index++;
                    getEveryPair(index);
                } else {
                    index = 0;
                    console.log(`一轮结束，等待${timeLong}分钟再次发起`);
                    timeLongSecond -= parseInt(circleTime / 1000);
                    circleTime = 0;
                    timeLongSecondTimer = setInterval(function() {
                        timeLongSecond--;
                        console.log(timeLongSecond);
                    }, 1000);
                    if (errorList.length > 0) {
                        sendWXmsg(`${new Date().format()} \n${errorList.join(' \n')} \n下次更新：10分钟后`);
                        errorList = [];
                    }else{
                        sendWXmsg(`${new Date().format()} \n做市正常 \n下次更新：10分钟后`);
                    }
                }
            } else {
                if (index < pairList.length - 1) {
                    index++;
                    getEveryPair(index);
                } else {
                    index = 0;
                    console.log(`一轮结束，等待${timeLong}分钟再次发起`);
                    timeLongSecond -= parseInt(circleTime / 1000);
                    circleTime = 0;
                    timeLongSecondTimer = setInterval(function() {
                        timeLongSecond--;
                        console.log(timeLongSecond);
                    }, 1000);
                    if (errorList.length > 0) {
                        sendWXmsg(`${new Date().format()} \n${errorList.join(' \n')} \n下次更新：10分钟后`);
                        errorList = [];
                    }else{
                        sendWXmsg(`${new Date().format()} \n做市正常 \n下次更新：10分钟后`);
                    }
                }
            }
            circleTime += t2 - t1;
        });

    }

    function getPariList(back) {
        GM_xmlhttpRequest({
            method: 'POST',
            url: `https://bitcome.com/asset/getTradeAboutInfo`,
            onload: function(response) {
                var data = JSON.parse(response.responseText);
                if (data.code === 0) {
                    var list = data.data.assetPairResponseList;
                    back(list);
                }
            },
            onerror: function(reponse) {
                console.log('error', reponse);
            }
        });
    }

    function getKline(assetPair, back) {
        GM_xmlhttpRequest({
            method: 'POST',
            url: `https://bitcome.com/kline/klineSecond?currencyPair=${assetPair}&type=minute15&from=${ new Date().getTime()-1800000}&to=${ new Date().getTime()}`,
            onload: function(response) {
                var data = JSON.parse(response.responseText);
                /*1528448400000 时间 0
                    1.5 开盘 1
                    1.5 收盘 2
                    1.5 最高价 3
                    1.5 最低价 4
                    0.0 最新价格 5 结算货币的量
                    0.0 交易量 6 商品货币的量*/
                if (data.code === 0) {
                    var list = data.data.split('|');
                    back(list);
                } else {
                    back(data.code + ': ' + data.msg);
                }
            },
            onerror: function(reponse) {
                console.log('error', reponse);
            }
        });
    }

    function watchChat() {
        getUserPosition(function(el) {
            var txt = $(el).find('.info .msg [ng-bind-html="chatContact.MMDigest"]').text().trim();
            if (txt && txt.match(/(^[^:]+:)?(\S{2})/)) {
                txt = txt.match(/(^[^:]+:)?(\S{2})/)[2];
                if (txt === '停止') {
                    if (started == true) {
                        clearInterval(unsafeWindow.tenMinuteTimer);
                        clearInterval(timeLongSecondTimer);
                        index = 0;
                        timeLongSecond = timeLong * 60;
                        console.log('已停止，发送命令：开始 将会继续执行');
                        sendWXmsg(`${new Date().format()} \n已停止监控 \n发送"开始"可以开始监控`);
                        started = false;
                    }
                } else if (txt === '开始') {
                    if (!started) {
                        started = true;
                        index = 0;
                        getEveryPair(index);
                        unsafeWindow.tenMinuteTimer = setInterval(function() {
                            getEveryPair(index);
                        }, timeLong * 60 * 1000);
                        sendWXmsg(`${new Date().format()} \n已开始监控 \n发送"停止"可以停止监控`);
                    }
                }
            }
        });
    }

    function getUserPosition(back) {
        var currentEl = null;

        function getUser() {
            var list = $('#J_NavChatScrollBody [mm-repeat] [ng-repeat]');
            list.each(function(index, item) {
                var name = $(this).find('.nickname_text').text().trim();
                if (name === currentName) {
                    currentEl = item;
                }
            });
            if (currentEl) {
                back(currentEl);
            } else {
                scrollTop = $('#J_NavChatScrollBody').scrollTop();
                $('#J_NavChatScrollBody').scrollTop(scrollTop + $('#J_NavChatScrollBody').height());
                if ($('#J_NavChatScrollBody').scrollTop() != scrollTop) {
                    setTimeout(function() {
                        getUser();
                    }, 300);
                } else {
                    console.log('没找到名字');
                }
            }
        }
        getUser();
    }

    function sendWXmsg(msg) {
        getUserPosition(function(el) {
            $(el).find('.chat_item').click();
            setTimeout(function() {
                $('#editArea').text(msg);
                setTimeout(function() {
                    $('a.web_wechat_face').click();
                    setTimeout(function() {
                        // $('#mmpop_emoji_panel .exp_hd .exp_hd_item').eq(1).click();
                        // setTimeout(function() {
                        //     $('.emoji_face .face.emoji173').click();
                        $('.qq_face .face.qqface60').click();
                        setTimeout(function() {
                            $('[ng-click="sendTextMessage()"]').click();
                            setTimeout(function() {
                                $('#editArea').text();
                            }, 50);
                        }, 50);
                        // }, 100);
                    }, 100);
                }, 50);
            }, 50);
        });
    }
    Date.prototype.format = function(formatString) {
        var that = this;
        var o = {
            Y: this.getFullYear(),
            M: this.getMonth() + 1,
            D: this.getDate(),
            H: this.getHours(),
            m: this.getMinutes(),
            S: this.getSeconds()
        };
        for (var i in o) {
            if (o.hasOwnProperty(i)) {
                var value = o[i];
                if (value < 10) {
                    o[i] = '0' + value;
                }
            }
        }
        var format = formatString || 'yyyy/MM/dd HH:mm:ss';
        var reg = new RegExp('[Yy]+|M+|[Dd]+|[Hh]+|m+|[Ss]+', 'g');
        var regM = new RegExp('m');
        var regY = new RegExp('y', 'i');
        return format.replace(reg, function(v) {
            var old = v;
            if (regM.test(v)) {
                old = o.m;
            } else if (regY.test(v)) {
                var y = '' + o.Y;
                var le = y.length - (v.length == 1 ? 2 : v.length);
                old = y.substring(y.length, le)
            } else {
                var key = v.toUpperCase().substr(0, 1);
                old = o[key];
            }
            return old;
        });
    };
    // sendWXmsg('123')
})();
