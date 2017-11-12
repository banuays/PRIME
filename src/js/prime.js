/**
 * bpmn-js-seed - async
 *
 * This is an example script that loads a bpmn diagram <diagram.bpmn> and opens
 * it using the bpmn-js viewer.
 *
 * YOU NEED TO SERVE THIS FOLDER VIA A WEB SERVER (i.e. Apache) FOR THE EXAMPLE TO WORK.
 * The reason for this is that most modern web browsers do not allow AJAX requests ($.get and the like)
 * of file system resources.
 */
var $ = require('jquery');
var BpmnViewer = require('bpmn-js'),

    //EmbeddedComments = require('bpmn-js-embedded-comments'),
    ZoomScroll = require('diagram-js/lib/navigation/zoomscroll'),
    MoveCanvas = require('diagram-js/lib/navigation/movecanvas');
var viewer = new BpmnViewer({                
            container: '#canvas',
            additionalModules: [
                //EmbeddedComments,
                ZoomScroll,
                MoveCanvas
            ]});
var is = require('bpmn-js/lib/util/ModelUtil').is;
var modelingModule = require('bpmn-js/lib/features/modeling');

//Global variables
var eventBus, event;
var loopCount=0;
var timerCoef=250;             //adjust the pace
var isStepAnimSelected=false;//if stepwise or cont animation selected
var isSelAnimSelected=false;
var isJustFollowNext=false;  //if only the following node needs to be clicked in stepwise anim
var nodetobeClicked=[]; //list of nodes that need to be clicked

//filters
var isRoleBasedAnimSelected=false;
var roleIdtobeAnimated;
var isCurObjInSelectedLane=false;
var isRandomFlowSelected=false;

var isPathSelected=false;
var isMultipleStartEvents=false;  //if there are multiple start events, user needs to select one
var selectedSeqFlowPathNum;
var selectedElementId;            //the id of the clicked element 
var seqFlowstobeClicked=[         //when the flow comes to an XOR diverging, the list of flows that user needs to clicj
    /*relatedXOR: id, 
    seqFlowId: id*/
];
var andGatewaysMerged=[           //list of converging parallel gateways. Keep track to wait all incoming at these points
    /*convAnd: id, 
    incSeqFlowId: id, 
    didFlowMerge: boolean*/
];
var gatewayCombination = [
    /*var divGatewayID, 
    var convGatewayID*/
];
var allObjects = [
    /*id,
    isPassed */
];

var lanes = [                       //list of lanes 
    /*laneId: element.id,
    laneSize:element.width,
    laneName: name*/
];
var startEvents=[/*element*/];
var numOfRepeats = 0;//how many times did the animation reach an end event 
var timeoutsArray=[];
var particId;
//specific variables for Exp2 (not necessary for the web page)
var processName; //name of the process used (for the experiment)
var appType; //type of the application to customize the file-web page, experiment etc. 
var numofPrcDTaskDEnabled=0;
var numofPrcDTaskEEnabled=0;
var numofPrcDTaskGEnabled=0;
var numofPrcDTaskHEnabled=0;
var numofPrcDTaskHExecuted=0;
var numofPrcDTaskFEnabled=0;
var numofPrcDTaskNEnabled=0;
var numofPrcDUpperANDHEnabled=0;
var numofPrcDLowerANDHEnabled=0;
var numofPrcDANDHEnabled=0;
var isSeqFlowClickedAfterHExecutedOnce=false;
//---------
var prcTLTaskMExecuted = false;
var prcTLTaskNExecuted = false;
var prcTLConvOrEnabled = false;
var prcTLConvOrExecuted = false;
//---------
var prcLTaskAExecuted = false;
var prcLTaskBExecuted = false;
var prcLConvOrEnabled = false;
var prcLConvOrExecuted = false;
//----------
//following part is necessary for inner OR
var prcTLOTaskJExecuted = false;
var prcTLOTaskKExecuted = false;
var prcTLOTaskLExecuted = false;
var prcTLOInnerConvOrEnabled = false;
var prcTLOInnerConvOrExecuted = false;
//the rest of all is necessary for outer big OR
var prcTLOTaskAExecuted=false;
var prcTLOTaskGExecuted=false;
var prcTLOTaskIExecuted=false;
var prcTLOTaskFExecuted=false;
var prcTLOOuterConvORLowerSeqExecuted=false;
var prcTLOdidLowerPathReachOuterConvOr=false;
//-------------
var numofPrcTLMTaskFEnabled=0;
//------------
var numofprcXTaskBEnabled = 0;
var numofprcXTaskCEnabled = 0;
var numofprcXTaskDEnabled = 0;
var numofprcXTaskEEnabled = 0;
var numofprcXTaskFEnabled = 0;
var numofprcXTaskGEnabled = 0;
var numofprcXTaskHEnabled = 0;
var numofprcXTaskIEnabled = 0;
var numofprcXTaskJEnabled = 0;
var numofprcXTaskNEnabled = 0;
//---------------
var numofPrcXFirstUpperXOREnabled = 0;
var numofPrcXTUpperRightConvXORTraced = 0;
var isSeqFlowClickedAfterDivXORExecutedOnceX = false;
//---------------
var prcR1LowerConvANDLeftPathPassed=false;
var prcR1LowerConvANDUpPathPassed=false;
var prcR1UpperConvANDLeftPathPassed=false;
var prcR1UpperConvANDUpPathPassed=false;
//----------------
var numofPrcRMTaskKEnabled = 0;
var numofPrcRMANDNEnabled = 0;
var numofPrcRMLowerANDNEnabled = 0;
var numofPrcRMUpperANDNEnabled = 0;
//OR part
var prcRMTaskLExecuted = false;
var prcRMTaskMExecuted = false;
var prcRMConvOrEnabled = false;
var prcRMConvOrExecuted = false;
//------------
var numofPrcR2TaskLEnabled = 0;
var numofPrcR2TaskMEnabled = 0;
//-----------

