## Modules

<dl>
<dt><a href="#module_parallel coordinates">parallel coordinates</a> ⇒ <code>object</code></dt>
<dd><p>A reusable d3 parallel coordinates generator with statistical coloring</p>
</dd>
<dt><a href="#module_scatterplot">scatterplot</a> ⇒ <code>object</code></dt>
<dd><p>A reusable d3 scatterplot generator</p>
</dd>
</dl>

<a name="module_parallel coordinates"></a>
## parallel coordinates ⇒ <code>object</code>
A reusable d3 parallel coordinates generator with statistical coloring

**Returns**: <code>object</code> - parallelCoordinates  
**Author:** Taylor Denouden  

| Param | Type | Description |
| --- | --- | --- |
| parent | <code>string</code> | | {DOM element} parent - A dom element to append the vis to |


* [parallel coordinates](#module_parallel coordinates) ⇒ <code>object</code>
    * [.render()](#module_parallel coordinates+render) ⇒ <code>scatterplot</code>
    * [.redraw()](#module_parallel coordinates+redraw) ⇒ <code>scatterplot</code>
    * [.width(val)](#module_parallel coordinates+width) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.height(val)](#module_parallel coordinates+height) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.margin(val)](#module_parallel coordinates+margin) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.width(val)](#module_parallel coordinates+width) ⇒ <code>int</code> &#124; <code>scatterplot</code>

<a name="module_parallel coordinates+render"></a>
### parallel coordinates.render() ⇒ <code>scatterplot</code>
**Kind**: instance method of <code>[parallel coordinates](#module_parallel coordinates)</code>  
<a name="module_parallel coordinates+redraw"></a>
### parallel coordinates.redraw() ⇒ <code>scatterplot</code>
**Kind**: instance method of <code>[parallel coordinates](#module_parallel coordinates)</code>  
<a name="module_parallel coordinates+width"></a>
### parallel coordinates.width(val) ⇒ <code>int</code> &#124; <code>scatterplot</code>
**Kind**: instance method of <code>[parallel coordinates](#module_parallel coordinates)</code>  

| Param | Type |
| --- | --- |
| val | <code>int</code> | 

<a name="module_parallel coordinates+height"></a>
### parallel coordinates.height(val) ⇒ <code>int</code> &#124; <code>scatterplot</code>
**Kind**: instance method of <code>[parallel coordinates](#module_parallel coordinates)</code>  

| Param | Type |
| --- | --- |
| val | <code>int</code> | 

<a name="module_parallel coordinates+margin"></a>
### parallel coordinates.margin(val) ⇒ <code>int</code> &#124; <code>scatterplot</code>
**Kind**: instance method of <code>[parallel coordinates](#module_parallel coordinates)</code>  

| Param | Type |
| --- | --- |
| val | <code>int</code> | 

<a name="module_parallel coordinates+width"></a>
### parallel coordinates.width(val) ⇒ <code>int</code> &#124; <code>scatterplot</code>
**Kind**: instance method of <code>[parallel coordinates](#module_parallel coordinates)</code>  

| Param | Type |
| --- | --- |
| val | <code>int</code> | 

<a name="module_scatterplot"></a>
## scatterplot ⇒ <code>object</code>
A reusable d3 scatterplot generator

**Returns**: <code>object</code> - scatterplot chart  
**Author:** Taylor Denouden  

| Param | Type | Description |
| --- | --- | --- |
| parent | <code>string</code> | | {DOM element} parent - A dom element to append the vis to |


* [scatterplot](#module_scatterplot) ⇒ <code>object</code>
    * [.width](#module_scatterplot+width) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.height](#module_scatterplot+height) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.margin](#module_scatterplot+margin) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.data](#module_scatterplot+data) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.xAccessor](#module_scatterplot+xAccessor) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.yAccessor](#module_scatterplot+yAccessor) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.xLabel](#module_scatterplot+xLabel) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.yLabel](#module_scatterplot+yLabel) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.xLog](#module_scatterplot+xLog) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.yLog](#module_scatterplot+yLog) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.color](#module_scatterplot+color) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.colorAccessor](#module_scatterplot+colorAccessor) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.keyAccessor](#module_scatterplot+keyAccessor) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.radius](#module_scatterplot+radius) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.rSquare](#module_scatterplot+rSquare) ⇒ <code>float</code>
    * [.correlation](#module_scatterplot+correlation) ⇒ <code>float</code>
    * [.covariance](#module_scatterplot+covariance) ⇒ <code>float</code>
    * [.render()](#module_scatterplot+render) ⇒ <code>scatterplot</code>
    * [.redraw()](#module_scatterplot+redraw) ⇒ <code>scatterplot</code>

<a name="module_scatterplot+width"></a>
### scatterplot.width ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get the width attribute of a chart.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  

| Param | Type |
| --- | --- |
| [val] | <code>int</code> | 

<a name="module_scatterplot+height"></a>
### scatterplot.height ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get the height attribute of a chart.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  

| Param | Type |
| --- | --- |
| [val] | <code>int</code> | 

<a name="module_scatterplot+margin"></a>
### scatterplot.margin ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get the margin attribute of a chart.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  

| Param | Type |
| --- | --- |
| [val] | <code>int</code> | 

<a name="module_scatterplot+data"></a>
### scatterplot.data ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get the data that accessor functions refer to.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  

| Param | Type |
| --- | --- |
| [val] | <code>int</code> | 

<a name="module_scatterplot+xAccessor"></a>
### scatterplot.xAccessor ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get a function used to access the data shown on the x axis.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  

| Param | Type |
| --- | --- |
| [val] | <code>function</code> &#124; <code>Number</code> | 

<a name="module_scatterplot+yAccessor"></a>
### scatterplot.yAccessor ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get a function used to access the data shown on the y axis.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  

| Param | Type |
| --- | --- |
| [val] | <code>function</code> &#124; <code>Number</code> | 

<a name="module_scatterplot+xLabel"></a>
### scatterplot.xLabel ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get the x axis label.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  

| Param | Type |
| --- | --- |
| [val] | <code>String</code> | 

<a name="module_scatterplot+yLabel"></a>
### scatterplot.yLabel ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get the y axis label.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  

| Param | Type |
| --- | --- |
| [val] | <code>String</code> | 

<a name="module_scatterplot+xLog"></a>
### scatterplot.xLog ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get whether the x axis scale should be log transformed.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  

| Param | Type |
| --- | --- |
| [val] | <code>Boolean</code> | 

<a name="module_scatterplot+yLog"></a>
### scatterplot.yLog ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get whether the y axis scale should be log transformed.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  

| Param | Type |
| --- | --- |
| [val] | <code>Boolean</code> | 

<a name="module_scatterplot+color"></a>
### scatterplot.color ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get a scale function that accepts a data value and returns a color.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  

| Param | Type |
| --- | --- |
| [val] | <code>function</code> | 

<a name="module_scatterplot+colorAccessor"></a>
### scatterplot.colorAccessor ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get a function used to access the data and pass the value to the color function.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  

| Param | Type |
| --- | --- |
| [val] | <code>function</code> &#124; <code>Number</code> | 

<a name="module_scatterplot+keyAccessor"></a>
### scatterplot.keyAccessor ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get a function used to determine which points shown are the same datum.
Allows for mark translation on redraw.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  

| Param | Type |
| --- | --- |
| [val] | <code>function</code> | 

<a name="module_scatterplot+radius"></a>
### scatterplot.radius ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get a radius value or a scale function that accepts a
data value and returns a radius size.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  

| Param | Type |
| --- | --- |
| [val] | <code>function</code> &#124; <code>Number</code> | 

<a name="module_scatterplot+rSquare"></a>
### scatterplot.rSquare ⇒ <code>float</code>
Return the R squared value determined by the linear regression function.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  
<a name="module_scatterplot+correlation"></a>
### scatterplot.correlation ⇒ <code>float</code>
Return the correlation value determined by the linear regression function.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  
<a name="module_scatterplot+covariance"></a>
### scatterplot.covariance ⇒ <code>float</code>
Return the covariance value determined by the linear regression function.

**Kind**: instance property of <code>[scatterplot](#module_scatterplot)</code>  
<a name="module_scatterplot+render"></a>
### scatterplot.render() ⇒ <code>scatterplot</code>
Draw the chart after parameters have been set.

**Kind**: instance method of <code>[scatterplot](#module_scatterplot)</code>  
<a name="module_scatterplot+redraw"></a>
### scatterplot.redraw() ⇒ <code>scatterplot</code>
Redraw and transform the chart after parameter changes.

**Kind**: instance method of <code>[scatterplot](#module_scatterplot)</code>  
