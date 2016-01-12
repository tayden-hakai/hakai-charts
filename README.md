## Modules

<dl>
<dt><a href="#hakaiCharts.module_scatterplot">scatterplot</a> ⇒ <code>object</code></dt>
<dd><p>A reusable d3 scatterplot generator</p>
</dd>
</dl>

## Objects

<dl>
<dt><a href="#hakaiCharts">hakaiCharts</a> : <code>object</code></dt>
<dd></dd>
</dl>

<a name="hakaiCharts.module_scatterplot"></a>
## scatterplot ⇒ <code>object</code>
A reusable d3 scatterplot generator

**Returns**: <code>object</code> - scatterplot chart  
**Author:** Taylor Denouden  

| Param | Type | Description |
| --- | --- | --- |
| parent | <code>String</code> &#124; <code>DOM_node</code> | A DOM element to append the chart to |

**Example**  
```js
[example](./examples/scatterplot_example.html)
```

* [scatterplot](#hakaiCharts.module_scatterplot) ⇒ <code>object</code>
    * [.width](#hakaiCharts.module_scatterplot+width) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.height](#hakaiCharts.module_scatterplot+height) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.margin](#hakaiCharts.module_scatterplot+margin) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.data](#hakaiCharts.module_scatterplot+data) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.xAccessor](#hakaiCharts.module_scatterplot+xAccessor) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.yAccessor](#hakaiCharts.module_scatterplot+yAccessor) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.xLabel](#hakaiCharts.module_scatterplot+xLabel) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.yLabel](#hakaiCharts.module_scatterplot+yLabel) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.xLog](#hakaiCharts.module_scatterplot+xLog) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.yLog](#hakaiCharts.module_scatterplot+yLog) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.color](#hakaiCharts.module_scatterplot+color) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.colorAccessor](#hakaiCharts.module_scatterplot+colorAccessor) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.keyAccessor](#hakaiCharts.module_scatterplot+keyAccessor) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.radius](#hakaiCharts.module_scatterplot+radius) ⇒ <code>int</code> &#124; <code>scatterplot</code>
    * [.rSquared](#hakaiCharts.module_scatterplot+rSquared) ⇒ <code>float</code>
    * [.correlation](#hakaiCharts.module_scatterplot+correlation) ⇒ <code>float</code>
    * [.covariance](#hakaiCharts.module_scatterplot+covariance) ⇒ <code>float</code>
    * [.render()](#hakaiCharts.module_scatterplot+render) ⇒ <code>scatterplot</code>
    * [.redraw()](#hakaiCharts.module_scatterplot+redraw) ⇒ <code>scatterplot</code>

<a name="hakaiCharts.module_scatterplot+width"></a>
### scatterplot.width ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get the width attribute of a chart.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  

| Param | Type | Description |
| --- | --- | --- |
| [val] | <code>int</code> | The chart width |

<a name="hakaiCharts.module_scatterplot+height"></a>
### scatterplot.height ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get the height attribute of a chart.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  

| Param | Type | Description |
| --- | --- | --- |
| [val] | <code>int</code> | The chart height |

<a name="hakaiCharts.module_scatterplot+margin"></a>
### scatterplot.margin ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get the margin attribute of a chart.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  

| Param | Type | Description |
| --- | --- | --- |
| [val] | <code>int</code> | The chart margins in format {top: 5, left: 5, right: 10, bottom: 15} |

<a name="hakaiCharts.module_scatterplot+data"></a>
### scatterplot.data ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get the data that accessor functions refer to.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  

| Param | Type | Description |
| --- | --- | --- |
| [val] | <code>int</code> | The data being accessed by all accessor functions |

<a name="hakaiCharts.module_scatterplot+xAccessor"></a>
### scatterplot.xAccessor ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get a function used to access the data shown on the x axis.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  

| Param | Type | Description |
| --- | --- | --- |
| [val] | <code>function</code> &#124; <code>Number</code> | The x axis data accessor function |

<a name="hakaiCharts.module_scatterplot+yAccessor"></a>
### scatterplot.yAccessor ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get a function used to access the data shown on the y axis.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  

| Param | Type | Description |
| --- | --- | --- |
| [val] | <code>function</code> &#124; <code>Number</code> | The y axis data accessor function |

<a name="hakaiCharts.module_scatterplot+xLabel"></a>
### scatterplot.xLabel ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get the x axis label.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  

| Param | Type | Description |
| --- | --- | --- |
| [val] | <code>String</code> | The x label |

<a name="hakaiCharts.module_scatterplot+yLabel"></a>
### scatterplot.yLabel ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get the y axis label.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  

| Param | Type | Description |
| --- | --- | --- |
| [val] | <code>String</code> | The y label |

<a name="hakaiCharts.module_scatterplot+xLog"></a>
### scatterplot.xLog ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get whether the x axis scale should be log transformed.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [val] | <code>Boolean</code> | <code>false</code> | Flag to transform x axis |

<a name="hakaiCharts.module_scatterplot+yLog"></a>
### scatterplot.yLog ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get whether the y axis scale should be log transformed.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [val] | <code>Boolean</code> | <code>false</code> | Flag to transform y axis |

<a name="hakaiCharts.module_scatterplot+color"></a>
### scatterplot.color ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get a scale function that accepts a data value and returns a color.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [val] | <code>function</code> | <code>d3.scale.category10()</code> | The color scale function |

<a name="hakaiCharts.module_scatterplot+colorAccessor"></a>
### scatterplot.colorAccessor ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get a function used to access the data and pass the value to the color function.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [val] | <code>function</code> | <code>function(){ return 0; }</code> | The colorAccessor function |

<a name="hakaiCharts.module_scatterplot+keyAccessor"></a>
### scatterplot.keyAccessor ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get a function used to determine which points shown are the same datum.
Allows for mark translation on redraw.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [val] | <code>function</code> | <code>function(d){ return d.key; }</code> | The keyAccessor function |

<a name="hakaiCharts.module_scatterplot+radius"></a>
### scatterplot.radius ⇒ <code>int</code> &#124; <code>scatterplot</code>
Set or get a radius value or a scale function that accepts a
data value and returns a radius size.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [val] | <code>Number</code> | <code>5</code> | The radius in px |

<a name="hakaiCharts.module_scatterplot+rSquared"></a>
### scatterplot.rSquared ⇒ <code>float</code>
Return the R squared value determined by the linear regression function.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  
<a name="hakaiCharts.module_scatterplot+correlation"></a>
### scatterplot.correlation ⇒ <code>float</code>
Return the correlation value determined by the linear regression function.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  
<a name="hakaiCharts.module_scatterplot+covariance"></a>
### scatterplot.covariance ⇒ <code>float</code>
Return the covariance value determined by the linear regression function.

**Kind**: instance property of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  
<a name="hakaiCharts.module_scatterplot+render"></a>
### scatterplot.render() ⇒ <code>scatterplot</code>
Draw the chart after parameters have been set.

**Kind**: instance method of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  
<a name="hakaiCharts.module_scatterplot+redraw"></a>
### scatterplot.redraw() ⇒ <code>scatterplot</code>
Redraw and transform the chart after parameter changes.

**Kind**: instance method of <code>[scatterplot](#hakaiCharts.module_scatterplot)</code>  
<a name="hakaiCharts"></a>
## hakaiCharts : <code>object</code>
**Kind**: global namespace  