// Import and open default xml diagram--------------------------------------------
//This function is called from the main code (just below the end of this function)
//-------------------------------------------------------------------------------
function openDiagram(diagram) {
    viewer.importXML(diagram, function(err) {
      if (!err) {
        resetAll();
		if(appType.indexOf('Exp2') != -1){
			$('[canvasVideoArea]').hide();
        	$('[canvasOverlayArea2]').hide();
		}
        //log('File loaded!');
        viewer.get('canvas').zoom('fit-viewport');
        //Get lanes so that we put lane names through the diagram
        elementRegistry = viewer.get('elementRegistry');
        //var lanes = [];
        lanes.length=0;
		if(appType.indexOf('Exp2') != -1){
	        if(processName.indexOf('Example') != -1){
	            markObjectAndSeqFlow('sid-0921901D-6469-454A-8325-BFEA0E946FDC', 'highlight', 'lime');
	            markObject('sid-5D8742BF-249D-4328-B7A3-A02F51DB0CBD', 'highlight');
	            markObjectAndSeqFlow('sid-6289F31F-FF9F-4459-AE82-9B41E2626AF9', 'highlight');
	            markSeqFlowwithGivenId('sid-B6B65CD4-70A9-49F9-8015-C4A877AC5351', 'lime');
	            markSeqFlowwithGivenId('sid-8FDAC441-FD5C-4CF7-9C7B-D3E786D55451', 'lime');
	            markObject('sid-E386A8F8-CC85-4391-AFE1-467C8D986A82', 'highlight-light');
	            markObject('sid-A08A7E8D-160E-429D-97FA-C557219714A8', 'highlight');
	            markSeqFlowwithGivenId('sid-62C0AC63-E902-4C88-BCCE-CA7C4E7E95AF', 'Magenta');
	            markSeqFlowwithGivenId('sid-D2081C7F-4755-4149-9BBD-07CA7EE02563', 'Magenta');
	            return;
	        }
		}
		if(appType.indexOf('PRIMEWeb') != -1){
			timerCoef = 800;
		}
        var elements = elementRegistry.filter(function(element) {
            if(is(element, 'bpmn:Lane')){
                var objToParse = element.businessObject;//Base
                var name = objToParse.name;
                lanes.push({
                    laneId: element.id,
                    laneSize:element.width,
                    laneName: name
                });
            }
        });
        //put overlays through a loop in every 400 px. Show each 400px on low zoom and the rest on high zoom
        var overlays = viewer.get('overlays');
        for(var k=0; k<lanes.length;k++){
          var overlayPosition=400;
            var name = lanes[k].laneName;//.replace(/\s+/g, '');
            var numOfRepeatsinLane=0;
            while(overlayPosition < lanes[k].laneSize){
                var minZoomV=0;
                if(numOfRepeatsinLane%4==0 || numOfRepeatsinLane%4==2){
                    minZoomV=1.2;
                }else if (numOfRepeatsinLane%4==1){
                    minZoomV=0.7;
                }
                overlays.add(lanes[k].laneId, {
                  position: {
                    top: 0,
                    left: overlayPosition
                  },
                    show: {
                    minZoom: minZoomV,
                    maxZoom: 5.0
                  },
                  html: '<div style="color:gray; font-style:italic; font-size:12px; white-space: nowrap">' + name + '</div>'
                });
                overlayPosition = overlayPosition + 400;
                numOfRepeatsinLane++;
            }
        }
        //Populate role list combobox
		if(appType.indexOf('PRIMEWeb') != -1){
        	populateRoleDropdown();
		}
        } else {
        //log('something went wrong:', err);
      }
        //create an event handler to get and log zoom level when mouse scroll is used
        if(appType.indexOf('PRIMEWeb') != -1){
			particId = processId();
		}
        document.getElementById("canvas").addEventListener("wheel", myFunction);
        function myFunction() {
            //mouse is scroleed
			if(appType.indexOf('Exp2') != -1){
	            //For Exp2: disable zoom, always fix at default zoom.
	            viewer.get('canvas').zoom('fit-viewport');
			}
            //logExp("zoomPrc1Anim "+ viewer.get('canvas').zoom(false), particId);
        }
		if(appType.indexOf('Exp2') != -1){
	        //Exp2: remove Overlay2, it will be shown after video finishes. 
	        $('[canvasOverlayArea2]').hide();
	        //Exp2: let's create an event handler to turn back to bpmn canvas when video is finished
	        var video = document.getElementsByTagName('video')[0];
	        video.onended = function(e){
	            particId = getVUID();//for Exp2. We use VUuser name as particId
	            $('[canvasVideoArea]').hide();
	            $('[canvasOverlayArea2]').show();
	            logExp("video ended "+processName, particId);
	            //Animation will start after approving the next overlay.
	            //isStepAnimSelected = true;
	            //initiateAnimation();
	        };
		}
        //event handlers for bpmn-io
        eventBus = viewer.get('eventBus');
        // you may hook into any of the following events
        events = [
          //'element.hover',
          //'element.out',
          'element.click',
          //'element.dblclick',
          //'element.mousedown',
          //'element.mouseup'
        ];
        events.forEach(function(event) {
          eventBus.on(event, function(e) {
              //we get here when there is a click on an element. We will perform relevant activities by checking the click
              console.log('clicked to item '+e.element.id);
            // e.element = the model element
            // e.gfx = the graphical element
            //the user can click to an element, a sequence flow, or the label of the seq.flow. So we check all of them. 
            if(e.element.type.indexOf('StartEvent') != -1 && isMultipleStartEvents == true){
                //when one of the start events is selected and there are more than one, start the animation
                if(appType.indexOf('PRIMEWeb') != -1){
					logExp(particId+" clickPrc1AnimStartEvent "+e.element.id, "WebLogger");
				}
                markObjectAndSeqFlow(e.element.id, 'highlight', 'lime');
                //after painting the selected start event green, paint others gray. 
                for(var m = 0; m <startEvents.length; m++){
                    if(startEvents[m].id !== e.element.id){
                        //console.log('not selected start event: '+startEvents[m].id);
                        viewer.get('canvas').removeMarker(startEvents[m].id, 'highlight-toselect');
                        markObject(startEvents[m].id, 'highlight-light');
                    }
                }
                isMultipleStartEvents = false;
                var currShape = elementRegistry.get(e.element.id);
                var currShapeType = currShape.type;//bpmn:StartEvent
                var objToParse = currShape.businessObject;//Base 
                if(objToParse.get('outgoing')[0] === undefined)
                    return;
                var seqFlow = objToParse.get('outgoing');
                var pathNum = seqFlow.length;
                if(pathNum == 1){
                    findNextObject(seqFlow[0]);
                }
            }//below, if the clicked is not a start event, we check if it is among the possible (pink) alternatives or the next step in stepwise.
            else{ //if(e.element.type.indexOf('SequenceFlow') != -1 || e.element.type.indexOf('label') != -1){//if the clicked is a seq flow
                isPathSelected = true;
                selectedElementId = e.element.id.replace('_label','');
                //if stepwise and the next element is clicked
                if(isStepAnimSelected==true/* && isJustFollowNext==true*/){
                    //in case of stepanim mode, the user needs to click to the next node, not the sequence. 
                    var nodeSize = nodetobeClicked.length;
                    for(var m=0; m < nodeSize; m++){
                        //console.log(nodetobeClicked[m]);
                        if(nodetobeClicked[m].indexOf(selectedElementId) != -1){
                            //exp2: log also the nodes clicked
							if(appType.indexOf('Exp2') != -1){
	                            logExp("clickNode "+processName+' '+e.element.businessObject.name+' '+selectedElementId, particId);
	                            console.log('we will check the name of the clicked node');
	                            console.log(e.element.businessObject.name);
							}
                            var currShape = elementRegistry.get(selectedElementId);
                            var nodetoParse = currShape.businessObject;//Base 
                            isJustFollowNext=false;
                            //viewer.get('canvas').removeMarker(nodetoParse.id, 'highlight-light');
                            loopCount=0;
                            markObjectAndSeqFlow(nodetoParse.id, 'highlight', 'lime');
							
							if(appType.indexOf('PRIMEWeb') != -1){
								//devam etmeden bu listeden kliklenen objeyi cikarmamiz lazim
                                //before continuing, we need to remove the clicked object from the list of nodes to be clicked
	                            for(var n=0; n<nodetobeClicked.length;n++){
	                                if(nodetobeClicked[n].indexOf(selectedElementId) != -1){//selected is not seq but node.  
	                                    nodetobeClicked.splice(n, 1);
									}
								}
							}

							if(appType.indexOf('Exp2') != -1){
                            //var for Exp2 to identify if multiple executions possible
                            var isClickOnMultipleExecTasksExp2PrcDTaskD = false;
                            var isClickOnMultipleExecTasksExp2PrcDTaskE = false;
                            var isClickOnMultipleExecTasksExp2PrcDTaskF = false;
                            var isClickOnMultipleExecTasksExp2PrcDTaskN = false;
                            var isClickOnMultipleExecTasksExp2PrcDTaskG = false;
                            var isClickOnMultipleExecTasksExp2PrcDTaskH = false;
                            
                            var isClickOnMultipleExecTasksExp2PrcTLMTaskF = false;
                            var isClickOnMultipleExecTasksExp2PrcXTaskF = false;
                            var isClickOnMultipleExecTasksExp2PrcRMTaskK = false;
                            var isClickOnMultipleExecTasksExp2PrcR2TaskL = false;
                            var isClickOnMultipleExecTasksExp2PrcR2TaskM = false;
                            
                            var isARelatedMultipleClickTaskHandledR2 = false;
                            var isARelatedMultipleClickTaskHandledRM = false;
                            var isARelatedMultipleClickTaskHandledTLM = false;
                            var isARelatedMultipleClickTaskHandledPrcX = false;
                            var isARelatedMultipleClickTaskHandledPrcD = false;
                            //for exp2, if some elements are enabled more than once but executed less, we will enable them again. 
                            if(nodetoParse.id.indexOf('sid-8007DA64-E10A-4268-96FD-AC45E35FC049') != -1 && processName.indexOf('ProcessD-Similar') != -1){//if task D is clicked on PrcD
                                numofPrcDTaskDEnabled--;
                                isARelatedMultipleClickTaskHandledPrcD = true;
                                //isClickOnMultipleExecTasksExp2PrcDTaskD = true;
                                if(numofPrcDTaskDEnabled > 0){
                                    loopCount++;
                                    markCleanObject(nodetoParse.id, 'highlight');
                                    markCleanObject(nodetoParse.id, 'highlight-light');
                                    loopCount++;
                                    markObject(nodetoParse.id, 'highlight-light');
                                }else if(numofPrcDTaskDEnabled == 0){
                                    isClickOnMultipleExecTasksExp2PrcDTaskD = true;
                                }
                            }else if(nodetoParse.id.indexOf('sid-359F15FF-4D9D-46B9-8A32-67C7360D3702') != -1 && processName.indexOf('ProcessD-Similar') != -1){//if task E is clicked  on PrcD
                                numofPrcDTaskEEnabled--;
                                isARelatedMultipleClickTaskHandledPrcD = true;
                                //isClickOnMultipleExecTasksExp2PrcDTaskE = true;
                                if(numofPrcDTaskEEnabled > 0){
                                    loopCount++;
                                    markCleanObject(nodetoParse.id, 'highlight');
                                    markCleanObject(nodetoParse.id, 'highlight-light');
                                    loopCount++;
                                    markObject(nodetoParse.id, 'highlight-light');
                                }else if(numofPrcDTaskEEnabled == 0){
                                    isClickOnMultipleExecTasksExp2PrcDTaskE = true;
                                }   
                            }else if(nodetoParse.id.indexOf('sid-7F7C9D6E-7851-43B2-AF58-6CBA79DE5216') != -1 && processName.indexOf('ProcessD-Similar') != -1){//if task F is clicked  on PrcD
                                numofPrcDTaskFEnabled--;
                                isARelatedMultipleClickTaskHandledPrcD = true;
                                //isClickOnMultipleExecTasksExp2PrcDTaskF = true;
                                if(numofPrcDTaskFEnabled > 0){
                                    loopCount++;
                                    markCleanObject(nodetoParse.id, 'highlight');
                                    markCleanObject(nodetoParse.id, 'highlight-light');
                                    loopCount++;
                                    markObject(nodetoParse.id, 'highlight-light');
                                }else if(numofPrcDTaskFEnabled == 0){
                                    isClickOnMultipleExecTasksExp2PrcDTaskF = true;
                                }   
                            }else if(nodetoParse.id.indexOf('sid-7FA8EE72-9027-4F57-BB83-532CB06CDAB9') != -1 && processName.indexOf('ProcessD-Similar') != -1){//if task N is clicked  on PrcD
                                numofPrcDTaskNEnabled--;
                                isARelatedMultipleClickTaskHandledPrcD = true;
                                //isClickOnMultipleExecTasksExp2PrcDTaskN = true;
                                if(numofPrcDTaskNEnabled > 0){
                                    loopCount++;
                                    markCleanObject(nodetoParse.id, 'highlight');
                                    markCleanObject(nodetoParse.id, 'highlight-light');
                                    loopCount++;
                                    markObject(nodetoParse.id, 'highlight-light');
                                }else if(numofPrcDTaskNEnabled == 0){
                                    isClickOnMultipleExecTasksExp2PrcDTaskN = true;
                                }   
                            }else if(nodetoParse.id.indexOf('sid-C7D8EDC6-0198-4465-9D42-6E07051D53E6') != -1 && processName.indexOf('ProcessD-Similar') != -1){//if task G is clicked  on PrcD
                                numofPrcDTaskGEnabled--;
                                isARelatedMultipleClickTaskHandledPrcD = true;
                                //isClickOnMultipleExecTasksExp2PrcDTaskG = true;
                                if(numofPrcDTaskGEnabled > 0){
                                    loopCount++;
                                    markCleanObject(nodetoParse.id, 'highlight');
                                    markCleanObject(nodetoParse.id, 'highlight-light');
                                    loopCount++;
                                    markObject(nodetoParse.id, 'highlight-light');
                                }else if(numofPrcDTaskGEnabled == 0){
                                    isClickOnMultipleExecTasksExp2PrcDTaskG = true;
                                }   
                                //We will also check the decision on converging before H. For this, we count the times seq flow is enabled. (upper one after G)
                                numofPrcDUpperANDHEnabled++;
                            }else if(nodetoParse.id.indexOf('sid-EB98B6A4-4F1A-4720-A381-9E7557FEE0E2') != -1 && processName.indexOf('ProcessD-Similar') != -1){//if task H is clicked  on PrcD
                                numofPrcDTaskHExecuted++;
                                isARelatedMultipleClickTaskHandledPrcD = true;
                                //If Task H is already reached (enabled) twice, and clicked (executed) twice, we need to take care of next XOR diverging. The color choice should be enabled again after the first selection of seq flows. 
                                if(isSeqFlowClickedAfterHExecutedOnce == true){
                                    //no need to take care of double seq flow selection any more. 
                                    numofPrcDTaskHExecuted = 0;
                                }
                                
                                numofPrcDTaskHEnabled--;
                                //isClickOnMultipleExecTasksExp2PrcDTaskH = true;
                                if(numofPrcDTaskHEnabled > 0){
                                    loopCount++;
                                    markCleanObject(nodetoParse.id, 'highlight');
                                    markCleanObject(nodetoParse.id, 'highlight-light');
                                    loopCount++;
                                    markObject(nodetoParse.id, 'highlight-light');
                                }else if(numofPrcDTaskHEnabled == 0){
                                    isClickOnMultipleExecTasksExp2PrcDTaskH = true;
                                }   
                            }
                            
                            //the following part is for Prc ThreeLevel
                            else if(nodetoParse.id.indexOf('sid-D5556F60-9623-4A3A-9CE9-65FBD8172693') != -1 && processName.indexOf('ThreeLevel') != -1){//if task M on PrcTL clicked
                                prcTLTaskMExecuted = true;
                                
                            }else if(nodetoParse.id.indexOf('sid-A8C54355-7159-41DA-891E-06395D6C88D4') != -1 && processName.indexOf('ThreeLevel') != -1){//if task N on PrcTL clicked
                                prcTLTaskNExecuted = true;
                            }else if(nodetoParse.id.indexOf('sid-B9FCF1BF-2060-48F4-8667-E6BB8B0C2870') != -1 && processName.indexOf('ThreeLevel') != -1){//if conv OR PrcTL clicked
                                //we need to remove M and N from nodetobeClicked as well (whichever is not yet clicked) and turn it to white again
                                var idOfMorNtoRemoveFromNodetoClick; 
                                if(prcTLTaskMExecuted == true){
                                    idOfMorNtoRemoveFromNodetoClick = 'sid-A8C54355-7159-41DA-891E-06395D6C88D4';
                                }else if(prcTLTaskNExecuted == true){
                                    idOfMorNtoRemoveFromNodetoClick = 'sid-D5556F60-9623-4A3A-9CE9-65FBD8172693';
                                }
                                for(var n=0; n<nodetobeClicked.length;n++){
                                    if(nodetobeClicked[n].indexOf(idOfMorNtoRemoveFromNodetoClick) != -1){ 
                                        nodetobeClicked.splice(n, 1);
                                    }
                                }
                                markCleanObject(idOfMorNtoRemoveFromNodetoClick, 'highlight-light');
                                loopCount++;
                            }
                            
                            //The following part is for PrcL-Similar
                            else if(nodetoParse.id.indexOf('sid-2CE90F39-ED85-4DD1-AA4A-19C39F8FB2FC') != -1 && processName.indexOf('ProcessL-Similar') != -1){//if task A on PrcL clicked
                                prcLTaskAExecuted = true;
                            }else if(nodetoParse.id.indexOf('sid-0408842D-8C50-4639-8D12-B4DD2B96C719') != -1 && processName.indexOf('ProcessL-Similar') != -1){//if task B on PrcL clicked
                                prcLTaskBExecuted = true;
                                
                            }else if(nodetoParse.id.indexOf('sid-D4CD6B85-92DA-45F6-BCCB-F9289102B5AA') != -1 && processName.indexOf('ProcessL-Similar') != -1){//if first conv OR PrcL clicked
                                //we need to remove A and B from nodetobeClicked as well (whichever is not yet clicked) and turn it to white again
                                //I removed following. It was for the behavior where the flow could continue after A or B is clicked
                                /*var idOfAorBtoRemoveFromNodetoClick; 
                                if(prcLTaskAExecuted == true){
                                    idOfAorBtoRemoveFromNodetoClick = 'sid-0408842D-8C50-4639-8D12-B4DD2B96C719';
                                }else if(prcLTaskBExecuted == true){
                                    idOfAorBtoRemoveFromNodetoClick = 'sid-2CE90F39-ED85-4DD1-AA4A-19C39F8FB2FC';
                                }
                                for(var n=0; n<nodetobeClicked.length;n++){
                                    if(nodetobeClicked[n].indexOf(idOfAorBtoRemoveFromNodetoClick) != -1){ 
                                        nodetobeClicked.splice(n, 1);
                                    }
                                }
                                markCleanObject(idOfAorBtoRemoveFromNodetoClick, 'highlight-light');
                                loopCount++;*/
                                //-------
                                if(prcLTaskAExecuted == true && prcLTaskBExecuted == false){
                                    markSeqFlowwithGivenId('sid-E5F1F4E0-D92F-4310-BD2B-98204DADA733', 'Black');
                                    markCleanObject(nodetoParse.id, 'highlight-light');
                                    markObject(nodetoParse.id, 'highlight');
                                    markCleanObject(nodetoParse.id, 'highlight');
                                    markObject(nodetoParse.id, 'highlight-light');
                                }else if(prcLTaskAExecuted == false && prcLTaskBExecuted == true){
                                    markSeqFlowwithGivenId('sid-E5F1F4E0-D92F-4310-BD2B-98204DADA733', 'Black');
                                    markCleanObject(nodetoParse.id, 'highlight-light');
                                    markObject(nodetoParse.id, 'highlight');
                                    markCleanObject(nodetoParse.id, 'highlight');
                                    markObject(nodetoParse.id, 'highlight-light');
                                }
                                loopCount++;
                                return;
                            }
                            //The following part is for TwoLevel-OR
                            //first, assign for inner OR
                            else if(nodetoParse.id.indexOf('sid-EF09FCDB-A858-4214-86DF-86C0A81731DD') != -1 && processName.indexOf('TwoLevel-OR') != -1){//if task J on PrcTLO clicked
                                prcTLOTaskJExecuted = true;
                            }else if(nodetoParse.id.indexOf('sid-0973BCCA-F992-4275-995A-88DBA619EE1A') != -1 && processName.indexOf('TwoLevel-OR') != -1){//if task K on PrcTLO clicked
                                prcTLOTaskKExecuted = true;
                            }else if(nodetoParse.id.indexOf('sid-A7DB9084-23A3-4DD0-90E0-742C18616BFA') != -1 && processName.indexOf('TwoLevel-OR') != -1){//if task L on PrcTLO clicked
                                prcTLOTaskLExecuted = true;
                            }else if(nodetoParse.id.indexOf('sid-84238CE5-A20F-4E5B-A6C8-B286CEABE731') != -1 && processName.indexOf('TwoLevel-OR') != -1){//if inner conv OR PrcTLO clicked
                                //we need to remove J, K and L from nodetobeClicked as well (whichever is not yet clicked) and turn it to white again. We have two to remove because OR structure has 3 paths. 
                                if(prcTLOTaskJExecuted == false){
                                   markCleanObject('sid-EF09FCDB-A858-4214-86DF-86C0A81731DD', 'highlight-light');
                                    loopCount++;
                                }
                                if(prcTLOTaskKExecuted == false){
                                   markCleanObject('sid-0973BCCA-F992-4275-995A-88DBA619EE1A', 'highlight-light');
                                    loopCount++;
                                }if(prcTLOTaskLExecuted == false){
                                   markCleanObject('sid-A7DB9084-23A3-4DD0-90E0-742C18616BFA', 'highlight-light');
                                    loopCount++;
                                }
                                
                                for(var n=0; n<nodetobeClicked.length;n++){
                                    if(nodetobeClicked[n].indexOf('sid-EF09FCDB-A858-4214-86DF-86C0A81731DD') != -1 || nodetobeClicked[n].indexOf('sid-0973BCCA-F992-4275-995A-88DBA619EE1A') != -1 || nodetobeClicked[n].indexOf('sid-A7DB9084-23A3-4DD0-90E0-742C18616BFA') != -1 ){
                                        nodetobeClicked.splice(n, 1);
                                    }
                                }
                                prcTLOTaskJExecuted = false;
                                prcTLOTaskKExecuted = false;
                                prcTLOTaskMExecuted = false;
                                console.log(nodetobeClicked);
                                
                            }
                            //first, assign for outer OR for Process TLO
                            else if(nodetoParse.id.indexOf('sid-77C15100-15C9-4930-8137-D138944B7971') != -1 && processName.indexOf('TwoLevel-OR') != -1){//if task A on PrcTLO clicked
                                prcTLOTaskAExecuted = true;
                                
                            }else if(nodetoParse.id.indexOf('sid-EFC66FA7-4D9A-4ED1-B058-95F91A413BD2') != -1 && processName.indexOf('TwoLevel-OR') != -1){//if task G on PrcTLO clicked
                                prcTLOTaskGExecuted = true;
                                
                            }else if(nodetoParse.id.indexOf('sid-1D1409CE-7451-4384-A0BE-43FF8AB2426E') != -1 && processName.indexOf('TwoLevel-OR') != -1){//if task I on PrcTLO clicked
                                prcTLOTaskIExecuted = true;
                                
                            }else if(nodetoParse.id.indexOf('sid-F684335A-2A88-4473-85EC-5ADF0A4C5BB9') != -1 && processName.indexOf('TwoLevel-OR') != -1){//if task I on PrcTLO clicked
                                prcTLOTaskFExecuted = true;
                            }else if(nodetoParse.id.indexOf('sid-BDF017DE-8C00-4CE1-9A3F-C254D51AF719') != -1 && processName.indexOf('TwoLevel-OR') != -1){//if outer conv OR PrcTLO clicked
                                var doesFlowContinueAfterOR=true;
                                if(prcTLOdidLowerPathReachOuterConvOr == false){
                                    //reached from upper part. We need to check if lower is initiated
                                    if(prcTLOTaskGExecuted == false && prcTLOTaskIExecuted == false){
                                        //only one part is executed. the user can continue
                                       //remove them from to be clicked
                                        for(var n=0; n<nodetobeClicked.length;n++){
                                            if(nodetobeClicked[n].indexOf('sid-EFC66FA7-4D9A-4ED1-B058-95F91A413BD2') != -1 || nodetobeClicked[n].indexOf('sid-1D1409CE-7451-4384-A0BE-43FF8AB2426E') != -1){ 
                                            nodetobeClicked.splice(n, 1);
                                            }
                                        }
                                        markCleanObject('sid-EFC66FA7-4D9A-4ED1-B058-95F91A413BD2', 'highlight-light');
                                        loopCount++;
                                        markCleanObject('sid-1D1409CE-7451-4384-A0BE-43FF8AB2426E', 'highlight-light');
                                        loopCount++;
                                        markCleanObject('sid-CA26FBDB-346F-41D4-BF62-867AA83804A5', 'highlight');
                                        loopCount++;
                                        markCleanObject('sid-AAA6CA5C-FD41-455B-93F1-B182A1B372B6', 'highlight');
                                        loopCount++;
                                        markSeqFlowwithGivenId('sid-1AE4817F-7E02-49A4-8252-4E3E25848062', 'Black');
                                        markSeqFlowwithGivenId('sid-B61F70FB-FD81-4003-91BF-52945D3B6B52', 'Black');
                                        markSeqFlowwithGivenId('sid-CE2A1851-EFE6-4AE4-9568-7A12E2852EBD', 'Black');
                                        loopCount++;
                                    }else{
                                        doesFlowContinueAfterOR=false;
                                    }
                                }else if(prcTLOdidLowerPathReachOuterConvOr == true){
                                    //reached from lower part. We need to check if lower is initiated
                                    if(prcTLOTaskAExecuted == false){
                                        //only one part is executed. the user can continue
                                       //remove them from to be clicked
                                        for(var n=0; n<nodetobeClicked.length;n++){
                                            if(nodetobeClicked[n].indexOf('sid-77C15100-15C9-4930-8137-D138944B7971') != -1){ 
                                            nodetobeClicked.splice(n, 1);
                                            }
                                        }
                                        markCleanObject('sid-77C15100-15C9-4930-8137-D138944B7971', 'highlight-light');
                                        loopCount++;
                                    }else{
                                        doesFlowContinueAfterOR=false;
                                    }
                                }
                                if(doesFlowContinueAfterOR==false){
                                    markCleanObject('sid-BDF017DE-8C00-4CE1-9A3F-C254D51AF719', 'highlight');
                                    markObject('sid-BDF017DE-8C00-4CE1-9A3F-C254D51AF719', 'highlight-light');
                                    markSeqFlowwithGivenId('sid-FDFAC7BF-7A9C-4AA0-8B9A-962D0313F9D9', 'Black');
                                    return;
                                }
                            }
                            //The following part is for TwoLevel-Mismatch
                            else if(nodetoParse.id.indexOf('sid-F684335A-2A88-4473-85EC-5ADF0A4C5BB9') != -1 && processName.indexOf('TwoLevel-Mismatch') != -1){//Task F is clicked on TLM
                                numofPrcTLMTaskFEnabled--;
                                isARelatedMultipleClickTaskHandledTLM = true;
                                //isClickOnMultipleExecTasksExp2PrcTLMTaskF = true;
                                if(numofPrcTLMTaskFEnabled > 0){
                                    loopCount++;
                                    markCleanObject(nodetoParse.id, 'highlight');
                                    markCleanObject(nodetoParse.id, 'highlight-light');
                                    loopCount++;
                                    markObject(nodetoParse.id, 'highlight-light');
                                }else if(numofPrcTLMTaskFEnabled == 0){
                                    isClickOnMultipleExecTasksExp2PrcTLMTaskF = true;
                                }
                            }
                            //the following part is for ProcessX-Similar
                            else if(nodetoParse.id.indexOf('sid-8BFA2168-EF01-407D-846E-91D74EBD8C2A') != -1 && processName.indexOf('ProcessX-Similar') != -1){//Task F is clicked on PrcX
                                numofprcXTaskFEnabled--;
                                isARelatedMultipleClickTaskHandledPrcX = true;
                                //isClickOnMultipleExecTasksExp2PrcXTaskF = true;
                                if(numofprcXTaskFEnabled > 0){
                                    loopCount++;
                                    markCleanObject(nodetoParse.id, 'highlight');
                                    markCleanObject(nodetoParse.id, 'highlight-light');
                                    loopCount++;
                                    markObject(nodetoParse.id, 'highlight-light');
                                    loopCount++;
                                }else if(numofprcXTaskFEnabled == 0){
                                    isClickOnMultipleExecTasksExp2PrcXTaskF = true;
                                }
                            }
                            //the following part is for Process ReworkMismatch. To mark K for twice and To mark lower path of AND coming from K. 
                            else if(nodetoParse.id.indexOf('sid-B734487C-4E87-4B14-AFC3-4A59AFBEEA30') != -1 && processName.indexOf('ReworkMismatch') != -1){//if task K is clicked  on PrcRM
                                numofPrcRMTaskKEnabled--;
                                isARelatedMultipleClickTaskHandledRM = true;
                                //isClickOnMultipleExecTasksExp2PrcRMTaskK = true;
                                if(numofPrcRMTaskKEnabled > 0){
                                    loopCount++;
                                    markCleanObject(nodetoParse.id, 'highlight');
                                    markCleanObject(nodetoParse.id, 'highlight-light');
                                    loopCount++;
                                    markObject(nodetoParse.id, 'highlight-light');
                                }else if(numofPrcRMTaskKEnabled == 0){
                                    isClickOnMultipleExecTasksExp2PrcRMTaskK = true;
                                }  
                                numofPrcRMLowerANDNEnabled++;
                            }
                            else if(nodetoParse.id.indexOf('sid-085375E0-B0EB-43E9-A5FE-C3B63F0C6650') != -1 && processName.indexOf('ReworkMismatch') != -1){//if task L on PrcRM clicked
                                prcRMTaskLExecuted = true;
                                
                            }else if(nodetoParse.id.indexOf('sid-57B4C5D9-1938-4FF4-BF0E-81C813017C39') != -1 && processName.indexOf('ReworkMismatch') != -1){//if task M on PrcRM clicked
                                prcRMTaskMExecuted = true;
                            }else if(nodetoParse.id.indexOf('sid-B81EBBF3-9866-4EC9-9B02-B3555F51CC6F') != -1 && processName.indexOf('ReworkMismatch') != -1){//if conv OR PrcTL clicked
                                //we need to remove M and N from nodetobeClicked as well (whichever is not yet clicked) and turn it to white again
                                var idOfLorMtoRemoveFromNodetoClick; 
                                if(prcRMTaskLExecuted == true){
                                    idOfLorMtoRemoveFromNodetoClick = 'sid-57B4C5D9-1938-4FF4-BF0E-81C813017C39';
                                }else if(prcRMTaskMExecuted == true){
                                    idOfLorMtoRemoveFromNodetoClick = 'sid-085375E0-B0EB-43E9-A5FE-C3B63F0C6650';
                                }
                                for(var n=0; n<nodetobeClicked.length;n++){
                                    if(nodetobeClicked[n].indexOf(idOfLorMtoRemoveFromNodetoClick) != -1){ 
                                        nodetobeClicked.splice(n, 1);
                                    }
                                }
                                markCleanObject(idOfLorMtoRemoveFromNodetoClick, 'highlight-light');
                                loopCount++;
                            }
                            //the following is for Rigid2. Task L and M can be enabled twice
                            else if(nodetoParse.id.indexOf('sid-8172D979-A1E3-4BE6-9FE8-4F2AE3D350E6') != -1 && processName.indexOf('Rigid2') != -1){//if task L is clicked  on PrcR2
                                numofPrcR2TaskLEnabled--;
                                numofPrcR2TaskMEnabled++;
                                isARelatedMultipleClickTaskHandledR2 = true;

                                if(numofPrcR2TaskLEnabled > 0){
                                    loopCount++;
                                    markCleanObject(nodetoParse.id, 'highlight');
                                    markCleanObject(nodetoParse.id, 'highlight-light');
                                    loopCount++;
                                    markObject(nodetoParse.id, 'highlight-light');
                                }else if(numofPrcR2TaskLEnabled == 0){
                                    isClickOnMultipleExecTasksExp2PrcR2TaskL = true;
                                }
                            }else if(nodetoParse.id.indexOf('sid-27A07892-313E-48E6-B8A4-711567996098') != -1 && processName.indexOf('Rigid2') != -1){//if task M is clicked  on PrcD
                                numofPrcR2TaskMEnabled--;
                                isARelatedMultipleClickTaskHandledR2 = true;
                                //isClickOnMultipleExecTasksExp2PrcR2M = true;
                                if(numofPrcR2TaskMEnabled > 0){
                                    loopCount++;
                                    markCleanObject(nodetoParse.id, 'highlight');
                                    markCleanObject(nodetoParse.id, 'highlight-light');
                                    loopCount++;
                                    markObject(nodetoParse.id, 'highlight-light');
                                }else if(numofPrcR2TaskMEnabled == 0){
                                    isClickOnMultipleExecTasksExp2PrcR2TaskM = true;
                                }   
                            }
                            
                            //before we continue, we need to remove the clicked element from nodetobeClicked list. 
                            //specific to Exp2, if only this click is on something not multiple executed, then remove it.  
                            var isNodetoBeRemovedForExp2=true;
                            if(processName.indexOf('ProcessD-Similar') != -1){
                                if(isClickOnMultipleExecTasksExp2PrcDTaskD == false){
                                    isNodetoBeRemovedForExp2=false;
                                }
                            }else if(processName.indexOf('ProcessD-Similar') != -1){
                                if(isClickOnMultipleExecTasksExp2PrcDTaskE == false){
                                    isNodetoBeRemovedForExp2=false;
                                }
                            }else if(processName.indexOf('ProcessD-Similar') != -1){
                                if(isClickOnMultipleExecTasksExp2PrcDTaskF == false){
                                    isNodetoBeRemovedForExp2=false;
                                }
                            }else if(processName.indexOf('ProcessD-Similar') != -1){
                                if(isClickOnMultipleExecTasksExp2PrcDTaskN == false){
                                    isNodetoBeRemovedForExp2=false;
                                }
                            }else if(processName.indexOf('ProcessD-Similar') != -1){
                                if(isClickOnMultipleExecTasksExp2PrcDTaskG == false){
                                    isNodetoBeRemovedForExp2=false;
                                }
                            }else if(processName.indexOf('ProcessD-Similar') != -1){
                                if(isClickOnMultipleExecTasksExp2PrcDTaskH == false){
                                    isNodetoBeRemovedForExp2=false;
                                }
                            }
                            else if(processName.indexOf('ProcessX-Similar') != -1){
                                if(isClickOnMultipleExecTasksExp2PrcXTaskF == false){
                                    isNodetoBeRemovedForExp2=false;
                                }
                            }else if(processName.indexOf('TwoLevel-Mismatch') != -1){
                                if(isClickOnMultipleExecTasksExp2PrcTLMTaskF == false){
                                    isNodetoBeRemovedForExp2=false;
                                }
                            }else if(processName.indexOf('ReworkMismatch') != -1){
                                if(isClickOnMultipleExecTasksExp2PrcRMTaskK == false){
                                    isNodetoBeRemovedForExp2=false;
                                }
                            }else if(processName.indexOf('Rigid2') != -1){
                                if(isClickOnMultipleExecTasksExp2PrcR2TaskL == false){
                                    isNodetoBeRemovedForExp2=false;
                                }
                            }else if(processName.indexOf('Rigid2') != -1){
                                if(isClickOnMultipleExecTasksExp2PrcR2TaskM == false){
                                    isNodetoBeRemovedForExp2=false;
                                }
                            }

                            //this is to remove the multiple clicked nodes
                            if(isARelatedMultipleClickTaskHandledR2==true || isARelatedMultipleClickTaskHandledRM==true || isARelatedMultipleClickTaskHandledTLM==true || isARelatedMultipleClickTaskHandledPrcX==true || isARelatedMultipleClickTaskHandledPrcD==true){
                                if(isNodetoBeRemovedForExp2 == true){
                                    for(var n=0; n<nodetobeClicked.length;n++){
                                        if(nodetobeClicked[n].indexOf(selectedElementId) != -1){////selected is not seq but node. 
                                            console.log('is it removed double here '+nodetobeClicked[n]);
                                            console.log(selectedElementId);
                                            nodetobeClicked.splice(n, 1);
                                        }
                                    }
                                }
                            }else{//this is the standard remove of nodetobeclicked
                                for(var n=0; n<nodetobeClicked.length;n++){
                                    if(nodetobeClicked[n].indexOf(selectedElementId) != -1){////selected is not seq but node. 
                                        console.log('is it removed double here '+nodetobeClicked[n]);
                                        console.log(selectedElementId);
                                        nodetobeClicked.splice(n, 1);
                                    }
                                }
                            }
							}//the end of appType=Exp2 check 
                            findNextObject(nodetoParse.get('outgoing')[0]);
                            //if we found the node to be clicked in step anim, we won't go further to search for seq flow check
                            return;
                        }
                    }
                }
                //now we do the necessary actions if a sequence flow is clicked. 
                var clickedGatewayPath;
                for(i=0; i<seqFlowstobeClicked.length;i++){
                    if(seqFlowstobeClicked[i].seqFlowId == selectedElementId){
					if(appType.indexOf('Exp2') != -1){
	                    logExp("clickSeqFlow "+processName+' '+selectedElementId, particId);
	                    }else if(appType.indexOf('PRIMEWeb') != -1){
						logExp(particId+" clickPrc1AnimAltPath "+selectedElementId, "WebLogger");
						}
                        var currShape = elementRegistry.get(selectedElementId);
                        var seqFlowToParse = currShape.businessObject;//Base 
                        //now we can remove all paths of this XOR from the seq.flows to be clicked. 
                        clickedGatewayPath = seqFlowstobeClicked[i].relatedXOR;
                        if(isRandomFlowSelected == false){
                            loopCount = 0;
                        }if(isRoleBasedAnimSelected == true && isCurObjInSelectedLane == true){
                            loopCount = 0;
                        }
                        for(var k = seqFlowstobeClicked.length - 1; k >= 0; k--){
                            if(seqFlowstobeClicked[k].relatedXOR === clickedGatewayPath) {
                               if(seqFlowstobeClicked[k].seqFlowId != selectedElementId){
                                    markSeqFlowwithGivenId(seqFlowstobeClicked[k].seqFlowId, 'Grey');
                                   //if we want to paint grey also the activity connected to the seq.flow, open the below code. 
                                    /*var notSelShape = elementRegistry.get(seqFlowstobeClicked[k].seqFlowId);
                                    var seqFlowLighten = notSelShape.businessObject;//Base 
                                    markObject(seqFlowLighten.targetRef.id,  'highlight-light');*/
                                }
                                seqFlowstobeClicked.splice(k, 1);
                            }
                        }
                        markSeqFlowwithGivenId(selectedElementId, 'lime');
                        //specific to Exp2. I moved this to after the condition below.
                        //findNextObject(seqFlowToParse);
                    if(appType.indexOf('Exp2') != -1){
                    //specific to Exp2. In PrcD for the last XOR, if it is enabled twice, we will repeat the same things performed when it reaches Div XOR upon click of the first one. The click must be on one of the outgoing flows. 
                    if((selectedElementId.indexOf('sid-52B3E917-9AD2-4525-A360-F8D5549A835F') != -1 || selectedElementId.indexOf('sid-BE538472-BF58-44D2-8734-C9BB76B7BE23') != -1 || selectedElementId.indexOf('sid-C019D1A5-E3E2-463C-8BB0-997D54780B78') != -1) && processName.indexOf('ProcessD-Similar') != -1){
                        //first, let's check if F and N are enabled twice
                        if(selectedElementId.indexOf('sid-52B3E917-9AD2-4525-A360-F8D5549A835F') != -1){
                            numofPrcDTaskFEnabled++;
                        }else if(selectedElementId.indexOf('sid-BE538472-BF58-44D2-8734-C9BB76B7BE23') != -1){
                            numofPrcDTaskNEnabled++;
                        }
                        
                        //if one of these seq flows are clicked after H is executed once, we don't need to keep track of possible double selection possibility anymore. 
                        if(numofPrcDTaskHExecuted == 1){
                            isSeqFlowClickedAfterHExecutedOnce = true;
                        }
                        
                        if(numofPrcDTaskHExecuted == 2 && isSeqFlowClickedAfterHExecutedOnce == false){
                            //This means that the seq flow is clicked for the first time but H is executed twice. Now, we need to replay seq flow selection coloring again after it is selected for once. 
                            var prcDLastXORShape = elementRegistry.get('sid-C7ED6EC5-A181-42EB-A49D-50323E61B7EE');
                            var prcDLastXOR = prcDLastXORShape.businessObject;
                            var seqFlow = prcDLastXOR.get('outgoing');
                            var pathNum = seqFlow.length;

                            var nextObject = seqFlowToParse.targetRef;//This is the target of the clicked seq flow (N or F)

                            markCleanObject(prcDLastXOR.id, 'highlight');
                            loopCount++;
                            markObject(prcDLastXOR.id, 'highlight');

                            //we need to push again the seq flows of XOR. 
                            for(var i=0; i<pathNum;i++){
                                seqFlowstobeClicked.push({
                                    relatedXOR: prcDLastXOR.id, 
                                    seqFlowId: seqFlow[i].id});
                                    loopCount++;
                                    markSeqFlowwithGivenId(seqFlow[i].id, 'Black');
                                    loopCount++;
                                    markSeqFlowwithGivenId(seqFlow[i].id, 'Magenta');
                                    console.log(seqFlow[i].id);
                            }
                            //reset the variables. 
                            numofPrcDTaskHExecuted=0;
                            isSeqFlowClickedAfterHExecutedOnce=false;
                        }                        
                    }
                    //This part is for Prc TLO. We need to keep track of outer OR conv. If the bottom path is selected or not. 
                    if(selectedElementId.indexOf('sid-A9CDD35B-3693-4DC7-A9E2-9E1E0E6D90DD') != -1 && processName.indexOf('TwoLevel-OR') != -1){
                        prcTLOOuterConvORLowerSeqExecuted=true;
                    }
                    //specific to Exp2. In PrcX for the last XOR at the end of upper path, if it is enabled twice, we will repeat the same things performed when it reaches Div XOR upon click of the first one. The click must be on one of the outgoing flows. 
                    if(selectedElementId.indexOf('sid-C9385AE3-8716-4C54-A95C-2E0871010E7B') != -1 && processName.indexOf('ProcessX-Similar') != -1){
                        //first, let's check if first XOR of the path is enabled twice
                        if(selectedElementId.indexOf('sid-8EC6FCBE-50B3-42A2-A228-45E0C727D803') != -1){
                            numofPrcXFirstUpperXOREnabled++;
                        }
                        
                        //if one of these seq flows are clicked after previous conv OR is traversed once, we don't need to keep track of possible double selection possibility anymore. 
                        if(numofPrcXTUpperRightConvXORTraced == 1){
                            isSeqFlowClickedAfterDivXORExecutedOnceX = true;
                        }
                        
                        if(numofPrcXTUpperRightConvXORTraced >= 2 && isSeqFlowClickedAfterDivXORExecutedOnceX == false){
                            //This means that the seq flow is clicked for the first time but XOR is executed twice. Now, we need to replay seq flow selection coloring again after it is selected for once. 
                            var prcXLastXORShape = elementRegistry.get('sid-3C0D8CAE-A8A0-46FD-AB40-9E3A0D69A124');
                            var prcXLastXOR = prcXLastXORShape.businessObject;
                            var seqFlow = prcXLastXOR.get('outgoing');
                            var pathNum = seqFlow.length;

                            var nextObject = seqFlowToParse.targetRef;//This is the target of the clicked seq flow (first upper XOR or last XOR)

                            markCleanObject(prcXLastXOR.id, 'highlight');
                            loopCount++;
                            markObject(prcXLastXOR.id, 'highlight');
                            loopCount++;

                            //we need to push again the seq flows of XOR. 
                            for(var i=0; i<pathNum;i++){
                                seqFlowstobeClicked.push({
                                    relatedXOR: prcXLastXOR.id, 
                                    seqFlowId: seqFlow[i].id});
                                    loopCount++;
                                    markSeqFlowwithGivenId(seqFlow[i].id, 'Black');
                                    loopCount++;
                                    markSeqFlowwithGivenId(seqFlow[i].id, 'Magenta');
                                    console.log(seqFlow[i].id);
                            }
                            //reset the variables. 
                            numofPrcXTUpperRightConvXORTraced--;
                            isSeqFlowClickedAfterDivXORExecutedOnceX=false;
                        }                        
                    }
                    //Specific to Exp2 PrcRM. To understand Upper path of Convergin AND is activated
                    else if(selectedElementId.indexOf('sid-A2A96D21-BF89-4684-91DA-91BA05C97D5C') != -1 && processName.indexOf('ReworkMismatch') != -1){
                        numofPrcRMUpperANDNEnabled++;     //Div XOR before N is enabled
                    }
                    } //end of appType=Exp2 check.     
                        
                    findNextObject(seqFlowToParse);
                    }
                }//end of seqFlowtobeClicked control if
            }//end of main if. What is the selected object type (seq flow, start event etc)
            if(isCurObjInSelectedLane == true){
                isCurObjInSelectedLane = false;
            }
          });//end of eventBus function
        });//end of events.forEach(function(event)... function
    });//end of importXML function
}//end of openDiagram function

