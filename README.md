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


#### 参数介绍

|参数名|默认值（可选值）|作用|类型|
|----|-----|-----|-----|
|fixedLeft| false| 左边固定|boolean|
|fixedRight| false| 右边固定|boolean|
|fixedMinWidth| 100| 最小宽度|number|
|totalString| '--'| 计算列总数|string|
|totalTitle|'总计'| 总数的标题| string |

#### 隐藏参数介绍

|参数名|作用|类型|
|----|-----|-----|
|data-total="true"| 开启这一列计算总数功能|boolean|
|data-sort="true"|开启这一列的排序功能|boolean|


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
