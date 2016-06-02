var is = require('bpmn-js/lib/util/ModelUtil').is;
var Tree = require('./Tree').Tree;
var fragmentObj = [/*{
depth: 0,
frgType: "XOR", //OR, AND, LOOP, ACT, ROOT
strtID: null,
endID: null,
isObj: false, 
curPathNum, //in which path this fragment is in
totalPathNum //how many paths exist in this fragment (only for XOR, OR, AND fragments)
}*/];
var currDepth; 
var tree;
var frgInd = 0, prevDepth=0;
//Banu traverse the sequence flow and create tree function
function createFrgTree(viewer){
    elementRegistry = viewer.get('elementRegistry');
    //var frgInd = 0, prevDepth=0;
    var elements = elementRegistry.filter(function(element) {
      return is(element, 'bpmn:StartEvent');
    });
    var startEvent = elements[0];
    elements = elementRegistry.filter(function(element) {
      return is(element, 'bpmn:EndEvent');
    });
    var endEvent = elements[0];
    fragmentObj = [];
    fragmentObj.push({
        frgType: "ROOT", 
        strtID: startEvent.id,
        endID: endEvent.id,
        depth: 0,
        isObject: false,
        curPathNum: 0, 
        totalPathNum: 0
    });
    currDepth = 0;
    tree = null;
    tree = new Tree(fragmentObj[0]);//root olarak atadik
    console.log("tree root: ");
    console.log(tree._root);

    var currShape = elementRegistry.get(startEvent.id);
    var currShapeType = currShape.type;//bpmn:StartEvent
    var objToParse = currShape.businessObject;//Base 
    
    recurseFragment(objToParse);
    console.log('agac burda');
    console.log(tree);
    return tree;
};

module.exports.createFrgTree = createFrgTree;

var recurseFragment = function(objToParse){
    if(objToParse.get('outgoing')[0] === undefined)
        return;
    var prevObject = objToParse;
    var seqFlow = objToParse.get('outgoing');
    var pathNum = seqFlow.length;
    for(var i=0, count=seqFlow.length;i<count;i++)
    {
        var nextObject = seqFlow[i].targetRef;
        var nextObjectType = nextObject.$type;
        var pathNumActivity; 
        if(nextObjectType == 'bpmn:Task'){
            console.log('Simdiki obje');
            console.log(nextObject);
            pathNumActivity = findCurPathNumBasedOnPrevObjInSeq(nextObject, i);
            
            fragmentObj.push({
                frgType: "ACT", 
                strtID: nextObject.id,
                endId: 0,
                depth: currDepth, //onceki asamada dustu ya da ayniysa neyse o
                isObject: true,
                curPathNum: pathNumActivity,  //hangi koldaysak o sayi. 
                totalPathNum: 0 //activity oldugu icin pathler yok. 
            });
            frgInd = fragmentObj.length - 1;
            //depth degismeyecek cunku aktivite gectik, ayni kalacak
            var parentFragment = findLastFrgByDepth(currDepth);//bu depthten ilk oge parent olacak
            tree.add(fragmentObj[frgInd], fragmentObj[parentFragment], tree.traverseBF);
            console.log('Task depth: '+currDepth+' count: '+count + ' ust fragment: ' + parentFragment);
            recurseFragment(nextObject);
        }//end of bpmn:task check
        else if(nextObjectType == 'bpmn:ExclusiveGateway' || nextObjectType == 'bpmn:ParallelGateway'){
            console.log('Simdiki obje');
            console.log(nextObject);
            if(nextObject.gatewayDirection == "Diverging"){
                //buradaki path sayisini atamamiz icin seq flow kaca ayriliyor bulucaz.
                var divergingPaths = nextObject.get('outgoing').length;
                console.log('Diverging path sayisi: '+divergingPaths);
                var blockType; 
                if(nextObjectType == 'bpmn:ExclusiveGateway')
                    blockType = 'XOR';
                else if(nextObjectType == 'bpmn:ParallelGateway')
                    blockType = 'AND';
                //onceki baglanan objenin tipine gore curPathNum'u bulmamiz gerekiyor. 
                pathNumActivity = findCurPathNumBasedOnPrevObjInSeq(nextObject, i);
                fragmentObj.push({
                    frgType: blockType, 
                    strtID: nextObject.id,
                    depth: currDepth+1,  //we start the fragment. Increase by one. 
                    isObject: false,
                    curPathNum: pathNumActivity, //bu fragment toptan hangi koldaysa o sayi
                    totalPathNum: divergingPaths //bu fragmentta toplam kac path var.1den baslar.
                });
                frgInd = fragmentObj.length - 1;
                var parentFragment = findLastFrgByDepth(currDepth);//arttirmadan onceki depthten ilk oge parent olacak
                console.log('onceki depth: '+ currDepth + ' onceki kol sayisi: '+count + ' ust fragment: ' + parentFragment+' bulundugu kol: '+i);
                currDepth++; //diverging gateway blokuna girdigimiz icin artik depth bir fazla. 
                    //converging gatewayden sonra da bir eksiltecegiz. 
                tree.add(fragmentObj[frgInd], fragmentObj[parentFragment], tree.traverseBF);
                recurseFragment(nextObject);
            
                }//end of diverging check
                else if(nextObject.gatewayDirection == "Converging"){
                    //eger tum kollari islemeyi bitirdiyse burdan devam edecegiz
                    //eger convergingin icinde bulundugu fragmentin tum pathlerini bitirdiysek devam ederiz
                    var parentFragmentIndex = findLastFrgByDepth(currDepth);//fragmentObj arrayinde kacinci eleman oldugunun indeksi
                    //Bir once isledigimiz objenin icinde bulundugu fragmentin current path numunu bulmamiz lazim. 
                    var curPathNum = findPrevObjCurPathNum(prevObject.id);
                    //var curPathNum = fragmentObj[frgInd].curPathNum;//0dan basliyor
                    console.log('annesinin kac indeksi var: '+fragmentObj[parentFragmentIndex].totalPathNum);
                    console.log('bir once islenen eleman hangi pathte: '+curPathNum);
                    
                    if((curPathNum+1) == fragmentObj[parentFragmentIndex].totalPathNum/*parentFragmentIndex*/){
                        console.log('convergine girdi');
                        var blockType; 
                        if(nextObjectType == 'bpmn:ExclusiveGateway')
                            blockType = 'XOR';
                        else if(nextObjectType == 'bpmn:ParallelGateway')
                            blockType = 'AND';
                        //bu durumda yeni fragment eklemiycez, bunun bagli oldugu fragmenti bulup end index ekliycez
                        //var parentFragment = findLastFrgByDepth(currDepth);
                        if(fragmentObj[parentFragmentIndex].frgType != blockType){
                            console.log("Block types of start and end event gateways do not hold");
                            return;
                        }
                        currDepth--; //bu fragment bittigi icin cikardik
                        //end idleri fragmentObj arrayinde ve treede atayalim
                        fragmentObj[parentFragmentIndex].endID = nextObject.id;
                        var frg = fragmentObj[parentFragmentIndex];
                        var curID = frg.strtID;
                        tree.contains(function(frg){
                            console.log('treeye geldik');
                            if(frg.data.strtID == curID){
                                console.log('dogru nodea geldik: '+frg.data.strtID);
                                frg.data.endID = nextObject.id;
                                console.log(frg);
                                //parentStartID = frg.parent.data.strtID;
                                //parentPathNum = frg.parent.data.curPathNum;
                            }
                        }, tree.traverseBF);
                        recurseFragment(nextObject);
                    }
                }//end of converging check
            
        }//end of bpmn:Gateway check 
        else if(nextObjectType == 'bpmn:EndEvent'){
            console.log('end evente geldik');
            return;
        }
    }
};

