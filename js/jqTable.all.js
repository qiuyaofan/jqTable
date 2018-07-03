

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

$(function () {
  var iconClass = ['icon-right', 'icon-down'];
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
    $this.find('.g-toggleTable--button').toggleClass(iconClass.join(' '));
    singleChange($parent);

  });

  function singleChange($parent) {
    //判断是否要改变头部
    var $title = $parent.find('.g-toggleTable--title');
    var $selectAll = $parent.find('.g-toggleTable--buttonAll');
    var plusLen = $parent.find('.g-toggleTable--button.' + iconClass[0]).length;
    var minusLen = $parent.find('.g-toggleTable--button.' + iconClass[1]).length;
    var titleLen = $title.length - 1;
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
    var $parents = $(this).parents('.g-selectAll--main');
    var length = $parents.find('.g-selectAll--input').not('.g-selectAll').length;
    var lengthChecked = $parents.find('.g-selectAll--input:checked').not('.g-selectAll').length;
    if (lengthChecked === length) {
      $parents.find('.g-selectAll').prop('checked', true);
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

//表格主业务：左右固定，排序，计算总数，多表头等
$(function () {
  var defaultOptions = {
    fixedLeft: false,
    fixedRight: false,
    fixedMinWidth: 100,
    fixedMaxWidth: 500,
    totalString: '--',
    totalTitle: '总计',
    handleSortData: {},
    noWidthColAdaptClient: false
  };
  var JQTABLESCROLLWIDTH = getScrollBarWidth();
  //排序模版
  var SORTTPL = '<div class="c-table__sort {{class}}">' +
    '<i class="c-table__down" aria-hidden="true"></i>' +
    '<i class="c-table__up" aria-hidden="true"></i>' +
    '</div >';
  // 拼接模版
  var FIXEDWRAPPERTPL = '<div class="c-table__fixed-header-wrapper">' +
    '{{theadHtml}}' +
    '</div>' +
    '<div class="c-table__fixed-body-wrapper"> ' +
    '{{tbodyHtml}}' +
    '</div>';
  var FIXEDWRAPPERTPLLEFT = '<div class="c-table__fixed"> ' +
    '{{fixedWrapper}}' +
    '</div>';

  var FIXEDWRAPPERTPLRIGHT = '<div class="c-table__fixed-right"> ' +
    '{{fixedWrapper}}' +
    '</div>';
  var TEMPLATETPL = '<div class="c-table--main" style="width: 100%;">' +
    // '{{hideColumn}}' +
    '<div class="c-table__header-wrapper"> ' +
    '{{theadHtml}}' +
    '</div>' +
    '<div class="c-table__body-wrapper"> ' +
    '{{tbodyHtml}}' +
    '</div> ' +
    '{{fixedLeft}}' +
    '{{fixedRight}}' +
    '</div>';
  // var GUTTERTPL = '<td class="gutter"></td>';
  // var GUTTERWIDTHTPL = '<td class="gutter" style="width:' + JQTABLESCROLLWIDTH + 'px;"></td>';
  var FIXEDRIGHTPATCHTPL = '<div class="c-table__fixed-right-patch" style="width: ' + JQTABLESCROLLWIDTH + 'px; height: {{headerHeight}}px;"></div>';

  // 点击排序
  $('body').on('click.jqTable', '.c-table__down', function () {
    sortFn($(this), true);
  });
  $('body').on('click.jqTable', '.c-table__up', function () {
    sortFn($(this), false);
  });

  function jqTable(options, ele) {
    this.$container = ele;
    this.config = $.extend({}, defaultOptions, options);
    this.init(this.$container);
  }


  $.extend(jqTable.prototype, {
    //$this:要复制的表格html
    init: function ($this) {
      this.isSafria = /version\/([\d.]+).*safari/i.test(navigator.userAgent);
      // 渲染表格
      this.render($this);
      // 添加事件
      this.event($this);
      var _this = this;
      var $sort = this.$table.find('.c-table__sort');
      if ($sort) {
        $.each($sort, function (index, el) {
          if ($(el).hasClass('activeUp')) {
            $(el).find('.c-table__up').trigger('click.jqTable');
            _this.updateEvent();
            return false;
          }
          if ($(el).hasClass('activeDown')) {
            $(el).find('.c-table__down').trigger('click.jqTable');
            _this.updateEvent();
            return false;
          }
        });
      }
      $(window).trigger('resize');
    },
    render: function ($this) {
      var _this = this;
      var $template = render(_this, $this).data('table', _this);
      if (!_this.$table) {
        // 初始化
        _this.tableHeight = $this.data('height');
        // 处理class
        var $table = $this.parents('.c-table').last();
        $template.addClass($table.attr('class'));
        $table.removeAttr('class');
        $this.after($template).remove();
        _this.$table = $template;
        _this.$table.data('height', _this.tableHeight);
      } else {
        // 更新表格数据
        _this.$table.html($template.html());
        $template = _this.$table;
      }
      // 获取头部信息
      // 兼容等于宽度百分百时col不设置width为0
      $template.find('table').addClass('c-table--noWp100');
      _this.colJson = getColInfo(_this);
      $template.find('table').removeClass('c-table--noWp100');
      _this.totalJson = getColTotal(_this);
      _this.fixedWidth = _this.colJson.isAllWidth;
      _this.headerHeight = getHeaderHeight(_this.$table);
      if (!_this.totalJson.noTotal) {
        _this.totalArr = getTotalTdContent(_this);
      }
      // 宽度全部固定时，设置宽度，不放到setsize里，resize不需要重新设宽度
      if (_this.fixedWidth) {
        var sumWidth = _this.colJson.width.reduce(add, 0);
        _this.$table.width(sumWidth + 1);
      }
      //设置宽度等
      // ie
      if (!document.addEventListener) {
        setSizeFn(_this);
      } else {
        setSize(_this);
      }
    },
    event: function ($target) {
      var _this = this;
      // 窗口大小改变
      $(window).resize(function () {
        setSize(_this.$table.data('table'));
      });
      this.updateEvent();
    },
    updateEvent: function () {
      var _this = this;
      // 滚动表格
      if (document.addEventListener) {
        _this.$table.find('.c-table__body-wrapper').scroll(function () {
          var $this = $(this);
          var $parents = $this.parents('.c-table--main');
          var scrollL = $this.scrollLeft();
          var scrollT = $this.scrollTop();
          var $headerTable = $parents.find('.c-table__header-wrapper table');
          var $footerTable = $parents.find('.c-table__footer-wrapper table');
          var $fixedBodyTable = $parents.find('.c-table__fixed-body-wrapper table');
          $headerTable.css({
            'margin-left': -scrollL + 'px'
          });
          $footerTable.css({
            'margin-left': -scrollL + 'px'
          });
          $fixedBodyTable.css({
            'margin-top': -scrollT + 'px'
          });
        });

        // 滚动固定列参数
        var scrollConfig={
          isInit : false,
          scrollTop : 0,
          timer:'',
          prevTop : 0,
          maxScroll:0,
          bodyStyle:'',
          isFirst : false,
          isBodyScroll: function() {
            return ($('html')[0].scrollHeight - $('html')[0].clientHeight) > 0;
          }
        };
        
        // 滚动固定列
        _this.$table.find('.c-table__fixed-body-wrapper').on('mousewheel', function (event) {
          clearTimeout(scrollConfig.timer);
          var $main = $(this).parents('.c-table--main');
          var $bodyWrapper = $main.find('.c-table__body-wrapper');
          var _this = $main.data('table');
          // 有纵向滚动
          if (!_this.scrollResult.colScroll) {
            return;
          }
          // 判断滚动结束
          scrollConfig.timer = setTimeout(function () {
            clearWheel();
            if (scrollConfig.isBodyScroll()){
              $('body').attr('style', scrollConfig.bodyStyle);
              scrollConfig.isFirst = false;
            }
          }, 500);
          
          // 兼容body滚动
          if (!scrollConfig.isFirst && scrollConfig.isBodyScroll()){
            scrollConfig.isFirst=true;
            // 阻止body滚动
            scrollConfig.bodyStyle = $('body').attr('style');
            $('body').css({
              'overflow': 'hidden',
              'padding-right': JQTABLESCROLLWIDTH + 'px'
            });
          }

          // 判断初始化滚动参数
          if (!scrollConfig.isInit) {
            scrollConfig.isInit = true;
            scrollConfig.scrollTop = $bodyWrapper.scrollTop();
            scrollConfig.maxScroll = $bodyWrapper.find('table').height() - $bodyWrapper.height();
            if (_this.scrollResult.rowScroll) {
              scrollConfig.maxScroll += JQTABLESCROLLWIDTH;
            }
            return;
          }
          // 判断是否重新开始滚动
          if (scrollConfig.prevTop > Math.abs(event.deltaY)) {
            clearWheel();
            return;
          }
          // 保存top,给下一次滚动使用
          scrollConfig.prevTop = Math.abs(event.deltaY);

          // 符合条件，设置滚动
          var top = - scrollConfig.scrollTop + event.deltaY;
          if (top > 0) {
            top = 0;
          }
          if (top < (-scrollConfig.maxScroll)) {
            top = -scrollConfig.maxScroll;
          }
          $main.find('.c-table__fixed-body-wrapper table').css({ 'margin-top': top + 'px' });
          $bodyWrapper.scrollTop(-top);
        });

        // 重置滚动参数
        function clearWheel() {
          scrollConfig.isInit = false;
          scrollConfig.scrollTop = 0;
          scrollConfig.prevTop = 0;
        }
      }

      if (_this.config.fixedLeft || _this.config.fixedRight) {
        _this.$table.find('tbody tr').hover(function () {
          var $this = $(this);
          var $main = $this.parents('.c-table--main');
          var index = $this.parents('tbody').find('tr').index($this);
          var $tbody = $main.find('tbody');
          // $tbody.find('tr').removeClass('hover-row')
          $.each($tbody, function (_index, el) {
            $(el).find('tr').eq(index).addClass('hover-row');
          });
        }, function () {
          var $tbody = $(this).parents('.c-table--main').find('tbody');
          $tbody.find('tr').removeClass('hover-row');
        });
      }
    },
    /*更新表格html*/
    updateHtml: function (html) {
      this.init($(html));
    },
    // 更新高度
    updateHeight: function (height) {
      this.tableHeight = height || this.$table.data('height');
      this.$table.data('height', this.tableHeight);
      var tableBodyHeight = this.tableHeight - this.headerHeight;
      var fixedHeight = this.tableHeight;
      if (this.scrollResult.rowScroll) {
        tableBodyHeight -= JQTABLESCROLLWIDTH;
        fixedHeight -= JQTABLESCROLLWIDTH;
      }
      // 有固定时,设置高度
      if (this.config.fixedRight || this.config.fixedLeft) {
        this.$table.find('.c-table__fixed-body-wrapper').css({
          'max-height': tableBodyHeight + 'px',
          'top': this.headerHeight + 'px'
        });
      }
      if (this.config.fixedLeft) {
        this.$table.find('.c-table__fixed').height(fixedHeight + 'px');
      }
      if (this.config.fixedRight) {
        this.$table.find('.c-table__fixed-right').height(fixedHeight + 'px');
      }
      setSize(this);
      // setTableHeight(this);
    }
  });
  /*========BEGIN 排序===========*/
  // 排序
  function sortFn($this, isDown) {
    var className = isDown ? 'activeDown' : 'activeUp';
    //切换class
    var $template = $this.parents('.c-table--main');
    var _this = $template.data('table');
    var $fixedTbody = $template.find('.c-table__fixed-body-wrapper tbody');
    var $tbody = $template.find('.c-table__body-wrapper table tbody');
    var $tr = $tbody.find('tr');
    var $th = $this.parents('thead').find('th');
    var sortJson = [];
    var index = $th.index($this.parents('th'));
    //切换class
    $template.find('.c-table__sort').removeClass('activeUp activeDown');
    $template.find('.c-table__fixed-header-wrapper th').eq(index).find('.c-table__sort').addClass(className);
    $template.find('.c-table__header-wrapper th').eq(index).find('.c-table__sort').addClass(className);
    // 长度小于1不排序
    if ($tr.length <= 1) {
      return;
    }

    //渲染排序所需的json
    $.each($tr, function (_index, el) {
      var _temp = {};
      _temp.index = _index;
      _temp.value = $(el).find('td').eq(index).text().trim();
      sortJson.push(_temp);
    });
    var handleSortDataJson = _this.config.handleSortData;
    var sortConfig = _this.sortConfig;
    // 判断是否存在排序特殊配置
    if (sortConfig[index]) {
      if (sortConfig[index] && handleSortDataJson[sortConfig[index]] && typeof (handleSortDataJson[sortConfig[index]]) === 'function') {
        // 判断排序参数为函数，且在config中注册过
        sortJson = handleSortDataJson[sortConfig[index]](sortJson);
      } else {
        // 参数为字符串替换
        sortJson = deleteMatchStr(sortJson, sortConfig[index]);
      }
    }

    //排序
    sortJson = order(sortJson, 'value', isDown);
    // 渲染排序好的html
    sortRender(_this, $tbody, sortJson);
    $.each($fixedTbody, function (index, fixedTbody) {
      sortRender(_this, $(fixedTbody), sortJson);
    });
  }

  // 字符串替换
  function deleteMatchStr(data, str) {
    var result = [];
    var _data;
    var reg = new RegExp(str, 'g');
    for (var i = 0; i < data.length; i++) {
      _data = data[i];
      _data.value = (_data.value + '').replace(reg, '');
      result.push(_data);
    }
    return result;
  }
  // 渲染排序好的html
  function sortRender(_this, $tbody, sortJson) {
    var $tr = $tbody.find('tr');
    var $_tbody = $tbody.clone();
    $_tbody.html('');
    for (var i = 0, len = sortJson.length; i < len; i++) {
      var __index = sortJson[i].index;
      $_tbody.append($tr.eq(__index).clone());
    }
    $tbody.replaceWith($_tbody);
    _this.updateEvent();
  }
  //desc降序
  function order(arr, key, desc) {
    var orderfn;
    if (arr.length < 2) {
      return;
    }
    if (isNaN(arr[0][key])) {
      //字符串类型
      orderfn = orderString;
    } else {
      //数字类型
      orderfn = orderNumber;
    }
    arr.sort(function (a, b) {
      var _a = a[key], _b = b[key];
      if (desc) {
        _a = b[key];
        _b = a[key];
      }
      return orderfn(_a, _b);
    });
    return arr;
  }
  //数字排序
  function orderNumber(a, b) {
    return a - b;
  }
  //字符串排序
  function orderString(a, b) {
    var titleA = a.toLowerCase(), titleB = b.toLowerCase();
    if (titleA < titleB) return -1;
    if (titleA > titleB) return 1;
    return 0;
  }
  //添加排序
  function addSort(_this, $thead) {
    var result = getColSort(_this, $thead);
    if (result.noSort) {
      return;
    }
    _this.sortConfig = result.sortConfig;
    var sortArr = result.sort;
    var $th = $thead.find('thead th');
    for (var i = 0, len = sortArr.length; i < len; i++) {
      var _sort = sortArr[i];
      if (_sort) {
        var className = _sort === 'up' ? 'activeUp' : _sort === 'down' ? 'activeDown' : '';
        var tpl = $(SORTTPL.replace('{{class}}', className));
        $th.eq(i).find('.cell').append(tpl);
      }
    }
  }
  /*========END 排序===========*/

  /*========BEGIN 渲染表格===========*/
  //获取高度
  function getHeaderHeight($template) {
    return $template.find('.c-table__header-wrapper').height();
  }
  //拼接表格
  function render(_this, $this) {
    var $thead = $this.clone().addClass('c-table__header');
    var $tbody = $this.clone().addClass('c-table__body');
    $thead.find('tbody').remove();
    $tbody.find('thead').remove();
    addSort(_this, $thead);
    var theadHtml = $thead[0].outerHTML;
    var tbodyHtml = $tbody[0].outerHTML;
    // 拼接模版
    var fixedWrapper = FIXEDWRAPPERTPL.replace('{{theadHtml}}', theadHtml).replace('{{tbodyHtml}}', tbodyHtml);
    var fixedLeft = _this.config.fixedLeft ? FIXEDWRAPPERTPLLEFT.replace(/{{fixedWrapper}}/g, fixedWrapper) : '';
    var fixedRight = _this.config.fixedRight ? FIXEDWRAPPERTPLRIGHT.replace(/{{fixedWrapper}}/g, fixedWrapper) : '';
    var template = TEMPLATETPL.replace('{{theadHtml}}', theadHtml).replace('{{tbodyHtml}}', tbodyHtml).replace('{{fixedLeft}}', fixedLeft).replace('{{fixedRight}}', fixedRight);
    var $template = $(template);
    return $template;
  }
  function setSizeFn(_this) {
    var $template = _this.$table;
    // var $headerwrapper = $template.find('.c-table__header-wrapper');
    var $bodywrapper = $template.find('.c-table__body-wrapper');
    // var $thead = $headerwrapper.find('table');
    var $tbody = $bodywrapper.find('table');
    // var $colgroup = $template.find('colgroup');
    var scrollResult;
    // 获取colgroup宽度属性信息
    var colJson = _this.colJson;
    //设置table高度
    setTableHeight(_this);
    scrollResult = judgeIsScroll($bodywrapper, $tbody, $template, colJson);
    //不是全部固定宽度
    if (!_this.fixedWidth) {
      //重置Colgroup宽度属性
      resetColgroupWidth(_this, $template, colJson, scrollResult);
    }
    // 修改宽度值
    // 获取表格宽度--如果想改变宽度 就在外围加div限制，c-table默认width:100%
    // var tableWidth = $template.width();
    // $thead.width(tableWidth);
    // $tbody.width(tableWidth);
    // 设置gutter
    setGutter($template, scrollResult);
    // 有滚动条&&全部列固定宽度设置宽度
    if (_this.fixedWidth) {
      setTableWidthScroll(_this, $template, scrollResult);
    }
    // 是否有滚动条
    scrollResult = judgeIsScroll($bodywrapper, $tbody, $template, colJson);
    _this.scrollResult = scrollResult;
    // 有固定列时，设置固定列宽高
    if (_this.config.fixedRight || _this.config.fixedLeft) {
      setFixedSize(_this, $template, scrollResult);
      removeFixedCheckbox(_this, $template, scrollResult);
    } else {
      $template.addClass('el-table--enable-row-transition');
    }
    //兼容样式：纵向滚动条&固定右边&没有patch
    if (scrollResult.colScroll && !$template.find('.c-table__fixed-right-patch').length) {
      $bodywrapper.after(FIXEDRIGHTPATCHTPL.replace('{{headerHeight}}', _this.headerHeight));
    } else if (!scrollResult.colScroll) {
      $template.find('.c-table__fixed-right-patch').remove();
    }

    //添加总计
    if (!_this.totalJson.noTotal) {
      setTotalHtml(_this, $template);
    }
  }
  // 设置宽度
  function setSize(_this) {
    if (!document.addEventListener) {
      return;
    }
    setSizeFn(_this);

  }
  //设置总计html
  function setTotalHtml(_this, $template) {
    var $bodywrapper = $template.find('.c-table__body-wrapper');
    var $footerWrapper = $bodywrapper.clone().removeClass('c-table__body-wrapper').addClass('c-table__footer-wrapper');
    $footerWrapper.find('.c-table__body').removeClass('.c-table__body').addClass('c-table__footer');
    var $footerWrapperTr = $footerWrapper.find('tbody tr:not(:first)').remove();
    var $footerWrapperOld = $template.find('.c-table__footer-wrapper');
    if ($footerWrapperOld.length) {
      $footerWrapperOld.replaceWith($footerWrapper);
    } else {
      $bodywrapper.after($footerWrapper);
    }
    var $td = $footerWrapper.find('tbody tr').eq(0).find('td');
    $.each($td, function (index, el) {
      $td.find('.cell').eq(index).html(_this.totalArr[index]);
    });
  }
  //获取合计的td的数组
  function getTotalTdContent(_this) {
    var totalJson = _this.totalJson;
    var $tr = _this.$table.find('.c-table__body-wrapper').find('tbody tr:not(:first)');
    var footerArr = [_this.config.totalTitle];
    var footerDataArr = [];
    var totalString = _this.config.totalString;
    $.each($tr, function (index, el) {
      var $_td = $(el).find('td');
      $.each($_td, function (_index, _el) {
        if (index === 0) {
          footerDataArr.push([]);
        }
        footerDataArr[_index].push($(_el).text().trim());
      });
    });
    var temp;
    for (var i = 1; i < totalJson.total.length; i++) {
      var _total = totalJson.total[i];
      if (_total) {
        temp = footerDataArr[i].reduce(addNum, 0);
      } else {
        temp = totalString;
      }
      footerArr.push(temp);
    }
    return footerArr;
  }
  //移除选中的复选框，兼容列固定
  function removeFixedCheckbox(_this, $template, scrollResult) {
    var $checkbox = $template.find('.g-selectAll--input');
    if (!$checkbox.length) {
      return;
    }
    var $tableFixed = $template.find('.c-table__fixed');
    var $tableFixedRight = $template.find('.c-table__fixed-right');
    var $tr = $template.find('.c-table__body-wrapper tr');
    var $fixedTr, len = _this.colJson.width.length - 1;
    var leftCheckboxLen = fixedCheckboxLen($tr, 0);
    var rightCheckboxLen = fixedCheckboxLen($tr, len);
    //存在左固定列，移除表格首列和右固定列首列checkbox
    if (_this.config.fixedLeft && leftCheckboxLen) {
      matchRemoveCheckbox($tableFixedRight, $tr, 0);
    }
    //存在右固定列
    if (_this.config.fixedRight && rightCheckboxLen) {
      matchRemoveCheckbox($tableFixed, $tr, len);
    }

  }
  //循环匹配
  function matchRemoveCheckbox($fixed, $tr, index) {
    var $fixedTr = $fixed.find('.c-table__fixed-body-wrapper tr');
    if ($fixed.length) {
      $.each($fixedTr, function (_index, _tr) {
        removeCheckbox(_tr, index);
      });
    }
    $.each($tr, function (_index, _tr) {
      removeCheckbox(_tr, index);
    });
  }
  //移除input
  function removeCheckbox(target, index) {
    $(target).find('td').eq(index).find('.g-selectAll--input').remove();
  }
  // 固定列里的checkbox个数
  function fixedCheckboxLen($tr, index) {
    return $tr.eq(0).find('td').eq(index).find('.g-selectAll--input').length;
  }

  //设置fixed
  function setFixedSize(_this, $template, scrollResult) {
    //总列数
    var colLen = _this.colJson.width.length;
    var $theadTh = $template.find('.c-table__header-wrapper table th');
    var $tbodyTr = $template.find('.c-table__body-wrapper table tr').eq(0);
    var $tbodyTd = $tbodyTr.find('td:not(.gutter)');
    var tableHeaderHeight = _this.headerHeight;
    var tableHeight = $template.height();
    var tableWidth = $template.width();
    var tableBodyHeight = tableHeight - tableHeaderHeight;
    var $tableFixed = $template.find('.c-table__fixed');
    var $tableFixedRight = $template.find('.c-table__fixed-right');
    var _config = _this.config;
    var _fixedLeft = _config.fixedLeft;
    var _fixedRight = _config.fixedRight;
    var shadowName = 'c-table__fixed--shadow';
    if (scrollResult.rowScroll) {
      tableBodyHeight -= JQTABLESCROLLWIDTH;
    }
    // 有固定时,设置高度
    if (_this.config.fixedRight || _fixedLeft) {
      $template.find('.c-table__fixed-body-wrapper').css({
        'max-height': tableBodyHeight + 'px',
        'top': _this.headerHeight + 'px'
      });
      if (scrollResult.rowScroll) {
        $tableFixed.addClass(shadowName);
        $tableFixedRight.addClass(shadowName);
      } else {
        $tableFixed.removeClass(shadowName);
        $tableFixedRight.removeClass(shadowName);
      }
    }
    // 左侧固定列隐藏
    if (_fixedLeft && _fixedLeft <= 1) {
      // 单列
      $tableFixed.find('.c-table__fixed-body-wrapper tr td:not(:first-child):not(.gutter)').addClass('is-hidden');
    } else if (_fixedLeft > 1) {
      // 多列
      $.each($tableFixed.find('.c-table__fixed-body-wrapper tr'), function (index, _tr) {
        $.each($(_tr).find('td:not(.gutter)'), function (index, _td) {
          if (index >= _fixedLeft) {
            $(_td).addClass('is-hidden');
          }
        })
      })
    }

    // 右侧固定列隐藏
    if (_fixedRight && _fixedRight <= 1) {
      // 单列
      $tableFixedRight.find('.c-table__fixed-body-wrapper tr td:not(:nth-child(' + colLen + ')):not(.gutter)').addClass('is-hidden');
    } else if (_fixedRight > 1) {
      // 多列
      $.each($tableFixedRight.find('.c-table__fixed-body-wrapper tr'), function (index, _tr) {
        $.each($(_tr).find('td:not(.gutter)'), function (index, _td) {
          if (index <= colLen - _fixedRight - 1) {
            $(_td).addClass('is-hidden');
          }
        })
      })
    }

    var fixedHeight = scrollResult.rowScroll ? tableHeight - JQTABLESCROLLWIDTH : tableHeight;
    if (!_this.totalJson.noTotal) {
      fixedHeight -= $tbodyTr.height();
    }
    if (_fixedLeft) {
      var fixedWidth = 0;
      // 单列
      if (_fixedLeft <= 1) {
        fixedWidth = $tbodyTd.eq(0).width();
      } else if (_fixedLeft > 1) {
        //多列
        for (var index = 0; index < _fixedLeft; index++) {
          fixedWidth += $tbodyTd.eq(index).width();
        }
      }
      $tableFixed.width(fixedWidth).height(fixedHeight);
      // 不是全部固定列，在resetColgroupWidth设置宽度
      if (_this.colJson.isAllWidth === true) {
        $tableFixed.find('table').width(tableWidth);
      }
    }

    if (_this.config.fixedRight) {
      var fixedRight = scrollResult.colScroll ? JQTABLESCROLLWIDTH : 0;
      var fixedRightWidth = 0;
      if (_fixedRight <= 1) {
        // 单列
        fixedRightWidth = $tbodyTd.eq($tbodyTd.length - 1).width();
      } else if (_fixedRight > 1) {
        //多列
        for (var index = 0; index < _fixedRight; index++) {
          fixedRightWidth += $tbodyTd.eq($tbodyTd.length - 1 - index).width();
        }
      }
      //右侧列宽度
      $tableFixedRight.width(fixedRightWidth).height(fixedHeight).css({ right: fixedRight });
      // 不是全部固定列，在resetColgroupWidth设置宽度
      if (_this.colJson.isAllWidth === true) {
        $tableFixedRight.find('table').width(tableWidth);
      }
    }
  }

  //有滚动条&&全部列固定宽度
  function setTableWidthScroll(_this, $template, scrollResult) {
    var $thead = $template.find('.c-table__header-wrapper table');
    var $tbody = $template.find('.c-table__body-wrapper table');
    var sumWidth = _this.colJson.width.reduce(add, 0);
    var templateWidth = scrollResult.colScroll ? sumWidth + JQTABLESCROLLWIDTH : sumWidth;
    $template.width(templateWidth + 1);
    $thead.width(sumWidth);
    $tbody.width(sumWidth);
  }

  //gutter添加移除
  function setGutter($template, scrollResult) {
    var $thead = $template.find('.c-table__header-wrapper table');
    var $tbody = $template.find('.c-table__body-wrapper table');
    var isGutter = $thead.find('.gutter').length;
    if (isGutter) {
      $thead.find('.gutter').remove();
      $tbody.find('.gutter').remove();
    }
  }

  //设置表哥高度
  function setTableHeight(_this) {
    var $template = _this.$table;
    //设置table高度
    //var templateHeight = $this.data('height');
    var templateHeight = _this.$table.data('height');
    if (templateHeight) {
      var $bodywrapper = $template.find('.c-table__body-wrapper');
      $template.css({
        'max-height': templateHeight + 'px'
      });
      $bodywrapper.css({
        'max-height': 'none'
      });
      // 获取表格高度
      var tableHeaderHeight = _this.headerHeight;
      var tableHeight = $template.height();
      var bodyHeight = tableHeight - tableHeaderHeight;
      if (!_this.totalJson.noTotal) {
        bodyHeight -= $bodywrapper.find('tbody tr').eq(0).height();
      }
      $bodywrapper.css({
        'max-height': bodyHeight + 'px'
      });
    }

  }

  //设置col宽度
  function resetColgroupWidth(_this, $template, colJson, scrollResult) {
    var $colgroup = $template.find('colgroup');
    var tableWidth = $template.width();
    //遍历赋值无宽度属性列宽度--自适应列

    //总列数
    //无宽度自适应的列个数
    var colNoWidthLen = colJson.noWidthIndex.length;
    //总宽度
    var sumWidth = colJson.tdWidth.reduce(add, 0);
    if (scrollResult.colScroll) {
      sumWidth += JQTABLESCROLLWIDTH;
    }
    var minWidth = _this.config.fixedMinWidth;
    var noWidthColAdaptClient = _this.config.noWidthColAdaptClient;
    var arr = [];
    for (var i = 0; i < colNoWidthLen; i++) {
      var _index = colJson.noWidthIndex[i];
      arr.push(colJson.tdWidth[_index]);
    }
    var arrWidth = arr.reduce(add, 0);
    var leftwidth = tableWidth - sumWidth + arrWidth - 2;
    //都不够分，最小宽度
    if (arr.length * minWidth >= leftwidth) {
      setColWidthEach(_this, $colgroup, colJson, arr, minWidth);
    } else {
      arr = getColgroupWidth(arr, leftwidth, minWidth, arr.length, noWidthColAdaptClient);
      setColWidthEach(_this, $colgroup, colJson, arr, false);
    }
    sumWidth = colJson.width.reduce(add, 0) + 2;
    $template.find('.c-table__header-wrapper table').width(sumWidth);
    $template.find('.c-table__body-wrapper table').width(sumWidth);
    $template.find('.c-table__fixed-header-wrapper table').width(sumWidth - 2);
    $template.find('.c-table__fixed-body-wrapper table').width(sumWidth - 2);
  }
  //循环设置自适应col宽度
  function setColWidthEach(_this, $colgroup, colJson, arr, minWidth) {
    var colNoWidthLen = colJson.noWidthIndex.length;
    var overSizeColArr = [];
    for (var j = 0; j < colNoWidthLen; j++) {
      var _index = colJson.noWidthIndex[j];
      if (/^\d+\.\d{4,}$/.test(arr[j] + '')) {
        arr[j] = Number(arr[j]).toFixed(3);
      }
      var _width = minWidth && arr[j] < minWidth ? minWidth : arr[j];
      colJson.width[_index] = Number(_width);
      // 超过最大宽度
      if (_width >= _this.config.fixedMaxWidth) {
        overSizeColArr.push(_index);
      }
      $.each($colgroup, function (index, el) {
        $(el).find('col').eq(_index).attr('width', _width);
      });
    }
    setSafriaCellWidthEach(_this, $colgroup, colJson, overSizeColArr);
  }
  // 兼容safria在td宽度大于col时，col的width失效
  function setSafriaCellWidthEach(_this, $colgroup, colJson, arr) {
    // safria&&超过最大宽度
    if (_this.isSafria) {
      var noIndexArr = colJson.noWidthIndex;
      if (arr.length > 0) {
        setSafriaCellWidthEachFn($colgroup, colJson, arr, true);
        // 去掉设置高度的
        noIndexArr = noIndexArr.filter(function (item) {
          return arr.indexOf(item) === -1;
        });
      }
      // 剩余宽度设为auto-针对resize
      if (noIndexArr.length) {
        setSafriaCellWidthEachFn($colgroup, colJson, noIndexArr, false);
      }
    }
  }
  function setSafriaCellWidthEachFn($colgroup, colJson, arr, isOverSize) {
    for (var i = 0; i < arr.length; i++) {
      var _index = arr[i];
      $.each($colgroup, function (i1, el) {
        var $tr = $(el).parents('table').find('tbody tr');
        var _width = isOverSize ? colJson.width[_index] - 36 : 'auto';
        $.each($tr, function (i2, _tr) {
          $(_tr).find('td').eq(_index).find('.cell').width(_width);
        });
      });
    }
  }
  //获取自适应的最终宽度
  function getColgroupWidth(arr, width, minwidth, length, adaptClient) {
    var totalWidth = arr.reduce(addNum, 0);
    var distance = (width - totalWidth) / length;
    // 不自适应，一旦<0就返回，不做操作
    if (!adaptClient && distance < 0) {
      return arr;
    } else {
      //操作distance的次数
      var len = 0;
      //有多余的宽度
      var distanceLen = 0;
      //剩余可操作的数
      var countLen = 0;
      if (distance > 0) {
        for (var i = 0; i < arr.length; i++) {
          arr[i] = arr[i] + distance;
          arr[i] < minwidth ? arr[i] = minwidth : countLen++;
        }
      } else {
        for (var j = 0; j < arr.length; j++) {
          if (arr[j] < minwidth) {
            arr[j] = minwidth;
          } else if (arr[j] > minwidth) {
            var _width = arr[j] + distance;
            if (_width > minwidth) {
              countLen++;
            }
            arr[j] = _width < minwidth ? minwidth : _width;
          }
        }
      }
      totalWidth = arr.reduce(addNum, 0);
      //操作了distance的次数不够需要的 || 有比最小宽度小的，多出了差值且有数可以补
      // if ((len < length && countLen > 0) || (distanceLen && countLen > 0)) {
      if (Math.floor(totalWidth) !== Math.floor(width)) {
        getColgroupWidth(arr, width, minwidth, countLen, adaptClient);
      }
      return arr;
    }
  }
  //distance>0
  // function getColgroupWidth(arr, width, minwidth, length) {
  //   var totalWidth = arr.reduce(addNum, 0);
  //   var distance = (width - totalWidth) / length;
  //   for (var i = 0; i < arr.length; i++) {
  //     arr[i] += distance;
  //   }
  //   totalWidth = arr.reduce(addNum, 0);
  //   if (totalWidth <= width) {
  //     countLen = arr.length;
  //   }
  //   if (totalWidth !== width) {
  //     getColgroupWidth(arr, width, minwidth, countLen);
  //   }
  //   return arr;
  // }
  //最小宽度
  // function judgeMinWidth(_this, width) {
  //   var _width = width < _this.config.fixedMinWidth ? _this.config.fixedMinWidth : width;
  //   return _width;
  // }
  function add(a, b) {
    return a + b;
  }
  function addNum(a, b) {
    return a - (-b);
  }

  function getScrollBarWidth() {
    var inner = document.createElement('p');
    inner.style.width = "100%";
    inner.style.height = "200px";
    var outer = document.createElement('div');
    outer.style.position = "absolute";
    outer.style.top = "0px";
    outer.style.left = "0px";
    outer.style.visibility = "hidden";
    outer.style.width = "200px";
    outer.style.height = "150px";
    outer.style.overflow = "hidden";
    outer.appendChild(inner);
    document.body.appendChild(outer);
    var w1 = inner.offsetWidth;
    outer.style.overflow = 'scroll';
    var w2 = inner.offsetWidth;
    if (w1 == w2) w2 = outer.clientWidth;
    document.body.removeChild(outer);
    return (w1 - w2);
  }
  //获取Col宽度,是否排序
  function getColSort(_this, $thead) {
    var $col = $thead.find('colgroup>col');
    var result = getColFn('sort', $col);
    var sortconfig = getColFn('sortconfig', $col);
    return {
      sort: result.demo,
      noSort: result.nodemo,
      sortConfig: sortconfig.demo
    };
  }
  //获取Col是否总计
  function getColTotal(_this) {
    var $thead = _this.$table.find('.c-table__header-wrapper table');
    var $col = $thead.find('colgroup>col');
    var result = getColFn('total', $col);
    var total = result.demo;
    var noTotal = result.nodemo;
    return {
      total: total,
      noTotal: noTotal
    };
  }
  //获取信息函数
  function getColFn(name, $col) {
    // 排序
    var demo = [];
    var demoLen = 0;
    $col = $col.not('[name=gutter]');
    $.each($col, function (_index, el) {
      var _demo = $(el).data(name);
      demo.push(_demo);
      if (_demo) {
        demoLen++;
      }
    });
    var nodemo = demoLen ? false : true;
    return {
      demo: demo,
      nodemo: nodemo
    };
  }
  // 对比th和td宽度，返回列最终宽度
  function getEachColWidth($tds, $ths, index) {
    var tdWidth = $tds.eq(index).width();
    var thWidth = $ths.eq(index).width();
    return tdWidth > thWidth ? tdWidth : thWidth;
  }
  // 获取Col宽度
  function getColInfo(_this) {
    _this.$table.addClass('c-table--noWrap-init');
    var $thead = _this.$table.find('.c-table__header-wrapper table');
    var $tbody = _this.$table.find('.c-table__body-wrapper table');
    var $col = $thead.find('colgroup>col');
    var theadWidth = $thead.width();
    var tbodyWidth = $tbody.width();
    //所有的width
    var width = [];
    var tdWidth = [];
    //真实的宽度
    var realTotalWidth = theadWidth > tbodyWidth ? theadWidth : tbodyWidth;
    //无宽度的序号
    var noWidthIndex = [];
    //有宽度的宽度值
    var hasWidthArr = [];

    var isAllWidth = true;
    var $tds = $tbody.find('tr').eq(0).find('td');
    var $ths = $thead.find('tr').eq(0).find('th');
    $col = $col.not('[name=gutter]');
    $.each($col, function (_index, el) {
      var _width = $(el).attr('width') ? Number($(el).attr('width')) : 0;
      _width = judgeMaxWidth(_this, _width);
      width.push(_width);
      if (_width) {
        hasWidthArr.push(_width);
        tdWidth.push(_width);
      } else {
        var _tdsWidth = judgeMaxWidth(_this, getEachColWidth($tds, $ths, _index) + 1);
        // var _tdWidth = _tdsWidth < _this.config.fixedMinWidth ? _this.config.fixedMinWidth : _tdsWidth;
        isAllWidth = false;
        noWidthIndex.push(_index);
        tdWidth.push(_tdsWidth);
      }
    });
    _this.$table.addClass('c-table__cell--block').removeClass('c-table--noWrap-init');
    return {
      width: width,
      noWidthIndex: noWidthIndex,
      hasWidthArr: hasWidthArr,
      isAllWidth: isAllWidth,
      realTotalWidth: realTotalWidth,
      tdWidth: tdWidth
    };
  }
  // 判断大于最大宽度
  function judgeMaxWidth(_this, width) {
    var _width = width > _this.config.fixedMaxWidth ? _this.config.fixedMaxWidth : width;
    return _width;
  }

  //判断滚动
  function judgeIsScroll($bodywrapper, $tbody, $template, colJson) {
    var colScroll = $bodywrapper.height() < $tbody.height();
    var totalWidth = colJson.width.reduce(add, 0) + 1;
    if (colScroll) {
      totalWidth += JQTABLESCROLLWIDTH;
    }
    var rowScroll = totalWidth > $template.width();
    if (rowScroll) {
      colScroll = $bodywrapper.height() - JQTABLESCROLLWIDTH < $tbody.height();
    }
    return {
      rowScroll: rowScroll,
      colScroll: colScroll
    };
  }
  /*========END 渲染表格===========*/
  $.fn.jqTable = function (options) {
    return this.each(function () {
      new jqTable(options, $(this));
    });
  };
}());