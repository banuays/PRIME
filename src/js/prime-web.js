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
//var checkBanu = require('bpmn-js/lib/util/ModelUtil.js');
var is = require('bpmn-js/lib/util/ModelUtil').is;
var modelingModule = require('bpmn-js/lib/features/modeling');

var Tree = require('./Tree').Tree;
var createFrgTree = require('./FragmentTree').createFrgTree;
//Global variables
var eventBus, event;
var loopCount=0;
var timerCoef=0;             //adjust the pace
var isStepAnimSelected=false;//if stepwise or cont animation selected
var isJustFollowNext=false;  //if only the following node needs to be clicked in stepwise anim
var nodetobeClicked=[]; //list of nodes that need to be clicked

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
]
var startEvents=[/*element*/];
var numOfRepeats = 0;//kac kere end'e ulastigi. 
var timeoutsArray=[];
var particId;
//Add console -------------------
/*var consoles = document.querySelector('#js-console');
function log() {
    consoles.value += Array.prototype.slice.call(arguments).map(function(e) {
        return String(e);
    }).join(' ');
    consoles.value += '\n';
    consoles.scrollTop = consoles.scrollHeight;
  }*/
//-------------------------------
// Import and open default xml diagram--------------
//--------------------------------------------------
function openDiagram(diagram) {
    viewer.importXML(diagram, function(err) {
      if (!err) {
        //log('File loaded!');
        viewer.get('canvas').zoom('fit-viewport');
        //Get lanes so that we put lane names through the diagram
        elementRegistry = viewer.get('elementRegistry');
        var lanes = [];
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
        //put overlays through a loop in every 750 px. Show each 750px on low zoom and 1500px on high zoom
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
        } else {
        //log('something went wrong:', err);
      }
        //mouse wheel cevrildiginde zoom leveli kaydetmek icin event handler yaratalim
        particId = processId();
        document.getElementById("canvas").addEventListener("wheel", myFunction);
        function myFunction() {
            console.log("mouse cevirdik jsde");
            console.log(viewer.get('canvas').zoom(false));
            //logExp("zoomPrc1Anim "+ viewer.get('canvas').zoom(false), particId);
        }
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
            // e.element = the model element
            // e.gfx = the graphical element
            //seq flow okunun kendisi yaninda ona bagli olan labela da tiklayabiliriz. O yuzden label click olursa da bakiyoruz.
            if(e.element.type.indexOf('StartEvent') != -1 && isMultipleStartEvents == true){
                //secilen start eventi bulup oradan animationi normal sekilde baslat
                logExp(particId+" clickPrc1AnimStartEvent "+e.element.id, "WebLogger");
                markObjectAndSeqFlow(e.element.id, 'highlight', 'lime');
                //Secileni yesil yaptiktan sonra diger startlari da gray yapicaz. 
                for(var m = 0; m <startEvents.length; m++){
                    console.log('start event idleri gri yapcaz');
                    console.log(startEvents[m]);
                    console.log(e.element.id);
                    if(startEvents[m].id !== e.element.id){
                        console.log('secilmeyen start event: '+startEvents[m].id);
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
            }//start event degil herhangi bir seye tikladiysa alternatiflerden secim ya da stepwiseda ilerleme var mi diye bakiyoruz
            else{ //if(e.element.type.indexOf('SequenceFlow') != -1 || e.element.type.indexOf('label') != -1){//sectigimiz akis ise
                isPathSelected = true;
                selectedElementId = e.element.id.replace('_label','');
                
                //stepwise ve direk takip eden bir durum varsa
                if(isStepAnimSelected==true/* && isJustFollowNext==true*/){
                    //step durumunda bir sonraki noda tikliyoruz, seqa deil. 
                    var nodeSize = nodetobeClicked.length;
                    for(var m=0; m < nodeSize; m++){
                        //console.log(nodetobeClicked[m]);
                        if(nodetobeClicked[m].indexOf(selectedElementId) != -1){
                            var currShape = elementRegistry.get(selectedElementId);
                            var nodetoParse = currShape.businessObject;//Base 
                            isJustFollowNext=false;
                            //viewer.get('canvas').removeMarker(nodetoParse.id, 'highlight-light');
                            loopCount=0;
                            markObjectAndSeqFlow(nodetoParse.id, 'highlight', 'lime');
                            //devam etmeden bu listeden kliklenen objeyi cikarmamiz lazim
                            for(var n=0; n<nodetobeClicked.length;n++){
                                if(nodetobeClicked[n] == selectedElementId){//bu secilen aslinda seq degil node 
                                    nodetobeClicked.splice(n, 1);
                                }
                            }
                            findNextObject(nodetoParse.get('outgoing')[0]);
                        }
                    }
                }
                var clickedGatewayPath;
                for(i=0; i<seqFlowstobeClicked.length;i++){
                    if(seqFlowstobeClicked[i].seqFlowId == selectedElementId){
                    //logExp("clickPrc1AnimAltPath "+selectedElementId, particId);
                    logExp(particId+" clickPrc1AnimAltPath "+selectedElementId, "WebLogger");
                        var currShape = elementRegistry.get(selectedElementId);
                        var seqFlowToParse = currShape.businessObject;//Base 
                        //artik bu XORa ait kollari tiklanacaklar listesinden cikarabiliriz
                        clickedGatewayPath = seqFlowstobeClicked[i].relatedXOR;
                        loopCount = 0;
                        for(var k = seqFlowstobeClicked.length - 1; k >= 0; k--){
                            if(seqFlowstobeClicked[k].relatedXOR === clickedGatewayPath) {
                               if(seqFlowstobeClicked[k].seqFlowId != selectedElementId){
                                    markSeqFlowwithGivenId(seqFlowstobeClicked[k].seqFlowId, 'Grey');
                                   //grilesen kolun baglandigi aktiviteyi de grilestirmek istersek
                                    /*var notSelShape = elementRegistry.get(seqFlowstobeClicked[k].seqFlowId);
                                    var seqFlowLighten = notSelShape.businessObject;//Base 
                                    markObject(seqFlowLighten.targetRef.id,  'highlight-light');*/
                                }
                                seqFlowstobeClicked.splice(k, 1);
                            }
                        }
                        
                        markSeqFlowwithGivenId(selectedElementId, 'lime');
                        findNextObject(seqFlowToParse);
                    }
                }
            }//end of main if. What is the selected object type (seq flow, start event etc)
          });
        });
    });

}
var fs = require('fs');
var xmlDiagram = fs.readFileSync(__dirname + '/../resources/IssueManagement.bpmn', 'utf-8');
openDiagram(xmlDiagram);
//setTimeout(showAlertatStartUp, 500);
//Show alert at the beginning
function showAlertatStartUp(){
    var r = alert("Please go ahead with analyzing the model with the animation now.\n\n The animation will start immediately. Select a start event to continue.\nYou can analyze as long as you like. The animation will restart when the end event is reached.");
    $('[animStep-button-click]').prop('disabled', true);
    $('[animSel-button-click]').prop('disabled', true);
    var timeStamp = Math.floor(Date.now() / 1000); 
    //Butona basildigi zaman ile ayni is yapiliyor. 
    initiateAnimation();
}

