    // ==UserScript==
    // @name         bitSex BTC余额计算
    // @namespace    bitSex BTC余额计算
    // @version      0.1
    // @description  try to take over the world!
    // @author       You
// @require      https://cdn.bootcss.com/jquery/1.12.4/jquery.min.js
// @require      https://cdn.bootcss.com/jqueryui/1.12.1/jquery-ui.min.js
    // @match        https://www.bitsex.io/*
    // @grant        GM_xmlhttpRequest
    // ==/UserScript==

    (function() {
        'use strict';
        $('head').append('<link href="https://cdn.bootcss.com/jqueryui/1.12.1/jquery-ui.min.css" rel="stylesheet">');
        var asset = [];
        var rateOld = [];
        var rate = [];
        if (location.hash === '#/myBalance') {
            getAsset();
        }
        window.addEventListener('hashchange', function() {
            if (location.hash === '#/myBalance') {
                getAsset();
            }
        }, false);

        setInterval(function() {
            var loadingEl = document.querySelector('.progress-loading');
            if (loadingEl) {
                var huobiprice = document.querySelector('#huobiprice');
                if (!huobiprice) {
                    loadingEl.insertAdjacentHTML('afterend', '<div id="huobiprice" title="火币价格"></div>');
                    huobiprice = document.querySelector('#huobiprice');
                    $( huobiprice ).dialog({
                        width: 450,
                        position: { using:function(pos){
                            var topOffset = $(this).css(pos).offset().top;
                            if (topOffset = 0||topOffset>0) {
                                $(this).css({
                                    left:20,
                                    top:innerHeight-300,
                                });
                            }
                        }},
                        dragStop:function(e){
                            console.log(e);
                        }
                    });
                }
                getPrice(function(data) {
                    rateOld = rate;
                    getPercent(function(symbols) {
                        rate = data.filter(function(item) { return /^(btc|eth)usdt$/.test(item.symbol) }).map(function(item) {
                            symbols.forEach(function(symbolItem) {
                                if (symbolItem.symbol === item.symbol) {
                                    item = Object.assign({}, item, symbolItem);
                                }
                            });
                            return item;
                        });
                        var html = '';
                        rate.forEach(function(item, i) {
                            html += `<div class="p-2 border-right" style="width:190px;">
                                 <div class="text-white">
                                    <div class="media">
                                        <div class="media-body">
                                            ${item.symbol.toUpperCase()}
                                        </div>
                                        <div>24小时</div>
                                    </div>
                                 </div>
                                 <div class="text-gray">
                                    <div class="media">
                                        <div class="media-body">
                                            开：${item.open}
                                        </div>
                                        <div>USDT</div>
                                    </div>
                                 </div>
                                 <div class="text-gray">高：${item.high}</div>
                                 <div class="text-gray">低：${item.low}</div>
                                 <div class="text-white ${rateOld[i]?(rateOld[i].close<=item.close?'text-success':'text-danger'):''}" style="font-size:16px;">
                                    <div class="media">
                                        <div class="media-body">
                                            收：${item.close} ${rateOld[i]?(rateOld[i].close<=item.close?'↑':'↓'):''}
                                        </div>
                                        <div>
                                            ${rateOld[i]?(item.close-rateOld[i].close).toFixed(2):''}
                                        </div>
                                    </div>
                                 </div>
                                 <div class="${item.rise_percent>=0?'text-success':'text-danger'}" style="font-size:16px;">
                                    <div class="media">
                                        <div class="media-body">
                                            涨跌 ${(item.rise_percent*100).toFixed(2)} ${item.rise_percent>=0?'↑':'↓'}
                                        </div>
                                        <div>
                                            ${rateOld[i]?(item.rise_percent*100-rateOld[i].rise_percent*100).toFixed(2):''}%
                                        </div>
                                    </div>
                                 </div>
                                 <div class="text-gray">
                                    <div class="media">
                                        <div class="media-body">
                                            量：${item.amount.toFixed(2)}
                                        </div>
                                    </div>
                                 </div>
                            </div>`
                        });
                        html = `<div>
                            <div class="px-2 pt-2 text-center h4 text-white"><a href="https://www.huobi.com" target="_blank">火币实时价格</a></div>
                            <div class="media pb-2">${html}</div>
                        </div>`;
                        huobiprice.innerHTML = html;
                    });
                });
            }
        }, 1000);

        function getAsset() {
            getPrice(function(data) {
                rate = data.filter(function(item) { return /^(btc|eth)usdt$/.test(item.symbol) });
                getAmount();
            });
            var timer = setInterval(function() {
                var tb = document.querySelectorAll('table tbody tr');
                if (tb.length) {
                    tb = [].slice.call(tb);
                    asset = tb.map(function(item) {
                        var name = item.querySelector('td:nth-child(1)').innerText.toLowerCase().trim().replace(/^e/, '');
                        var amount = item.querySelector('td:nth-child(3)').innerText.trim() * 1;
                        return { name: name, amount: amount };
                    });
                    getAmount();
                    clearInterval(timer);
                }
            }, 500);
        }

        function getAmount() {
            if (asset.length && rate.length) {
                var dom1 = document.querySelector('.myBalance header>.media-body span:nth-child(1)');
                var dom2 = document.querySelector('.myBalance header>.media-body code:nth-child(2)');
                var dom3 = document.querySelector('.myBalance header>.media-body code:nth-child(3)');
                var rateMap = {};
                rate.forEach(function(item) {
                    rateMap[item.symbol.replace('usdt', '')] = item.close;
                });
                var oldAsset = {
                    btc: 3,
                    eth: 30,
                    usdt:10000,
                };
                var allUsdt = 0;
                asset.forEach(function(item) {
                    if (rateMap[item.name]) {
                        item.usdt = rateMap[item.name] * item.amount;
                        if (oldAsset[item.name]) {
                            oldAsset.usdt += oldAsset[item.name] * rateMap[item.name]
                        }
                    } else {
                        item.usdt = item.amount;
                    }
                    allUsdt += item.usdt;
                });
                dom1.innerText = '';
                dom2.innerText = '';
                dom3.innerText = ` 原 ${oldAsset.usdt.toFixed(2)} 现 ${allUsdt.toFixed(2)} 盈利 ${(allUsdt-oldAsset.usdt).toFixed(2)} USDT`;
            }
        }

        function getPrice(back) {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://www.huobi.com/-/x/pro/market/overview5?r=` + new Date().getTime(),
                onload: function(response) {
                    var data = JSON.parse(response.responseText);
                    if (data.status === 'ok') {
                        back(data.data);
                    }
                },
                onerror: function(reponse) {
                    console.log('error',reponse);
                }
            });
        }

        function getPercent(back) {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://www.huobi.com/-/x/general/index/constituent_symbol/detail?r=` + new Date().getTime(),
                onload: function(response) {
                    var data = JSON.parse(response.responseText);
                    if (data.code === 200) {
                        back(data.data.symbols);
                    }
                },
                onerror: function(reponse) {
                    console.log('error',reponse);
                }
            });
        }
        // Your code here...
    })();