//Main actions, run when .js is first called. getAppType() and processType() functions are called from the main html.----------
//-----------------------------------------------------------------------------------------------------------------------------
appType = getAppType(); 
if(appType.indexOf('Exp2') != -1){
	//processName is applicable only for the Exp2 
	processName = processType();
}
var fs = require('fs');
if(appType.indexOf('Exp2') != -1){//following files are read for Exp2
	if(processName.indexOf('ProcessD-Similar') != -1){
	    var xmlDiagram = fs.readFileSync(__dirname + '/../resources/ProcessD-Similar.bpmn', 'utf-8');
	}else if(processName.indexOf('ProcessL-Similar') != -1){
	    var xmlDiagram = fs.readFileSync(__dirname + '/../resources/ProcessL-Similar.bpmn', 'utf-8');
	}else if(processName.indexOf('ThreeLevel') != -1){
	    var xmlDiagram = fs.readFileSync(__dirname + '/../resources/ThreeLevel.bpmn', 'utf-8');
	}else if(processName.indexOf('TwoLevel-OR') != -1){
	    var xmlDiagram = fs.readFileSync(__dirname + '/../resources/TwoLevel-OR.bpmn', 'utf-8');
	}else if(processName.indexOf('TwoLevel-Mismatch') != -1){
	    var xmlDiagram = fs.readFileSync(__dirname + '/../resources/TwoLevel-Mismatch.bpmn', 'utf-8');
	}else if(processName.indexOf('ProcessX-Similar') != -1){
	    var xmlDiagram = fs.readFileSync(__dirname + '/../resources/ProcessX-Similar.bpmn', 'utf-8');
	}else if(processName.indexOf('ReworkMismatch') != -1){
	    var xmlDiagram = fs.readFileSync(__dirname + '/../resources/ReworkMismatch.bpmn', 'utf-8');
	}else if(processName.indexOf('Rigid1') != -1){
	    var xmlDiagram = fs.readFileSync(__dirname + '/../resources/Rigid1.bpmn', 'utf-8');
	}else if(processName.indexOf('Rigid2') != -1){
	    var xmlDiagram = fs.readFileSync(__dirname + '/../resources/Rigid2.bpmn', 'utf-8');
	}else if(processName.indexOf('Rigid3') != -1){
	    var xmlDiagram = fs.readFileSync(__dirname + '/../resources/Rigid3.bpmn', 'utf-8');
	}else if(processName.indexOf('Example') != -1){
	    var xmlDiagram = fs.readFileSync(__dirname + '/../resources/Example.bpmn', 'utf-8');
	}else if(processName.indexOf('ExRun') != -1){
	    var xmlDiagram = fs.readFileSync(__dirname + '/../resources/Example.bpmn', 'utf-8');
	}else if(processName.indexOf('ExStatic') != -1){
	    var xmlDiagram = fs.readFileSync(__dirname + '/../resources/Example.bpmn', 'utf-8');
	}
}
else if(appType.indexOf('PRIMEWeb') != -1){
	var xmlDiagram = fs.readFileSync(__dirname + '/../resources/IssueManagement.bpmn', 'utf-8');
}