//Open diagram from link on click-------------------
//--------------------------------------------------
var $diagramLink = $('[open-url-click]');
$diagramLink.on('click', function(){
    var x = new XMLHttpRequest();
    x.open("GET", "http://localhost/prime/resources/Blockstructure-2LevelPlus.bpmn", true);
    x.onreadystatechange = function () {
    if (x.readyState == 4 && x.status == 200){
        var doc = x.responseText;
        //var root = doc.documentElement;
        console.log(doc);
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
    openDiagram(xml);
  });
});

////// file drag / drop ///////////////////////
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

//For php connection--------------------------------
//--------------------------------------------------
    function reqListener () {
      console.log(this.responseText);
    }
//Asagidaki modellist'i gostermek icin olan kismi simdilik kaldiriyorum. 
/*var $listButton = $('[model-list-div]');
var $listDiv = $('[modelListDiv]');
var aaa;
    var oReq = new XMLHttpRequest(); //New request object
    oReq.onload = function() {
        //This is where you handle what to do with the response.
        //The actual data is found on this.responseText
        aaa = this.responseText; 
        //alert(aaa); //Will alert: 42
        $("#modellist").html(aaa);
        //document.getElementByID("modellist").innerHTML="afsdfsdf";
        listDiv.value=aaa;
    };
    oReq.open("get", "getFileList.php", true);
    //oReq.open("get", "getFileContent.php?id=2", true);
    //                               ^ Don't block the rest of the execution.
    //                                 Don't wait until the request finishes to 
    //                                 continue.
    oReq.send();

$(document).ready(function(){
    console.log(this.$id);
    $(".modelLink").click(showModelFromDB(2));
});
function showModelFromDB(id){
    var oReq1 = new XMLHttpRequest(); //New request object
    oReq1.onload = function() {
        var bbb = this.responseText; 
        //alert(bbb);
        console.log(bbb);
        openDiagram(bbb);
    };
    oReq1.open("get", "getFileContent.php?id="+id, true);
    oReq1.send();
    return false;
    
}*/
//end of for php connection

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

