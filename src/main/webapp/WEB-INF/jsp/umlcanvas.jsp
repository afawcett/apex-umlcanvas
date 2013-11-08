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
		var ApexNavigator = {
		
			// ContainerAsyncRequest
			asyncResult : null,
			
			// Apex Class being compiled in the MetadataContainer
			asyncApexClassName : null, 
			
			// Client timer Id used to poll 
			intervalId : null,
		
			// Diagram
			diagram : null, 
			
			load : function() {
				// Initialise UmlCanvas
		        var manager = new UmlCanvas.Manager();
		        var model = manager.setupModel("myModel");
			  	ApexNavigator.diagram = model.addDiagram();
		        ApexNavigator.diagram.makeDynamic();		
		        manager.startAll();
			},
		 	
		 	select : function(apexClassName) {
		 		// Apex class being rendered on canvas
				ApexNavigator.asyncClassName = apexClassName;
		 		// Selected?
		 		var selected = $('#'+ApexNavigator.asyncClassName).prop('checked');
		 		// Retrieve symbol table for selected class and add to canvas
		 		if(selected)
		 		{		 
		 			// Already have it?
		 			if(ApexNavigator.diagram.getDiagramClass(ApexNavigator.asyncClassName)!=null)
		 				return; 
		 			// TODO: Disable checkboxes
		 			// ...
		 			// Start Compile
	  				$.ajax({	  				
		                type: 'GET',
		                url: window.location + '/apexclass/' + ApexNavigator.asyncClassName + '/compile',
		                contentType : 'application/json; charset=utf-8',		                
		                dataType : 'json',
		                success: function(data, textStatus, jqXHR) {
		                    ApexNavigator.asyncResult = data;
		                    if(ApexNavigator.asyncResult.state == 'Completed')
								ApexNavigator.updateRelationships();
		                    else
		                    	ApexNavigator.intervalId = window.setInterval(ApexNavigator.checkAsync, 2000);
		                },
		                error: function(jqXHR, textStatus, errorThrown) {
		                	alert(textStatus + errorThrown);
		                }
					});
		 			// Retrieve Symbol Table		
	  				$.ajax({
		                type: 'GET',
		                url: window.location + '/apexclass/' + ApexNavigator.asyncClassName + '/symboltable',
		                contentType : 'application/json; charset=utf-8',
		                dataType : 'json',
		                success: function(data, textStatus, jqXHR) {
		                	// Construct UML class
							var apexClass = new UmlCanvas.Class( { name: data.name } );
							// Add methods
							for(var i = 0; i < data.methods.length; i++)
							{
								var method = data.methods[i];
								// Only public methods
								if(method.visibility!='PUBLIC' && method.visibility!='GLOBAL')
									continue;
								// Operation
								var operation = { 
									visibility: "public",
									name: method.name,
									arguments: [],
							    	returnType : method.returnType  };
								// Parameters?
								for(var a = 0; a < method.parameters.length; a++)
								    operation.arguments.push({
								    		name : method.parameters[a].name,
								    		type : method.parameters[a].type + ' ' + method.parameters[a].name
								    	});
								// Add operation
							    apexClass.addOperation( operation );
							}
							// Add Attributes 
							for(var i = 0; i < data.properties.length; i++)
							{
								var property = data.properties[i];
								// Only public methods
								if(property.visibility!='PUBLIC' && property.visibility!='GLOBAL')
									continue;
								// Add attribute
							    apexClass.addAttribute( 
							    	{ visibility: "public", 
							    	  name: property.name, 
									  type: property.type } );								
							}
							// Place it on the canvas		 
			   				ApexNavigator.diagram.at(50,50).put(apexClass);		                
		                },
		                error: function(jqXHR, textStatus, errorThrown) {
		                	alert(textStatus + errorThrown);
		                }
					});
				}
				else
				{
					// TODO: Figure out how to remove
					// ...
				}							
		 	},
		 	
		 	checkAsync : function() {
		 		// Check status of Async Compile request if complete render relationships
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
							ApexNavigator.renderRelationships();
						}
	                },
	                error: function(jqXHR, textStatus, errorThrown) {
	                	alert(textStatus + errorThrown);
	                }
				});			
		 	},		 	
		 	
		 	renderRelationships : function() {
		 		// Retrieve Symbol Table following compilation (includes external references)
  				$.ajax({
	                type: 'GET',
	                url: window.location + '/containerasyncrequest/' + 
	                	 ApexNavigator.asyncResult.metadataContainerId + '/' +
	                	 ApexNavigator.asyncClassName + '/symboltable',
	                contentType : 'application/json; charset=utf-8',
	                dataType : 'json',
	                success: function(data, textStatus, jqXHR) {
	                	// Store this SymbolTable against the class
	                	var umlClass = ApexNavigator.diagram.getDiagramClass(ApexNavigator.asyncClassName);
	                	umlClass.symbolTable = data;
	                	// Iterate over the classes in the canvas and render any dependency relationships
	                	for(var shapeName in ApexNavigator.diagram.shapesMap)
	                	{
	                		var fromClass = ApexNavigator.diagram.getDiagramClass(shapeName);
	                		if(fromClass instanceof UmlCanvas.Class)
	                		{
								for(var i = 0; i < fromClass.symbolTable.externalReferences.length; i++)
								{	              
									var externalReference = fromClass.symbolTable.externalReferences[i];
			                		var toClass = ApexNavigator.diagram.getDiagramClass(externalReference.name);
			                		if(toClass == null)
			                			continue;	            			                			
							        var association = 
							        	new UmlCanvas.Realization(
							        		{ from: toClass,
							        		  to: fromClass, 
			                                  kind: "association",
			                                  name: toClass.name+'#'+fromClass.name, 
			                                  routing: 'vertical',
			                                  lineWidth: 2,
			                                  labelFont: '10pt Arial,Helvetica,sans-serif',
			                                  navigability: 'destination' } );	
			                        association.centerLabel = '<<use>>';		                			    		
							        ApexNavigator.diagram.put(association);	                		
			                	}
			                }
	                	}	                	
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