openDiagram(xmlDiagram);
//setTimeout(showAlertatStartUp, 500);
//End of the main code run when js is called-----------------------------------------------------------------------------------


//Show alert at the beginning--------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------
function showAlertatStartUp(){
    var r = alert("Please go ahead with analyzing the model with the animation now.\n\n The animation will start immediately. Select a start event to continue.\nYou can analyze as long as you like. The animation will restart when the end event is reached.");
    $('[animStep-button-click]').prop('disabled', true);
    $('[animSel-button-click]').prop('disabled', true);
    var timeStamp = Math.floor(Date.now() / 1000); 
    //Butona basildigi zaman ile ayni is yapiliyor. 
    initiateAnimation();
}

//START BUTTON CLICK functions (based on tags on the html file)----------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------

//When the user show filters and selects the role dropdown, this part is called (still experimental)---------------------------
//-----------------------------------------------------------------------------------------------------------------------------
function populateRoleDropdown(){
    $('[roleList-dropdown-click]').empty();
    var isRoleDropdownFilled = false;
    if(lanes.length > 0){
        for (i=0; i<lanes.length; i++){ 
           if(lanes[i].laneName.indexOf('undefined') == -1){//if the name is undefined, add it to the list. If everything is undefined, we need to disable the checkbox
               $('<option/>').val(lanes[i].laneName).html(lanes[i].laneName).appendTo('[roleList-dropdown-click]');
               isRoleDropdownFilled = true;
           }
        }
    }
    if(lanes.length == 0 || isRoleDropdownFilled == false){
        $('[roleFilter-click]').prop('disabled', true);
    }
}

//Open diagram from link on click-----------------------
//------------------------------------------------------
var $diagramLink = $('[open-url-click]');
$diagramLink.on('click', function(){
    var x = new XMLHttpRequest();
    x.open("GET", "http://localhost/prime/resources/Blockstructure-2LevelPlus.bpmn", true);
    x.onreadystatechange = function () {
    if (x.readyState == 4 && x.status == 200){
        var doc = x.responseText;
        //var root = doc.documentElement;
        openDiagram(doc);
        }
    };
    x.send(null);
});
//------------------------------------------------

//Open new diagram when selected from the browser---
//--------------------------------------------------
var $file = $('[data-open-file]');
function readFile(file, done) {
  if (!file) {
    return done(new Error('no file chosen'));
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    done(null, e.target.result);
  };
  reader.readAsText(file);
}
//--------------------------------------------------

//Open diagram when a new model is selected, and ---
//initiate http request if necessary----------------
//--------------------------------------------------
$file.on('change', function() {
  readFile(this.files[0], function(err, xml) {
    if (err) {
      alert('could not read file, see console');
      return console.error('could not read file', err);
    }
    //add xml to server 
    /*var fd = new FormData();
    fd.append('filecontent', xml);
    fd.append('filename', "deniz");
    var xhrForm = new XMLHttpRequest();
    xhrForm.open("POST", "addFile.php");
    //console.log(path);
    //xhrForm.open("POST", "http://localhost/map/db_addBatch.php");
    xhrForm.send(fd); */
    //end of add xml to server
    xmlDiagram = xml;
    openDiagram(xml);
  });
});

////// file drag / drop ///////////////////////-----
//--------------------------------------------------
function openFile(file, callback) {
  // check file api availability
  if (!window.FileReader) {
    return window.alert(
      'Looks like you use an older browser that does not support drag and drop. ' +
      'Try using a modern browser such as Chrome, Firefox or Internet Explorer > 10.');
  }
  // no file chosen
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var xml = e.target.result;
    callback(xml);
  };
  reader.readAsText(file);
}
//------------------------------------------------------------------

//Animate automatically but expect the user to select conditions----
//------------------------------------------------------------------
var $buttonanimSel = $('[animSel-button-click]');
$buttonanimSel.on('click', function(){
    isSelAnimSelected = true;
    initiateAnimation();
});
//-----------------------------------------------------------------

