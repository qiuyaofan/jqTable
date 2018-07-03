# jqTable：一款集所有交互于一身的table组件

 [ 在线例子](https://qiuyaofan.github.io/jqTable/) 

#### 功能包括：

- [x] 动态表格数据，提供更新数据方法
- [x] 表格头部固定，支持多级表头
- [x] 左右列可选固定
- [x] 复选框选择，批量处理
- [x] 二级列表，可展开收起
- [x] 宽度可固定，可自适应
- [x] 排序
- [x] 合计显示在底部固定行
- [x] 宽度自适应可设置最小宽度

#### 类名介绍

|类名|作用|
|----|-----|
|c-table-border| 添加边框|
|c-table--noWrap| 不换行|
| c-table--striped| 斑马线表格|
|g-selectAll--main|复选框选择父元素|
|input type="checkbox" class="g-selectAll"|复选框选择全部|
|input type="checkbox" class="g-selectAll--input"|复选框选择单个|
|class="g-selectAll--btn" data-tag="select"|复选框按钮，点击在回调中获取选中值的具体信息json |
|g-toggleTable--main|展开收起父元素|
|tr.g-toggleTable--title>th i.g-toggleTable--buttonAll|操作头-全部切换部分|
|tr.g-toggleTable--title>th i.g-toggleTable--button|操作头-单个切换部分|
|col data-total="true"|计算总数|
|col data-sort="true"|添加排序|
|col data-sortconfig="string/function"|添加参数，可为字符串或函数|


#### 参数介绍

|参数名|默认值（可选值）|作用|类型|
|----|-----|-----|-----|
|fixedLeft| false| 左边固定|boolean|
|fixedRight| false| 右边固定|boolean|
|fixedMinWidth| 100| 最小宽度|number|
| fixedMaxWidth |500| 最大宽度|number|
|totalString| '--'| 计算列总数|string|
|totalTitle|'总计'| 总数的标题| string |
| handleSortData |{}| 可对相应列执行自定义处理函数，在排序前| json |
| noWidthColAdaptClient |false|设置自适应宽度列是否根据窗口变小改变而减小（建议设为false）| json |

#### 隐藏参数介绍

|参数名|作用|类型|可选参数|
|----|-----|-----|-----|
|data-total="true"| 开启这一列计算总数功能|boolean||
|data-sort="true"|开启这一列的排序功能|boolean|up（开启且默认为up排序）,down|
|data-sortconfig="string或function"|添加参数|string或function||

#### 方法

|中文名|方法名|举例|
|----|-----|-----|
|更新数据|updateHtml| $('.c-table').eq(0).data('table').updateHtml(html)|

注：$('.c-table').eq(0).data('table')为所要更新的表格的实例对象

#### 调用举例
```
html:
<div class="c-table c-table--noWrap">
   <table cellspacing="0" cellpadding="0" border="0" class="" role="c-table">
		<colgroup>
		  <col name="" width="150">
		  <col name="" width="120">
		  <col name="" width="120">
		  <col name="" width="120">
		  <col name="" width="">
		  <col name="" width="">
		  <col name="" width="140">
		</colgroup>
		<thead>
		  <tr>
		    <th class="">
		      <div class="cell">日期</div>
		    </th>
		    <th class="">
		      <div class="cell">姓名</div>
		    </th>
		    <th class="">
		      <div class="cell">省份</div>
		    </th>
		    <th class="">
		      <div class="cell">市区</div>
		    </th>
		    <th  class="">
		      <div class="cell">地址</div>
		    </th>
		    <th class="">
		      <div class="cell">邮编</div>
		    </th>
		    <th class="">
		      <div class="cell">操作</div>
		    </th>
		  </tr>
		</thead>
		<tbody>
		  <tr>
		    <td class="">
		      <div class="cell">2016-05-03</div>
		    </td>
		    <td class="">
		      <div class="cell">王小虎</div>
		    </td>
		    <td class="">
		      <div class="cell">上海</div>
		    </td>
		    <td class="">
		      <div class="cell">普陀区</div>
		    </td>
		    <td class="">
		      <div class="cell">上海市普陀区金沙江路 1518 弄</div>
		    </td>
		    <td class="">
		      <div class="cell">200333</div>
		    </td>
		    <td class="">
		      <div class="cell">
		        <button type="button" class="c-button">移除</button>
		      </div>
		    </td>
		    
		  </tr>
	</tbody>
</table>
</div>

JS:
$('[role="c-table"]').jqTable();

```

新增handleSortData使用举例

```
data-sortconfig="¥":参数handleSortData没定义，则替换字符¥为'',
data-sortconfig="sortSize":排序前执行handleSortData.sortSize 处理数据，具体数据格式可输出sortSize函数的data查看

HTML:
<table cellspacing="0" cellpadding="0" border="0" role="c-table-sort">
  <colgroup>
    <col name="" width="130" data-sort="up" data-sortconfig="sortSize">
    <col name="" width="130" data-sort="true" data-sortconfig="¥">
  </colgroup>
  <thead>
    <tr>
      <th class="">
        <div class="cell">
          流量大小
        </div>
      </th>
      <th class="">
        <div class="cell">金额</div>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="">
        <div class="cell">500M</div>
      </td>
      <td class="">
        <div class="cell">¥3.000</div>
      </td>
    </tr>
  </tbody>
</table>

JS:
// 排序表格
$('[role="c-table-sort"]').jqTable({
	handleSortData:{
	  sortSize: sortSize
	}
});
// 排序前对数据进行处理，此处场景是判断流量大小的单位M/G做相应转换
function sortSize(data){
    var result = [];
    var _data, _value;
    for (var i = 0; i < data.length; i++) {
      _data = data[i];
      _value = _data.value;
      _data.value = _value.indexOf('M') !== -1 ? removeUtil(_value, 'M') : _value.indexOf('G') !== -1 ? removeUtil(_value, 'G') * 1024 : _value;
      result.push(_data);
    }
    return result;
  }
  function removeUtil(data,str){
    return data.replace(new RegExp(str,'gi'), '');
  }
```

#### 例子中用到的JS说明

##### jqTable js

```
//分开引入
js/jqTable.js : 主要代码，一定要引入的
js/jqTablePlugins.js : 包含展开收起、复选框的选择的代码（可选择性引入）

//总代码
js/jqTable.all.js 主要代码+展开收起、复选框的选择

// 压缩后的代码
js/zipJs/

```

##### 其他js
```
js/plugins ： 例子中用到的外来插件
js/json.js ： 例子中用到的json

```

##### 更新日志

2018-07-03 新增固定列滚动列表，ie8降级兼容（可用，不支持固定列等部分功能）

2018-04-16 优化自适应列的宽度计算方式，默认窗口宽度不够时，列最大宽度为500，窗口缩小，列的最小宽度大于最小宽度，小于最大宽度，正常情况下为原始宽度

2018-04-12 添加排序前对数据的处理（用户可使用自定义函数处理，不影响源数据展示，仅对排序有影响）

2018-01-18 添加多列功能


