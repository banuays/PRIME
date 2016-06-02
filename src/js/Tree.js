//--------------------------
//Tree definition
function Node(data) {
    this.data = data;
    this.parent = null;
    this.children = [];
}
function Tree(data) {
    var node = new Node(data);
    this._root = node;
}

module.exports.Tree = Tree;

//traverse depth first
Tree.prototype.traverseDF = function(callback) {
    // this is a recurse and immediately-invoking function 
    (function recurse(currentNode) {
        // step 2
        for (var i = 0, length = currentNode.children.length; i < length; i++) {
            // step 3
            recurse(currentNode.children[i]);
        }
         // step 4
        callback(currentNode);
        // step 1
    })(this._root);
};
//traverse breadth first
Tree.prototype.traverseBF = function(callback) {
    var queue = new Queue();
    queue.enqueue(this._root);
    currentTree = queue.dequeue();
    while(currentTree){
        for (var i = 0, length = currentTree.children.length; i < length; i++) {
            queue.enqueue(currentTree.children[i]);
        }
        callback(currentTree);
        currentTree = queue.dequeue();
    }
};
function Queue() {
    this._oldestIndex = 1;
    this._newestIndex = 1;
    this._storage = {};
}
Queue.prototype.enqueue = function(data) {
    this._storage[this._newestIndex] = data;
    this._newestIndex++;
};
Queue.prototype.dequeue = function() {
    var oldestIndex = this._oldestIndex,
        deletedData = this._storage[oldestIndex];
 
    delete this._storage[oldestIndex];
    this._oldestIndex++;
 
    return deletedData;
};

//Search for a particular value in the tree
Tree.prototype.contains = function(callback, traversal) {
    traversal.call(this, callback);
};

//Add new node
Tree.prototype.add = function(data, toData, traversal) {
    var child = new Node(data),
        parent = null,
        callback = function(node) {
            if (node.data === toData) {
                parent = node;
            }
        };
    this.contains(callback, traversal);
    if (parent) {
        parent.children.push(child);
        child.parent = parent;
    } else {
        throw new Error('Cannot add node to a non-existent parent.');
    }
};
//Remove node
Tree.prototype.remove = function(data, fromData, traversal) {
    var tree = this,
        parent = null,
        childToRemove = null,
        index;
    var callback = function(node) {
        if (node.data === fromData) {
            parent = node;
        }
    };
    this.contains(callback, traversal);
    if (parent) {
        index = findIndex(parent.children, data);
        if (index === undefined) {
            throw new Error('Node to remove does not exist.');
        } else {
            childToRemove = parent.children.splice(index, 1);
        }
    } else {
        throw new Error('Parent does not exist.');
    }
    return childToRemove;
};
//find index of given data
function findIndex(arr, data) {
    var index;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].data === data) {
            index = i;
        }
    }
    return index;
}

//examples: 
//create new tree
//push new nodes to tree
//tree.add('VP of Happiness', 'CEO', tree.traverseBF);
//end of tree definition