//Animate stepwise. The user needs to make a selection at every step----
//----------------------------------------------------------------------
var $buttonanimStep = $('[animStep-button-click]');
$buttonanimStep.on('click', function(){
        //log('Anim started');
    //console.log(viewer.definitions); Banu: the whole process tree
    //logExp("SelAnimRestarted ", particId);
	if(appType.indexOf('Exp2') != -1){
    	resetandInitiateAnim();//Banu: check if this is necessary in Exp2 or not. 
	}
    isStepAnimSelected = true;
    initiateAnimation();
});
//---------------------------------------------------------------------

//Reset the animation and restart with the original settings-------
//--------------------------------------------------------------------
var $buttonReset = $('[reset-button-click]');
$buttonReset.on('click', function(){
    //location.reload(); 
    //logExp("SelAnimCleared ", particId);
    resetandInitiateAnim();
});
//--------------------------------------------------------------------

//Start the animation tutorial----------------------------------------
//--------------------------------------------------------------------
var $buttonanimTutor = $('[animTutorial-button-click]');
$buttonanimTutor.on('click', function(){
    window.open('tutorial-web.html','_parent',false);
});
//-------------------------------------------------------------------

//Open diagram from link on click------------------------------------
//-------------------------------------------------------------------
var $diagramLink = $('[IssueMan-button-click]');
$diagramLink.on('click', function(){
    var x = new XMLHttpRequest();
    x.open("GET", "../resources/IssueManagement.bpmn", true);
    x.onreadystatechange = function () {
    if (x.readyState == 4 && x.status == 200){
        var doc = x.responseText;
        //var root = doc.documentElement;
        console.log(doc);
        xmlDiagram = doc;
        openDiagram(doc);
        }
    };
    x.send(null);
});
//-------------------------------------------------------------------

//Open diagram from link on click------------------------------------
//-------------------------------------------------------------------
var $diagramLink = $('[openMT5File-button-click]');
$diagramLink.on('click', function(){
    var x = new XMLHttpRequest();
    x.open("GET", "../resources/MT5.bpmn", true);
    x.onreadystatechange = function () {
    if (x.readyState == 4 && x.status == 200){
        var doc = x.responseText;
        //var root = doc.documentElement;
        console.log(doc);
        xmlDiagram = doc;
        openDiagram(doc);
        }
    };
    x.send(null);
});
//------------------------------------------------------------------

//Open diagram from link on click-----------------------------------
//------------------------------------------------------------------
var $diagramLink = $('[simpleScan-button-click]');
$diagramLink.on('click', function(){
    var x = new XMLHttpRequest();
    x.open("GET", "../resources/simplescan.bpmn", true);
    x.onreadystatechange = function () {
    if (x.readyState == 4 && x.status == 200){
        var doc = x.responseText;
        //var root = doc.documentElement;
        console.log(doc);
        xmlDiagram = doc;
        openDiagram(doc);
        }
    };
    x.send(null);
});
//------------------------------------------------------------------

//Open diagram from link on click-----------------------------------
//------------------------------------------------------------------
var $diagramLink = $('[defBlockStr-button-click]');
$diagramLink.on('click', function(){
    var x = new XMLHttpRequest();
    x.open("GET", "../resources/Blockstructure-2LevelPlus.bpmn", true);
    x.onreadystatechange = function () {
    if (x.readyState == 4 && x.status == 200){
        var doc = x.responseText;
        //var root = doc.documentElement;
        console.log(doc);
        xmlDiagram = doc;
        openDiagram(doc);
        }
    };
    x.send(null);
});
//------------------------------------------------------------------

//Open diagram from link on click-----------------------------------
//------------------------------------------------------------------
var $diagramLink = $('[defAndStr-button-click]');
$diagramLink.on('click', function(){
    var x = new XMLHttpRequest();
    x.open("GET", "../resources/Blockstructure-AND.bpmn", true);
    x.onreadystatechange = function () {
    if (x.readyState == 4 && x.status == 200){
        var doc = x.responseText;
        //var root = doc.documentElement;
        console.log(doc);
        xmlDiagram = doc;
        openDiagram(doc);
        }
    };
    x.send(null);
});
//------------------------------------------------------------------

//Adjust the pace if the pace button is clicked---------------------
//------------------------------------------------------------------
var $input = $('[pace-click]');
$input.on('change', function(){
    var newval=$(this).val();
    //logExp("clickPrc1AnimButtonPace "+newval, particId);
	if(appType.indexOf('PRIMEWeb') != -1){
    	logExp(particId+" clickPrc1AnimButtonPace "+newval, "WebLogger");
	}
    timerCoef = (-1)*newval;
});
//------------------------------------------------------------------

//Finalize the animation and go to questions-----------------------
//-----------------------------------------------------------------
var $buttonanimFinish = $('[animFinish-button-click]');
$buttonanimFinish.on('click', function(){
    //location.reload(); 
    var response;
    console.log('seconds ' +parseInt(inSeconds));
    if(parseInt(inSeconds) > 0){
        response = confirm("Your suggested time did not finish yet. We suggest you to work more on it.\n Click OK to finish and Cancel to continue.");
    }else{
        response = confirm("Are you sure you want to finish?\n Click OK to finish and Cancel to continue.");
    }
    if(response == true){
        //logExp("finishPrc1Anim", particId);
        var runType = particId.slice(-1);
        window.open('process1_survey.html?ID='+particId,'_parent',false);
    }else{
        //numOfRepeats++;
    }
});
//-----------------------------------------------------------------

//Show filters (experimental)---------------------------------------
var $filters = $('[showFilters-button-click]');
$filters.on('click', function(){
    populateRoleDropdown();
    var newval=$filters.text();
    if(newval.indexOf("Show Filters") != -1){
        //if not clicked before and now clicked, show the filters
        $filters.text("Hide Filters");
        $('#filterNavbar').show();
    }else{
        $filters.text("Show Filters");
        //document.getElementById("showFilters").textContent="Show Filters";
        $('#filterNavbar').hide();
    }
});
//------------------------------------------------------------------

//Filter check box(experimental)------------------------------------
var $roleFilterCheck = $('[roleFilter-click]');
$roleFilterCheck.on('click', function(){
    populateRoleDropdown();
    var newval = $roleFilterCheck.is(':checked');
    if(newval == true){
        $roleList.attr("disabled", false);
        isRoleBasedAnimSelected = true;
        $('[animStep-button-click]').prop('disabled', true);
        //if enabled, the first role in the dropdown menu will be selected by default
        var roleNameFilter=$('[roleList-dropdown-click]').val();
        for(var i = 0; i < lanes.length; i++){
            if(lanes[i].laneName == roleNameFilter){
                roleIdtobeAnimated = lanes[i].laneId;
            }else{
                viewer.get('canvas').addMarker(lanes[i].laneId, 'lime');
            }
        }
        //also disable random click if this is enabled
        $('[randomFlow-click]').prop('disabled', true);
        isRandomFlowSelected = false;
    }else{
        $roleList.attr("disabled", true);
        //enable the stepped anim button only if the animation is not running
        if(isStepAnimSelected==false && isSelAnimSelected==false){
            $('[animStep-button-click]').prop('disabled', false);
        }
        isRoleBasedAnimSelected = false;
        //now we can also click random flow 
        $('[randomFlow-click]').prop('disabled', false);
    }
});
//------------------------------------------------------------------

//select an element from the rolelist dropdown (experimental)-------
//------------------------------------------------------------------
var $roleList = $('[roleList-dropdown-click]');
$('#filteringDiv').on('change', $roleList, function(){
    var roleNameFilter=$roleList.val();
    for(var i = 0; i < lanes.length; i++){
        if(lanes[i].laneName == roleNameFilter){
            roleIdtobeAnimated = lanes[i].laneId;
            return;
        }
    }
});
//------------------------------------------------------------------

//Random flow check (experimental)----------------------------------
//------------------------------------------------------------------
var $randomFlowCheck = $('[randomFlow-click]');
$randomFlowCheck.on('click', function(){
    var newval = $randomFlowCheck.is(':checked');
    if(newval == true){
        isRandomFlowSelected=true;
        //disable role filter click and remove assignments
        $('[roleFilter-click]').prop('disabled', true);
        $('[roleList-dropdown-click]').prop('disabled', true);
        isRoleBasedAnimSelected = false;
        roleIdtobeAnimated;
    }else{
        isRandomFlowSelected=false;
        //enable role filter click and return to previous settings
        $('[roleFilter-click]').prop('disabled', false);
        $('[roleList-dropdown-click]').prop('disabled', false);
        $('[roleFilter-click]').attr('checked', false);
    }
});

//veryFirstAnimButton, nowPlayAnimButton and replayExButton are only applicable for Exp2
//------------------------------------------------------------------
var $veryFirstAnimButton = $('[veryFirstAnim-button-click]');
$veryFirstAnimButton.on('click', function(){
    //logExp("FirstExampleCasePlayed ", particId);
    $('[canvasOverlayArea]').hide(); 
    $('[canvasVideoArea]').show();
    document.getElementsByTagName('video')[0].play();
});

//------------------------------------------------------------------
var $nowPlayAnimButton = $('[nowPlayAnim-button-click]');
$nowPlayAnimButton.on('click', function(){
    //logExp("SelAnimInitiated ", particId);
    $('[canvasOverlayArea2]').hide(); 
    //$('[questionPart]').removeClass("questionsDivDisabled");
    $('[questionPart]').addClass("questionsDivEnabled");
    isStepAnimSelected = true;
    initiateAnimation();
});
//------------------------------------------------------------------

//------------------------------------------------------------------
var $replayExButton = $('[replayEx-button-click]');
$replayExButton.on('click', function(){
    //logExp("ExtraExampleCasePlayed ", particId);
    $('[canvasVideoArea]').show();
    document.getElementsByTagName('video')[0].play();
});
//------------------------------------------------------------------
//END BUTTON CLICK functions (based on tags on the html file)----------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------

//START TIMEOUT FUNCTIONS------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------

//Highlight the given object with given color in----
//given loop count timer----------------------------
//--------------------------------------------------
function doSetTimeoutObj(highId, loopCountC, color){
    var highIdd = highId;
    timeoutsArray[timeoutsArray.length] = setTimeout(function(){
        viewer.get('canvas').addMarker(highId, color);}
               , loopCountC);
}
//Clean object before marking it with something new------
//-------------------------------------------------------
function doSetTimeoutCleanObj(highId, loopCountC, color){
    var highIdd = highId;
    timeoutsArray[timeoutsArray.length] = setTimeout(function(){
        viewer.get('canvas').removeMarker(highId, color);}
               , loopCountC);
}
//Highlight the given flow with given color in------
//given loop count timer----------------------------
//--------------------------------------------------
function doSetTimeoutFlow(seqFlow1, loopCountC, color){
    //var myTimer = setTimeout(setMarker(highIdd, canvasA), loopCountC);//nextObjectin bas
    timeoutsArray[timeoutsArray.length] = setTimeout(function(){
        //color only the first sequence flow
        var outgoingGfx = viewer.get('elementRegistry').getGraphics(seqFlow1.id);
        outgoingGfx.select('path').attr({stroke: color});
    }, loopCountC);
}
//alert the user at the end of the animation------
//--------------------------------------------------
function doSetTimeoutEndAlert(loopCountC){
    //var myTimer = setTimeout(setMarker(highIdd, canvasA), loopCountC);//nextObjectin bas
    timeoutsArray[timeoutsArray.length] = setTimeout(function(){
        //color only the first sequence flow
        alert('Please Restart to play the animation again.');
    }, loopCountC);
}
function doSetTimeoutResetandInitiate(loopCountC){
    //var myTimer = setTimeout(setMarker(highIdd, canvasA), loopCountC);//nextObjectin bas
    timeoutsArray[timeoutsArray.length] = setTimeout(function(){
        //color only the first sequence flow
        resetandInitiateAnim();
    }, loopCountC);
}
//END TIMEOUT FUNCTIONS------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------

//Start the animation------------------------------------------------
//-------------------------------------------------------------------
function initiateAnimation(){
    //either when a button is clicked or user opens the page for the first time or returns back to start.
    if(appType.indexOf('Exp2') != -1){
		$('[animStep-button-click]').prop('disabled', false);
	}else if(appType.indexOf('PRIMEWeb') != -1){
		$('[animStep-button-click]').prop('disabled', true);
	}
    $('[animSel-button-click]').prop('disabled', true);
    //disable also role selection filters
    $('[roleFilter-click]').prop('disabled', true);
    $('[roleList-dropdown-click]').prop('disabled', true);
    $('[randomFlow-click]').prop('disabled', true);

    canvas = viewer.get('canvas');
    overlays = viewer.get('overlays');
    //timerCoef = 800;
    //butun elemanlarin uzerinden dolasip And diverging gateway olanlari bulup source seqlari ata
    elementRegistry = viewer.get('elementRegistry');
    var allElements = elementRegistry.getAll();
    setConvergingParallelGatewayArray(allElements);
    markSeqInOrder();
}
//-------------------------------------------------------------------