//Recursive function to traverse all objects (through the end, then come back)
//Not used now--------------------------------------
//--------------------------------------------------
/*var colorMe = function(objToColor){
    //canvas.addMarker(objToColor.id, 'highlight');
    loopF = 500*(loopCount+1);
    doSetTimeoutObj(objToColor.id, loopF);
    loopCount++;
    if(objToColor.get('outgoing')[0] === undefined)
        return;
    
    var seqFlow = objToColor.get('outgoing');
    for(var i=0, count=seqFlow.length;i<count;i++)
    {
        doSetTimeoutFlow(seqFlow[i], loopF);
        //setColorRec(seqFlow[i].targetRef, canvas, elementRegistry);
        //var nextObject = seqFlow[i].targetRef;
        colorMe(seqFlow[i].targetRef);
        console.log("gelmeyecek buraya");
    }
};*/

//Animate all alternative seq flows when full animation clicked----
//-----------------------------------------------------------------
var $button = $('[animFull-button-click]');
$button.on('click', function(){
    //log('Anim started');
    timerCoef=1000;
    Tree = createFrgTree(viewer);
    console.log('butondan tree: ');
    console.log(Tree);
    //console.log(viewer.definitions); Banu: the whole process tree
    canvas = viewer.get('canvas'),
    overlays = viewer.get('overlays'),
    elementRegistry = viewer.get('elementRegistry');
    //Get start element
    var elements = elementRegistry.filter(function(element) {
      return is(element, 'bpmn:StartEvent');
    });
    //Add marker to the first element of the first fragment (start event)
    var startEventID = Tree._root.data.strtID;
    console.log('start idsi su: '+startEventID);
    
    markObjectAndSeqFlow(startEventID, 'highlight', 'lime');
    highlightFrgsRecursive(Tree._root);
    markObjectAndSeqFlow(Tree._root.data.endID, 'highlight', 'lime');
});

//Animate automatically but expect the user to select conditions----
//------------------------------------------------------------------
var $button = $('[animSel-button-click]');
$button.on('click', function(){
    initiateAnimation();
});

//Animate stepwise. The user needs to make a selection at every step----
//----------------------------------------------------------------------
var $button = $('[animStep-button-click]');
$button.on('click', function(){
        //log('Anim started');
    //console.log(viewer.definitions); Banu: the whole process tree
    isStepAnimSelected = true;
    initiateAnimation();
});

//Reset the animation and restart with the original settings-------
//-----------------------------------------------------------------
var $button = $('[reset-button-click]');
$button.on('click', function(){
    //location.reload(); 
    resetandInitiateAnim();
});

//Start the animation tutorial-------
//-----------------------------------------------------------------
var $button = $('[animTutorial-button-click]');
$button.on('click', function(){
    window.open('tutorial.html','_parent',false);
});

//Open diagram from link on click-------------------
//--------------------------------------------------
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

//Open diagram from link on click-------------------
//--------------------------------------------------
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
//Open diagram from link on click-------------------
//--------------------------------------------------
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
//Open diagram from link on click-------------------
//--------------------------------------------------
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
//Open diagram from link on click-------------------
//--------------------------------------------------
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

var $input = $('[pace-click]');
$input.on('change', function(){
    var newval=$(this).val();
    //logExp("clickPrc1AnimButtonPace "+newval, particId);
    logExp(particId+" clickPrc1AnimButtonPace "+newval, "WebLogger");
    timerCoef = (-1)*newval;
});
//------------------------------------------------


function initiateAnimation(){
    //either when a button is clicked or user opens the page for the first time or returns back to start.
    $('[animStep-button-click]').prop('disabled', true);
    $('[animSel-button-click]').prop('disabled', true);
    canvas = viewer.get('canvas');
    overlays = viewer.get('overlays');
    timerCoef = 800;
    //butun elemanlarin uzerinden dolasip And diverging gateway olanlari bulup source seqlari ata
    elementRegistry = viewer.get('elementRegistry');
    var allElements = elementRegistry.getAll();
    setConvergingParallelGatewayArray(allElements);
    markSeqInOrder();
}

