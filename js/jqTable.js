

//表格主业务：左右固定，排序，计算总数，多表头等
$(function () {
  var defaultOptions = {
    fixedLeft: false,
    fixedRight: false,
    fixedMinWidth: 100,
    totalString: '--',
    totalTitle: '总计'
  };
  var JQTABLESCROLLWIDTH = getScrollBarWidth();
  var hideColumnTpl = '<div class="hidden-columns">' +
    '<div></div>' +
    '<div></div>' +
    '<div></div>' +
    '<div></div>' +
    '<div></div>' +
    '<div></div>' +
    '<div></div>' +
    '</div>';
  //排序模版
  var SORTTPL = '<div class="c-table__sort {{class}}">' +
    '<i class="fa fa-long-arrow-down c-table__down" aria-hidden="true"></i>' +
    '<i class="fa fa-long-arrow-up c-table__up" aria-hidden="true"></i>' +
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
    '{{hideColumn}}' +
    '<div class="c-table__header-wrapper"> ' +
    '{{theadHtml}}' +
    '</div>' +
    '<div class="c-table__body-wrapper"> ' +
    '{{tbodyHtml}}' +
    '</div> ' +
    '{{fixedLeft}}' +
    '{{fixedRight}}' +
    '</div>';
  var GUTTERTPL = '<td class="gutter"></td>';
  var GUTTERWIDTHTPL = '<td class="gutter" style="width:' + JQTABLESCROLLWIDTH + 'px;"></td>';
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
            return;
          }
          if ($(el).hasClass('activeDown')) {
            $(el).find('.c-table__down').trigger('click.jqTable');
            _this.updateEvent();
            return;
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
      }

      //获取头部信息
      _this.colJson = getColInfo(_this);
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
      setSize(_this);

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
    }
  });
  /*========BEGIN 排序===========*/
  // 排序
  function sortFn($this, isDown) {
    var className = isDown ? 'activeDown' : 'activeUp';
    //切换class
    $('.c-table__sort').removeClass('activeUp activeDown');
    $this.parents('.c-table__sort').addClass(className);
    var $template = $this.parents('.c-table--main');
    var _this = $template.data('table');
    var $fixedTbody = $template.find('.c-table__fixed-body-wrapper tbody');
    var $tbody = $template.find('.c-table__body-wrapper table tbody');
    var $tr = $tbody.find('tr');
    var $th = $this.parents('thead').find('th');
    var sortJson = [];
    var index = $th.index($this.parents('th'));
    //渲染排序所需的json
    $.each($tr, function (_index, el) {
      var _temp = {};
      _temp.index = _index;
      _temp.value = $(el).find('td').eq(index).text().trim();
      sortJson.push(_temp);
    });
    //排序
    sortJson = order(sortJson, 'value', isDown);
    // 渲染排序好的html
    sortRender(_this, $tbody, sortJson);
    $.each($fixedTbody, function (index, fixedTbody) {
      sortRender(_this, $(fixedTbody), sortJson);
    });
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
    var $html;
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
    var template = TEMPLATETPL.replace('{{hideColumn}}', hideColumnTpl).replace('{{theadHtml}}', theadHtml).replace('{{tbodyHtml}}', tbodyHtml).replace('{{fixedLeft}}', fixedLeft).replace('{{fixedRight}}', fixedRight);
    var $template = $(template);
    return $template;
  }

  // 设置宽度
  function setSize(_this) {
    var $template = _this.$table;
    var $headerwrapper = $template.find('.c-table__header-wrapper');
    var $bodywrapper = $template.find('.c-table__body-wrapper');
    var $thead = $headerwrapper.find('table');
    var $tbody = $bodywrapper.find('table');
    var $colgroup = $template.find('colgroup');
    var scrollResult;
    // 获取colgroup宽度属性信息
    var colJson = _this.colJson;
    //设置table高度
    setTableHeight(_this, $template);
    scrollResult = judgeIsScroll($bodywrapper, $tbody, $template, colJson);
    //不是全部固定宽度
    if (!_this.fixedWidth) {
      //重置Colgroup宽度属性
      resetColgroupWidth(_this, $template, colJson, scrollResult);
    }

    // 修改宽度值
    // 获取表格宽度--如果想改变宽度 就在外围加div限制，c-table默认width:100%
    var tableWidth = $template.width();
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
    // 有固定列时，设置固定列宽高
    if (_this.config.fixedRight || _this.config.fixedLeft) {
      setFixedSize(_this, $template, scrollResult);
      removeFixedCheckbox(_this, $template, scrollResult);
    } else {
      $template.addClass('c-table--enable-row-hover el-table--enable-row-transition');
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
    var tableBodyHeight = tableHeight - tableHeaderHeight;
    var $tableFixed = $template.find('.c-table__fixed');
    var $tableFixedRight = $template.find('.c-table__fixed-right');
    if (scrollResult.rowScroll){
      tableBodyHeight -= JQTABLESCROLLWIDTH;
    }
    // 有固定时,设置高度
    if (_this.config.fixedRight || _this.config.fixedLeft) {
      $template.find('.c-table__fixed-body-wrapper').css({
        'max-height': tableBodyHeight + 'px',
        'top': _this.headerHeight + 'px'
      });
      // 设置fixed表格多余列隐藏
      $tableFixed.find('.c-table__fixed-body-wrapper tr td:not(:first-child):not(.gutter)').addClass('is-hidden');
      $tableFixedRight.find('.c-table__fixed-body-wrapper tr td:not(:nth-child(' + colLen + ')):not(.gutter)').addClass('is-hidden');
    }

    var fixedHeight = scrollResult.rowScroll ? tableHeight - JQTABLESCROLLWIDTH : tableHeight;
    if (!_this.totalJson.noTotal) {
      fixedHeight -= $tbodyTr.height();
    }
    if (_this.config.fixedLeft) {
      var fixedWidth = $tbodyTd.eq(0).width();
      $tableFixed.width(fixedWidth).height(fixedHeight);
      $tableFixed.find('table').width(fixedWidth);
    }

    if (_this.config.fixedRight) {
      var fixedRight = scrollResult.colScroll ? JQTABLESCROLLWIDTH : 0;
      var fixedRightWidth = $tbodyTd.eq($tbodyTd.length - 1).width();
      //右侧列宽度
      $tableFixedRight.width(fixedRightWidth).height(fixedHeight).css({ right: fixedRight });
      $tableFixedRight.find('table').width(fixedRightWidth);
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
    //有垂直滚动条&&没有gutter，添加
    if (scrollResult.colScroll && !isGutter) {
      $thead.find('colgroup').append(GUTTERWIDTHTPL);
      $thead.find('thead tr').append(GUTTERWIDTHTPL);
      // $tbody.find('colgroup').append(GUTTERTPL);
      $tbody.find('tbody tr').append(GUTTERTPL);
    }
    //没有垂直滚动条&&有gutter，去除
    if (!scrollResult.colScroll && isGutter) {
      $thead.find('.gutter').remove();
      $tbody.find('.gutter').remove();
    }
  }

  //设置表哥高度
  function setTableHeight(_this, $template) {
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
    var arr = [];
    for (var i = 0; i < colNoWidthLen; i++) {
      var _index = colJson.noWidthIndex[i];
      arr.push(colJson.tdWidth[_index]);
    }

    var arrWidth = arr.reduce(add, 0);
    var leftwidth = tableWidth - sumWidth + arrWidth - 2;
    //都不够分，最小宽度
    if (arr.length * minWidth >= leftwidth) {
      setColWidthEach($colgroup, colJson, arr, minWidth);
    } else {
      // if (arr.length === 1 && arr[0]==100){
      //   arr[0] = leftwidth;
      // }else{
      arr = getColgroupWidth(arr, leftwidth, minWidth, arr.length);
      // }
      setColWidthEach($colgroup, colJson, arr, false);
    }
    sumWidth = colJson.width.reduce(add, 0);
    $template.find('.c-table__header-wrapper table').width(sumWidth);
    $template.find('.c-table__body-wrapper table').width(sumWidth);

  }
  //循环设置自适应col宽度
  function setColWidthEach($colgroup, colJson, arr, minWidth) {
    var colNoWidthLen = colJson.noWidthIndex.length;
    for (var j = 0; j < colNoWidthLen; j++) {
      var _index = colJson.noWidthIndex[j];
      var _width = minWidth || arr[j];
      colJson.width[_index] = _width;
      $.each($colgroup, function (index, el) {
        $(el).find('col').eq(_index).attr('width', _width);
      });
    }
  }
  //获取自适应的最终宽度
  function getColgroupWidth(arr, width, minwidth, length) {
    var totalWidth = arr.reduce(addNum, 0);
    var distance = (width - totalWidth) / length;
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
      getColgroupWidth(arr, width, minwidth, countLen);
    }
    return arr;
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
  function judgeMinWidth(_this, width) {
    var _width = width < _this.config.fixedMinWidth ? _this.config.fixedMinWidth : width;
    return _width;
  }
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
    // var $thead = _this.$container.find('.c-table__header-wrapper table');
    var $col = $thead.find('colgroup>col');
    var result = getColFn('sort', $col);
    var sort = result.demo;
    var noSort = result.nodemo;
    return {
      sort:sort,
      noSort:noSort
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
      total:total,
      noTotal:noTotal
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
      demo:demo,
      nodemo:nodemo
    };
  }
  //获取Col宽度
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
    var $tds = theadWidth > tbodyWidth ? $thead.find('tr').eq(0).find('th') : $tbody.find('tr').eq(0).find('td');
    $col = $col.not('[name=gutter]');
    $.each($col, function (_index, el) {
      var _width = $(el).attr('width') ? Number($(el).attr('width')) : 0;
      width.push(_width);
      if (_width) {
        hasWidthArr.push(_width);
        tdWidth.push(_width);
      } else {
        var _tdsWidth = $tds.eq(_index).find('.cell').width() + 1;
        // var _tdWidth = _tdsWidth < _this.config.fixedMinWidth ? _this.config.fixedMinWidth : _tdsWidth;
        isAllWidth = false;
        noWidthIndex.push(_index);
        tdWidth.push(_tdsWidth);
      }
    });
    _this.$table.addClass('c-table__cell--block').removeClass('c-table--noWrap-init');
    return {
      width:width,
      noWidthIndex:noWidthIndex,
      hasWidthArr:hasWidthArr,
      isAllWidth:isAllWidth,
      realTotalWidth:realTotalWidth,
      tdWidth:tdWidth
    };
  }
  //判断滚动
  function judgeIsScroll($bodywrapper, $tbody, $template, colJson) {
    var colScroll = $bodywrapper.height() < $tbody.height();
    var totalWidth = colJson.width.reduce(add, 0) + 1;
    if(colScroll){
      totalWidth += JQTABLESCROLLWIDTH;
    }
    var rowScroll = totalWidth > $template.width();

    return {
      rowScroll:rowScroll,
      colScroll:colScroll
    };
  }
  /*========END 渲染表格===========*/
  $.fn.jqTable = function (options) {
    return this.each(function () {
      new jqTable(options, $(this));
    });
  };
}());