//Function to reset everything. Use at restart, when the animation reaches the end or started again. 
//-------------------------------------------------------------------
function resetAll(){
    loopCount=0;
    //timerCoef=0;             //adjust the pace
    isStepAnimSelected=false;//if stepwise or cont animation selected
    //Not for Exp2. Only selanim used in Exp2
    if(appType.indexOf('PRIMEWeb') != -1){
		isSelAnimSelected=false;
	}
    isJustFollowNext=false;  //if only the following node needs to be clicked in stepwise anim
    nodetobeClicked.length=0; //list of nodes that need to be clicked

    isPathSelected=false;
    isMultipleStartEvents=false;  //if there are multiple start events, user needs to select one
    selectedSeqFlowPathNum=0;
    selectedElementId=0;            //the id of the clicked element 
    seqFlowstobeClicked.length=0;
    andGatewaysMerged.length=0;
    gatewayCombination.length=0;
    allObjects.length=0;
    startEvents.length=0;
    lanes.length=0;
    //Initiation for Exp2
    numofPrcDTaskDEnabled = 0;
    numofPrcDTaskEEnabled = 0;
    numofPrcDTaskGEnabled=0;
    numofPrcDTaskHEnabled = 0;
    numofPrcDTaskHExecuted = 0;
    numofPrcDTaskFEnabled=0;
    numofPrcDTaskNEnabled=0;
    numofPrcDUpperANDHEnabled = 0;
    numofPrcDLowerANDHEnabled = 0;
    numofPrcDANDHEnabled = 0;
    isSeqFlowClickedAfterHExecutedOnce=false;
    //--------
    prcTLTaskMExecuted = false;
    prcTLTaskNExecuted = false;
    prcTLConvOrEnabled = false;
    prcTLConvOrExecuted = false;
    //-----------
    prcLTaskAExecuted = false;
    prcLTaskBExecuted = false;
    prcLConvOrEnabled = false;
    prcLConvOrExecuted = false;
    //-------------
    prcTLOTaskJExecuted = false;
    prcTLOTaskKExecuted = false;
    prcTLOTaskLExecuted = false;
    prcTLOTaskFExecuted = false;
    prcTLOInnerConvOrEnabled = false;
    prcTLOInnerConvOrExecuted = false;
    prcTLOTaskAExecuted=false;
    prcTLOTaskGExecuted=false;
    prcTLOTaskIExecuted=false;
    prcTLOOuterConvORLowerSeqExecuted=false;
    prcTLOdidLowerPathReachOuterConvOr=false;
    //--------------
    numofPrcTLMTaskFEnabled = 0;
    //---------------
    numofPrcXFirstUpperXOREnabled = 0;
    numofPrcXTUpperRightConvXORTraced = 0;
    isSeqFlowClickedAfterDivXORExecutedOnceX = false;
    numofprcXTaskFEnabled = 0;
    //--------------
    prcR1LowerConvANDLeftPathPassed=false;
    prcR1LowerConvANDUpPathPassed=false;
    prcR1UpperConvANDLeftPathPassed=false;
    prcR1UpperConvANDUpPathPassed=false;
    //--------------
    numofPrcRMTaskKEnabled = 0;
    numofPrcRMANDNEnabled = 0;
    numofPrcRMLowerANDNEnabled = 0;
    numofPrcRMUpperANDNEnabled = 0;
    prcRMTaskLExecuted = false;
    prcRMTaskMExecuted = false;
    prcRMConvOrEnabled = false;
    prcRMConvOrExecuted = false;
    //--------------
    numofPrcR2TaskLEnabled = 0;
    numofPrcR2TaskMEnabled = 0;
    //------------ End of initiation for Exp2
    
    isCurObjInSelectedLane=false;
    //reset all timeouts
    for(var i=0; i<timeoutsArray.length; i++){
        clearTimeout(timeoutsArray[i]);
    }
    timeoutsArray.length=0;
    //openDiagram(xmlDiagram);
    //if role based anim is not selected before, enable it
    if(isRoleBasedAnimSelected == false){
        $('[animStep-button-click]').prop('disabled', false);
    }
    $('[animSel-button-click]').prop('disabled', false);
    //enable also role selection filters
    $('[roleFilter-click]').prop('disabled', false);
    if(isRoleBasedAnimSelected == true)
        $('[roleList-dropdown-click]').prop('disabled', false);
    if(isRoleBasedAnimSelected == false){
        $('[roleList-dropdown-click]').prop('disabled', true);
        $('[randomFlow-click]').prop('disabled', false);
    }
    //removed for Exp2. No update for the pace
	if(appType.indexOf('PRIMEWeb') != -1){
    	document.getElementById("paceclick").value = "-800";
	}
}
//-------------------------------------------------------------------

//To remove all paints on all elements in case of a reset.  
//-------------------------------------------------------------------
function removeAllHighlights(){
    var regElements = viewer.get('elementRegistry').getAll();
    for(var i = 0; i < regElements.length; i++){
        //console.log
        if(regElements[i].businessObject.$type.indexOf('SequenceFlow') != -1){
            var outgoingGfx = viewer.get('elementRegistry').getGraphics(regElements[i].businessObject.id); 
            outgoingGfx.select('path').attr({stroke: 'black'});
        }else{
            viewer.get('canvas').removeMarker(regElements[i].businessObject.id, 'highlight');
            viewer.get('canvas').removeMarker(regElements[i].businessObject.id, 'highlight-light');
            viewer.get('canvas').removeMarker(regElements[i].businessObject.id, 'highlight-toselect');
        }
    }
}
//-------------------------------------------------------------------

//reset both the parameters and remove the paints.-------------------
//-------------------------------------------------------------------
function resetandInitiateAnim(){
    resetAll();
    removeAllHighlights();
    //openDiagram(xmlDiagram);
    //initiateAnimation();
}

//Parse all converging parallel gateways at the beginning of the animation----
//----------------------------------------------------------------------------
function setConvergingParallelGatewayArray(allElements){
    for(var i=0; i<allElements.length; i++){
        if((allElements[i].businessObject.$type.indexOf('ParallelGateway') != -1  || allElements[i].businessObject.$type.indexOf('InclusiveGateway') != -1) && allElements[i].businessObject.gatewayDirection.indexOf('Converging') != -1){
            //when we find a converging paralel, we willl assign all its incomings to our array
            for(var k=0; k<allElements[i].businessObject.get('incoming').length;k++){
                //let's check if the same value exists. If not, let's add it. 
                var isThereDuplicate=false;
                for(var l=0; l<andGatewaysMerged.length;l++){
                    if(andGatewaysMerged[l].convAnd ==allElements[i].businessObject.id && 
                      andGatewaysMerged[l].incSeqFlowId ==allElements[i].businessObject.get('incoming')[k].id)
                        isThereDuplicate=true;
                }
                if(isThereDuplicate==false){
                    andGatewaysMerged.push({
                        convAnd: allElements[i].businessObject.id,
                        incSeqFlowId: allElements[i].businessObject.get('incoming')[k].id,
                        didFlowMerge: false
                    });
                }
            }
        }
    }
}
//------------------------------------------------------------------------------

//Initiate the animation by finding start events and then triggering recursion----
//--------------------------------------------------------------------------------
function markSeqInOrder(){
    elementRegistry = viewer.get('elementRegistry');
    //find all start events and mark them to let user select one
    var index = 0;//we will not push the events with odd numbers
    //because then, it pushes both the shape and its label
    var elements = elementRegistry.filter(function(element) {
      if(is(element, 'bpmn:StartEvent')){
          index++;
          if(index % 2 == 0){//sadece ilk shapei ekleyecegiz
              var startEventShape = elementRegistry.get(element.id);
              var strtEventToParse = startEventShape.businessObject;//Base 
              startEvents.push(strtEventToParse);
          }
      }
    });
    console.log('did we find sequence flow?');
    console.log(startEvents[0].get('outgoing')[0]);
    findGatewayCouples(startEvents[0].get('outgoing')[0]);
    console.log('did we find couple ANDs?');
    console.log(gatewayCombination);
    //var startEvent = startEvents[0];
    if(startEvents.length == 1){//if there is one start event, we start the animation and continue 
        markObjectAndSeqFlow(startEvents[0].id, 'highlight', 'lime');
        var currShape = elementRegistry.get(startEvents[0].id);
        var currShapeType = currShape.type;//bpmn:StartEvent
        var objToParse = currShape.businessObject;//Base 
        if(objToParse.get('outgoing')[0] === undefined)
            return;
        var seqFlow = objToParse.get('outgoing');
        var pathNum = seqFlow.length;
        if(pathNum == 1){
            findNextObject(seqFlow[0]);
        }
    }else{//if there is more than one start event, the user needs to select one
        isMultipleStartEvents = true;
        for(var i=0; i< startEvents.length;i++){
            //kullanicinin secmesi gerekenleri isaretliyoruz
            markObject(startEvents[i].id, 'highlight-toselect');
        }
    }
}
//-----------------------------------------------------------------------------------

