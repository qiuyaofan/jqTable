$(function () {
  var iconClass = ['fa-plus-square-o', 'fa-minus-square-o'];
  //有层级关系
  var $body = $('body');
  //点击层级表格title展开收起（例子：监控页面）
  $body.on('click', '.g-toggleTable--button', function (event) {
    var $this = $(this).parents('.g-toggleTable--title');
    var $parent = $this.parents('.g-toggleTable--main');
    var $title = $parent.find('.g-toggleTable--title');
    var $tr = $parent.find('tr');
    var indexStart = $tr.index($this);
    var indexEnd = $tr.length;
    var $nextTitle = $title.eq($title.index($this) + 1);
    var isTitle2 = $parent.data('level');
    isTitle2 ? indexStart = indexStart + 1 : false;

    if ($nextTitle.length) {
      indexEnd = $tr.index($nextTitle);
    }
    $.each($parent.find('tr'), function (index, el) {
      if (index > indexStart && index < indexEnd) {
        $(el).toggleClass('hide');
      }
    });
    $this.find('i.fa').toggleClass(iconClass.join(' '));
    singleChange( $parent);
    
  });

  function singleChange($parent){
    //判断是否要改变头部
    var $title = $parent.find('.g-toggleTable--title');
    var $selectAll = $parent.find('.g-toggleTable--buttonAll');
    var plusLen = $parent.find('.g-toggleTable--button.' + iconClass[0]).length;
    var minusLen = $parent.find('.g-toggleTable--button.' + iconClass[1]).length;
    var titleLen = $title.length-1;
    if (minusLen === titleLen) {
      $selectAll.removeClass(iconClass.join(' ')).addClass(iconClass[1]);
    }
    if (plusLen === titleLen) {
      $selectAll.removeClass(iconClass.join(' ')).addClass(iconClass[0]);
    }
  }
  $body.on('click', '.g-toggleTable--buttonAll', function () {
    var $this = $(this);
    var willShow = $this.hasClass(iconClass[0]);
    var $child = $this.parents('.g-toggleTable--main').find('.c-table__child');
    var $title = $this.parents('.g-toggleTable--main').find('.g-toggleTable--title .g-toggleTable--button');
    $title.removeClass(iconClass.join(' '));
    $this.removeClass(iconClass.join(' '));
    if (willShow) {
      $child.removeClass('hide');
      $title.addClass(iconClass[1]);
      $this.addClass(iconClass[1]);
    } else {
      $child.addClass('hide');
      $title.addClass(iconClass[0]);
      $this.addClass(iconClass[0]);
    }
  })
})
//表格全选
$(function () {
  var $body = $('body');
  // 全选
  $body.on('change', '.g-selectAll', function (event) {
    $(this).parents('.g-selectAll--main').find('.g-selectAll--input').prop('checked', this.checked);
  });

  // 选一个
  $body.on('change', '.g-selectAll--input', function (event) {
    var $parents=$(this).parents('.g-selectAll--main');
    var length = $parents.find('.g-selectAll--input').not('.g-selectAll').length;
    var lengthChecked = $parents.find('.g-selectAll--input:checked').not('.g-selectAll').length;
    if (lengthChecked === length){
      $parents.find('.g-selectAll').prop('checked',true);
      return;
    }
    $parents.find('.g-selectAll').prop('checked', false);
  });

  //批量操作
  $body.on('click', '.g-selectAll--btn', function (event) {
    event.preventDefault();
    gSelectAllBtnFn($(this));
  });

  function gSelectAllBtnFn($target) {
    var isDestory = $target.data('destory');
    var $main = $target.parents('.g-selectAll--main');
    var $checked = $main.find('.g-selectAll--input:checked').not('.g-selectAll');
    var checkedArr = [];
    var text = $target.data('text') || '请先选择';
    var tag = $target.data('tag') || '';
    var params = {};
    var values = [];
    //isDestory为true不验证为空
    if (!isDestory && !$checked.length) {
      $.message({
        type: 'error',
        message: text,
      });
      return false;
    }
    $.each($checked, function (index, ele) {
      checkedArr.push($(ele).data('value'));
      values.push($(ele).val());
    });
    params = {
      ele: $target,
      checked: $checked,
      checkedArr: checkedArr,
      value: values
    };
    $.pub('GSelectAllSuccess' + tag, [params]);
  };
})

/**
        全局组件：pub/sub
    */
var jqTableObject = $({});

$.sub = function () {
  jqTableObject.on.apply(jqTableObject, arguments);
};

$.unsub = function () {
  jqTableObject.off.apply(jqTableObject, arguments);
};

$.pub = function () {
  jqTableObject.trigger.apply(jqTableObject, arguments);
};