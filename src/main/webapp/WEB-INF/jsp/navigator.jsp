<%@taglib uri="http://www.springframework.org/tags" prefix="spring"%>
<%@taglib uri="http://www.springframework.org/tags/form" prefix="form"%>
<%@taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<html>
<head>
	<link rel="stylesheet" type="text/css" href="/css/js-mindmap.css" />
	<script type="text/javascript" src="/scripts/jquery.min.js"></script>
  	<script type="text/javascript" src="/scripts/jquery-ui.min.js"></script>
	<script type="text/javascript" src="/scripts/raphael-min.js"></script>
	<script type="text/javascript" src="/scripts/js-mindmap.js"></script>
	<style>
		body {
		  background:white;
		}
		.js-mindmap-active a.node {
		  background:lightblue;
		  border: 2px solid grey;
		  -webkit-border-top-left-radius: 20px;
		  -webkit-border-bottom-right-radius: 20px;
		  -moz-border-radius-topleft: 20px;
		  -moz-border-radius-bottomright: 20px;
		  border-top-left-radius: 20px;
		  border-bottom-right-radius: 20px;  
		}
		.js-mindmap-active a.node.active {
		  padding:5px 10px !important;
		  border-width:5px !important;
		}
		.js-mindmap-active a.node.activeparent {
		  padding:5px 10px !important;
		  border-width:5px !important;
		  background:#0099FF;
		}	
	</style>
	<script>
		var ApexNavigator = {
		
			// ContainerAsyncRequest
			asyncResult : null,
			
			// Client timer Id used to poll 
			intervalId : null,
			
			// Root node
			root : null,
			
			load : function() {
				// Handle Apex class selection by the user
				$('#classes').change(function() { ApexNavigator.select(); });		 			 	
				// Enable the mindmap
				$('body').mindmap({
					mapArea: {
				        x: 800,
				        y: 600}
	      			});	
				// Start a compile
				ApexNavigator.compile();		
			},
		 
		 	compile : function() {
		 		// Show 'Compiling....' in the drop down list
		 		$('#classes option').remove();
		 		$('#classes').attr('disabled', 'disabled');
			    $('#classes').append(new Option('Compiling...', 'Compiling...'));
		 		// Make a compile request to server store ContainterAsyncRequest and setInternal to pol
  				$.ajax({
	                type: 'GET',
	                url: window.location + '/compile',
	                contentType : 'application/json; charset=utf-8',
	                dataType : 'json',
	                success: function(data, textStatus, jqXHR) {
	                    ApexNavigator.asyncResult = data;
	                    if(ApexNavigator.asyncResult.state == 'Completed')
							ApexNavigator.list();
	                    else
	                    	ApexNavigator.intervalId = window.setInterval(ApexNavigator.checkAsync, 2000);
	                },
	                error: function(jqXHR, textStatus, errorThrown) {
	                	alert(textStatus + errorThrown);
	                }
				});			
		 	},
		 	
		 	checkAsync : function() {
		 		// Check status of async compile request if complete call list
  				$.ajax({
	                type: 'GET',
	                url: window.location + '/containerasyncrequest/' + ApexNavigator.asyncResult.id,
	                contentType : 'application/json; charset=utf-8',
	                dataType : 'json',
	                success: function(data, textStatus, jqXHR) {
	                    ApexNavigator.asyncResult = data;
	                    if(ApexNavigator.asyncResult.state == 'Completed')
	                    {
	                    	window.clearInterval(ApexNavigator.intervalId);
							ApexNavigator.list();
						}
	                },
	                error: function(jqXHR, textStatus, errorThrown) {
	                	alert(textStatus + errorThrown);
	                }
				});			
		 	},
		 	
		 	list : function() {
		 		// Retrieve list of classes compiled and update drop down list
  				$.ajax({
	                type: 'GET',
	                url: window.location + '/containerasyncrequest/' + ApexNavigator.asyncResult.metadataContainerId + '/apexclassmembers',
	                contentType : 'application/json; charset=utf-8',
	                dataType : 'json',
	                success: function(data, textStatus, jqXHR) {
				 		$('#classes option').remove();
				 		$.each(data, function(i) {
				 			$('#classes').append(new Option(data[i].contentEntity.name, data[i].contentEntity.name)); });
				 		$('#classes').attr('disabled', null);
	                },
	                error: function(jqXHR, textStatus, errorThrown) {
	                	alert(textStatus + errorThrown);
	                }
				});			
		 	},
		 	
		 	select : function() {
		 		// Retrieve symbol table for selected class and render map
		 		var apexClassName = $('#classes option:selected').text();
  				$.ajax({
	                type: 'GET',
	                url: window.location + '/containerasyncrequest/' + 
	                	 ApexNavigator.asyncResult.metadataContainerId + '/' +
	                	 apexClassName + '/symboltable',
	                contentType : 'application/json; charset=utf-8',
	                dataType : 'json',
	                success: function(data, textStatus, jqXHR) {
				 		if(ApexNavigator.root!=null)
				 			ApexNavigator.root.removeNode(); 
	                	ApexNavigator.root = $('body').addRootNode(data.name, { });
	                	for(var i = 0; i < data.externalReferences.length; i++)
	                		$('body').addNode(ApexNavigator.root, data.externalReferences[i].name, 
	                			{
	                				onclick:function(node) { ApexNavigator.expand(node); } 
	                			});
	                },
	                error: function(jqXHR, textStatus, errorThrown) {
	                	alert(textStatus + errorThrown);
	                }
				});			
		 	},		 	
		 			 	
			expand : function(node) {
				// Already got children?
				if(node.children!=null && node.children.length>0)
					return;
				// Render any external references for the node clicked 
				ApexNavigator.clickedNode = node;
  				$.ajax({
	                type: 'GET',
	                url: window.location + '/containerasyncrequest/' + 
	                	 ApexNavigator.asyncResult.metadataContainerId + '/' +
	                	 node.name + '/symboltable',
	                contentType : 'application/json; charset=utf-8',
	                dataType : 'json',
	                success: function(data, textStatus, jqXHR) {
	                	for(var i = 0; i < data.externalReferences.length; i++)
	                		$('body').addNode(ApexNavigator.clickedNode, data.externalReferences[i].name, 
	                			{
	                				onclick:function(node) { ApexNavigator.expand(node); } 
	                			});
	                },
	                error: function(jqXHR, textStatus, errorThrown) {
	                	alert(textStatus + errorThrown);
	                }
				});							
			}
		}  
				
		// Start compiling the classes on page load
		$(document).ready(function() { ApexNavigator.load(); });		
	</script>
</head>
<body>
	<select id="classes"/>
</body>
<html>