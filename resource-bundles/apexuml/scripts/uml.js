// Load the UML Canvas JS Library
var UMLCANVAS_VERSION = 'Development';
//var scripts = [ 
//    "/scripts/umlcanvas/lib/Canvas2D.standalone.js",
//    "/scripts/umlcanvas/DepCheck.js",
//    "/scripts/umlcanvas/UmlCanvas.js",
//    "/scripts/umlcanvas/Common.js",
//    "/scripts/umlcanvas/Manager.js",
//    "/scripts/umlcanvas/Model.js",
//    "/scripts/umlcanvas/Diagram.js",
//    "/scripts/umlcanvas/Class.js",
//    "/scripts/umlcanvas/Attribute.js",
//    "/scripts/umlcanvas/Operation.js",
//    "/scripts/umlcanvas/Parameter.js",
//    "/scripts/umlcanvas/ConnectorHeads.js",
//    "/scripts/umlcanvas/Association.js",
//    "/scripts/umlcanvas/Role.js",
//    "/scripts/umlcanvas/Dependency.js",
//    "/scripts/umlcanvas/ClientSupplier.js",
//    "/scripts/umlcanvas/Interface.js",
//    "/scripts/umlcanvas/Inheritance.js",
//    "/scripts/umlcanvas/Realization.js",
//    "/scripts/umlcanvas/Enumeration.js",
//    "/scripts/umlcanvas/Note.js",
//    "/scripts/umlcanvas/NoteLink.js",
//    "/scripts/umlcanvas/StateDiagrams.js",
//    "/scripts/umlcanvas/Widget.js",
//    "/scripts/umlcanvas/KickStart.js",
//    "/scripts/umlcanvas/PluginManagerRepository.js",
//    "/scripts/umlcanvas/Defaults.js",
//    "/scripts/umlcanvas/Config.js"
//];
//
//for( var i=0; i<scripts.length; i++ )
//	document.writeln( "<script type=\"text/javascript\" src=\"" + scripts[i] + "\"></script>" );

