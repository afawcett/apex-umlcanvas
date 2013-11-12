<%@taglib uri="http://www.springframework.org/tags" prefix="spring"%>
<%@taglib uri="http://www.springframework.org/tags/form" prefix="form"%>
<%@taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<!DOCTYPE html>
<html>
<head>
	<script type="text/javascript" src="/scripts/jquery.min.js"></script>
  	<script type="text/javascript" src="/scripts/jquery-ui.min.js"></script>
	<script type="text/javascript" src="/scripts/umlcanvas.js"></script>
	<script>				
		// Start compiling the classes on page load
		$(document).ready(function() { ApexNavigator.load(); });		
	</script>
	<style>
		ul {
			list-style:none; 
			margin: 0px;
			padding: 4px;
		}
		ul li {
			list-style:none; 
			margin: 0px;
			padding: 0px;
		}
	</style>
</head>
<body style="paddin:0px; margin:0px; font-size:75%; font-family:Arial,Helvetica,sans-serif">
	<table>
		<tr>
			<td valign="top" style="white-space:nowrap; border-right:1px solid lightgrey">
			<ul>
				<c:forEach items="${apexclasses}" var="className">
				<li><input id="${className}" type="checkbox" onclick="ApexNavigator.select('${className}');"/><label for="${className}">${className}</label></li>
				</c:forEach>
			</ul>
			</td>
			<td style="border-left:1px solid lightgrey">
    		<canvas id="myModel" width="2000" height="2000" style="background-image: url('/images/grid.png');"></canvas>
    		</td>
    	</tr>
    </table>
</body>
<html>