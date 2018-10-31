var runSketchToolsIndex = 0;

function runSketchTools() {
    setTimeout(function() {

        var list = $('.artboard-list>li');
        if (list.length) {
            $('body').append(`<style>
                .artboard-list li{
                    padding:10px;
                    border-top:1px solid rgba(255,255,255,.1);
                    border-bottom:1px solid rgba(0,0,0,.4)
                }
                .preview-img,
                .preview-img img{
                    width:80px;
                    max-width:80px;
                    height:60px;
                    max-height:60px;
                }
                .artboard-list li div{
                    padding-left:5px;
                }
                .artboard-list li:hover{background:rgb(52, 132, 245,.7)}
                .artboard-list li.active{background:rgb(52, 132, 245) !important}
                .artboardIndex{
                    padding-left:0;
                    width: 16px;
                    font-size: 16px;
                    justify-content: center;
                    color: #fff;
                    background: none;
                }
            </style>`)
            list.find('small').remove()
            var active = null;
            var id = localStorage.getItem('artboardId');
            list.each(function(index, item) {
                $(item).append('<header class="artboardIndex">' + (index + 1) + '</header>');
                if ($(item).attr('id') === id) {
                    location.hash = '#' + id.replace(/-/, '');
                    $(item).addClass('active').siblings().removeClass('active');
                    active = $(item);
                }
            });
            if (active === null) {
                active = $('.artboard-list>li.active');
            }
            $('[data-id="artboards"]').addClass('current');
            $('.navbar').addClass('on');
            $('#artboards').scrollTop(active.offset().top - 200);
            $('.artboard-list>li').click(function() {
                localStorage.setItem('artboardId', $(this).attr('id'));
            });

            $(document).keyup(function(e) {
                if (e.keyCode === 38) {
                    $('.artboard-list>li.active').prev().click();
                    $('#artboards').scrollTop($('#artboards').scrollTop() - 82);
                } else if (e.keyCode === 40) {
                    $('.artboard-list>li.active').next().click();
                    $('#artboards').scrollTop($('#artboards').scrollTop() + 82);
                } else if (e.keyCode === 36 || e.keyCode === 33) {
                    $('.artboard-list>li').eq(0).click();
                    $('#artboards').scrollTop(0);
                } else if (e.keyCode === 35 || e.keyCode === 34) {
                    $('.artboard-list>li').eq($('.artboard-list>li').length-1).click();
                    $('#artboards').scrollTop($('.artboard-list').height());
                }
            })
        } else {
            runSketchToolsIndex++;
            if (runSketchToolsIndex < 5) {
                runSketchTools();
            }
        }
    }, 1000);
}

runSketchTools();