//find the first item with the given depth in the fragment object array
function findLastFrgByDepth(testDepth){
    console.log('Sordugumuz derinlik: ' + testDepth + ' fragmentlerin boyu: ' + fragmentObj.length);
    for(i = (fragmentObj.length-1); i >= 0; i--){
        if(fragmentObj[i].depth == testDepth && fragmentObj[i].isObject == false)
            return i;
    }
}
function findPrevObjCurPathNum(prevObjId){
    console.log('once gelen objenin idsi: '+prevObjId);
    var parentStartID, parentPathNum; 
    for(i = (fragmentObj.length-1); i >= 0; i--){
        console.log('sorgulanan fragment: '+fragmentObj[i].strtID+' ve '+fragmentObj[i].endID);
        console.log('previn frg tipi: '+fragmentObj[i].frgType);
        if(fragmentObj[i].strtID == prevObjId || fragmentObj[i].endID == prevObjId){
            console.log('bulundugu kol: '+fragmentObj[i].curPathNum);
            if(fragmentObj[i].frgType == 'XOR' || fragmentObj[i].frgType == 'AND' || fragmentObj[i].frgType == 'OR'){
                console.log(fragmentObj[i].curPathNum);
                return fragmentObj[i].curPathNum;
            }else if(fragmentObj[i].frgType == 'ACT'){
                    //asagidaki kismi treeden bilgi cekerken kullanacagim.
                    /*console.log('treedeki eleman');
                    var frg = fragmentObj[i];
                    var curID = fragmentObj[i].strtID;
                    tree.contains(function(frg){
                        console.log('my tree');
                        if(frg.data.strtID == curID){
                            console.log('dogru nodea geldik: ');
                            console.log(frg);
                            parentStartID = frg.parent.data.strtID;
                            parentPathNum = frg.parent.data.curPathNum;
                            console.log('anne index: '+parentStartID+' anne hangi kolda: '+parentPathNum);
                        }
                    }, tree.traverseBF);
                    //console.log(tree._root.children);
                    return parentPathNum;*/
                    return fragmentObj[i].curPathNum;
            }else{//ornegin onceki object startevent ise
                return 0;
            }
        }
    }
}

function findCurPathNumBasedOnPrevObjInSeq(nextObject, i){
    var prevObjintheSeq = nextObject.get('incoming')[0].sourceRef;
    var pathNumActivity;
    //Once pathnum'u hesaplayacagiz. 
    //Onceki eleman diverging ise pathnum'u i'den al: 
    console.log('seqta aldigimiz prev object: ');
    console.log(prevObjintheSeq);
    if((prevObjintheSeq.$type == 'bpmn:ExclusiveGateway' || prevObjintheSeq.$type == 'bpmn:ParallelGateway') && prevObjintheSeq.gatewayDirection == "Diverging"){
        console.log('prev object diverging imis');
        pathNumActivity = i;
        console.log('mevcut objenin bulundugu kol: '+pathNumActivity);
    }//onceki activity ise onun pathnumu neyse onu atayacagiz
    else{//onceki baska aktivite ya da converging xor ise
        //Bir once isledigimiz objenin icinde bulundugu fragmentin current path numunu bulmamiz lazim. 
        pathNumActivity = findPrevObjCurPathNum(prevObjintheSeq.id);
        console.log('prev objectin bulundugu kol: '+pathNumActivity);
    }
    return pathNumActivity;
}