//Recursive animation basically doing all the stuff for both stepwise and regular----
//-----------------------------------------------------------------------------------
function findNextObject(seqFlowToParse){
    var nextObject = seqFlowToParse.targetRef;
    var nextObjectType = nextObject.$type;
    if(nextObjectType.indexOf('EndEvent') != -1){
        loopCount+=2;
        markObject(nextObject.id, 'highlight');
        loopCount+=10;
        numOfRepeats++;
        //logExp("endEventPrc1Anim "+numOfRepeats, particId);
		if(appType.indexOf('Exp2') != -1){
        	logExp("endEventReached "+processName+' repno '+numOfRepeats, particId);
        }else if(appType.indexOf('PRIMEWeb') != -1){
			logExp(particId+" endEventPrc1Anim "+numOfRepeats, "WebLogger");
        }
		//Alert user that the animation will start again.
        //Removed for Experiment 2
		if(appType.indexOf('PRIMEWeb') != -1){
        	doSetTimeoutEndAlert(timerCoef*(loopCount+1));
		}
        loopCount+=1;
        //resetAll();
        //Below four lines removed for Experiment 2
		if(appType.indexOf('PRIMEWeb') != -1){
	        var tempLoopCount = loopCount;
	        doSetTimeoutResetandInitiate(timerCoef*(tempLoopCount));
	        //It does the same when the button is pressed.  
	        loopCount = tempLoopCount;
		}
    }
    else if(nextObjectType.indexOf('Task') != -1 || nextObjectType.indexOf('Event') != -1
           || nextObjectType.indexOf('SubProcess') != -1){
        var seqFlow = nextObject.get('outgoing');
        //identify if role based selected, in current lane
        isCurObjInSelectedLane = false;
        if(lanes.length >0){
            var curLaneId = nextObject.lanes[0].id;
        }
        if(isRoleBasedAnimSelected == true && roleIdtobeAnimated.indexOf(curLaneId) != -1){
            isCurObjInSelectedLane = true;
        }
        
        if(isStepAnimSelected == true){
            markCleanObject(nextObject.id, 'highlight');
            markCleanObject(nextObject.id, 'highlight-light');
            loopCount++;
            markObject(nextObject.id, 'highlight-light');
            loopCount++;
            isJustFollowNext=true;
            nodetobeClicked.push(nextObject.id);
            return;
        }
        //check if role filtering is active
        if(isRoleBasedAnimSelected == false || (isRoleBasedAnimSelected == true && isCurObjInSelectedLane == true)){
            markCleanObject(nextObject.id, 'highlight');
            markObjectAndSeqFlow(nextObject.id, 'highlight', 'lime');
            loopCount++;
            isCurObjInSelectedLane = false;
            findNextObject(seqFlow[0]);
        }else{//if role based anim selected but the object is not in the selected lane
            //markCleanObject(nextObject.id, 'highlight');
            //markObjectAndSeqFlow(nextObject.id, 'highlight', 'lime');
            //loopCount++;
            findNextObject(seqFlow[0]);
        }
    }else if((nextObjectType.indexOf('ExclusiveGateway') !=-1) 
             && nextObject.gatewayDirection == "Diverging"){
        var seqFlow = nextObject.get('outgoing');
        var pathNum = seqFlow.length;
        //check if role based anim is selected and if the object is in the selected lane
        isCurObjInSelectedLane = false;
        if(lanes.length >0){
            var curLaneId = nextObject.lanes[0].id;
        }
        if(isRoleBasedAnimSelected == true && roleIdtobeAnimated.indexOf(curLaneId) != -1){
            isCurObjInSelectedLane = true;
        }
        
        if(isRoleBasedAnimSelected == false || isCurObjInSelectedLane == true){
            markCleanObject(nextObject.id, 'highlight');
            loopCount++;
            markObject(nextObject.id, 'highlight');
        }
        for(var i=0; i<pathNum;i++){
            seqFlowstobeClicked.push({
                relatedXOR: nextObject.id, 
                seqFlowId: seqFlow[i].id});
            if(isRandomFlowSelected == false && ((isRoleBasedAnimSelected == false) || (isRoleBasedAnimSelected == true && isCurObjInSelectedLane == true))){
                loopCount++;
                markSeqFlowwithGivenId(seqFlow[i].id, 'Magenta');
            }
        }
        console.log('which ones to click: ');
        console.log(seqFlowstobeClicked);
        
        if(isRandomFlowSelected == true || (isRoleBasedAnimSelected == true && isCurObjInSelectedLane == false)){//if obj in another lane, assign selection randomly
            var randomSelectedPath = Math.floor((Math.random() * pathNum)+1)-1;
            //findNextObject(seqFlow[(randomSelectedPath)]);
            //TODO: Check this following conditions. Can be wrong.
            if(isRandomFlowSelected == true || (isRoleBasedAnimSelected == false || (isRoleBasedAnimSelected == true && isCurObjInSelectedLane == true))){
                markSeqFlowwithGivenId(seqFlow[randomSelectedPath].id, 'Magenta');
                loopCount++;
                markSeqFlowwithGivenId(seqFlow[randomSelectedPath].id, 'lime');
            }
            var shape1 = elementRegistry.get(seqFlow[randomSelectedPath].id);
            eventBus.fire('element.click', { element: shape1 });
        }
        return;
        
    }else if((nextObjectType.indexOf('ExclusiveGateway') !=-1) && nextObject.gatewayDirection == "Converging"){
        //check if role based anim is selected and if the object is in the selected lane
        isCurObjInSelectedLane = false;
        if(lanes.length >0){
            var curLaneId = nextObject.lanes[0].id;
        }
        if(isRoleBasedAnimSelected == true && roleIdtobeAnimated.indexOf(curLaneId) != -1){
            isCurObjInSelectedLane = true;
        }
        //We remove the following part so that in stepAnim, it automatically flows through converging XOR. There is no need for the user to select the gateway. If we prefer it to be clicked by the user as well, we need to enable this. 
        /*if(isStepAnimSelected == true){
            markCleanObject(nextObject.id, 'highlight');
            loopCount++;
            markObject(nextObject.id, 'highlight-light');
            isJustFollowNext=true;
            nodetobeClicked.push(nextObject.id);
            return;
        }*/
		if(appType.indexOf('Exp2') != -1){
	        //Specific to Exp2 ProcessD-Similar. If XOR before D, E and G is traversed twice, set the parameter. 
	        if(nextObject.id.indexOf('sid-3A5661A0-3267-4EDC-B98F-EDD80290D10E') != -1 && processName.indexOf('ProcessD-Similar') != -1){
	            numofPrcDTaskDEnabled++;
	        }else if(nextObject.id.indexOf('sid-940B7FE8-962D-4925-9872-FC566EB65609') != -1 && processName.indexOf('ProcessD-Similar') != -1){
	            numofPrcDTaskEEnabled++;//convergin XOR before E
	        }else if(nextObject.id.indexOf('sid-E2AC263C-7EDB-47BE-BC88-86E7C484A833') != -1 && processName.indexOf('ProcessD-Similar') != -1){
	            numofPrcDTaskGEnabled++;
	        }else if(nextObject.id.indexOf('sid-F0C72DE7-CF23-4695-B219-61A477D9145D') != -1 && processName.indexOf('ProcessD-Similar') != -1){
	            numofPrcDLowerANDHEnabled++;     //Conv XOR before H is enabled
	        }
	        //Specific to Exp2 TwoLevel-Mismatch. If XOR before D is traversed twice, set the parameter
	        else if(nextObject.id.indexOf('sid-ACF5969B-0BF1-4602-BFE9-9F91FE5AC2F4') != -1 && processName.indexOf('TwoLevel-Mismatch') != -1){
	            numofPrcTLMTaskFEnabled++;     //Conv XOR before F is enabled
	        }
	        //Specific to Exp2 ProcessX-Similar. If upper first XOR is reached now, decrease the number of enable
	        else if(nextObject.id.indexOf('sid-8EC6FCBE-50B3-42A2-A228-45E0C727D803') != -1 && processName.indexOf('ProcessX-Similar') != -1){
	            numofPrcXFirstUpperXOREnabled--;  
	            //if(numofPrcXFirstUpperXOREnabled > 0){
	                loopCount++;
	                markCleanObject(nextObject.id, 'highlight');
	                markCleanObject(nextObject.id, 'highlight-light');
	                loopCount++;
	                markObject(nextObject.id, 'highlight');
	            //}
	        }//if upper right conv XOR is reached now, increase the number of trace on it. 
	        else if(nextObject.id.indexOf('sid-778708D4-C8F4-4C3D-9C31-60024132FB63') != -1 && processName.indexOf('ProcessX-Similar') != -1){
	            numofPrcXTUpperRightConvXORTraced++;  
	            if(isSeqFlowClickedAfterDivXORExecutedOnceX == true){
	                //no need to take care of double seq flow selection any more. 
	                numofPrcXTUpperRightConvXORTraced = 0;
	            }
	        }else if(nextObject.id.indexOf('sid-F6D76510-1E47-4425-84CC-4F129DF25A7F') != -1 && processName.indexOf('ProcessX-Similar') != -1){
	            numofprcXTaskFEnabled++;//convergin XOR before F
	        }
	        //for Exp2 PrcRM. If XOR before E is traversed twice, set the parameter. 
	        else if(nextObject.id.indexOf('sid-70C3355A-9E32-41FE-B682-AE841D1D23F9') != -1 && processName.indexOf('ReworkMismatch') != -1){
	            numofPrcRMTaskKEnabled++;//convergin XOR before K
	        }
	        //The following is for Rigid2. L and M is enabled twice
	        else if(nextObject.id.indexOf('sid-B9874E20-F6E2-4772-B35C-59992AC58E76') != -1 && processName.indexOf('Rigid2') != -1){
	            numofPrcR2TaskLEnabled++;//convergin XOR before E
	        }
	        //end of Exp2 specific. 
		}//end of check appType=Exp2
        
        if(isRoleBasedAnimSelected == false || isCurObjInSelectedLane == true){
            markCleanObject(nextObject.id, 'highlight');
            markObjectAndSeqFlow(nextObject.id, 'highlight', 'lime');
            isCurObjInSelectedLane = false;
        }
        var seqFlow = nextObject.get('outgoing');
        findNextObject(seqFlow[0]);
    }
    else if((nextObjectType.indexOf('ParallelGateway') !=-1  || nextObjectType.indexOf('InclusiveGateway') !=-1) 
             && nextObject.gatewayDirection == "Converging"){
		if(appType.indexOf('Exp2') != -1){
        //Only for Exp2 ProcessD-Similar. Before H, we will check the number of visits to upper and lower seq flows. 
        if(nextObject.id.indexOf('sid-C9870141-F3CA-413D-BFE3-DDB21B3D6362') != -1 && processName.indexOf('ProcessD-Similar') != -1){
            //if we have reached the correct AND, let's see the seq flows
            var isFlowAfterANDEnabled = false;
            if(numofPrcDLowerANDHEnabled >0 && numofPrcDUpperANDHEnabled >0){
                //the flow can continue to next.
                markCleanObject(nextObject.id, 'highlight');
                loopCount++;
                markObject(nextObject.id, 'highlight');
                isFlowAfterANDEnabled = true;
                numofPrcDLowerANDHEnabled--;
                numofPrcDUpperANDHEnabled--;
                numofPrcDANDHEnabled++; 
                numofPrcDTaskHEnabled++;
            }
            //Before we continue, mark the seq flow with missing exec 
            var upperSeqFlowID = 'sid-DF2D6D3F-A69F-4B84-BE6C-398950E96C14';
            var lowerSeqFlowID = 'sid-EF7A2AAF-7EE6-4904-9523-4890F4928EE4';
            if((numofPrcDLowerANDHEnabled > numofPrcDUpperANDHEnabled) && numofPrcDANDHEnabled > 0){
                markSeqFlowwithGivenId(upperSeqFlowID, 'black');
            }else if((numofPrcDUpperANDHEnabled > numofPrcDLowerANDHEnabled) && numofPrcDANDHEnabled > 0){
                markSeqFlowwithGivenId(lowerSeqFlowID, 'black');
            }//if they are both 0, don't do anything. 
            
            //continue with routine flow to the next item
            if(isFlowAfterANDEnabled == true){
                var seqFlow = nextObject.get('outgoing');
                var pathNum = seqFlow.length;
                for(var i=0; i<pathNum;i++){
                    if(isRoleBasedAnimSelected == false || isCurObjInSelectedLane == true){
                        loopCount++;
                        markSeqFlowwithGivenId(seqFlow[i].id, 'lime');
                    }
                    findNextObject(seqFlow[i]);
                }
            }
            return; //return so that regular stuff is not executed specific to this AND.
        }//for Exp2 PrcTL. When it comes to converging OR, wait for M or N. 
        else if(nextObject.id.indexOf('sid-B9FCF1BF-2060-48F4-8667-E6BB8B0C2870') != -1 && processName.indexOf('ThreeLevel') != -1){
            if(prcTLTaskMExecuted == true && prcTLTaskNExecuted == true){
                //we want it to continue like regular conv AND. Do nothing special, just continue. Only remove from the node to be clicked so that it can continue. 
                for(var n=0; n<nodetobeClicked.length;n++){
                    if(nodetobeClicked[n].indexOf(nextObject.id) != -1){ 
                        nodetobeClicked.splice(n, 1);
                    }
                }
                isJustFollowNext=false;
                prcTLTaskMExecuted = false;
                prcTLTaskNExecuted = false;
            }else{
                markCleanObject(nextObject.id, 'highlight');
                loopCount++;
                markObject(nextObject.id, 'highlight-light');
                isJustFollowNext=true;
                nodetobeClicked.push(nextObject.id);
            }
        }
        //for Exp2 PrcL-Similar. When it comes to first converging OR, wait for A or B. 
        else if(nextObject.id.indexOf('sid-D4CD6B85-92DA-45F6-BCCB-F9289102B5AA') != -1 && processName.indexOf('ProcessL-Similar') != -1){
            if(prcLTaskAExecuted == true && prcLTaskBExecuted == true){
                //we want it to continue like regular conv AND. Do nothing special, just continue. Only remove from the node to be clicked so that it can continue. 
                for(var n=0; n<nodetobeClicked.length;n++){
                    if(nodetobeClicked[n].indexOf(nextObject.id) != -1){ 
                        nodetobeClicked.splice(n, 1);
                    }
                }
                isJustFollowNext=false;
                prcLTaskAExecuted = false;
                prcLTaskBExecuted = false;
            }else{
                //then color conv OR regularly
                markCleanObject(nextObject.id, 'highlight');
                loopCount++;
                markObject(nextObject.id, 'highlight-light');
                isJustFollowNext=true;
                nodetobeClicked.push(nextObject.id);
            }
        }
        //for Exp2 PrcL-Similar. When it comes to last converging OR, behave exactly like XOR
        else if(nextObject.id.indexOf('sid-7C6432B3-1582-43C3-AB0B-2E8C25312353') != -1 && processName.indexOf('ProcessL-Similar') != -1){
            markCleanObject(nextObject.id, 'highlight');
            markObjectAndSeqFlow(nextObject.id, 'highlight', 'lime');
            isCurObjInSelectedLane = false;
            var seqFlow = nextObject.get('outgoing');
            findNextObject(seqFlow[0]);
            //this is all the same as whan an XOR does. Then, we return so that AND behavior is not performed. 
            return;
        }
        //for Exp2 PrcTLO (TwoLevel-OR). When it comes to converging OR, wait for J, K or L. 
        else if(nextObject.id.indexOf('sid-84238CE5-A20F-4E5B-A6C8-B286CEABE731') != -1 && processName.indexOf('TwoLevel-OR') != -1){
            if(prcTLOTaskJExecuted == true && prcTLOTaskKExecuted == true && prcTLOTaskLExecuted == true){
                //we want it to continue like regular conv AND. Do nothing special, just continue. Only remove from the node to be clicked so that it can continue. 
                for(var n=0; n<nodetobeClicked.length;n++){
                    if(nodetobeClicked[n].indexOf(nextObject.id) != -1){ 
                        nodetobeClicked.splice(n, 1);
                    }
                }
                isJustFollowNext=false;
                prcTLOTaskJExecuted = false;
                prcTLOTaskKExecuted = false;
                prcTLOTaskLExecuted = false;
            }else{
                markCleanObject(nextObject.id, 'highlight');
                loopCount++;
                markObject(nextObject.id, 'highlight-light');
                isJustFollowNext=true;
                
                var isInnerConvORInNodetoClickList=false;
                for(var n=0; n<nodetobeClicked.length;n++){
                    if(nodetobeClicked[n].indexOf(nextObject.id) != -1){ 
                        isInnerConvORInNodetoClickList=true;
                    }
                }
                if(isInnerConvORInNodetoClickList == false){
                    nodetobeClicked.push(nextObject.id);
                }
            }
        }
        //Prc TLO outer OR converging. When it arrives here automatically, expect F or lower path to be executed to automatically move forward. 
        else if(nextObject.id.indexOf('sid-BDF017DE-8C00-4CE1-9A3F-C254D51AF719') != -1 && processName.indexOf('TwoLevel-OR') != -1){
            if(prcTLOTaskFExecuted == true && prcTLOOuterConvORLowerSeqExecuted == true){
                //we want it to continue like regular conv AND. Do nothing special, just continue. Only remove from the node to be clicked so that it can continue. 
                for(var n=0; n<nodetobeClicked.length;n++){
                    if(nodetobeClicked[n].indexOf(nextObject.id) != -1){ 
                        nodetobeClicked.splice(n, 1);
                    }
                }
                isJustFollowNext=false;
                prcTLOTaskFExecuted = false;
                prcTLOOuterConvORLowerSeqExecuted = false;  
            }else{
                //we can't just move on. We either wait for paths to be completed, or the user to specifically click
                //but before, mark which side approached OR so that we can check the other one. 
                if(prcTLOTaskFExecuted == true){
                    prcTLOdidLowerPathReachOuterConvOr = false;
                }
                if(prcTLOOuterConvORLowerSeqExecuted == true){
                    prcTLOdidLowerPathReachOuterConvOr = true;
                }
                markCleanObject(nextObject.id, 'highlight');
                loopCount++;
                markObject(nextObject.id, 'highlight-light');
                isJustFollowNext=false;
                nodetobeClicked.push(nextObject.id);
            }
        }
        //for Exp2 PrcX-Similar. When it comes to small converging OR, behave exactly like XOR
        else if(nextObject.id.indexOf('sid-CE9387DC-4E4B-4A7E-802A-C6501A5FAE0B') != -1 && processName.indexOf('ProcessX-Similar') != -1){
            markCleanObject(nextObject.id, 'highlight');
            markObjectAndSeqFlow(nextObject.id, 'highlight', 'lime');
            isCurObjInSelectedLane = false;
            var seqFlow = nextObject.get('outgoing');
            findNextObject(seqFlow[0]);
            //this is all the same as whan an XOR does. Then, we return so that AND behavior is not performed. 
            return;
        }
        //for Exp2 PrcRM. Before N, we will check the number of visits to upper and lower seq flows. 
        else if(nextObject.id.indexOf('sid-59C381B7-D2E1-4DE2-8332-7EA882CF7311') != -1 && processName.indexOf('ReworkMismatch') != -1){
            //if we have reached the correct AND, let's see the seq flows
            var isFlowAfterANDEnabledprcRM = false;
            if(numofPrcRMLowerANDNEnabled >0 && numofPrcRMUpperANDNEnabled >0){
                //the flow can continue to next.
                markCleanObject(nextObject.id, 'highlight');
                loopCount++;
                markObject(nextObject.id, 'highlight');
                isFlowAfterANDEnabledprcRM = true;
                numofPrcRMLowerANDNEnabled--;
                numofPrcRMUpperANDNEnabled--;
                numofPrcRMANDNEnabled++; 
                //numofPrcRMTaskKEnabled++;
            }
            //Before we continue, mark the seq flow with missing exec 
            var upperSeqFlowID = 'sid-A2A96D21-BF89-4684-91DA-91BA05C97D5C';
            var lowerSeqFlowID = 'sid-0BDCEA15-EF07-4776-8A70-65065F52D118';
            if((numofPrcRMLowerANDNEnabled > numofPrcRMUpperANDNEnabled) && numofPrcRMANDNEnabled > 0){
                markSeqFlowwithGivenId(upperSeqFlowID, 'black');
            }else if((numofPrcRMUpperANDNEnabled > numofPrcRMLowerANDNEnabled) && numofPrcRMANDNEnabled > 0){
                markSeqFlowwithGivenId(lowerSeqFlowID, 'black');
            }//if they are both 0, don't do anything. 
            
            //continue with routine flow to the next item
            if(isFlowAfterANDEnabledprcRM == true){
                var seqFlow = nextObject.get('outgoing');
                var pathNum = seqFlow.length;
                for(var i=0; i<pathNum;i++){
                    if(isRoleBasedAnimSelected == false || isCurObjInSelectedLane == true){
                        loopCount++;
                        markSeqFlowwithGivenId(seqFlow[i].id, 'lime');
                    }
                    findNextObject(seqFlow[i]);
                }
            }
            return; //return so that regular stuff is not executed specific to this AND.
        }
        //for Exp2 PrcRM. When it comes to converging OR, wait for L or M. 
        else if(nextObject.id.indexOf('sid-B81EBBF3-9866-4EC9-9B02-B3555F51CC6F') != -1 && processName.indexOf('ReworkMismatch') != -1){
            if(prcRMTaskLExecuted == true && prcRMTaskMExecuted == true){
                //we want it to continue like regular conv AND. Do nothing special, just continue. Only remove from the node to be clicked so that it can continue. 
                for(var n=0; n<nodetobeClicked.length;n++){
                    if(nodetobeClicked[n].indexOf(nextObject.id) != -1){ 
                        nodetobeClicked.splice(n, 1);
                    }
                }
                isJustFollowNext=false;
                prcRMTaskLExecuted = false;
                prcRMTaskMExecuted = false;
            }else{
                markCleanObject(nextObject.id, 'highlight');
                loopCount++;
                markObject(nextObject.id, 'highlight-light');
                isJustFollowNext=true;
                nodetobeClicked.push(nextObject.id);
            }
        }
        //for Exp2 Prc Rigid3. When it comes to converging OR, behave exactly like XOR
        else if(nextObject.id.indexOf('sid-D228B2B1-440C-4808-9CE0-54DE3F22F92E') != -1 && processName.indexOf('Rigid3') != -1){
            markCleanObject(nextObject.id, 'highlight');
            markObjectAndSeqFlow(nextObject.id, 'highlight', 'lime');
            isCurObjInSelectedLane = false;
            var seqFlow = nextObject.get('outgoing');
            findNextObject(seqFlow[0]);
            //this is all the same as whan an XOR does. Then, we return so that AND behavior is not performed. 
            return;
        }
        ////////End of Exp2 specific part
        }//end of appType=Exp2 check. 

        //check if role based anim is selected and if the object is in the selected lane
        isCurObjInSelectedLane = false;
        if(lanes.length >0){
            var curLaneId = nextObject.lanes[0].id;
        }
        if(isRoleBasedAnimSelected == true && roleIdtobeAnimated.indexOf(curLaneId) != -1){
            isCurObjInSelectedLane = true;
        }
        
        //Before we continue with this converging, we should make sure that flow has come from all paths. 
        for(var i=0; i<andGatewaysMerged.length;i++){
            //let's find seq flow to parse and mark it
            if(andGatewaysMerged[i].convAnd== nextObject.id && andGatewaysMerged[i].incSeqFlowId== seqFlowToParse.id){
               //we found the right path, let's mark it. 
                andGatewaysMerged[i].didFlowMerge = true;
               }
        }
		if(appType.indexOf('Exp2') != -1){
	        //specific to Exp2 Process Rigid1. Manually set converging AND connections so that they are not reset at Diverging ANDs (because it is rigid)
	        if(seqFlowToParse.id.indexOf('sid-7FF192BC-979D-43D7-8908-92FD18A2C91C') != -1){
	            prcR1LowerConvANDLeftPathPassed = true;
	        }else if(seqFlowToParse.id.indexOf('sid-16CD2757-3CAC-4E22-8817-3BC8D17E7972') != -1){
	            prcR1LowerConvANDUpPathPassed = true;
	        }else if(seqFlowToParse.id.indexOf('sid-5F0FB445-C145-4BD6-842C-D3D0BAB05172') != -1){
	            prcR1UpperConvANDLeftPathPassed = true;
	        }else if(seqFlowToParse.id.indexOf('sid-57E90426-C41D-47ED-8E37-325C5F18D03E') != -1){
	            prcR1UpperConvANDUpPathPassed = true;
	        }
		}//end of appType=Exp2 check. 
        //------------
        
        //again, we will look at all andGatewayMerged array and check if all are marked. 
        var didAllIncomingPathsPassed=true;
        for(var j=0; j<andGatewaysMerged.length;j++){
            if(andGatewaysMerged[j].convAnd == nextObject.id){
                if(andGatewaysMerged[j].didFlowMerge == false){

                    didAllIncomingPathsPassed = false;//no, not all is finished, we cannot continue. 
                }
            }
        }
		if(appType.indexOf('Exp2') != -1){
	        //Specific to Exp2. We check for two Conv ANDs after the rigid structure manually and set the parameter manually
	        if(nextObject.id.indexOf('sid-12E98634-DE72-4316-985B-46348CFF56AB') != -1 && prcR1LowerConvANDLeftPathPassed == true && prcR1LowerConvANDUpPathPassed == true){
	            didAllIncomingPathsPassed = true;
	        }else if(nextObject.id.indexOf('sid-B9874E20-F6E2-4772-B35C-59992AC58E76') != -1 && prcR1UpperConvANDLeftPathPassed == true && prcR1UpperConvANDUpPathPassed == true){
	            didAllIncomingPathsPassed = true;
	        }
        
	        console.log('can we find the correct flow in OR?' + didAllIncomingPathsPassed);
		}//end of appType=Exp2 check
        if(didAllIncomingPathsPassed == true){
            //We remove the following part so that in stepAnim, it automatically flows through converging AND. There is no need for the user to select the gateway. If we prefer it to be clicked by the user as well, we need to enable this. 
            /*if(isStepAnimSelected == true){
                markCleanObject(nextObject.id, 'highlight');
                loopCount++;
                markObject(nextObject.id, 'highlight-light');
                isJustFollowNext=true;
                nodetobeClicked.push(nextObject.id);
                return;
            }*/
            if(isRoleBasedAnimSelected == false || isCurObjInSelectedLane == true){
                markCleanObject(nextObject.id, 'highlight');
                markCleanObject(nextObject.id, 'highlight-light');
                loopCount++;
                markObject(nextObject.id, 'highlight');
            }
            var seqFlow = nextObject.get('outgoing');
            var pathNum = seqFlow.length;
            for(var i=0; i<pathNum;i++){
                if(isRoleBasedAnimSelected == false || isCurObjInSelectedLane == true){
                    loopCount++;
                    markSeqFlowwithGivenId(seqFlow[i].id, 'lime');
                }
                findNextObject(seqFlow[i]);
            }
        }
        isCurObjInSelectedLane = false;
    }
    else if((nextObjectType.indexOf('ParallelGateway') !=-1 || nextObjectType.indexOf('InclusiveGateway') !=-1)
            && nextObject.gatewayDirection == "Diverging"){
        
        //check if role based anim is selected and if the object is in the selected lane
        isCurObjInSelectedLane = false;
        if(lanes.length >0){
            var curLaneId = nextObject.lanes[0].id;
        }
        if(isRoleBasedAnimSelected == true && roleIdtobeAnimated.indexOf(curLaneId) != -1){
            isCurObjInSelectedLane = true;
        }
        
        //Before we continue the parallel path, we need to reset this fragment's marking information. 
        //Normally, this is not needed, but if the user selected Rework from an XOR option, this part
        //is required to reset and "repaint" the elements. 
        var convAndId = findConvAndofGivenDivAnd(nextObject.id);//buna karsilik gelen converging ne
        //for this converging, we will reset all andGatewaysMerged information (for all seq flows)
        for(var m=0; m < andGatewaysMerged.length; m++){
            if(andGatewaysMerged[m].convAnd.indexOf(convAndId) != -1){
                andGatewaysMerged[m].didFlowMerge = false;
            }
        }
        if(isRoleBasedAnimSelected == false || isCurObjInSelectedLane == true){
            markCleanObject(nextObject.id, 'highlight');
            loopCount++;
            markObject(nextObject.id, 'highlight');
        }
        var seqFlow = nextObject.get('outgoing');
        var pathNum = seqFlow.length;
        if(isRoleBasedAnimSelected == false || isCurObjInSelectedLane == true){
            for(var i=0; i<pathNum;i++){
                markSeqFlowwithGivenId(seqFlow[i].id, 'Lime');
                //we want to paint parallel paths concurrently so that the user understands paralellism
                //we will find the next object and follow in the next loop
                //Open the following line if you want to paint the first elements instantly. 
                //markObject(seqFlow[i].targetRef.id, 'highlight');
            }
        }
        isCurObjInSelectedLane = false;
        for(var k=0; k<pathNum;k++){
            findNextObject(seqFlow[k]);
        }
        //loopCount++;
    }
}
//----------------------------------------------------------------------------