//Resetlemek icin fonksiyon. Restart dediginde, sona geldiginde ya da burdan basla dediginde kullan
function resetAll(){
    loopCount=0;
    //timerCoef=0;             //adjust the pace
    isStepAnimSelected=false;//if stepwise or cont animation selected
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
    //reset all timeouts
    for(var i=0; i<timeoutsArray.length; i++){
        clearTimeout(timeoutsArray[i]);
    }
    timeoutsArray.length=0;
    openDiagram(xmlDiagram);
    $('[animStep-button-click]').prop('disabled', false);
    $('[animSel-button-click]').prop('disabled', false);
    document.getElementById("paceclick").value = "-800";
}

function resetandInitiateAnim(){
    resetAll();
    //initiateAnimation();
}

var $input = $('[pace-click]');
$input.on('change', function(){
    var newval=$(this).val();
    //logExp("clickPrc1AnimButtonPace "+newval, particId);
    logExp(particId+" clickPrc1AnimButtonPace "+newval, "WebLogger");
    timerCoef = (-1)*newval;
});


//Finalize the animation and go to questions-------
//-----------------------------------------------------------------
var $button = $('[animFinish-button-click]');
$button.on('click', function(){
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

//Parse all converging parallel gateways at the beginning of the animation----
//----------------------------------------------------------------------------
function setConvergingParallelGatewayArray(allElements){
    for(var i=0; i<allElements.length; i++){
        if(allElements[i].businessObject.$type.indexOf('ParallelGateway') != -1 && allElements[i].businessObject.gatewayDirection.indexOf('Converging') != -1){
            //buldugumuz converging paralel icin arrayimize butun incominglerini atiyacagiz
            for(var k=0; k<allElements[i].businessObject.get('incoming').length;k++){
                //daha onceki degerlerden aynisi var mi kontrol edelim. ancak yoksa ekleyeylim. 
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

//Initiate the animation by finding start events and then triggering recursion----
//--------------------------------------------------------------------------------
function markSeqInOrder(){
    elementRegistry = viewer.get('elementRegistry');
    //find all start events and mark them to let user select one
    var index = 0;//tek sayilardaki start eventleri push etmiycez
    //cunku shape ve label icin ayri ayri push ediyor. 
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
    console.log('seq flow bulduk mu');
    console.log(startEvents[0].get('outgoing')[0]);
    findGatewayCouples(startEvents[0].get('outgoing')[0]);
    console.log('couple andleri bulduk mu');
    console.log(gatewayCombination);
    //var startEvent = startEvents[0];
    if(startEvents.length == 1){//eger bir tane start event varsa animasyona baslayip normal sekilde devam ediyoruz
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
    }else{//birden fazla start event varsa kullanicinin birini secmesi gerekecek.
        isMultipleStartEvents = true;
        for(var i=0; i< startEvents.length;i++){
            //kullanicinin secmesi gerekenleri isaretliyoruz
            markObject(startEvents[i].id, 'highlight-toselect');
        }
    }
}

//Recursive animation basically doing all the stuff for both stepwise and regular----
//-----------------------------------------------------------------------------------
function findNextObject(seqFlowToParse){
    var nextObject = seqFlowToParse.targetRef;
    var nextObjectType = nextObject.$type;
    console.log('task tipi: '+nextObjectType);
    if(nextObjectType.indexOf('EndEvent') != -1){
        loopCount+=2;
        markObject(nextObject.id, 'highlight');
        loopCount+=10;
        numOfRepeats++;
        //logExp("endEventPrc1Anim "+numOfRepeats, particId);
        logExp(particId+" endEventPrc1Anim "+numOfRepeats, "WebLogger");
        //Alert user that the animation will start again.
        doSetTimeoutEndAlert(timerCoef*(loopCount+1));
        loopCount+=1;
        //resetAll();
        var tempLoopCount = loopCount;
        doSetTimeoutResetandInitiate(timerCoef*(tempLoopCount));
        //Butona basildigi zaman ile ayni is yapiliyor. 
        loopCount = tempLoopCount;
    }
    else if(nextObjectType.indexOf('Task') != -1 || nextObjectType.indexOf('Event') != -1){
        var seqFlow = nextObject.get('outgoing');
        if(isStepAnimSelected == true){
            markCleanObject(nextObject.id, 'highlight');
            loopCount++;
            markObject(nextObject.id, 'highlight-light');
            isJustFollowNext=true;
            nodetobeClicked.push(nextObject.id);
            return;
        }
        markCleanObject(nextObject.id, 'highlight');
        markObjectAndSeqFlow(nextObject.id, 'highlight', 'lime');
        loopCount++;
        findNextObject(seqFlow[0]);
    }else if((nextObjectType.indexOf('ExclusiveGateway') !=-1) 
             && nextObject.gatewayDirection == "Diverging"){
        markCleanObject(nextObject.id, 'highlight');
        loopCount++;
        markObject(nextObject.id, 'highlight');
        var seqFlow = nextObject.get('outgoing');
        var pathNum = seqFlow.length;
        for(var i=0; i<pathNum;i++){
            seqFlowstobeClicked.push({
                relatedXOR: nextObject.id, 
                seqFlowId: seqFlow[i].id});
            markSeqFlowwithGivenId(seqFlow[i].id, 'Magenta');
        }
        console.log('hangilere tiklamak lazim: ');
        console.log(seqFlowstobeClicked);
        return;
    }else if((nextObjectType.indexOf('ExclusiveGateway') !=-1) 
             && nextObject.gatewayDirection == "Converging"){
        
        if(isStepAnimSelected == true){
            markCleanObject(nextObject.id, 'highlight');
            loopCount++;
            markObject(nextObject.id, 'highlight-light');
            isJustFollowNext=true;
            nodetobeClicked.push(nextObject.id);
            return;
        }
        markCleanObject(nextObject.id, 'highlight');
        markObjectAndSeqFlow(nextObject.id, 'highlight', 'lime');
        var seqFlow = nextObject.get('outgoing');
        findNextObject(seqFlow[0]);
    }
    else if((nextObjectType.indexOf('ParallelGateway') !=-1) 
             && nextObject.gatewayDirection == "Converging"){
        //Bu convergingde devam etmeden once tum kollardan akislarin geldiginden emin olmaliyiz
        for(var i=0; i<andGatewaysMerged.length;i++){
            //seq flow to parse'i bulup isaretleyelim
            //console.log('kontrol edilen array ogesi: '+andGatewaysMerged[i].convAnd+'ve'+andGatewaysMerged[i].incSeqFlowId);
            if(andGatewaysMerged[i].convAnd== nextObject.id && andGatewaysMerged[i].incSeqFlowId== seqFlowToParse.id){
               //dogru kolu bulduk. isaretleyelim. 
                andGatewaysMerged[i].didFlowMerge = true;
               }
        }
        //tekrar tum andGatewayMerged arrayine bakip bu gateway icin hepsi isaretlenmis mi gorucez. 
        var didAllIncomingPathsPassed=true;
        for(var j=0; j<andGatewaysMerged.length;j++){
            if(andGatewaysMerged[j].convAnd == nextObject.id){
                if(andGatewaysMerged[j].didFlowMerge == false){
                    didAllIncomingPathsPassed = false;//hayir hepsi bitmemis. devam edemeyiz
                }
            }
        }
        if(didAllIncomingPathsPassed == true){
            //console.log('tum kollari isaretledigimiz noktaya geldik');
            if(isStepAnimSelected == true){
                markCleanObject(nextObject.id, 'highlight');
                loopCount++;
                markObject(nextObject.id, 'highlight-light');
                isJustFollowNext=true;
                nodetobeClicked.push(nextObject.id);
                return;
            }
            markCleanObject(nextObject.id, 'highlight');
            loopCount++;
            markObject(nextObject.id, 'highlight');
            var seqFlow = nextObject.get('outgoing');
            var pathNum = seqFlow.length;
            for(var i=0; i<pathNum;i++){
                loopCount++;
                markSeqFlowwithGivenId(seqFlow[i].id, 'lime');
                findNextObject(seqFlow[i]);
            }
        }
    }
    else if((nextObjectType.indexOf('ParallelGateway') !=-1)
            && nextObject.gatewayDirection == "Diverging"){
        //Paralel kola devam etmeden once bu fragmentin isaretleme bilgisini sifirlamamiz gerekiyor
        //Normal akista bu gerekmiyor ama kullanici XOR secip geriye donduyse tekrar boyama icin
        //Bu bilgileri resetlememiz gerekiyor
        var convAndId = findConvAndofGivenDivAnd(nextObject.id);//buna karsilik gelen converging ne
        //console.log('gercekten fragment bilgisini alabildik mi? Divergin: '+nextObject.id+'converging: '+convAndId);
        //Bu converging icin andGatewaysMerged bilgisini (tum inc seq flowlar icin) sifirliycaz
        for(var m=0; m < andGatewaysMerged.length; m++){
            if(andGatewaysMerged[m].convAnd.indexOf(convAndId) != -1){
                andGatewaysMerged[m].didFlowMerge = false;
            }
        }
        markCleanObject(nextObject.id, 'highlight');
        loopCount++;
        markObject(nextObject.id, 'highlight');
        var seqFlow = nextObject.get('outgoing');
        var pathNum = seqFlow.length;
        
        for(var i=0; i<pathNum;i++){
            markSeqFlowwithGivenId(seqFlow[i].id, 'Lime');
            //paralel kollari hemen ayni anda boyamak istiyoruz ki paralel mantigi anlayalim.
            //next object bularak sonrasindaki loopta devam edicez. 
            //Ilk objeleri de hemen boyamak istersen bunu ac
            //markObject(seqFlow[i].targetRef.id, 'highlight');
        }
        for(var k=0; k<pathNum;k++){
            findNextObject(seqFlow[k]);
        }
        //loopCount++;
    }
}

//----
//----------------------------------------------------------------------------
function highlightFrgsRecursive(tree){
    //loop through tree 
    //go through the fragment children as a loop
    console.log('treeye bakiyoruz');
    console.log(tree);
    console.log(tree.children.length);
    var length = tree.children.length;
    var i = 0;
    for(;i<length;i++){
        console.log('donguye girdi');
        console.log(tree.children[i]);
        if(tree.children[i].data.frgType == "ACT"){
            /*if(isPathSelected==true){
                if(tree.children[i].data.curPathNum == selectedSeqFlowPathNum){
                    var actID = tree.children[i].data.strtID;
                    loopCount++;
                    markObjectAndSeqFlow(actID);
                }
            }else{*/
                var actID = tree.children[i].data.strtID;
                //loopCount++;
                markObjectAndSeqFlow(actID, 'highlight', 'lime');
        }//else if(tree.children[i].data.frgType == "XOR"){
            //gatewayi renklendir. Sonra kollarina bak. Kollarda aktivite oldugu surece renklendir. Fragment gelirse recurse et
            /*loopCount++;
            markObject(tree.children[i].data.strtID);
            //totalpathnumu kacsa o kollari basicaz
            loopCount++;
            //burada kullanicidan bir tane kolu tiklamasini bekliyoruz*/
            
            /*var seqFlowstobeClicked=[];
            var selectedElementId;
            var j=0;
            for(j=0;j<tree.children[i].data.totalPathNum;j++){
                //markSeqFlow(tree.children[i].data.strtID, j);
                //geldigimiz XORun olasi her kolu icin listener yaratiyoruz
                var thisSeqFlowId=getSeqFlowId(tree.children[i].data.strtID, j);
                console.log('baktigimiz flowun idsi: '+j+' '+thisSeqFlowId);
                //seqFlowstobeClicked[j]=thisSeqFlowId;
                seqFlowstobeClicked[j]= document.querySelector('#canvas [data-element-id = '+thisSeqFlowId+']');
                seqFlowstobeClicked[j].addEventListener('click', function(e) {
                    alert('clicked the path! ');
                    console.log('bastigimiz zaman gelen nane');
                    console.log(e);
                    selectedElementId = e.element.id;
                });
            }*/

            //Kollara ozel listener eklemeden once genel event bus ile boyle cozum yapmistim 
            /*events.forEach(function(event) {
                eventBus.on(event, function(e) {
                // e.element = the model element
                // e.gfx = the graphical element
                if(event=='element.click'){
                    for(var k=0;k<seqFlowstobeClicked.length;k++){
                        if(e.element.id == seqFlowstobeClicked[k])
                            selectedElementId = seqFlowstobeClicked[k];
                            isPathSelected = true;
                            selectedSeqFlowPathNum = k;
                    }
                }
                    //log(event, 'on', e.element.id);
                 });
            });*/
            
            /*waitForIt(seqFlowstobeClicked, createEventBus);
            return;
            console.log('tiklanan kolun idsi: '+selectedElementId);
            if(isPathSelected == true){
                console.log(selectedElementId);
                markSeqFlowwithGivenId(selectedElementId);
                isPathSelected=false;
                markObjectAndSeqFlow(tree.children[i].data.endID);
            }*/
            //alt asamalari da aynen renklendirecek
            //highlightFrgsRecursive(tree.children[i]);
            //gatewayi renklendir. Sonra kollarina bak. Kollarda aktivite oldugu surece renklendir. Fragment gelirse recurse et
            /*startEventNode = document.querySelector('#canvas [data-element-id = '+startEventID+']');
            startEventNode.addEventListener('click', function(e) {
                  //alert('clicked the end event!');
                myfunction(tree);
                });*/
            //loopCount++;
            //markObject(tree.children[i].data.strtID);
            //totalpathnumu kacsa o kollari basicaz
            //loopCount++;
            /*var j=0;
            for(;j<tree.children[i].data.totalPathNum;j++){
                markSeqFlow(tree.children[i].data.strtID, j);
            }*/
            //alt asamalari da aynen renklendirecek
            //highlightFrgsRecursive(tree.children[i]);
            //markObjectAndSeqFlow(tree.children[i].data.endID);
        //}
        else if(tree.children[i].data.frgType == "AND" || tree.children[i].data.frgType == "XOR"){
            //gatewayi renklendir. Sonra kollarina bak. Kollarda aktivite oldugu surece renklendir. Fragment gelirse recurse et
            loopCount++;
            markObject(tree.children[i].data.strtID, 'highlight', 'lime');
            //totalpathnumu kacsa o kollari basicaz
            loopCount++;
            var j=0;
            for(;j<tree.children[i].data.totalPathNum;j++){
                markSeqFlow(tree.children[i].data.strtID, j, 'lime');
            }
            //alt asamalari da aynen renklendirecek
            highlightFrgsRecursive(tree.children[i]);
            markObjectAndSeqFlow(tree.children[i].data.endID, 'highlight', 'lime');
        }
    }
}

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

function markObject(objID, color){
    var loopF = timerCoef*(loopCount+1);
    doSetTimeoutObj(objID, loopF, color);
}

function markCleanObject(objID, color){
    var loopF = timerCoef*(loopCount+1);
    doSetTimeoutCleanObj(objID, loopF, color);
}

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
function markSeqFlowwithGivenId(seqID, color){
    var loopF = timerCoef*(loopCount+1);
    var currSeq = elementRegistry.get(seqID);
    var currObject = currSeq.businessObject;//Base 
    doSetTimeoutFlow(currObject, loopF, color);
}
function getSeqFlowId(objID, seqFlowOrder){
    var currShape = elementRegistry.get(objID);
    var currShapeType = currShape.type;//bpmn:StartEvent
    var currObject = currShape.businessObject;//Base 
    var seqFlow = currObject.get('outgoing');
    if(seqFlow[seqFlowOrder] !== undefined){
        return seqFlow[seqFlowOrder].id;
    }
}

function checkSelectedSeq(){
    /*if(isPathSelectionPointArrived == true){
        //hem klik geldi. hem de yeni kontrol noktasi geldi. dogru yer basilmis mi bak
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
    console.log('tikladigim kolun idsi: '+selectedElementId);
    //markSeqFlowwithGivenId(selectedElementId);
    var outgoingGfx = viewer.get('elementRegistry').getGraphics(selectedElementId);
    outgoingGfx.select('path').attr({stroke: 'lime'});
}

//Parse all objects and make an array of matching gateway couples
//For the moment just works for AND gateways
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
    if((nextObjectType.indexOf('ParallelGateway') !=-1)
            && (nextObject.gatewayDirection == "Diverging")){
        console.log('geldik mi diverginge');
        console.log(nextObject);
        gatewayCombination.push({
            divGatewayID: nextObject.id,
            convGatewayID: 0
        });
        var seqFlow = nextObject.get('outgoing');
        for(var j = 0; j < seqFlow.length; j++){
            findGatewayCouples(seqFlow[j]);
        }
        
    }else if((nextObjectType.indexOf('ParallelGateway') !=-1)
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


function findConvAndofGivenDivAnd(divAndID){
    //bir diverginge geldigimizde onun bagli oldugu convergingi don
    for(var i = 0; i < gatewayCombination.length; i++){
        if(gatewayCombination[i].divGatewayID == divAndID){
            return gatewayCombination[i].convGatewayID;
        }
    }
}

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