// Define the client side app that drives the comms to the server
//var ApexNavigator = {
//
//	// ContainerAsyncRequest
//	asyncResult : null,
//	
//	// Apex Class being compiled in the MetadataContainer
//	asyncApexClassName : null, 
//	
//	// Client timer Id used to poll 
//	intervalId : null,
//
//	// Diagram
//	diagram : null, 
//	
//	load : function() {
//		// Initialise UmlCanvas
//        var manager = new UmlCanvas.Manager();
//        var model = manager.setupModel("myModel");
//	  	ApexNavigator.diagram = model.addDiagram();
//        ApexNavigator.diagram.makeDynamic();		
//        manager.startAll();
//	},
// 	
// 	select : function(apexClassName) {
// 		// Apex class being rendered on canvas
//		ApexNavigator.asyncClassName = apexClassName;
// 		// Selected?
// 		var selectedCheckbox = $('#'+ApexNavigator.asyncClassName);
// 		var selected = selectedCheckbox.prop('checked');
// 		// Retrieve symbol table for selected class and add to canvas
// 		if(selected)
// 		{		
// 			// Already have it?
// 			if(ApexNavigator.diagram.getDiagramClass(ApexNavigator.asyncClassName)!=null)
// 				return; 
// 			// Disable checkboxes
// 			$("#classlist :input").attr("disabled", true);
// 			// Start Compile
//			$.ajax({	  				
//                type: 'GET',
//                url: 'umlcanvas/apexclass/' + ApexNavigator.asyncClassName + '/compile',
//                contentType : 'application/json; charset=utf-8',		                
//                dataType : 'json',
//                success: function(data, textStatus, jqXHR) {
//                    ApexNavigator.asyncResult = data;
//                    if(ApexNavigator.asyncResult.state == 'Completed')
//						ApexNavigator.updateRelationships();
//                    else if(ApexNavigator.asyncResult.state == 'Queued')
//                    	ApexNavigator.intervalId = window.setInterval(ApexNavigator.checkAsync, 2000);
//                    else
//                    	alert(ApexNavigator.asyncResult.state + ApexNavigator.asyncResult.compilerErrors);
//                },
//                error: function(jqXHR, textStatus, errorThrown) {
//                	// Report errors with the compile request
//                	alert(textStatus + errorThrown);
//		 			// Re-enable checkboxes
//		 			$("#classlist :input").attr("disabled", false);                	
//                }
//			});
// 			// Retrieve Symbol Table		
//			$.ajax({
//                type: 'GET',
//                url: 'umlcanvas/apexclass/' + ApexNavigator.asyncClassName + '/symboltable',
//                contentType : 'application/json; charset=utf-8',
//                dataType : 'json',
//                success: function(data, textStatus, jqXHR) {
//                	// Construct UML class
//					var apexClass = new UmlCanvas.Class( { name: data.name } );
//					// Add methods
//					for(var i = 0; i < data.methods.length; i++)
//					{
//						var method = data.methods[i];
//						// Only public methods
//						if(method.visibility!='PUBLIC' && method.visibility!='GLOBAL')
//							continue;
//						// Operation
//						var operation = { 
//							visibility: "public",
//							name: method.name,
//							arguments: [],
//					    	returnType : method.returnType  };
//						// Parameters?
//						for(var a = 0; a < method.parameters.length; a++)
//						    operation.arguments.push({
//						    		name : method.parameters[a].name,
//						    		type : method.parameters[a].type + ' ' + method.parameters[a].name
//						    	});
//						// Add operation
//					    apexClass.addOperation( operation );
//					}
//					// Add Attributes 
//					for(var i = 0; i < data.properties.length; i++)
//					{
//						var property = data.properties[i];
//						// Only public methods
//						if(property.visibility!='PUBLIC' && property.visibility!='GLOBAL')
//							continue;
//						// Add attribute
//					    apexClass.addAttribute( 
//					    	{ visibility: "public", 
//					    	  name: property.name, 
//							  type: property.type } );								
//					}
//					// Place it on the canvas		 
//	   				ApexNavigator.diagram.at(50,50).put(apexClass);		                
//                },
//                error: function(jqXHR, textStatus, errorThrown) {
//                	// Report errors with the symbol table request
//                	alert(textStatus + errorThrown);
//		 			// Re-enable checkboxes
//		 			$("#classlist :input").attr("disabled", false);
//                }
//			});
//		}
//		else
//		{
//			// Inform the user the its not presently possible to remove items from the canvas and reselect the checkbox
//			alert('Currently it is not possible to remove items from the canvas.')
// 			selectedCheckbox.attr('checked', 'true');			
//		}							
// 	},
// 	
// 	checkAsync : function() {
// 		// Check status of Async Compile request if complete render relationships
//		$.ajax({
//            type: 'GET',
//            url: 'umlcanvas/containerasyncrequest/' + ApexNavigator.asyncResult.id,
//            contentType : 'application/json; charset=utf-8',
//            dataType : 'json',
//            success: function(data, textStatus, jqXHR) {
//                ApexNavigator.asyncResult = data;
//                // Continue to wait?
//                if(ApexNavigator.asyncResult.state == 'Queued')
//                	return;
//                // Stop the timer
//                window.clearInterval(ApexNavigator.intervalId);                
//                if(ApexNavigator.asyncResult.state == 'Completed')
//					ApexNavigator.renderRelationships();
//				else
//					alert(ApexNavigator.asyncResult.state + ApexNavigator.asyncResult.compilerErrors);
//				// Clear aysnc state
//                ApexNavigator.asyncResult = null;
//	 			// Re-enable checkboxes
//	 			$("#classlist :input").attr("disabled", false);                
//            },
//            error: function(jqXHR, textStatus, errorThrown) {
//            	// Stop the timer, clear async state and report errors with the check async request
//                window.clearInterval(ApexNavigator.intervalId);
//                ApexNavigator.asyncResult = null;
//            	alert(textStatus + errorThrown);
//	 			// Re-enable checkboxes
//	 			$("#classlist :input").attr("disabled", false);            	
//            }
//		});			
// 	},		 	
// 	
// 	renderRelationships : function() {
// 		// Retrieve Symbol Table following compilation (includes external references)
//		$.ajax({
//            type: 'GET',
//            url: 'umlcanvas/containerasyncrequest/' + 
//            	 ApexNavigator.asyncResult.metadataContainerId + '/' +
//            	 ApexNavigator.asyncClassName + '/symboltable',
//            contentType : 'application/json; charset=utf-8',
//            dataType : 'json',
//            success: function(data, textStatus, jqXHR) {
//            	// Store this SymbolTable against the class
//            	var umlClass = ApexNavigator.diagram.getDiagramClass(ApexNavigator.asyncClassName);
//            	umlClass.symbolTable = data;
//            	// Iterate over the classes in the canvas and render any dependency relationships
//            	for(var shapeName in ApexNavigator.diagram.shapesMap)
//            	{
//            		var fromClass = ApexNavigator.diagram.getDiagramClass(shapeName);
//            		if(fromClass instanceof UmlCanvas.Class)
//            		{
//						for(var i = 0; i < fromClass.symbolTable.externalReferences.length; i++)
//						{	              
//							var externalReference = fromClass.symbolTable.externalReferences[i];
//	                		var toClass = ApexNavigator.diagram.getDiagramClass(externalReference.name);
//	                		if(toClass == null)
//	                			continue;	            			                			
//					        var association = 
//					        	new UmlCanvas.Realization(
//					        		{ from: toClass,
//					        		  to: fromClass, 
//	                                  kind: "association",
//	                                  name: toClass.name+'#'+fromClass.name, 
//	                                  routing: 'vertical',
//	                                  lineWidth: 2,
//	                                  labelFont: '10pt Arial,Helvetica,sans-serif',
//	                                  navigability: 'destination' } );	
//	                        association.centerLabel = '<<use>>';		                			    		
//					        ApexNavigator.diagram.put(association);	                		
//	                	}
//	                }
//            	}	                	
//	 			// Re-enable checkboxes
//	 			$("#classlist :input").attr("disabled", false);
//            },
//            error: function(jqXHR, textStatus, errorThrown) {
//            	// Report errors with the symbol table request
//            	alert(textStatus + errorThrown);
//	 			// Re-enable checkboxes
//	 			$("#classlist :input").attr("disabled", false);
//            }
//		});			
// 	}		 	
// 	
//}  
//