//Paint the given object and the seq flow following it------------------------
//----------------------------------------------------------------------------
function markObjectAndSeqFlow(actID, colorO, colorS){
    loopCount++;
    var loopF = timerCoef*(loopCount+1);
    doSetTimeoutObj(actID, loopF, colorO);
    var currShape = elementRegistry.get(actID);
    var currShapeType = currShape.type;//bpmn:StartEvent
    var currObject = currShape.businessObject;//Base 
    var seqFlow = currObject.get('outgoing');
    if(seqFlow[0] !== undefined){
        loopCount++;
        loopF = timerCoef*(loopCount+1);
        doSetTimeoutFlow(seqFlow[0], loopF, colorS);
    }
}
//--------------------------------------------------------------------------

//Paint only the given object-----------------------------------------------
function markObject(objID, color){
    var loopF = timerCoef*(loopCount+1);
    doSetTimeoutObj(objID, loopF, color);
}
//--------------------------------------------------------------------------

//Clean the marking of the given object-------------------------------------
//--------------------------------------------------------------------------
function markCleanObject(objID, color){
    var loopF = timerCoef*(loopCount+1);
    doSetTimeoutCleanObj(objID, loopF, color);
}
//--------------------------------------------------------------------------

//Paint the sequence flow given with the object id and its order------------
//--------------------------------------------------------------------------
function markSeqFlow(objID, seqFlowOrder, color){
    var loopF = timerCoef*(loopCount+1);
    var currShape = elementRegistry.get(objID);
    var currShapeType = currShape.type;//bpmn:StartEvent
    var currObject = currShape.businessObject;//Base 
    var seqFlow = currObject.get('outgoing');
    if(seqFlow[seqFlowOrder] !== undefined){
        loopF = timerCoef*(loopCount+1);
        doSetTimeoutFlow(seqFlow[seqFlowOrder], loopF, color);
    }
}
//--------------------------------------------------------------------------

//Paint the sequence flow with the given id---------------------------------
//--------------------------------------------------------------------------
function markSeqFlowwithGivenId(seqID, color){
    var loopF = timerCoef*(loopCount+1);
    var currSeq = elementRegistry.get(seqID);
    var currObject = currSeq.businessObject;//Base 
    doSetTimeoutFlow(currObject, loopF, color);
}
//--------------------------------------------------------------------------

//Get the seq flow id of the given object and the order---------------------
//--------------------------------------------------------------------------
function getSeqFlowId(objID, seqFlowOrder){
    var currShape = elementRegistry.get(objID);
    var currShapeType = currShape.type;//bpmn:StartEvent
    var currObject = currShape.businessObject;//Base 
    var seqFlow = currObject.get('outgoing');
    if(seqFlow[seqFlowOrder] !== undefined){
        return seqFlow[seqFlowOrder].id;
    }
}
//--------------------------------------------------------------------------

//Check if the expected sequence flow is clicked-----------------------------
//--------------------------------------------------------------------------
function checkSelectedSeq(){
    /*if(isPathSelectionPointArrived == true){
        //there is a new click and a new control point, check if the correct place is clicked
        for(var k=0;k<seqFlowstobeClicked.length;k++){
            if(selectedElementId == seqFlowstobeClicked[k]){
                selectedElementId = seqFlowstobeClicked[k];
                isPathSelected = true;
                selectedSeqFlowPathNum = k;
            }
        }
        if(isPathSelected == true){
            markSeqFlowwithGivenId(selectedElementId);
        }
    }*/
    //markSeqFlowwithGivenId(selectedElementId);
    var outgoingGfx = viewer.get('elementRegistry').getGraphics(selectedElementId);
    outgoingGfx.select('path').attr({stroke: 'lime'});
}
//--------------------------------------------------------------------------

//Parse all objects and make an array of matching gateway couples-----------
//For the moment just works for AND gateways--------------------------------
//--------------------------------------------------------------------------
function findGatewayCouples(seqFlowToParse){
    var nextObject = seqFlowToParse.targetRef;
    var nextObjectType = nextObject.$type;
    
    for(var k = 0; k <allObjects.length; k++){
        if(allObjects[k].id == nextObject.id && allObjects[k].isPassed == true){ 
            return;
        }
    }
    allObjects.push({
    id: nextObject.id,
    isPassed: true
    });
    
    if(nextObjectType.indexOf('endEvent') != -1){
        return;
    }
    if((nextObjectType.indexOf('ParallelGateway') !=-1  || nextObjectType.indexOf('InclusiveGateway') !=-1)
            && (nextObject.gatewayDirection == "Diverging")){
        gatewayCombination.push({
            divGatewayID: nextObject.id,
            convGatewayID: 0
        });
        var seqFlow = nextObject.get('outgoing');
        for(var j = 0; j < seqFlow.length; j++){
            findGatewayCouples(seqFlow[j]);
        }
        
    }else if((nextObjectType.indexOf('ParallelGateway') !=-1  || nextObjectType.indexOf('InclusiveGateway') !=-1)
            && (nextObject.gatewayDirection == "Converging")){
        //gatewayi sondan donup en son convergenti bos olana ata
        for(var i = gatewayCombination.length - 1; i >= 0; i--){
            if(gatewayCombination[i].convGatewayID == 0){
                gatewayCombination[i].convGatewayID = nextObject.id;
            }
        }
        var seqFlow = nextObject.get('outgoing');
        findGatewayCouples(seqFlow[0]);
    }else{
        var seqFlow = nextObject.get('outgoing');
        for(var j = 0; j < seqFlow.length; j++){
            findGatewayCouples(seqFlow[j]);
        }
    }
}
//--------------------------------------------------------------------------

//Get the converging and of a given diverging gateway-----------------------
//--------------------------------------------------------------------------
function findConvAndofGivenDivAnd(divAndID){
    //bir diverginge geldigimizde onun bagli oldugu convergingi don
    for(var i = 0; i < gatewayCombination.length; i++){
        if(gatewayCombination[i].divGatewayID == divAndID){
            return gatewayCombination[i].convGatewayID;
        }
    }
}
//--------------------------------------------------------------------------

//Add timer to check how long the user checks the model---------
//--------------------------------------------------------------
var inSeconds; 
$(function() {
        var cd = $('#countdown');
        var a = (cd.text()).split(':');
        inSeconds = a[0]*60 + a[1]*1;
        var interv = setInterval(function() {
            inSeconds --;
            var minute = Math.floor((inSeconds) / 60);
            var seconds = inSeconds - (minute * 60);
            if(seconds < 10){
                seconds = '0'+seconds;
            }
            var c = minute + ':' + seconds;
            cd.html(c);
            if (inSeconds == 0) {
                //window.location.reload(false);
                clearInterval(interv);
            }
        }, 1000);
    });
//--------------------------------------------------------------------------

//Prevent going back in the page. --------------------------------
//-----------------------------------------------------------------
/*(function ($, global) {

    var _hash = "!",
    noBackPlease = function () {
        global.location.href += "#";

        setTimeout(function () {
            global.location.href += "!";
        }, 50);
    };

    global.setInterval(function () {
        if (global.location.hash != _hash) {
            global.location.hash = _hash;
        }
    }, 100);

    global.onload = function () {
        noBackPlease();

        // disables backspace on page except on input fields and textarea..
        $(document.body).keydown(function (e) {
            var elm = e.target.nodeName.toLowerCase();
            if (e.which == 8 && elm !== 'input' && elm  !== 'textarea') {
                e.preventDefault();
            }
            // stopping event bubbling up the DOM tree..
            e.stopPropagation();
        });
    }

})(jQuery, window);*/